/**
 * Semantic Cache System
 * Phase 3, Task 3.2: Intelligent AI response caching using semantic similarity
 */

import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

export interface CacheEntry {
  id: string;
  requestHash: string;
  embedding: number[];
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  response: {
    content: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    finishReason: string;
    provider: string;
  };
  metadata: {
    userId?: string;
    organizationId?: string;
    conversationId?: string;
    provider: string;
    model: string;
    createdAt: number;
    accessCount: number;
    lastAccessedAt: number;
    contextLength: number;
    tags: string[];
  };
  ttl: number; // Time to live in seconds
}

export interface CacheMatch {
  entry: CacheEntry;
  similarity: number;
  source: 'exact' | 'semantic' | 'contextual';
}

export interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  totalRequests: number;
  avgSimilarity: number;
  storageUsed: string;
  costSavings: {
    totalTokensSaved: number;
    estimatedDollarsSaved: number;
    requestsAvoided: number;
  };
  topPatterns: Array<{
    pattern: string;
    hits: number;
    similarity: number;
  }>;
}

export interface CacheConfig {
  similarityThreshold: number;
  maxCacheSize: number;
  defaultTTL: number;
  embeddingModel: string;
  enableContextualMatching: boolean;
  enableSemanticSearch: boolean;
  maxEmbeddingDimensions: number;
}

/**
 * Semantic Cache Engine
 * Intelligent caching system that uses embeddings to find semantically similar requests
 */
export class SemanticCache {
  private redis: Redis;
  private openai: OpenAI;
  private config: CacheConfig;
  private stats: {
    hits: number;
    misses: number;
    totalSimilarity: number;
    totalRequests: number;
    startTime: number;
  };

  private readonly CACHE_KEY_PREFIX = 'semantic_cache:';
  private readonly EMBEDDING_KEY_PREFIX = 'embeddings:';
  private readonly STATS_KEY = 'cache:stats';
  private readonly PATTERN_KEY = 'cache:patterns';

  constructor(config?: Partial<CacheConfig>) {
    // Initialize Upstash Redis
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    // Initialize OpenAI for embeddings
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    // Configure cache settings
    this.config = {
      similarityThreshold: 0.85, // 85% similarity threshold
      maxCacheSize: 10000, // Maximum cache entries
      defaultTTL: 7 * 24 * 60 * 60, // 7 days default TTL
      embeddingModel: 'text-embedding-3-small', // OpenAI embedding model
      enableContextualMatching: true,
      enableSemanticSearch: true,
      maxEmbeddingDimensions: 1536, // OpenAI embedding dimensions
      ...config
    };

    // Initialize stats
    this.stats = {
      hits: 0,
      misses: 0,
      totalSimilarity: 0,
      totalRequests: 0,
      startTime: Date.now()
    };

  }

  /**
   * Generate cache key from messages
   */
  private generateCacheKey(messages: CacheEntry['messages'], provider: string, model: string): string {
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    const combined = `${provider}:${model}:${content}`;
    
    // Simple hash function for cache key
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `${this.CACHE_KEY_PREFIX}${Math.abs(hash).toString(36)}`;
  }

