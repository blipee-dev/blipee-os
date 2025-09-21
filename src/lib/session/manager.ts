import { SessionService, SessionData, SessionConfig } from './service';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Singleton session manager for Next.js
 */
class SessionManager {
  private static instance: SessionManager;
  private sessionService: SessionService;

  private constructor() {
    this.sessionService = new SessionService({
      // Temporarily disable Redis to force in-memory storage for debugging
      redis: undefined,
      sessionTTL: parseInt(process.env.SESSION_TTL || '28800'), // 8 hours
      slidingExpiration: process.env.SESSION_SLIDING !== 'false',
      cookieName: 'blipee-session',
      cookieOptions: {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        domain: process.env.COOKIE_DOMAIN,
        path: '/',
      },
    });

    // Schedule periodic cleanup of expired sessions
    if (process.env['NODE_ENV'] !== 'test') {
      setInterval(() => {
        this.sessionService.cleanupExpiredSessions().catch(console.error);
      }, 60 * 60 * 1000); // Every hour
    }
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      console.log('🏗️  Creating new SessionManager instance');
      SessionManager.instance = new SessionManager();
    } else {
      console.log('♻️  Reusing existing SessionManager instance');
    }
    return SessionManager.instance;
  }

  /**
   * Create a new session (for API routes)
   */
  async createSession(
    data: Omit<SessionData, 'createdAt' | 'lastAccessedAt' | 'expiresAt'>,
    response?: NextResponse
  ): Promise<{ sessionId: string; cookieHeader: string }> {
    const sessionId = await this.sessionService.createSession(data);
    const cookieHeader = this.sessionService.generateCookieHeader(sessionId);

    // Set cookie if response is provided
    if (response) {
      response.headers.set('Set-Cookie', cookieHeader);
    }

    return { sessionId, cookieHeader };
  }

  /**
   * Get session from request
   */
  async getSession(request: NextRequest): Promise<SessionData | null> {
    const cookieHeader = request.headers.get('cookie');
    const sessionId = this.sessionService.parseSessionCookie(cookieHeader);
    
    if (!sessionId) return null;
    
    return this.sessionService.getSession(sessionId);
  }

  /**
   * Get session from cookies (for server components)
   */
  async getSessionFromCookies(): Promise<SessionData | null> {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('blipee-session')?.value;

    console.log('🔍 SessionManager.getSessionFromCookies:', { sessionId });

    if (!sessionId) return null;

    const session = await this.sessionService.getSession(sessionId);
    console.log('🔍 Session lookup result:', { found: !!session, sessionId });
    return session;
  }

  /**
   * Update session
   */
  async updateSession(
    sessionId: string,
    updates: Partial<SessionData>
  ): Promise<boolean> {
    return this.sessionService.updateSession(sessionId, updates);
  }

  /**
   * Delete session (logout)
   */
  async deleteSession(
    sessionId: string,
    response?: NextResponse
  ): Promise<void> {
    await this.sessionService.deleteSession(sessionId);

    // Clear cookie if response is provided
    if (response) {
      response.headers.set('Set-Cookie', this.sessionService.generateLogoutCookieHeader());
    }
  }

  /**
   * Delete all sessions for a user
   */
  async deleteUserSessions(userId: string): Promise<number> {
    return this.sessionService.deleteUserSessions(userId);
  }

  /**
   * Get all sessions for a user
   */
  async getUserSessions(userId: string): Promise<Array<SessionData & { sessionId: string }>> {
    return this.sessionService.getUserSessions(userId);
  }

  /**
   * Validate session with permissions
   */
  async validateSession(
    request: NextRequest,
    requiredPermissions?: string[]
  ): Promise<{ valid: boolean; session?: SessionData; reason?: string }> {
    const session = await this.getSession(request);
    if (!session) {
      return { valid: false, reason: 'No session found' };
    }

    const cookieHeader = request.headers.get('cookie');
    const sessionId = this.sessionService.parseSessionCookie(cookieHeader);
    
    return this.sessionService.validateSession(sessionId!, requiredPermissions);
  }

  /**
   * Middleware for session validation
   */
  async middleware(
    request: NextRequest,
    requiredPermissions?: string[]
  ): Promise<NextResponse | null> {
    const validation = await this.validateSession(request, requiredPermissions);

    if (!validation.valid) {
      // Redirect to login or return 401
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: validation.reason },
          { status: 401 }
        );
      } else {
        const url = new URL('/signin', request.url);
        url.searchParams.set('redirect', request.nextUrl.pathname);
        if (validation.reason) {
          url.searchParams.set('reason', validation.reason);
        }
        return NextResponse.redirect(url);
      }
    }

    // Session is valid, continue
    return null;
  }

  /**
   * Get session statistics
   */
  async getStats() {
    return this.sessionService.getSessionStats();
  }

  /**
   * Clean up expired sessions manually
   */
  async cleanup(): Promise<number> {
    return this.sessionService.cleanupExpiredSessions();
  }
}

// Export singleton instance with debug logging
console.log('📦 Creating SessionManager singleton instance');
export const sessionManager = SessionManager.getInstance();

// Export types
export type { SessionData, SessionConfig } from './service';