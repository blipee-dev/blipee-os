// Main cache exports
export { cache, cacheService } from './service';
export { cacheConfig, cacheKeys } from './config';
export { redisClient } from './redis-client';

// Specialized cache services
export { aiCache, getAICache } from './ai-cache';
export { dbCache } from './db-cache';
export { apiCache } from './api-cache';
export { sessionCache } from './session-cache';

// Types
export type { CacheOptions, CacheStats } from './service';
export type { AIResponse } from './ai-cache';
export type { QueryResult } from './db-cache';
export type { APIResponse } from './api-cache';
export type { SessionData, DeviceSession } from './session-cache';

// Utilities
export { compress, decompress, getCompressionRatio } from './compression';

/**
 * Initialize cache system
 */
export async function initializeCache(): Promise<void> {
  try {
    // Test Redis connection
    const client = await redisClient.getClient();
    await client.ping();
    
    console.log('✅ Cache system initialized');
    
    // Optionally warm up cache
    if (process.env.CACHE_WARMUP === 'true') {
      await cacheService.warmUp();
    }
  } catch (error) {
    console.error('❌ Failed to initialize cache:', error);
    console.warn('⚠️  Running without cache - performance may be degraded');
  }
}

/**
 * Gracefully shutdown cache
 */
export async function shutdownCache(): Promise<void> {
  await redisClient.disconnect();
  console.log('✅ Cache system shutdown complete');
}