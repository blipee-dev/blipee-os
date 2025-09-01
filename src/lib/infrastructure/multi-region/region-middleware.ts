/**
 * Multi-Region Middleware
 * Automatically routes requests to optimal regions and handles failover
 */

import { NextRequest, NextResponse } from 'next/server';
import { regionManager } from './region-manager';
import { dataResidencyManager } from './data-residency';

export interface RegionRoutingResult {
  regionId: string;
  latency: number;
  reasoning: string;
  complianceRules: string[];
  failoverApplied: boolean;
}

export interface RegionHeaders {
  'X-Region-ID': string;
  'X-Region-Name': string;
  'X-Latency-MS': string;
  'X-Failover-Applied': string;
  'X-Compliance-Rules': string;
  'X-Data-Residency': string;
}

/**
 * Region-aware middleware for request routing
 */
export class RegionMiddleware {
  private static instance: RegionMiddleware;
  private performanceMetrics: Map<string, number[]> = new Map();

  static getInstance(): RegionMiddleware {
    if (!RegionMiddleware.instance) {
      RegionMiddleware.instance = new RegionMiddleware();
    }
    return RegionMiddleware.instance;
  }

  /**
   * Main middleware function for region routing
   */
  async handleRequest(request: NextRequest): Promise<{
    response?: NextResponse;
    regionInfo: RegionRoutingResult;
    headers: Partial<RegionHeaders>;
  }> {
    const startTime = Date.now();

    try {
      // Extract client information
      const clientInfo = this.extractClientInfo(request);
      
      // Determine optimal region
      const regionResult = await this.determineOptimalRegion(request, clientInfo);
      
      // Check if we need to route to different region
      const currentRegion = this.getCurrentRegion();
      const shouldRoute = regionResult.regionId !== currentRegion;
      
      // Calculate latency
      const latency = Date.now() - startTime;
      this.recordLatency(regionResult.regionId, latency);

      // Prepare headers
      const headers: Partial<RegionHeaders> = {
        'X-Region-ID': regionResult.regionId,
        'X-Region-Name': regionManager.getRegion(regionResult.regionId)?.name || 'Unknown',
        'X-Latency-MS': latency.toString(),
        'X-Failover-Applied': regionResult.failoverApplied.toString(),
        'X-Compliance-Rules': regionResult.complianceRules.join(','),
        'X-Data-Residency': clientInfo.location || 'unknown'
      };

      // If we need to route to a different region, create redirect response
      let response: NextResponse | undefined;
      
      if (shouldRoute && this.shouldRedirectRequest(request)) {
        const targetRegion = regionManager.getRegion(regionResult.regionId);
        if (targetRegion && targetRegion.endpoint) {
          const redirectUrl = this.buildRedirectUrl(request, targetRegion.endpoint);
          response = NextResponse.redirect(redirectUrl, 307); // Temporary redirect
          
          // Add routing headers
          Object.entries(headers).forEach(([key, value]) => {
            if (value) {
              response!.headers.set(key, value);
            }
          });
        }
      }

      return {
        response,
        regionInfo: {
          ...regionResult,
          latency
        },
        headers
      };

    } catch (error) {
      console.error('Region middleware error:', error);
      
      // Fallback to current region
      const fallbackRegion = regionManager.getPrimaryRegion();
      const latency = Date.now() - startTime;

      return {
        regionInfo: {
          regionId: fallbackRegion?.id || 'us-east-1',
          latency,
          reasoning: `Middleware error, fallback: ${error}`,
          complianceRules: [],
          failoverApplied: true
        },
        headers: {
          'X-Region-ID': fallbackRegion?.id || 'us-east-1',
          'X-Latency-MS': latency.toString(),
          'X-Failover-Applied': 'true'
        }
      };
    }
  }

  /**
   * Extract client information from request
   */
  private extractClientInfo(request: NextRequest): {
    location: string;
    ip: string;
    userAgent: string;
    dataType?: string;
  } {
    // Extract location from headers
    const cfCountry = request.headers.get('CF-IPCountry');
    const xForwardedFor = request.headers.get('X-Forwarded-For');
    const ip = xForwardedFor?.split(',')[0] || request.ip || 'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    // Determine location (in real app, would use IP geolocation)
    let location = cfCountry || this.getLocationFromIP(ip) || 'US';
    
    // Extract data type from URL path (for data residency)
    let dataType: string | undefined;
    const path = request.nextUrl.pathname;
    
    if (path.includes('/api/users') || path.includes('/api/profile')) {
      dataType = 'user_profile';
    } else if (path.includes('/api/analytics')) {
      dataType = 'user_analytics';
    } else if (path.includes('/api/financial')) {
      dataType = 'financial_data';
    } else if (path.includes('/api/audit')) {
      dataType = 'audit_logs';
    }

    return {
      location,
      ip,
      userAgent,
      dataType
    };
  }

  /**
   * Simple IP to location mapping (in real app, use proper geolocation service)
   */
  private getLocationFromIP(ip: string): string | null {
    // This is a simplified example. In production, use a proper IP geolocation service
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('127.')) {
      return 'US'; // Local development
    }
    
