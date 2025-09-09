import { sessionManager } from '@/lib/session/manager';
import { authService } from './service';
import type { AuthResponse, Session } from '@/types/auth';
import { NextRequest, NextResponse } from 'next/server';

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
    const authResult = await authService.signIn(email, password);

    // If MFA is required, don't create session yet
    if (authResult.requiresMFA) {
      return authResult;
    }

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
    const sessionData = await sessionManager.getSession(_request);
    if (!sessionData) return false;

    const cookieHeader = _request.headers.get('cookie');
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
}

// Export singleton instance
export const sessionAuth = new SessionAuthService();