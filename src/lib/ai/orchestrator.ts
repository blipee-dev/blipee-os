/**
 * Intelligent AI Provider Orchestration System
 * 
 * Features:
 * - Smart routing based on task type, provider capabilities, and performance
 * - Health monitoring and circuit breaker patterns
 * - Cost optimization and load balancing
 * - Automatic failover with degradation handling
 */

import { AIProvider, CompletionOptions, StreamOptions } from './types';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';
import { DeepSeekProvider } from './providers/deepseek';
import { aiCache } from '@/lib/cache';
import { metrics } from '@/lib/monitoring/metrics';

export interface ProviderHealth {
  provider: string;
  isHealthy: boolean;
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
  failureCount: number;
  circuitBreakerOpen: boolean;
}

export interface ProviderCapabilities {
  provider: string;
  maxTokens: number;
  supportsStreaming: boolean;
  supportsVision: boolean;
  supportsToolUse: boolean;
  costPerToken: number;
  strengths: TaskType[];
  weaknesses: TaskType[];
}

export enum TaskType {
  GENERAL_CHAT = 'general_chat',
  SUSTAINABILITY_ANALYSIS = 'sustainability_analysis',
  DOCUMENT_PROCESSING = 'document_processing',
  DATA_ANALYSIS = 'data_analysis',
  CREATIVE_WRITING = 'creative_writing',
  CODE_GENERATION = 'code_generation',
  STRUCTURED_OUTPUT = 'structured_output',
  LONG_CONTEXT = 'long_context',
  REASONING = 'reasoning',
  COMPLIANCE_CHECK = 'compliance_check',
  TARGET_SETTING = 'target_setting'
}

export interface RoutingDecision {
  provider: AIProvider;
  reason: string;
  confidence: number;
  fallbackProviders: AIProvider[];
  estimatedCost: number;
  estimatedLatency: number;
}

export class AIOrchestrator {
  private providers: Map<string, AIProvider> = new Map();
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private providerCapabilities: Map<string, ProviderCapabilities> = new Map();
  private requestCount = 0;

  constructor() {
    this.initializeProviders();
    this.setupHealthMonitoring();
  }

  private initializeProviders() {
    // Initialize providers with their capabilities
    if (process.env.DEEPSEEK_API_KEY) {
      const provider = new DeepSeekProvider(process.env.DEEPSEEK_API_KEY);
      this.providers.set('deepseek', provider);
      this.providerCapabilities.set('deepseek', {
        provider: 'deepseek',
        maxTokens: 8192,
        supportsStreaming: true,
        supportsVision: false,
        supportsToolUse: false,
        costPerToken: 0.00014, // $0.14 per 1M tokens
        strengths: [TaskType.REASONING, TaskType.CODE_GENERATION, TaskType.GENERAL_CHAT],
        weaknesses: [TaskType.CREATIVE_WRITING, TaskType.DOCUMENT_PROCESSING]
      });
      this.initializeHealth('deepseek');
    }

    if (process.env['OPENAI_API_KEY']) {
      const provider = new OpenAIProvider(process.env['OPENAI_API_KEY']);
      this.providers.set('openai', provider);
      this.providerCapabilities.set('openai', {
        provider: 'openai',
        maxTokens: 128000,
        supportsStreaming: true,
        supportsVision: true,
        supportsToolUse: true,
        costPerToken: 0.005, // $5 per 1M tokens (GPT-4)
        strengths: [TaskType.GENERAL_CHAT, TaskType.REASONING, TaskType.STRUCTURED_OUTPUT],
        weaknesses: [TaskType.LONG_CONTEXT]
      });
      this.initializeHealth('openai');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      const provider = new AnthropicProvider(process.env.ANTHROPIC_API_KEY);
      this.providers.set('anthropic', provider);
      this.providerCapabilities.set('anthropic', {
        provider: 'anthropic',
        maxTokens: 200000,
        supportsStreaming: true,
        supportsVision: true,
        supportsToolUse: true,
        costPerToken: 0.015, // $15 per 1M tokens (Claude-3.5)
        strengths: [TaskType.LONG_CONTEXT, TaskType.REASONING, TaskType.CREATIVE_WRITING],
        weaknesses: [TaskType.CODE_GENERATION]
      });
      this.initializeHealth('anthropic');
    }

  }

  private initializeHealth(provider: string) {
    this.providerHealth.set(provider, {
      provider,
      isHealthy: true,
      responseTime: 0,
      errorRate: 0,
      lastCheck: new Date(),
      failureCount: 0,
      circuitBreakerOpen: false
    });
  }

  /**
   * Intelligently route requests to the best provider
   */
  async routeRequest(
    prompt: string, 
    taskType: TaskType = TaskType.GENERAL_CHAT,
    options?: CompletionOptions
  ): Promise<RoutingDecision> {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => {
        const health = this.providerHealth.get(provider.name);
        return health?.isHealthy && !health?.circuitBreakerOpen;
      });

