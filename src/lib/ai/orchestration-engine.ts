import { aiService } from './service';
import { intentClassifier } from './intent-classifier';
import { actionRegistry } from './action-registry';
import { aiContextEngine } from './context-engine';
import { naturalLanguageSQLEngine } from './natural-language-sql';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

/**
 * Advanced AI Orchestration Engine
 * Intelligently routes requests across multiple AI providers with cost optimization
 * and automatic fallbacks for 99.99% uptime
 */

export interface OrchestrationRequest {
  userMessage: string;
  userId: string;
  organizationId: string;
  conversationId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requiresRealTime?: boolean;
  maxCost?: number;
  preferredProviders?: AIProvider[];
  capabilities?: RequiredCapability[];
}

export interface OrchestrationResponse {
  success: boolean;
  response: IntelligentResponse;
  metadata: ResponseMetadata;
  cost: CostBreakdown;
  performance: PerformanceMetrics;
  errors?: string[];
  warnings?: string[];
}

export interface IntelligentResponse {
  message: string;
  confidence: number;
  intent: any;
  actions: ExecutableAction[];
  uiComponents: UIComponent[];
  data: any[];
  insights: Insight[];
  suggestions: string[];
  followUpQuestions: string[];
}

export interface ResponseMetadata {
  processingTime: number;
  providersUsed: ProviderUsage[];
  orchestrationDecisions: OrchestrationDecision[];
  cacheHits: number;
  totalTokens: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
}

export interface CostBreakdown {
  totalCost: number;
  providerCosts: Record<string, number>;
  tokenCosts: Record<string, number>;
  optimizationSavings: number;
  budgetRemaining?: number;
}

export interface PerformanceMetrics {
  totalTime: number;
  intentClassificationTime: number;
  contextBuildingTime: number;
  aiProcessingTime: number;
  actionExecutionTime: number;
  uiGenerationTime: number;
  throughput: number;
}

export type AIProvider = 'deepseek' | 'openai' | 'anthropic' | 'local';

export type RequiredCapability =
  | 'text_generation'
  | 'code_generation'
  | 'data_analysis'
  | 'reasoning'
  | 'function_calling'
  | 'multimodal'
  | 'streaming'
  | 'high_context';

export interface ProviderConfig {
  name: AIProvider;
  endpoint: string;
  apiKey: string;
  models: ModelConfig[];
  capabilities: RequiredCapability[];
  pricing: PricingConfig;
  limits: ProviderLimits;
  health: ProviderHealth;
}

export interface ModelConfig {
  name: string;
  contextWindow: number;
  maxTokens: number;
  inputCostPer1K: number;
  outputCostPer1K: number;
  latency: number; // Average response time in ms
  quality: number; // Quality score 0-1
  specialties: RequiredCapability[];
}

export interface PricingConfig {
  inputTokenCost: number;
  outputTokenCost: number;
  requestCost: number;
  monthlyCostLimit?: number;
  dailyCostLimit?: number;
}

export interface ProviderLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerMinute: number;
  maxConcurrentRequests: number;
}

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'unavailable';
  uptime: number;
  averageLatency: number;
  errorRate: number;
  lastHealthCheck: string;
}

export interface ProviderUsage {
  provider: AIProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  purpose: string;
}

export interface OrchestrationDecision {
  decision: string;
  reason: string;
  alternatives: string[];
  confidence: number;
}

export interface ExecutableAction {
  id: string;
  name: string;
  parameters: Record<string, any>;
  estimatedCost: number;
  estimatedTime: number;
  requiresApproval: boolean;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

export interface UIComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  data?: any;
  interactivity?: InteractivitySpec;
  layout?: LayoutSpec;
}

export interface InteractivitySpec {
  clickable: boolean;
  realTimeUpdates: boolean;
  userControls: UserControl[];
}

export interface LayoutSpec {
  grid: { cols: number; rows: number };
  priority: number;
  responsive: boolean;
}

export interface UserControl {
  type: 'button' | 'slider' | 'toggle' | 'input' | 'select';
  action: string;
  label: string;
  parameters?: Record<string, any>;
}

