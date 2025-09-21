import { providerHealthMonitor, ProviderHealthInfo } from './provider-health-monitor';
import { aiContextEngine } from './context-engine';
import { intentClassifier } from './intent-classifier';

/**
 * Smart Routing Engine
 * Intelligently routes queries to optimal AI providers based on complexity,
 * cost, performance requirements, and current health status
 */

export class SmartRoutingEngine {
  private routingRules: Map<string, RoutingRule> = new Map();
  private providerCapabilities: Map<string, ProviderCapability> = new Map();
  private routingHistory: RoutingDecision[] = [];
  private complexityAnalyzer: ComplexityAnalyzer;
  private costOptimizer: CostOptimizer;

  constructor() {
    this.complexityAnalyzer = new ComplexityAnalyzer();
    this.costOptimizer = new CostOptimizer();
    this.initializeProviderCapabilities();
    this.initializeRoutingRules();
  }

  /**
   * Initialize provider capabilities matrix
   */
  private initializeProviderCapabilities() {
    // DeepSeek: Cost-optimized, good for standard queries
    this.providerCapabilities.set('deepseek', {
      provider: 'deepseek',
      strengths: [
        'cost_efficiency',
        'standard_queries',
        'data_analysis',
        'multi_turn_conversation'
      ],
      weaknesses: [
        'complex_reasoning',
        'creative_writing'
      ],
      costPerToken: 0.00014, // $0.14 per 1M tokens
      maxContextWindow: 128000,
      tokensPerSecond: 150,
      qualityScore: 0.85,
      complexityRange: {
        min: 0,
        max: 70
      },
      specializations: [
        'sustainability_metrics',
        'energy_optimization',
        'data_processing'
      ]
    });

    // OpenAI: Balanced, good for most tasks
    this.providerCapabilities.set('openai', {
      provider: 'openai',
      strengths: [
        'general_purpose',
        'function_calling',
        'code_generation',
        'structured_output'
      ],
      weaknesses: [
        'cost_at_scale'
      ],
      costPerToken: 0.003, // $3 per 1M tokens
      maxContextWindow: 128000,
      tokensPerSecond: 100,
      qualityScore: 0.92,
      complexityRange: {
        min: 0,
        max: 85
      },
      specializations: [
        'compliance_reporting',
        'document_generation',
        'api_integration'
      ]
    });

    // Anthropic: High quality, best for complex tasks
    this.providerCapabilities.set('anthropic', {
      provider: 'anthropic',
      strengths: [
        'complex_reasoning',
        'nuanced_analysis',
        'ethical_considerations',
        'long_context'
      ],
      weaknesses: [
        'cost',
        'speed'
      ],
      costPerToken: 0.015, // $15 per 1M tokens
      maxContextWindow: 200000,
      tokensPerSecond: 80,
      qualityScore: 0.98,
      complexityRange: {
        min: 50,
        max: 100
      },
      specializations: [
        'regulatory_compliance',
        'strategic_planning',
        'risk_assessment'
      ]
    });
  }

  /**
   * Initialize routing rules
   */
  private initializeRoutingRules() {
    // Cost-sensitive routing
    this.routingRules.set('cost_sensitive', {
      id: 'cost_sensitive',
      priority: 1,
      condition: (analysis) => analysis.estimatedCost < 0.10,
      preferredProviders: ['deepseek'],
      fallbackProviders: ['openai'],
      maxRetries: 2
    });

    // Quality-critical routing
    this.routingRules.set('quality_critical', {
      id: 'quality_critical',
      priority: 2,
      condition: (analysis) => analysis.requiresHighQuality,
      preferredProviders: ['anthropic', 'openai'],
      fallbackProviders: ['deepseek'],
      maxRetries: 3
    });

    // Real-time response routing
    this.routingRules.set('real_time', {
      id: 'real_time',
      priority: 3,
      condition: (analysis) => analysis.requiresRealTime,
      preferredProviders: ['openai', 'deepseek'],
      fallbackProviders: ['anthropic'],
      maxRetries: 1
    });

    // Compliance & regulatory routing
    this.routingRules.set('compliance', {
      id: 'compliance',
      priority: 4,
      condition: (analysis) => analysis.category === 'compliance',
      preferredProviders: ['anthropic'],
      fallbackProviders: ['openai', 'deepseek'],
      maxRetries: 2
    });

    // Large context routing
    this.routingRules.set('large_context', {
      id: 'large_context',
      priority: 5,
      condition: (analysis) => analysis.estimatedTokens > 50000,
      preferredProviders: ['anthropic'],
      fallbackProviders: ['openai'],
      maxRetries: 2
    });
  }

