import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Cache Service', () => {
  class CacheService {
    cache = new Map();
    stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    get(key) {
      const item = this.cache.get(key);
      
      if (!item) {
        this.stats.misses++;
        return null;
      }
      
      if (item.ttl && Date.now() > item.ttl) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return item.value;
    }
    
    set(key, value, ttlSeconds = null) {
      const item = {
        value,
        ttl: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        createdAt: Date.now()
      };
      
      this.cache.set(key, item);
      this.stats.sets++;
      return true;
    }
    
    delete(key) {
      const deleted = this.cache.delete(key);
      if (deleted) this.stats.deletes++;
      return deleted;
    }
    
    clear() {
      const size = this.cache.size;
      this.cache.clear();
      this.stats.deletes += size;
      return size;
    }
    
    has(key) {
      const item = this.cache.get(key);
      if (!item) return false;
      
      if (item.ttl && Date.now() > item.ttl) {
        this.cache.delete(key);
        return false;
      }
      
      return true;
    }
    
    size() {
      // Clean up expired entries
      for (const [key, item] of this.cache.entries()) {
        if (item.ttl && Date.now() > item.ttl) {
          this.cache.delete(key);
        }
      }
      
      return this.cache.size;
    }
    
    getStats() {
      const total = this.stats.hits + this.stats.misses;
      return {
        ...this.stats,
        hitRate: total > 0 ? this.stats.hits / total : 0,
        size: this.size()
      };
    }
  }
  
  let cache;
  
  beforeEach(() => {
    cache = new CacheService();
  });
  
  describe('Basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });
    
    it('should handle complex values', () => {
      const obj = { foo: 'bar', nested: { value: 42 } };
      cache.set('obj', obj);
      expect(cache.get('obj')).toEqual(obj);
    });
    
    it('should return null for missing keys', () => {
      expect(cache.get('missing')).toBeNull();
    });
    
    it('should check if key exists', () => {
      cache.set('exists', 'yes');
      expect(cache.has('exists')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });
  });
  
  describe('TTL functionality', () => {
    it('should expire values after TTL', () => {
      jest.useFakeTimers();
      
      cache.set('temp', 'value', 60); // 60 seconds TTL
      expect(cache.get('temp')).toBe('value');
      
      jest.advanceTimersByTime(61000); // 61 seconds
      expect(cache.get('temp')).toBeNull();
      
      jest.useRealTimers();
    });
    
    it('should not expire values without TTL', () => {
      jest.useFakeTimers();
      
      cache.set('permanent', 'value');
      jest.advanceTimersByTime(3600000); // 1 hour
      expect(cache.get('permanent')).toBe('value');
      
      jest.useRealTimers();
    });
  });
  
  describe('Delete operations', () => {
    it('should delete specific keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('value2');
    });
    
    it('should clear all values', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      
      const cleared = cache.clear();
      expect(cleared).toBe(3);
      expect(cache.size()).toBe(0);
    });
  });
  
  describe('Statistics', () => {
    it('should track cache hits and misses', () => {
      cache.set('key', 'value');
      
      cache.get('key'); // hit
      cache.get('missing'); // miss
      cache.get('key'); // hit
      
      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.667, 2);
    });
    
    it('should track sets and deletes', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.delete('key1');
      
      const stats = cache.getStats();
      expect(stats.sets).toBe(2);
      expect(stats.deletes).toBe(1);
    });
  });
  
  describe('Size management', () => {
    it('should report correct size', () => {
      expect(cache.size()).toBe(0);
      
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
      
      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });
    
    it('should clean expired entries when checking size', () => {
      jest.useFakeTimers();
      
      cache.set('temp1', 'value', 1); // 1 second TTL
      cache.set('temp2', 'value', 1);
      cache.set('permanent', 'value');
      
      expect(cache.size()).toBe(3);
      
      jest.advanceTimersByTime(2000); // 2 seconds
      expect(cache.size()).toBe(1); // Only permanent remains
      
      jest.useRealTimers();
    });
  });
});