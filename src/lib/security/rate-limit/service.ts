import crypto from 'crypto';

// Dynamic import to avoid Edge Runtime issues
type RedisInstance = any;

export interface RateLimitConfig {
  redis?: {
    host: string;
    port: number;
    password?: string;
    tls?: boolean;
    keyPrefix?: string;
  };
  limits: {
    [key: string]: RateLimitRule;
  };
}

export interface RateLimitRule {
  points: number;        // Number of allowed requests
  duration: number;      // Time window in seconds
  blockDuration?: number; // Block duration in seconds after limit exceeded
  execEvenly?: boolean;  // Spread requests evenly across duration
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

// Default rate limit rules
export const DEFAULT_LIMITS: Record<string, RateLimitRule> = {
  // Authentication endpoints
  'auth:signin': { points: 5, duration: 60 * 15, blockDuration: 60 * 60 }, // 5 attempts per 15 min, 1hr block
  'auth:signup': { points: 3, duration: 60 * 60, blockDuration: 60 * 60 * 24 }, // 3 per hour, 24hr block
  'auth:reset': { points: 3, duration: 60 * 60, blockDuration: 60 * 60 }, // 3 per hour, 1hr block
  'auth:mfa': { points: 10, duration: 60 * 5, blockDuration: 60 * 30 }, // 10 per 5 min, 30min block
  
  // MFA specific limits
  'mfa_verify': { points: 5, duration: 60 * 10, blockDuration: 60 * 30 }, // 5 verification attempts per 10 min, 30min block
  'mfa_sms_send': { points: 3, duration: 60 * 15, blockDuration: 60 * 60 }, // 3 SMS per 15 min, 1hr block
  'mfa_email_send': { points: 5, duration: 60 * 15, blockDuration: 60 * 60 }, // 5 emails per 15 min, 1hr block
  'user_modification': { points: 10, duration: 60 * 60, blockDuration: 60 * 60 }, // 10 user changes per hour, 1hr block
  
  // API endpoints
  'api:general': { points: 100, duration: 60, execEvenly: true }, // 100 per minute
  'api:ai': { points: 20, duration: 60, execEvenly: true }, // 20 AI requests per minute
  'api:upload': { points: 10, duration: 60 * 5 }, // 10 uploads per 5 minutes
  'api:export': { points: 5, duration: 60 * 60 }, // 5 exports per hour
  
  // Global limits
  'global:ip': { points: 1000, duration: 60 * 60 }, // 1000 requests per hour per IP
  'global:user': { points: 5000, duration: 60 * 60 }, // 5000 requests per hour per user
};

/**
 * Enterprise-grade rate limiting service with DDoS protection
 */
export class RateLimitService {
  private redis: RedisInstance | null = null;
  private config: RateLimitConfig;
  private inMemoryStore = new Map<string, { points: number; reset: number; blocked?: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      redis: config.redis || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_TLS === 'true',
        keyPrefix: 'ratelimit:',
      },
      limits: { ...DEFAULT_LIMITS, ...config.limits },
    };

