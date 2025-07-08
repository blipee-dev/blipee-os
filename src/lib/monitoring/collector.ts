import { MetricType, AlertSeverity } from './types';
import { monitoringService } from './service';

/**
 * Metrics collector for application instrumentation
 */
export class MetricsCollector {
  /**
   * Record HTTP request
   */
  static async recordHttpRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    userId?: string
  ): Promise<void> {
    // Record request count
    await monitoringService.recordMetric({
      name: 'http_requests_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: {
        method,
        path,
        status: statusCode >= 200 && statusCode < 300 ? 'success' : 'failure',
        statusCode: statusCode.toString(),
      },
    });

    // Record response time
    await monitoringService.recordMetric({
      name: 'http_response_time_ms',
      type: MetricType.HISTOGRAM,
      value: responseTime,
      labels: {
        method,
        path,
      },
    });

    // Record active connections
    await monitoringService.recordMetric({
      name: 'active_connections',
      type: MetricType.GAUGE,
      value: 1, // This would be tracked properly in a real implementation
    });

    // Record errors
    if (statusCode >= 400) {
      await monitoringService.recordMetric({
        name: 'http_errors_total',
        type: MetricType.COUNTER,
        value: 1,
        labels: {
          method,
          path,
          statusCode: statusCode.toString(),
          errorType: statusCode >= 500 ? 'server_error' : 'client_error',
        },
      });
    }
  }

  /**
   * Record authentication event
   */
  static async recordAuthEvent(
    event: 'login' | 'logout' | 'register' | 'mfa_verify',
    success: boolean,
    method?: string,
    userId?: string
  ): Promise<void> {
    const labels: Record<string, string> = {
      event,
      success: success.toString(),
    };
    
    if (method) {
      labels.method = method;
    }

    await monitoringService.recordMetric({
      name: 'auth_events_total',
      type: MetricType.COUNTER,
      value: 1,
      labels,
    });

    // Specific metrics for monitoring
    if (event === 'login') {
      await monitoringService.recordMetric({
        name: 'login_attempts_total',
        type: MetricType.COUNTER,
        value: 1,
        labels: { success: success.toString() },
      });

      if (!success) {
        await monitoringService.recordMetric({
          name: 'failed_logins_total',
          type: MetricType.COUNTER,
          value: 1,
          labels: method ? { method } : {},
        });
      }
    } else if (event === 'mfa_verify') {
      await monitoringService.recordMetric({
        name: 'mfa_verifications_total',
        type: MetricType.COUNTER,
        value: 1,
        labels: { success: success.toString(), method: method || 'unknown' },
      });
    }
  }

  /**
   * Record rate limit event
   */
  static async recordRateLimit(
    identifier: string,
    endpoint: string,
    limited: boolean
  ): Promise<void> {
    if (limited) {
      await monitoringService.recordMetric({
        name: 'rate_limit_exceeded_total',
        type: MetricType.COUNTER,
        value: 1,
        labels: {
          endpoint,
          identifier: identifier.substring(0, 8), // Partial identifier for privacy
        },
      });
    }

    await monitoringService.recordMetric({
      name: 'rate_limit_checks_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: {
        endpoint,
        limited: limited.toString(),
      },
    });
  }

  /**
   * Record database query
   */
  static async recordDatabaseQuery(
    operation: string,
    table: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    await monitoringService.recordMetric({
      name: 'database_queries_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: {
        operation,
        table,
        success: success.toString(),
      },
    });

    await monitoringService.recordMetric({
      name: 'database_query_duration_ms',
      type: MetricType.HISTOGRAM,
      value: duration,
      labels: {
        operation,
        table,
      },
    });
  }

  /**
   * Record cache operation
   */
  static async recordCacheOperation(
    operation: 'get' | 'set' | 'delete',
    hit: boolean,
    duration: number
  ): Promise<void> {
    await monitoringService.recordMetric({
      name: 'cache_operations_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: {
        operation,
        hit: hit.toString(),
      },
    });

    if (operation === 'get') {
      await monitoringService.recordMetric({
        name: hit ? 'cache_hits_total' : 'cache_misses_total',
        type: MetricType.COUNTER,
        value: 1,
      });
    }

    await monitoringService.recordMetric({
      name: 'cache_operation_duration_ms',
      type: MetricType.HISTOGRAM,
      value: duration,
      labels: { operation },
    });
  }

  /**
   * Record external API call
   */
  static async recordApiCall(
    service: string,
    endpoint: string,
    statusCode: number,
    duration: number
  ): Promise<void> {
    await monitoringService.recordMetric({
      name: 'external_api_calls_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: {
        service,
        endpoint,
        success: (statusCode >= 200 && statusCode < 300).toString(),
        statusCode: statusCode.toString(),
      },
    });

    await monitoringService.recordMetric({
      name: 'external_api_duration_ms',
      type: MetricType.HISTOGRAM,
      value: duration,
      labels: {
        service,
        endpoint,
      },
    });
  }

  /**
   * Record business metric
   */
  static async recordBusinessMetric(
    name: string,
    value: number,
    labels?: Record<string, string>
  ): Promise<void> {
    await monitoringService.recordMetric({
      name: `business_${name}`,
      type: MetricType.GAUGE,
      value,
      labels,
    });
  }

  /**
   * Record system metrics (should be called periodically)
   */
  static async recordSystemMetrics(): Promise<void> {
    // CPU usage (mock for now)
    const cpuUsage = Math.random() * 100;
    await monitoringService.recordMetric({
      name: 'system_cpu_usage_percent',
      type: MetricType.GAUGE,
      value: cpuUsage,
    });

    // Memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercent = (usedMemory / totalMemory) * 100;

    await monitoringService.recordMetric({
      name: 'system_memory_usage_percent',
      type: MetricType.GAUGE,
      value: memoryPercent,
    });

    await monitoringService.recordMetric({
      name: 'system_memory_usage_bytes',
      type: MetricType.GAUGE,
      value: usedMemory,
      labels: { type: 'heap_used' },
    });

    await monitoringService.recordMetric({
      name: 'system_memory_usage_bytes',
      type: MetricType.GAUGE,
      value: totalMemory,
      labels: { type: 'heap_total' },
    });

    // Disk usage (mock for now)
    const diskUsage = Math.random() * 100;
    await monitoringService.recordMetric({
      name: 'system_disk_usage_percent',
      type: MetricType.GAUGE,
      value: diskUsage,
    });
  }

  /**
   * Record feature usage
   */
  static async recordFeatureUsage(
    feature: string,
    userId?: string,
    metadata?: Record<string, string>
  ): Promise<void> {
    await monitoringService.recordMetric({
      name: 'feature_usage_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: {
        feature,
        ...metadata,
      },
    });
  }

  /**
   * Record error
   */
  static async recordError(
    errorType: string,
    errorMessage: string,
    context?: Record<string, string>
  ): Promise<void> {
    await monitoringService.recordMetric({
      name: 'errors_total',
      type: MetricType.COUNTER,
      value: 1,
      labels: {
        type: errorType,
        ...context,
      },
    });

    // Also record as security event if it's security-related
    const securityErrorTypes = [
      'authentication_failed',
      'authorization_failed',
      'invalid_token',
      'suspicious_activity',
      'rate_limit_exceeded',
    ];

    if (securityErrorTypes.includes(errorType)) {
      await monitoringService.recordSecurityEvent({
        id: crypto.randomUUID(),
        type: errorType,
        severity: AlertSeverity.WARNING,
        source: 'application',
        details: {
          message: errorMessage,
          ...context,
        },
        timestamp: new Date(),
        handled: true,
      });
    }
  }
}

// Export convenience functions
export const {
  recordHttpRequest,
  recordAuthEvent,
  recordRateLimit,
  recordDatabaseQuery,
  recordCacheOperation,
  recordApiCall,
  recordBusinessMetric,
  recordSystemMetrics,
  recordFeatureUsage,
  recordError,
} = MetricsCollector;