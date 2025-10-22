import { createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export interface Session {
  id: string;
  user_id: string;
  session_token: string;
  expires_at: string;
  created_at: string;
  last_active_at: string;
  user_agent?: string;
  ip_address?: string;
}

/**
 * Generate a cryptographically secure session token
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  options: {
    userAgent?: string;
    ipAddress?: string;
    expiresInDays?: number;
  } = {}
): Promise<Session> {
  const supabase = createAdminClient();
  const sessionToken = generateSessionToken();
  const expiresInDays = options.expiresInDays || 30; // 30 days default
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      user_agent: options.userAgent,
      ip_address: options.ipAddress,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create session:', error);
    throw new Error('Failed to create session');
  }

  return data;
}

/**
 * Validate a session token and return the session if valid
 */
export async function validateSession(sessionToken: string): Promise<Session | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  // Update last_active_at
  await supabase
    .from('sessions')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', data.id);

  return data;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(sessionToken: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('sessions')
    .delete()
    .eq('session_token', sessionToken);
}

/**
 * Delete all sessions for a user (logout from all devices)
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('sessions')
    .delete()
    .eq('user_id', userId);
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .gt('expires_at', new Date().toISOString())
    .order('last_active_at', { ascending: false });

  if (error) {
    console.error('Failed to get user sessions:', error);
    return [];
  }

  return data || [];
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('sessions')
    .delete()
    .lt('expires_at', new Date().toISOString());
}
