/**
 * Region Failover API
 * Manages failover operations and region switching
 */

import { NextRequest, NextResponse } from 'next/server';
import { regionManager } from '@/lib/infrastructure/multi-region/region-manager';
import { dataResidencyManager } from '@/lib/infrastructure/multi-region/data-residency';

export interface FailoverRequest {
  action: 'trigger_failover' | 'get_status' | 'test_failover' | 'configure';
  fromRegion?: string;
  toRegion?: string;
  reason?: string;
  config?: any;
}

export interface FailoverResponse {
  success: boolean;
  action: string;
  timestamp: string;
  fromRegion?: string;
  toRegion?: string;
  duration?: number;
  reason?: string;
  error?: string;
  failoverConfig?: any;
  healthStatus?: any;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: FailoverRequest = await request.json();
    const { action } = body;

    switch (action) {
      case 'trigger_failover':
        return await handleTriggerFailover(body, startTime);
      
      case 'get_status':
        return await handleGetStatus(body, startTime);
      
      case 'test_failover':
        return await handleTestFailover(body, startTime);
      
      case 'configure':
        return await handleConfigure(body, startTime);
      
      default:
        return NextResponse.json(
          {
            success: false,
            action: action || 'unknown',
            timestamp: new Date().toISOString(),
            error: 'Invalid action'
          } as FailoverResponse,
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Failover API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        action: 'unknown',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      } as FailoverResponse,
      { status: 500 }
    );
  }
}

/**
 * Trigger actual failover
 */
async function handleTriggerFailover(
  body: FailoverRequest, 
  startTime: number
): Promise<NextResponse> {
  const { fromRegion, reason } = body;
  
  if (!fromRegion) {
    return NextResponse.json(
      {
        success: false,
        action: 'trigger_failover',
        timestamp: new Date().toISOString(),
        error: 'fromRegion is required'
      } as FailoverResponse,
      { status: 400 }
    );
  }


  try {
    // Trigger failover
    const result = await regionManager.triggerFailover(
      fromRegion,
      reason || 'Manual failover trigger'
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          action: 'trigger_failover',
          timestamp: new Date().toISOString(),
          fromRegion,
          duration: Date.now() - startTime,
          error: result.error
        } as FailoverResponse,
        { status: 500 }
      );
    }

    // Log the failover

    return NextResponse.json({
      success: true,
      action: 'trigger_failover',
      timestamp: new Date().toISOString(),
      fromRegion,
      toRegion: result.newPrimaryRegion,
      duration: Date.now() - startTime,
      reason: reason || 'Manual failover trigger'
    } as FailoverResponse);

  } catch (error) {
    console.error(`❌ Failover failed: ${error}`);
    
    return NextResponse.json(
      {
        success: false,
        action: 'trigger_failover',
        timestamp: new Date().toISOString(),
        fromRegion,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Failover execution failed'
      } as FailoverResponse,
      { status: 500 }
    );
  }
}

/**
 * Get current failover status
 */
async function handleGetStatus(
  body: FailoverRequest,
  startTime: number
): Promise<NextResponse> {
  try {
    // Get all region health
    const healthMetrics = await regionManager.performHealthCheck();
    
    // Get current configuration
    const failoverConfig = regionManager.getFailoverConfig();
    
    // Get all regions
    const allRegions = regionManager.getAllRegions();
    
    // Build comprehensive status
    const status = {
      primaryRegion: failoverConfig.primaryRegion,
      secondaryRegions: failoverConfig.secondaryRegions,
      healthStatus: Object.fromEntries(
        allRegions.map(region => [
          region.id,
          {
            status: region.healthStatus,
            name: region.name,
            isPrimary: region.isPrimary,
            latencyThreshold: region.latencyThreshold,
            capabilities: region.capabilities
          }
        ])
      ),
      metrics: Object.fromEntries(healthMetrics),
      failoverConfig: {
        threshold: failoverConfig.failoverThreshold,
        maxFailoverTime: failoverConfig.maxFailoverTime,
        healthCheckInterval: failoverConfig.healthCheckInterval,
        enableAutoFailback: failoverConfig.enableAutoFailback
      }
    };

    return NextResponse.json({
      success: true,
      action: 'get_status',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      failoverConfig: status
    } as FailoverResponse);

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        action: 'get_status',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Failed to get status'
      } as FailoverResponse,
      { status: 500 }
    );
  }
}

