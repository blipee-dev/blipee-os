import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { CacheService } from '../service';
import { AICache } from '../ai-cache';
import { DBCache } from '../db-cache';
import { APICache } from '../api-cache';
import { SessionCache } from '../session-cache';

// Mock Redis client
jest.mock('../redis-client', () => ({
  redisClient: {
    getClient: jest.fn().mockResolvedValue({
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      pipeline: jest.fn().mockReturnValue({
        sadd: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      smembers: jest.fn(),
      flushdb: jest.fn(),
      ping: jest.fn().mockResolvedValue('PONG'),
      set: jest.fn(),
    }),
    execute: jest.fn(async (callback) => {
      const client = await jest.mocked(require('../redis-client').redisClient.getClient)();
      return callback(client);
    }),
    isReady: jest.fn().mockReturnValue(true),
  },
}));

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    cacheService = new CacheService();
    mockClient = await require('../redis-client').redisClient.getClient();
  });

  describe('get/set operations', () => {
    it('should set and get a value', async () => {
      const key = 'test-key';
      const value = { data: 'test-value' };
      
      mockClient.setex.mockResolvedValueOnce('OK');
      mockClient.get.mockResolvedValueOnce(JSON.stringify(value));

      const setResult = await cacheService.set(key, value);
      expect(setResult).toBe(true);
      expect(mockClient.setex).toHaveBeenCalledWith(key, expect.any(Number), JSON.stringify(value));

      const getResult = await cacheService.get(key);
      expect(getResult).toEqual(value);
    });

    it('should handle cache miss', async () => {
      mockClient.get.mockResolvedValueOnce(null);

      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should compress large values', async () => {
      const key = 'large-value';
      const largeValue = { data: 'x'.repeat(2000) };
      
      mockClient.setex.mockResolvedValueOnce('OK');

      await cacheService.set(key, largeValue, { compress: true });
      
      const call = mockClient.setex.mock.calls[0];
      expect(call[2]).toContain('COMPRESSED:');
    });
  });

  describe('getOrSet pattern', () => {
    it('should return cached value if exists', async () => {
      const key = 'cached-key';
      const value = { data: 'cached' };
      
      mockClient.get.mockResolvedValueOnce(JSON.stringify(value));

      const factory = jest.fn();
      const result = await cacheService.getOrSet(key, factory);

      expect(result).toEqual(value);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should call factory and cache result on miss', async () => {
      const key = 'new-key';
      const value = { data: 'generated' };
      
      mockClient.get.mockResolvedValue(null);
      mockClient.set.mockResolvedValueOnce('OK');
      mockClient.setex.mockResolvedValueOnce('OK');

      const factory = jest.fn().mockResolvedValue(value);
      const result = await cacheService.getOrSet(key, factory);

      expect(result).toEqual(value);
      expect(factory).toHaveBeenCalled();
      expect(mockClient.setex).toHaveBeenCalled();
    });
  });

  describe('cache invalidation', () => {
    it('should delete by pattern', async () => {
      const pattern = 'user:*';
      const keys = ['user:1', 'user:2', 'user:3'];
      
      mockClient.keys.mockResolvedValueOnce(keys);
      mockClient.pipeline.mockReturnValue({
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const count = await cacheService.deletePattern(pattern);
      
      expect(count).toBe(keys.length);
      expect(mockClient.keys).toHaveBeenCalledWith(pattern);
    });

    it('should invalidate by tags', async () => {
      const tags = ['user-data', 'org-data'];
      const taggedKeys = ['key1', 'key2'];
      
      mockClient.smembers.mockResolvedValue(taggedKeys);
      mockClient.pipeline.mockReturnValue({
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });

      const count = await cacheService.invalidateByTags(tags);
      
      expect(count).toBe(taggedKeys.length * tags.length);
      expect(mockClient.smembers).toHaveBeenCalledTimes(tags.length);
    });
  });

  describe('statistics', () => {
    it('should track hit rate', async () => {
      mockClient.get
        .mockResolvedValueOnce(JSON.stringify({ data: 'hit' }))
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(JSON.stringify({ data: 'hit' }));

      await cacheService.get('key1'); // hit
      await cacheService.get('key2'); // miss
      await cacheService.get('key3'); // hit

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });
  });
});

