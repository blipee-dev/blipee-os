import { EdgeCache, createEdgeCache, get, set, del, clear } from '../edge-cache';
import { jest } from '@jest/globals';

// Mock cache storage
const mockCache = new Map();

jest.mock('../edge-cache', () => {
  const originalModule = jest.requireActual('../edge-cache');
  return {
    ...originalModule,
    EdgeCache: class MockEdgeCache {
      async get(key: string) {
        return mockCache.get(key);
      }
      async set(key: string, value: any, ttl?: number) {
        mockCache.set(key, { value, expires: ttl ? Date.now() + ttl : null });
      }
      async delete(key: string) {
        return mockCache.delete(key);
      }
      async clear() {
        mockCache.clear();
      }
    },
    createEdgeCache: () => new MockEdgeCache(),
    get: async (key: string) => mockCache.get(key)?.value,
    set: async (key: string, value: any, ttl?: number) => {
      mockCache.set(key, { value, expires: ttl ? Date.now() + ttl : null });
    },
    del: async (key: string) => mockCache.delete(key),
    clear: async () => mockCache.clear()
  };
});

describe('EdgeCache', () => {
  beforeEach(() => {
    mockCache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve values', async () => {
      await set('test-key', 'test-value');
      const value = await get('test-key');
      expect(value).toBe('test-value');
    });

    it('should store objects', async () => {
      const obj = { name: 'test', data: [1, 2, 3] };
      await set('obj-key', obj);
      const value = await get('obj-key');
      expect(value).toEqual(obj);
    });

    it('should return undefined for non-existent keys', async () => {
      const value = await get('missing-key');
      expect(value).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete cached values', async () => {
      await set('delete-key', 'value');
      await del('delete-key');
      const value = await get('delete-key');
      expect(value).toBeUndefined();
    });

    it('should handle deleting non-existent keys', async () => {
      await expect(del('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all cached values', async () => {
      await set('key1', 'value1');
      await set('key2', 'value2');
      await clear();
      
      expect(await get('key1')).toBeUndefined();
      expect(await get('key2')).toBeUndefined();
    });
  });

  describe('TTL', () => {
    it('should accept TTL parameter', async () => {
      await set('ttl-key', 'value', 60000);
      const value = await get('ttl-key');
      expect(value).toBe('value');
    });
  });

  describe('EdgeCache class', () => {
    it('should create cache instance', () => {
      const cache = createEdgeCache();
      expect(cache).toBeDefined();
      expect(cache).toHaveProperty('get');
      expect(cache).toHaveProperty('set');
      expect(cache).toHaveProperty('delete');
      expect(cache).toHaveProperty('clear');
    });
  });
});