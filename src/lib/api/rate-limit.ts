import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';
import { APIError } from './error-handler';

interface RateLimitOptions {
  uniqueTokenPerInterval?: number;
  interval?: number;
  limit?: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(capacity: number, refillRatePerMinute: number) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerMinute / 60 / 1000; // Convert to per millisecond
    this.lastRefill = Date.now();
  }

  consume(count: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    
    return false;
  }

  private refill() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }

  getResetTime(): number {
    const tokensNeeded = this.capacity - this.tokens;
    const timeToRefill = tokensNeeded / this.refillRate;
    return Date.now() + Math.ceil(timeToRefill);
  }
}

/**
 * Create a rate limiter instance
 */
export function rateLimit(options?: RateLimitOptions) {
  const opts = {
    uniqueTokenPerInterval: options?.uniqueTokenPerInterval || 500,
    interval: options?.interval || 60 * 1000, // 1 minute default
    limit: options?.limit || 10, // 10 requests per minute default
  };

  const tokenCache = new LRUCache<string, TokenBucket>({
    max: opts.uniqueTokenPerInterval,
    ttl: opts.interval,
  });

  return {
    check: async (
      req: NextRequest,
      limit: number = opts.limit,
      token?: string
    ): Promise<RateLimitResult> => {
      const identifier = token || getClientIdentifier(req);
      
      let bucket = tokenCache.get(identifier);
      if (!bucket) {
        bucket = new TokenBucket(limit, limit);
        tokenCache.set(identifier, bucket);
      }

      const success = bucket.consume();
      const remaining = bucket.getTokens();
      const reset = bucket.getResetTime();

      if (!success) {
        throw new APIError(
          `Rate limit exceeded. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds`,
          429,
          'RATE_LIMIT_EXCEEDED'
        );
      }

      return {
        success,
        limit,
        remaining,
        reset,
      };
    },
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get authenticated user ID from headers (set by auth middleware)
  const userId = req.headers.get('x-user-id');
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RateLimitConfigs = {
  // Auth endpoints - strict limits
  auth: {
    signin: { limit: 5, interval: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    signup: { limit: 3, interval: 60 * 60 * 1000 }, // 3 signups per hour
    passwordReset: { limit: 3, interval: 60 * 60 * 1000 }, // 3 resets per hour
  },
  
  // AI endpoints - moderate limits
  ai: {
    chat: { limit: 20, interval: 60 * 1000 }, // 20 messages per minute
    documentProcessing: { limit: 10, interval: 60 * 1000 }, // 10 documents per minute
  },
  
  // File upload - strict limits
  files: {
    upload: { limit: 10, interval: 60 * 1000 }, // 10 uploads per minute
  },
  
  // General API - lenient limits
  api: {
    default: { limit: 60, interval: 60 * 1000 }, // 60 requests per minute
    search: { limit: 30, interval: 60 * 1000 }, // 30 searches per minute
  },
};

/**
 * Middleware to add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: Response,
  result: RateLimitResult
): Response {
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(result.reset).toISOString());
  
  return response;
}