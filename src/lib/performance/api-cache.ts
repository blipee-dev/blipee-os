/**
 * API Response Caching & Rate Limiting
 *
 * Provides high-performance caching and rate limiting for API routes
 * Part of FASE 3 - Week 2: Performance & Optimization
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Cache entry for API responses
 */
interface APICacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  etag: string;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * API Cache configuration
 */
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleWhileRevalidate?: number; // Serve stale data while fetching fresh
  cacheKey?: (req: NextRequest) => string;
}

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  maxRequests: number; // Max requests per window
  windowMs: number; // Time window in milliseconds
  keyGenerator?: (req: NextRequest) => string;
}

/**
 * API Cache Manager
 */
export class APICacheManager {
  private cache: Map<string, APICacheEntry> = new Map();
  private rateLimits: Map<string, RateLimitEntry> = new Map();

  /**
   * Generate cache key from request
   */
  private generateCacheKey(req: NextRequest, customKeyFn?: (req: NextRequest) => string): string {
    if (customKeyFn) {
      return customKeyFn(req);
    }

    const url = new URL(req.url);
    return `${req.method}:${url.pathname}${url.search}`;
  }

  /**
   * Generate ETag from data
   */
  private generateETag(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `"${Math.abs(hash).toString(36)}"`;
  }

  /**
   * Get cached response
   */
  getCachedResponse(cacheKey: string, ifNoneMatch?: string): APICacheEntry | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    // Check ETag match
    if (ifNoneMatch && entry.etag === ifNoneMatch) {
      return entry;
    }

    const now = Date.now();
    const age = now - entry.timestamp;

    // Return fresh data
    if (age < entry.ttl) {
      return entry;
    }

    // Data is stale - delete and return null
    this.cache.delete(cacheKey);
    return null;
  }

  /**
   * Set cached response
   */
  setCachedResponse(cacheKey: string, data: any, ttl: number): APICacheEntry {
    const entry: APICacheEntry = {
      data,
      timestamp: Date.now(),
      ttl,
      etag: this.generateETag(data),
    };

    this.cache.set(cacheKey, entry);

    // Prevent memory leaks
    if (this.cache.size > 500) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    return entry;
  }

  /**
   * Clear cache
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      const keysToDelete: string[] = [];
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Check rate limit
   */
  checkRateLimit(key: string, config: RateLimitConfig): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    let entry = this.rateLimits.get(key);

    // Create new entry if none exists or window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + config.windowMs,
      };
      this.rateLimits.set(key, entry);
    }

    // Increment count
    entry.count++;

    const allowed = entry.count <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - entry.count);

    return {
      allowed,
      remaining,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    let totalSize = 0;
    let validEntries = 0;
    const now = Date.now();

    for (const entry of this.cache.values()) {
      const age = now - entry.timestamp;
      if (age < entry.ttl) {
        validEntries++;
      }
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      staleEntries: this.cache.size - validEntries,
      totalSizeBytes: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
    };
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats() {
    const now = Date.now();
    let activeRateLimits = 0;

    for (const entry of this.rateLimits.values()) {
      if (now < entry.resetTime) {
        activeRateLimits++;
      }
    }

    return {
      totalRateLimits: this.rateLimits.size,
      activeRateLimits,
    };
  }
}

/**
 * Global cache manager instance
 */
export const apiCache = new APICacheManager();

/**
 * Cache middleware for API routes
 */
export function withCache(config: CacheConfig) {
  return async function middleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler();
    }

    const cacheKey = apiCache['generateCacheKey'](req, config.cacheKey);
    const ifNoneMatch = req.headers.get('if-none-match');

    // Try to get from cache
    const cached = apiCache.getCachedResponse(cacheKey, ifNoneMatch);

    if (cached) {
      // Return 304 Not Modified if ETag matches
      if (ifNoneMatch && cached.etag === ifNoneMatch) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': cached.etag,
            'Cache-Control': `public, max-age=${Math.floor(config.ttl / 1000)}`,
          },
        });
      }

      // Return cached data
      return NextResponse.json(cached.data, {
        headers: {
          'X-Cache': 'HIT',
          'ETag': cached.etag,
          'Cache-Control': `public, max-age=${Math.floor(config.ttl / 1000)}`,
          'Age': String(Math.floor((Date.now() - cached.timestamp) / 1000)),
        },
      });
    }

    // Execute handler
    const response = await handler();

    // Cache successful responses
    if (response.status === 200) {
      const data = await response.json();
      const entry = apiCache.setCachedResponse(cacheKey, data, config.ttl);

      return NextResponse.json(data, {
        headers: {
          'X-Cache': 'MISS',
          'ETag': entry.etag,
          'Cache-Control': `public, max-age=${Math.floor(config.ttl / 1000)}`,
        },
      });
    }

    return response;
  };
}

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(config: RateLimitConfig) {
  return async function middleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : req.headers.get('x-forwarded-for') || 'default';

    const { allowed, remaining, resetTime } = apiCache.checkRateLimit(key, config);

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(config.maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(resetTime / 1000)),
            'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await handler();

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.floor(resetTime / 1000)));

    return response;
  };
}

/**
 * Combined cache and rate limit middleware
 */
export function withCacheAndRateLimit(
  cacheConfig: CacheConfig,
  rateLimitConfig: RateLimitConfig
) {
  return async function middleware(
    req: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const cacheMiddleware = withCache(cacheConfig);
    const rateLimitMiddleware = withRateLimit(rateLimitConfig);

    // Apply rate limit first, then cache
    return rateLimitMiddleware(req, () => cacheMiddleware(req, handler));
  };
}

/**
 * Preset configurations
 */
export const CachePresets = {
  /** Short cache for frequently changing data (2 minutes) */
  short: { ttl: 2 * 60 * 1000 },

  /** Medium cache for moderately changing data (5 minutes) */
  medium: { ttl: 5 * 60 * 1000 },

  /** Long cache for slowly changing data (15 minutes) */
  long: { ttl: 15 * 60 * 1000 },

  /** Very long cache for rarely changing data (1 hour) */
  veryLong: { ttl: 60 * 60 * 1000 },
};

export const RateLimitPresets = {
  /** Strict: 10 requests per minute */
  strict: { maxRequests: 10, windowMs: 60 * 1000 },

  /** Standard: 60 requests per minute */
  standard: { maxRequests: 60, windowMs: 60 * 1000 },

  /** Relaxed: 120 requests per minute */
  relaxed: { maxRequests: 120, windowMs: 60 * 1000 },

  /** Generous: 300 requests per minute */
  generous: { maxRequests: 300, windowMs: 60 * 1000 },
};
