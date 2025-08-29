import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/session/manager';
import { sessionAuth } from '@/lib/auth/session-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/sessions - Get all active sessions for current user
 */
export async function GET((_request: NextRequest) {
  try {
    // Get current session
    const sessionData = await sessionManager.getSession(request);
    if (!sessionData) {
      return NextResponse.json(
        { _error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get all user sessions
    const sessions = await sessionAuth.getUserSessions(sessionData.userId);
    
    // Mark current session
    const cookieHeader = request.headers.get('cookie');
    const currentSessionId = sessionManager['sessionService'].parseSessionCookie(cookieHeader);
    
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      current: session.sessionId === currentSessionId,
    }));

    return NextResponse.json({
      success: true,
      data: {
        sessions: sessionsWithCurrent,
        total: sessions.length,
      },
    });
  } catch (_error: any) {
    console.error('Get sessions _error:', error);
    return NextResponse.json(
      { 
        success: false,
        _error: error.message || 'Failed to get sessions' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/sessions - Terminate a specific session or all sessions
 */
export async function DELETE((_request: NextRequest) {
  try {
    // Get current session
    const sessionData = await sessionManager.getSession(request);
    if (!sessionData) {
      return NextResponse.json(
        { _error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Terminate all sessions except current
      const cookieHeader = request.headers.get('cookie');
      const currentSessionId = sessionManager['sessionService'].parseSessionCookie(cookieHeader);
      
      const sessions = await sessionManager.getUserSessions(sessionData.userId);
      let terminated = 0;
      
      for (const session of sessions) {
        if (session.sessionId !== currentSessionId) {
          await sessionManager.deleteSession(session.sessionId);
          terminated++;
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          terminated,
          message: `Terminated ${terminated} session(s)`,
        },
      });
    } else if (sessionId) {
      // Terminate specific session
      await sessionAuth.terminateSession(sessionData.userId, sessionId);
      
      return NextResponse.json({
        success: true,
        data: {
          message: 'Session terminated',
        },
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          _error: 'Session ID required' 
        },
        { status: 400 }
      );
    }
  } catch (_error: any) {
    console.error('Delete session _error:', error);
    return NextResponse.json(
      { 
        success: false,
        _error: error.message || 'Failed to terminate session' 
      },
      { status: 500 }
    );
  }
}