    if (availableProviders.length === 0) {
      // Emergency fallback - try any provider
      const emergencyProvider = Array.from(this.providers.values())[0];
      if (!emergencyProvider) {
        throw new Error('No AI providers available');
      }
      
      return {
        provider: emergencyProvider,
        reason: 'Emergency fallback - all providers unhealthy',
        confidence: 0.1,
        fallbackProviders: [],
        estimatedCost: 0,
        estimatedLatency: 5000
      };
    }

    // Score providers based on multiple factors
    const scores = availableProviders.map(provider => {
      const capabilities = this.providerCapabilities.get(provider.name)!;
      const health = this.providerHealth.get(provider.name)!;
      
      let score = 0;
      
      // Task type matching (40% weight)
      if (capabilities.strengths.includes(taskType)) {
        score += 40;
      } else if (!capabilities.weaknesses.includes(taskType)) {
        score += 20;
      }
      
      // Health and performance (30% weight)
      score += (1 - health.errorRate) * 15;
      score += Math.max(0, (1000 - health.responseTime) / 1000) * 15;
      
      // Cost efficiency (20% weight) - lower cost = higher score
      const maxCost = Math.max(...Array.from(this.providerCapabilities.values()).map(c => c.costPerToken));
      score += (1 - capabilities.costPerToken / maxCost) * 20;
      
      // Load balancing (10% weight)
      score += Math.random() * 10;
      
      return {
        provider,
        score,
        capabilities,
        health
      };
    });

    // Sort by score (highest first)
    scores.sort((a, b) => b.score - a.score);
    
    const bestProvider = scores[0];
    const fallbackProviders = scores.slice(1).map(s => s.provider);
    
    // Calculate estimates
    const estimatedTokens = Math.ceil(prompt.length / 4); // Rough token estimate
    const estimatedCost = estimatedTokens * bestProvider.capabilities.costPerToken;
    const estimatedLatency = bestProvider.health.responseTime || 1000;
    
