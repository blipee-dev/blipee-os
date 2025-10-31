/**
 * Unit Tests for APICacheManager
 *
 * Tests HTTP caching, ETag generation, rate limiting, and cache middleware
 */

import { APICacheManager, RateLimitPresets } from '../api-cache';
import { NextRequest, NextResponse } from 'next/server';

// Mock NextRequest and NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, init) => ({
      ...init,
      json: async () => data,
      headers: new Map(Object.entries(init?.headers || {})),
      status: init?.status || 200,
    })),
    next: jest.fn(() => ({ status: 200 })),
  },
}));

describe('APICacheManager', () => {
  let cacheManager: APICacheManager;

  beforeEach(() => {
    cacheManager = new APICacheManager();
    jest.clearAllMocks();
  });

  describe('ETag Generation', () => {
    it('should generate consistent ETags for same content', () => {
      const content = { data: 'test-content' };

      const etag1 = cacheManager.generateETag(content);
      const etag2 = cacheManager.generateETag(content);

      expect(etag1).toBe(etag2);
      expect(etag1).toMatch(/^"[a-f0-9]+"$/); // Should be quoted hex string
    });

    it('should generate different ETags for different content', () => {
      const content1 = { data: 'content-1' };
      const content2 = { data: 'content-2' };

      const etag1 = cacheManager.generateETag(content1);
      const etag2 = cacheManager.generateETag(content2);

      expect(etag1).not.toBe(etag2);
    });

    it('should generate ETags for complex objects', () => {
      const complexObject = {
        nested: {
          data: [1, 2, 3],
          meta: { timestamp: Date.now() },
        },
        arrays: [{ id: 1 }, { id: 2 }],
      };

      const etag = cacheManager.generateETag(complexObject);

      expect(etag).toBeDefined();
      expect(typeof etag).toBe('string');
    });

    it('should handle null and undefined', () => {
      const etagNull = cacheManager.generateETag(null);
      const etagUndefined = cacheManager.generateETag(undefined);

      expect(etagNull).toBeDefined();
      expect(etagUndefined).toBeDefined();
      expect(etagNull).not.toBe(etagUndefined);
    });

    it('should generate different ETags for arrays with different order', () => {
      const arr1 = [1, 2, 3];
      const arr2 = [3, 2, 1];

      const etag1 = cacheManager.generateETag(arr1);
      const etag2 = cacheManager.generateETag(arr2);

      expect(etag1).not.toBe(etag2);
    });
  });

  describe('HTTP Caching', () => {
    it('should cache API responses', () => {
      const key = 'test-key';
      const data = { result: 'test-data' };
      const ttl = 60000;

      cacheManager.set(key, data, ttl);

      const cached = cacheManager.get(key);

      expect(cached).toEqual(data);
    });

    it('should return null for expired cache', async () => {
      const key = 'expire-key';
      const data = { result: 'test' };
      const ttl = 100; // 100ms

      cacheManager.set(key, data, ttl);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      const cached = cacheManager.get(key);

      expect(cached).toBeNull();
    });

    it('should return null for non-existent cache keys', () => {
      const cached = cacheManager.get('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should update existing cache entries', () => {
      const key = 'update-key';

      cacheManager.set(key, { version: 1 }, 60000);
      cacheManager.set(key, { version: 2 }, 60000);

      const cached = cacheManager.get(key);

      expect(cached).toEqual({ version: 2 });
    });

    it('should track cache statistics', () => {
      cacheManager.set('key1', { data: 'test1' }, 60000);
      cacheManager.set('key2', { data: 'test2' }, 60000);

      cacheManager.get('key1'); // hit
      cacheManager.get('key1'); // hit
      cacheManager.get('key3'); // miss

      const stats = cacheManager.getCacheStats();

      expect(stats.size).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should clear all cache entries', () => {
      cacheManager.set('key1', { data: 'test1' }, 60000);
      cacheManager.set('key2', { data: 'test2' }, 60000);

      cacheManager.clearCache();

      const stats = cacheManager.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should invalidate specific cache entries', () => {
      cacheManager.set('key1', { data: 'test1' }, 60000);
      cacheManager.set('key2', { data: 'test2' }, 60000);

      cacheManager.invalidate('key1');

      expect(cacheManager.get('key1')).toBeNull();
      expect(cacheManager.get('key2')).toEqual({ data: 'test2' });
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', () => {
      const config = {
        windowMs: 60000,
        maxRequests: 10,
      };

      for (let i = 0; i < 10; i++) {
        const result = cacheManager.checkRateLimit('test-key', config);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(10 - i - 1);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const config = {
        windowMs: 60000,
        maxRequests: 5,
      };

      // Make 5 requests (should all be allowed)
      for (let i = 0; i < 5; i++) {
        const result = cacheManager.checkRateLimit('block-test', config);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const blockedResult = cacheManager.checkRateLimit('block-test', config);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    it('should reset rate limit after window expires', async () => {
      const config = {
        windowMs: 100,
        maxRequests: 3,
      };

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        cacheManager.checkRateLimit('reset-test', config);
      }

      // Should be blocked
      let result = cacheManager.checkRateLimit('reset-test', config);
      expect(result.allowed).toBe(false);

      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      result = cacheManager.checkRateLimit('reset-test', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });

    it('should track rate limits independently for different keys', () => {
      const config = {
        windowMs: 60000,
        maxRequests: 5,
      };

      // Use up limit for key1
      for (let i = 0; i < 5; i++) {
        cacheManager.checkRateLimit('key1', config);
      }

      // key1 should be blocked
      const key1Result = cacheManager.checkRateLimit('key1', config);
      expect(key1Result.allowed).toBe(false);

      // key2 should still be allowed
      const key2Result = cacheManager.checkRateLimit('key2', config);
      expect(key2Result.allowed).toBe(true);
    });

    it('should include reset time in rate limit response', () => {
      const config = {
        windowMs: 60000,
        maxRequests: 10,
      };

      const result = cacheManager.checkRateLimit('time-test', config);

      expect(result.resetTime).toBeGreaterThan(Date.now());
      expect(result.resetTime).toBeLessThanOrEqual(Date.now() + 60000);
    });

    it('should handle concurrent rate limit checks', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 10,
      };

      const promises = Array.from({ length: 15 }, () =>
        Promise.resolve(cacheManager.checkRateLimit('concurrent-test', config))
      );

      const results = await Promise.all(promises);

      const allowedCount = results.filter(r => r.allowed).length;
      const blockedCount = results.filter(r => !r.allowed).length;

      expect(allowedCount).toBe(10);
      expect(blockedCount).toBe(5);
    });
  });

  describe('Rate Limit Presets', () => {
    it('should apply strict preset correctly', () => {
      const config = RateLimitPresets.strict;

      expect(config.maxRequests).toBe(10);
      expect(config.windowMs).toBe(60000); // 1 minute
    });

    it('should apply moderate preset correctly', () => {
      const config = RateLimitPresets.moderate;

      expect(config.maxRequests).toBe(50);
      expect(config.windowMs).toBe(60000); // 1 minute
    });

    it('should apply generous preset correctly', () => {
      const config = RateLimitPresets.generous;

      expect(config.maxRequests).toBe(100);
      expect(config.windowMs).toBe(60000); // 1 minute
    });

    it('should enforce strict preset limits', () => {
      const config = RateLimitPresets.strict;

      for (let i = 0; i < config.maxRequests; i++) {
        const result = cacheManager.checkRateLimit('strict-test', config);
        expect(result.allowed).toBe(true);
      }

      const blocked = cacheManager.checkRateLimit('strict-test', config);
      expect(blocked.allowed).toBe(false);
    });
  });

  describe('Cache Middleware', () => {
    it('should cache successful responses', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'success' }))
      );

      const middleware = cacheManager.withCache({ ttl: 60000 });

      // First call - cache miss
      const response1 = await middleware(mockRequest, mockHandler);
      expect(mockHandler).toHaveBeenCalledTimes(1);

      // Second call - cache hit
      const response2 = await middleware(mockRequest, mockHandler);
      expect(mockHandler).toHaveBeenCalledTimes(1); // Should not call handler again
    });

    it('should respect If-None-Match header', async () => {
      const data = { data: 'test' };
      const etag = cacheManager.generateETag(data);

      const mockRequest = new NextRequest('http://localhost/api/test', {
        headers: {
          'If-None-Match': etag,
        },
      });

      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json(data))
      );

      const middleware = cacheManager.withCache({ ttl: 60000 });
      const response = await middleware(mockRequest, mockHandler);

      expect(response.status).toBe(304); // Not Modified
    });

    it('should not cache error responses', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ error: 'Failed' }, { status: 500 }))
      );

      const middleware = cacheManager.withCache({ ttl: 60000 });

      await middleware(mockRequest, mockHandler);
      await middleware(mockRequest, mockHandler);

      // Handler should be called both times (no caching of errors)
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should add cache headers to responses', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'test' }))
      );

      const middleware = cacheManager.withCache({ ttl: 60000 });
      const response = await middleware(mockRequest, mockHandler);

      expect(response.headers.get('ETag')).toBeDefined();
      expect(response.headers.get('Cache-Control')).toBeDefined();
    });

    it('should generate unique cache keys for different URLs', async () => {
      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'test' }))
      );

      const middleware = cacheManager.withCache({ ttl: 60000 });

      const request1 = new NextRequest('http://localhost/api/endpoint1');
      const request2 = new NextRequest('http://localhost/api/endpoint2');

      await middleware(request1, mockHandler);
      await middleware(request2, mockHandler);

      // Both should call handler (different cache keys)
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });

    it('should consider query parameters in cache key', async () => {
      const mockHandler = jest.fn((url) =>
        Promise.resolve(NextResponse.json({ data: url }))
      );

      const middleware = cacheManager.withCache({ ttl: 60000 });

      const request1 = new NextRequest('http://localhost/api/test?param=1');
      const request2 = new NextRequest('http://localhost/api/test?param=2');

      await middleware(request1, mockHandler);
      await middleware(request2, mockHandler);

      // Both should call handler (different query params)
      expect(mockHandler).toHaveBeenCalledTimes(2);
    });
  });

  describe('Rate Limit Middleware', () => {
    it('should apply rate limiting to requests', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'success' }))
      );

      const middleware = cacheManager.withRateLimit({
        maxRequests: 3,
        windowMs: 60000,
      });

      // Make 3 requests (should all succeed)
      for (let i = 0; i < 3; i++) {
        const response = await middleware(mockRequest, mockHandler);
        expect(response.status).not.toBe(429);
      }

      // 4th request should be rate limited
      const blockedResponse = await middleware(mockRequest, mockHandler);
      expect(blockedResponse.status).toBe(429);
    });

    it('should add rate limit headers to responses', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'success' }))
      );

      const middleware = cacheManager.withRateLimit({
        maxRequests: 10,
        windowMs: 60000,
      });

      const response = await middleware(mockRequest, mockHandler);

      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should include Retry-After header when rate limited', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'success' }))
      );

      const middleware = cacheManager.withRateLimit({
        maxRequests: 1,
        windowMs: 60000,
      });

      // First request succeeds
      await middleware(mockRequest, mockHandler);

      // Second request is rate limited
      const response = await middleware(mockRequest, mockHandler);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should use custom key generator if provided', async () => {
      const customKeyGen = jest.fn((req: NextRequest) => {
        const url = new URL(req.url);
        return url.searchParams.get('userId') || 'default';
      });

      const middleware = cacheManager.withRateLimit({
        maxRequests: 2,
        windowMs: 60000,
        keyGenerator: customKeyGen,
      });

      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'success' }))
      );

      const request1 = new NextRequest(
        'http://localhost/api/test?userId=user1'
      );
      const request2 = new NextRequest(
        'http://localhost/api/test?userId=user2'
      );

      // Each user gets their own rate limit
      await middleware(request1, mockHandler);
      await middleware(request1, mockHandler);
      await middleware(request2, mockHandler);

      expect(customKeyGen).toHaveBeenCalledTimes(3);

      // user1 should be rate limited
      const user1Blocked = await middleware(request1, mockHandler);
      expect(user1Blocked.status).toBe(429);

      // user2 should still be allowed
      const user2Allowed = await middleware(request2, mockHandler);
      expect(user2Allowed.status).not.toBe(429);
    });
  });

  describe('Combined Caching and Rate Limiting', () => {
    it('should apply both caching and rate limiting', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn(() =>
        Promise.resolve(NextResponse.json({ data: 'success' }))
      );

      const rateLimitMiddleware = cacheManager.withRateLimit({
        maxRequests: 10,
        windowMs: 60000,
      });

      const cacheMiddleware = cacheManager.withCache({ ttl: 60000 });

      // Compose middlewares
      const composedMiddleware = async (
        req: NextRequest,
        handler: () => Promise<NextResponse>
      ) => {
        return rateLimitMiddleware(req, () => cacheMiddleware(req, handler));
      };

      // First call - rate limit + cache miss
      const response1 = await composedMiddleware(mockRequest, mockHandler);
      expect(mockHandler).toHaveBeenCalledTimes(1);
      expect(response1.headers.get('X-RateLimit-Remaining')).toBeDefined();

      // Second call - rate limit + cache hit
      const response2 = await composedMiddleware(mockRequest, mockHandler);
      expect(mockHandler).toHaveBeenCalledTimes(1); // Still only called once
      expect(response2.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large cache without performance degradation', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`key-${i}`, { data: `test-${i}` }, 60000);
      }

      const duration = Date.now() - start;

      // Should complete quickly even with large cache
      expect(duration).toBeLessThan(1000);
    });

    it('should efficiently lookup cached items', () => {
      // Populate cache
      for (let i = 0; i < 1000; i++) {
        cacheManager.set(`key-${i}`, { data: `test-${i}` }, 60000);
      }

      const start = Date.now();

      // Lookup 100 items
      for (let i = 0; i < 100; i++) {
        cacheManager.get(`key-${i}`);
      }

      const duration = Date.now() - start;

      // Lookups should be O(1) and very fast
      expect(duration).toBeLessThan(100);
    });

    it('should clean up expired entries', async () => {
      // Add entries with short TTL
      for (let i = 0; i < 100; i++) {
        cacheManager.set(`expire-${i}`, { data: `test-${i}` }, 100);
      }

      const statsBefore = cacheManager.getCacheStats();
      expect(statsBefore.size).toBe(100);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger cleanup by attempting to get entries
      for (let i = 0; i < 100; i++) {
        cacheManager.get(`expire-${i}`);
      }

      const statsAfter = cacheManager.getCacheStats();
      expect(statsAfter.size).toBeLessThan(100);
    });
  });
});
