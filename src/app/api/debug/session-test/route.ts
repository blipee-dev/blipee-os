import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/session/manager';

export async function GET(request: NextRequest) {
  try {
    console.log('Session Test: Starting...');

    // Test creating a session
    const { sessionId } = await sessionManager.createSession({
      userId: 'test-user-123',
      organizationId: 'test-org-456',
      permissions: ['read', 'write'],
      mfaVerified: true,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    console.log('Session Test: Created session with ID:', sessionId);

    // Test retrieving the session directly from the service
    const sessionData = await sessionManager['sessionService'].getSession(sessionId);
    console.log('Session Test: Retrieved session:', sessionData);

    // Test session from cookies (should be null since we didn't set the cookie)
    const sessionFromCookies = await sessionManager.getSessionFromCookies();
    console.log('Session Test: Session from cookies:', sessionFromCookies);

    return NextResponse.json({
      success: true,
      sessionId,
      sessionData,
      sessionFromCookies,
      debug: {
        cookieNames: request.cookies.getAll().map(c => c.name),
        hasBlipeeSessionCookie: !!request.cookies.get('blipee-session')?.value
      }
    });
  } catch (error: any) {
    console.error('Session Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}