describe('AICache', () => {
  let aiCache: AICache;
  let mockClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    aiCache = new AICache();
    mockClient = await require('../redis-client').redisClient.getClient();
  });

  it('should cache AI responses', async () => {
    const prompt = 'What is sustainability?';
    const response = {
      content: 'Sustainability is...',
      provider: 'openai',
      timestamp: new Date().toISOString(),
    };

    mockClient.setex.mockResolvedValueOnce('OK');

    const result = await aiCache.cacheResponse(prompt, response, 'openai');
    expect(result).toBe(true);
  });

  it('should retrieve cached AI responses', async () => {
    const prompt = 'What is ESG?';
    const cachedResponse = {
      content: 'ESG stands for...',
      provider: 'deepseek',
      timestamp: new Date().toISOString(),
    };

    mockClient.get.mockResolvedValueOnce(JSON.stringify(cachedResponse));

    const result = await aiCache.getCachedResponse(prompt, 'deepseek');
    expect(result).toBeDefined();
    expect(result?.content).toBe(cachedResponse.content);
    expect(result?.cached).toBe(true);
  });

  it('should cache conversation context', async () => {
    const conversationId = 'conv-123';
    const context = {
      messages: [],
      organizationId: 'org-456',
    };

    mockClient.setex.mockResolvedValueOnce('OK');

    const result = await aiCache.cacheContext(conversationId, context);
    expect(result).toBe(true);
  });
});

describe('DBCache', () => {
  let dbCache: DBCache;
  let mockClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    dbCache = new DBCache();
    mockClient = await require('../redis-client').redisClient.getClient();
  });

  it('should cache query results', async () => {
    const sql = 'SELECT * FROM users WHERE org_id = $1';
    const params = ['org-123'];
    const results = [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }];

    mockClient.setex.mockResolvedValueOnce('OK');

    const result = await dbCache.cacheQuery(sql, params, results);
    expect(result).toBe(true);
  });

  it('should retrieve cached query results', async () => {
    const sql = 'SELECT * FROM emissions';
    const cachedResults = {
      rows: [{ id: 1, value: 100 }],
      rowCount: 1,
    };

    mockClient.get.mockResolvedValueOnce(JSON.stringify(cachedResults));

    const result = await dbCache.getCachedQuery(sql);
    expect(result).toBeDefined();
    expect(result?.cached).toBe(true);
    expect(result?.rows).toEqual(cachedResults.rows);
  });

  it('should cache entities', async () => {
    const entity = { id: 'user-123', name: 'Test User' };
    
    mockClient.setex.mockResolvedValueOnce('OK');

    const result = await dbCache.cacheEntity('users', entity.id, entity);
    expect(result).toBe(true);
  });
});

describe('APICache', () => {
  let apiCache: APICache;
  let mockClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    apiCache = new APICache();
    mockClient = await require('../redis-client').redisClient.getClient();
  });

  it('should cache API responses', async () => {
    const response = {
      data: { users: [] },
      status: 200,
    };

    mockClient.setex.mockResolvedValueOnce('OK');

    const result = await apiCache.cacheResponse('GET', '/api/users', response);
    expect(result).toBe(true);
  });

  it('should handle rate limiting', async () => {
    mockClient.get.mockResolvedValueOnce(null);
    mockClient.setex.mockResolvedValueOnce('OK');

    const result = await apiCache.checkRateLimit('user-123', '/api/test', 10, 60);
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });
});

describe('SessionCache', () => {
  let sessionCache: SessionCache;
  let mockClient: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    sessionCache = new SessionCache();
    mockClient = await require('../redis-client').redisClient.getClient();
  });

  it('should store and retrieve sessions', async () => {
    const session = {
      userId: 'user-123',
      email: 'user@example.com',
      organizationId: 'org-456',
      lastActivity: new Date().toISOString(),
    };

    mockClient.setex.mockResolvedValueOnce('OK');
    mockClient.get.mockResolvedValueOnce(JSON.stringify(session));

    await sessionCache.setSession(session.userId, session);
    const retrieved = await sessionCache.getSession(session.userId);

    expect(retrieved).toEqual(session);
  });

  it('should validate session freshness', async () => {
    const freshSession = {
      userId: 'user-123',
      email: 'user@example.com',
      lastActivity: new Date().toISOString(),
    };

    mockClient.get.mockResolvedValueOnce(JSON.stringify(freshSession));

    const isValid = await sessionCache.isSessionValid(freshSession.userId);
    expect(isValid).toBe(true);
  });
});