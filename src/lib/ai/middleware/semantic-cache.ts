/**
 * Semantic Caching Middleware
 *
 * Implements AI SDK's Language Model Middleware pattern for semantic caching.
 * Caches responses based on semantic similarity rather than exact matches.
 *
 * Official AI SDK Pattern:
 * https://sdk.vercel.ai/docs/ai-sdk-core/middleware
 */

import { experimental_wrapLanguageModel as wrapLanguageModel, type Experimental_LanguageModelV1Middleware as LanguageModelV1Middleware } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { metrics } from '@/lib/monitoring/metrics';

interface CacheEntry {
  id: string;
  query_embedding: number[];
  query_text: string;
  response_text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  created_at: string;
  hit_count: number;
  last_hit_at: string;
}

interface SemanticCacheConfig {
  enabled: boolean;
  similarityThreshold: number; // 0-1, higher = more strict
  ttlSeconds: number; // Time to live for cache entries
  organizationId: string;
  model: string;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generate embedding for text using OpenAI's embedding model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Search for semantically similar cached responses
 */
async function searchCache(
  queryEmbedding: number[],
  config: SemanticCacheConfig
): Promise<CacheEntry | null> {
  try {
    const supabase = createClient();

    // Get recent cache entries for this model and organization
    const { data: cacheEntries, error } = await supabase
      .from('semantic_cache')
      .select('*')
      .eq('model', config.model)
      .eq('organization_id', config.organizationId)
      .gte('created_at', new Date(Date.now() - config.ttlSeconds * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100); // Check last 100 entries

    if (error || !cacheEntries || cacheEntries.length === 0) {
      return null;
    }

    // Find the most similar entry
    let bestMatch: CacheEntry | null = null;
    let highestSimilarity = 0;

    for (const entry of cacheEntries) {
      const similarity = cosineSimilarity(queryEmbedding, entry.query_embedding);

      if (similarity >= config.similarityThreshold && similarity > highestSimilarity) {
        highestSimilarity = similarity;
        bestMatch = entry as CacheEntry;
      }
    }

    if (bestMatch) {
      // Update hit count and last hit time
      await supabase
        .from('semantic_cache')
        .update({
          hit_count: bestMatch.hit_count + 1,
          last_hit_at: new Date().toISOString()
        })
        .eq('id', bestMatch.id);

      metrics.incrementCounter('semantic_cache_hits', 1, {
        organization_id: config.organizationId,
        model: config.model
      });
    }

    return bestMatch;
  } catch (error) {
    console.error('Error searching cache:', error);
    return null;
  }
}

/**
 * Store response in semantic cache
 */
async function storeInCache(
  queryText: string,
  queryEmbedding: number[],
  responseText: string,
  usage: any,
  config: SemanticCacheConfig
): Promise<void> {
  try {
    const supabase = createClient();

    const { error } = await supabase
      .from('semantic_cache')
      .insert({
        organization_id: config.organizationId,
        query_text: queryText,
        query_embedding: queryEmbedding,
        response_text: responseText,
        model: config.model,
        usage,
        hit_count: 0
      });

    if (error) {
      console.error('Error storing in cache:', error);
    } else {
      metrics.incrementCounter('semantic_cache_stores', 1, {
        organization_id: config.organizationId,
        model: config.model
      });
    }
  } catch (error) {
    console.error('Error storing in cache:', error);
  }
}

/**
 * Semantic Cache Middleware
 *
 * Official AI SDK Middleware Pattern
 */
export function createSemanticCacheMiddleware(
  config: SemanticCacheConfig
): LanguageModelV1Middleware {
  return {
    // Transform params before sending to LLM
    transformParams: async ({ params }) => {
      if (!config.enabled) {
        return params;
      }

      try {
        // Extract the last user message
        const messages = params.prompt;
        const lastUserMessage = messages
          .filter((m: any) => m.role === 'user')
          .pop();

        if (!lastUserMessage || !lastUserMessage.content) {
          return params;
        }

        // Generate embedding for the query
        const queryText = typeof lastUserMessage.content === 'string'
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content);

        const queryEmbedding = await generateEmbedding(queryText);

        // Search cache
        const cachedEntry = await searchCache(queryEmbedding, config);

        if (cachedEntry) {
          // Cache hit! Return cached response
          console.log('✅ Semantic cache HIT:', {
            query: queryText.substring(0, 50) + '...',
            cached: cachedEntry.query_text.substring(0, 50) + '...',
            hitCount: cachedEntry.hit_count,
            tokensSaved: cachedEntry.usage.totalTokens
          });

          // Store in request context for later use
          (params as any)._cacheHit = {
            found: true,
            response: cachedEntry.response_text,
            usage: cachedEntry.usage,
            queryEmbedding
          };
        } else {
          // Cache miss - store embedding for later
          (params as any)._cacheHit = {
            found: false,
            queryText,
            queryEmbedding
          };

          metrics.incrementCounter('semantic_cache_misses', 1, {
            organization_id: config.organizationId,
            model: config.model
          });
        }
      } catch (error) {
        console.error('Error in semantic cache middleware:', error);
      }

      return params;
    },

    // Wrap the doStream method to intercept responses
    wrapStream: async ({ doStream, params }) => {
      const cacheHit = (params as any)._cacheHit;

      // If we have a cache hit, return cached response
      if (cacheHit?.found) {
        // Simulate streaming the cached response
        return {
          stream: (async function* () {
            const words = cacheHit.response.split(' ');
            for (const word of words) {
              yield {
                type: 'text-delta' as const,
                textDelta: word + ' '
              };
            }
            yield {
              type: 'finish' as const,
              finishReason: 'stop' as const,
              usage: cacheHit.usage
            };
          })(),
          rawCall: { rawPrompt: null, rawSettings: {} }
        };
      }

      // Cache miss - call the actual model and cache the response
      const { stream, ...rest } = await doStream();

      let fullResponse = '';
      let finalUsage: any = null;

      return {
        stream: (async function* () {
          for await (const chunk of stream) {
            if (chunk.type === 'text-delta') {
              fullResponse += chunk.textDelta;
            } else if (chunk.type === 'finish') {
              finalUsage = chunk.usage;
            }
            yield chunk;
          }

          // Store in cache after streaming completes
          if (cacheHit && finalUsage) {
            await storeInCache(
              cacheHit.queryText,
              cacheHit.queryEmbedding,
              fullResponse,
              finalUsage,
              config
            );
          }
        })(),
        ...rest
      };
    }
  };
}

/**
 * Wrap a language model with semantic caching
 *
 * Usage:
 * ```typescript
 * const cachedModel = wrapModelWithCache(
 *   openai('gpt-4o'),
 *   { organizationId: 'org-123', enabled: true }
 * );
 *
 * const result = streamText({
 *   model: cachedModel,
 *   messages: [...]
 * });
 * ```
 */
export function wrapModelWithCache(
  model: any,
  config: Partial<SemanticCacheConfig> & { organizationId: string }
) {
  const fullConfig: SemanticCacheConfig = {
    enabled: config.enabled ?? true,
    similarityThreshold: config.similarityThreshold ?? 0.95,
    ttlSeconds: config.ttlSeconds ?? 3600, // 1 hour default
    organizationId: config.organizationId,
    model: config.model ?? 'gpt-4o'
  };

  return wrapLanguageModel({
    model,
    middleware: createSemanticCacheMiddleware(fullConfig)
  });
}

/**
 * Clear expired cache entries
 * Should be run periodically (e.g., via cron job)
 */
export async function clearExpiredCache(ttlSeconds: number = 86400): Promise<void> {
  try {
    const supabase = createClient();

    const cutoffDate = new Date(Date.now() - ttlSeconds * 1000).toISOString();

    const { error } = await supabase
      .from('semantic_cache')
      .delete()
      .lt('created_at', cutoffDate);

    if (error) {
      console.error('Error clearing expired cache:', error);
    } else {
      console.log('✅ Cleared expired cache entries older than', cutoffDate);
    }
  } catch (error) {
    console.error('Error clearing expired cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(organizationId: string): Promise<{
  totalEntries: number;
  totalHits: number;
  avgHitsPerEntry: number;
  cacheHitRate: number;
  tokensSaved: number;
}> {
  try {
    const supabase = createClient();

    const { data: entries, error } = await supabase
      .from('semantic_cache')
      .select('hit_count, usage')
      .eq('organization_id', organizationId);

    if (error || !entries) {
      return {
        totalEntries: 0,
        totalHits: 0,
        avgHitsPerEntry: 0,
        cacheHitRate: 0,
        tokensSaved: 0
      };
    }

    const totalEntries = entries.length;
    const totalHits = entries.reduce((sum, e) => sum + e.hit_count, 0);
    const tokensSaved = entries.reduce((sum, e) => sum + (e.hit_count * e.usage.totalTokens), 0);

    return {
      totalEntries,
      totalHits,
      avgHitsPerEntry: totalEntries > 0 ? totalHits / totalEntries : 0,
      cacheHitRate: (totalHits / (totalEntries + totalHits)) * 100,
      tokensSaved
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalEntries: 0,
      totalHits: 0,
      avgHitsPerEntry: 0,
      cacheHitRate: 0,
      tokensSaved: 0
    };
  }
}
