/**
 * Performance Package Export
 * Centralized exports for ML model performance optimization
 */

export { ModelOptimizer } from './model-optimizer';
export { PerformanceMonitor } from './performance-monitor';
export { ModelScaler } from './model-scaling';

export type {
  PerformanceMetrics,
  OptimizationStrategy,
  OptimizationResult
} from './model-optimizer';

export type {
  PerformanceAlert,
  PerformanceThresholds,
  MonitoringConfig
} from './performance-monitor';

export type {
  ScalingConfig,
  ModelInstance,
  LoadBalancingStrategy
} from './model-scaling';

// Performance utility functions
export const PerformanceUtils = {
  /**
   * Create default monitoring configuration
   */
  createDefaultMonitoringConfig(): MonitoringConfig {
    return {
      sampleRate: 0.1, // Monitor 10% of requests
      alertCooldown: 300000, // 5 minutes between alerts
      thresholds: {
        maxLatency: 1000, // 1 second
        minAccuracy: 0.85, // 85%
        minThroughput: 10, // 10 requests/sec
        maxErrorRate: 0.05, // 5%
        maxMemoryUsage: 512, // 512MB
        driftThreshold: 0.3 // 30% drift threshold
      },
      enablePredictionLogging: false, // For privacy
      enableDriftDetection: true
    };
  },

  /**
   * Create default scaling configuration
   */
  createDefaultScalingConfig(): ScalingConfig {
    return {
      minInstances: 1,
      maxInstances: 10,
      targetLatency: 500, // 500ms
      targetThroughput: 20, // 20 requests/sec
      scaleUpThreshold: 0.7, // Scale up at 70% utilization
      scaleDownThreshold: 0.3, // Scale down at 30% utilization
      cooldownPeriod: 300000, // 5 minutes between scaling decisions
      warmupTime: 30000 // 30 seconds for instance warmup
    };
  },

  /**
   * Create optimization configuration for production
   */
  createProductionOptimizationConfig(): any {
    return {
      testData: [], // Would be provided by caller
      priorities: {
        latency: true,
        throughput: true,
        accuracy: true,
        memoryUsage: false
      },
      strategies: [
        'Model Quantization',
        'Batch Processing',
        'Prediction Caching',
        'Feature Selection'
      ]
    };
  },

  /**
   * Calculate performance score
   */
  calculatePerformanceScore(metrics: PerformanceMetrics, benchmarks: PerformanceMetrics): number {
    const latencyScore = Math.max(0, 1 - (metrics.latency / benchmarks.latency));
    const throughputScore = Math.min(1, metrics.throughput / benchmarks.throughput);
    const accuracyScore = metrics.accuracy;
    const memoryScore = Math.max(0, 1 - (metrics.memoryUsage / benchmarks.memoryUsage));

    // Weighted average
    return (
      latencyScore * 0.3 +
      throughputScore * 0.25 +
      accuracyScore * 0.35 +
      memoryScore * 0.1
    ) * 100;
  },

  /**
   * Format performance metrics for display
   */
  formatMetrics(metrics: PerformanceMetrics): Record<string, string> {
    return {
      latency: `${metrics.latency.toFixed(1)}ms`,
      throughput: `${metrics.throughput.toFixed(1)} req/s`,
      accuracy: `${(metrics.accuracy * 100).toFixed(1)}%`,
      memoryUsage: `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`,
      modelSize: `${(metrics.modelSize / 1024 / 1024).toFixed(1)}MB`
    };
  },

  /**
   * Generate performance report
   */
  generatePerformanceReport(
    modelName: string,
    baseline: PerformanceMetrics,
    optimized: PerformanceMetrics
  ): string {
    const improvement = {
      latency: ((baseline.latency - optimized.latency) / baseline.latency) * 100,
      throughput: ((optimized.throughput - baseline.throughput) / baseline.throughput) * 100,
      accuracy: ((optimized.accuracy - baseline.accuracy) / baseline.accuracy) * 100,
      memory: ((baseline.memoryUsage - optimized.memoryUsage) / baseline.memoryUsage) * 100
    };

    return `
# Performance Optimization Report: ${modelName}

## Baseline Performance
- Latency: ${baseline.latency.toFixed(1)}ms
- Throughput: ${baseline.throughput.toFixed(1)} req/s
- Accuracy: ${(baseline.accuracy * 100).toFixed(1)}%
- Memory Usage: ${(baseline.memoryUsage / 1024 / 1024).toFixed(1)}MB

## Optimized Performance
- Latency: ${optimized.latency.toFixed(1)}ms (${improvement.latency > 0 ? '+' : ''}${improvement.latency.toFixed(1)}%)
- Throughput: ${optimized.throughput.toFixed(1)} req/s (${improvement.throughput > 0 ? '+' : ''}${improvement.throughput.toFixed(1)}%)
- Accuracy: ${(optimized.accuracy * 100).toFixed(1)}% (${improvement.accuracy > 0 ? '+' : ''}${improvement.accuracy.toFixed(1)}%)
- Memory Usage: ${(optimized.memoryUsage / 1024 / 1024).toFixed(1)}MB (${improvement.memory > 0 ? '+' : ''}${improvement.memory.toFixed(1)}%)

## Overall Performance Score
${this.calculatePerformanceScore(optimized, baseline).toFixed(1)}/100

## Recommendations
${improvement.latency > 20 ? '✅ Excellent latency improvement achieved' : '⚠️ Consider additional latency optimizations'}
${improvement.accuracy > -2 ? '✅ Accuracy maintained within acceptable range' : '❌ Significant accuracy loss detected'}
${improvement.memory > 20 ? '✅ Significant memory reduction achieved' : '💡 Consider memory optimization strategies'}
${improvement.throughput > 30 ? '✅ High throughput improvement enables better scalability' : '💡 Consider batch optimization for higher throughput'}
    `.trim();
  }
};