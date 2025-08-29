/**
 * Simple Cache Implementation for Autonomous Agents
 * 
 * A lightweight in-memory cache to avoid complex dependencies during development.
 * In production, this would be replaced with proper Redis cache.
 */

export interface CacheOptions {
  ttl?: number; // seconds
}

export interface CachedItem<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CachedItem<any>> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = (options?.ttl || 3600) * 1000; // Convert to milliseconds
    const expiresAt = Date.now() + ttl;
    
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const keys = Array.from(this.cache.keys());
    const regex = new RegExp(pattern.replace('*', '.*'));
    
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const simpleCache = new SimpleCache();