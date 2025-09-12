import { sessionManager } from '@/lib/session/manager';
import { authService } from './service';
import type { AuthResponse, Session } from '@/types/auth';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

/**
 * Session-based authentication service
 * Replaces JWT tokens with server-side sessions
 */
export class SessionAuthService {
  /**
   * Sign in with session creation
   */
  async signIn(
    email: string,
    password: string,
    request?: NextRequest
  ): Promise<AuthResponse & { sessionId?: string; requiresMFA?: boolean; challengeId?: string }> {
    // Authenticate user
    console.log('🔐 About to call authService.signIn...');
    const authResult = await authService.signIn(email, password);
    console.log('🔐 authService.signIn completed, user:', authResult.user.id, 'requiresMFA:', !!authResult.requiresMFA);

    // If MFA is required, don't create session yet
    if (authResult.requiresMFA) {
      console.log('🔒 MFA required, skipping login status update until MFA completion');
      return authResult;
    }

    console.log('📝 About to update user login status for user:', authResult.user.id);
    // Update last_login and status (pending -> active) in app_users table
    await this.updateUserLoginStatus(authResult.user.id);
    console.log('✅ Completed user login status update');

    // Create session
    const { sessionId } = await sessionManager.createSession({
      userId: authResult.user.id,
      organizationId: authResult.session?.current_organization?.id,
      permissions: authResult.session?.permissions.map(p => `${p.resource}:${p.action}`) || [],
      mfaVerified: true, // Already verified during sign-in
      ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      userAgent: request?.headers.get('user-agent') || undefined,
    });

    return {
      ...authResult,
      sessionId,
    };
  }

  /**
   * Complete MFA verification and create session
   */
  async completeMFAVerification(
    userId: string,
    challengeId: string,
    request?: NextRequest
  ): Promise<{ session: Session; sessionId: string }> {
    // Get user session data
    const session = await authService.getSession();
    if (!session) {
      throw new Error('Failed to get user session');
    }

    // Update last_login and status (pending -> active) in app_users table
    await this.updateUserLoginStatus(userId);

    // Create server session
    const { sessionId } = await sessionManager.createSession({
      userId,
      organizationId: session.current_organization?.id,
      permissions: session.permissions.map(p => `${p.resource}:${p.action}`),
      mfaVerified: true,
      ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      userAgent: request?.headers.get('user-agent') || undefined,
    });

    return {
      session,
      sessionId,
    };
  }

  /**
   * Get current session
   */
  async getSession(request: NextRequest): Promise<Session | null> {
    const sessionData = await sessionManager.getSession(request);
    if (!sessionData) return null;

    // Convert session data to auth session format
    // This would typically fetch additional data from database
    const userSession = await authService.getSession();
    return userSession;
  }

  /**
   * Sign out and destroy session
   */
  async signOut(request: NextRequest, response: NextResponse): Promise<void> {
    const cookieHeader = request.headers.get('cookie');
    const sessionId = sessionManager['sessionService'].parseSessionCookie(cookieHeader);
    
    if (sessionId) {
      await sessionManager.deleteSession(sessionId, response);
    }

    // Also sign out from Supabase
    await authService.signOut();
  }

  /**
   * Refresh session expiration
   */
  async refreshSession(request: NextRequest): Promise<boolean> {
    const sessionData = await sessionManager.getSession(request);
    if (!sessionData) return false;

    const cookieHeader = request.headers.get('cookie');
    const sessionId = sessionManager['sessionService'].parseSessionCookie(cookieHeader);
    
    if (!sessionId) return false;

    return sessionManager['sessionService'].refreshSession(sessionId);
  }

  /**
   * Invalidate all sessions for a user (useful after password change)
   */
  async invalidateUserSessions(userId: string): Promise<number> {
    return sessionManager.deleteUserSessions(userId);
  }

  /**
   * Get all active sessions for current user
   */
  async getUserSessions(userId: string) {
    const sessions = await sessionManager.getUserSessions(userId);
    
    return sessions.map(session => ({
      sessionId: session.sessionId,
      device: session.userAgent || 'Unknown device',
      ipAddress: session.ipAddress || 'Unknown',
      lastActive: session.lastAccessedAt,
      created: session.createdAt,
      expires: session.expiresAt,
      current: false, // Would need to check against current session
    }));
  }

  /**
   * Terminate a specific session
   */
  async terminateSession(userId: string, sessionId: string): Promise<void> {
    // Verify the session belongs to the user
    const session = await sessionManager['sessionService'].getSession(sessionId);
    if (session && session.userId === userId) {
      await sessionManager.deleteSession(sessionId);
    }
  }

  /**
   * Update user's last login and activate if pending
   */
  private async updateUserLoginStatus(userId: string): Promise<void> {
    console.log('🔥 UPDATEUSERLOGINSTATUS CALLED FOR USER:', userId);
    const { createClient: createServerClient } = await import('@/lib/supabase/server');
    const supabase = await createServerClient();
    
    try {
      console.log('🔄 Updating user login status for user:', userId);
      
      // Get current user status
      const { data: currentUser, error: selectError } = await supabase
        .from('app_users')
        .select('status')
        .eq('auth_user_id', userId)
        .single();

      if (selectError && selectError.code === 'PGRST116') {
        // User doesn't exist in app_users table, create them
        console.log('👤 Session-Auth: User not found in app_users, creating record...');
        
        const { error: insertError } = await supabase
          .from('app_users')
          .insert({
            auth_user_id: userId,
            name: 'User', // Will be updated when user profile is loaded
            email: '', // Will be updated when user profile is loaded
            role: 'viewer', // Default role
            status: 'active', // Set as active since they're logging in
            last_login: new Date().toISOString(),
          });

        if (insertError) {
          console.error('❌ Session-Auth: Error creating user record:', insertError);
        } else {
          console.log('✅ Session-Auth: Successfully created user record and updated login time');
        }
        return;
      } else if (selectError) {
        console.error('❌ Error fetching current user:', selectError);
        return;
      }

      console.log('👤 Current user status:', currentUser?.status);

      // Update last_login and change status from pending to active
      const updateData: { last_login: string; status?: string } = {
        last_login: new Date().toISOString()
      };

      // If user status is pending, change to active on first login
      if (currentUser?.status === 'pending') {
        updateData.status = 'active';
        console.log('🔄 Changing status from pending to active');
      }

      console.log('💾 Updating with data:', updateData);

      const { error: updateError } = await supabase
        .from('app_users')
        .update(updateData)
        .eq('auth_user_id', userId);

      if (updateError) {
        console.error('❌ Error updating user login status:', updateError);
      } else {
        console.log('✅ Successfully updated user login status');
      }

    } catch (error) {
      console.error('Failed to update user login status:', error);
      // Don't throw - login should still succeed even if status update fails
    }
  }
}

// Export singleton instance
export const sessionAuth = new SessionAuthService();