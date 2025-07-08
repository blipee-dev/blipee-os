import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring/service';
import { createMonitoredHandler } from '@/lib/monitoring/middleware';
import { requireAuth } from '@/lib/auth/middleware';

export const DELETE = createMonitoredHandler(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['account_owner']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await monitoringService.deleteAlertRule(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete alert rule' },
      { status: 500 }
    );
  }
});