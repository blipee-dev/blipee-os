import { cache } from './service';
import { cacheConfig, cacheKeys } from './config';
import crypto from 'crypto';

export interface AIResponse {
  content: string;
  provider: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  timestamp: string;
  cached?: boolean;
  message?: string; // Backward compatibility
  suggestions?: string[];
  components?: any[];
}

/**
 * AI-specific caching with semantic similarity
 */
export class AICache {
  /**
   * Generate cache key for AI prompt
   */
  private generatePromptKey(
    prompt: string,
    provider?: string,
    options?: Record<string, any>
  ): string {
    // Create a normalized version of the prompt
    const normalizedPrompt = prompt.toLowerCase().trim();
    
    // Include important options in the key
    const optionsKey = options ? JSON.stringify({
      temperature: options.temperature,
      model: options.model,
      maxTokens: options.maxTokens,
    }) : '';

    // Generate hash
    const hash = crypto
      .createHash('sha256')
      .update(normalizedPrompt + optionsKey)
      .digest('hex')
      .substring(0, 16);

    return cacheKeys.ai.response(hash, provider);
  }

  /**
   * Cache AI response
   */
  async cacheResponse(
    prompt: string,
    response: AIResponse,
    provider?: string,
    options?: Record<string, any>
  ): Promise<boolean> {
    const key = this.generatePromptKey(prompt, provider, options);
    
    return cache.set(key, response, {
      ttl: cacheConfig.ttl.aiResponse,
      compress: true,
      tags: ['ai-response', `provider:${provider || 'default'}`],
    });
  }

  /**
   * Get cached AI response
   */
  async getCachedResponse(
    prompt: string,
    provider?: string,
    options?: Record<string, any>
  ): Promise<AIResponse | null> {
    const key = this.generatePromptKey(prompt, provider, options);
    const cached = await cache.get<AIResponse>(key);
    
    if (cached) {
      // Mark as cached
      cached.cached = true;
      
      // Update cache hit metrics
      console.log(`✅ AI Cache hit for prompt: ${prompt.substring(0, 50)}...`);
    }
    
    return cached;
  }

  /**
   * Get or generate AI response with caching
   */
  async getOrGenerateResponse(
    prompt: string,
    generator: () => Promise<AIResponse>,
    provider?: string,
    options?: Record<string, any>
  ): Promise<AIResponse> {
    // Check cache first
    const cached = await this.getCachedResponse(prompt, provider, options);
    if (cached) {
      return cached;
    }

    // Generate new response
    const response = await generator();
    
    // Cache the response
    await this.cacheResponse(prompt, response, provider, options);
    
    return response;
  }

  /**
   * Cache conversation context
   */
  async cacheContext(
    conversationId: string,
    context: any,
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.ai.context(conversationId);
    
    return cache.set(key, context, {
      ttl: ttl || cacheConfig.ttl.aiContext,
      compress: true,
      tags: ['ai-context', `conversation:${conversationId}`],
    });
  }

  /**
   * Get conversation context
   */
  async getContext(conversationId: string): Promise<any | null> {
    const key = cacheKeys.ai.context(conversationId);
    return cache.get(key);
  }

  /**
   * Clear conversation context
   */
  async clearContext(conversationId: string): Promise<boolean> {
    const key = cacheKeys.ai.context(conversationId);
    return cache.delete(key);
  }

  /**
   * Invalidate AI cache by provider
   */
  async invalidateProvider(provider: string): Promise<number> {
    return cache.invalidateByTags([`provider:${provider}`]);
  }

  /**
   * Invalidate organization AI responses
   */
  async invalidateOrgResponses(organizationId: string): Promise<number> {
    return cache.invalidateByTags([`org:${organizationId}`]);
  }

  /**
   * Get AI cache statistics
   */
  async getStats(): Promise<{
    totalResponses: number;
    cacheHitRate: number;
    avgResponseTime: number;
    topPrompts: Array<{ prompt: string; hits: number }>;
  }> {
    const stats = cache.getStats();
    
    return {
      totalResponses: stats.hits + stats.misses,
      cacheHitRate: stats.hitRate,
      avgResponseTime: stats.avgResponseTime,
      topPrompts: [], // Implement tracking if needed
    };
  }
}

// Export singleton instance
export const aiCache = new AICache();

// Backward compatibility
export const getAICache = async (): Promise<AICache> => {
  return aiCache;
};