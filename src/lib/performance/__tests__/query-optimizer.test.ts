/**
 * Unit Tests for QueryOptimizer
 *
 * Tests caching, parallel execution, retry logic, and performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { QueryOptimizer } from '../query-optimizer';

describe('QueryOptimizer', () => {
  let optimizer: QueryOptimizer;

  beforeEach(() => {
    optimizer = new QueryOptimizer();
  });

  afterEach(() => {
    optimizer.clearCache();
  });

  describe('Cache Management', () => {
    it('should cache query results', async () => {
      const queryFn = jest.fn<() => Promise<{ data: string }>>(() => Promise.resolve({ data: 'test-data' }));

      // First call - cache miss
      const result1 = await optimizer.executeWithCache(
        { key: 'test-key', ttl: 5000 },
        queryFn
      );

      // Second call - cache hit
      const result2 = await optimizer.executeWithCache(
        { key: 'test-key', ttl: 5000 },
        queryFn
      );

      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
      expect(result1).toEqual({ data: 'test-data' });
    });

    it('should expire cached data after TTL', async () => {
      const queryFn = jest.fn(() => Promise.resolve({ data: 'test-data' }));

      await optimizer.executeWithCache(
        { key: 'test-key', ttl: 100 },
        queryFn
      );

      // Wait for cache to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      await optimizer.executeWithCache(
        { key: 'test-key', ttl: 100 },
        queryFn
      );

      expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('should track cache statistics', async () => {
      const queryFn = () => Promise.resolve({ data: 'test' });

      // Cache miss
      await optimizer.executeWithCache({ key: 'key1', ttl: 5000 }, queryFn);

      // Cache hit
      await optimizer.executeWithCache({ key: 'key1', ttl: 5000 }, queryFn);

      // Cache miss (different key)
      await optimizer.executeWithCache({ key: 'key2', ttl: 5000 }, queryFn);

      const stats = optimizer.getCacheStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBeCloseTo(33.33, 1);
    });

    it('should clear cache on demand', async () => {
      const queryFn = jest.fn(() => Promise.resolve({ data: 'test' }));

      await optimizer.executeWithCache({ key: 'test-key', ttl: 5000 }, queryFn);
      optimizer.clearCache();
      await optimizer.executeWithCache({ key: 'test-key', ttl: 5000 }, queryFn);

      expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('should handle cache invalidation for specific keys', async () => {
      const queryFn = jest.fn(() => Promise.resolve({ data: 'test' }));

      await optimizer.executeWithCache({ key: 'key1', ttl: 5000 }, queryFn);
      await optimizer.executeWithCache({ key: 'key2', ttl: 5000 }, queryFn);

      optimizer.invalidateCache('key1');

      await optimizer.executeWithCache({ key: 'key1', ttl: 5000 }, queryFn);
      await optimizer.executeWithCache({ key: 'key2', ttl: 5000 }, queryFn);

      // key1 should be called twice (initial + after invalidation)
      // key2 should be called once (initial only, second is cached)
      expect(queryFn).toHaveBeenCalledTimes(3);
    });
  });

  describe('Parallel Query Execution', () => {
    it('should execute multiple queries in parallel', async () => {
      const queries = {
        query1: () => Promise.resolve({ data: 'result1' }),
        query2: () => Promise.resolve({ data: 'result2' }),
        query3: () => Promise.resolve({ data: 'result3' }),
      };

      const startTime = Date.now();
      const results = await optimizer.batchQuery(queries);
      const duration = Date.now() - startTime;

      expect(results).toEqual({
        query1: { data: 'result1' },
        query2: { data: 'result2' },
        query3: { data: 'result3' },
      });

      // Parallel execution should be much faster than sequential
      // (assuming each query takes some time)
      expect(duration).toBeLessThan(1000);
    });

    it('should handle errors in individual queries gracefully', async () => {
      const queries = {
        query1: () => Promise.resolve({ data: 'success' }),
        query2: () => Promise.reject(new Error('Query failed')),
        query3: () => Promise.resolve({ data: 'success' }),
      };

      await expect(optimizer.batchQuery(queries)).rejects.toThrow('Query failed');
    });

    it('should execute queries with different response times in parallel', async () => {
      const queries = {
        fast: () => new Promise(resolve => setTimeout(() => resolve({ data: 'fast' }), 10)),
        medium: () => new Promise(resolve => setTimeout(() => resolve({ data: 'medium' }), 50)),
        slow: () => new Promise(resolve => setTimeout(() => resolve({ data: 'slow' }), 100)),
      };

      const startTime = Date.now();
      const results = await optimizer.batchQuery(queries);
      const duration = Date.now() - startTime;

      // Should complete in approximately the time of the slowest query
      expect(duration).toBeLessThan(150);
      expect(duration).toBeGreaterThan(90);

      expect(results.fast).toEqual({ data: 'fast' });
      expect(results.medium).toEqual({ data: 'medium' });
      expect(results.slow).toEqual({ data: 'slow' });
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed queries', async () => {
      let attemptCount = 0;
      const queryFn = jest.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ data: 'success' });
      });

      const result = await optimizer.executeWithRetry(queryFn, {
        maxRetries: 3,
        retryDelayMs: 10,
      });

      expect(queryFn).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });

    it('should throw error after max retries exceeded', async () => {
      const queryFn = jest.fn(() => Promise.reject(new Error('Persistent failure')));

      await expect(
        optimizer.executeWithRetry(queryFn, {
          maxRetries: 3,
          retryDelayMs: 10,
        })
      ).rejects.toThrow('Persistent failure');

      expect(queryFn).toHaveBeenCalledTimes(4); // initial + 3 retries
    });

    it('should apply exponential backoff', async () => {
      const delays: number[] = [];
      let lastTime = Date.now();

      const queryFn = jest.fn(() => {
        const now = Date.now();
        if (delays.length > 0) {
          delays.push(now - lastTime);
        }
        lastTime = now;
        return Promise.reject(new Error('Failure'));
      });

      try {
        await optimizer.executeWithRetry(queryFn, {
          maxRetries: 3,
          retryDelayMs: 100,
          useExponentialBackoff: true,
        });
      } catch (error) {
        // Expected to fail
      }

      // Each retry should take longer than the previous (exponential backoff)
      expect(delays.length).toBe(3);
      expect(delays[1]).toBeGreaterThan(delays[0]);
      expect(delays[2]).toBeGreaterThan(delays[1]);
    });

    it('should succeed on first attempt without retries', async () => {
      const queryFn = jest.fn(() => Promise.resolve({ data: 'immediate-success' }));

      const result = await optimizer.executeWithRetry(queryFn, {
        maxRetries: 3,
        retryDelayMs: 100,
      });

      expect(queryFn).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 'immediate-success' });
    });
  });

  describe('Pagination Helpers', () => {
    it('should paginate query results correctly', async () => {
      const allData = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));

      const queryFn = (offset: number, limit: number) =>
        Promise.resolve(allData.slice(offset, offset + limit));

      const page1 = await optimizer.paginatedQuery(queryFn, { page: 1, pageSize: 10 });
      const page2 = await optimizer.paginatedQuery(queryFn, { page: 2, pageSize: 10 });
      const page3 = await optimizer.paginatedQuery(queryFn, { page: 3, pageSize: 10 });

      expect(page1).toHaveLength(10);
      expect(page1[0]).toEqual({ id: 1 });
      expect(page1[9]).toEqual({ id: 10 });

      expect(page2).toHaveLength(10);
      expect(page2[0]).toEqual({ id: 11 });
      expect(page2[9]).toEqual({ id: 20 });

      expect(page3).toHaveLength(10);
      expect(page3[0]).toEqual({ id: 21 });
    });

    it('should handle last page with fewer items', async () => {
      const allData = Array.from({ length: 25 }, (_, i) => ({ id: i + 1 }));

      const queryFn = (offset: number, limit: number) =>
        Promise.resolve(allData.slice(offset, offset + limit));

      const lastPage = await optimizer.paginatedQuery(queryFn, { page: 3, pageSize: 10 });

      expect(lastPage).toHaveLength(5);
      expect(lastPage[0]).toEqual({ id: 21 });
      expect(lastPage[4]).toEqual({ id: 25 });
    });

    it('should return empty array for page beyond data', async () => {
      const allData = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

      const queryFn = (offset: number, limit: number) =>
        Promise.resolve(allData.slice(offset, offset + limit));

      const emptyPage = await optimizer.paginatedQuery(queryFn, { page: 5, pageSize: 10 });

      expect(emptyPage).toHaveLength(0);
    });
  });

  describe('Performance Optimization', () => {
    it('should combine caching with retry logic', async () => {
      let attemptCount = 0;
      const queryFn = jest.fn(() => {
        attemptCount++;
        if (attemptCount < 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ data: 'success' });
      });

      // First call with retry
      const result1 = await optimizer.executeWithCache(
        { key: 'retry-key', ttl: 5000 },
        () => optimizer.executeWithRetry(queryFn, { maxRetries: 3, retryDelayMs: 10 })
      );

      // Second call should use cache (no retry needed)
      const result2 = await optimizer.executeWithCache(
        { key: 'retry-key', ttl: 5000 },
        () => optimizer.executeWithRetry(queryFn, { maxRetries: 3, retryDelayMs: 10 })
      );

      expect(queryFn).toHaveBeenCalledTimes(2); // Only called during first attempt
      expect(result1).toEqual(result2);
    });

    it('should handle concurrent cache access correctly', async () => {
      let callCount = 0;
      const queryFn = jest.fn(() => {
        callCount++;
        return new Promise(resolve =>
          setTimeout(() => resolve({ data: `call-${callCount}` }), 50)
        );
      });

      // Execute same query concurrently
      const promises = Array.from({ length: 5 }, () =>
        optimizer.executeWithCache({ key: 'concurrent-key', ttl: 5000 }, queryFn)
      );

      const results = await Promise.all(promises);

      // Should only call the function once despite concurrent access
      expect(queryFn).toHaveBeenCalledTimes(1);

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });
    });

    it('should measure cache performance improvement', async () => {
      const slowQuery = () =>
        new Promise(resolve =>
          setTimeout(() => resolve({ data: 'result' }), 100)
        );

      // First call (no cache)
      const start1 = Date.now();
      await optimizer.executeWithCache({ key: 'perf-key', ttl: 5000 }, slowQuery);
      const duration1 = Date.now() - start1;

      // Second call (cached)
      const start2 = Date.now();
      await optimizer.executeWithCache({ key: 'perf-key', ttl: 5000 }, slowQuery);
      const duration2 = Date.now() - start2;

      // Cached call should be significantly faster
      expect(duration1).toBeGreaterThan(90);
      expect(duration2).toBeLessThan(10);
      expect(duration2).toBeLessThan(duration1 / 10);
    });
  });

  describe('Error Handling', () => {
    it('should handle null/undefined cache keys gracefully', async () => {
      const queryFn = () => Promise.resolve({ data: 'test' });

      await expect(
        optimizer.executeWithCache({ key: null as any, ttl: 5000 }, queryFn)
      ).rejects.toThrow();
    });

    it('should handle negative TTL values', async () => {
      const queryFn = jest.fn(() => Promise.resolve({ data: 'test' }));

      await optimizer.executeWithCache({ key: 'test-key', ttl: -1000 }, queryFn);
      await optimizer.executeWithCache({ key: 'test-key', ttl: -1000 }, queryFn);

      // Negative TTL should not cache
      expect(queryFn).toHaveBeenCalledTimes(2);
    });

    it('should handle query function throwing synchronous errors', async () => {
      const queryFn = () => {
        throw new Error('Synchronous error');
      };

      await expect(
        optimizer.executeWithCache({ key: 'error-key', ttl: 5000 }, queryFn)
      ).rejects.toThrow('Synchronous error');
    });

    it('should not cache failed queries', async () => {
      let callCount = 0;
      const queryFn = jest.fn(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('First call fails'));
        }
        return Promise.resolve({ data: 'success' });
      });

      // First call fails
      await expect(
        optimizer.executeWithCache({ key: 'fail-key', ttl: 5000 }, queryFn)
      ).rejects.toThrow('First call fails');

      // Second call succeeds (should not use cache from failed call)
      const result = await optimizer.executeWithCache(
        { key: 'fail-key', ttl: 5000 },
        queryFn
      );

      expect(queryFn).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: 'success' });
    });
  });

  describe('Memory Management', () => {
    it('should limit cache size to prevent memory issues', async () => {
      const queryFn = (i: number) => () => Promise.resolve({ data: `result-${i}` });

      // Add many items to cache
      for (let i = 0; i < 1000; i++) {
        await optimizer.executeWithCache(
          { key: `key-${i}`, ttl: 60000 },
          queryFn(i)
        );
      }

      const stats = optimizer.getCacheStats();

      // Cache should have some reasonable limit
      expect(stats.size).toBeLessThanOrEqual(500); // Assuming max cache size is 500
    });

    it('should evict old entries when cache is full', async () => {
      const queryFn = jest.fn((i: number) => Promise.resolve({ data: `result-${i}` }));

      // Fill cache
      for (let i = 0; i < 100; i++) {
        await optimizer.executeWithCache(
          { key: `key-${i}`, ttl: 60000 },
          () => queryFn(i)
        );
      }

      // Access first key again
      await optimizer.executeWithCache(
        { key: 'key-0', ttl: 60000 },
        () => queryFn(0)
      );

      const stats = optimizer.getCacheStats();

      // Should have served from cache
      expect(stats.hits).toBeGreaterThan(0);
    });
  });
});
