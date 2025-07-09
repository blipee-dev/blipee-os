import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/cache/redis';

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  cached?: boolean;
}

export class PerformanceMonitor {
  private redis: any = null;
  private metricsBuffer: PerformanceMetrics[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  async initialize() {
    try {
      this.redis = await getRedisClient();
      
      // Flush metrics to Redis every 10 seconds
      this.flushInterval = setInterval(() => {
        this.flushMetrics();
      }, 10000);
    } catch (error) {
      console.error('Failed to initialize performance monitor:', error);
    }
  }

  async trackRequest(
    request: NextRequest,
    response: NextResponse,
    startTime: number
  ): Promise<void> {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const metrics: PerformanceMetrics = {
      endpoint: new URL(request.url).pathname,
      method: request.method,
      statusCode: response.status,
      responseTime,
      timestamp: endTime,
      cached: response.headers.get('X-Cache-Status') === 'HIT',
    };

    this.metricsBuffer.push(metrics);

    // Also track in real-time for critical endpoints
    if (this.redis && responseTime > 1000) {
      await this.redis.increment('metrics:slow_requests');
    }
  }

  private async flushMetrics(): Promise<void> {
    if (!this.redis || this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      // Calculate aggregates
      const totalRequests = metrics.length;
      const avgResponseTime = 
        metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
      const p95ResponseTime = this.calculatePercentile(
        metrics.map(m => m.responseTime),
        95
      );
      const p99ResponseTime = this.calculatePercentile(
        metrics.map(m => m.responseTime),
        99
      );
      const errorRate = 
        (metrics.filter(m => m.statusCode >= 500).length / totalRequests) * 100;

      // Update Redis metrics
      await Promise.all([
        this.redis.increment('metrics:total_requests', totalRequests),
        this.redis.set('metrics:avg_response_time', avgResponseTime, 300),
        this.redis.set('metrics:p95_response_time', p95ResponseTime, 300),
        this.redis.set('metrics:p99_response_time', p99ResponseTime, 300),
        this.redis.set('metrics:error_rate', errorRate, 300),
      ]);

      // Store endpoint-specific metrics
      const endpointMetrics = this.groupByEndpoint(metrics);
      for (const [endpoint, endpointData] of Object.entries(endpointMetrics)) {
        await this.redis.set(
          `metrics:endpoint:${endpoint}`,
          endpointData,
          300
        );
      }
    } catch (error) {
      console.error('Error flushing performance metrics:', error);
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private groupByEndpoint(
    metrics: PerformanceMetrics[]
  ): Record<string, any> {
    const grouped: Record<string, any> = {};

    metrics.forEach(metric => {
      if (!grouped[metric.endpoint]) {
        grouped[metric.endpoint] = {
          requests: 0,
          totalTime: 0,
          errors: 0,
          cached: 0,
        };
      }

      grouped[metric.endpoint].requests++;
      grouped[metric.endpoint].totalTime += metric.responseTime;
      if (metric.statusCode >= 500) grouped[metric.endpoint].errors++;
      if (metric.cached) grouped[metric.endpoint].cached++;
    });

    // Calculate averages
    Object.keys(grouped).forEach(endpoint => {
      grouped[endpoint].avgResponseTime = 
        grouped[endpoint].totalTime / grouped[endpoint].requests;
      grouped[endpoint].errorRate = 
        (grouped[endpoint].errors / grouped[endpoint].requests) * 100;
      grouped[endpoint].cacheHitRate = 
        (grouped[endpoint].cached / grouped[endpoint].requests) * 100;
    });

    return grouped;
  }

  async getPerformanceStats(): Promise<any> {
    if (!this.redis) return null;

    try {
      const [
        totalRequests,
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        errorRate,
        slowRequests,
      ] = await Promise.all([
        this.redis.get('metrics:total_requests'),
        this.redis.get('metrics:avg_response_time'),
        this.redis.get('metrics:p95_response_time'),
        this.redis.get('metrics:p99_response_time'),
        this.redis.get('metrics:error_rate'),
        this.redis.get('metrics:slow_requests'),
      ]);

      return {
        totalRequests: totalRequests || 0,
        avgResponseTime: avgResponseTime || 0,
        p95ResponseTime: p95ResponseTime || 0,
        p99ResponseTime: p99ResponseTime || 0,
        errorRate: errorRate || 0,
        slowRequests: slowRequests || 0,
      };
    } catch (error) {
      console.error('Error getting performance stats:', error);
      return null;
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushMetrics();
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export const getPerformanceMonitor = async (): Promise<PerformanceMonitor> => {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
    await performanceMonitor.initialize();
  }
  return performanceMonitor;
};

// Middleware function
export async function withPerformanceTracking(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const monitor = await getPerformanceMonitor();
  
  try {
    const response = await handler(request);
    await monitor.trackRequest(request, response, startTime);
    
    // Add performance headers
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);
    
    return response;
  } catch (error) {
    // Track error
    const errorResponse = NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
    await monitor.trackRequest(request, errorResponse, startTime);
    throw error;
  }
}