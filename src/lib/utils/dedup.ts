/**
 * Request deduplication utility
 * Prevents multiple identical requests from being sent simultaneously
 */

interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private readonly ttl: number = 5000; // 5 seconds TTL for cached responses

  /**
   * Generate a cache key for the request
   */
  private generateKey(
    url: string,
    method: string = 'GET',
    body?: any
  ): string {
    const bodyStr = body ? JSON.stringify(body) : '';
    return `${method}:${url}:${bodyStr}`;
  }

  /**
   * Clean up expired cached requests
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.ttl) {
        this.pendingRequests.delete(key);
      }
    }
  }

  /**
   * Execute a deduplicated request
   */
  async execute<T>(
    fn: () => Promise<T>,
    key: string,
    ttl?: number
  ): Promise<T> {
    // Clean up old requests
    this.cleanup();

    // Check if there's a pending request
    const pending = this.pendingRequests.get(key);
    if (pending && Date.now() - pending.timestamp < (ttl || this.ttl)) {
      return pending.promise as Promise<T>;
    }

    // Create new request
    const promise = fn()
      .then((result) => {
        // Keep successful responses in cache for TTL
        return result;
      })
      .catch((error) => {
        // Remove failed requests immediately
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    });

    return promise;
  }

  /**
   * Deduplicated fetch
   */
  async fetch(
    url: string,
    init?: RequestInit,
    ttl?: number
  ): Promise<Response> {
    const method = init?.method || 'GET';
    const body = init?.body;
    const key = this.generateKey(url, method, body);

    return this.execute(
      () => fetch(url, init),
      key,
      ttl
    );
  }

  /**
   * Clear all cached requests
   */
  clear(): void {
    this.pendingRequests.clear();
  }

  /**
   * Clear a specific cached request
   */
  clearKey(url: string, method: string = 'GET', body?: any): void {
    const key = this.generateKey(url, method, body);
    this.pendingRequests.delete(key);
  }
}

// Singleton instance
export const dedup = new RequestDeduplicator();

/**
 * Deduplicated fetch wrapper
 */
export async function dedupFetch(
  url: string,
  init?: RequestInit,
  ttl?: number
): Promise<Response> {
  return dedup.fetch(url, init, ttl);
}

/**
 * Hook for React components
 */
export function useDedupFetch() {
  const fetchData = async <T>(
    url: string,
    options?: RequestInit,
    ttl?: number
  ): Promise<T> => {
    const response = await dedupFetch(url, options, ttl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  return {
    fetch: fetchData,
    clearCache: () => dedup.clear(),
    clearUrl: (url: string, method?: string) => dedup.clearKey(url, method),
  };
}

/**
 * Decorator for deduplicating class methods
 */
export function Deduplicated(ttl?: number) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodDedup = new RequestDeduplicator();

    descriptor.value = async function (...args: any[]) {
      // Generate key based on method name and arguments
      const key = `${propertyKey}:${JSON.stringify(args)}`;
      
      return methodDedup.execute(
        () => originalMethod.apply(this, args),
        key,
        ttl
      );
    };

    return descriptor;
  };
}