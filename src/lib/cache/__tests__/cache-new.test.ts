import { CacheService } from '../service';
import { mockRedisClient } from '@/test/setup/mocks';
import { jest } from '@jest/globals';

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

      mockRedisClient.set.mockResolvedValueOnce('OK');
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(value));

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
      expect(mockRedisClient.set).toHaveBeenCalled();
      expect(mockRedisClient.get).toHaveBeenCalledWith(key);
    });

    it('should return null for non-existent keys', async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await cacheService.get('non-existent');
      expect(result).toBeNull();
    });

    it('should delete keys', async () => {
      mockRedisClient.del.mockResolvedValueOnce(1);

      const deleted = await cacheService.delete('key');
      expect(deleted).toBe(true);
      expect(mockRedisClient.del).toHaveBeenCalledWith('key');
    });

    it('should check if key exists', async () => {
      mockRedisClient.exists.mockResolvedValueOnce(1);

      const exists = await cacheService.exists('key');
      expect(exists).toBe(true);
    });

    it('should handle JSON parsing errors gracefully', async () => {
      mockRedisClient.get.mockResolvedValueOnce('invalid-json');

      const result = await cacheService.get('key');
      expect(result).toBe('invalid-json');
    });
  });

  describe('TTL Operations', () => {
    it('should set values with TTL', async () => {
      mockRedisClient.set.mockResolvedValueOnce('OK');

      await cacheService.set('key', 'value', 60);
      expect(mockRedisClient.set).toHaveBeenCalledWith(
        'key',
        JSON.stringify('value'),
        'EX',
        60
      );
    });

    it('should get TTL for key', async () => {
      mockRedisClient.ttl.mockResolvedValueOnce(120);

      const ttl = await cacheService.ttl('key');
      expect(ttl).toBe(120);
    });

    it('should wrap expensive functions', async () => {
      const expensiveFunc = jest.fn().mockResolvedValue('result');
      mockRedisClient.get.mockResolvedValueOnce(null);
      mockRedisClient.set.mockResolvedValueOnce('OK');

      const result = await cacheService.wrap('key', expensiveFunc, 60);
      expect(result).toBe('result');
      expect(expensiveFunc).toHaveBeenCalled();

      // Second call should use cache
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify('result'));
      const cachedResult = await cacheService.wrap('key', expensiveFunc, 60);
      expect(cachedResult).toBe('result');
      expect(expensiveFunc).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pattern Operations', () => {
    it('should find keys by pattern', async () => {
      mockRedisClient.keys.mockResolvedValueOnce(['key1', 'key2']);

      const keys = await cacheService.keys('key*');
      expect(keys).toEqual(['key1', 'key2']);
    });

    it('should delete by pattern', async () => {
      mockRedisClient.keys.mockResolvedValueOnce(['key1', 'key2']);
      mockRedisClient.del.mockResolvedValue(2);

      const deleted = await cacheService.deletePattern('key*');
      expect(deleted).toBe(2);
    });

    it('should clear all cache', async () => {
      mockRedisClient.flushdb.mockResolvedValueOnce('OK');

      await cacheService.clear();
      expect(mockRedisClient.flushdb).toHaveBeenCalled();
    });
  });

  describe('Hash Operations', () => {
    it('should set and get hash fields', async () => {
      mockRedisClient.hset.mockResolvedValueOnce(1);
      mockRedisClient.hget.mockResolvedValueOnce('value');

      await cacheService.hset('hash', 'field', 'value');
      const result = await cacheService.hget('hash', 'field');

      expect(result).toBe('value');
    });

    it('should get all hash fields', async () => {
      mockRedisClient.hgetall.mockResolvedValueOnce({
        field1: 'value1',
        field2: 'value2',
      });

      const result = await cacheService.hgetall('hash');
      expect(result).toEqual({
        field1: 'value1',
        field2: 'value2',
      });
    });

    it('should delete hash fields', async () => {
      mockRedisClient.hdel.mockResolvedValueOnce(1);

      const deleted = await cacheService.hdel('hash', 'field');
      expect(deleted).toBe(1);
    });
  });

  describe('Set Operations', () => {
    it('should add and remove from sets', async () => {
      mockRedisClient.sadd.mockResolvedValueOnce(1);
      mockRedisClient.srem.mockResolvedValueOnce(1);

      await cacheService.sadd('set', 'member');
      await cacheService.srem('set', 'member');

      expect(mockRedisClient.sadd).toHaveBeenCalledWith('set', 'member');
      expect(mockRedisClient.srem).toHaveBeenCalledWith('set', 'member');
    });

    it('should get set members', async () => {
      mockRedisClient.smembers.mockResolvedValueOnce(['member1', 'member2']);

      const members = await cacheService.smembers('set');
      expect(members).toEqual(['member1', 'member2']);
    });

    it('should check set membership', async () => {
      mockRedisClient.sismember.mockResolvedValueOnce(1);

      const isMember = await cacheService.sismember('set', 'member');
      expect(isMember).toBe(true);
    });
  });

  describe('List Operations', () => {
    it('should push and pop from lists', async () => {
      mockRedisClient.lpush = jest.fn().mockResolvedValueOnce(1);
      mockRedisClient.rpop = jest.fn().mockResolvedValueOnce('value');

      await cacheService.lpush('list', 'value');
      const result = await cacheService.rpop('list');

      expect(result).toBe('value');
    });

    it('should get list range', async () => {
      mockRedisClient.lrange = jest.fn().mockResolvedValueOnce(['val1', 'val2']);

      const range = await cacheService.lrange('list', 0, -1);
      expect(range).toEqual(['val1', 'val2']);
    });
  });

  describe('Sorted Set Operations', () => {
    it('should add to sorted sets', async () => {
      mockRedisClient.zadd.mockResolvedValueOnce(1);

      await cacheService.zadd('zset', 100, 'member');
      expect(mockRedisClient.zadd).toHaveBeenCalledWith('zset', 100, 'member');
    });

    it('should get sorted set range', async () => {
      mockRedisClient.zrange.mockResolvedValueOnce(['member1', 'member2']);

      const range = await cacheService.zrange('zset', 0, -1);
      expect(range).toEqual(['member1', 'member2']);
    });

    it('should get reverse sorted set range', async () => {
      mockRedisClient.zrevrange.mockResolvedValueOnce(['member2', 'member1']);

      const range = await cacheService.zrevrange('zset', 0, -1);
      expect(range).toEqual(['member2', 'member1']);
    });
  });

  describe('Atomic Operations', () => {
    it('should increment values', async () => {
      mockRedisClient.incr.mockResolvedValueOnce(1);

      const result = await cacheService.incr('counter');
      expect(result).toBe(1);
    });

    it('should decrement values', async () => {
      mockRedisClient.decr.mockResolvedValueOnce(0);

      const result = await cacheService.decr('counter');
      expect(result).toBe(0);
    });

    it('should increment by value', async () => {
      mockRedisClient.incrby = jest.fn().mockResolvedValueOnce(10);

      const result = await cacheService.incrby('counter', 10);
      expect(result).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors', async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error('Connection error'));

      const result = await cacheService.get('key');
      expect(result).toBeNull();
    });

    it('should handle set errors', async () => {
      mockRedisClient.set.mockRejectedValueOnce(new Error('Set error'));

      const result = await cacheService.set('key', 'value');
      expect(result).toBe(false);
    });

    it('should handle delete errors', async () => {
      mockRedisClient.del.mockRejectedValueOnce(new Error('Delete error'));

      const result = await cacheService.delete('key');
      expect(result).toBe(false);
    });
  });

  describe('Memory Cache Fallback', () => {
    it('should use memory cache when Redis is unavailable', async () => {
      // Simulate Redis failure
      const service = new CacheService();
      (service as any).redis = null;
      (service as any).isRedisAvailable = false;

      await service.set('memory-key', 'memory-value');
      const result = await service.get('memory-key');
      expect(result).toBe('memory-value');

      await service.delete('memory-key');
      const deleted = await service.get('memory-key');
      expect(deleted).toBeNull();
    });

    it('should handle memory cache expiration', async () => {
      jest.useFakeTimers();
      
      const service = new CacheService();
      (service as any).redis = null;
      (service as any).isRedisAvailable = false;

      await service.set('expire-key', 'value', 1); // 1 second TTL
      
      const immediate = await service.get('expire-key');
      expect(immediate).toBe('value');

      jest.advanceTimersByTime(2000); // Advance 2 seconds
      
      const expired = await service.get('expire-key');
      expect(expired).toBeNull();

      jest.useRealTimers();
    });
  });
});