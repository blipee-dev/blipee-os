/**
 * Unit Tests for PerformanceMonitor
 *
 * Tests operation timing, percentile calculations, success rate tracking, and performance reporting
 */

import { PerformanceMonitor } from '../performance-monitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.reset();
  });

  describe('Operation Measurement', () => {
    it('should measure operation duration', async () => {
      const operation = () =>
        new Promise(resolve => setTimeout(() => resolve('result'), 100));

      const result = await monitor.measure('test-operation', operation);

      expect(result).toBe('result');

      const stats = monitor.getStats('test-operation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.avgDuration).toBeGreaterThanOrEqual(90);
      expect(stats!.avgDuration).toBeLessThanOrEqual(150);
    });

    it('should track multiple operations', async () => {
      const operations = [
        () => new Promise(resolve => setTimeout(() => resolve('op1'), 50)),
        () => new Promise(resolve => setTimeout(() => resolve('op2'), 100)),
        () => new Promise(resolve => setTimeout(() => resolve('op3'), 75)),
      ];

      for (const op of operations) {
        await monitor.measure('multi-test', op);
      }

      const stats = monitor.getStats('multi-test');
      expect(stats!.count).toBe(3);
      expect(stats!.avgDuration).toBeGreaterThan(50);
      expect(stats!.avgDuration).toBeLessThan(120);
    });

    it('should record successful operations', async () => {
      const successOp = () => Promise.resolve('success');

      await monitor.measure('success-op', successOp);

      const stats = monitor.getStats('success-op');
      expect(stats!.successRate).toBe(100);
    });

    it('should record failed operations', async () => {
      const failOp = () => Promise.reject(new Error('Operation failed'));

      await expect(monitor.measure('fail-op', failOp)).rejects.toThrow(
        'Operation failed'
      );

      const stats = monitor.getStats('fail-op');
      expect(stats!.count).toBe(1);
      expect(stats!.successRate).toBe(0);
    });

    it('should track mixed success and failure', async () => {
      const successOp = () => Promise.resolve('success');
      const failOp = () => Promise.reject(new Error('fail'));

      await monitor.measure('mixed-op', successOp);
      await monitor.measure('mixed-op', successOp);
      await expect(monitor.measure('mixed-op', failOp)).rejects.toThrow();
      await monitor.measure('mixed-op', successOp);

      const stats = monitor.getStats('mixed-op');
      expect(stats!.count).toBe(4);
      expect(stats!.successRate).toBe(75); // 3 success, 1 failure
    });

    it('should include metadata in measurements', async () => {
      const operation = () => Promise.resolve('result');

      await monitor.measure(
        'metadata-op',
        operation,
        { userId: '123', action: 'test' }
      );

      const report = monitor.getPerformanceReport();
      const operation_metrics = report.operations.find(
        op => op.name === 'metadata-op'
      );

      expect(operation_metrics).toBeDefined();
    });
  });

  describe('Percentile Calculations', () => {
    it('should calculate P50 correctly', async () => {
      const durations = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

      for (const duration of durations) {
        await monitor.measure(
          'p50-test',
          () => new Promise(resolve => setTimeout(resolve, duration))
        );
      }

      const stats = monitor.getStats('p50-test');
      expect(stats!.p50).toBeGreaterThanOrEqual(45);
      expect(stats!.p50).toBeLessThanOrEqual(65);
    });

    it('should calculate P95 correctly', async () => {
      const durations = Array.from({ length: 100 }, (_, i) => i + 1);

      for (const duration of durations) {
        await monitor.measure(
          'p95-test',
          () => new Promise(resolve => setTimeout(resolve, duration))
        );
      }

      const stats = monitor.getStats('p95-test');
      expect(stats!.p95).toBeGreaterThanOrEqual(90);
      expect(stats!.p95).toBeLessThanOrEqual(100);
    });

    it('should calculate P99 correctly', async () => {
      const durations = Array.from({ length: 100 }, (_, i) => i + 1);

      for (const duration of durations) {
        await monitor.measure(
          'p99-test',
          () => new Promise(resolve => setTimeout(resolve, duration))
        );
      }

      const stats = monitor.getStats('p99-test');
      expect(stats!.p99).toBeGreaterThanOrEqual(98);
      expect(stats!.p99).toBeLessThanOrEqual(105);
    });

    it('should handle single measurement percentiles', async () => {
      await monitor.measure(
        'single-test',
        () => new Promise(resolve => setTimeout(resolve, 50))
      );

      const stats = monitor.getStats('single-test');
      expect(stats!.p50).toBeGreaterThanOrEqual(45);
      expect(stats!.p95).toBeGreaterThanOrEqual(45);
      expect(stats!.p99).toBeGreaterThanOrEqual(45);
    });

    it('should handle small sample sizes correctly', async () => {
      const durations = [10, 20, 30];

      for (const duration of durations) {
        await monitor.measure(
          'small-sample',
          () => new Promise(resolve => setTimeout(resolve, duration))
        );
      }

      const stats = monitor.getStats('small-sample');
      expect(stats!.p50).toBeDefined();
      expect(stats!.p95).toBeDefined();
      expect(stats!.p99).toBeDefined();
    });
  });

  describe('Performance Statistics', () => {
    it('should calculate average duration correctly', async () => {
      const durations = [100, 200, 300];

      for (const duration of durations) {
        await monitor.measure(
          'avg-test',
          () => new Promise(resolve => setTimeout(resolve, duration))
        );
      }

      const stats = monitor.getStats('avg-test');
      expect(stats!.avgDuration).toBeGreaterThanOrEqual(180);
      expect(stats!.avgDuration).toBeLessThanOrEqual(220);
    });

    it('should calculate min and max durations', async () => {
      const durations = [50, 100, 150, 200];

      for (const duration of durations) {
        await monitor.measure(
          'minmax-test',
          () => new Promise(resolve => setTimeout(resolve, duration))
        );
      }

      const stats = monitor.getStats('minmax-test');
      expect(stats!.minDuration).toBeGreaterThanOrEqual(45);
      expect(stats!.minDuration).toBeLessThanOrEqual(60);
      expect(stats!.maxDuration).toBeGreaterThanOrEqual(190);
      expect(stats!.maxDuration).toBeLessThanOrEqual(220);
    });

    it('should return null for non-existent operations', () => {
      const stats = monitor.getStats('non-existent');
      expect(stats).toBeNull();
    });

    it('should track total operations count', async () => {
      const operations = ['op1', 'op2', 'op3'];

      for (const opName of operations) {
        await monitor.measure(opName, () => Promise.resolve());
        await monitor.measure(opName, () => Promise.resolve());
      }

      const report = monitor.getPerformanceReport();
      expect(report.summary.totalOperations).toBe(6);
    });
  });

  describe('Performance Reporting', () => {
    it('should generate comprehensive performance report', async () => {
      await monitor.measure('op1', () => Promise.resolve());
      await monitor.measure('op2', () => Promise.resolve());
      await expect(
        monitor.measure('op3', () => Promise.reject(new Error('fail')))
      ).rejects.toThrow();

      const report = monitor.getPerformanceReport();

      expect(report.summary).toBeDefined();
      expect(report.summary.totalOperations).toBe(3);
      expect(report.summary.uniqueOperations).toBe(3);
      expect(report.summary.overallSuccessRate).toBeCloseTo(66.67, 1);
      expect(report.operations).toHaveLength(3);
    });

    it('should sort operations by count in report', async () => {
      // op1: 5 times
      for (let i = 0; i < 5; i++) {
        await monitor.measure('op1', () => Promise.resolve());
      }

      // op2: 3 times
      for (let i = 0; i < 3; i++) {
        await monitor.measure('op2', () => Promise.resolve());
      }

      // op3: 1 time
      await monitor.measure('op3', () => Promise.resolve());

      const report = monitor.getPerformanceReport();

      expect(report.operations[0].name).toBe('op1');
      expect(report.operations[0].count).toBe(5);
      expect(report.operations[1].name).toBe('op2');
      expect(report.operations[1].count).toBe(3);
      expect(report.operations[2].name).toBe('op3');
      expect(report.operations[2].count).toBe(1);
    });

    it('should include timestamps in report', async () => {
      await monitor.measure('timestamp-test', () => Promise.resolve());

      const report = monitor.getPerformanceReport();

      expect(report.timestamp).toBeDefined();
      expect(new Date(report.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Slow Operations Detection', () => {
    it('should detect slow operations', async () => {
      await monitor.measure(
        'fast-op',
        () => new Promise(resolve => setTimeout(resolve, 50))
      );

      await monitor.measure(
        'slow-op',
        () => new Promise(resolve => setTimeout(resolve, 250))
      );

      const slowOps = monitor.getSlowOperations(200);

      expect(slowOps).toHaveLength(1);
      expect(slowOps[0].name).toBe('slow-op');
      expect(slowOps[0].avgDuration).toBeGreaterThan(200);
    });

    it('should return empty array if no slow operations', async () => {
      await monitor.measure(
        'fast-op-1',
        () => new Promise(resolve => setTimeout(resolve, 50))
      );

      await monitor.measure(
        'fast-op-2',
        () => new Promise(resolve => setTimeout(resolve, 75))
      );

      const slowOps = monitor.getSlowOperations(200);

      expect(slowOps).toHaveLength(0);
    });

    it('should use default threshold if not specified', async () => {
      await monitor.measure(
        'moderate-op',
        () => new Promise(resolve => setTimeout(resolve, 250))
      );

      const slowOps = monitor.getSlowOperations();

      // Default threshold should be 200ms
      expect(slowOps).toHaveLength(1);
    });

    it('should sort slow operations by duration', async () => {
      await monitor.measure(
        'slow-1',
        () => new Promise(resolve => setTimeout(resolve, 300))
      );

      await monitor.measure(
        'slow-2',
        () => new Promise(resolve => setTimeout(resolve, 500))
      );

      await monitor.measure(
        'slow-3',
        () => new Promise(resolve => setTimeout(resolve, 400))
      );

      const slowOps = monitor.getSlowOperations(200);

      expect(slowOps).toHaveLength(3);
      expect(slowOps[0].name).toBe('slow-2'); // 500ms (slowest)
      expect(slowOps[1].name).toBe('slow-3'); // 400ms
      expect(slowOps[2].name).toBe('slow-1'); // 300ms
    });
  });

  describe('@measured Decorator', () => {
    it('should measure decorated methods', async () => {
      class TestService {
        @monitor.measured('service-method')
        async performOperation() {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'result';
        }
      }

      const service = new TestService();
      const result = await service.performOperation();

      expect(result).toBe('result');

      const stats = monitor.getStats('service-method');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.avgDuration).toBeGreaterThanOrEqual(90);
    });

    it('should handle errors in decorated methods', async () => {
      class TestService {
        @monitor.measured('error-method')
        async failingOperation() {
          throw new Error('Method failed');
        }
      }

      const service = new TestService();
      await expect(service.failingOperation()).rejects.toThrow('Method failed');

      const stats = monitor.getStats('error-method');
      expect(stats!.successRate).toBe(0);
    });

    it('should measure multiple calls to decorated method', async () => {
      class TestService {
        @monitor.measured('repeated-method')
        async operation(duration: number) {
          await new Promise(resolve => setTimeout(resolve, duration));
          return 'done';
        }
      }

      const service = new TestService();
      await service.operation(50);
      await service.operation(100);
      await service.operation(150);

      const stats = monitor.getStats('repeated-method');
      expect(stats!.count).toBe(3);
    });
  });

  describe('Memory Management', () => {
    it('should reset all metrics', async () => {
      await monitor.measure('op1', () => Promise.resolve());
      await monitor.measure('op2', () => Promise.resolve());

      monitor.reset();

      const stats1 = monitor.getStats('op1');
      const stats2 = monitor.getStats('op2');

      expect(stats1).toBeNull();
      expect(stats2).toBeNull();
    });

    it('should clear metrics for specific operation', async () => {
      await monitor.measure('op1', () => Promise.resolve());
      await monitor.measure('op2', () => Promise.resolve());

      monitor.clearMetrics('op1');

      const stats1 = monitor.getStats('op1');
      const stats2 = monitor.getStats('op2');

      expect(stats1).toBeNull();
      expect(stats2).toBeDefined();
    });

    it('should limit metric storage to prevent memory issues', async () => {
      // Add many measurements
      for (let i = 0; i < 10000; i++) {
        await monitor.measure('memory-test', () => Promise.resolve());
      }

      const stats = monitor.getStats('memory-test');

      // Should maintain a reasonable number of data points
      expect(stats!.count).toBeLessThanOrEqual(1000);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent measurements correctly', async () => {
      const operations = Array.from({ length: 10 }, (_, i) =>
        monitor.measure(
          'concurrent-test',
          () => new Promise(resolve => setTimeout(() => resolve(i), Math.random() * 100))
        )
      );

      await Promise.all(operations);

      const stats = monitor.getStats('concurrent-test');
      expect(stats!.count).toBe(10);
      expect(stats!.successRate).toBe(100);
    });

    it('should handle mixed concurrent success and failures', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => {
        if (i % 3 === 0) {
          return monitor.measure('mixed-concurrent', () =>
            Promise.reject(new Error('fail'))
          );
        }
        return monitor.measure('mixed-concurrent', () => Promise.resolve());
      });

      const results = await Promise.allSettled(operations);

      const stats = monitor.getStats('mixed-concurrent');
      expect(stats!.count).toBe(10);

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const expectedSuccessRate = (successCount / 10) * 100;
      expect(stats!.successRate).toBeCloseTo(expectedSuccessRate, 1);
    });
  });

  describe('Performance Thresholds', () => {
    it('should identify operations exceeding performance budget', async () => {
      await monitor.measure(
        'within-budget',
        () => new Promise(resolve => setTimeout(resolve, 50))
      );

      await monitor.measure(
        'exceeds-budget',
        () => new Promise(resolve => setTimeout(resolve, 300))
      );

      const report = monitor.getPerformanceReport();
      const budgetViolations = report.operations.filter(
        op => op.avgDuration > 200
      );

      expect(budgetViolations).toHaveLength(1);
      expect(budgetViolations[0].name).toBe('exceeds-budget');
    });

    it('should track operations by performance tier', async () => {
      // Fast: < 100ms
      await monitor.measure(
        'fast',
        () => new Promise(resolve => setTimeout(resolve, 50))
      );

      // Medium: 100-200ms
      await monitor.measure(
        'medium',
        () => new Promise(resolve => setTimeout(resolve, 150))
      );

      // Slow: > 200ms
      await monitor.measure(
        'slow',
        () => new Promise(resolve => setTimeout(resolve, 250))
      );

      const report = monitor.getPerformanceReport();

      const fast = report.operations.find(op => op.avgDuration < 100);
      const medium = report.operations.find(
        op => op.avgDuration >= 100 && op.avgDuration < 200
      );
      const slow = report.operations.find(op => op.avgDuration >= 200);

      expect(fast?.name).toBe('fast');
      expect(medium?.name).toBe('medium');
      expect(slow?.name).toBe('slow');
    });
  });
});
