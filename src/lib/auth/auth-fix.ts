import { createClient } from '@/lib/supabase/server';

/**
 * Ensures a user profile exists for the given user ID.
 * This handles cases where the trigger might have failed.
 */
export async function ensureUserProfile(userId: string, email?: string, metadata?: any) {
  const supabase = createClient();
  
  // First check if profile already exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (existingProfile) {
    return { profile: existingProfile, created: false };
  }
  
  // Profile doesn't exist, create it
  const { data: newProfile, error: createError } = await supabase
    .from('user_profiles')
    .insert({
      id: userId,
      email: email || '',
      full_name: metadata?.full_name || email?.split('@')[0] || 'User',
      onboarding_completed: false,
      metadata: metadata || {},
      preferred_language: metadata?.preferred_language || 'en',
      timezone: metadata?.timezone || 'UTC',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (createError) {
    console.error('Failed to create user profile:', createError);
    throw new Error(`Failed to create user profile: ${createError.message}`);
  }
  
  return { profile: newProfile, created: true };
}

/**
 * Validates that all required user data exists and is consistent
 */
export async function validateUserIntegrity(userId: string) {
  const supabase = createClient();
  
  const checks = {
    hasAuthUser: false,
    hasProfile: false,
    hasOrganization: false,
    profileComplete: false,
  };
  
  // Check auth user exists
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (user && user.id === userId && !authError) {
    checks.hasAuthUser = true;
  }
  
  // Check profile exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profile) {
    checks.hasProfile = true;
    checks.profileComplete = !!(
      profile.email &&
      profile.full_name &&
      profile.metadata &&
      profile.preferred_language &&
      profile.timezone
    );
  }
  
  // Check organization membership
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .single();
    
  if (membership) {
    checks.hasOrganization = true;
  }
  
  return checks;
}

/**
 * Repairs user data integrity issues
 */
export async function repairUserData(userId: string, email: string) {
  const supabase = createClient();
  const issues = [];
  
  try {
    // Ensure profile exists
    const { created } = await ensureUserProfile(userId, email);
    if (created) {
      issues.push('Created missing user profile');
    }
    
    // Check for organization
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId);
      
    if (!memberships || memberships.length === 0) {
      // User has no organization, this is okay for new users
      issues.push('User has no organization (normal for new users)');
    }
    
    return {
      success: true,
      issues,
      repaired: issues.length > 0,
    };
  } catch (error) {
    console.error('Failed to repair user data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      issues,
    };
  }
}