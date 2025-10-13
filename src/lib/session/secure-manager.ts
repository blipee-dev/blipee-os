import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { SessionService, SessionData } from './service';
import {
  SecureSession,
  createSecureSession,
  rotateSession,
  validateSessionSecurity,
  shouldRotateSession,
  detectHighRiskBehavior,
  SESSION_SECURITY,
} from '@/lib/security/session-security';

/**
 * Enhanced session manager with security features
 */
export class SecureSessionManager {
  private static instance: SecureSessionManager;
  private sessionService: SessionService;
  
  private constructor() {
    this.sessionService = new SessionService({
      // Disable Redis for now - use in-memory sessions
      // TODO: Implement Upstash Redis REST API support
      redis: undefined,
      sessionTTL: SESSION_SECURITY.MAX_LIFETIME / 1000, // Convert to seconds
      slidingExpiration: true,
      cookieName: 'blipee-session',
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', // Upgraded from 'lax' for better security
        domain: process.env.COOKIE_DOMAIN,
        path: '/',
        maxAge: SESSION_SECURITY.MAX_LIFETIME / 1000,
      },
    });

    // Periodic security tasks
    if (process.env.NODE_ENV !== 'test') {
      setInterval(() => {
        this.performSecurityMaintenance().catch(console.error);
      }, 15 * 60 * 1000); // Every 15 minutes
    }
  }

  static getInstance(): SecureSessionManager {
    if (!SecureSessionManager.instance) {
      SecureSessionManager.instance = new SecureSessionManager();
    }
    return SecureSessionManager.instance;
  }

  /**
   * Create a new secure session
   */
  async createSession(
    request: NextRequest,
    userId: string,
    options: {
      loginMethod: SecureSession['loginMethod'];
      permissions?: string[];
      organizationId?: string;
      isMfaVerified?: boolean;
    }
  ): Promise<{ sessionId: string; response: NextResponse }> {
    // Check concurrent session limit
    const userSessions = await this.getUserSessions(userId);
    if (userSessions.length >= SESSION_SECURITY.MAX_CONCURRENT_SESSIONS) {
      // Terminate oldest session
      const oldestSession = userSessions.sort((a, b) => a.createdAt - b.createdAt)[0];
      await this.terminateSession(oldestSession.id);
    }

    // Create secure session
    const session = createSecureSession(userId, request, options);
    
    // Store session
    await this.sessionService.set(session.id, session as any);
    
    // Create response with secure cookie
    const response = NextResponse.next();
    this.setSessionCookie(response, session.id);
    
    // Log session creation for audit
    await this.logSessionEvent('created', session);
    
    return { sessionId: session.id, response };
  }

  /**
   * Validate and retrieve session
   */
  async validateSession(
    request: NextRequest
  ): Promise<{ session?: SecureSession; response?: NextResponse }> {
    const sessionId = this.getSessionId(request);
    if (!sessionId) {
      return {};
    }

    // Get session from storage
    const sessionData = await this.sessionService.get(sessionId);
    if (!sessionData) {
      return {};
    }

    const session = sessionData as unknown as SecureSession;

    // Validate security constraints
    const validation = validateSessionSecurity(session, request);
    if (!validation.valid) {
      await this.terminateSession(sessionId);
      await this.logSessionEvent('terminated', session, validation.reason);
      return {};
    }

    // Check for high-risk behavior
    if (detectHighRiskBehavior(session, request)) {
      session.isHighRisk = true;
      await this.logSessionEvent('high_risk_detected', session);
    }

    // Check if rotation is needed
    if (shouldRotateSession(session)) {
      const rotatedSession = rotateSession(session, request);
      
      // Store new session
      await this.sessionService.set(rotatedSession.id, rotatedSession as any);
      
      // Delete old session
      await this.sessionService.delete(sessionId);
      
      // Create response with new session cookie
      const response = NextResponse.next();
      this.setSessionCookie(response, rotatedSession.id);
      
      await this.logSessionEvent('rotated', rotatedSession);
      
      return { session: rotatedSession, response };
    }

    // Update last activity
    session.lastActivity = Date.now();
    await this.sessionService.set(sessionId, session as any);

    return { session };
  }

  /**
   * Terminate a session
   */
  async terminateSession(sessionId: string): Promise<void> {
    const session = await this.sessionService.get(sessionId);
    if (session) {
      await this.sessionService.delete(sessionId);
      await this.logSessionEvent('terminated', session as any);
    }
  }

  /**
   * Terminate all sessions for a user
   */
  async terminateUserSessions(userId: string): Promise<void> {
    const sessions = await this.getUserSessions(userId);
    for (const session of sessions) {
      await this.terminateSession(session.id);
    }
  }

  /**
   * Get all active sessions for a user
   */
  async getUserSessions(userId: string): Promise<SecureSession[]> {
    const allSessions = await this.sessionService.list();
    return allSessions
      .filter((session: any) => session.userId === userId)
      .map(session => session as unknown as SecureSession);
  }

  /**
   * Verify MFA for session
   */
  async verifyMFA(sessionId: string): Promise<void> {
    const session = await this.sessionService.get(sessionId);
    if (session) {
      (session as any).isMfaVerified = true;
      await this.sessionService.set(sessionId, session);
      await this.logSessionEvent('mfa_verified', session as any);
    }
  }

  /**
   * Get session ID from request
   */
  private getSessionId(request: NextRequest): string | null {
    return request.cookies.get('blipee-session')?.value || null;
  }

  /**
   * Set session cookie
   */
  private setSessionCookie(response: NextResponse, sessionId: string): void {
    response.cookies.set('blipee-session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_SECURITY.MAX_LIFETIME / 1000,
      path: '/',
    });
  }

  /**
   * Log session events for security audit
   */
  private async logSessionEvent(
    event: string,
    session: SecureSession,
    details?: string
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      sessionId: session.id,
      userId: session.userId,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
      details,
    };

    // In production, send to security logging service
    console.log('[SESSION_SECURITY]', JSON.stringify(logEntry));
  }

  /**
   * Perform periodic security maintenance
   */
  private async performSecurityMaintenance(): Promise<void> {
    // Clean up expired sessions
    await this.sessionService.cleanupExpiredSessions();
    
    // Check for suspicious patterns
    const allSessions = await this.sessionService.list();
    const sessionsByIP = new Map<string, SecureSession[]>();
    
    for (const sessionData of allSessions) {
      const session = sessionData as unknown as SecureSession;
      const sessions = sessionsByIP.get(session.ipAddress) || [];
      sessions.push(session);
      sessionsByIP.set(session.ipAddress, sessions);
    }
    
    // Flag IPs with too many sessions
    for (const [ip, sessions] of sessionsByIP.entries()) {
      if (sessions.length > 10) {
        console.warn(`[SESSION_SECURITY] Suspicious activity: ${sessions.length} sessions from IP ${ip}`);
        // In production, trigger security alerts
      }
    }
  }
}

// Export singleton instance
export const secureSessionManager = SecureSessionManager.getInstance();