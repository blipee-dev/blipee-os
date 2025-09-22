/**
 * Advanced Rate Limiting System with Redis Support
 * Production-ready rate limiting with multiple algorithms and monitoring
 */

import { NextRequest } from 'next/server';
import { getRedisClient } from '@/lib/cache/redis-client';

export interface RateLimitRule {
  key: string;
  windowMs: number;
  maxRequests: number;
  algorithm: 'fixed-window' | 'sliding-window' | 'token-bucket';
  burstAllowance?: number;
  blockDurationMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

class AdvancedRateLimiter {
  private fallbackStore = new Map<string, any>();
  private redis = getRedisClient();

  /**
   * Check rate limit using Redis or fallback to in-memory
   */
  async checkLimit(
    identifier: string,
    rules: RateLimitRule[]
  ): Promise<RateLimitResult> {
    // Try Redis first, fallback to in-memory
    try {
      if (this.redis.isReady()) {
        return await this.checkLimitRedis(identifier, rules);
      }
    } catch (error) {
      console.warn('Redis rate limiting failed, using fallback:', error);
    }

    return this.checkLimitFallback(identifier, rules);
  }

  /**
   * Redis-based rate limiting
   */
  private async checkLimitRedis(
    identifier: string,
    rules: RateLimitRule[]
  ): Promise<RateLimitResult> {
    // Check all rules - most restrictive wins
    let mostRestrictive: RateLimitResult = {
      allowed: true,
      limit: 0,
      remaining: 0,
      resetTime: 0
    };

    for (const rule of rules) {
      const result = await this.checkSingleRuleRedis(identifier, rule);

      if (!result.allowed ||
          (mostRestrictive.allowed && result.remaining < mostRestrictive.remaining)) {
        mostRestrictive = result;
      }
    }

    return mostRestrictive;
  }

  /**
   * Check single rule against Redis
   */
  private async checkSingleRuleRedis(
    identifier: string,
    rule: RateLimitRule
  ): Promise<RateLimitResult> {
    const key = `rate_limit:${rule.key}:${identifier}`;
    const now = Date.now();

    switch (rule.algorithm) {
      case 'fixed-window':
        return this.fixedWindowRedis(key, rule, now);

      case 'sliding-window':
        return this.slidingWindowRedis(key, rule, now);

      case 'token-bucket':
        return this.tokenBucketRedis(key, rule, now);

      default:
        return this.fixedWindowRedis(key, rule, now);
    }
  }

  /**
   * Fixed window algorithm with Redis
   */
  private async fixedWindowRedis(
    key: string,
    rule: RateLimitRule,
    now: number
  ): Promise<RateLimitResult> {
    const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
    const windowKey = `${key}:${windowStart}`;

    const result = await this.redis.execute(async (client) => {
      const count = await client.incr(windowKey) || 0;

      if (count === 1) {
        await client.expire(windowKey, Math.ceil(rule.windowMs / 1000));
      }

      return count;
    });

    const current = result || 1;
    const resetTime = windowStart + rule.windowMs;

    return {
      allowed: current <= rule.maxRequests,
      limit: rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - current),
      resetTime,
      retryAfter: current > rule.maxRequests ? resetTime - now : undefined
    };
  }

