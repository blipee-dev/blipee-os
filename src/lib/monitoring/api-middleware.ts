import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from './index';
import { MetricType } from './types';

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
}

// Track API requests and responses
export function createMonitoringMiddleware() {
  return async (request: NextRequest, response: NextResponse) => {
    const startTime = Date.now();
    const method = request.method;
    const path = new URL(request.url).pathname;
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    let requestSize = 0;
    let responseSize = 0;
    let statusCode = 200;
    let userId: string | undefined;

    try {
      // Calculate request size
      const contentLength = request.headers.get('content-length');
      if (contentLength) {
        requestSize = parseInt(contentLength, 10);
      }

      // Get status code from response
      statusCode = response.status;

      // Estimate response size (simplified approach)
      const responseHeaders = response.headers;
      const contentLengthHeader = responseHeaders.get('content-length');
      if (contentLengthHeader) {
        responseSize = parseInt(contentLengthHeader, 10);
      }

      // Extract user ID if available (from auth context)
      try {
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
          // This would be extracted from JWT or session
          // For now, we'll leave it undefined
        }
      } catch (error) {
        // Ignore auth errors for metrics
      }

    } finally {
      // Record metrics after response
      const responseTime = Date.now() - startTime;
      
      // Record HTTP request metrics
      await monitoringService.recordMetric({
        name: 'http_requests_total',
        type: MetricType.COUNTER,
        value: 1,
        labels: {
          method,
          path,
          status: statusCode.toString(),
        },
        timestamp: new Date(),
      });

      await monitoringService.recordMetric({
        name: 'http_request_duration_ms',
        type: MetricType.HISTOGRAM,
        value: responseTime,
        labels: {
          method,
          path,
        },
        timestamp: new Date(),
      });

      // Record error metrics
      if (statusCode >= 400) {
        await monitoringService.recordMetric({
          name: 'http_errors_total',
          type: MetricType.COUNTER,
          value: 1,
          labels: {
            method,
            path,
            status: statusCode.toString(),
          },
          timestamp: new Date(),
        });
      }

      // Record request/response size metrics
      if (requestSize > 0) {
        await monitoringService.recordMetric({
          name: 'http_request_size_bytes',
          type: MetricType.HISTOGRAM,
          value: requestSize,
          labels: { method, path },
          timestamp: new Date(),
        });
      }

      if (responseSize > 0) {
        await monitoringService.recordMetric({
          name: 'http_response_size_bytes',
          type: MetricType.HISTOGRAM,
          value: responseSize,
          labels: { method, path },
          timestamp: new Date(),
        });
      }

      // Log security events for suspicious patterns
      if (statusCode === 401 || statusCode === 403) {
        await monitoringService.recordSecurityEvent({
          id: `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: statusCode === 401 ? 'unauthorized_access' : 'forbidden_access',
          severity: 'warning' as any,
          source: 'api',
          ip,
          userAgent,
          details: {
            method,
            path,
            statusCode,
            responseTime,
          },
          timestamp: new Date(),
          handled: false,
        });
      }

      // Track failed login attempts
      if (path.includes('/auth/signin') && statusCode === 400) {
        await monitoringService.recordMetric({
          name: 'failed_logins_total',
          type: MetricType.COUNTER,
          value: 1,
          labels: { ip },
          timestamp: new Date(),
        });
      }

      // Track rate limit violations
      if (statusCode === 429) {
        await monitoringService.recordMetric({
          name: 'rate_limit_exceeded_total',
          type: MetricType.COUNTER,
          value: 1,
          labels: { method, path, ip },
          timestamp: new Date(),
        });
      }

      // Log slow requests
      if (responseTime > 5000) { // 5 seconds
        console.warn(`Slow request detected: ${method} ${path} took ${responseTime}ms`);
        
        await monitoringService.recordSecurityEvent({
          id: `slow_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'slow_request',
          severity: 'warning' as any,
          source: 'api',
          ip,
          userAgent,
          details: {
            method,
            path,
            responseTime,
            threshold: 5000,
          },
          timestamp: new Date(),
          handled: false,
        });
      }
    }

    return response;
  };
}

// Higher-order function to wrap API handlers with monitoring
export function withMonitoring<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  metricName?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const name = metricName || handler.name || 'unknown_handler';
    
    try {
      const result = await handler(...args);
      
      // Record success metric
      await monitoringService.recordMetric({
        name: `${name}_duration_ms`,
        type: MetricType.HISTOGRAM,
        value: Date.now() - startTime,
        timestamp: new Date(),
      });

      await monitoringService.recordMetric({
        name: `${name}_success_total`,
        type: MetricType.COUNTER,
        value: 1,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      // Record error metric
      await monitoringService.recordMetric({
        name: `${name}_errors_total`,
        type: MetricType.COUNTER,
        value: 1,
        labels: {
          error: error instanceof Error ? error.constructor.name : 'unknown',
        },
        timestamp: new Date(),
      });

      await monitoringService.recordMetric({
        name: `${name}_duration_ms`,
        type: MetricType.HISTOGRAM,
        value: Date.now() - startTime,
        labels: { status: 'error' },
        timestamp: new Date(),
      });

      throw error;
    }
  };
}

// Track database operations
export async function trackDatabaseOperation<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    
    await monitoringService.recordMetric({
      name: 'database_queries_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: { operation, table, status: 'success' },
      timestamp: new Date(),
    });

    await monitoringService.recordMetric({
      name: 'database_query_duration_ms',
      type: MetricType.HISTOGRAM,
      value: Date.now() - startTime,
      labels: { operation, table },
      timestamp: new Date(),
    });

    return result;
  } catch (error) {
    await monitoringService.recordMetric({
      name: 'database_queries_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: { operation, table, status: 'error' },
      timestamp: new Date(),
    });

    await monitoringService.recordMetric({
      name: 'database_query_duration_ms',
      type: MetricType.HISTOGRAM,
      value: Date.now() - startTime,
      labels: { operation, table, status: 'error' },
      timestamp: new Date(),
    });

    throw error;
  }
}

// Track AI/LLM operations
export async function trackAIOperation<T>(
  provider: string,
  model: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    
    await monitoringService.recordMetric({
      name: 'ai_requests_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: { provider, model, operation, status: 'success' },
      timestamp: new Date(),
    });

    await monitoringService.recordMetric({
      name: 'ai_request_duration_ms',
      type: MetricType.HISTOGRAM,
      value: Date.now() - startTime,
      labels: { provider, model, operation },
      timestamp: new Date(),
    });

    return result;
  } catch (error) {
    await monitoringService.recordMetric({
      name: 'ai_requests_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: { provider, model, operation, status: 'error' },
      timestamp: new Date(),
    });

    throw error;
  }
}

// Export the monitoring middleware instance
export const monitoringMiddleware = createMonitoringMiddleware();