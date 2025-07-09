import { getCacheService } from '@/lib/cache/cache-service';
import { getAICache } from '@/lib/cache/ai-cache';
import crypto from 'crypto';

export interface CacheStrategy {
  name: string;
  shouldCache: (query: string, context: any) => boolean;
  getCacheKey: (query: string, context: any) => string;
  getTTL: (query: string, context: any) => number;
  transformResponse?: (response: any) => any;
}

// Semantic similarity cache
export class SemanticCache {
  private embeddings: Map<string, number[]> = new Map();
  private threshold = 0.85; // Similarity threshold

  async getSimilarQuery(query: string): Promise<string | null> {
    const queryEmbedding = await this.getEmbedding(query);
    
    let bestMatch: { query: string; similarity: number } | null = null;
    
    for (const [cachedQuery, embedding] of Array.from(this.embeddings.entries())) {
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);
      
      if (similarity > this.threshold) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = { query: cachedQuery, similarity };
        }
      }
    }
    
    return bestMatch?.query || null;
  }

  async addQuery(query: string): Promise<void> {
    const embedding = await this.getEmbedding(query);
    this.embeddings.set(query, embedding);
    
    // Limit cache size
    if (this.embeddings.size > 1000) {
      const firstKey = this.embeddings.keys().next().value;
      if (firstKey !== undefined) {
        this.embeddings.delete(firstKey);
      }
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    // In production, this would call an embedding API
    // For now, use a simple hash-based approach
    const hash = crypto.createHash('sha256').update(text).digest();
    const embedding = [];
    
    for (let i = 0; i < 32; i++) {
      embedding.push(hash[i] / 255);
    }
    
    return embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  }
}

// Cache strategies
export const cacheStrategies: Record<string, CacheStrategy> = {
  // Simple queries - long cache
  simple: {
    name: 'Simple Query Cache',
    shouldCache: (query) => {
      const simplePatterns = [
        /what is/i,
        /show me/i,
        /current/i,
        /status/i,
        /temperature/i,
        /energy usage/i,
      ];
      return simplePatterns.some(pattern => pattern.test(query));
    },
    getCacheKey: (query, context) => {
      return crypto
        .createHash('md5')
        .update(`simple:${query.toLowerCase()}:${context.buildingId}`)
        .digest('hex');
    },
    getTTL: () => 3600, // 1 hour
  },

  // Analytics queries - medium cache
  analytics: {
    name: 'Analytics Cache',
    shouldCache: (query) => {
      const analyticsPatterns = [
        /report/i,
        /analytics/i,
        /trend/i,
        /comparison/i,
        /last (week|month|year)/i,
      ];
      return analyticsPatterns.some(pattern => pattern.test(query));
    },
    getCacheKey: (query, context) => {
      // Include date in key for time-based queries
      const date = new Date().toISOString().split('T')[0];
      return crypto
        .createHash('md5')
        .update(`analytics:${query}:${context.organizationId}:${date}`)
        .digest('hex');
    },
    getTTL: () => 1800, // 30 minutes
  },

  // Real-time queries - short cache
  realtime: {
    name: 'Real-time Cache',
    shouldCache: (query) => {
      const realtimePatterns = [
        /right now/i,
        /currently/i,
        /at this moment/i,
        /live/i,
      ];
      return realtimePatterns.some(pattern => pattern.test(query));
    },
    getCacheKey: (query, context) => {
      // Include minute in key for very short cache
      const minute = Math.floor(Date.now() / 60000);
      return crypto
        .createHash('md5')
        .update(`realtime:${query}:${context.buildingId}:${minute}`)
        .digest('hex');
    },
    getTTL: () => 60, // 1 minute
  },

  // Action queries - no cache
  action: {
    name: 'Action No-Cache',
    shouldCache: (query) => {
      const actionPatterns = [
        /turn on|turn off/i,
        /set|adjust|change/i,
        /create|delete|update/i,
        /generate new/i,
      ];
      return !actionPatterns.some(pattern => pattern.test(query));
    },
    getCacheKey: () => '',
    getTTL: () => 0,
  },
};

// Advanced AI response cache manager
export class AIResponseCacheManager {
  private cache: any;
  private semanticCache: SemanticCache;
  private hitRate = { hits: 0, total: 0 };

  constructor() {
    this.semanticCache = new SemanticCache();
  }

  async initialize() {
    this.cache = await getAICache();
  }

  async get(query: string, context: any): Promise<any | null> {
    this.hitRate.total++;

    // Try exact match first
    let response = await this.cache.getCachedResponse(query, context);
    
    if (response) {
      this.hitRate.hits++;
      return { ...response, cacheType: 'exact' };
    }

    // Try semantic similarity
    const similarQuery = await this.semanticCache.getSimilarQuery(query);
    if (similarQuery) {
      response = await this.cache.getCachedResponse(similarQuery, context);
      if (response) {
        this.hitRate.hits++;
        return { ...response, cacheType: 'semantic', originalQuery: similarQuery };
      }
    }

    return null;
  }

  async set(query: string, context: any, response: any): Promise<void> {
    // Determine best caching strategy
    const strategy = this.selectStrategy(query);
    
    if (!strategy.shouldCache(query, context)) {
      return;
    }

    const ttl = strategy.getTTL(query, context);
    
    // Cache the response
    await this.cache.cacheResponse(query, context, response, ttl);
    
    // Add to semantic cache
    await this.semanticCache.addQuery(query);
    
    // Log cache metrics
    console.log(`Cached with strategy: ${strategy.name}, TTL: ${ttl}s`);
  }

  private selectStrategy(query: string): CacheStrategy {
    // Check each strategy in order
    for (const strategy of Object.values(cacheStrategies)) {
      if (strategy.shouldCache(query, {})) {
        return strategy;
      }
    }
    
    return cacheStrategies.action; // Default to no-cache
  }

  getMetrics() {
    const hitRate = this.hitRate.total > 0 
      ? (this.hitRate.hits / this.hitRate.total) * 100 
      : 0;
      
    return {
      hitRate: hitRate.toFixed(2),
      totalRequests: this.hitRate.total,
      cacheHits: this.hitRate.hits,
      cacheMisses: this.hitRate.total - this.hitRate.hits,
    };
  }

  // Preload common queries
  async preloadCommonQueries(organizationId: string): Promise<void> {
    const commonQueries = [
      'What is our current energy usage?',
      'Show me the temperature',
      'How can we save energy?',
      'What is our carbon footprint?',
      'Show me this month\'s report',
    ];

    console.log('Preloading common queries...');
    
    for (const query of commonQueries) {
      // This would trigger the AI to generate and cache responses
      // In practice, this would be done during off-peak hours
    }
  }

  // Invalidate related caches
  async invalidateRelated(topic: string): Promise<void> {
    const patterns = {
      energy: ['energy', 'usage', 'consumption', 'power'],
      emissions: ['carbon', 'emissions', 'co2', 'footprint'],
      temperature: ['temperature', 'hvac', 'climate', 'comfort'],
      cost: ['cost', 'savings', 'expense', 'budget'],
    };

    const relatedTerms = patterns[topic as keyof typeof patterns] || [topic];
    
    // This would invalidate all caches containing these terms
    console.log(`Invalidating caches related to: ${relatedTerms.join(', ')}`);
  }
}

// Export singleton instance
export const aiCacheManager = new AIResponseCacheManager();