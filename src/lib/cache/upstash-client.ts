import { Redis } from '@upstash/redis';
import { cacheConfig } from './config';

/**
 * Upstash Redis client for serverless environments
 * 
 * Benefits:
 * - HTTP-based (works in edge functions)
 * - Auto-reconnect
 * - Built-in retries
 * - Global edge caching
 */
export class UpstashClient {
  private client: Redis | null = null;

  /**
   * Get Upstash client instance
   */
  getClient(): Redis {
    if (!this.client) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!url || !token) {
        throw new Error('Upstash credentials not configured');
      }

      this.client = new Redis({
        url,
        token,
        retry: {
          retries: 3,
          backoff: (retryCount) => Math.exp(retryCount) * 50,
        },
      });
    }

    return this.client;
  }

  /**
   * Check if Upstash is configured
   */
  isConfigured(): boolean {
    return !!(
      process.env.UPSTASH_REDIS_REST_URL && 
      process.env.UPSTASH_REDIS_REST_TOKEN
    );
  }

  /**
   * Execute command with automatic retries
   */
  async execute<T>(
    command: (client: Redis) => Promise<T>
  ): Promise<T | null> {
    try {
      const client = this.getClient();
      return await command(client);
    } catch (error) {
      console.error('Upstash command error:', error);
      return null;
    }
  }
}

/**
 * Unified Redis client that works with both Upstash and regular Redis
 */
export function createRedisClient() {
  // Check if Upstash is configured
  if (process.env.UPSTASH_REDIS_REST_URL) {
    return new UpstashClient();
  }
  
  // Fall back to regular Redis
  const { redisClient } = require('./redis-client');
  return redisClient;
}

// Export singleton instance
export const unifiedRedisClient = createRedisClient();