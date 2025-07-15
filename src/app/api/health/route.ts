import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/monitoring/health-check';
import { telemetry } from '@/lib/monitoring/telemetry';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Initialize telemetry if not already done
    await telemetry.initialize();

    // Perform health check
    const health = await healthCheck.checkHealth();

    // Record the health check request
    healthCheck.recordRequest(Date.now() - startTime);
    
    // Record metric
    telemetry.recordAPIRequest(
      '/api/health',
      'GET',
      Date.now() - startTime,
      health.status === 'healthy' ? 200 : 503
    );

    // Return appropriate status code based on health
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: (error as Error).message,
      checks: {
        database: { status: 'fail', message: 'Unable to perform check' },
        agents: { status: 'fail', message: 'Unable to perform check' },
        mlModels: { status: 'fail', message: 'Unable to perform check' },
        externalAPIs: { status: 'fail', message: 'Unable to perform check' },
        network: { status: 'fail', message: 'Unable to perform check' }
      }
    }, { status: 503 });
  }
}
