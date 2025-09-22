/**
 * Performance Profiling and Monitoring System
 * Tracks API performance, memory usage, and system metrics
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface MemoryMetric {
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface ApiMetric {
  route: string;
  method: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

class PerformanceProfiler {
  private metrics: PerformanceMetric[] = [];
  private memoryMetrics: MemoryMetric[] = [];
  private apiMetrics: ApiMetric[] = [];
  private timers = new Map<string, number>();
  private maxMetrics = 1000; // Keep last 1000 metrics
  private memoryInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startMemoryMonitoring();
  }

  /**
   * Start timing a performance measurement
   */
  startTiming(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * End timing and record metric
   */
  endTiming(name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    this.addMetric({
      name,
      duration,
      timestamp: Date.now(),
      metadata
    });

    return duration;
  }

  /**
   * Time a function execution
   */
  async timeFunction<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.startTiming(name);
    try {
      const result = await fn();
      this.endTiming(name, metadata);
      return result;
    } catch (error) {
      this.endTiming(name, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Record API request metric
   */
  recordApiRequest(metric: Omit<ApiMetric, 'timestamp'>): void {
    this.apiMetrics.push({
      ...metric,
      timestamp: Date.now()
    });

    // Keep only recent metrics
    if (this.apiMetrics.length > this.maxMetrics) {
      this.apiMetrics = this.apiMetrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Add a performance metric
   */
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Start memory monitoring
   */
  private startMemoryMonitoring(): void {
    if (typeof process === 'undefined') return;

    this.memoryInterval = setInterval(() => {
      const usage = process.memoryUsage();
      this.memoryMetrics.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        rss: usage.rss
      });

      // Keep only last hour of memory metrics (assuming 30s intervals)
      if (this.memoryMetrics.length > 120) {
        this.memoryMetrics = this.memoryMetrics.slice(-120);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Get performance summary
   */
  getSummary(timeRangeMs = 5 * 60 * 1000): {
    performance: any;
    memory: any;
    api: any;
    alerts: string[];
  } {
    const now = Date.now();
    const cutoff = now - timeRangeMs;

    // Filter recent metrics
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);
    const recentApiMetrics = this.apiMetrics.filter(m => m.timestamp > cutoff);
    const recentMemoryMetrics = this.memoryMetrics.filter(m => m.timestamp > cutoff);

    // Performance metrics
    const performanceStats = this.calculatePerformanceStats(recentMetrics);

    // API metrics
    const apiStats = this.calculateApiStats(recentApiMetrics);

    // Memory metrics
    const memoryStats = this.calculateMemoryStats(recentMemoryMetrics);

    // Generate alerts
    const alerts = this.generateAlerts(performanceStats, apiStats, memoryStats);

    return {
      performance: performanceStats,
      memory: memoryStats,
      api: apiStats,
      alerts
    };
  }

  /**
   * Calculate performance statistics
   */
  private calculatePerformanceStats(metrics: PerformanceMetric[]) {
    if (metrics.length === 0) {
      return { totalMetrics: 0, avgDuration: 0, slowestOperations: [] };
    }

    const durations = metrics.map(m => m.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    // Group by operation name
    const operationStats = new Map<string, { count: number; totalDuration: number; maxDuration: number }>();

    metrics.forEach(metric => {
      const existing = operationStats.get(metric.name) || { count: 0, totalDuration: 0, maxDuration: 0 };
      existing.count++;
      existing.totalDuration += metric.duration;
      existing.maxDuration = Math.max(existing.maxDuration, metric.duration);
      operationStats.set(metric.name, existing);
    });

    // Find slowest operations
    const slowestOperations = Array.from(operationStats.entries())
      .map(([name, stats]) => ({
        name,
        avgDuration: stats.totalDuration / stats.count,
        maxDuration: stats.maxDuration,
        count: stats.count
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalMetrics: metrics.length,
      avgDuration: Math.round(avgDuration),
      maxDuration,
      minDuration,
      slowestOperations
    };
  }

  /**
   * Calculate API statistics
   */
  private calculateApiStats(metrics: ApiMetric[]) {
    if (metrics.length === 0) {
      return { totalRequests: 0, avgResponseTime: 0, errorRate: 0, slowestEndpoints: [] };
    }

    const totalRequests = metrics.length;
    const avgResponseTime = metrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorCount / totalRequests) * 100;

    // Group by endpoint
    const endpointStats = new Map<string, { count: number; totalDuration: number; errors: number }>();

    metrics.forEach(metric => {
      const key = `${metric.method} ${metric.route}`;
      const existing = endpointStats.get(key) || { count: 0, totalDuration: 0, errors: 0 };
      existing.count++;
      existing.totalDuration += metric.duration;
      if (metric.statusCode >= 400) existing.errors++;
      endpointStats.set(key, existing);
    });

    // Find slowest endpoints
    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: Math.round(stats.totalDuration / stats.count),
        requests: stats.count,
        errorRate: Math.round((stats.errors / stats.count) * 100)
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5);

    return {
      totalRequests,
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      slowestEndpoints
    };
  }

  /**
   * Calculate memory statistics
   */
  private calculateMemoryStats(metrics: MemoryMetric[]) {
    if (metrics.length === 0) {
      return { samples: 0, currentUsage: 0, trend: 'stable' };
    }

    const latest = metrics[metrics.length - 1];
    const currentUsageMB = Math.round(latest.heapUsed / 1024 / 1024);
    const currentTotalMB = Math.round(latest.heapTotal / 1024 / 1024);

    // Calculate trend
    let trend = 'stable';
    if (metrics.length > 1) {
      const first = metrics[0];
      const last = metrics[metrics.length - 1];
      const change = ((last.heapUsed - first.heapUsed) / first.heapUsed) * 100;

      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    return {
      samples: metrics.length,
      currentUsage: currentUsageMB,
      currentTotal: currentTotalMB,
      utilizationPercent: Math.round((currentUsageMB / currentTotalMB) * 100),
      trend
    };
  }

  /**
   * Generate performance alerts
   */
  private generateAlerts(performanceStats: any, apiStats: any, memoryStats: any): string[] {
    const alerts: string[] = [];

    // Performance alerts
    if (performanceStats.avgDuration > 1000) {
      alerts.push(`High average operation time: ${performanceStats.avgDuration}ms`);
    }

    // API alerts
    if (apiStats.errorRate > 5) {
      alerts.push(`High API error rate: ${apiStats.errorRate}%`);
    }

    if (apiStats.avgResponseTime > 2000) {
      alerts.push(`Slow API response time: ${apiStats.avgResponseTime}ms`);
    }

    // Memory alerts
    if (memoryStats.utilizationPercent > 85) {
      alerts.push(`High memory utilization: ${memoryStats.utilizationPercent}%`);
    }

    if (memoryStats.trend === 'increasing') {
      alerts.push('Memory usage is trending upward - potential memory leak');
    }

    return alerts;
  }

  /**
   * Get detailed metrics for debugging
   */
  getDetailedMetrics() {
    return {
      recentMetrics: this.metrics.slice(-50),
      recentApiMetrics: this.apiMetrics.slice(-50),
      recentMemoryMetrics: this.memoryMetrics.slice(-10),
      activeTimers: Array.from(this.timers.keys())
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }
}

// Global profiler instance
const globalProfiler = new PerformanceProfiler();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGTERM', () => globalProfiler.cleanup());
  process.on('SIGINT', () => globalProfiler.cleanup());
}

export { globalProfiler as profiler };
export type { PerformanceMetric, MemoryMetric, ApiMetric };