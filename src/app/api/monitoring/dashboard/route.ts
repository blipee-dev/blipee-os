import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring/service';
import { createMonitoredHandler } from '@/lib/monitoring/middleware';
import { requireAuth } from '@/lib/auth/middleware';

export const GET = createMonitoredHandler(async ((_request: NextRequest) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['account_owner', 'sustainability_lead', 'facility_manager']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dashboard = await monitoringService.getDashboard();
    
    return NextResponse.json(dashboard);
  } catch (error) {
    return NextResponse.json(
      { _error: error instanceof Error ? error.message : 'Failed to get dashboard' },
      { status: 500 }
    );
  }
});