    return {
      provider: bestProvider.provider,
      reason: this.getRoutingReason(bestProvider, taskType),
      confidence: Math.min(bestProvider.score / 100, 1),
      fallbackProviders,
      estimatedCost,
      estimatedLatency
    };
  }

  private getRoutingReason(scored: any, taskType: TaskType): string {
    const reasons = [];
    
    if (scored.capabilities.strengths.includes(taskType)) {
      reasons.push(`optimized for ${taskType}`);
    }
    
    if (scored.health.responseTime < 1000) {
      reasons.push('low latency');
    }
    
    if (scored.health.errorRate < 0.1) {
      reasons.push('high reliability');
    }
    
    if (scored.capabilities.costPerToken < 0.001) {
      reasons.push('cost-effective');
    }
    
    return reasons.join(', ') || 'best available option';
  }

  /**
   * Execute completion with intelligent routing
   */
  async complete(
    prompt: string,
    taskType: TaskType = TaskType.GENERAL_CHAT,
    options?: CompletionOptions
  ): Promise<string> {
    this.requestCount++;
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = `orchestrator:${prompt.substring(0, 100)}:${taskType}:${JSON.stringify(options)}`;
    const cached = await aiCache.getResponse(cacheKey);
    if (cached) {
      metrics.incrementCounter('ai_orchestrator_cache_hits', 1, { task_type: taskType });
      return cached.content;
    }
    
    const routing = await this.routeRequest(prompt, taskType, options);
    
    let lastError: Error | null = null;
    
    // Try primary provider and fallbacks
    const providersToTry = [routing.provider, ...routing.fallbackProviders];
    
    for (const provider of providersToTry) {
      try {
        
        const response = await provider.complete(prompt, options);
        const responseTime = Date.now() - startTime;
        
        // Update health metrics
        this.updateProviderHealth(provider.name, true, responseTime);
        
        // Cache successful response
        await aiCache.cacheResponse(
          cacheKey,
          {
            content: response.content,
            provider: provider.name,
            timestamp: new Date().toISOString(),
            taskType,
            routing: {
              reason: routing.reason,
              confidence: routing.confidence,
              estimatedCost: routing.estimatedCost
            }
          },
          provider.name,
          options
        );
        
        // Record metrics
        metrics.incrementCounter('ai_orchestrator_requests', 1, {
          provider: provider.name,
          task_type: taskType,
          status: 'success'
        });
        
        metrics.recordHistogram('ai_orchestrator_response_time', responseTime, {
          provider: provider.name,
          task_type: taskType
        });
        
        return response.content;
        
      } catch (error) {
        console.error(`❌ Provider ${provider.name} failed:`, error);
        lastError = error as Error;
        
        // Update health metrics
        this.updateProviderHealth(provider.name, false, Date.now() - startTime);
        
        metrics.incrementCounter('ai_orchestrator_requests', 1, {
          provider: provider.name,
          task_type: taskType,
          status: 'error'
        });
      }
    }
    
    throw lastError || new Error('All AI providers failed');
  }

  /**
   * Execute streaming with intelligent routing
   */
  async *stream(
    prompt: string,
    taskType: TaskType = TaskType.GENERAL_CHAT,
    options?: StreamOptions
  ): AsyncGenerator<string, void, unknown> {
    const routing = await this.routeRequest(prompt, taskType, options);
    const startTime = Date.now();
    
    let lastError: Error | null = null;
    const providersToTry = [routing.provider, ...routing.fallbackProviders];
    
    for (const provider of providersToTry) {
      try {
        
        let tokenCount = 0;
        const tokens: string[] = [];
        
        for await (const token of provider.stream(prompt, options)) {
          tokenCount++;
          tokens.push(token.content);
          yield token.content;
        }
        
        const responseTime = Date.now() - startTime;
        
        // Update health metrics
        this.updateProviderHealth(provider.name, true, responseTime);
        
        // Cache the complete response
        const completeResponse = tokens.join('');
        const cacheKey = `orchestrator:${prompt.substring(0, 100)}:${taskType}:${JSON.stringify(options)}`;
        await aiCache.cacheResponse(
          cacheKey,
          {
            content: completeResponse,
            provider: provider.name,
            timestamp: new Date().toISOString(),
            taskType,
            routing: {
              reason: routing.reason,
              confidence: routing.confidence,
              estimatedCost: routing.estimatedCost
            }
          },
          provider.name,
          options
        );
        
        // Record metrics
        metrics.incrementCounter('ai_orchestrator_stream_requests', 1, {
          provider: provider.name,
          task_type: taskType,
          status: 'success'
        });
        
        metrics.recordHistogram('ai_orchestrator_stream_tokens', tokenCount, {
          provider: provider.name,
          task_type: taskType
        });
        
        return; // Successfully completed
        
      } catch (error) {
        console.error(`❌ Streaming provider ${provider.name} failed:`, error);
        lastError = error as Error;
        
        this.updateProviderHealth(provider.name, false, Date.now() - startTime);
        
        metrics.incrementCounter('ai_orchestrator_stream_requests', 1, {
          provider: provider.name,
          task_type: taskType,
          status: 'error'
        });
      }
    }
    
    throw lastError || new Error('All streaming providers failed');
  }

  /**
   * Update provider health metrics
   */
  private updateProviderHealth(provider: string, success: boolean, responseTime: number) {
    const health = this.providerHealth.get(provider);
    if (!health) return;
    
    health.lastCheck = new Date();
    health.responseTime = (health.responseTime * 0.8) + (responseTime * 0.2); // Moving average
    
    if (success) {
      health.failureCount = Math.max(0, health.failureCount - 1);
      health.errorRate = (health.errorRate * 0.9) + (0 * 0.1);
      
      // Close circuit breaker if enough successful requests
      if (health.circuitBreakerOpen && health.failureCount < 2) {
        health.circuitBreakerOpen = false;
      }
    } else {
      health.failureCount++;
      health.errorRate = (health.errorRate * 0.9) + (1 * 0.1);
      
      // Open circuit breaker after consecutive failures
      if (health.failureCount >= 3) {
        health.circuitBreakerOpen = true;
      }
    }
    
    health.isHealthy = !health.circuitBreakerOpen && health.errorRate < 0.5;
  }

  /**
   * Setup periodic health monitoring
   */
  private setupHealthMonitoring() {
    // Health check every 30 seconds
    setInterval(async () => {
      for (const [name, provider] of Array.from(this.providers.entries())) {
        const health = this.providerHealth.get(name);
        if (!health) continue;
        
        // Reset circuit breaker after 5 minutes
        if (health.circuitBreakerOpen && 
            Date.now() - health.lastCheck.getTime() > 5 * 60 * 1000) {
          health.circuitBreakerOpen = false;
          health.failureCount = 0;
        }
        
        // Log health status
      }
    }, 30000);
  }

  /**
   * Get provider health status
   */
  getProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealth.values());
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(): ProviderCapabilities[] {
    return Array.from(this.providerCapabilities.values());
  }

  /**
   * Manual health check for a provider
   */
  async checkProviderHealth(provider: string): Promise<boolean> {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) return false;
    
    const startTime = Date.now();
    try {
      await providerInstance.complete('Health check', { maxTokens: 10 });
      this.updateProviderHealth(provider, true, Date.now() - startTime);
      return true;
    } catch (error) {
      this.updateProviderHealth(provider, false, Date.now() - startTime);
      return false;
    }
  }

  /**
   * Force circuit breaker reset
   */
  resetCircuitBreaker(provider: string) {
    const health = this.providerHealth.get(provider);
    if (health) {
      health.circuitBreakerOpen = false;
      health.failureCount = 0;
      health.errorRate = 0;
      health.isHealthy = true;
    }
  }

  /**
   * Get orchestrator statistics
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      providers: this.providers.size,
      healthyProviders: Array.from(this.providerHealth.values()).filter(h => h.isHealthy).length,
      providerHealth: this.getProviderHealth(),
      capabilities: this.getProviderCapabilities()
    };
  }
}

// Export singleton instance
export const aiOrchestrator = new AIOrchestrator();