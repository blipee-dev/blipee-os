import { Redis } from 'ioredis';
import { RateLimitInfo } from '@/types/api-gateway';

export class RateLimitService {
  private redis: Redis | null = null;
  private inMemoryStore: Map<string, { count: number; resetAt: Date }> = new Map();
  
  constructor() {
    // Initialize Redis connection if available
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        this.redis.on('error', (err) => {
          console.error('Redis rate limit error:', err);
          // Fall back to in-memory if Redis fails
          this.redis = null;
        });
      } catch (error) {
        console.error('Failed to initialize Redis for rate limiting:', error);
      }
    }
  }

  /**
   * Check rate limit for an API key
   */
  async checkRateLimit(
    apiKeyId: string,
    customLimit?: number
  ): Promise<RateLimitInfo> {
    const limit = customLimit || 1000; // Default: 1000 requests per hour
    const windowMs = 3600000; // 1 hour in milliseconds
    const key = `rate_limit:${apiKeyId}`;
    
    if (this.redis) {
      return this.checkRedisRateLimit(key, limit, windowMs);
    } else {
      return this.checkInMemoryRateLimit(key, limit, windowMs);
    }
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRedisRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitInfo> {
    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      
      // Remove old entries
      await this.redis!.zremrangebyscore(key, '-inf', windowStart);
      
      // Count requests in current window
      const count = await this.redis!.zcard(key);
      
      if (count < limit) {
        // Add current request
        await this.redis!.zadd(key, now, `${now}-${Math.random()}`);
        await this.redis!.expire(key, Math.ceil(windowMs / 1000));
        
        return {
          limit,
          remaining: limit - count - 1,
          reset: new Date(now + windowMs),
          allowed: true,
        };
      } else {
        // Get oldest entry to determine reset time
        const oldestEntry = await this.redis!.zrange(key, 0, 0, 'WITHSCORES');
        const resetTime = oldestEntry.length > 1 
          ? parseInt(oldestEntry[1]) + windowMs 
          : now + windowMs;
        
        return {
          limit,
          remaining: 0,
          reset: new Date(resetTime),
          allowed: false,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        };
      }
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fall back to allowing the request on error
      return {
        limit,
        remaining: limit,
        reset: new Date(Date.now() + windowMs),
        allowed: true,
      };
    }
  }

  /**
   * Check rate limit using in-memory store
   */
  private checkInMemoryRateLimit(
    key: string,
    limit: number,
    windowMs: number
  ): RateLimitInfo {
    const now = new Date();
    const resetAt = new Date(now.getTime() + windowMs);
    
    // Clean up expired entries
    const entries = Array.from(this.inMemoryStore.entries());
    for (const [k, v] of entries) {
      if (v.resetAt < now) {
        this.inMemoryStore.delete(k);
      }
    }
    
    const entry = this.inMemoryStore.get(key);
    
    if (!entry || entry.resetAt < now) {
      // New window
      this.inMemoryStore.set(key, { count: 1, resetAt });
      return {
        limit,
        remaining: limit - 1,
        reset: resetAt,
        allowed: true,
      };
    }
    
    if (entry.count < limit) {
      // Increment count
      entry.count++;
      return {
        limit,
        remaining: limit - entry.count,
        reset: entry.resetAt,
        allowed: true,
      };
    }
    
    // Rate limit exceeded
    return {
      limit,
      remaining: 0,
      reset: entry.resetAt,
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt.getTime() - now.getTime()) / 1000),
    };
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetRateLimit(apiKeyId: string): Promise<void> {
    const key = `rate_limit:${apiKeyId}`;
    
    if (this.redis) {
      await this.redis.del(key);
    } else {
      this.inMemoryStore.delete(key);
    }
  }

  /**
   * Get current usage for an API key
   */
  async getCurrentUsage(apiKeyId: string): Promise<number> {
    const key = `rate_limit:${apiKeyId}`;
    
    if (this.redis) {
      const windowMs = 3600000; // 1 hour
      const windowStart = Date.now() - windowMs;
      await this.redis.zremrangebyscore(key, '-inf', windowStart);
      return await this.redis.zcard(key);
    } else {
      const entry = this.inMemoryStore.get(key);
      return entry?.count || 0;
    }
  }

  /**
   * Clean up old entries (for memory management)
   */
  async cleanup(): Promise<void> {
    if (!this.redis) {
      const now = new Date();
      const entries = Array.from(this.inMemoryStore.entries());
      for (const [key, value] of entries) {
        if (value.resetAt < now) {
          this.inMemoryStore.delete(key);
        }
      }
    }
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();

// Clean up in-memory store periodically
if (typeof window === 'undefined') {
  setInterval(() => {
    rateLimitService.cleanup().catch(console.error);
  }, 60000); // Every minute
}