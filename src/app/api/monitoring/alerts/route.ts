import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring/service';
import { createMonitoredHandler } from '@/lib/monitoring/middleware';
import { requireAuth } from '@/lib/auth/middleware';
import { AlertRule } from '@/lib/monitoring/types';

export const GET = createMonitoredHandler(async (request: NextRequest) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['account_owner', 'sustainability_lead']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const dashboard = await monitoringService.getDashboard();
    
    return NextResponse.json({ alerts: dashboard.alerts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get alerts' },
      { status: 500 }
    );
  }
});

export const POST = createMonitoredHandler(async (request: NextRequest) => {
  try {
    // Check authentication
    const authResult = await requireAuth(request, ['account_owner']);
    if (!authResult.authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const rule: AlertRule = {
      id: crypto.randomUUID(),
      name: body.name,
      description: body.description,
      metric: body.metric,
      condition: body.condition,
      threshold: body.threshold,
      duration: body.duration,
      severity: body.severity,
      channels: body.channels || [],
      enabled: body.enabled !== false,
      metadata: body.metadata,
    };

    await monitoringService.setAlertRule(rule);
    
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create alert rule' },
      { status: 500 }
    );
  }
});