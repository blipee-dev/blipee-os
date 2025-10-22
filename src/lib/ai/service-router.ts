/**
 * AI Service Router
 *
 * Smart router that switches between legacy AI service and Vercel AI service
 * based on feature flags. Enables safe deployment with gradual rollout.
 */

import { aiService } from './service'; // Legacy service
import { vercelAIService, VercelAIOptions } from './vercel-ai-service'; // New service
import { shouldUseVercelAI } from '@/lib/feature-flags';
import { CompletionOptions, StreamOptions } from './types';

interface RouterContext {
  organizationId?: string;
  userId?: string;
}

/**
 * Smart AI Service Router
 *
 * Automatically routes to Vercel AI or legacy service based on:
 * - Feature flag enabled/disabled
 * - Beta organization allowlist
 * - Gradual rollout percentage
 */
export class AIServiceRouter {
  /**
   * Complete a prompt with automatic service selection
   */
  async complete(
    prompt: string,
    options?: CompletionOptions | VercelAIOptions,
    context?: RouterContext
  ): Promise<string> {
    // Check if Vercel AI should be used
    if (shouldUseVercelAI(context?.organizationId, context?.userId)) {
      console.log('🎯 Routing to Vercel AI Service (new)');

      try {
        return await vercelAIService.complete(prompt, options as VercelAIOptions);
      } catch (error) {
        console.error('Vercel AI failed, falling back to legacy:', error);
        // Fallback to legacy if Vercel AI fails
        return aiService.complete(prompt, options as CompletionOptions);
      }
    }

    // Use legacy service
    console.log('📦 Routing to Legacy AI Service');
    return aiService.complete(prompt, options as CompletionOptions);
  }

  /**
   * Stream a prompt with automatic service selection
   */
  async *stream(
    prompt: string,
    options?: StreamOptions | VercelAIOptions,
    context?: RouterContext
  ): AsyncGenerator<string, void, unknown> {
    if (shouldUseVercelAI(context?.organizationId, context?.userId)) {
      console.log('🎯 Streaming with Vercel AI Service (new)');

      try {
        yield* vercelAIService.stream(prompt, options as VercelAIOptions);
      } catch (error) {
        console.error('Vercel AI streaming failed, falling back to legacy:', error);
        // Fallback to legacy
        yield* aiService.stream(prompt, options as StreamOptions);
      }
    } else {
      console.log('📦 Streaming with Legacy AI Service');
      yield* aiService.stream(prompt, options as StreamOptions);
    }
  }

  /**
   * Process target setting query with automatic service selection
   */
  async processTargetSettingQuery(
    query: string,
    organizationId: string,
    context?: RouterContext
  ): Promise<any> {
    if (shouldUseVercelAI(organizationId, context?.userId)) {
      console.log('🎯 Target setting with Vercel AI Service (new)');

      try {
        return await vercelAIService.processTargetSettingQuery(query, organizationId);
      } catch (error) {
        console.error('Vercel AI target setting failed, falling back to legacy:', error);
        return aiService.processTargetSettingQuery(query, organizationId);
      }
    }

    console.log('📦 Target setting with Legacy AI Service');
    return aiService.processTargetSettingQuery(query, organizationId);
  }

  /**
   * Get available providers (from active service)
   */
  getAvailableProviders(context?: RouterContext): string[] {
    if (shouldUseVercelAI(context?.organizationId, context?.userId)) {
      return vercelAIService.getAvailableProviders();
    }
    return aiService.getAvailableProviders();
  }

  /**
   * Get service status (includes routing info)
   */
  getServiceStatus(context?: RouterContext) {
    const isUsingVercelAI = shouldUseVercelAI(context?.organizationId, context?.userId);

    return {
      activeService: isUsingVercelAI ? 'vercel-ai' : 'legacy',
      vercelAI: isUsingVercelAI ? vercelAIService.getProviderStatus() : null,
      legacy: !isUsingVercelAI ? {
        providers: aiService.getAvailableProviders(),
      } : null,
    };
  }
}

/**
 * Singleton instance
 * Use this instead of aiService for automatic routing
 */
export const aiServiceRouter = new AIServiceRouter();

/**
 * Export as default for backward compatibility
 * Can replace aiService imports with aiServiceRouter
 */
export default aiServiceRouter;
