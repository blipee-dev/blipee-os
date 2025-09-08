/**
 * Performance Monitoring Logger
 * Phase 4, Task 4.1: Structured logging for performance metrics
 */

import { logger } from './structured-logger';
import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  startTime: number;
  endTime: number;
  memory?: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  cpu?: {
    user: number;
    system: number;
  };
  custom?: Record<string, any>;
}

export interface PerformanceThresholds {
  duration?: number;
  memory?: number;
  cpu?: number;
}

/**
 * Performance monitoring logger
 */
export class PerformanceLogger {
  private perfLogger: any;
  private thresholds: Map<string, PerformanceThresholds>;
  private metrics: Map<string, PerformanceMetrics[]>;

  constructor() {
    this.perfLogger = logger.child({
      component: 'performance',
      service: 'monitoring'
    });
    this.thresholds = new Map();
    this.metrics = new Map();
  }

  /**
   * Set performance thresholds for specific operations
   */
  setThreshold(operation: string, thresholds: PerformanceThresholds): void {
    this.thresholds.set(operation, thresholds);
  }

  /**
   * Start performance measurement
   */
  startMeasure(operation: string, metadata?: Record<string, any>): () => PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    this.perfLogger.debug(`Performance measure started: ${operation}`, metadata);

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      const metrics: PerformanceMetrics = {
        operation,
        duration,
        startTime,
        endTime,
        memory: {
          heapUsed: endMemory.heapUsed,
          heapTotal: endMemory.heapTotal,
          external: endMemory.external,
          rss: endMemory.rss
        },
        cpu: {
          user: endCpu.user / 1000, // Convert to milliseconds
          system: endCpu.system / 1000
        },
        custom: metadata
      };

      this.logMetrics(metrics);
      this.checkThresholds(metrics);
      this.storeMetrics(metrics);

      return metrics;
    };
  }

  /**
   * Log performance metrics
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    this.perfLogger.info(`Performance measure completed: ${metrics.operation}`, {
      duration: metrics.duration,
      memory: {
        heapUsedMB: (metrics.memory!.heapUsed / 1024 / 1024).toFixed(2),
        heapTotalMB: (metrics.memory!.heapTotal / 1024 / 1024).toFixed(2),
        rssMB: (metrics.memory!.rss / 1024 / 1024).toFixed(2)
      },
      cpu: metrics.cpu,
      ...metrics.custom
    });
  }

  /**
   * Check if performance exceeds thresholds
   */
  private checkThresholds(metrics: PerformanceMetrics): void {
    const threshold = this.thresholds.get(metrics.operation);
    if (!threshold) return;

    const warnings: string[] = [];

    if (threshold.duration && metrics.duration > threshold.duration) {
      warnings.push(`Duration ${metrics.duration.toFixed(2)}ms exceeds threshold ${threshold.duration}ms`);
    }

    if (threshold.memory && metrics.memory!.heapUsed > threshold.memory) {
      const heapMB = (metrics.memory!.heapUsed / 1024 / 1024).toFixed(2);
      const thresholdMB = (threshold.memory / 1024 / 1024).toFixed(2);
      warnings.push(`Memory ${heapMB}MB exceeds threshold ${thresholdMB}MB`);
    }

    if (threshold.cpu && metrics.cpu!.user > threshold.cpu) {
      warnings.push(`CPU ${metrics.cpu!.user.toFixed(2)}ms exceeds threshold ${threshold.cpu}ms`);
    }

    if (warnings.length > 0) {
      this.perfLogger.warn(`Performance threshold exceeded: ${metrics.operation}`, {
        warnings,
        metrics: {
          duration: metrics.duration,
          memory: metrics.memory,
          cpu: metrics.cpu
        },
        thresholds: threshold
      });
    }
  }

  /**
   * Store metrics for aggregation
   */
  private storeMetrics(metrics: PerformanceMetrics): void {
    const operationMetrics = this.metrics.get(metrics.operation) || [];
    operationMetrics.push(metrics);
    
    // Keep only last 100 measurements
    if (operationMetrics.length > 100) {
      operationMetrics.shift();
    }
    
    this.metrics.set(metrics.operation, operationMetrics);
  }

  /**
   * Get aggregated statistics for an operation
   */
  getStats(operation: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) {
      return null;
    }

    const durations = operationMetrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((a, b) => a + b, 0);

    return {
      count,
      avg: sum / count,
      min: durations[0],
      max: durations[count - 1],
      p50: this.percentile(durations, 0.5),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99)
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Log all statistics
   */
  logAllStats(): void {
    const allStats: Record<string, any> = {};

    this.metrics.forEach((_, operation) => {
      const stats = this.getStats(operation);
      if (stats) {
        allStats[operation] = stats;
      }
    });

    this.perfLogger.info('Performance statistics summary', allStats);
  }

  /**
   * Clear stored metrics
   */
  clearMetrics(operation?: string): void {
    if (operation) {
      this.metrics.delete(operation);
    } else {
      this.metrics.clear();
    }
  }
}