  /**
   * Sliding window algorithm with Redis
   */
  private async slidingWindowRedis(
    key: string,
    rule: RateLimitRule,
    now: number
  ): Promise<RateLimitResult> {
    const windowStart = now - rule.windowMs;

    const result = await this.redis.execute(async (client) => {
      // Remove old entries
      await client.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      const count = await client.zcard(key) || 0;

      if (count < rule.maxRequests) {
        // Add current request
        await client.zadd(key, now, `${now}-${Math.random()}`);
        await client.expire(key, Math.ceil(rule.windowMs / 1000));
      }

      return count;
    });

    const current = result || 0;
    const resetTime = now + rule.windowMs;

    return {
      allowed: current < rule.maxRequests,
      limit: rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - current - (current < rule.maxRequests ? 1 : 0)),
      resetTime,
      retryAfter: current >= rule.maxRequests ? rule.windowMs : undefined
    };
  }

  /**
   * Token bucket algorithm with Redis
   */
  private async tokenBucketRedis(
    key: string,
    rule: RateLimitRule,
    now: number
  ): Promise<RateLimitResult> {
    const refillRate = rule.maxRequests / rule.windowMs; // tokens per ms
    const bucketKey = `${key}:bucket`;

    const result = await this.redis.execute(async (client) => {
      const bucket = await client.hmget(bucketKey, 'tokens', 'lastRefill');
      let tokens = parseFloat(bucket[0] || rule.maxRequests.toString());
      const lastRefill = parseInt(bucket[1] || now.toString());

      // Refill tokens based on time passed
      const timePassed = now - lastRefill;
      tokens = Math.min(rule.maxRequests, tokens + (timePassed * refillRate));

      let allowed = false;
      if (tokens >= 1) {
        tokens -= 1;
        allowed = true;
      }

      // Save state
      await client.hmset(bucketKey, {
        tokens: tokens.toString(),
        lastRefill: now.toString()
      });
      await client.expire(bucketKey, Math.ceil(rule.windowMs / 1000));

      return { tokens, allowed };
    });

    const tokens = result?.tokens || 0;
    const allowed = result?.allowed || false;

    return {
      allowed,
      limit: rule.maxRequests,
      remaining: Math.floor(tokens),
      resetTime: now + (rule.maxRequests - tokens) / refillRate,
      retryAfter: !allowed ? 1000 / refillRate : undefined // Time to get next token
    };
  }

  /**
   * Fallback in-memory rate limiting
   */
  private checkLimitFallback(
    identifier: string,
    rules: RateLimitRule[]
  ): RateLimitResult {
    const now = Date.now();
    let mostRestrictive: RateLimitResult = {
      allowed: true,
      limit: 0,
      remaining: 0,
      resetTime: 0
    };

    for (const rule of rules) {
      const key = `${rule.key}:${identifier}`;
      const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;

      let entry = this.fallbackStore.get(key);

      if (!entry || entry.window !== windowStart) {
        entry = { window: windowStart, count: 0 };
        this.fallbackStore.set(key, entry);
      }

      entry.count++;
      const resetTime = windowStart + rule.windowMs;

      const result: RateLimitResult = {
        allowed: entry.count <= rule.maxRequests,
        limit: rule.maxRequests,
        remaining: Math.max(0, rule.maxRequests - entry.count),
        resetTime,
        retryAfter: entry.count > rule.maxRequests ? resetTime - now : undefined
      };

      if (!result.allowed ||
          (mostRestrictive.allowed && result.remaining < mostRestrictive.remaining)) {
        mostRestrictive = result;
      }
    }

    return mostRestrictive;
  }

  /**
   * Get rate limit stats for monitoring
   */
  async getStats(identifier: string, ruleKey: string): Promise<{
    requests: number;
    windowStart: number;
    isBlocked: boolean;
  } | null> {
    try {
      if (!this.redis.isReady()) {
        return null;
      }

      const key = `rate_limit:${ruleKey}:${identifier}`;
      const now = Date.now();

      const result = await this.redis.execute(async (client) => {
        const windowStart = Math.floor(now / (60 * 1000)) * (60 * 1000); // 1 minute window
        const windowKey = `${key}:${windowStart}`;
        const requests = await client.get(windowKey) || '0';
        return {
          requests: parseInt(requests),
          windowStart,
          isBlocked: parseInt(requests) > 100 // Default threshold
        };
      });

      return result || null;
    } catch (error) {
      console.error('Error getting rate limit stats:', error);
      return null;
    }
  }
}

// Singleton instance
const rateLimiter = new AdvancedRateLimiter();

/**
 * Extract identifier from request
 */
export function getIdentifier(request: NextRequest): string {
  // Priority order for identification
  const ip = request.ip ||
           request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
           request.headers.get('x-real-ip') ||
           'unknown';

  const userAgent = request.headers.get('user-agent')?.substring(0, 50) || 'unknown';

  // For authenticated requests, could add user ID here
  return `${ip}:${userAgent}`;
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMIT_CONFIGS = {
  // API endpoints
  api: {
    strict: [
      {
        key: 'api_strict',
        windowMs: 60 * 1000, // 1 minute
        maxRequests: 30,
        algorithm: 'sliding-window' as const
      }
    ],
    normal: [
      {
        key: 'api_normal',
        windowMs: 60 * 1000,
        maxRequests: 100,
        algorithm: 'fixed-window' as const
      }
    ],
    burst: [
      {
        key: 'api_burst',
        windowMs: 60 * 1000,
        maxRequests: 200,
        algorithm: 'token-bucket' as const,
        burstAllowance: 50
      }
    ]
  },

  // Authentication endpoints
  auth: [
    {
      key: 'auth',
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      algorithm: 'fixed-window' as const,
      blockDurationMs: 15 * 60 * 1000
    }
  ],

  // AI endpoints (more restrictive)
  ai: [
    {
      key: 'ai',
      windowMs: 60 * 1000,
      maxRequests: 20,
      algorithm: 'sliding-window' as const
    }
  ],

  // Analytics endpoints
  analytics: [
    {
      key: 'analytics',
      windowMs: 60 * 1000,
      maxRequests: 50,
      algorithm: 'token-bucket' as const
    }
  ]
};

/**
 * Check rate limit for a request
 */
export async function checkRateLimit(
  request: NextRequest,
  rules: RateLimitRule[]
): Promise<RateLimitResult> {
  const identifier = getIdentifier(request);
  return rateLimiter.checkLimit(identifier, rules);
}

/**
 * Get rate limit statistics
 */
export async function getRateLimitStats(
  identifier: string,
  ruleKey: string
): Promise<any> {
  return rateLimiter.getStats(identifier, ruleKey);
}

export default rateLimiter;