  /**
   * Route a query to the optimal provider
   */
  public async routeQuery(request: RoutingRequest): Promise<RoutingDecision> {
    const startTime = Date.now();

    // Step 1: Analyze query complexity
    const complexityAnalysis = await this.complexityAnalyzer.analyze(request.query);

    // Step 2: Determine requirements
    const requirements = this.determineRequirements(request, complexityAnalysis);

    // Step 3: Get provider health status
    const healthStatus = providerHealthMonitor.getHealthStatus();

    // Step 4: Score providers
    const providerScores = this.scoreProviders(
      requirements,
      complexityAnalysis,
      healthStatus.providers
    );

    // Step 5: Select optimal provider
    const selectedProvider = this.selectOptimalProvider(providerScores, requirements);

    // Step 6: Get fallback chain
    const fallbackChain = this.getFallbackChain(selectedProvider, requirements);

    // Step 7: Calculate estimated cost
    const estimatedCost = this.calculateEstimatedCost(
      selectedProvider,
      complexityAnalysis.estimatedTokens
    );

    // Create routing decision
    const decision: RoutingDecision = {
      id: this.generateDecisionId(),
      timestamp: new Date(),
      primaryProvider: selectedProvider,
      fallbackChain,
      complexity: complexityAnalysis,
      requirements,
      estimatedCost,
      estimatedLatency: this.estimateLatency(selectedProvider, complexityAnalysis),
      confidence: providerScores.get(selectedProvider)?.confidence || 0,
      reasoning: this.generateReasoning(selectedProvider, providerScores, requirements),
      metadata: {
        processingTime: Date.now() - startTime,
        healthConsiderations: healthStatus.summary.recommendation,
        appliedRules: this.getAppliedRules(requirements, complexityAnalysis)
      }
    };

    // Store routing decision
    this.routingHistory.push(decision);

    return decision;
  }

  /**
   * Determine requirements from request and complexity
   */
  private determineRequirements(
    request: RoutingRequest,
    complexity: ComplexityAnalysis
  ): QueryRequirements {
    return {
      maxLatency: request.maxLatency || 5000,
      maxCost: request.maxCost || 1.0,
      minQuality: request.minQuality || 0.8,
      requiresRealTime: request.requiresRealTime || false,
      requiresHighQuality: complexity.score > 80 || request.priority === 'critical',
      requiresFunctionCalling: complexity.requiresFunctionCalling,
      requiresLongContext: complexity.estimatedTokens > 50000,
      specialization: this.detectSpecialization(request.query)
    };
  }

