import { cache } from './service';
import { cacheConfig, cacheKeys } from './config';
import { NextRequest } from 'next/server';

export interface APIResponse<T = any> {
  data: T;
  status: number;
  headers?: Record<string, string>;
  cached?: boolean;
  cachedAt?: string;
}

/**
 * API response caching
 */
export class APICache {
  /**
   * Generate cache key from request
   */
  private generateRequestKey(
    method: string,
    path: string,
    params?: Record<string, any>
  ): string {
    // Remove query params from path
    const cleanPath = path.split('?')[0];
    return cacheKeys.api.response(method, cleanPath, params);
  }

  /**
   * Extract cache params from request
   */
  private extractParams(request: NextRequest): Record<string, any> {
    const params: Record<string, any> = {};
    
    // Get query params
    _request.nextUrl.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Add important headers
    const authHeader = _request.headers.get('authorization');
    if (authHeader) {
      // Hash the auth token for privacy
      const crypto = require('crypto');
      params._auth = crypto
        .createHash('sha256')
        .update(authHeader)
        .digest('hex')
        .substring(0, 8);
    }
    
    return params;
  }

  /**
   * Cache API response
   */
  async cacheResponse<T>(
    method: string,
    path: string,
    response: APIResponse<T>,
    params?: Record<string, any>,
    ttl?: number
  ): Promise<boolean> {
    const key = this.generateRequestKey(method, path, params);
    
    const cached: APIResponse<T> = {
      ...response,
      cached: true,
      cachedAt: new Date().toISOString(),
    };
    
    return cache.set(key, cached, {
      ttl: ttl || cacheConfig.ttl.apiResponse,
      compress: JSON.stringify(response.data).length > 1024,
      tags: ['api-response', `method:${method}`, `path:${path}`],
    });
  }

  /**
   * Get cached API response
   */
  async getCachedResponse<T>(
    method: string,
    path: string,
    params?: Record<string, any>
  ): Promise<APIResponse<T> | null> {
    const key = this.generateRequestKey(method, path, params);
    const cached = await cache.get<APIResponse<T>>(key);
    
    if (cached) {
      console.log(`✅ API Cache hit: ${method} ${path}`);
    }
    
    return cached;
  }

  /**
   * Middleware for caching GET requests
   */
  async withCache<T>(
    request: NextRequest,
    handler: () => Promise<APIResponse<T>>,
    options?: {
      ttl?: number;
      skipCache?: boolean;
    }
  ): Promise<APIResponse<T>> {
    // Only cache GET requests by default
    if (_request.method !== 'GET' || options?.skipCache) {
      return handler();
    }
    
    const method = _request.method;
    const path = _request.nextUrl.pathname;
    const params = this.extractParams(_request);
    
    // Check cache
    const cached = await this.getCachedResponse<T>(method, path, params);
    if (cached) {
      return cached;
    }
    
    // Execute handler
    const response = await handler();
    
    // Cache successful responses
    if (response.status >= 200 && response.status < 300) {
      await this.cacheResponse(method, path, response, params, options?.ttl);
    }
    
    return response;
  }

  /**
   * Cache rate limit state
   */
  async checkRateLimit(
    userId: string,
    endpoint: string,
    limit: number,
    windowSeconds: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = cacheKeys.api.rateLimit(userId, endpoint);
    
    const result = await cache.getOrSet(
      key,
      async () => ({ count: 0, resetAt: new Date(Date.now() + windowSeconds * 1000) }),
      { ttl: windowSeconds }
    );
    
    if (!result) {
      // Cache error, allow request
      return { allowed: true, remaining: limit, resetAt: new Date() };
    }
    
    // Increment counter
    if (result.count < limit) {
      result.count++;
      await cache.set(key, result, { ttl: windowSeconds });
    }
    
    return {
      allowed: result.count <= limit,
      remaining: Math.max(0, limit - result.count),
      resetAt: new Date(result.resetAt),
    };
  }

  /**
   * Invalidate API cache by method
   */
  async invalidateMethod(method: string): Promise<number> {
    return cache.invalidateByTags([`method:${method}`]);
  }

  /**
   * Invalidate API cache by path
   */
  async invalidatePath(path: string): Promise<number> {
    return cache.invalidateByTags([`path:${path}`]);
  }

  /**
   * Clear all API cache
   */
  async clearAll(): Promise<number> {
    return cache.invalidateByTags(['api-response']);
  }
}

// Export singleton instance
export const apiCache = new APICache();