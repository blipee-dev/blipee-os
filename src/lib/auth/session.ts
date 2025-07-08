import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

/**
 * Get the current authenticated user from the request
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const supabase = createClient();
    
    // Get session from cookies
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * Get session information from request
 */
export async function getSession(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getCurrentUser(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  return user;
}