  /**
   * Generate embedding for message content
   */
  private async generateEmbedding(messages: CacheEntry['messages']): Promise<number[]> {
    try {
      // Combine all messages into a single text for embedding
      const text = messages
        .filter(m => m.role !== 'system') // Skip system messages for embedding
        .map(m => m.content)
        .join(' ');

      // Truncate if too long (OpenAI has token limits)
      const truncatedText = text.substring(0, 8000); // ~8k chars ≈ 2k tokens

      const response = await this.openai.embeddings.create({
        model: this.config.embeddingModel,
        input: truncatedText,
        dimensions: 512 // Use smaller dimensions for cost efficiency
      });

      return response.data[0].embedding;

    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      // Return zero vector as fallback
      return new Array(512).fill(0);
    }
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Find similar cache entries using semantic search
   */
  private async findSimilarEntries(
    embedding: number[], 
    provider: string, 
    model: string,
    limit: number = 5
  ): Promise<CacheMatch[]> {
    try {
      // Get all cache entries for this provider/model combination
      const pattern = `${this.CACHE_KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      const matches: CacheMatch[] = [];

      // Check each cached entry for similarity
      for (const key of keys.slice(0, 100)) { // Limit to first 100 for performance
        try {
          const entry = await this.redis.get(key) as CacheEntry | null;
          
          if (!entry || 
              entry.metadata.provider !== provider || 
              entry.metadata.model !== model) {
            continue;
          }

          // Calculate semantic similarity
          const similarity = this.calculateSimilarity(embedding, entry.embedding);
          
          if (similarity >= this.config.similarityThreshold) {
            matches.push({
              entry,
              similarity,
              source: similarity >= 0.98 ? 'exact' : 'semantic'
            });
          }
        } catch (error) {
          // Skip invalid entries
          continue;
        }
      }

      // Sort by similarity and return top matches
      return matches
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit);

    } catch (error) {
      console.error('❌ Failed to find similar entries:', error);
      return [];
    }
  }

  /**
   * Check cache for similar request
   */
  async get(
    messages: CacheEntry['messages'], 
    provider: string, 
    model: string,
    options?: {
      userId?: string;
      organizationId?: string;
      contextualMatch?: boolean;
    }
  ): Promise<CacheMatch | null> {
    this.stats.totalRequests++;

    try {
      // First try exact match
      const cacheKey = this.generateCacheKey(messages, provider, model);
      const exactMatch = await this.redis.get(cacheKey) as CacheEntry | null;
      
      if (exactMatch && exactMatch.ttl > Date.now()) {
        // Update access statistics
        exactMatch.metadata.accessCount++;
        exactMatch.metadata.lastAccessedAt = Date.now();
        await this.redis.setex(cacheKey, this.config.defaultTTL, exactMatch);
        
        this.stats.hits++;
        this.stats.totalSimilarity += 1.0;
        
        
        return {
          entry: exactMatch,
          similarity: 1.0,
          source: 'exact'
        };
      }

      // If no exact match and semantic search is enabled, try semantic matching
      if (this.config.enableSemanticSearch) {
        const embedding = await this.generateEmbedding(messages);
        const similarMatches = await this.findSimilarEntries(embedding, provider, model, 3);
        
        if (similarMatches.length > 0) {
          const bestMatch = similarMatches[0];
          
          // Apply contextual filtering if enabled
          if (this.config.enableContextualMatching && options?.organizationId) {
            const contextualMatch = similarMatches.find(match => 
              match.entry.metadata.organizationId === options.organizationId
            );
            if (contextualMatch) {
              // Boost similarity for same organization context
              contextualMatch.similarity += 0.05;
              contextualMatch.source = 'contextual';
              
              
              this.stats.hits++;
              this.stats.totalSimilarity += contextualMatch.similarity;
              
              // Update access stats
              contextualMatch.entry.metadata.accessCount++;
              contextualMatch.entry.metadata.lastAccessedAt = Date.now();
              
              return contextualMatch;
            }
          }
          
          
          this.stats.hits++;
          this.stats.totalSimilarity += bestMatch.similarity;
          
          // Update access stats
          bestMatch.entry.metadata.accessCount++;
          bestMatch.entry.metadata.lastAccessedAt = Date.now();
          
          return bestMatch;
        }
      }

      // No match found
      this.stats.misses++;
      
      return null;

    } catch (error) {
      console.error('❌ Cache get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Store response in cache
   */
  async set(
    messages: CacheEntry['messages'],
    response: CacheEntry['response'],
    options?: {
      userId?: string;
      organizationId?: string;
      conversationId?: string;
      ttl?: number;
      tags?: string[];
    }
  ): Promise<string> {
    try {
      const cacheKey = this.generateCacheKey(messages, response.provider, response.model);
      const embedding = await this.generateEmbedding(messages);
      
      const entry: CacheEntry = {
        id: uuidv4(),
        requestHash: cacheKey,
        embedding,
        messages,
        response,
        metadata: {
          userId: options?.userId,
          organizationId: options?.organizationId,
          conversationId: options?.conversationId,
          provider: response.provider,
          model: response.model,
          createdAt: Date.now(),
          accessCount: 1,
          lastAccessedAt: Date.now(),
          contextLength: messages.reduce((sum, m) => sum + m.content.length, 0),
          tags: options?.tags || []
        },
        ttl: Date.now() + ((options?.ttl || this.config.defaultTTL) * 1000)
      };

      // Store in cache
      await this.redis.setex(
        cacheKey, 
        options?.ttl || this.config.defaultTTL,
        entry
      );

      // Update cache size management
      await this.manageCacheSize();

      
      return entry.id;

    } catch (error) {
      console.error('❌ Cache set error:', error);
      throw error;
    }
  }

  /**
   * Manage cache size by removing least recently used entries
   */
  private async manageCacheSize(): Promise<void> {
    try {
      const pattern = `${this.CACHE_KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      if (keys.length <= this.config.maxCacheSize) {
        return;
      }


      // Get all entries with their last access time
      const entries: Array<{ key: string; lastAccessed: number; accessCount: number }> = [];
      
      for (const key of keys) {
        try {
          const entry = await this.redis.get(key) as CacheEntry | null;
          if (entry) {
            entries.push({
              key,
              lastAccessed: entry.metadata.lastAccessedAt,
              accessCount: entry.metadata.accessCount
            });
          }
        } catch (error) {
          // Remove invalid entries
          await this.redis.del(key);
        }
      }

      // Sort by access count (ascending) then by last access time (ascending)  
      // This removes least frequently used AND least recently used entries
      entries.sort((a, b) => {
        if (a.accessCount !== b.accessCount) {
          return a.accessCount - b.accessCount;
        }
        return a.lastAccessed - b.lastAccessed;
      });

      // Remove entries beyond cache size limit
      const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
      const removeKeys = toRemove.map(e => e.key);
      
      if (removeKeys.length > 0) {
        await this.redis.del(...removeKeys);
      }

    } catch (error) {
      console.error('❌ Cache size management error:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const pattern = `${this.CACHE_KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      let totalEntries = keys.length;
      let totalTokensSaved = 0;
      let storageUsed = 0;
      const patterns: Map<string, { hits: number; similarity: number }> = new Map();

      // Analyze cache entries
      for (const key of keys.slice(0, 100)) { // Sample for performance
        try {
          const entry = await this.redis.get(key) as CacheEntry | null;
          if (entry) {
            totalTokensSaved += entry.response.usage.totalTokens * (entry.metadata.accessCount - 1);
            storageUsed += JSON.stringify(entry).length;
            
            // Track patterns
            const pattern = `${entry.metadata.provider}:${entry.metadata.model}`;
            const existing = patterns.get(pattern) || { hits: 0, similarity: 0 };
            existing.hits += entry.metadata.accessCount;
            patterns.set(pattern, existing);
          }
        } catch (error) {
          // Skip invalid entries
        }
      }

      const runtime = (Date.now() - this.stats.startTime) / 1000 / 60; // minutes
      const hitRate = this.stats.totalRequests > 0 ? (this.stats.hits / this.stats.totalRequests) * 100 : 0;
      const missRate = 100 - hitRate;
      const avgSimilarity = this.stats.hits > 0 ? this.stats.totalSimilarity / this.stats.hits : 0;

      // Estimate cost savings (rough calculation)
      const avgTokenCost = 0.00002; // $0.00002 per token (approximate)
      const estimatedDollarsSaved = totalTokensSaved * avgTokenCost;

      return {
        totalEntries,
        hitRate: Math.round(hitRate * 100) / 100,
        missRate: Math.round(missRate * 100) / 100,
        totalHits: this.stats.hits,
        totalMisses: this.stats.misses,
        totalRequests: this.stats.totalRequests,
        avgSimilarity: Math.round(avgSimilarity * 1000) / 1000,
        storageUsed: this.formatBytes(storageUsed),
        costSavings: {
          totalTokensSaved,
          estimatedDollarsSaved: Math.round(estimatedDollarsSaved * 100) / 100,
          requestsAvoided: this.stats.hits
        },
        topPatterns: Array.from(patterns.entries())
          .sort((a, b) => b[1].hits - a[1].hits)
          .slice(0, 10)
          .map(([pattern, data]) => ({
            pattern,
            hits: data.hits,
            similarity: data.similarity
          }))
      };

    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      throw error;
    }
  }

  /**
   * Clear cache entries
   */
  async clear(options?: {
    provider?: string;
    model?: string;
    olderThan?: number; // milliseconds
    pattern?: string;
  }): Promise<number> {
    try {
      const pattern = options?.pattern || `${this.CACHE_KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      let keysToDelete: string[] = [];
      
      if (options?.provider || options?.model || options?.olderThan) {
        // Filter keys based on criteria
        for (const key of keys) {
          try {
            const entry = await this.redis.get(key) as CacheEntry | null;
            if (entry) {
              let shouldDelete = true;
              
              if (options.provider && entry.metadata.provider !== options.provider) {
                shouldDelete = false;
              }
              
              if (options.model && entry.metadata.model !== options.model) {
                shouldDelete = false;
              }
              
              if (options.olderThan && entry.metadata.createdAt > (Date.now() - options.olderThan)) {
                shouldDelete = false;
              }
              
              if (shouldDelete) {
                keysToDelete.push(key);
              }
            }
          } catch (error) {
            // Delete invalid entries
            keysToDelete.push(key);
          }
        }
      } else {
        // Delete all matching pattern
        keysToDelete = keys;
      }
      
      if (keysToDelete.length > 0) {
        await this.redis.del(...keysToDelete);
      }
      
      return keysToDelete.length;

    } catch (error) {
      console.error('❌ Cache clear error:', error);
      throw error;
    }
  }

  /**
   * Warm cache with common queries
   */
  async warmCache(commonQueries: Array<{
    messages: CacheEntry['messages'];
    provider: string;
    model: string;
    tags?: string[];
  }>): Promise<void> {
    
    for (const query of commonQueries) {
      try {
        // Check if already cached
        const existing = await this.get(query.messages, query.provider, query.model);
        if (existing) {
          continue;
        }
        
        // Generate a placeholder response for cache warming
        const placeholderResponse = {
          content: 'Cache warming placeholder - will be replaced with actual response',
          model: query.model,
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          finishReason: 'cache_warming',
          provider: query.provider
        };
        
        await this.set(query.messages, placeholderResponse, {
          tags: [...(query.tags || []), 'cache_warming'],
          ttl: 60 * 60 * 24 // 24 hours for warming entries
        });
        
      } catch (error) {
        console.error('❌ Cache warming error for query:', error);
      }
    }
    
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Cleanup expired entries
   */
  async cleanup(): Promise<void> {
    try {
      const pattern = `${this.CACHE_KEY_PREFIX}*`;
      const keys = await this.redis.keys(pattern);
      
      let expiredCount = 0;
      
      for (const key of keys) {
        try {
          const entry = await this.redis.get(key) as CacheEntry | null;
          if (entry && entry.ttl <= Date.now()) {
            await this.redis.del(key);
            expiredCount++;
          }
        } catch (error) {
          // Remove invalid entries
          await this.redis.del(key);
          expiredCount++;
        }
      }
      
      if (expiredCount > 0) {
      }
      
    } catch (error) {
      console.error('❌ Cache cleanup error:', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    // Upstash Redis is connectionless - no cleanup needed
  }
}

/**
 * Create semantic cache instance
 */
export function createSemanticCache(config?: Partial<CacheConfig>): SemanticCache {
  return new SemanticCache(config);
}