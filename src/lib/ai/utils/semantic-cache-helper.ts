/**
 * PostgreSQL Semantic Cache Helper
 * Uses OpenAI embeddings + PostgreSQL pgvector for intelligent caching
 *
 * Cost: $0.0001 per 1K tokens (text-embedding-3-small)
 * Cache hit rate target: 70-80% after 1 week
 * Response time: 50ms (cached) vs 1-2s (LLM)
 */

import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/server';

interface CachedQuery {
  id: string;
  question_text: string;
  sql_query: string;
  response: any;
  similarity: number;
  hit_count: number;
  created_at: string;
}

export class SemanticCacheHelper {
  private openai: OpenAI;
  private supabase = createAdminClient();

  // Cache configuration
  private readonly SIMILARITY_THRESHOLD = 0.85; // 85% similarity required
  private readonly EMBEDDING_MODEL = 'text-embedding-3-small';
  private readonly EMBEDDING_DIMENSIONS = 1536; // Full dimensions for best accuracy

  constructor() {
    // Initialize OpenAI client
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required for semantic caching');
    }
    this.openai = new OpenAI({ apiKey });
  }

  /**
   * Generate embedding for a text query
   * Cost: ~$0.0001 per 1K tokens
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate if too long (OpenAI has 8K token limit)
      const truncatedText = text.substring(0, 8000);

      const response = await this.openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: truncatedText,
        dimensions: this.EMBEDDING_DIMENSIONS
      });

      return response.data[0].embedding;

    } catch (error) {
      console.error('❌ Failed to generate embedding:', error);
      throw new Error('Embedding generation failed');
    }
  }

  /**
   * Check cache for similar questions
   * Uses PostgreSQL pgvector for fast cosine similarity search
   */
  async checkCache(
    question: string,
    organizationId: string
  ): Promise<CachedQuery | null> {
    try {
      console.log('🔍 Checking semantic cache for:', question.substring(0, 100));

      // Generate embedding for user question
      const questionEmbedding = await this.generateEmbedding(question);

      // Query database using match_similar_questions function
      const { data, error } = await this.supabase.rpc('match_similar_questions', {
        query_embedding: questionEmbedding,
        org_id: organizationId,
        similarity_threshold: this.SIMILARITY_THRESHOLD,
        match_count: 1
      });

      if (error) {
        console.error('❌ Cache lookup error:', error);
        return null;
      }

      if (data && data.length > 0) {
        const cached = data[0];
        console.log('✅ Cache HIT! Similarity:', cached.similarity, 'Hit count:', cached.hit_count);

        // Increment hit counter asynchronously (don't wait)
        this.incrementHitCount(cached.id).catch(err =>
          console.warn('⚠️ Failed to increment hit count:', err)
        );

        return cached;
      }

      console.log('❌ Cache MISS - will query database and cache result');
      return null;

    } catch (error) {
      console.error('❌ Cache check failed:', error);
      return null; // Graceful degradation - proceed without cache
    }
  }

  /**
   * Store query result in cache with embedding
   */
  async storeInCache(
    question: string,
    response: any,
    organizationId: string,
    userId?: string
  ): Promise<void> {
    try {
      console.log('💾 Storing in cache:', question.substring(0, 100));

      // Generate embedding
      const questionEmbedding = await this.generateEmbedding(question);

      // Extract SQL query if present (for debugging/analytics)
      const sqlQuery = response.metadata?.toolsUsed?.includes('exploreData')
        ? 'SQL query executed'
        : 'No SQL';

      // Store in database
      const { error } = await this.supabase
        .from('query_cache')
        .insert({
          organization_id: organizationId,
          question_text: question,
          question_embedding: questionEmbedding,
          sql_query: sqlQuery,
          response: response,
          hit_count: 0,
          created_by: userId || null
        });

      if (error) {
        console.error('❌ Failed to store in cache:', error);
      } else {
        console.log('✅ Cached successfully');
      }

    } catch (error) {
      console.error('❌ Cache storage failed:', error);
      // Don't throw - caching failure shouldn't break the response
    }
  }

  /**
   * Increment cache hit counter
   * Called asynchronously when cache is used
   */
  private async incrementHitCount(cacheId: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_cache_hit', {
      cache_id: cacheId
    });

    if (error) {
      console.error('❌ Failed to increment hit count:', error);
    }
  }

  /**
   * Get cache statistics for organization
   * Useful for monitoring cache effectiveness
   */
  async getCacheStats(organizationId: string): Promise<{
    totalQueries: number;
    avgHitCount: number;
    totalHits: number;
    cacheHitRate: number;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('query_cache')
        .select('hit_count')
        .eq('organization_id', organizationId);

      if (error || !data) {
        return { totalQueries: 0, avgHitCount: 0, totalHits: 0, cacheHitRate: 0 };
      }

      const totalQueries = data.length;
      const totalHits = data.reduce((sum, item) => sum + item.hit_count, 0);
      const avgHitCount = totalQueries > 0 ? totalHits / totalQueries : 0;
      const cacheHitRate = totalHits / (totalHits + totalQueries); // Approximate

      return {
        totalQueries,
        avgHitCount,
        totalHits,
        cacheHitRate
      };

    } catch (error) {
      console.error('❌ Failed to get cache stats:', error);
      return { totalQueries: 0, avgHitCount: 0, totalHits: 0, cacheHitRate: 0 };
    }
  }

  /**
   * Clear old cache entries (maintenance)
   * Run periodically to keep cache fresh
   */
  async clearOldEntries(organizationId: string, daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await this.supabase
        .from('query_cache')
        .delete()
        .eq('organization_id', organizationId)
        .lt('last_used_at', cutoffDate.toISOString())
        .select('id');

      if (error) {
        console.error('❌ Failed to clear old cache entries:', error);
        return 0;
      }

      const deletedCount = data?.length || 0;
      console.log(`🧹 Cleared ${deletedCount} old cache entries`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Cache cleanup failed:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const semanticCache = new SemanticCacheHelper();
