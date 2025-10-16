/**
 * Client-safe permission checking
 * Uses Supabase client to check user permissions
 */

import { createClient } from '@/lib/supabase/client';

export async function checkSuperAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createClient();

    // Check super_admins table
    const { data, error } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error in checkSuperAdmin:', error);
    return false;
  }
}

export async function getUserRole(userId: string): Promise<{ organizationId: string | null; role: string | null }> {
  try {
    const supabase = createClient();

    // First check app_users table - using the auth user ID from Supabase Auth
    const { data: appUser, error: appUserError } = await supabase
      .from('app_users')
      .select('organization_id, role')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (appUserError) {
    }

    if (appUser?.organization_id) {
      return {
        organizationId: appUser.organization_id,
        role: appUser.role
      };
    }

    // If not found, check user_access table
    const { data: userAccess, error: accessError } = await supabase
      .from('user_access')
      .select('resource_id, role')
      .eq('user_id', userId)
      .eq('resource_type', 'org')
      .limit(1)
      .maybeSingle();

    if (accessError) {
    }

    if (userAccess) {
      return {
        organizationId: userAccess.resource_id,
        role: userAccess.role
      };
    }

    // Check organization_members table as fallback
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (memberError) {
    }

    if (member) {
      return {
        organizationId: member.organization_id,
        role: member.role
      };
    }

    // No organization found
    return {
      organizationId: null,
      role: null
    };
  } catch (error) {
    console.error('Error getting user role:', error);
    return {
      organizationId: null,
      role: null
    };
  }
}