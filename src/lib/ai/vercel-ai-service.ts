/**
 * Vercel AI SDK Service with Intelligent Provider Routing
 *
 * Production-ready AI service using Vercel AI SDK for:
 * - Multi-provider orchestration (DeepSeek, OpenAI, Anthropic)
 * - SMART ROUTING: Automatic provider selection based on task type
 * - Intelligent fallback and retry logic
 * - Streaming with better error handling
 * - Tool calling for autonomous agents
 * - Structured outputs with Zod validation
 * - Cost optimization through intelligent routing
 * - Integration with Vercel AI Gateway
 *
 * ROUTING STRATEGY:
 * - Structured outputs (with schema) → OpenAI/Anthropic (reliable validation)
 * - Tool calling → OpenAI/Anthropic (better tool support)
 * - Conversational/Analysis → DeepSeek (cost-effective, high quality)
 * - Fallback: Always tries next provider if current fails
 */

import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { generateText, streamText, generateObject, LanguageModel } from 'ai';
import { aiCache } from '@/lib/cache';
import { z } from 'zod';

// Task type for intelligent routing
export enum TaskType {
  CONVERSATIONAL = 'conversational', // DeepSeek optimal
  STRUCTURED = 'structured',         // OpenAI/Anthropic optimal
  TOOL_CALLING = 'tool_calling',     // OpenAI/Anthropic optimal
  ANALYSIS = 'analysis',             // DeepSeek optimal
}

// Provider configuration
interface ProviderConfig {
  name: string;
  model: LanguageModel;
  priority: number;
  enabled: boolean;
  strengths: TaskType[]; // What this provider is good at
  costPerToken: number;  // Relative cost (1 = cheapest)
}

// Enhanced options with Vercel AI SDK features
export interface VercelAIOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
  // Vercel AI SDK specific
  tools?: Record<string, any>;
  toolChoice?: 'auto' | 'required' | { type: 'tool'; toolName: string };
  maxRetries?: number;
  abortSignal?: AbortSignal;
  schema?: z.ZodSchema; // For structured outputs
}

/**
 * VercelAIService - Leveraging Vercel AI SDK with Smart Routing
 */
export class VercelAIService {
  private providers: ProviderConfig[] = [];
  private openai: ReturnType<typeof createOpenAI> | null = null;
  private anthropic: ReturnType<typeof createAnthropic> | null = null;
  private deepseek: ReturnType<typeof createDeepSeek> | null = null;

  // Usage tracking
  private usageStats = {
    totalRequests: 0,
    byProvider: {} as Record<string, number>,
    byTaskType: {} as Record<string, number>,
    estimatedCost: 0,
  };

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // DeepSeek (primary for conversational/analysis - cost-effective)
    if (process.env.DEEPSEEK_API_KEY) {
      this.deepseek = createDeepSeek({
        apiKey: process.env.DEEPSEEK_API_KEY,
      });
      this.providers.push({
        name: 'DeepSeek',
        model: this.deepseek('deepseek-chat'),
        priority: 1,
        enabled: true,
        strengths: [TaskType.CONVERSATIONAL, TaskType.ANALYSIS],
        costPerToken: 1, // Baseline (cheapest)
      });
    }

