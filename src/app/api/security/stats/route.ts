import { NextRequest, NextResponse } from 'next/server';
import { getDDoSProtection } from '@/lib/security/ddos/protection';
import { getRateLimitService } from '@/lib/security/rate-limit/service';
import { sessionManager } from '@/lib/session/manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view security stats
    const sessionCookie = request.cookies.get('blipee-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await sessionManager.validateSession(request, ['security:view']);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get DDoS stats
    const ddosProtection = getDDoSProtection();
    const ddosStats = ddosProtection.getStats();

    // Get session stats
    const sessionStats = await sessionManager['sessionService'].getSessionStats();

    // Get rate limit stats (simplified for now)
    const rateLimitStats = {
      totalRequests: 0, // Would need to track this
      blockedRequests: 0, // Would need to track this
      topOffenders: [], // Would need to track this
    };

    return NextResponse.json({
      rateLimit: rateLimitStats,
      ddos: ddosStats,
      sessions: {
        activeSessions: sessionStats.activeSessions,
        totalUsers: sessionStats.userCount,
        recentFailedLogins: 0, // Would need to track this
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security stats' },
      { status: 500 }
    );
  }
}