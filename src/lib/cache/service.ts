import { redisClient } from './redis-client';
import { cacheConfig, cacheKeys } from './config';
import { compress, decompress } from './compression';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  compress?: boolean; // Compress large values
  tags?: string[]; // Cache tags for bulk invalidation
}

export interface CacheStats {
  hits: number;
  misses: number;
  errors: number;
  hitRate: number;
  avgResponseTime: number;
}

/**
 * Main cache service with multiple strategies
 */
export class CacheService {
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    errors: 0,
    hitRate: 0,
    avgResponseTime: 0,
  };

  private responseTimes: number[] = [];

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();

    try {
      const result = await redisClient.execute(async (client) => {
        return await client.get(key);
      });

      this.recordResponseTime(Date.now() - startTime);

      if (!result) {
        this.stats.misses++;
        this.updateHitRate();
        return null;
      }

      this.stats.hits++;
      this.updateHitRate();

      // Ensure result is a string
      let value = typeof result === 'string' ? result : JSON.stringify(result);
      
      // Decompress if needed
      if (value.startsWith('COMPRESSED:')) {
        value = await decompress(value.substring(11));
      }

      // Check if value starts with quotes or brackets (likely JSON)
      if (value.startsWith('{') || value.startsWith('[') || value.startsWith('"')) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      
      // Return as-is for plain strings
      return value;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      let serialized = typeof value === 'string' ? value : JSON.stringify(value);

      // Compress if needed
      if (
        options.compress !== false &&
        serialized.length > cacheConfig.performance.compressionThreshold
      ) {
        serialized = 'COMPRESSED:' + await compress(serialized);
      }

      const ttl = options.ttl || cacheConfig.ttl.apiResponse;

      const success = await redisClient.execute(async (client) => {
        await client.setex(key, ttl, serialized);

        // Add to tags if specified
        if (options.tags && options.tags.length > 0) {
          const pipeline = client.pipeline();
          if (pipeline) {
            for (const tag of options.tags) {
              pipeline.sadd(`tag:${tag}`, key);
              pipeline.expire(`tag:${tag}`, ttl);
            }
            await pipeline.exec();
          }
        }

        return true;
      });

      return success || false;
    } catch (error) {
      this.stats.errors++;
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get or set value (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Acquire lock to prevent cache stampede
    const lockKey = cacheKeys.lock.resource(key);
    const lockAcquired = await this.acquireLock(lockKey, 5000); // 5 second lock

    try {
      // Double-check after acquiring lock
      if (lockAcquired) {
        const cachedAfterLock = await this.get<T>(key);
        if (cachedAfterLock !== null) {
          return cachedAfterLock;
        }
      }

      // Generate value
      const value = await factory();

      // Cache the value
      await this.set(key, value, options);

      return value;
    } finally {
      if (lockAcquired) {
        await this.releaseLock(lockKey);
      }
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const success = await redisClient.execute(async (client) => {
        const result = await client.del(key);
        return result > 0;
      });

      return success || false;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const count = await redisClient.execute(async (client) => {
        const keys = await client.keys(pattern);
        if (keys.length === 0) return 0;

        const pipeline = client.pipeline();
        keys.forEach(key => pipeline.del(key));
        await pipeline.exec();

        return keys.length;
      });

      return count || 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      let totalDeleted = 0;

      for (const tag of tags) {
        const deleted = await redisClient.execute(async (client) => {
          const keys = await client.smembers(`tag:${tag}`);
          if (keys.length === 0) return 0;

          const pipeline = client.pipeline();
          keys.forEach(key => pipeline.del(key));
          pipeline.del(`tag:${tag}`);
          await pipeline.exec();

          return keys.length;
        });

        totalDeleted += deleted || 0;
      }

      return totalDeleted;
    } catch (error) {
      console.error('Cache invalidate by tags error:', error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<boolean> {
    try {
      const success = await redisClient.execute(async (client) => {
        await client.flushdb();
        return true;
      });

      return success || false;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get detailed cache statistics from Redis
   */
  async stats(): Promise<any> {
    try {
      return await redisClient.execute(async (client) => {
        const dbSize = await client.dbsize();
        const info = await client.info();
        
        // Parse Redis info string for key metrics
        const parseInfo = (info: string, key: string): number => {
          const match = info.match(new RegExp(`${key}:(\\d+)`));
          return match ? parseInt(match[1]) : 0;
        };
        
        return {
          provider: 'redis',
          hits: parseInfo(info, 'keyspace_hits'),
          misses: parseInfo(info, 'keyspace_misses'),
          keys: dbSize,
          memory: parseInfo(info, 'used_memory'),
          evictions: parseInfo(info, 'evicted_keys')
        };
      }) || {
        provider: 'redis',
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: 0,
        memory: 0,
        evictions: 0
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        provider: 'redis',
        hits: this.stats.hits,
        misses: this.stats.misses,
        keys: 0,
        memory: 0,
        evictions: 0
      };
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      hitRate: 0,
      avgResponseTime: 0,
    };
    this.responseTimes = [];
  }

  /**
   * Distributed lock implementation
   */
  private async acquireLock(
    key: string,
    ttlMs: number
  ): Promise<boolean> {
    try {
      const acquired = await redisClient.execute(async (client) => {
        const result = await client.set(
          key,
          '1',
          'PX',
          ttlMs,
          'NX'
        );
        return result === 'OK';
      });

      return acquired || false;
    } catch (error) {
      console.error('Lock acquire error:', error);
      return false;
    }
  }

  /**
   * Release distributed lock
   */
  private async releaseLock(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Record response time
   */
  private recordResponseTime(timeMs: number): void {
    this.responseTimes.push(timeMs);
    
    // Keep only last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Update average
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.stats.avgResponseTime = sum / this.responseTimes.length;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUp(): Promise<void> {

    // Add warmup logic here based on your needs
    // Example: Pre-load common queries, user sessions, etc.

  }

  /**
   * Scan for keys matching a pattern
   */
  async scan(pattern: string, options?: { limit?: number }): Promise<string[]> {
    try {
      return await redisClient.execute(async (client) => {
        const keys: string[] = [];
        const limit = options?.limit || 1000;
        let cursor = 0;

        do {
          const result = await client.scan(cursor, {
            match: pattern,
            count: Math.min(100, limit - keys.length)
          });
          
          cursor = result.cursor;
          keys.push(...result.keys);

          if (keys.length >= limit) {
            break;
          }
        } while (cursor !== 0);

        return keys.slice(0, limit);
      }) || [];
    } catch (error) {
      console.error('Failed to scan keys:', error);
      return [];
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Export convenience methods
export const cache = {
  get: cacheService.get.bind(cacheService),
  set: cacheService.set.bind(cacheService),
  getOrSet: cacheService.getOrSet.bind(cacheService),
  delete: cacheService.delete.bind(cacheService),
  deletePattern: cacheService.deletePattern.bind(cacheService),
  invalidateByTags: cacheService.invalidateByTags.bind(cacheService),
  clear: cacheService.clear.bind(cacheService),
  getStats: cacheService.getStats.bind(cacheService),
  resetStats: cacheService.resetStats.bind(cacheService),
  warmUp: cacheService.warmUp.bind(cacheService),
};