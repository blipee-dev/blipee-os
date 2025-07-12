import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const checks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: false,
        api: true,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    // Check database connection
    try {
      const dbHealthy = await db.healthCheck();
      checks.checks.database = dbHealthy;
    } catch (error) {
      checks.status = 'degraded';
      checks.checks.database = false;
    }

    // Overall status
    if (!checks.checks.database) {
      checks.status = 'unhealthy';
    }

    return NextResponse.json(checks, {
      status: checks.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    logger.error('Health check error', { error });
    return NextResponse.json(
      {
        status: 'error',
        message: 'Health check failed',
      },
      { status: 500 }
    );
  }
}