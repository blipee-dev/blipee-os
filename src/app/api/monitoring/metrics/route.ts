import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring/service';
import { createMonitoredHandler } from '@/lib/monitoring/middleware';
import { requireAuth } from '@/lib/auth/middleware';

export const GET = createMonitoredHandler(async (request: NextRequest) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['account_owner', 'sustainability_manager']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const metricName = searchParams.get('name');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    
    if (!metricName) {
      return NextResponse.json(
        { error: 'Metric name is required' },
        { status: 400 }
      );
    }
    
    // Parse labels from query params
    const labels: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('label.')) {
        labels[key.substring(6)] = value;
      }
    });
    
    const metrics = monitoringService.getMetrics(
      metricName,
      Object.keys(labels).length > 0 ? labels : undefined,
      startTime ? new Date(startTime) : undefined,
      endTime ? new Date(endTime) : undefined
    );
    
    return NextResponse.json({ metrics });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get metrics' },
      { status: 500 }
    );
  }
});