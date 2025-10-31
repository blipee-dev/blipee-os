/**
 * Performance Monitoring Service
 *
 * Tracks and reports performance metrics for database queries, API calls, and frontend operations
 * Part of FASE 3 - Week 2: Performance & Optimization
 */

/**
 * Performance metric
 */
interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
  success: boolean;
}

/**
 * Performance statistics
 */
interface PerformanceStats {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
  successRate: number;
}

/**
 * Performance Monitor
 */
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private maxMetricsPerOperation = 1000;

  /**
   * Start timing an operation
   */
  startTimer(name: string, metadata?: Record<string, any>) {
    return {
      name,
      startTime: performance.now(),
      metadata,
      end: (success = true) => {
        const duration = performance.now() - this.startTimer(name, metadata).startTime;
        this.recordMetric({
          name,
          duration,
          timestamp: Date.now(),
          metadata,
          success,
        });
        return duration;
      },
    };
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    const existing = this.metrics.get(metric.name) || [];
    existing.push(metric);

    // Keep only the most recent metrics
    if (existing.length > this.maxMetricsPerOperation) {
      existing.shift();
    }

    this.metrics.set(metric.name, existing);
  }

  /**
   * Measure async operation
   */
  async measure<T>(
    name: string,
    operation: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    let success = true;
    let result: T;

    try {
      result = await operation();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
        success,
      });
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) return null;

    const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
    const successCount = metrics.filter((m) => m.success).length;

    const count = metrics.length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);
    const avgDuration = totalDuration / count;
    const minDuration = durations[0];
    const maxDuration = durations[count - 1];

    const p50Index = Math.floor(count * 0.5);
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);

    return {
      count,
      totalDuration,
      avgDuration,
      minDuration,
      maxDuration,
      p50: durations[p50Index],
      p95: durations[p95Index],
      p99: durations[p99Index],
      successRate: (successCount / count) * 100,
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};

    for (const name of this.metrics.keys()) {
      const stat = this.getStats(name);
      if (stat) {
        stats[name] = stat;
      }
    }

    return stats;
  }

  /**
   * Get slow operations (p95 > threshold)
   */
  getSlowOperations(thresholdMs = 200): Array<{ name: string; stats: PerformanceStats }> {
    const slowOps: Array<{ name: string; stats: PerformanceStats }> = [];

    for (const name of this.metrics.keys()) {
      const stats = this.getStats(name);
      if (stats && stats.p95 > thresholdMs) {
        slowOps.push({ name, stats });
      }
    }

    return slowOps.sort((a, b) => b.stats.p95 - a.stats.p95);
  }

  /**
   * Get operations with low success rate
   */
  getLowSuccessRateOperations(
    threshold = 95
  ): Array<{ name: string; stats: PerformanceStats }> {
    const lowSuccessOps: Array<{ name: string; stats: PerformanceStats }> = [];

    for (const name of this.metrics.keys()) {
      const stats = this.getStats(name);
      if (stats && stats.successRate < threshold) {
        lowSuccessOps.push({ name, stats });
      }
    }

    return lowSuccessOps.sort((a, b) => a.stats.successRate - b.stats.successRate);
  }

  /**
   * Clear metrics
   */
  clearMetrics(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): Record<string, PerformanceMetric[]> {
    const exported: Record<string, PerformanceMetric[]> = {};
    for (const [name, metrics] of this.metrics.entries()) {
      exported[name] = metrics;
    }
    return exported;
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    summary: {
      totalOperations: number;
      totalMetrics: number;
      avgDurationAcrossAll: number;
    };
    operations: Array<{
      name: string;
      stats: PerformanceStats;
      status: 'excellent' | 'good' | 'warning' | 'critical';
    }>;
    slowOperations: Array<{ name: string; stats: PerformanceStats }>;
    lowSuccessRateOperations: Array<{ name: string; stats: PerformanceStats }>;
  } {
    const allStats = this.getAllStats();
    const operations = Object.entries(allStats).map(([name, stats]) => {
      let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent';

      if (stats.p95 > 500 || stats.successRate < 90) {
        status = 'critical';
      } else if (stats.p95 > 200 || stats.successRate < 95) {
        status = 'warning';
      } else if (stats.p95 > 100) {
        status = 'good';
      }

      return { name, stats, status };
    });

    const totalMetrics = Array.from(this.metrics.values()).reduce(
      (sum, arr) => sum + arr.length,
      0
    );
    const avgDurationAcrossAll =
      operations.reduce((sum, op) => sum + op.stats.avgDuration, 0) / operations.length || 0;

    return {
      summary: {
        totalOperations: operations.length,
        totalMetrics,
        avgDurationAcrossAll,
      },
      operations: operations.sort((a, b) => b.stats.p95 - a.stats.p95),
      slowOperations: this.getSlowOperations(200),
      lowSuccessRateOperations: this.getLowSuccessRateOperations(95),
    };
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for measuring function performance
 */
export function measured(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ): PropertyDescriptor {
    const originalMethod = descriptor.value;
    const methodName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.measure(methodName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Performance tracking utilities
 */
export const PerformanceUtils = {
  /**
   * Track database query performance
   */
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return performanceMonitor.measure(`db:${queryName}`, queryFn, metadata);
  },

  /**
   * Track API call performance
   */
  async trackAPICall<T>(
    endpoint: string,
    callFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    return performanceMonitor.measure(`api:${endpoint}`, callFn, metadata);
  },

  /**
   * Track component render performance (client-side)
   */
  trackComponentRender(componentName: string, metadata?: Record<string, any>) {
    return performanceMonitor.startTimer(`render:${componentName}`, metadata);
  },

  /**
   * Create performance marks for Web Vitals
   */
  markWebVital(name: string, value: number, metadata?: Record<string, any>) {
    performanceMonitor.recordMetric({
      name: `webvital:${name}`,
      duration: value,
      timestamp: Date.now(),
      metadata,
      success: true,
    });
  },

  /**
   * Get performance summary
   */
  getSummary() {
    return performanceMonitor.getPerformanceReport();
  },
};

/**
 * API endpoint to get performance metrics
 */
export function createPerformanceEndpoint() {
  return {
    getStats: () => performanceMonitor.getAllStats(),
    getReport: () => performanceMonitor.getPerformanceReport(),
    getSlowOps: (threshold?: number) => performanceMonitor.getSlowOperations(threshold),
    clearMetrics: (name?: string) => performanceMonitor.clearMetrics(name),
  };
}