    // OpenAI (structured outputs and tool calling)
    if (process.env.OPENAI_API_KEY) {
      this.openai = createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        compatibility: 'strict',
      });
      this.providers.push({
        name: 'OpenAI',
        model: this.openai('gpt-4-turbo-preview'),
        priority: 2,
        enabled: true,
        strengths: [TaskType.STRUCTURED, TaskType.TOOL_CALLING],
        costPerToken: 10, // ~10x more expensive
      });
    }

    // Anthropic (structured outputs and tool calling)
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.providers.push({
        name: 'Anthropic',
        model: this.anthropic('claude-3-5-sonnet-20241022'),
        priority: 3,
        enabled: true,
        strengths: [TaskType.STRUCTURED, TaskType.TOOL_CALLING],
        costPerToken: 12, // Slightly more than OpenAI
      });
    }

    console.log(`🚀 Vercel AI Service initialized with ${this.providers.length} providers`);
    console.log(`📊 Smart Routing enabled for cost optimization`);
  }

  /**
   * Determine optimal provider order based on task type
   */
  private getOptimalProviderOrder(taskType: TaskType): ProviderConfig[] {
    // Sort providers by:
    // 1. Whether they have this task as a strength
    // 2. Cost (lower is better for strengths, higher for fallback reliability)
    const sorted = [...this.providers].filter(p => p.enabled).sort((a, b) => {
      const aHasStrength = a.strengths.includes(taskType);
      const bHasStrength = b.strengths.includes(taskType);

      // If one has strength and other doesn't, prioritize the one with strength
      if (aHasStrength && !bHasStrength) return -1;
      if (!aHasStrength && bHasStrength) return 1;

      // If both have strength, prefer cheaper
      if (aHasStrength && bHasStrength) {
        return a.costPerToken - b.costPerToken;
      }

      // If neither has strength, prefer more reliable (more expensive)
      return b.costPerToken - a.costPerToken;
    });

    const primary = sorted[0];
    if (primary) {
      console.log(`🎯 Smart routing: ${taskType} → ${primary.name} (optimal)`);
    }

    return sorted;
  }

  /**
   * Track usage for monitoring
   */
  private trackUsage(providerName: string, taskType: TaskType, tokenCount: number = 0) {
    this.usageStats.totalRequests++;
    this.usageStats.byProvider[providerName] = (this.usageStats.byProvider[providerName] || 0) + 1;
    this.usageStats.byTaskType[taskType] = (this.usageStats.byTaskType[taskType] || 0) + 1;

    // Estimate cost (rough approximation)
    const provider = this.providers.find(p => p.name === providerName);
    if (provider && tokenCount > 0) {
      const baseCost = 0.00001; // $0.00001 per token for cheapest
      this.usageStats.estimatedCost += tokenCount * baseCost * provider.costPerToken;
    }
  }

  /**
   * Complete with intelligent routing and fallback
   */
  async complete(prompt: string, options: VercelAIOptions = {}): Promise<string> {
    const {
      temperature = 0.7,
      maxTokens = 2048,
      topP,
      frequencyPenalty,
      presencePenalty,
      systemPrompt,
      tools,
      toolChoice,
      maxRetries = 3,
      abortSignal,
      schema,
    } = options;

    // Determine task type for smart routing
    const taskType = this.determineTaskType(schema, tools);

    // Check cache
    const cacheKey = this.generateCacheKey(prompt, options);
    const cached = await aiCache.getCachedResponse(
      cacheKey,
      'any', // Cache is provider-agnostic
      options
    );

    if (cached?.content) {
      console.log('📦 Cache hit');
      return cached.content;
    }

    // Get optimal provider order based on task type
    const providerOrder = this.getOptimalProviderOrder(taskType);
    let lastError: Error | null = null;

    // Try providers in optimal order
    for (const provider of providerOrder) {
      try {
        const model = provider.model;

        // Structured output with schema
        if (schema) {
          console.log(`🔧 Generating structured output with ${provider.name}...`);
          const result = await generateObject({
            model,
            schema,
            prompt,
            system: systemPrompt,
            temperature,
            maxTokens,
            topP,
            frequencyPenalty,
            presencePenalty,
            maxRetries,
            abortSignal,
          });

          const response = JSON.stringify(result.object);
          await this.cacheResponse(cacheKey, response, provider.name);

          // Track usage
          this.trackUsage(provider.name, taskType, response.length / 4);

          console.log(`✅ Success with ${provider.name}`);
          return response;
        }

        // Standard text generation
        console.log(`💬 Generating text with ${provider.name}...`);
        const result = await generateText({
          model,
          prompt,
          system: systemPrompt,
          temperature,
          maxTokens,
          topP,
          frequencyPenalty,
          presencePenalty,
          tools,
          toolChoice,
          maxRetries,
          abortSignal,
        });

        await this.cacheResponse(cacheKey, result.text, provider.name);

        // Track usage
        this.trackUsage(provider.name, taskType, result.usage?.totalTokens || result.text.length / 4);

        console.log(`✅ Success with ${provider.name} (${result.usage?.totalTokens || 'unknown'} tokens)`);
        return result.text;

      } catch (error) {
        console.error(`❌ ${provider.name} failed:`, error);
        lastError = error as Error;

        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // Continue to next provider in the optimal order
        console.log(`🔄 Trying next provider...`);
      }
    }

    throw lastError || new Error('All AI providers failed');
  }

  /**
   * Determine task type from options
   */
  private determineTaskType(schema?: z.ZodSchema, tools?: Record<string, any>): TaskType {
    if (schema) return TaskType.STRUCTURED;
    if (tools && Object.keys(tools).length > 0) return TaskType.TOOL_CALLING;
    return TaskType.CONVERSATIONAL; // Default for analysis and chat
  }

  /**
   * Stream with intelligent fallback
   */
  async *stream(
    prompt: string,
    options: VercelAIOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const {
      temperature = 0.7,
      maxTokens = 2048,
      topP,
      frequencyPenalty,
      presencePenalty,
      systemPrompt,
      tools,
      toolChoice,
      maxRetries = 3,
      abortSignal,
    } = options;

    let lastError: Error | null = null;

    for (const provider of this.providers.filter(p => p.enabled)) {
      try {
        const result = streamText({
          model: provider.model,
          prompt,
          system: systemPrompt,
          temperature,
          maxTokens,
          topP,
          frequencyPenalty,
          presencePenalty,
          tools,
          toolChoice,
          maxRetries,
          abortSignal,
        });

        let fullText = '';
        for await (const chunk of result.textStream) {
          fullText += chunk;
          yield chunk;
        }

        // Cache complete response
        const cacheKey = this.generateCacheKey(prompt, options);
        await this.cacheResponse(cacheKey, fullText, provider.name);

        return;

      } catch (error) {
        console.error(`❌ ${provider.name} streaming failed:`, error);
        lastError = error as Error;

        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }
      }
    }

    throw lastError || new Error('All streaming providers failed');
  }

  /**
   * Process target setting query (backward compatibility)
   */
  async processTargetSettingQuery(query: string, organizationId: string) {
    const schema = z.object({
      message: z.string(),
      suggestions: z.array(z.string()),
      targetData: z.object({
        target_name: z.string(),
        target_type: z.enum(['absolute', 'intensity', 'net_zero', 'renewable']),
        baseline_year: z.number(),
        baseline_value: z.number(),
        target_year: z.number(),
        target_value: z.number(),
        unit: z.string(),
        scope_coverage: z.array(z.string()),
        is_science_based: z.boolean(),
        description: z.string(),
      }).optional(),
    });

    const prompt = `You are an expert sustainability advisor. Analyze this target setting request and provide guidance.

User Request: "${query}"
Organization ID: ${organizationId}

Provide a helpful response with suggestions. Only include targetData if the user is ready to create a specific target.`;

    try {
      const response = await this.complete(prompt, {
        temperature: 0.7,
        schema,
      });

      return JSON.parse(response);
    } catch (error) {
      console.error('Target setting error:', error);
      return {
        message: "I apologize, but I encountered an error. Please try again or be more specific.",
        suggestions: [
          "Set a net zero target",
          "Create a renewable energy target",
          "Set up a waste reduction target"
        ]
      };
    }
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return this.providers
      .filter(p => p.enabled)
      .map(p => p.name);
  }

  /**
   * Get provider status
   */
  getProviderStatus() {
    return {
      total: this.providers.length,
      enabled: this.providers.filter(p => p.enabled).length,
      providers: this.providers.map(p => ({
        name: p.name,
        priority: p.priority,
        enabled: p.enabled,
        strengths: p.strengths,
        relativeCost: p.costPerToken,
      })),
      routing: {
        [TaskType.CONVERSATIONAL]: this.getOptimalProviderOrder(TaskType.CONVERSATIONAL)[0]?.name || 'none',
        [TaskType.STRUCTURED]: this.getOptimalProviderOrder(TaskType.STRUCTURED)[0]?.name || 'none',
        [TaskType.TOOL_CALLING]: this.getOptimalProviderOrder(TaskType.TOOL_CALLING)[0]?.name || 'none',
        [TaskType.ANALYSIS]: this.getOptimalProviderOrder(TaskType.ANALYSIS)[0]?.name || 'none',
      },
    };
  }

  /**
   * Get usage statistics
   */
  getUsageStats() {
    return {
      ...this.usageStats,
      averageCostPerRequest: this.usageStats.totalRequests > 0
        ? this.usageStats.estimatedCost / this.usageStats.totalRequests
        : 0,
    };
  }

  /**
   * Reset usage statistics
   */
  resetUsageStats() {
    this.usageStats = {
      totalRequests: 0,
      byProvider: {},
      byTaskType: {},
      estimatedCost: 0,
    };
  }

  // Helper methods
  private generateCacheKey(prompt: string, options: VercelAIOptions): string {
    return `${prompt}_${JSON.stringify({
      model: options.model,
      temperature: options.temperature,
    })}`;
  }

  private async cacheResponse(
    cacheKey: string,
    content: string,
    provider: string
  ): Promise<void> {
    try {
      await aiCache.cacheResponse(
        cacheKey,
        {
          content,
          provider,
          timestamp: new Date().toISOString(),
        },
        provider,
        {}
      );
    } catch (error) {
      console.warn('Cache failed:', error);
    }
  }
}

// Singleton
export const vercelAIService = new VercelAIService();