    this.initializeRedis();
    this.startCleanupTimer();
  }

  private async initializeRedis() {
    try {
      if (this.config.redis && typeof window === 'undefined') {
        const start = Date.now();
        console.log('Initializing Redis rate limiter...');
        
        // Only load Redis on server side
        const ioredis = await import('ioredis');
        const Redis = ioredis.default || ioredis.Redis;
        
        this.redis = new Redis({
          host: this.config.redis.host,
          port: this.config.redis.port,
          password: this.config.redis.password,
          tls: this.config.redis.tls ? {} : undefined,
          keyPrefix: this.config.redis.keyPrefix,
          maxRetriesPerRequest: 3, // Limit retries to prevent flooding
          enableReadyCheck: true,
          connectTimeout: 5000, // 5 second connection timeout
          commandTimeout: 5000, // 5 second command timeout
          retryStrategy: (times) => {
            console.log(`Redis retry attempt ${times}/3`);
            // In development, limit retries to avoid log flooding
            if (process.env.NODE_ENV !== 'production' && times > 3) {
              console.log('Redis rate limiting not available, using in-memory');
              return null; // Stop retrying
            }
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        });

        // Test connection
        await this.redis.ping();
        const duration = Date.now() - start;
        console.log(`Redis rate limiter connected in ${duration}ms`);
      }
    } catch (error) {
      console.error('Failed to connect to Redis for rate limiting, using in-memory:', error);
      this.redis = null;
    }
  }

  /**
   * Check rate limit for a key
   */
  async check(
    key: string,
    rule: string | RateLimitRule,
    consume: number = 1
  ): Promise<RateLimitResult> {
    const start = Date.now();
    const limitRule = typeof rule === 'string' ? this.config.limits[rule] : rule;
    if (!limitRule) {
      throw new Error(`Rate limit rule not found: ${rule}`);
    }

    const identifier = this.hashKey(key);
    
    let result: RateLimitResult;
    if (this.redis) {
      result = await this.checkRedis(identifier, limitRule, consume);
    } else {
      result = this.checkInMemory(identifier, limitRule, consume);
    }
    
    const duration = Date.now() - start;
    if (duration > 100) {
      console.warn(`Slow rate limit check: ${duration}ms for rule ${rule}`);
    }
    
    return result;
  }

  /**
   * Check rate limit using Redis
   */
  private async checkRedis(
    key: string,
    rule: RateLimitRule,
    consume: number
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const resetTime = now + (rule.duration * 1000);

    try {
      // Check if blocked
      const blockKey = `${key}:blocked`;
      const blockedUntil = await this.redis.get(blockKey);
      if (blockedUntil && parseInt(blockedUntil) > now) {
        const blockedTime = parseInt(blockedUntil);
        return {
          allowed: false,
          limit: rule.points,
          remaining: 0,
          reset: new Date(blockedTime),
          retryAfter: Math.ceil((blockedTime - now) / 1000),
        };
      }

      // Use Redis transaction for atomic operation
      const multi = this.redis.multi();
      const pointsKey = `${key}:points`;
      
      // Increment counter
      multi.incrby(pointsKey, consume);
      multi.expire(pointsKey, rule.duration);
      
      const results = await multi.exec();
      const currentPoints = results[0][1];

      if (currentPoints > rule.points) {
        // Limit exceeded - block if configured
        if (rule.blockDuration) {
          const blockUntil = now + (rule.blockDuration * 1000);
          await this.redis.setex(blockKey, rule.blockDuration, blockUntil.toString());
        }

        return {
          allowed: false,
          limit: rule.points,
          remaining: 0,
          reset: new Date(resetTime),
          retryAfter: rule.duration,
        };
      }

      return {
        allowed: true,
        limit: rule.points,
        remaining: Math.max(0, rule.points - currentPoints),
        reset: new Date(resetTime),
      };
    } catch (error) {
      console.error('Redis rate limit error:', error);
      // Fail open on Redis errors
      return {
        allowed: true,
        limit: rule.points,
        remaining: rule.points,
        reset: new Date(resetTime),
      };
    }
  }

  /**
   * Check rate limit using in-memory storage
   */
  private checkInMemory(
    key: string,
    rule: RateLimitRule,
    consume: number
  ): RateLimitResult {
    const now = Date.now();
    const resetTime = now + (rule.duration * 1000);
    
    let entry = this.inMemoryStore.get(key);

    // Check if blocked
    if (entry?.blocked && entry.blocked > now) {
      return {
        allowed: false,
        limit: rule.points,
        remaining: 0,
        reset: new Date(entry.blocked),
        retryAfter: Math.ceil((entry.blocked - now) / 1000),
      };
    }

    // Initialize or reset entry
    if (!entry || entry.reset <= now) {
      entry = { points: 0, reset: resetTime };
    }

    // Increment points
    entry.points += consume;

    if (entry.points > rule.points) {
      // Limit exceeded - block if configured
      if (rule.blockDuration) {
        entry.blocked = now + (rule.blockDuration * 1000);
      }
      this.inMemoryStore.set(key, entry);

      return {
        allowed: false,
        limit: rule.points,
        remaining: 0,
        reset: new Date(entry.reset),
        retryAfter: Math.ceil((entry.reset - now) / 1000),
      };
    }

    this.inMemoryStore.set(key, entry);

    return {
      allowed: true,
      limit: rule.points,
      remaining: Math.max(0, rule.points - entry.points),
      reset: new Date(entry.reset),
    };
  }

  /**
   * Reset rate limit for a key
   */
  async reset(key: string, rule?: string): Promise<void> {
    const identifier = this.hashKey(key);
    
    if (this.redis) {
      const pattern = rule ? `${identifier}:${rule}:*` : `${identifier}:*`;
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } else {
      if (rule) {
        this.inMemoryStore.delete(`${identifier}:${rule}`);
      } else {
        // Delete all entries for this key
        const keysToDelete: string[] = [];
        const entries = Array.from(this.inMemoryStore.keys());
        for (const k of entries) {
          if (k.startsWith(`${identifier}:`)) {
            keysToDelete.push(k);
          }
        }
        keysToDelete.forEach(k => this.inMemoryStore.delete(k));
      }
    }
  }

  /**
   * Get current status for a key
   */
  async status(key: string, rule: string | RateLimitRule): Promise<RateLimitResult> {
    const limitRule = typeof rule === 'string' ? this.config.limits[rule] : rule;
    if (!limitRule) {
      throw new Error(`Rate limit rule not found: ${rule}`);
    }

    const identifier = this.hashKey(key);
    
    if (this.redis) {
      const now = Date.now();
      const blockKey = `${identifier}:blocked`;
      const pointsKey = `${identifier}:points`;
      
      const [blocked, points, ttl] = await Promise.all([
        this.redis.get(blockKey),
        this.redis.get(pointsKey),
        this.redis.ttl(pointsKey),
      ]);

      if (blocked && parseInt(blocked) > now) {
        const blockedTime = parseInt(blocked);
        return {
          allowed: false,
          limit: limitRule.points,
          remaining: 0,
          reset: new Date(blockedTime),
          retryAfter: Math.ceil((blockedTime - now) / 1000),
        };
      }

      const currentPoints = parseInt(points || '0');
      const resetTime = ttl > 0 ? now + (ttl * 1000) : now + (limitRule.duration * 1000);

      return {
        allowed: currentPoints < limitRule.points,
        limit: limitRule.points,
        remaining: Math.max(0, limitRule.points - currentPoints),
        reset: new Date(resetTime),
      };
    } else {
      const entry = this.inMemoryStore.get(identifier);
      const now = Date.now();

      if (!entry || entry.reset <= now) {
        return {
          allowed: true,
          limit: limitRule.points,
          remaining: limitRule.points,
          reset: new Date(now + (limitRule.duration * 1000)),
        };
      }

      if (entry.blocked && entry.blocked > now) {
        return {
          allowed: false,
          limit: limitRule.points,
          remaining: 0,
          reset: new Date(entry.blocked),
          retryAfter: Math.ceil((entry.blocked - now) / 1000),
        };
      }

      return {
        allowed: entry.points < limitRule.points,
        limit: limitRule.points,
        remaining: Math.max(0, limitRule.points - entry.points),
        reset: new Date(entry.reset),
      };
    }
  }

  /**
   * Create composite key for multiple checks
   */
  createCompositeKey(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Hash key for storage
   */
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  /**
   * Cleanup expired entries from in-memory store
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    const entries = Array.from(this.inMemoryStore.entries());
    for (const [key, entry] of entries) {
      if (entry.reset <= now && (!entry.blocked || entry.blocked <= now)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.inMemoryStore.delete(key));
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    // Cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Stop cleanup timer
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get rate limit headers for HTTP response
   */
  getHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toISOString(),
    };

    if (!result.allowed && result.retryAfter) {
      headers['Retry-After'] = result.retryAfter.toString();
    }

    return headers;
  }
}

// Singleton instance
let rateLimitServiceInstance: RateLimitService | null = null;

export function getRateLimitService(config?: Partial<RateLimitConfig>): RateLimitService {
  if (!rateLimitServiceInstance) {
    rateLimitServiceInstance = new RateLimitService(config);
  }
  return rateLimitServiceInstance;
}

// Default export for convenience
export const rateLimitService = getRateLimitService();