/**
 * Test failover without actually switching
 */
async function handleTestFailover(
  body: FailoverRequest,
  startTime: number
): Promise<NextResponse> {
  const { fromRegion } = body;
  
  try {
    if (!fromRegion) {
      return NextResponse.json(
        {
          success: false,
          action: 'test_failover',
          timestamp: new Date().toISOString(),
          error: 'fromRegion is required'
        } as FailoverResponse,
        { status: 400 }
      );
    }

    // Get current config
    const failoverConfig = regionManager.getFailoverConfig();
    
    // Find available secondary regions
    const healthySecondaryRegions = failoverConfig.secondaryRegions
      .map(id => regionManager.getRegion(id))
      .filter(region => region && region.healthStatus === 'healthy');

    if (healthySecondaryRegions.length === 0) {
      return NextResponse.json({
        success: false,
        action: 'test_failover',
        timestamp: new Date().toISOString(),
        fromRegion,
        duration: Date.now() - startTime,
        error: 'No healthy secondary regions available for failover'
      } as FailoverResponse);
    }

    // Test connectivity to target region
    const targetRegion = healthySecondaryRegions[0]!;
    let testResult = 'unknown';
    
    try {
      // Simulate health check to target region
      const response = await fetch(`${targetRegion.endpoint}/api/region/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      testResult = response.ok ? 'healthy' : 'degraded';
    } catch {
      testResult = 'unavailable';
    }

    return NextResponse.json({
      success: true,
      action: 'test_failover',
      timestamp: new Date().toISOString(),
      fromRegion,
      toRegion: targetRegion.id,
      duration: Date.now() - startTime,
      healthStatus: {
        targetRegionId: targetRegion.id,
        targetRegionName: targetRegion.name,
        testResult,
        availableSecondaryRegions: healthySecondaryRegions.length
      }
    } as FailoverResponse);

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        action: 'test_failover',
        timestamp: new Date().toISOString(),
        fromRegion,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Test failover failed'
      } as FailoverResponse,
      { status: 500 }
    );
  }
}

/**
 * Configure failover settings
 */
async function handleConfigure(
  body: FailoverRequest,
  startTime: number
): Promise<NextResponse> {
  const { config } = body;
  
  try {
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          action: 'configure',
          timestamp: new Date().toISOString(),
          error: 'config is required'
        } as FailoverResponse,
        { status: 400 }
      );
    }

    // Update failover configuration
    regionManager.updateFailoverConfig(config);
    
    // Get updated config to confirm
    const updatedConfig = regionManager.getFailoverConfig();

    return NextResponse.json({
      success: true,
      action: 'configure',
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      failoverConfig: updatedConfig
    } as FailoverResponse);

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        action: 'configure',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Configuration failed'
      } as FailoverResponse,
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for quick status check
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const primaryRegion = regionManager.getPrimaryRegion();
    const allRegions = regionManager.getAllRegions();
    const failoverConfig = regionManager.getFailoverConfig();
    
    const quickStatus = {
      currentPrimaryRegion: primaryRegion?.id || 'unknown',
      totalRegions: allRegions.length,
      healthyRegions: allRegions.filter(r => r.healthStatus === 'healthy').length,
      degradedRegions: allRegions.filter(r => r.healthStatus === 'degraded').length,
      unavailableRegions: allRegions.filter(r => r.healthStatus === 'unavailable').length,
      failoverEnabled: failoverConfig.enableAutoFailback,
      lastHealthCheck: new Date().toISOString()
    };

    const response = NextResponse.json(quickStatus);
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    return response;

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get failover status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}