// Global performance logger instance
export const performanceLogger = new PerformanceLogger();

// Set default thresholds
performanceLogger.setThreshold('api_request', { duration: 1000, memory: 100 * 1024 * 1024 });
performanceLogger.setThreshold('database_query', { duration: 100 });
performanceLogger.setThreshold('ai_request', { duration: 5000 });
performanceLogger.setThreshold('file_operation', { duration: 500 });

/**
 * Performance measurement decorator
 */
export function MeasurePerformance(
  operation?: string,
  thresholds?: PerformanceThresholds
): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const operationName = operation || `${target.constructor.name}.${String(propertyKey)}`;

    if (thresholds) {
      performanceLogger.setThreshold(operationName, thresholds);
    }

    descriptor.value = async function (...args: any[]) {
      const endMeasure = performanceLogger.startMeasure(operationName, {
        class: target.constructor.name,
        method: String(propertyKey),
        args: args.length
      });

      try {
        const result = await originalMethod.apply(this, args);
        endMeasure();
        return result;
      } catch (error) {
        endMeasure();
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Express middleware for API performance monitoring
 */
export function performanceMiddleware() {
  return (req: any, res: any, next: any) => {
    const operation = `${req.method} ${req.path}`;
    const endMeasure = performanceLogger.startMeasure(operation, {
      method: req.method,
      path: req.path,
      query: req.query,
      userAgent: req.headers['user-agent']
    });

    // Override res.end to capture when response is sent
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      const metrics = endMeasure();
      
      // Add performance headers
      res.setHeader('X-Response-Time', metrics.duration.toFixed(2));
      res.setHeader('X-Server-Memory', (metrics.memory!.heapUsed / 1024 / 1024).toFixed(2));
      
      originalEnd.apply(res, args);
    };

    next();
  };
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
  private samples: number[] = [];
  private threshold: number;
  private sampleInterval: number;
  private intervalId?: NodeJS.Timeout;

  constructor(thresholdMB: number = 100, sampleIntervalMs: number = 60000) {
    this.threshold = thresholdMB * 1024 * 1024;
    this.sampleInterval = sampleIntervalMs;
  }

  start(): void {
    this.intervalId = setInterval(() => {
      const usage = process.memoryUsage();
      this.samples.push(usage.heapUsed);

      // Keep only last 10 samples
      if (this.samples.length > 10) {
        this.samples.shift();
      }

      // Check for consistent growth
      if (this.samples.length >= 5) {
        const isGrowing = this.samples.every((val, idx) => 
          idx === 0 || val > this.samples[idx - 1]
        );

        if (isGrowing) {
          const growth = this.samples[this.samples.length - 1] - this.samples[0];
          if (growth > this.threshold) {
            logger.fatal('Potential memory leak detected', {
              growth: (growth / 1024 / 1024).toFixed(2) + 'MB',
              samples: this.samples.map(s => (s / 1024 / 1024).toFixed(2) + 'MB'),
              threshold: (this.threshold / 1024 / 1024).toFixed(2) + 'MB'
            });
          }
        }
      }
    }, this.sampleInterval);

    logger.info('Memory leak detector started', {
      thresholdMB: this.threshold / 1024 / 1024,
      sampleIntervalMs: this.sampleInterval
    });
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      logger.info('Memory leak detector stopped');
    }
  }
}