  /**
   * Score providers based on requirements
   */
  private scoreProviders(
    requirements: QueryRequirements,
    complexity: ComplexityAnalysis,
    healthInfo: ProviderHealthInfo[]
  ): Map<string, ProviderScore> {
    const scores = new Map<string, ProviderScore>();

    this.providerCapabilities.forEach((capability, provider) => {
      let score = 0;
      let confidence = 0;
      const factors: ScoreFactor[] = [];

      // Health factor (30%)
      const health = healthInfo.find(h => h.provider === provider);
      if (!health || health.status === 'unavailable') {
        scores.set(provider, {
          provider,
          score: 0,
          confidence: 0,
          viable: false,
          factors: [{ name: 'health', score: 0, weight: 0.3 }]
        });
        return;
      }

      const healthScore = this.calculateHealthScore(health);
      score += healthScore * 0.3;
      factors.push({ name: 'health', score: healthScore, weight: 0.3 });

      // Complexity match (25%)
      const complexityScore = this.calculateComplexityMatch(
        complexity.score,
        capability.complexityRange
      );
      score += complexityScore * 0.25;
      factors.push({ name: 'complexity', score: complexityScore, weight: 0.25 });

      // Cost efficiency (20%)
      const costScore = this.calculateCostScore(
        capability.costPerToken,
        requirements.maxCost,
        complexity.estimatedTokens
      );
      score += costScore * 0.2;
      factors.push({ name: 'cost', score: costScore, weight: 0.2 });

      // Quality (15%)
      const qualityScore = capability.qualityScore * 100;
      score += qualityScore * 0.15;
      factors.push({ name: 'quality', score: qualityScore, weight: 0.15 });

      // Specialization match (10%)
      const specializationScore = this.calculateSpecializationScore(
        capability.specializations,
        requirements.specialization
      );
      score += specializationScore * 0.1;
      factors.push({ name: 'specialization', score: specializationScore, weight: 0.1 });

      // Calculate confidence
      confidence = this.calculateConfidence(factors, health);

      scores.set(provider, {
        provider,
        score,
        confidence,
        viable: score > 50 && health.status !== 'unhealthy',
        factors
      });
    });

    return scores;
  }

  /**
   * Select optimal provider from scores
   */
  private selectOptimalProvider(
    scores: Map<string, ProviderScore>,
    requirements: QueryRequirements
  ): string {
    let bestProvider = 'deepseek'; // Default fallback
    let bestScore = -1;

    scores.forEach((score, provider) => {
      if (!score.viable) return;

      // Apply requirement filters
      const capability = this.providerCapabilities.get(provider)!;

      if (requirements.requiresHighQuality && capability.qualityScore < 0.9) {
        return;
      }

      if (requirements.maxCost < capability.costPerToken * 1000) {
        return;
      }

      if (score.score > bestScore) {
        bestScore = score.score;
        bestProvider = provider;
      }
    });

    return bestProvider;
  }

  /**
   * Get fallback chain for provider
   */
  private getFallbackChain(
    primaryProvider: string,
    requirements: QueryRequirements
  ): string[] {
    const chain: string[] = [];
    const allProviders = ['deepseek', 'openai', 'anthropic'];

    // Remove primary provider
    const remaining = allProviders.filter(p => p !== primaryProvider);

    // Sort by suitability for requirements
    remaining.sort((a, b) => {
      const capA = this.providerCapabilities.get(a)!;
      const capB = this.providerCapabilities.get(b)!;

      // Prioritize by quality if high quality required
      if (requirements.requiresHighQuality) {
        return capB.qualityScore - capA.qualityScore;
      }

      // Otherwise prioritize by cost
      return capA.costPerToken - capB.costPerToken;
    });

    // Add healthy providers to chain
    const health = providerHealthMonitor.getHealthStatus();
    for (const provider of remaining) {
      const providerHealth = health.providers.find(p => p.provider === provider);
      if (providerHealth && providerHealth.status !== 'unavailable') {
        chain.push(provider);
      }
    }

    return chain;
  }

