import { NextRequest, NextResponse } from 'next/server';
import { getSystemHealth } from '@/lib/monitoring/health';
import { createMonitoredHandler } from '@/lib/monitoring/middleware';

export const GET = createMonitoredHandler(async (_(_request: NextRequest) => {
  try {
    const health = await getSystemHealth();
    
    // Return appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        _error: error instanceof Error ? error.message : 'Health check failed',
      },
      { status: 503 }
    );
  }
});