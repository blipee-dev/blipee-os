import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring/service';
import { createMonitoredHandler } from '@/lib/monitoring/middleware';
import { requireAuth } from '@/lib/auth/middleware';

export const DELETE = createMonitoredHandler(async (
  _request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check authentication
    const authResult = await requireAuth(_request, ['account_owner']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await monitoringService.deleteAlertRule(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { _error: error instanceof Error ? error.message : 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
});