  /**
   * Calculate health score
   */
  private calculateHealthScore(health: ProviderHealthInfo): number {
    const statusScores: Record<string, number> = {
      healthy: 100,
      degraded: 70,
      limited: 50,
      unhealthy: 20,
      unavailable: 0
    };

    let score = statusScores[health.status] || 0;

    // Adjust for error rate
    score -= health.errorRate;

    // Adjust for response time (penalty for >1000ms)
    if (health.responseTime > 1000) {
      score -= Math.min(20, (health.responseTime - 1000) / 100);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate complexity match score
   */
  private calculateComplexityMatch(
    complexity: number,
    range: { min: number; max: number }
  ): number {
    if (complexity < range.min) {
      // Under-utilizing provider
      return 70 - (range.min - complexity);
    } else if (complexity > range.max) {
      // Over-complexity for provider
      return Math.max(0, 50 - (complexity - range.max));
    } else {
      // Perfect match
      return 100;
    }
  }

  /**
   * Calculate cost score
   */
  private calculateCostScore(
    costPerToken: number,
    maxCost: number,
    estimatedTokens: number
  ): number {
    const estimatedCost = (costPerToken * estimatedTokens) / 1000;

    if (estimatedCost > maxCost) {
      return 0;
    }

    // Linear score based on cost efficiency
    return 100 * (1 - estimatedCost / maxCost);
  }

  /**
   * Calculate specialization score
   */
  private calculateSpecializationScore(
    providerSpecializations: string[],
    requiredSpecialization?: string
  ): number {
    if (!requiredSpecialization) return 50;

    return providerSpecializations.includes(requiredSpecialization) ? 100 : 0;
  }

  /**
   * Calculate confidence in routing decision
   */
  private calculateConfidence(factors: ScoreFactor[], health: ProviderHealthInfo): number {
    let confidence = 0;

    // Base confidence from factors
    factors.forEach(factor => {
      confidence += factor.score * factor.weight;
    });

    // Adjust for health status
    if (health.status === 'degraded') {
      confidence *= 0.8;
    } else if (health.status !== 'healthy') {
      confidence *= 0.6;
    }

    // Adjust for error rate
    confidence *= (100 - health.errorRate) / 100;

    return Math.min(100, confidence);
  }

  /**
   * Detect specialization from query
   */
  private detectSpecialization(query: string): string | undefined {
    const specializations: Record<string, string[]> = {
      compliance_reporting: ['compliance', 'report', 'regulatory', 'CDP', 'GRI', 'TCFD'],
      sustainability_metrics: ['emissions', 'carbon', 'scope', 'ghg', 'footprint'],
      energy_optimization: ['energy', 'hvac', 'lighting', 'efficiency', 'consumption'],
      strategic_planning: ['strategy', 'target', 'goal', 'plan', 'forecast'],
      risk_assessment: ['risk', 'assessment', 'vulnerability', 'threat', 'impact']
    };

    const lowerQuery = query.toLowerCase();

    for (const [specialization, keywords] of Object.entries(specializations)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        return specialization;
      }
    }

    return undefined;
  }

  /**
   * Calculate estimated cost
   */
  private calculateEstimatedCost(provider: string, estimatedTokens: number): number {
    const capability = this.providerCapabilities.get(provider);
    if (!capability) return 0;

    return (capability.costPerToken * estimatedTokens) / 1000;
  }

  /**
   * Estimate latency for provider
   */
  private estimateLatency(provider: string, complexity: ComplexityAnalysis): number {
    const capability = this.providerCapabilities.get(provider);
    if (!capability) return 5000;

    const baseLatency = 200; // Network latency
    const processingTime = (complexity.estimatedTokens / capability.tokensPerSecond) * 1000;

    return baseLatency + processingTime;
  }

  /**
   * Generate reasoning for routing decision
   */
  private generateReasoning(
    provider: string,
    scores: Map<string, ProviderScore>,
    requirements: QueryRequirements
  ): string {
    const score = scores.get(provider);
    if (!score) return 'Default provider selection';

    const reasons: string[] = [];

    // Find top factors
    const topFactors = score.factors
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 3);

    topFactors.forEach(factor => {
      if (factor.name === 'health' && factor.score > 80) {
        reasons.push(`${provider} is healthy and responsive`);
      } else if (factor.name === 'complexity' && factor.score > 80) {
        reasons.push(`Well-suited for query complexity`);
      } else if (factor.name === 'cost' && factor.score > 80) {
        reasons.push(`Cost-effective for this query`);
      } else if (factor.name === 'quality' && factor.score > 80) {
        reasons.push(`High quality output expected`);
      }
    });

    if (requirements.requiresHighQuality) {
      reasons.push(`High quality requirement met`);
    }

    return reasons.join('; ');
  }

