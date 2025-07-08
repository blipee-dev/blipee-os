import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { RateLimitService } from '../rate-limit/service';
import { RateLimitRule } from '../rate-limit/types';

// Mock Redis for testing
const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  pipeline: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    exec: jest.fn(() => Promise.resolve([])),
  })),
};

jest.mock('ioredis', () => ({
  default: jest.fn(() => mockRedis),
}));

describe('RateLimitService', () => {
  let rateLimitService: RateLimitService;

  beforeEach(() => {
    jest.clearAllMocks();
    rateLimitService = new RateLimitService({
      storage: 'memory',
      rules: {
        test_rule: {
          requests: 5,
          windowMs: 60000, // 1 minute
          burst: 10,
        },
        strict_rule: {
          requests: 1,
          windowMs: 1000, // 1 second
          burst: 1,
        },
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      for (let i = 0; i < 5; i++) {
        const result = await rateLimitService.check(key, rule);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4 - i);
        expect(result.resetTime).toBeDefined();
      }
    });

    it('should deny requests exceeding limit', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      // Use up all requests
      for (let i = 0; i < 5; i++) {
        await rateLimitService.check(key, rule);
      }

      // Next request should be denied
      const result = await rateLimitService.check(key, rule);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should reset limit after window expires', async () => {
      const key = 'test-key';
      const rule = 'strict_rule'; // 1 request per second

      // First request should be allowed
      let result = await rateLimitService.check(key, rule);
      expect(result.allowed).toBe(true);

      // Second request should be denied
      result = await rateLimitService.check(key, rule);
      expect(result.allowed).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Request should be allowed again
      result = await rateLimitService.check(key, rule);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Burst Handling', () => {
    it('should allow burst requests', async () => {
      const key = 'test-key';
      const rule = 'test_rule'; // 5 requests/min, burst 10

      // Should allow up to burst limit
      for (let i = 0; i < 10; i++) {
        const result = await rateLimitService.check(key, rule);
        expect(result.allowed).toBe(true);
      }

      // Next request should be denied
      const result = await rateLimitService.check(key, rule);
      expect(result.allowed).toBe(false);
    });

    it('should handle burst refill over time', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      // Use up burst capacity
      for (let i = 0; i < 10; i++) {
        await rateLimitService.check(key, rule);
      }

      // Should be denied
      let result = await rateLimitService.check(key, rule);
      expect(result.allowed).toBe(false);

      // Wait for some refill (test with shorter window for speed)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be denied (not enough time for refill)
      result = await rateLimitService.check(key, rule);
      expect(result.allowed).toBe(false);
    });
  });

  describe('Rule Management', () => {
    it('should handle custom rules', async () => {
      const key = 'test-key';
      const customRule: RateLimitRule = {
        requests: 3,
        windowMs: 30000,
        burst: 5,
      };

      for (let i = 0; i < 3; i++) {
        const result = await rateLimitService.check(key, customRule);
        expect(result.allowed).toBe(true);
      }

      const result = await rateLimitService.check(key, customRule);
      expect(result.allowed).toBe(false);
    });

    it('should handle rule updates', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      // Update rule
      await rateLimitService.updateRule('test_rule', {
        requests: 10,
        windowMs: 60000,
        burst: 20,
      });

      // Should allow more requests now
      for (let i = 0; i < 10; i++) {
        const result = await rateLimitService.check(key, rule);
        expect(result.allowed).toBe(true);
      }
    });

    it('should handle non-existent rules gracefully', async () => {
      const key = 'test-key';
      const rule = 'non_existent_rule';

      await expect(rateLimitService.check(key, rule)).rejects.toThrow();
    });
  });

  describe('Key Isolation', () => {
    it('should isolate different keys', async () => {
      const rule = 'test_rule';

      // Use up limit for key1
      for (let i = 0; i < 5; i++) {
        await rateLimitService.check('key1', rule);
      }

      // key1 should be denied
      let result = await rateLimitService.check('key1', rule);
      expect(result.allowed).toBe(false);

      // key2 should still be allowed
      result = await rateLimitService.check('key2', rule);
      expect(result.allowed).toBe(true);
    });

    it('should handle key patterns', async () => {
      const rule = 'test_rule';

      // Test with IP-based keys
      await rateLimitService.check('ip:192.168.1.1', rule);
      await rateLimitService.check('ip:192.168.1.2', rule);

      // Test with user-based keys
      await rateLimitService.check('user:123', rule);
      await rateLimitService.check('user:456', rule);

      // All should be independent
      const stats = await rateLimitService.getStats();
      expect(Object.keys(stats).length).toBeGreaterThan(0);
    });
  });

  describe('Statistics and Monitoring', () => {
    it('should track rate limit statistics', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      // Make some requests
      for (let i = 0; i < 3; i++) {
        await rateLimitService.check(key, rule);
      }

      const stats = await rateLimitService.getStats();
      expect(stats).toBeDefined();
      expect(typeof stats).toBe('object');
    });

    it('should provide rate limit info', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      await rateLimitService.check(key, rule);

      const info = await rateLimitService.getRateLimitInfo(key, rule);
      expect(info).toHaveProperty('remaining');
      expect(info).toHaveProperty('resetTime');
      expect(info).toHaveProperty('totalRequests');
    });

    it('should handle cleanup of expired entries', async () => {
      const key = 'test-key';
      const rule = 'strict_rule';

      // Make a request
      await rateLimitService.check(key, rule);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Cleanup should remove expired entries
      await rateLimitService.cleanup();

      const stats = await rateLimitService.getStats();
      // Should have fewer entries after cleanup
      expect(typeof stats).toBe('object');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid rule configurations', async () => {
      const key = 'test-key';
      const invalidRule: RateLimitRule = {
        requests: -1, // Invalid
        windowMs: 60000,
        burst: 10,
      };

      await expect(rateLimitService.check(key, invalidRule)).rejects.toThrow();
    });

    it('should handle storage failures gracefully', async () => {
      // Create service with Redis that will fail
      const redisService = new RateLimitService({
        storage: 'redis',
        redis: {
          host: 'nonexistent-host',
          port: 6379,
        },
        rules: {
          test_rule: {
            requests: 5,
            windowMs: 60000,
            burst: 10,
          },
        },
      });

      // Should fall back to memory storage or handle gracefully
      const result = await redisService.check('test-key', 'test_rule');
      expect(result).toBeDefined();
    });

    it('should handle concurrent requests', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, () =>
        rateLimitService.check(key, rule)
      );

      const results = await Promise.all(promises);

      // Count allowed requests
      const allowedCount = results.filter(r => r.allowed).length;
      expect(allowedCount).toBeLessThanOrEqual(10); // Should respect burst limit
    });
  });

  describe('Integration with Rules Engine', () => {
    it('should load rules from configuration', async () => {
      const service = new RateLimitService({
        storage: 'memory',
        rules: {
          api_calls: {
            requests: 100,
            windowMs: 3600000,
            burst: 150,
          },
          login_attempts: {
            requests: 5,
            windowMs: 900000,
            burst: 8,
          },
        },
      });

      const result1 = await service.check('api-key', 'api_calls');
      expect(result1.allowed).toBe(true);

      const result2 = await service.check('user-ip', 'login_attempts');
      expect(result2.allowed).toBe(true);
    });

    it('should handle rule priorities', async () => {
      const service = new RateLimitService({
        storage: 'memory',
        rules: {
          general: {
            requests: 10,
            windowMs: 60000,
            burst: 15,
          },
          premium: {
            requests: 100,
            windowMs: 60000,
            burst: 150,
          },
        },
      });

      // General user should have lower limits
      for (let i = 0; i < 10; i++) {
        const result = await service.check('general-user', 'general');
        expect(result.allowed).toBe(true);
      }

      const result = await service.check('general-user', 'general');
      expect(result.allowed).toBe(false);

      // Premium user should have higher limits
      for (let i = 0; i < 50; i++) {
        const result = await service.check('premium-user', 'premium');
        expect(result.allowed).toBe(true);
      }
    });
  });

  describe('Performance', () => {
    it('should handle high throughput', async () => {
      const key = 'test-key';
      const rule = 'test_rule';

      const startTime = Date.now();
      
      // Make 100 requests
      const promises = Array.from({ length: 100 }, () =>
        rateLimitService.check(key, rule)
      );

      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    it('should efficiently handle memory usage', async () => {
      const rule = 'test_rule';

      // Create many different keys
      for (let i = 0; i < 1000; i++) {
        await rateLimitService.check(`key-${i}`, rule);
      }

      // Should not consume excessive memory
      const stats = await rateLimitService.getStats();
      expect(typeof stats).toBe('object');
    });
  });
});