    // Could integrate with services like MaxMind, IPinfo, etc.
    return null;
  }

  /**
   * Determine optimal region for request
   */
  private async determineOptimalRegion(
    request: NextRequest,
    clientInfo: { location: string; dataType?: string }
  ): Promise<RegionRoutingResult> {
    let failoverApplied = false;
    let reasoning = '';
    let complianceRules: string[] = [];

    try {
      // If data type specified, check data residency requirements
      if (clientInfo.dataType) {
        const residencyResult = await dataResidencyManager.determineDataRegion(
          clientInfo.dataType,
          clientInfo.location
        );
        
        return {
          regionId: residencyResult.regionId,
          latency: 0,
          reasoning: residencyResult.reasoning,
          complianceRules: residencyResult.complianceRules,
          failoverApplied: false
        };
      }

      // Otherwise, use optimal region based on performance
      const optimalRegion = await regionManager.getOptimalRegion(
        clientInfo.location,
        this.getRequestType(request)
      );

      reasoning = `Optimal region selected based on location ${clientInfo.location}`;

      return {
        regionId: optimalRegion.id,
        latency: 0,
        reasoning,
        complianceRules,
        failoverApplied
      };

    } catch (error) {
      // Fallback logic
      failoverApplied = true;
      reasoning = `Fallback due to error: ${error}`;
      
      const fallbackRegion = regionManager.getPrimaryRegion() || {
        id: 'us-east-1'
      };

      return {
        regionId: fallbackRegion.id,
        latency: 0,
        reasoning,
        complianceRules,
        failoverApplied
      };
    }
  }

  /**
   * Get current region (from environment or default)
   */
  private getCurrentRegion(): string {
    return process.env.VERCEL_REGION || 
           process.env.CURRENT_REGION || 
           'us-east-1';
  }

  /**
   * Determine if request should be redirected to different region
   */
  private shouldRedirectRequest(request: NextRequest): boolean {
    // Don't redirect static assets
    if (request.nextUrl.pathname.startsWith('/_next/static/')) {
      return false;
    }

    // Don't redirect health checks
    if (request.nextUrl.pathname.includes('/health')) {
      return false;
    }

    // Don't redirect webhook calls
    if (request.nextUrl.pathname.includes('/webhook')) {
      return false;
    }

    // Only redirect API calls and page requests
    return request.nextUrl.pathname.startsWith('/api/') || 
           !request.nextUrl.pathname.includes('.');
  }

  /**
   * Build redirect URL for different region
   */
  private buildRedirectUrl(request: NextRequest, regionEndpoint: string): string {
    const url = new URL(request.nextUrl);
    url.hostname = new URL(regionEndpoint).hostname;
    url.port = new URL(regionEndpoint).port;
    url.protocol = new URL(regionEndpoint).protocol;
    
    return url.toString();
  }

  /**
   * Get request type for optimization
   */
  private getRequestType(request: NextRequest): string {
    if (request.nextUrl.pathname.startsWith('/api/ai/')) {
      return 'ai_intensive';
    }
    if (request.nextUrl.pathname.startsWith('/api/analytics/')) {
      return 'analytics';
    }
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return 'api';
    }
    return 'page';
  }

  /**
   * Record latency metrics
   */
  private recordLatency(regionId: string, latency: number): void {
    if (!this.performanceMetrics.has(regionId)) {
      this.performanceMetrics.set(regionId, []);
    }
    
    const metrics = this.performanceMetrics.get(regionId)!;
    metrics.push(latency);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance metrics for region
   */
  getRegionMetrics(regionId: string): {
    avgLatency: number;
    p95Latency: number;
    requestCount: number;
  } {
    const metrics = this.performanceMetrics.get(regionId) || [];
    
    if (metrics.length === 0) {
      return { avgLatency: 0, p95Latency: 0, requestCount: 0 };
    }

    const sorted = [...metrics].sort((a, b) => a - b);
    const avg = metrics.reduce((sum, val) => sum + val, 0) / metrics.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || 0;

    return {
      avgLatency: Math.round(avg),
      p95Latency: Math.round(p95),
      requestCount: metrics.length
    };
  }

  /**
   * Add region headers to response
   */
  addRegionHeaders(
    response: NextResponse, 
    regionInfo: RegionRoutingResult,
    additionalHeaders?: Partial<RegionHeaders>
  ): NextResponse {
    const headers: Partial<RegionHeaders> = {
      'X-Region-ID': regionInfo.regionId,
      'X-Latency-MS': regionInfo.latency.toString(),
      'X-Failover-Applied': regionInfo.failoverApplied.toString(),
      'X-Compliance-Rules': regionInfo.complianceRules.join(','),
      ...additionalHeaders
    };

    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    });

    return response;
  }

  /**
   * Check if request can be served from current region
   */
  async canServeFromCurrentRegion(
    request: NextRequest,
    dataType?: string,
    userLocation?: string
  ): Promise<{ canServe: boolean; reason: string }> {
    if (!dataType || !userLocation) {
      return { canServe: true, reason: 'No specific restrictions' };
    }

    try {
      const residencyResult = await dataResidencyManager.determineDataRegion(
        dataType,
        userLocation
      );

      const currentRegion = this.getCurrentRegion();
      
      if (residencyResult.regionId === currentRegion) {
        return { canServe: true, reason: 'Compliant with data residency' };
      }

      return {
        canServe: false,
        reason: `Data residency requires ${residencyResult.regionId}, current: ${currentRegion}`
      };

    } catch (error) {
      return {
        canServe: true,
        reason: `Fallback - unable to determine residency: ${error}`
      };
    }
  }
}

/**
 * Global region middleware instance
 */
export const regionMiddleware = RegionMiddleware.getInstance();

/**
 * Convenience function for Next.js middleware
 */
export async function withRegionRouting(
  request: NextRequest,
  handler?: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await regionMiddleware.handleRequest(request);
  
  // If we have a redirect response, return it
  if (result.response) {
    return result.response;
  }
  
  // Otherwise, continue with the handler
  let response: NextResponse;
  if (handler) {
    response = await handler(request);
  } else {
    response = NextResponse.next();
  }
  
  // Add region headers
  return regionMiddleware.addRegionHeaders(response, result.regionInfo);
}