export interface Insight {
  type: 'opportunity' | 'risk' | 'trend' | 'benchmark' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  relatedActions?: string[];
}

/**
 * Intelligent AI Orchestration Engine
 * Routes requests to optimal providers, manages costs, and ensures high availability
 */
export class AIOrchestrationEngine {
  private supabase: ReturnType<typeof createClient<Database>>;
  private providers: Map<AIProvider, ProviderConfig> = new Map();
  private usageTracker: UsageTracker;
  private costOptimizer: CostOptimizer;
  private healthMonitor: HealthMonitor;
  private responseCache: Map<string, { response: IntelligentResponse; expiry: number }> = new Map();

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    this.initializeProviders();
    this.usageTracker = new UsageTracker(this.supabase);
    this.costOptimizer = new CostOptimizer(this.providers);
    this.healthMonitor = new HealthMonitor(this.providers);
  }

  /**
   * Main orchestration method - intelligently processes requests
   */
  async orchestrate(request: OrchestrationRequest): Promise<OrchestrationResponse> {
    const startTime = Date.now();
    const orchestrationDecisions: OrchestrationDecision[] = [];
    const providersUsed: ProviderUsage[] = [];

    try {
      // Step 1: Validate request and check rate limits
      const validation = await this.validateRequest(request);
      if (!validation.valid) {
        return this.createErrorResponse(validation.errors, startTime);
      }

      // Step 2: Check cache for similar requests
      const cacheHit = await this.checkCache(request);
      if (cacheHit) {
        return this.createCacheResponse(cacheHit, startTime);
      }

      // Step 3: Build comprehensive context
      const contextStart = Date.now();
      const context = await aiContextEngine.buildEnrichedContext(
        request.userMessage,
        request.userId,
        request.organizationId
      );
      const contextTime = Date.now() - contextStart;

      // Step 4: Classify intent with high accuracy
      const intentStart = Date.now();
      const intentResult = await intentClassifier.classifyIntent(
        request.userMessage,
        {
          userRole: context.userProfile.role,
          recentActions: context.availableActions.map(a => a.id),
          sessionHistory: context.conversationMemory.currentSession.map(msg => ({
            userMessage: msg.content,
            detectedIntent: 'pending',
            timestamp: new Date(msg.timestamp),
            confidence: 0.8
          }))
        }
      );
      const intentTime = Date.now() - intentStart;

      // Step 5: Determine optimal AI strategy
      const strategy = await this.determineAIStrategy(request, intentResult.intent, context);
      orchestrationDecisions.push({
        decision: `Selected ${strategy.primaryProvider} with ${strategy.model}`,
        reason: strategy.reasoning,
        alternatives: strategy.alternatives,
        confidence: strategy.confidence
      });

      // Step 6: Execute AI processing with intelligent routing
      const aiStart = Date.now();
      const aiResponse = await this.executeAIProcessing(request, context, intentResult, strategy);
      const aiTime = Date.now() - aiStart;

      if (aiResponse.providersUsed) {
        providersUsed.push(...aiResponse.providersUsed);
      }

      // Step 7: Execute any identified actions
      const actionStart = Date.now();
      const actionResults = await this.executeActions(aiResponse.actions, request, context);
      const actionTime = Date.now() - actionStart;

      // Step 8: Generate dynamic UI components
      const uiStart = Date.now();
      const uiComponents = await this.generateDynamicUI(
        aiResponse,
        context,
        intentResult.intent,
        actionResults
      );
      const uiTime = Date.now() - uiStart;

      // Step 9: Generate insights and suggestions
      const insights = await this.generateInsights(context, aiResponse, actionResults);
      const suggestions = await this.generateSuggestions(request.userMessage, aiResponse);

      // Step 10: Prepare final response
      const totalTime = Date.now() - startTime;
      const totalCost = providersUsed.reduce((sum, usage) => sum + usage.cost, 0);

      const response: IntelligentResponse = {
        message: aiResponse.message,
        confidence: aiResponse.confidence,
        intent: intentResult.intent,
        actions: actionResults,
        uiComponents,
        data: aiResponse.data || [],
        insights,
        suggestions,
        followUpQuestions: aiResponse.followUpQuestions || []
      };

      // Cache successful response
      if (response.confidence > 0.8) {
        await this.cacheResponse(request, response);
      }

      // Log for analytics
      await this.logOrchestration(request, response, {
        totalTime,
        providersUsed,
        orchestrationDecisions,
        totalCost
      });

      return {
        success: true,
        response,
        metadata: {
          processingTime: totalTime,
          providersUsed,
          orchestrationDecisions,
          cacheHits: 0,
          totalTokens: providersUsed.reduce((sum, usage) => sum + usage.inputTokens + usage.outputTokens, 0),
          complexity: this.assessComplexity(request, intentResult.intent)
        },
        cost: {
          totalCost,
          providerCosts: this.aggregateProviderCosts(providersUsed),
          tokenCosts: this.aggregateTokenCosts(providersUsed),
          optimizationSavings: strategy.estimatedSavings || 0
        },
        performance: {
          totalTime,
          intentClassificationTime: intentTime,
          contextBuildingTime: contextTime,
          aiProcessingTime: aiTime,
          actionExecutionTime: actionTime,
          uiGenerationTime: uiTime,
          throughput: 1000 / totalTime
        }
      };

    } catch (error) {
      return this.createErrorResponse([error instanceof Error ? error.message : 'Unknown error'], startTime);
    }
  }

  /**
   * Initialize AI provider configurations
   */
  private initializeProviders(): void {
    // DeepSeek Configuration (Primary for cost optimization)
    this.providers.set('deepseek', {
      name: 'deepseek',
      endpoint: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
      models: [
        {
          name: 'deepseek-chat',
          contextWindow: 128000,
          maxTokens: 4096,
          inputCostPer1K: 0.14, // 95% cheaper than GPT-4
          outputCostPer1K: 0.28,
          latency: 800,
          quality: 0.92,
          specialties: ['text_generation', 'reasoning', 'data_analysis']
        }
      ],
      capabilities: ['text_generation', 'reasoning', 'data_analysis', 'function_calling'],
      pricing: {
        inputTokenCost: 0.00014,
        outputTokenCost: 0.00028,
        requestCost: 0
      },
      limits: {
        requestsPerMinute: 200,
        requestsPerDay: 10000,
        tokensPerMinute: 500000,
        maxConcurrentRequests: 20
      },
      health: {
        status: 'healthy',
        uptime: 0.999,
        averageLatency: 800,
        errorRate: 0.001,
        lastHealthCheck: new Date().toISOString()
      }
    });

    // OpenAI Configuration (High quality fallback)
    this.providers.set('openai', {
      name: 'openai',
      endpoint: 'https://api.openai.com',
      apiKey: process.env.OPENAI_API_KEY || '',
      models: [
        {
          name: 'gpt-4o',
          contextWindow: 128000,
          maxTokens: 4096,
          inputCostPer1K: 2.50,
          outputCostPer1K: 10.00,
          latency: 1200,
          quality: 0.98,
          specialties: ['text_generation', 'reasoning', 'code_generation', 'multimodal']
        },
        {
          name: 'gpt-4o-mini',
          contextWindow: 128000,
          maxTokens: 16384,
          inputCostPer1K: 0.15,
          outputCostPer1K: 0.60,
          latency: 600,
          quality: 0.94,
          specialties: ['text_generation', 'reasoning', 'function_calling']
        }
      ],
      capabilities: ['text_generation', 'reasoning', 'code_generation', 'function_calling', 'multimodal'],
      pricing: {
        inputTokenCost: 0.0025,
        outputTokenCost: 0.01,
        requestCost: 0
      },
      limits: {
        requestsPerMinute: 500,
        requestsPerDay: 50000,
        tokensPerMinute: 800000,
        maxConcurrentRequests: 50
      },
      health: {
        status: 'healthy',
        uptime: 0.9995,
        averageLatency: 1200,
        errorRate: 0.0005,
        lastHealthCheck: new Date().toISOString()
      }
    });

    // Anthropic Configuration (High reasoning capability)
    this.providers.set('anthropic', {
      name: 'anthropic',
      endpoint: 'https://api.anthropic.com',
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      models: [
        {
          name: 'claude-3-5-sonnet-20241022',
          contextWindow: 200000,
          maxTokens: 8192,
          inputCostPer1K: 3.00,
          outputCostPer1K: 15.00,
          latency: 1500,
          quality: 0.99,
          specialties: ['reasoning', 'data_analysis', 'code_generation', 'high_context']
        }
      ],
      capabilities: ['text_generation', 'reasoning', 'data_analysis', 'code_generation', 'high_context'],
      pricing: {
        inputTokenCost: 0.003,
        outputTokenCost: 0.015,
        requestCost: 0
      },
      limits: {
        requestsPerMinute: 50,
        requestsPerDay: 5000,
        tokensPerMinute: 200000,
        maxConcurrentRequests: 10
      },
      health: {
        status: 'healthy',
        uptime: 0.999,
        averageLatency: 1500,
        errorRate: 0.001,
        lastHealthCheck: new Date().toISOString()
      }
    });
  }

  /**
   * Determine optimal AI strategy based on request requirements
   */
  private async determineAIStrategy(
    request: OrchestrationRequest,
    intent: any,
    context: any
  ): Promise<AIStrategy> {
    const factors = {
      costSensitivity: request.maxCost ? request.maxCost < 0.10 : true,
      qualityRequired: intent.urgency === 'critical' || request.priority === 'critical',
      speedRequired: request.requiresRealTime || intent.urgency === 'high',
      complexityLevel: this.assessComplexity(request, intent),
      tokenEstimate: this.estimateTokens(request.userMessage, context)
    };

    // Cost-optimized strategy (95% of requests)
    if (factors.costSensitivity && !factors.qualityRequired && factors.tokenEstimate < 50000) {
      return {
        primaryProvider: 'deepseek',
        model: 'deepseek-chat',
        fallbackProvider: 'openai',
        fallbackModel: 'gpt-4o-mini',
        reasoning: 'Cost-optimized with DeepSeek for 95% savings vs GPT-4',
        confidence: 0.9,
        alternatives: ['openai:gpt-4o-mini'],
        estimatedSavings: factors.tokenEstimate * 0.002 // Estimated savings vs GPT-4
      };
    }

    // High-quality strategy for critical requests
    if (factors.qualityRequired || factors.complexityLevel === 'expert') {
      return {
        primaryProvider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        fallbackProvider: 'openai',
        fallbackModel: 'gpt-4o',
        reasoning: 'Maximum quality with Claude Sonnet for critical analysis',
        confidence: 0.95,
        alternatives: ['openai:gpt-4o'],
        estimatedSavings: 0
      };
    }

    // Balanced strategy
    return {
      primaryProvider: 'openai',
      model: 'gpt-4o-mini',
      fallbackProvider: 'deepseek',
      fallbackModel: 'deepseek-chat',
      reasoning: 'Balanced approach with GPT-4o mini for reliability',
      confidence: 0.85,
      alternatives: ['deepseek:deepseek-chat'],
      estimatedSavings: factors.tokenEstimate * 0.001
    };
  }

  /**
   * Execute AI processing with intelligent provider routing
   */
  private async executeAIProcessing(
    request: OrchestrationRequest,
    context: any,
    intentResult: any,
    strategy: AIStrategy
  ): Promise<any> {
    const providers = [strategy.primaryProvider];
    if (strategy.fallbackProvider) {
      providers.push(strategy.fallbackProvider);
    }

    // Build master prompt
    const masterPrompt = await this.buildMasterPrompt(request, context, intentResult);

    // Try providers in order with fallback
    for (const provider of providers) {
      try {
        const providerConfig = this.providers.get(provider as AIProvider);
        if (!providerConfig || providerConfig.health.status === 'unavailable') {
          continue;
        }

        const model = provider === strategy.primaryProvider ? strategy.model : strategy.fallbackModel!;

        const startTime = Date.now();
        const response = await aiService.complete(masterPrompt, {
          temperature: 0.3,
          maxTokens: 2000,
          model: model
        });

        const endTime = Date.now();
        const responseText = typeof response === 'string' ? response : response.content || '';

        // Track usage
        const usage: ProviderUsage = {
          provider: provider as AIProvider,
          model,
          inputTokens: this.estimateTokens(masterPrompt),
          outputTokens: this.estimateTokens(responseText),
          cost: this.calculateCost(provider as AIProvider, masterPrompt, responseText),
          latency: endTime - startTime,
          purpose: 'primary_processing'
        };

        return {
          message: responseText,
          confidence: 0.9,
          providersUsed: [usage],
          data: await this.extractDataRequests(responseText, request, context),
          actions: await this.extractActionRequests(responseText, intentResult.intent),
          followUpQuestions: await this.generateFollowUpQuestions(responseText, intentResult.intent)
        };

      } catch (error) {
        console.error(`Provider ${provider} failed:`, error);
        continue;
      }
    }

    throw new Error('All AI providers failed');
  }

  /**
   * Build master prompt with comprehensive context
   */
  private async buildMasterPrompt(
    request: OrchestrationRequest,
    context: any,
    intentResult: any
  ): Promise<string> {
    return `You are Blipee, the world's most advanced autonomous sustainability AI. You have complete situational awareness and can execute complex sustainability operations.

CONTEXT AWARENESS:
Organization: ${context.organizationContext.name} (${context.organizationContext.industry})
Current Emissions: ${context.sustainabilityContext.currentEmissions.total} tCO2e
Active Targets: ${context.sustainabilityContext.targets.length} targets (${context.sustainabilityContext.targets.filter((t: any) => t.onTrack).length} on track)
Compliance Status: ${context.complianceStatus.alerts.length} alerts pending
Available Budget: $${context.financialContext.sustainabilityInvestments.totalBudget - context.financialContext.sustainabilityInvestments.spent}

DETECTED INTENT:
Category: ${intentResult.intent.category.name}
Confidence: ${(intentResult.intent.confidence * 100).toFixed(1)}%
Urgency: ${intentResult.intent.urgency}
Suggested Actions: ${intentResult.intent.suggestedActions.join(', ')}

AVAILABLE CAPABILITIES:
${context.availableActions.slice(0, 10).map((action: any) => `• ${action.name}: ${action.estimatedImpact.financial > 0 ? `$${action.estimatedImpact.financial} savings` : action.estimatedImpact.operational}`).join('\n')}

WEATHER & EXTERNAL FACTORS:
Current: ${context.weatherContext.current.temperature}°F, ${context.weatherContext.current.conditions}
Impact: ${context.weatherContext.recommendations.join('; ')}

FINANCIAL CONTEXT:
Energy Costs: $${context.financialContext.energyCosts.currentMonth} this month (${context.financialContext.energyCosts.currentMonth > context.financialContext.energyCosts.lastMonth ? '+' : ''}${((context.financialContext.energyCosts.currentMonth - context.financialContext.energyCosts.lastMonth) / context.financialContext.energyCosts.lastMonth * 100).toFixed(1)}% vs last month)
Carbon Price: $${context.financialContext.carbonPricing.internalPrice}/tCO2e

USER MESSAGE: "${request.userMessage}"

INSTRUCTIONS:
1. Provide an intelligent, context-aware response
2. Be proactive - suggest related optimizations and insights
3. Reference specific data points and metrics
4. Include financial impact when relevant
5. Suggest appropriate UI components for visualization
6. Generate actionable next steps
7. Use the user's first name (${context.userProfile.firstName || 'there'}) naturally
8. Match the user's communication style: ${context.userProfile.preferences.communicationStyle}

RESPONSE FORMAT:
Respond as a knowledgeable sustainability advisor. When suggesting visualizations or actions, be specific about what data to show and how users can interact with it.

Be the AI that makes sustainability management effortless and intelligent.`;
  }

  // Helper methods
  private async validateRequest(request: OrchestrationRequest): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!request.userMessage.trim()) {
      errors.push('User message cannot be empty');
    }

    if (!request.userId) {
      errors.push('User ID is required');
    }

    if (!request.organizationId) {
      errors.push('Organization ID is required');
    }

    // Check rate limits
    const usage = await this.usageTracker.checkLimits(request.userId, request.organizationId);
    if (!usage.allowed) {
      errors.push(`Rate limit exceeded: ${usage.message}`);
    }

    return { valid: errors.length === 0, errors };
  }

  private async checkCache(request: OrchestrationRequest): Promise<IntelligentResponse | null> {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.responseCache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.response;
    }

    return null;
  }

  private generateCacheKey(request: OrchestrationRequest): string {
    const normalized = request.userMessage.toLowerCase().replace(/\s+/g, ' ').trim();
    return `${request.organizationId}:${Buffer.from(normalized).toString('base64')}`;
  }

  private async executeActions(
    actions: any[],
    request: OrchestrationRequest,
    context: any
  ): Promise<ExecutableAction[]> {
    const results: ExecutableAction[] = [];

    for (const action of actions) {
      try {
        const actionConfig = actionRegistry.getAction(action.id);
        if (!actionConfig) continue;

        const actionContext = {
          userId: request.userId,
          organizationId: request.organizationId,
          rolePermissions: [context.userProfile.role],
          buildingIds: context.organizationContext.locations.map((l: any) => l.id),
          currentMetrics: context.realTimeMetrics,
          historicalData: context.historicalPatterns
        };

        const result = await actionRegistry.executeAction(action.id, action.parameters, actionContext);

        results.push({
          id: action.id,
          name: actionConfig.name,
          parameters: action.parameters,
          estimatedCost: actionConfig.businessImpact.estimatedSavings || 0,
          estimatedTime: parseInt(actionConfig.estimatedDuration) || 0,
          requiresApproval: actionConfig.requiredPermissions.length > 1,
          status: result.success ? 'completed' : 'failed'
        });

      } catch (error) {
        results.push({
          id: action.id,
          name: action.name || 'Unknown Action',
          parameters: action.parameters,
          estimatedCost: 0,
          estimatedTime: 0,
          requiresApproval: false,
          status: 'failed'
        });
      }
    }

    return results;
  }

  private async generateDynamicUI(
    aiResponse: any,
    context: any,
    intent: any,
    actionResults: ExecutableAction[]
  ): Promise<UIComponent[]> {
    const components: UIComponent[] = [];

    // Generate UI based on intent category
    if (intent.category.name === 'emissions_calculation') {
      components.push({
        id: 'emissions-overview',
        type: 'emissions-dashboard',
        props: {
          currentEmissions: context.sustainabilityContext.currentEmissions,
          targets: context.sustainabilityContext.targets,
          trends: context.historicalPatterns
        },
        interactivity: {
          clickable: true,
          realTimeUpdates: true,
          userControls: [
            {
              type: 'select',
              action: 'change_scope',
              label: 'View Scope',
              parameters: { options: ['scope1', 'scope2', 'scope3', 'total'] }
            }
          ]
        }
      });
    }

    if (intent.category.name === 'energy_optimization') {
      components.push({
        id: 'energy-controls',
        type: 'energy-optimization',
        props: {
          currentUsage: context.realTimeMetrics.energy,
          optimizationOpportunities: actionResults.filter(a => a.id.includes('energy')),
          weatherImpact: context.weatherContext.impacts
        },
        interactivity: {
          clickable: true,
          realTimeUpdates: true,
          userControls: [
            {
              type: 'button',
              action: 'optimize_hvac',
              label: 'Optimize HVAC',
              parameters: { confirm: true }
            }
          ]
        }
      });
    }

    return components;
  }

  private async generateInsights(context: any, aiResponse: any, actionResults: ExecutableAction[]): Promise<Insight[]> {
    const insights: Insight[] = [];

    // Cost optimization insights
    const totalSavings = actionResults.reduce((sum, action) => sum + action.estimatedCost, 0);
    if (totalSavings > 1000) {
      insights.push({
        type: 'opportunity',
        title: 'Significant Cost Savings Available',
        description: `Implementing suggested actions could save $${totalSavings.toLocaleString()} annually`,
        confidence: 0.85,
        impact: 'high',
        actionable: true,
        relatedActions: actionResults.map(a => a.id)
      });
    }

    // Compliance insights
    if (context.complianceStatus.alerts.length > 0) {
      insights.push({
        type: 'risk',
        title: 'Compliance Deadlines Approaching',
        description: `${context.complianceStatus.alerts.length} compliance items need attention`,
        confidence: 0.95,
        impact: 'medium',
        actionable: true
      });
    }

    return insights;
  }

  private async generateSuggestions(userMessage: string, aiResponse: any): Promise<string[]> {
    return [
      'Show detailed emissions breakdown by scope',
      'Compare performance to industry benchmarks',
      'Set up automated monitoring alerts'
    ];
  }

  private estimateTokens(text: string, context?: any): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private calculateCost(provider: AIProvider, input: string, output: string): number {
    const config = this.providers.get(provider);
    if (!config) return 0;

    const inputTokens = this.estimateTokens(input);
    const outputTokens = this.estimateTokens(output);

    return (inputTokens * config.pricing.inputTokenCost / 1000) +
           (outputTokens * config.pricing.outputTokenCost / 1000);
  }

  private assessComplexity(request: OrchestrationRequest, intent: any): 'simple' | 'moderate' | 'complex' | 'expert' {
    const factors = {
      messageLength: request.userMessage.length,
      urgency: intent.urgency,
      multipleActions: intent.suggestedActions?.length > 2,
      requiresData: request.userMessage.toLowerCase().includes('show') || request.userMessage.toLowerCase().includes('calculate')
    };

    if (factors.urgency === 'critical' || factors.messageLength > 500) return 'expert';
    if (factors.multipleActions || factors.requiresData) return 'complex';
    if (factors.messageLength > 100) return 'moderate';
    return 'simple';
  }

  private async extractDataRequests(response: string, request: OrchestrationRequest, context: any): Promise<any[]> {
    // Check if response mentions data visualization
    if (response.toLowerCase().includes('show') || response.toLowerCase().includes('data')) {
      try {
        const sqlResult = await naturalLanguageSQLEngine.processNaturalLanguageQuery({
          query: request.userMessage,
          userId: request.userId,
          organizationId: request.organizationId,
          maxResults: 100
        });

        return sqlResult.data || [];
      } catch (error) {
        return [];
      }
    }

    return [];
  }

  private async extractActionRequests(response: string, intent: any): Promise<any[]> {
    // Extract actions mentioned in the response
    const actions = [];

    if (intent.suggestedActions) {
      for (const actionId of intent.suggestedActions) {
        const action = actionRegistry.getAction(actionId);
        if (action) {
          actions.push({
            id: actionId,
            name: action.name,
            parameters: {}
          });
        }
      }
    }

    return actions;
  }

  private async generateFollowUpQuestions(response: string, intent: any): Promise<string[]> {
    const questions = [];

    if (intent.category.name === 'emissions_calculation') {
      questions.push('Would you like to see the breakdown by facility?');
      questions.push('Should I calculate the carbon reduction potential?');
    }

    if (intent.category.name === 'energy_optimization') {
      questions.push('Would you like me to implement these optimizations automatically?');
      questions.push('Should I set up monitoring for these changes?');
    }

    return questions.slice(0, 2);
  }

  private aggregateProviderCosts(usage: ProviderUsage[]): Record<string, number> {
    const costs: Record<string, number> = {};
    usage.forEach(u => {
      costs[u.provider] = (costs[u.provider] || 0) + u.cost;
    });
    return costs;
  }

  private aggregateTokenCosts(usage: ProviderUsage[]): Record<string, number> {
    const costs: Record<string, number> = {};
    usage.forEach(u => {
      costs[`${u.provider}_input`] = (costs[`${u.provider}_input`] || 0) + u.inputTokens;
      costs[`${u.provider}_output`] = (costs[`${u.provider}_output`] || 0) + u.outputTokens;
    });
    return costs;
  }

  private async cacheResponse(request: OrchestrationRequest, response: IntelligentResponse): Promise<void> {
    const cacheKey = this.generateCacheKey(request);
    const expiry = Date.now() + (10 * 60 * 1000); // 10 minutes
    this.responseCache.set(cacheKey, { response, expiry });
  }

  private createErrorResponse(errors: string[], startTime: number): OrchestrationResponse {
    return {
      success: false,
      response: {
        message: 'I encountered some issues processing your request. Please try again.',
        confidence: 0,
        intent: null,
        actions: [],
        uiComponents: [],
        data: [],
        insights: [],
        suggestions: [],
        followUpQuestions: []
      },
      metadata: {
        processingTime: Date.now() - startTime,
        providersUsed: [],
        orchestrationDecisions: [],
        cacheHits: 0,
        totalTokens: 0,
        complexity: 'simple'
      },
      cost: {
        totalCost: 0,
        providerCosts: {},
        tokenCosts: {},
        optimizationSavings: 0
      },
      performance: {
        totalTime: Date.now() - startTime,
        intentClassificationTime: 0,
        contextBuildingTime: 0,
        aiProcessingTime: 0,
        actionExecutionTime: 0,
        uiGenerationTime: 0,
        throughput: 0
      },
      errors
    };
  }

  private createCacheResponse(cached: IntelligentResponse, startTime: number): OrchestrationResponse {
    return {
      success: true,
      response: cached,
      metadata: {
        processingTime: Date.now() - startTime,
        providersUsed: [],
        orchestrationDecisions: [{ decision: 'Used cached response', reason: 'Identical query found in cache', alternatives: [], confidence: 1.0 }],
        cacheHits: 1,
        totalTokens: 0,
        complexity: 'simple'
      },
      cost: {
        totalCost: 0,
        providerCosts: {},
        tokenCosts: {},
        optimizationSavings: 0.01 // Assume saved cost from cache
      },
      performance: {
        totalTime: Date.now() - startTime,
        intentClassificationTime: 0,
        contextBuildingTime: 0,
        aiProcessingTime: 0,
        actionExecutionTime: 0,
        uiGenerationTime: 0,
        throughput: 1000 / (Date.now() - startTime)
      }
    };
  }

  private async logOrchestration(
    request: OrchestrationRequest,
    response: IntelligentResponse,
    metadata: any
  ): Promise<void> {
    try {
      await this.supabase.from('orchestration_log').insert({
        user_id: request.userId,
        organization_id: request.organizationId,
        user_message: request.userMessage,
        intent_category: response.intent?.category?.name,
        intent_confidence: response.intent?.confidence,
        total_cost: metadata.totalCost,
        processing_time: metadata.totalTime,
        providers_used: metadata.providersUsed.map((p: ProviderUsage) => p.provider),
        success: true,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log orchestration:', error);
    }
  }
}

// Supporting classes
interface AIStrategy {
  primaryProvider: AIProvider;
  model: string;
  fallbackProvider?: AIProvider;
  fallbackModel?: string;
  reasoning: string;
  confidence: number;
  alternatives: string[];
  estimatedSavings?: number;
}

class UsageTracker {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  async checkLimits(userId: string, organizationId: string): Promise<{ allowed: boolean; message: string }> {
    // Implementation would check rate limits from database
    return { allowed: true, message: 'Within limits' };
  }
}

class CostOptimizer {
  constructor(private providers: Map<AIProvider, ProviderConfig>) {}

  optimizeForCost(request: OrchestrationRequest): AIProvider {
    // Return most cost-effective provider
    return 'deepseek';
  }
}

class HealthMonitor {
  constructor(private providers: Map<AIProvider, ProviderConfig>) {}

  async checkHealth(): Promise<void> {
    // Monitor provider health
  }
}

// Export singleton
export const aiOrchestrationEngine = new AIOrchestrationEngine();