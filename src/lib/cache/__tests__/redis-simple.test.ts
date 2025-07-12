import { CacheService } from '../service';
import { jest } from '@jest/globals';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    keys: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    flushdb: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }));
});

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new CacheService();
  });

  afterEach(async () => {
    await cacheService.disconnect();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const key = 'test-key';
      const value = { data: 'test-data' };

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete keys', async () => {
      const key = 'test-key';
      await cacheService.set(key, 'value');
      
      const deleted = await cacheService.delete(key);
      expect(deleted).toBe(true);

      const result = await cacheService.get(key);
      expect(result).toBeNull();
    });

    it('should check if key exists', async () => {
      const key = 'test-key';
      await cacheService.set(key, 'value');

      const exists = await cacheService.exists(key);
      expect(exists).toBe(true);

      await cacheService.delete(key);
      const existsAfterDelete = await cacheService.exists(key);
      expect(existsAfterDelete).toBe(false);
    });
  });

  describe('TTL Operations', () => {
    it('should set values with TTL', async () => {
      const key = 'ttl-key';
      const value = 'ttl-value';
      const ttl = 60; // 60 seconds

      await cacheService.set(key, value, ttl);
      const result = await cacheService.get(key);
      expect(result).toBe(value);
    });

    it('should wrap functions with caching', async () => {
      const expensiveFunction = jest.fn().mockResolvedValue('computed-value');
      const key = 'wrapped-key';

      // First call should execute the function
      const result1 = await cacheService.wrap(key, expensiveFunction, 60);
      expect(result1).toBe('computed-value');
      expect(expensiveFunction).toHaveBeenCalledTimes(1);

      // Second call should return cached value
      const result2 = await cacheService.wrap(key, expensiveFunction, 60);
      expect(result2).toBe('computed-value');
      expect(expensiveFunction).toHaveBeenCalledTimes(1); // Not called again
    });
  });

  describe('Pattern Operations', () => {
    it('should delete keys by pattern', async () => {
      await cacheService.set('pattern:1', 'value1');
      await cacheService.set('pattern:2', 'value2');
      await cacheService.set('other:1', 'value3');

      const deleted = await cacheService.deletePattern('pattern:*');
      expect(deleted).toBeGreaterThan(0);
    });

    it('should find keys by pattern', async () => {
      await cacheService.set('find:1', 'value1');
      await cacheService.set('find:2', 'value2');

      const keys = await cacheService.keys('find:*');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('find:1');
      expect(keys).toContain('find:2');
    });
  });

  describe('Memory Cache Fallback', () => {
    it('should use memory cache when Redis is not available', async () => {
      // Create a cache service that will fail Redis connection
      const memoryOnlyCache = new CacheService();
      
      // Simulate Redis failure
      (memoryOnlyCache as any).redis = null;
      (memoryOnlyCache as any).isRedisAvailable = false;

      // Should still work with memory cache
      await memoryOnlyCache.set('memory-key', 'memory-value');
      const result = await memoryOnlyCache.get('memory-key');
      expect(result).toBe('memory-value');
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis errors gracefully', async () => {
      // Force an error
      const mockRedis = (cacheService as any).redis;
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

      // Should not throw, returns null
      const result = await cacheService.get('error-key');
      expect(result).toBeNull();
    });

    it('should handle JSON parsing errors', async () => {
      const mockRedis = (cacheService as any).redis;
      mockRedis.get.mockResolvedValueOnce('invalid-json');

      const result = await cacheService.get('bad-json');
      expect(result).toBe('invalid-json'); // Returns raw value if JSON parse fails
    });
  });
});