import { NextRequest, NextResponse } from 'next/server';
import { getRecoveryService } from '@/lib/auth/recovery/service';
import { sessionManager } from '@/lib/session/manager';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  try {
    // Check authentication and admin permissions
    const sessionCookie = _request.cookies.get('blipee-session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const validation = await sessionManager.validateSession(_request, ['recovery:view_stats']);
    if (!validation.valid) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get organization ID from query params or session
    const searchParams = _request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId') || validation.session?.organizationId;

    // Get recovery service and stats
    const recoveryService = getRecoveryService();
    const stats = await recoveryService.getRecoveryStats(organizationId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error('Recovery stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch recovery statistics',
      },
      { status: 500 }
    );
  }
}