import { getCacheService, CacheService } from './cache-service';
import crypto from 'crypto';

export interface AIResponse {
  message: string;
  suggestions?: string[];
  components?: any[];
  timestamp: number;
}

export class AICache {
  private cache: CacheService | null = null;
  private namespace = 'ai';

  async initialize(): Promise<void> {
    this.cache = await getCacheService();
  }

  private generateCacheKey(
    message: string,
    context: Record<string, any>
  ): string {
    const normalizedMessage = message.toLowerCase().trim();
    const contextStr = JSON.stringify(context, Object.keys(context).sort());
    
    return crypto
      .createHash('sha256')
      .update(`${normalizedMessage}:${contextStr}`)
      .digest('hex');
  }

  async getCachedResponse(
    message: string,
    context: Record<string, any>
  ): Promise<AIResponse | null> {
    if (!this.cache) return null;

    const cacheKey = this.generateCacheKey(message, context);
    const cached = await this.cache.get<AIResponse>(this.namespace, cacheKey);

    if (cached) {
      // Check if response is still fresh (within 1 hour)
      const age = Date.now() - cached.timestamp;
      if (age > 3600000) {
        await this.cache.invalidate(this.namespace, cacheKey);
        return null;
      }
    }

    return cached;
  }

  async cacheResponse(
    message: string,
    context: Record<string, any>,
    response: Omit<AIResponse, 'timestamp'>,
    ttl: number = 3600 // 1 hour default
  ): Promise<void> {
    if (!this.cache) return;

    const cacheKey = this.generateCacheKey(message, context);
    const fullResponse: AIResponse = {
      ...response,
      timestamp: Date.now(),
    };

    await this.cache.set(this.namespace, cacheKey, fullResponse, {
      ttl,
      tags: ['ai-response', `org:${context.organizationId}`],
    });
  }

  async invalidateOrgResponses(organizationId: string): Promise<void> {
    if (!this.cache) return;
    await this.cache.invalidateByTag(`org:${organizationId}`);
  }

  async getCacheStats(): Promise<{
    totalResponses: number;
    cacheHitRate: number;
    avgResponseTime: number;
  }> {
    if (!this.cache) {
      return {
        totalResponses: 0,
        cacheHitRate: 0,
        avgResponseTime: 0,
      };
    }

    const stats = await this.cache.getCacheStats();
    
    return {
      totalResponses: stats.hits + stats.misses,
      cacheHitRate: stats.hitRate,
      avgResponseTime: 0, // This would need to be tracked separately
    };
  }
}

// Singleton instance
let aiCache: AICache | null = null;

export const getAICache = async (): Promise<AICache> => {
  if (!aiCache) {
    aiCache = new AICache();
    await aiCache.initialize();
  }
  return aiCache;
};