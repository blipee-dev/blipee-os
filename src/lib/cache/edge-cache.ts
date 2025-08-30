import { NextRequest, NextResponse } from 'next/server';

export interface EdgeCacheOptions {
  ttl?: number;
  staleWhileRevalidate?: number;
  tags?: string[];
  varyOn?: string[];
}

export class EdgeCache {
  private static instance: EdgeCache;
  
  static getInstance(): EdgeCache {
    if (!EdgeCache.instance) {
      EdgeCache.instance = new EdgeCache();
    }
    return EdgeCache.instance;
  }

  // Generate cache key based on request
  private getCacheKey(request: NextRequest, varyOn: string[] = []): string {
    const url = new URL(_request.url);
    const parts = [
      url.pathname,
      url.search,
    ];

    // Add vary headers
    varyOn.forEach(header => {
      const value = _request.headers.get(header);
      if (value) {
        parts.push(`${header}:${value}`);
      }
    });

    return parts.join('|');
  }

  // Set cache headers on response
  setCacheHeaders(
    response: NextResponse,
    options: EdgeCacheOptions = {}
  ): NextResponse {
    const {
      ttl = 300, // 5 minutes default
      staleWhileRevalidate = 3600, // 1 hour default
      tags = [],
    } = options;

    // Set cache control headers
    response.headers.set(
      'Cache-Control',
      `public, max-age=${ttl}, stale-while-revalidate=${staleWhileRevalidate}`
    );

    // Set CloudFlare cache tags for targeted purging
    if (tags.length > 0) {
      response.headers.set('Cache-Tag', tags.join(','));
    }

    // Set edge cache TTL
    response.headers.set('CDN-Cache-Control', `max-age=${ttl}`);
    response.headers.set('Cloudflare-CDN-Cache-Control', `max-age=${ttl}`);

    return response;
  }

  // Check if request should be cached
  shouldCache(request: NextRequest): boolean {
    // Only cache GET requests
    if (_request.method !== 'GET') {
      return false;
    }

    // Don't cache authenticated requests
    if (_request.headers.get('authorization')) {
      return false;
    }

    // Don't cache requests with cookies (unless specifically allowed)
    if (_request.headers.get('cookie')) {
      const cookies = _request.headers.get('cookie') || '';
      // Allow caching if only has analytics cookies
      if (!cookies.includes('session') && !cookies.includes('auth')) {
        return true;
      }
      return false;
    }

    return true;
  }

  // Create cache middleware
  middleware(options: EdgeCacheOptions = {}) {
    return async (
      request: NextRequest,
      handler: () => Promise<NextResponse>
    ): Promise<NextResponse> => {
      // Check if request should be cached
      if (!this.shouldCache(_request)) {
        return handler();
      }

      // Get response
      const response = await handler();

      // Set cache headers
      return this.setCacheHeaders(response, options);
    };
  }

  // Cache API responses at edge
  async cacheAPIResponse(
    request: NextRequest,
    handler: () => Promise<any>,
    options: EdgeCacheOptions = {}
  ): Promise<NextResponse> {
    const cacheKey = this.getCacheKey(_request, options.varyOn);
    
    try {
      // Execute handler
      const data = await handler();
      
      // Create response
      const response = NextResponse.json(data);
      
      // Set cache headers
      this.setCacheHeaders(response, options);
      
      // Add cache key for debugging
      response.headers.set('X-Cache-Key', cacheKey);
      
      return response;
    } catch (error) {
      // Don't cache errors
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      );
    }
  }

  // Purge cache by tags
  async purgeByTags(tags: string[]): Promise<void> {
    // This would call CloudFlare API to purge by tags
    const response = await fetch('https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tags: tags,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to purge cache');
    }
  }

  // Purge specific URLs
  async purgeURLs(urls: string[]): Promise<void> {
    const response = await fetch('https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/purge_cache', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: urls,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to purge cache');
    }
  }
}

// Export singleton instance
export const edgeCache = EdgeCache.getInstance();

// Utility decorators for API routes
export function CacheableAPI(options: EdgeCacheOptions = {}) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      return edgeCache.cacheAPIResponse(
        request,
        () => originalMethod.call(this, request, ...args),
        options
      );
    };
    
    return descriptor;
  };
}