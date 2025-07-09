import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CacheService } from '../cache-service';
import { RedisClient } from '../redis';

// Mock Redis client
jest.mock('../redis', () => ({
  RedisClient: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    scan: jest.fn(),
    mget: jest.fn(),
    mset: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
  }))
}));

describe('Cache Service', () => {
  let cacheService: CacheService;
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    cacheService = new CacheService();
    mockRedisClient = (cacheService as any).redis;
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      const key = 'test-key';
      const value = { data: 'test value', count: 42 };

      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.get.mockResolvedValue(JSON.stringify(value));

      // Set value
      await cacheService.set('namespace', key, value);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'namespace:test-key',
        JSON.stringify(value),
        'EX',
        3600
      );

      // Get value
      const retrieved = await cacheService.get('namespace', key);
      expect(retrieved).toEqual(value);
    });

    it('should handle null values', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await cacheService.get('namespace', 'non-existent');
      expect(result).toBeNull();
    });

    it('should delete values', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      const result = await cacheService.delete('namespace', 'key');
      expect(result).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('namespace:key');
    });

    it('should check existence', async () => {
      mockRedisClient.exists.mockResolvedValue(1);

      const exists = await cacheService.exists('namespace', 'key');
      expect(exists).toBe(true);
    });
  });

  describe('TTL Management', () => {
    it('should set custom TTL', async () => {
      const customTTL = 7200; // 2 hours
      mockRedisClient.set.mockResolvedValue('OK');

      await cacheService.set('namespace', 'key', 'value', { ttl: customTTL });
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'namespace:key',
        '"value"',
        'EX',
        customTTL
      );
    });

    it('should get remaining TTL', async () => {
      mockRedisClient.ttl.mockResolvedValue(1800);

      const ttl = await cacheService.getTTL('namespace', 'key');
      expect(ttl).toBe(1800);
    });

    it('should extend TTL', async () => {
      mockRedisClient.expire.mockResolvedValue(1);

      const result = await cacheService.expire('namespace', 'key', 3600);
      expect(result).toBe(true);
      expect(mockRedisClient.expire).toHaveBeenCalledWith('namespace:key', 3600);
    });
  });

  describe('Tag-based Operations', () => {
    it('should tag cache entries', async () => {
      const tags = ['user:123', 'org:456'];
      mockRedisClient.set.mockResolvedValue('OK');

      await cacheService.set('namespace', 'key', 'value', { tags });

      // Should set the main key and tag references
      expect(mockRedisClient.set).toHaveBeenCalledTimes(1 + tags.length);
    });

    it('should invalidate by tag', async () => {
      const tag = 'user:123';
      const taggedKeys = ['namespace:key1', 'namespace:key2'];
      
      mockRedisClient.keys.mockResolvedValue(taggedKeys);
      mockRedisClient.del.mockResolvedValue(taggedKeys.length);

      await cacheService.invalidateByTag(tag);

      expect(mockRedisClient.keys).toHaveBeenCalledWith(`tag:${tag}:*`);
      expect(mockRedisClient.del).toHaveBeenCalledWith(...taggedKeys);
    });

    it('should clear namespace', async () => {
      const keys = ['namespace:key1', 'namespace:key2', 'namespace:key3'];
      mockRedisClient.keys.mockResolvedValue(keys);
      mockRedisClient.del.mockResolvedValue(keys.length);

      const count = await cacheService.clear('namespace');

      expect(count).toBe(3);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('namespace:*');
      expect(mockRedisClient.del).toHaveBeenCalledWith(...keys);
    });
  });

  describe('Remember Pattern', () => {
    it('should return cached value if exists', async () => {
      const cachedValue = { data: 'cached' };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedValue));

      const generator = jest.fn();
      const result = await cacheService.remember(
        'namespace',
        'key',
        generator
      );

      expect(result).toEqual(cachedValue);
      expect(generator).not.toHaveBeenCalled();
    });

    it('should generate and cache value if not exists', async () => {
      const generatedValue = { data: 'generated' };
      mockRedisClient.get.mockResolvedValue(null);
      mockRedisClient.set.mockResolvedValue('OK');

      const generator = jest.fn().mockResolvedValue(generatedValue);
      const result = await cacheService.remember(
        'namespace',
        'key',
        generator
      );

      expect(result).toEqual(generatedValue);
      expect(generator).toHaveBeenCalled();
      expect(mockRedisClient.set).toHaveBeenCalled();
    });
  });

  describe('Batch Operations', () => {
    it('should get multiple values', async () => {
      const keys = ['key1', 'key2', 'key3'];
      const values = [
        JSON.stringify({ id: 1 }),
        null,
        JSON.stringify({ id: 3 })
      ];
      
      mockRedisClient.mget.mockResolvedValue(values);

      const results = await cacheService.mget('namespace', keys);

      expect(results).toEqual([
        { id: 1 },
        null,
        { id: 3 }
      ]);
    });

    it('should set multiple values', async () => {
      const entries = {
        key1: { data: 1 },
        key2: { data: 2 }
      };

      mockRedisClient.mset.mockResolvedValue('OK');

      await cacheService.mset('namespace', entries);

      const expectedArgs = [];
      for (const [key, value] of Object.entries(entries)) {
        expectedArgs.push(`namespace:${key}`, JSON.stringify(value));
      }

      expect(mockRedisClient.mset).toHaveBeenCalledWith(...expectedArgs);
    });
  });

  describe('Cache Warming', () => {
    it('should warm cache with provided data', async () => {
      const warmData = [
        { key: 'popular1', value: { data: 'frequently accessed' }, ttl: 7200 },
        { key: 'popular2', value: { data: 'also popular' }, ttl: 3600 }
      ];

      mockRedisClient.set.mockResolvedValue('OK');

      await cacheService.warmCache('namespace', warmData);

      expect(mockRedisClient.set).toHaveBeenCalledTimes(warmData.length);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'namespace:popular1',
        JSON.stringify(warmData[0].value),
        'EX',
        warmData[0].ttl
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Connection refused'));

      const result = await cacheService.get('namespace', 'key');
      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      mockRedisClient.get.mockResolvedValue('invalid json');

      const result = await cacheService.get('namespace', 'key');
      expect(result).toBeNull();
    });

    it('should continue after failed deletes', async () => {
      mockRedisClient.del.mockRejectedValue(new Error('Delete failed'));

      const result = await cacheService.delete('namespace', 'key');
      expect(result).toBe(false);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache operations', async () => {
      // Simulate some operations
      mockRedisClient.get.mockResolvedValueOnce(null); // Miss
      await cacheService.get('namespace', 'key1');

      mockRedisClient.get.mockResolvedValueOnce('"value"'); // Hit
      await cacheService.get('namespace', 'key2');

      const stats = cacheService.getStats();
      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('hitRate');
    });
  });
});