import { getRedisClient, RedisClient } from './redis';
import crypto from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
  version?: string; // Cache version for invalidation
}

export class CacheService {
  private redis: RedisClient | null = null;
  private defaultTTL = 3600; // 1 hour
  private cacheVersion = '1.0.0';

  async initialize(): Promise<void> {
    try {
      this.redis = await getRedisClient();
    } catch (error) {
      console.error('Failed to initialize cache service:', error);
      // Continue without cache if Redis is unavailable
    }
  }

  private generateKey(namespace: string, identifier: string): string {
    const hash = crypto
      .createHash('sha256')
      .update(`${namespace}:${identifier}:${this.cacheVersion}`)
      .digest('hex')
      .substring(0, 16);
    return `${namespace}:${hash}`;
  }

  async get<T = any>(
    namespace: string,
    identifier: string
  ): Promise<T | null> {
    if (!this.redis) return null;

    const key = this.generateKey(namespace, identifier);
    const cached = await this.redis.get<{ data: T; tags?: string[] }>(key);
    
    if (cached) {
      // Update cache hit metrics
      await this.redis.increment('metrics:cache:hits');
      return cached.data;
    }

    // Update cache miss metrics
    await this.redis.increment('metrics:cache:misses');
    return null;
  }

  async set<T = any>(
    namespace: string,
    identifier: string,
    data: T,
    options?: CacheOptions
  ): Promise<boolean> {
    if (!this.redis) return false;

    const key = this.generateKey(namespace, identifier);
    const ttl = options?.ttl || this.defaultTTL;
    const cacheData = {
      data,
      tags: options?.tags || [],
      timestamp: Date.now(),
      version: options?.version || this.cacheVersion,
    };

    const success = await this.redis.set(key, cacheData, ttl);

    // Store tag associations for invalidation
    if (success && options?.tags) {
      for (const tag of options.tags) {
        await this.redis.set(
          `tag:${tag}:${key}`,
          true,
          ttl
        );
      }
    }

    return success;
  }

  async invalidate(namespace: string, identifier: string): Promise<boolean> {
    if (!this.redis) return false;

    const key = this.generateKey(namespace, identifier);
    return await this.redis.delete(key);
  }

  async invalidateByTag(tag: string): Promise<number> {
    if (!this.redis) return 0;

    const pattern = `tag:${tag}:*`;
    const taggedKeys = await this.redis.getPattern(pattern);
    let deletedCount = 0;

    for (const tagKey of Object.keys(taggedKeys)) {
      const cacheKey = tagKey.split(':').pop();
      if (cacheKey) {
        const deleted = await this.redis.delete(cacheKey);
        if (deleted) deletedCount++;
      }
    }

    // Clean up tag keys
    await this.redis.deletePattern(pattern);

    return deletedCount;
  }

  async invalidateNamespace(namespace: string): Promise<number> {
    if (!this.redis) return 0;

    const pattern = `${namespace}:*`;
    return await this.redis.deletePattern(pattern);
  }

  async warmUp(
    namespace: string,
    identifier: string,
    generator: () => Promise<any>,
    options?: CacheOptions
  ): Promise<any> {
    const cached = await this.get(namespace, identifier);
    if (cached) return cached;

    const data = await generator();
    await this.set(namespace, identifier, data, options);
    return data;
  }

  async remember<T = any>(
    namespace: string,
    identifier: string,
    generator: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(namespace, identifier);
    if (cached !== null) return cached;

    const data = await generator();
    await this.set(namespace, identifier, data, options);
    return data;
  }

  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    hitRate: number;
  }> {
    if (!this.redis) {
      return { hits: 0, misses: 0, hitRate: 0 };
    }

    const hits = (await this.redis.get<number>('metrics:cache:hits')) || 0;
    const misses = (await this.redis.get<number>('metrics:cache:misses')) || 0;
    const total = hits + misses;
    const hitRate = total > 0 ? (hits / total) * 100 : 0;

    return { hits, misses, hitRate };
  }

  async flush(): Promise<void> {
    if (!this.redis) return;
    await this.redis.flush();
  }
}

// Singleton instance
let cacheService: CacheService | null = null;

export const getCacheService = async (): Promise<CacheService> => {
  if (!cacheService) {
    cacheService = new CacheService();
    await cacheService.initialize();
  }
  return cacheService;
};

// Cache decorators for methods
export function Cacheable(
  namespace: string,
  options?: CacheOptions
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache = await getCacheService();
      const identifier = JSON.stringify({ method: propertyKey, args });

      return cache.remember(
        namespace,
        identifier,
        async () => originalMethod.apply(this, args),
        options
      );
    };

    return descriptor;
  };
}

export function CacheInvalidate(
  namespace: string,
  identifierGenerator?: (...args: any[]) => string
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      const cache = await getCacheService();

      if (identifierGenerator) {
        const identifier = identifierGenerator(...args);
        await cache.invalidate(namespace, identifier);
      } else {
        await cache.invalidateNamespace(namespace);
      }

      return result;
    };

    return descriptor;
  };
}