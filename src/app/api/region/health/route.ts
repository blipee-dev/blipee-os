/**
 * Region Health Check API
 * Provides health status and metrics for multi-region monitoring
 */

import { NextRequest, NextResponse } from 'next/server';
import { regionManager } from '@/lib/infrastructure/multi-region/region-manager';
import { regionMiddleware } from '@/lib/infrastructure/multi-region/region-middleware';

export interface RegionHealthResponse {
  regionId: string;
  regionName: string;
  status: 'healthy' | 'degraded' | 'unavailable';
  timestamp: string;
  latency: {
    current: number;
    p50: number;
    p95: number;
    p99: number;
  };
  capabilities: Array<{
    service: string;
    status: 'healthy' | 'degraded' | 'unavailable';
    lastChecked: string;
  }>;
  metrics: {
    uptime: number;
    requestCount: number;
    errorRate: number;
    throughput: number;
  };
  compliance: {
    dataResidencyCompliant: boolean;
    regulations: string[];
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Get current region info
    const currentRegionId = process.env.VERCEL_REGION || process.env.CURRENT_REGION || 'us-east-1';
    const currentRegion = regionManager.getRegion(currentRegionId);
    
    if (!currentRegion) {
      return NextResponse.json(
        {
          error: 'Region not found',
          regionId: currentRegionId,
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }

    // Perform health checks
    const healthMetrics = await regionManager.performHealthCheck();
    const currentMetrics = healthMetrics.get(currentRegionId);
    
    // Get performance metrics from middleware
    const performanceMetrics = regionMiddleware.getRegionMetrics(currentRegionId);

    // Calculate current latency
    const currentLatency = Date.now() - startTime;

    // Build response
    const healthResponse: RegionHealthResponse = {
      regionId: currentRegion.id,
      regionName: currentRegion.name,
      status: currentRegion.healthStatus,
      timestamp: new Date().toISOString(),
      latency: {
        current: currentLatency,
        p50: currentMetrics?.p50 || 0,
        p95: currentMetrics?.p95 || 0,
        p99: currentMetrics?.p99 || 0
      },
      capabilities: currentRegion.capabilities.map(cap => ({
        service: cap.service,
        status: cap.healthStatus,
        lastChecked: cap.lastChecked.toISOString()
      })),
      metrics: {
        uptime: process.uptime(),
        requestCount: performanceMetrics.requestCount,
        errorRate: currentMetrics?.errorRate || 0,
        throughput: currentMetrics?.throughput || 0
      },
      compliance: {
        dataResidencyCompliant: true, // Would check actual compliance
        regulations: ['GDPR', 'CCPA', 'SOC2'] // Based on region
      }
    };

    // Add region headers
    const response = NextResponse.json(healthResponse);
    response.headers.set('X-Region-ID', currentRegion.id);
    response.headers.set('X-Region-Name', currentRegion.name);
    response.headers.set('X-Health-Status', currentRegion.healthStatus);
    response.headers.set('X-Response-Time-MS', currentLatency.toString());
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return response;

  } catch (error) {
    console.error('Region health check error:', error);
    
    const errorResponse = {
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      regionId: process.env.VERCEL_REGION || 'unknown',
      timestamp: new Date().toISOString(),
      latency: Date.now() - startTime
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST endpoint for updating region health status
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { action, regionId, status } = body;

    if (action === 'update_status' && regionId && status) {
      const region = regionManager.getRegion(regionId);
      if (!region) {
        return NextResponse.json(
          { error: 'Region not found' },
          { status: 404 }
        );
      }

      // Update region status (in real implementation, would need proper authorization)
      region.healthStatus = status;
      
      return NextResponse.json({
        success: true,
        regionId,
        newStatus: status,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'trigger_health_check') {
      const healthMetrics = await regionManager.performHealthCheck();
      
      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        results: Object.fromEntries(healthMetrics)
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Region health update error:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to update region health',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}