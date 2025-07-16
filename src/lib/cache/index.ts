/**
 * Cache module exports
 * Provides a singleton Redis client with memory fallback
 */

import { RedisClient } from './redis';

// Create singleton instance
let redisInstance: RedisClient | null = null;

export function getRedisClient(): RedisClient {
  if (!redisInstance) {
    redisInstance = new RedisClient({
      useMemoryFallback: true, // Always use memory fallback in production
      enableOfflineQueue: false, // Don't queue commands when offline
      maxRetries: 0, // Don't retry connections during build
    });
  }
  return redisInstance;
}

// Export types
export type { RedisConfig } from './redis';
export { RedisClient } from './redis';