  /**
   * Get applied rules for decision
   */
  private getAppliedRules(
    requirements: QueryRequirements,
    complexity: ComplexityAnalysis
  ): string[] {
    const applied: string[] = [];

    this.routingRules.forEach((rule, name) => {
      const analysis = {
        ...complexity,
        ...requirements,
        category: requirements.specialization
      };

      if (rule.condition(analysis)) {
        applied.push(name);
      }
    });

    return applied;
  }

  /**
   * Generate unique decision ID
   */
  private generateDecisionId(): string {
    return `routing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get routing statistics
   */
  public getRoutingStatistics(): RoutingStatistics {
    const stats: RoutingStatistics = {
      totalRoutings: this.routingHistory.length,
      providerDistribution: new Map(),
      averageCost: 0,
      averageLatency: 0,
      averageConfidence: 0,
      fallbackUsage: 0
    };

    this.routingHistory.forEach(decision => {
      // Provider distribution
      const count = stats.providerDistribution.get(decision.primaryProvider) || 0;
      stats.providerDistribution.set(decision.primaryProvider, count + 1);

      // Averages
      stats.averageCost += decision.estimatedCost;
      stats.averageLatency += decision.estimatedLatency;
      stats.averageConfidence += decision.confidence;
    });

    if (this.routingHistory.length > 0) {
      stats.averageCost /= this.routingHistory.length;
      stats.averageLatency /= this.routingHistory.length;
      stats.averageConfidence /= this.routingHistory.length;
    }

    return stats;
  }
}

/**
 * Complexity Analyzer
 * Analyzes query complexity to determine routing requirements
 */
class ComplexityAnalyzer {
  /**
   * Analyze query complexity
   */
  public async analyze(query: string): Promise<ComplexityAnalysis> {
    const analysis: ComplexityAnalysis = {
      score: 0,
      estimatedTokens: 0,
      requiresFunctionCalling: false,
      requiresMultiStep: false,
      requiresDataAnalysis: false,
      requiresCompliance: false,
      category: 'general'
    };

    // Token estimation
    analysis.estimatedTokens = this.estimateTokens(query);

    // Complexity scoring
    let score = 0;

    // Length factor
    if (query.length > 500) score += 10;
    if (query.length > 1000) score += 10;

    // Technical terms
    const technicalTerms = ['calculate', 'analyze', 'forecast', 'optimize', 'compliance', 'regulatory'];
    technicalTerms.forEach(term => {
      if (query.toLowerCase().includes(term)) score += 5;
    });

    // Multi-step indicators
    const multiStepIndicators = ['then', 'after', 'next', 'finally', 'steps'];
    if (multiStepIndicators.some(term => query.toLowerCase().includes(term))) {
      analysis.requiresMultiStep = true;
      score += 20;
    }

    // Data analysis indicators
    const dataIndicators = ['data', 'metrics', 'chart', 'graph', 'trend', 'analysis'];
    if (dataIndicators.some(term => query.toLowerCase().includes(term))) {
      analysis.requiresDataAnalysis = true;
      score += 15;
    }

    // Compliance indicators
    const complianceIndicators = ['compliance', 'regulatory', 'GRI', 'CDP', 'TCFD', 'SEC'];
    if (complianceIndicators.some(term => query.includes(term))) {
      analysis.requiresCompliance = true;
      score += 25;
      analysis.category = 'compliance';
    }

    // Function calling indicators
    const functionIndicators = ['create', 'update', 'delete', 'generate', 'export'];
    if (functionIndicators.some(term => query.toLowerCase().includes(term))) {
      analysis.requiresFunctionCalling = true;
      score += 10;
    }

    analysis.score = Math.min(100, score);

    return analysis;
  }

  /**
   * Estimate token count for query
   */
  private estimateTokens(query: string): number {
    // Rough estimation: 1 token per 4 characters
    const baseTokens = Math.ceil(query.length / 4);

    // Add buffer for response
    return baseTokens * 10; // Assume response is 10x query
  }
}

/**
 * Cost Optimizer
 * Optimizes routing decisions for cost efficiency
 */
class CostOptimizer {
  private costBudgets: Map<string, number> = new Map();
  private costTracking: Map<string, number> = new Map();

  /**
   * Set budget for organization
   */
  public setBudget(organizationId: string, monthlyBudget: number) {
    this.costBudgets.set(organizationId, monthlyBudget);
    if (!this.costTracking.has(organizationId)) {
      this.costTracking.set(organizationId, 0);
    }
  }

  /**
   * Check if within budget
   */
  public isWithinBudget(organizationId: string, estimatedCost: number): boolean {
    const budget = this.costBudgets.get(organizationId);
    if (!budget) return true;

    const spent = this.costTracking.get(organizationId) || 0;
    return spent + estimatedCost <= budget;
  }

  /**
   * Track cost
   */
  public trackCost(organizationId: string, cost: number) {
    const current = this.costTracking.get(organizationId) || 0;
    this.costTracking.set(organizationId, current + cost);
  }

  /**
   * Get remaining budget
   */
  public getRemainingBudget(organizationId: string): number {
    const budget = this.costBudgets.get(organizationId);
    if (!budget) return Infinity;

    const spent = this.costTracking.get(organizationId) || 0;
    return Math.max(0, budget - spent);
  }

  /**
   * Reset monthly tracking
   */
  public resetMonthlyTracking() {
    this.costTracking.clear();
  }
}

// Type Definitions
export interface RoutingRequest {
  query: string;
  userId: string;
  organizationId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxLatency?: number;
  maxCost?: number;
  minQuality?: number;
  requiresRealTime?: boolean;
}

export interface RoutingDecision {
  id: string;
  timestamp: Date;
  primaryProvider: string;
  fallbackChain: string[];
  complexity: ComplexityAnalysis;
  requirements: QueryRequirements;
  estimatedCost: number;
  estimatedLatency: number;
  confidence: number;
  reasoning: string;
  metadata: {
    processingTime: number;
    healthConsiderations: string;
    appliedRules: string[];
  };
}

interface ComplexityAnalysis {
  score: number;
  estimatedTokens: number;
  requiresFunctionCalling: boolean;
  requiresMultiStep: boolean;
  requiresDataAnalysis: boolean;
  requiresCompliance: boolean;
  requiresHighQuality?: boolean;
  requiresRealTime?: boolean;
  estimatedCost?: number;
  category: string;
}

interface QueryRequirements {
  maxLatency: number;
  maxCost: number;
  minQuality: number;
  requiresRealTime: boolean;
  requiresHighQuality: boolean;
  requiresFunctionCalling: boolean;
  requiresLongContext: boolean;
  specialization?: string;
}

interface ProviderCapability {
  provider: string;
  strengths: string[];
  weaknesses: string[];
  costPerToken: number;
  maxContextWindow: number;
  tokensPerSecond: number;
  qualityScore: number;
  complexityRange: {
    min: number;
    max: number;
  };
  specializations: string[];
}

interface RoutingRule {
  id: string;
  priority: number;
  condition: (analysis: any) => boolean;
  preferredProviders: string[];
  fallbackProviders: string[];
  maxRetries: number;
}

interface ProviderScore {
  provider: string;
  score: number;
  confidence: number;
  viable: boolean;
  factors: ScoreFactor[];
}

interface ScoreFactor {
  name: string;
  score: number;
  weight: number;
}

interface RoutingStatistics {
  totalRoutings: number;
  providerDistribution: Map<string, number>;
  averageCost: number;
  averageLatency: number;
  averageConfidence: number;
  fallbackUsage: number;
}

// Export singleton instance
export const smartRoutingEngine = new SmartRoutingEngine();