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
    try {
      // Authenticate user
      console.log('🔐 About to call authService.signIn...');
      const authResult = await authService.signIn(email, password);

      console.log('🔐 authResult received:', {
        hasResult: !!authResult,
        hasUser: !!authResult?.user,
        userId: authResult?.user?.id,
        requiresMFA: authResult?.requiresMFA,
        hasSession: !!authResult?.session
      });

      // Check if we got a valid result
      if (!authResult || !authResult.user) {
        console.error('❌ Invalid auth result:', authResult);
        throw new Error('Authentication failed - invalid credentials');
      }

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
    } catch (error) {
      console.error('🔴 Sign-in error:', error);
      // Re-throw with more context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Authentication failed');
    }
  }

  /**
   * Complete MFA verification and create session
   */
  async completeMFA(
    challengeId: string,
    code: string,
    userId: string,
    request?: NextRequest
  ): Promise<AuthResponse & { sessionId?: string }> {
    const { MFAService } = await import('@/lib/auth/mfa/service');
    const mfaService = new MFAService();

    // Verify MFA code
    const isValid = await mfaService.verifyChallenge(challengeId, code, userId);
    if (!isValid) {
      throw new Error('Invalid MFA code');
    }

    console.log('📝 MFA verified, updating user login status for user:', userId);
    // Update last_login and status (pending -> active) in app_users table
    await this.updateUserLoginStatus(userId);
    console.log('✅ Completed user login status update after MFA');

    // Get user session
    const session = await authService.getSession();
    if (!session) {
      throw new Error('Failed to get session after MFA');
    }

    // Create session
    const { sessionId } = await sessionManager.createSession({
      userId,
      organizationId: session.current_organization?.id,
      permissions: session.permissions.map(p => `${p.resource}:${p.action}`),
      mfaVerified: true,
      ipAddress: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip') || undefined,
      userAgent: request?.headers.get('user-agent') || undefined,
    });

    return {
      user: session.user,
      session,
      access_token: '',
      refresh_token: '',
      sessionId,
    };
  }

  /**
   * Sign out and destroy session
   */
  async signOut(sessionId: string): Promise<void> {
    await sessionManager.deleteSession(sessionId);
    await authService.signOut();
  }

  /**
   * Get session from ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    const sessionData = await sessionManager.getSession(sessionId);
    if (!sessionData) return null;

    // Get full session from auth service
    return authService.getSession();
  }

  /**
   * Update user login status in app_users table
   */
  private async updateUserLoginStatus(authUserId: string): Promise<void> {
    try {
      const supabase = createClient();

      // Check if user exists in app_users
      const { data: existingUser, error: fetchError } = await supabase
        .from('app_users')
        .select('id, status')
        .eq('auth_user_id', authUserId)
        .single();

      if (fetchError && fetchError.code === 'PGRST116') {
        // User doesn't exist in app_users, create them
        console.log('📝 Creating app_users record for auth user:', authUserId);

        // Get user details from auth
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { error: insertError } = await supabase
            .from('app_users')
            .insert({
              auth_user_id: authUserId,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              role: 'viewer', // Default role
              status: 'active',
              last_login: new Date().toISOString(),
            });

          if (insertError) {
            console.error('❌ Error creating app_users record:', insertError);
          } else {
            console.log('✅ Created app_users record');
          }
        }
      } else if (!fetchError && existingUser) {
        // Update existing user
        const updateData: any = {
          last_login: new Date().toISOString()
        };

        // Change status from pending to active on first login
        if (existingUser.status === 'pending') {
          updateData.status = 'active';
          console.log('🔄 Changing user status from pending to active');
        }

        const { error: updateError } = await supabase
          .from('app_users')
          .update(updateData)
          .eq('auth_user_id', authUserId);

        if (updateError) {
          console.error('❌ Error updating user login status:', updateError);
        } else {
          console.log('✅ Updated user login status');
        }
      }
    } catch (error) {
      console.error('❌ Error in updateUserLoginStatus:', error);
      // Don't throw - this is a non-critical update
    }
  }
}

// Export singleton instance
export const sessionAuth = new SessionAuthService();