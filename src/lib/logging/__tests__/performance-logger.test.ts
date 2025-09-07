/**
 * Tests for Performance Logger
 * Phase 4, Task 4.1: Performance monitoring tests
 */

import { PerformanceLogger, MeasurePerformance, PerformanceThreshold } from '../performance-logger';
import { logger } from '../structured-logger';

// Mock the base logger
jest.mock('../structured-logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis()
  }
}));

describe('PerformanceLogger', () => {
  let perfLogger: PerformanceLogger;

  beforeEach(() => {
    perfLogger = new PerformanceLogger();
    jest.clearAllMocks();
    // Reset performance entries
    (global as any).performance = {
      now: jest.fn(() => Date.now()),
      mark: jest.fn(),
      measure: jest.fn(),
      getEntriesByName: jest.fn(() => []),
      clearMarks: jest.fn(),
      clearMeasures: jest.fn()
    };
  });

  describe('Performance Measurement', () => {
    it('should measure operation duration', () => {
      jest.useFakeTimers();
      const startTime = Date.now();
      
      (global as any).performance.now
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 1500);

      const endMeasure = perfLogger.startMeasure('test_operation');
      jest.advanceTimersByTime(1500);
      const result = endMeasure();

      expect(result.duration).toBe(1500);
      expect(result.operationName).toBe('test_operation');
      expect(performance.mark).toHaveBeenCalledWith('test_operation_start');
      expect(performance.mark).toHaveBeenCalledWith('test_operation_end');

      jest.useRealTimers();
    });

    it('should log when threshold is exceeded', () => {
      const threshold: PerformanceThreshold = {
        duration: 1000,
        action: 'log'
      };

      (global as any).performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1500);

      const endMeasure = perfLogger.startMeasure('slow_operation', threshold);
      endMeasure();

      expect(logger.warn).toHaveBeenCalledWith(
        'Performance threshold exceeded',
        expect.objectContaining({
          operation: 'slow_operation',
          duration: 1500,
          threshold: 1000
        })
      );
    });

    it('should alert when threshold action is alert', () => {
      const threshold: PerformanceThreshold = {
        duration: 500,
        action: 'alert'
      };

      (global as any).performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1000);

      const endMeasure = perfLogger.startMeasure('critical_operation', threshold);
      endMeasure();

      expect(logger.error).toHaveBeenCalledWith(
        'Performance alert: threshold exceeded',
        expect.objectContaining({
          operation: 'critical_operation',
          duration: 1000,
          threshold: 500,
          severity: 'critical'
        })
      );
    });
  });

  describe('Memory Monitoring', () => {
    it('should monitor memory usage', () => {
      // Mock memory usage
      (global as any).process = {
        memoryUsage: jest.fn(() => ({
          heapUsed: 100 * 1024 * 1024, // 100MB
          heapTotal: 200 * 1024 * 1024, // 200MB
          external: 10 * 1024 * 1024, // 10MB
          rss: 250 * 1024 * 1024 // 250MB
        }))
      };

      perfLogger.logMemoryUsage('test_context');

      expect(logger.info).toHaveBeenCalledWith(
        'Memory usage',
        expect.objectContaining({
          context: 'test_context',
          heapUsed: expect.any(Number),
          heapTotal: expect.any(Number),
          heapPercentage: expect.any(Number),
          external: expect.any(Number),
          rss: expect.any(Number)
        })
      );
    });

    it('should detect potential memory leaks', () => {
      // Simulate increasing memory usage
      let heapUsed = 100 * 1024 * 1024;
      (global as any).process = {
        memoryUsage: jest.fn(() => ({
          heapUsed: heapUsed += 50 * 1024 * 1024, // Increase by 50MB each time
          heapTotal: 500 * 1024 * 1024,
          external: 10 * 1024 * 1024,
          rss: 600 * 1024 * 1024
        }))
      };

      // First measurement
      perfLogger.logMemoryUsage('potential_leak');
      expect(logger.info).toHaveBeenCalled();

      // Second measurement - should detect increase
      perfLogger.logMemoryUsage('potential_leak');
      expect(logger.warn).toHaveBeenCalledWith(
        'Potential memory leak detected',
        expect.objectContaining({
          context: 'potential_leak',
          memoryIncrease: expect.any(Number),
          threshold: expect.any(Number)
        })
      );
    });
  });

  describe('Performance Statistics', () => {
    it('should track performance statistics', () => {
      // Add multiple measurements
      const measurements = [100, 200, 150, 300, 250];
      measurements.forEach((duration, i) => {
        (global as any).performance.now
          .mockReturnValueOnce(i * 1000)
          .mockReturnValueOnce(i * 1000 + duration);
        
        const endMeasure = perfLogger.startMeasure('api_call');
        endMeasure();
      });

      const stats = perfLogger.getStatistics('api_call');

      expect(stats).toEqual({
        count: 5,
        min: 100,
        max: 300,
        avg: 200,
        p50: 200,
        p95: 300,
        p99: 300
      });
    });

    it('should return empty stats for unknown operations', () => {
      const stats = perfLogger.getStatistics('unknown_operation');

      expect(stats).toEqual({
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0
      });
    });

    it('should log all statistics', () => {
      // Add some measurements
      (global as any).performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);
      
      const endMeasure = perfLogger.startMeasure('test_op');
      endMeasure();

      perfLogger.logStatistics();

      expect(logger.info).toHaveBeenCalledWith(
        'Performance statistics',
        expect.objectContaining({
          operations: expect.objectContaining({
            test_op: expect.objectContaining({
              count: 1,
              avg: 100
            })
          })
        })
      );
    });
  });

  describe('Clear Statistics', () => {
    it('should clear statistics for specific operation', () => {
      // Add measurement
      (global as any).performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);
      
      const endMeasure = perfLogger.startMeasure('temp_op');
      endMeasure();

      // Verify it exists
      let stats = perfLogger.getStatistics('temp_op');
      expect(stats.count).toBe(1);

      // Clear and verify
      perfLogger.clearStatistics('temp_op');
      stats = perfLogger.getStatistics('temp_op');
      expect(stats.count).toBe(0);
    });

    it('should clear all statistics', () => {
      // Add multiple measurements
      ['op1', 'op2', 'op3'].forEach(op => {
        (global as any).performance.now
          .mockReturnValueOnce(0)
          .mockReturnValueOnce(100);
        
        const endMeasure = perfLogger.startMeasure(op);
        endMeasure();
      });

      // Clear all
      perfLogger.clearStatistics();

      // Verify all are cleared
      ['op1', 'op2', 'op3'].forEach(op => {
        const stats = perfLogger.getStatistics(op);
        expect(stats.count).toBe(0);
      });
    });
  });

  describe('Decorator', () => {
    it('should measure decorated methods', async () => {
      class TestService {
        @MeasurePerformance('decorated_method')
        async performTask(delay: number): Promise<string> {
          await new Promise(resolve => setTimeout(resolve, delay));
          return 'completed';
        }
      }

      const service = new TestService();
      const result = await service.performTask(50);

      expect(result).toBe('completed');
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance measurement'),
        expect.objectContaining({
          operation: 'decorated_method'
        })
      );
    });

    it('should handle decorated method errors', async () => {
      class TestService {
        @MeasurePerformance('failing_method', { duration: 100 })
        async failingTask(): Promise<void> {
          await new Promise(resolve => setTimeout(resolve, 50));
          throw new Error('Task failed');
        }
      }

      const service = new TestService();
      
      await expect(service.failingTask()).rejects.toThrow('Task failed');
      // Should still log performance even on error
      expect(logger.info).toHaveBeenCalled();
    });

    it('should apply threshold to decorated methods', async () => {
      (global as any).performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(200);

      class TestService {
        @MeasurePerformance('slow_method', { duration: 100, action: 'log' })
        slowTask(): string {
          return 'done';
        }
      }

      const service = new TestService();
      service.slowTask();

      expect(logger.warn).toHaveBeenCalledWith(
        'Performance threshold exceeded',
        expect.objectContaining({
          operation: 'slow_method',
          threshold: 100
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle performance API not available', () => {
      // Remove performance API
      (global as any).performance = undefined;

      const endMeasure = perfLogger.startMeasure('no_perf_api');
      const result = endMeasure();

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(logger.info).toHaveBeenCalled();
    });

    it('should handle process.memoryUsage not available', () => {
      // Remove process API
      (global as any).process = undefined;

      // Should not throw
      expect(() => perfLogger.logMemoryUsage('no_process')).not.toThrow();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should calculate percentiles correctly with single measurement', () => {
      (global as any).performance.now
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(100);
      
      const endMeasure = perfLogger.startMeasure('single_measure');
      endMeasure();

      const stats = perfLogger.getStatistics('single_measure');
      expect(stats).toEqual({
        count: 1,
        min: 100,
        max: 100,
        avg: 100,
        p50: 100,
        p95: 100,
        p99: 100
      });
    });
  });
});