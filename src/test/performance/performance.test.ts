/**
 * Performance Test Suite
 * Tests system performance under various load conditions
 */

import { LoadTester, loadTestScenarios, PerformanceMonitor, MemoryLeakDetector } from './load-test';
import { POST as chatHandler } from '@/app/api/ai/chat/route';
import { POST as signInHandler } from '@/app/api/auth/signin/route';
import { createAuthenticatedRequest } from '@/test/utils/api-test-helpers';

describe('Performance Test Suite', () => {
  let loadTester: LoadTester;
  let performanceMonitor: PerformanceMonitor;

  beforeAll(() => {
    loadTester = new LoadTester();
    performanceMonitor = new PerformanceMonitor();
  });

  describe('API Response Time Tests', () => {
    it('should respond to auth requests within 200ms', async () => {
      const iterations = 100;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify({
            email: `test${i}@example.com`,
            password: 'TestPassword123!',
          }),
        }));

        const duration = performance.now() - start;
        responseTimes.push(duration);
        performanceMonitor.recordMetric('auth.signin.responseTime', duration);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);

      expect(avgResponseTime).toBeLessThan(200);
      expect(maxResponseTime).toBeLessThan(500);
    });

    it('should handle AI chat requests within 2 seconds', async () => {
      const iterations = 50;
      const responseTimes: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        
        const _request = createAuthenticatedRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: {
            message: `Test message ${i}`,
            conversationId: `conv-${i}`,
          },
        });

        await chatHandler(_request);

        const duration = performance.now() - start;
        responseTimes.push(duration);
        performanceMonitor.recordMetric('ai.chat.responseTime', duration);
      }

      const metrics = performanceMonitor.getMetricSummary('ai.chat.responseTime');
      
      expect(metrics.avg).toBeLessThan(2000);
      expect(metrics.p95).toBeLessThan(3000);
      expect(metrics.p99).toBeLessThan(5000);
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle 100 concurrent auth requests', async () => {
      const concurrentRequests = 100;
      const requests = [];

      const start = performance.now();

      for (let i = 0; i < concurrentRequests; i++) {
        const _request = signInHandler(new Request('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify({
            email: `concurrent${i}@example.com`,
            password: 'TestPassword123!',
          }),
        }));
        requests.push(_request);
      }

      const responses = await Promise.all(_request);
      const totalTime = performance.now() - start;

      // All requests should complete
      expect(responses.length).toBe(concurrentRequests);
      
      // Should complete within reasonable time (10s for 100 requests)
      expect(totalTime).toBeLessThan(10000);
      
      // Average time per request when concurrent
      const avgTimePerRequest = totalTime / concurrentRequests;
      expect(avgTimePerRequest).toBeLessThan(1000);
    });

    it('should handle mixed concurrent requests', async () => {
      const authRequests = 50;
      const chatRequests = 50;
      const requests = [];

      // Create mixed request types
      for (let i = 0; i < authRequests; i++) {
        requests.push(
          signInHandler(new Request('http://localhost:3000/api/auth/signin', {
            method: 'POST',
            body: JSON.stringify({
              email: `mixed${i}@example.com`,
              password: 'TestPassword123!',
            }),
          }))
        );
      }

      for (let i = 0; i < chatRequests; i++) {
        requests.push(
          chatHandler(createAuthenticatedRequest('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: {
              message: `Mixed test ${i}`,
            },
          }))
        );
      }

      const start = performance.now();
      const responses = await Promise.all(_request);
      const totalTime = performance.now() - start;

      expect(responses.length).toBe(authRequests + chatRequests);
      expect(totalTime).toBeLessThan(15000); // 15s for 100 mixed requests
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during sustained load', async () => {
      const detector = new MemoryLeakDetector();
      detector.start(100); // Sample every 100ms

      // Run sustained load for 30 seconds
      const testDuration = 30000;
      const startTime = Date.now();

      while (Date.now() - startTime < testDuration) {
        // Create and process requests
        await chatHandler(createAuthenticatedRequest('http://localhost:3000/api/ai/chat', {
          method: 'POST',
          body: {
            message: 'Memory test message',
            attachments: [
              { id: 'file-1', name: 'large.pdf', size: 10 * 1024 * 1024 }, // 10MB
            ],
          },
        }));

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const result = detector.stop();
      
      // Should not show significant memory growth
      expect(result.leaked).toBe(false);
      expect(result.trend).toBeLessThan(10); // Less than 10MB per minute growth
    });

    it('should garbage collect properly after request spikes', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Create spike of requests
      const spikeRequests = 200;
      const requests = [];

      for (let i = 0; i < spikeRequests; i++) {
        requests.push(
          chatHandler(createAuthenticatedRequest('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: {
              message: `Spike test ${i}`,
              // Include some data to increase memory usage
              context: {
                history: Array(100).fill('Previous message content'),
              },
            },
          }))
        );
      }

      await Promise.all(_request);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be reasonable (less than 100MB)
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024);
    });
  });

  describe('Database Performance Tests', () => {
    it('should handle database query performance under load', async () => {
      const queries = 100;
      const queryTimes: number[] = [];

      for (let i = 0; i < queries; i++) {
        const start = performance.now();
        
        // Simulate database query through API
        await fetch(`http://localhost:3000/api/organizations/org-${i}/stats`);
        
        const duration = performance.now() - start;
        queryTimes.push(duration);
      }

      const avgQueryTime = queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length;
      const maxQueryTime = Math.max(...queryTimes);

      expect(avgQueryTime).toBeLessThan(100); // Avg query under 100ms
      expect(maxQueryTime).toBeLessThan(500); // Max query under 500ms
    });

    it('should maintain connection pool efficiency', async () => {
      const concurrentQueries = 50;
      const iterations = 5;
      const poolMetrics: number[] = [];

      for (let iter = 0; iter < iterations; iter++) {
        const start = performance.now();
        const queries = [];

        for (let i = 0; i < concurrentQueries; i++) {
          queries.push(
            fetch(`http://localhost:3000/api/organizations/org-${i}/members`)
          );
        }

        await Promise.all(queries);
        const duration = performance.now() - start;
        poolMetrics.push(duration);
      }

      // Connection pool should show consistent performance
      const avgTime = poolMetrics.reduce((a, b) => a + b, 0) / poolMetrics.length;
      const variance = poolMetrics.reduce((sum, time) => 
        sum + Math.pow(time - avgTime, 2), 0
      ) / poolMetrics.length;
      const stdDev = Math.sqrt(variance);

      // Low standard deviation indicates consistent performance
      expect(stdDev / avgTime).toBeLessThan(0.2); // Less than 20% variation
    });
  });

  describe('Load Test Scenarios', () => {
    it('should pass normal traffic load test', async () => {
      const result = await loadTester.runLoadTest({
        ...loadTestScenarios.normalTraffic,
        sustain: { duration: 30, users: 50 }, // Reduced for test
      });

      expect(result.errorRate).toBeLessThan(0.1);
      expect(result.p95ResponseTime).toBeLessThan(1000);
      expect(result.requestsPerSecond).toBeGreaterThan(10);
    });

    it('should handle traffic spikes gracefully', async () => {
      const result = await loadTester.runLoadTest({
        ...loadTestScenarios.spikeTest,
        rampUp: { duration: 5, targetUsers: 200 }, // Reduced for test
        sustain: { duration: 10, users: 200 },
        rampDown: { duration: 5 },
      });

      expect(result.errorRate).toBeLessThan(5);
      expect(result.p99ResponseTime).toBeLessThan(10000);
      
      // Should still maintain reasonable throughput
      expect(result.successfulRequests).toBeGreaterThan(result.totalRequests * 0.95);
    });
  });

  describe('Caching Performance', () => {
    it('should improve response times with caching', async () => {
      const endpoint = 'http://localhost:3000/api/organizations/org-123/stats';
      const iterations = 20;
      const uncachedTimes: number[] = [];
      const cachedTimes: number[] = [];

      // First pass - uncached
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fetch(`${endpoint}?nocache=${i}`); // Force cache miss
        uncachedTimes.push(performance.now() - start);
      }

      // Second pass - should be cached
      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fetch(endpoint); // Same endpoint, should hit cache
        cachedTimes.push(performance.now() - start);
      }

      const avgUncached = uncachedTimes.reduce((a, b) => a + b, 0) / uncachedTimes.length;
      const avgCached = cachedTimes.reduce((a, b) => a + b, 0) / cachedTimes.length;

      // Cached responses should be significantly faster
      expect(avgCached).toBeLessThan(avgUncached * 0.5); // At least 50% faster
      expect(avgCached).toBeLessThan(50); // Cached responses under 50ms
    });
  });

  describe('Resource Utilization', () => {
    it('should efficiently utilize CPU under load', async () => {
      const cpuMetrics: number[] = [];
      const duration = 10000; // 10 seconds
      const interval = 1000; // Sample every second

      const startUsage = process.cpuUsage();
      const startTime = Date.now();

      // Generate load
      const loadPromise = (async () => {
        while (Date.now() - startTime < duration) {
          await chatHandler(createAuthenticatedRequest('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            body: { message: 'CPU test' },
          }));
        }
      })();

      // Sample CPU usage
      const samplingInterval = setInterval(() => {
        const usage = process.cpuUsage(startUsage);
        const totalCPU = (usage.user + usage.system) / 1000000; // Convert to seconds
        const elapsed = (Date.now() - startTime) / 1000;
        const cpuPercent = (totalCPU / elapsed) * 100;
        cpuMetrics.push(cpuPercent);
      }, interval);

      await loadPromise;
      clearInterval(samplingInterval);

      const avgCPU = cpuMetrics.reduce((a, b) => a + b, 0) / cpuMetrics.length;
      
      // Should not saturate CPU
      expect(avgCPU).toBeLessThan(80); // Less than 80% CPU usage
    });
  });

  afterAll(() => {
    // Output performance summary
    const allMetrics = performanceMonitor.getAllMetrics();
    
    Object.entries(allMetrics).forEach(([name, metrics]) => {
    });
  });
});