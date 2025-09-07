import { NextRequest, NextResponse } from 'next/server';
import { apiCache } from '@/lib/cache';

export interface CacheMiddlewareOptions {
  ttl?: number;
  skipCache?: boolean;
  revalidate?: string[]; // Paths that should invalidate cache
}

/**
 * Cache middleware for API routes
 */
export function withCache(options: CacheMiddlewareOptions = {}) {
  return async function cacheMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Skip cache for non-GET requests or if explicitly disabled
    if (_request.method !== 'GET' || options.skipCache) {
      const response = await handler();
      
      // Invalidate cache on write operations
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(_request.method)) {
        await invalidateRelatedCache(_request, options.revalidate);
      }
      
      return response;
    }

    // Use API cache
    const apiResponse = await apiCache.withCache(
      request,
      async () => {
        const response = await handler();
        const data = await response.json();
        
        return {
          data,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        };
      },
      {
        ttl: options.ttl,
        skipCache: options.skipCache,
      }
    );

    // Create NextResponse with cached data
    const response = NextResponse.json(apiResponse.data, {
      status: apiResponse.status,
    });

    // Add cache headers
    if (apiResponse.cached) {
      response.headers.set('X-Cache', 'HIT');
      response.headers.set('X-Cache-Age', apiResponse.cachedAt || '');
    } else {
      response.headers.set('X-Cache', 'MISS');
    }

    // Apply original headers
    if (apiResponse.headers) {
      Object.entries(apiResponse.headers).forEach(([key, value]) => {
        if (!['content-length', 'content-encoding'].includes(key.toLowerCase())) {
          response.headers.set(key, value);
        }
      });
    }

    return response;
  };
}

/**
 * Invalidate related cache based on request
 */
async function invalidateRelatedCache(
  request: NextRequest,
  revalidatePaths?: string[]
): Promise<void> {
  const path = _request.nextUrl.pathname;
  
  // Invalidate current path
  await apiCache.invalidatePath(path);
  
  // Invalidate additional paths
  if (revalidatePaths) {
    for (const revalidatePath of revalidatePaths) {
      await apiCache.invalidatePath(revalidatePath);
    }
  }
  
  // Pattern-based invalidation
  if (path.includes('/api/emissions')) {
    await apiCache.deletePattern('api:*emissions*');
    await apiCache.deletePattern('api:*dashboard*');
  } else if (path.includes('/api/organizations')) {
    await apiCache.deletePattern('api:*organizations*');
    await apiCache.deletePattern('api:*users*');
  }
}

/**
 * Rate limiting middleware using cache
 */
export function withRateLimit(options: {
  limit: number;
  window: number; // seconds
  keyResolver?: (request: NextRequest) => string;
}) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    // Resolve key for rate limiting
    const key = options.keyResolver
      ? options.keyResolver(_request)
      : _request.headers.get('x-user-id') || 
        _request.ip || 
        'anonymous';

    const endpoint = _request.nextUrl.pathname;
    
    // Check rate limit
    const { allowed, remaining, resetAt } = await apiCache.checkRateLimit(
      key,
      endpoint,
      options.limit,
      options.window
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: options.limit,
          remaining: 0,
          resetAt: resetAt.toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': options.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.toISOString(),
            'Retry-After': Math.ceil((resetAt.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Process request
    const response = await handler();

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', options.limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', resetAt.toISOString());

    return response;
  };
}