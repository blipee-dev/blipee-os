/**
 * AI Cost Optimization Engine
 * Phase 3, Task 3.3: Advanced cost optimization with real-time analytics
 */

import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import { createSemanticCache } from '@/lib/ai/cache/semantic-cache';

// Provider pricing models (per 1K tokens)
export const PROVIDER_PRICING = {
  deepseek: {
    input: 0.00014,   // $0.14 per 1M input tokens
    output: 0.00028,  // $0.28 per 1M output tokens
    name: 'DeepSeek',
    rateLimit: 100,   // requests per minute
    avgLatency: 2400  // ms
  },
  openai: {
    'gpt-4': {
      input: 0.01,    // $10 per 1M input tokens
      output: 0.03,   // $30 per 1M output tokens
      name: 'GPT-4',
      rateLimit: 500,
      avgLatency: 1800
    },
    'gpt-3.5-turbo': {
      input: 0.0005,  // $0.50 per 1M input tokens
      output: 0.0015, // $1.50 per 1M output tokens
      name: 'GPT-3.5 Turbo',
      rateLimit: 3500,
      avgLatency: 800
    }
  },
  anthropic: {
    'claude-3-haiku': {
      input: 0.00025,  // $0.25 per 1M input tokens
      output: 0.00125, // $1.25 per 1M output tokens
      name: 'Claude 3 Haiku',
      rateLimit: 1000,
      avgLatency: 1200
    },
    'claude-3-sonnet': {
      input: 0.003,   // $3 per 1M input tokens
      output: 0.015,  // $15 per 1M output tokens
      name: 'Claude 3 Sonnet',
      rateLimit: 1000,
      avgLatency: 1500
    }
  }
};

export interface CostMetrics {
  organizationId: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startTime: number;
  endTime: number;
  
  // Cost breakdown
  totalCost: number;
  costByProvider: Record<string, number>;
  costByModel: Record<string, number>;
  costSavingsFromCache: number;
  
  // Usage metrics
  totalRequests: number;
  totalTokensUsed: number;
  totalTokensSaved: number;
  cacheHitRate: number;
  
  // Provider performance
  avgLatencyByProvider: Record<string, number>;
  errorRateByProvider: Record<string, number>;
  
  // Efficiency metrics
  costPerRequest: number;
  costPerToken: number;
  roi: number; // Return on investment
}

export interface BudgetAlert {
  id: string;
  organizationId: string;
  type: 'budget_exceeded' | 'budget_warning' | 'unusual_usage' | 'cost_spike';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  currentCost: number;
  budgetLimit?: number;
  threshold?: number;
  createdAt: number;
  acknowledged: boolean;
}

export interface OptimizationRecommendation {
  id: string;
  organizationId: string;
  type: 'provider_switch' | 'cache_optimization' | 'model_downgrade' | 'batch_requests';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  estimatedSavings: {
    monthly: number;
    percentage: number;
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    timeToImplement: string;
    steps: string[];
  };
  createdAt: number;
  status: 'pending' | 'implemented' | 'dismissed';
}

export interface CostBudget {
  organizationId: string;
  period: 'daily' | 'weekly' | 'monthly';
  limit: number;
  warningThreshold: number; // percentage (e.g., 80 for 80%)
  alertThreshold: number;   // percentage (e.g., 90 for 90%)
  rolloverUnused: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * AI Cost Optimization Engine
 * Provides comprehensive cost tracking, optimization, and budgeting
 */
export class CostOptimizer {
  private redis: Redis;
  private semanticCache = createSemanticCache();
  
  private readonly COST_METRICS_KEY = 'cost:metrics';
  private readonly BUDGET_KEY = 'cost:budgets';
  private readonly ALERT_KEY = 'cost:alerts';
  private readonly RECOMMENDATION_KEY = 'cost:recommendations';
  private readonly USAGE_KEY = 'cost:usage';

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    
    console.log('💰 Cost Optimizer initialized with real-time tracking');
  }

  /**
   * Track a completed AI request for cost analysis
   */
  async trackRequest(
    organizationId: string,
    provider: string,
    model: string,
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    },
    metadata: {
      latency: number;
      cached?: boolean;
      userId?: string;
      priority?: string;
      success: boolean;
    }
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      const cost = this.calculateRequestCost(provider, model, usage);
      
      const requestData = {
        id: uuidv4(),
        organizationId,
        provider,
        model,
        usage,
        cost,
        metadata,
        timestamp
      };

      // Store individual request data
      await this.redis.zadd(
        `${this.USAGE_KEY}:${organizationId}`,
        { score: timestamp, member: JSON.stringify(requestData) }
      );

      // Update real-time metrics
      await this.updateRealtimeMetrics(organizationId, requestData);
      
      // Check budget alerts
      await this.checkBudgetAlerts(organizationId);
      
      // Generate optimization recommendations
      await this.generateRecommendations(organizationId);
      
      console.log(`💰 Tracked request: ${provider}/${model} - $${cost.toFixed(6)} (${metadata.cached ? 'cached' : 'live'})`);
      
    } catch (error) {
      console.error('❌ Failed to track cost:', error);
    }
  }

  /**
   * Calculate cost for a specific request
   */
  private calculateRequestCost(
    provider: string,
    model: string,
    usage: { promptTokens: number; completionTokens: number; totalTokens: number }
  ): number {
    let pricing;
    
    if (provider === 'deepseek') {
      pricing = PROVIDER_PRICING.deepseek;
    } else if (provider === 'openai') {
      pricing = PROVIDER_PRICING.openai[model as keyof typeof PROVIDER_PRICING.openai];
    } else if (provider === 'anthropic') {
      pricing = PROVIDER_PRICING.anthropic[model as keyof typeof PROVIDER_PRICING.anthropic];
    }
    
    if (!pricing) {
      console.warn(`⚠️ Unknown pricing for ${provider}/${model}, using DeepSeek rates`);
      pricing = PROVIDER_PRICING.deepseek;
    }
    
    // Calculate cost per token (pricing is per 1K tokens)
    const inputCost = (usage.promptTokens / 1000) * pricing.input;
    const outputCost = (usage.completionTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  /**
   * Update real-time cost metrics
   */
  private async updateRealtimeMetrics(
    organizationId: string,
    requestData: any
  ): Promise<void> {
    const hour = Math.floor(Date.now() / (1000 * 60 * 60));
    const day = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
    
    // Update hourly metrics
    const hourlyKey = `${this.COST_METRICS_KEY}:${organizationId}:hourly:${hour}`;
    await this.updateMetricsBucket(hourlyKey, requestData);
    
    // Update daily metrics  
    const dailyKey = `${this.COST_METRICS_KEY}:${organizationId}:daily:${day}`;
    await this.updateMetricsBucket(dailyKey, requestData);
    
    // Set TTL for automatic cleanup
    await this.redis.expire(hourlyKey, 7 * 24 * 60 * 60); // 7 days
    await this.redis.expire(dailyKey, 30 * 24 * 60 * 60); // 30 days
  }

  /**
   * Update metrics for a specific time bucket
   */
  private async updateMetricsBucket(key: string, requestData: any): Promise<void> {
    const updates = {
      totalCost: requestData.cost,
      totalRequests: 1,
      totalTokens: requestData.usage.totalTokens,
      [`cost_${requestData.provider}`]: requestData.cost,
      [`requests_${requestData.provider}`]: 1,
      [`tokens_${requestData.provider}`]: requestData.usage.totalTokens,
      [`latency_${requestData.provider}`]: requestData.metadata.latency,
      errors: requestData.metadata.success ? 0 : 1
    };
    
    if (requestData.metadata.cached) {
      updates[`cached_requests`] = 1;
      updates[`tokens_saved`] = requestData.usage.totalTokens;
    }
    
    // Use atomic increments for concurrent safety
    const pipeline = [];
    for (const [field, value] of Object.entries(updates)) {
      pipeline.push(['HINCRBYFLOAT', key, field, value]);
    }
    
    // Execute pipeline (Upstash Redis supports this)
    for (const cmd of pipeline) {
      await this.redis.hincrbyfloat(key, cmd[2] as string, cmd[3] as number);
    }
  }

  /**
   * Get comprehensive cost metrics for an organization
   */
  async getCostMetrics(
    organizationId: string,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily',
    limit: number = 30
  ): Promise<CostMetrics[]> {
    try {
      const metrics: CostMetrics[] = [];
      const now = Date.now();
      
      let timeUnit, keyFormat;
      switch (period) {
        case 'hourly':
          timeUnit = 60 * 60 * 1000; // 1 hour
          keyFormat = (t: number) => Math.floor(t / (1000 * 60 * 60));
          break;
        case 'daily':
          timeUnit = 24 * 60 * 60 * 1000; // 1 day
          keyFormat = (t: number) => Math.floor(t / (1000 * 60 * 60 * 24));
          break;
        case 'weekly':
          timeUnit = 7 * 24 * 60 * 60 * 1000; // 1 week
          keyFormat = (t: number) => Math.floor(t / (1000 * 60 * 60 * 24 * 7));
          break;
        case 'monthly':
          timeUnit = 30 * 24 * 60 * 60 * 1000; // 30 days
          keyFormat = (t: number) => Math.floor(t / (1000 * 60 * 60 * 24 * 30));
          break;
      }
      
      for (let i = 0; i < limit; i++) {
        const periodStart = now - (i + 1) * timeUnit;
        const periodEnd = now - i * timeUnit;
        const timeKey = keyFormat(periodEnd); // Use period end time for current bucket
        
        const key = `${this.COST_METRICS_KEY}:${organizationId}:${period}:${timeKey}`;
        const data = await this.redis.hgetall(key);
        
        if (data && Object.keys(data).length > 0) {
          const metric = this.parseMetricsData(organizationId, period, periodStart, periodEnd, data);
          metrics.push(metric);
        }
        
        // Also check current time bucket for recent data
        if (i === 0) {
          const currentTimeKey = keyFormat(now);
          if (currentTimeKey !== timeKey) {
            const currentKey = `${this.COST_METRICS_KEY}:${organizationId}:${period}:${currentTimeKey}`;
            const currentData = await this.redis.hgetall(currentKey);
            
            if (currentData && Object.keys(currentData).length > 0) {
              const currentMetric = this.parseMetricsData(organizationId, period, now - timeUnit, now, currentData);
              metrics.unshift(currentMetric); // Add to beginning as most recent
            }
          }
        }
      }
      
      return metrics.reverse(); // Return chronologically
      
    } catch (error) {
      console.error('❌ Failed to get cost metrics:', error);
      return [];
    }
  }

  /**
   * Parse raw metrics data into structured format
   */
  private parseMetricsData(
    organizationId: string,
    period: string,
    startTime: number,
    endTime: number,
    data: any
  ): CostMetrics {
    const totalCost = parseFloat(data.totalCost || '0');
    const totalRequests = parseInt(data.totalRequests || '0');
    const totalTokens = parseInt(data.totalTokens || '0');
    const cachedRequests = parseInt(data.cached_requests || '0');
    const tokensSaved = parseInt(data.tokens_saved || '0');
    const errors = parseInt(data.errors || '0');
    
    return {
      organizationId,
      period: period as any,
      startTime,
      endTime,
      totalCost,
      costByProvider: this.extractProviderCosts(data),
      costByModel: {}, // TODO: Implement model-level tracking
      costSavingsFromCache: this.calculateCacheSavings(tokensSaved),
      totalRequests,
      totalTokensUsed: totalTokens,
      totalTokensSaved: tokensSaved,
      cacheHitRate: totalRequests > 0 ? (cachedRequests / totalRequests) * 100 : 0,
      avgLatencyByProvider: this.extractProviderLatencies(data),
      errorRateByProvider: this.extractProviderErrorRates(data),
      costPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
      costPerToken: totalTokens > 0 ? totalCost / totalTokens : 0,
      roi: this.calculateROI(totalCost, tokensSaved)
    };
  }

  /**
   * Extract provider-specific costs from metrics data
   */
  private extractProviderCosts(data: any): Record<string, number> {
    const costs: Record<string, number> = {};
    
    Object.keys(data).forEach(key => {
      if (key.startsWith('cost_')) {
        const provider = key.replace('cost_', '');
        costs[provider] = parseFloat(data[key] || '0');
      }
    });
    
    return costs;
  }

  /**
   * Extract provider-specific latencies from metrics data
   */
  private extractProviderLatencies(data: any): Record<string, number> {
    const latencies: Record<string, number> = {};
    
    Object.keys(data).forEach(key => {
      if (key.startsWith('latency_')) {
        const provider = key.replace('latency_', '');
        const requests = parseInt(data[`requests_${provider}`] || '1');
        const totalLatency = parseFloat(data[key] || '0');
        latencies[provider] = requests > 0 ? totalLatency / requests : 0;
      }
    });
    
    return latencies;
  }

  /**
   * Extract provider-specific error rates from metrics data
   */
  private extractProviderErrorRates(data: any): Record<string, number> {
    const errorRates: Record<string, number> = {};
    
    Object.keys(data).forEach(key => {
      if (key.startsWith('requests_')) {
        const provider = key.replace('requests_', '');
        const totalRequests = parseInt(data[key] || '0');
        const errors = parseInt(data.errors || '0');
        errorRates[provider] = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;
      }
    });
    
    return errorRates;
  }

  /**
   * Calculate cost savings from cache
   */
  private calculateCacheSavings(tokensSaved: number): number {
    // Use DeepSeek pricing as baseline for savings calculation
    const avgCostPerToken = (PROVIDER_PRICING.deepseek.input + PROVIDER_PRICING.deepseek.output) / 2 / 1000;
    return tokensSaved * avgCostPerToken;
  }

  /**
   * Calculate ROI based on cost and savings
   */
  private calculateROI(totalCost: number, tokensSaved: number): number {
    const savings = this.calculateCacheSavings(tokensSaved);
    return totalCost > 0 ? (savings / totalCost) * 100 : 0;
  }

  /**
   * Set budget for an organization
   */
  async setBudget(
    organizationId: string,
    budget: Omit<CostBudget, 'organizationId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const budgetData: CostBudget = {
      organizationId,
      ...budget,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    const key = `${this.BUDGET_KEY}:${organizationId}:${budget.period}`;
    await this.redis.set(key, JSON.stringify(budgetData));
    
    console.log(`💰 Budget set for ${organizationId}: $${budget.limit}/${budget.period}`);
    return key;
  }

  /**
   * Check budget alerts for an organization
   */
  private async checkBudgetAlerts(organizationId: string): Promise<void> {
    const periods = ['daily', 'weekly', 'monthly'] as const;
    
    for (const period of periods) {
      const budgetKey = `${this.BUDGET_KEY}:${organizationId}:${period}`;
      const budgetData = await this.redis.get(budgetKey) as CostBudget | null;
      
      if (!budgetData) continue;
      
      const recentMetrics = await this.getCostMetrics(organizationId, period, 1);
      if (recentMetrics.length === 0) continue;
      
      const currentCost = recentMetrics[0].totalCost;
      const usagePercentage = (currentCost / budgetData.limit) * 100;
      
      if (usagePercentage >= budgetData.alertThreshold) {
        await this.createAlert(organizationId, {
          type: 'budget_exceeded',
          severity: 'critical',
          message: `Budget exceeded! Current usage: $${currentCost.toFixed(2)} (${usagePercentage.toFixed(1)}% of $${budgetData.limit} ${period} budget)`,
          currentCost,
          budgetLimit: budgetData.limit,
          threshold: budgetData.alertThreshold
        });
      } else if (usagePercentage >= budgetData.warningThreshold) {
        await this.createAlert(organizationId, {
          type: 'budget_warning',
          severity: 'medium',
          message: `Budget warning: Current usage: $${currentCost.toFixed(2)} (${usagePercentage.toFixed(1)}% of $${budgetData.limit} ${period} budget)`,
          currentCost,
          budgetLimit: budgetData.limit,
          threshold: budgetData.warningThreshold
        });
      }
    }
  }

  /**
   * Create a budget alert
   */
  private async createAlert(
    organizationId: string,
    alertData: Omit<BudgetAlert, 'id' | 'organizationId' | 'createdAt' | 'acknowledged'>
  ): Promise<string> {
    const alert: BudgetAlert = {
      id: uuidv4(),
      organizationId,
      ...alertData,
      createdAt: Date.now(),
      acknowledged: false
    };
    
    const key = `${this.ALERT_KEY}:${organizationId}:${alert.id}`;
    await this.redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(alert)); // 7 days TTL
    
    console.log(`🚨 Alert created: ${alert.type} - ${alert.message}`);
    return alert.id;
  }

  /**
   * Generate optimization recommendations
   */
  private async generateRecommendations(organizationId: string): Promise<void> {
    const recentMetrics = await this.getCostMetrics(organizationId, 'daily', 7);
    if (recentMetrics.length < 3) return; // Need some data to analyze
    
    const recommendations: OptimizationRecommendation[] = [];
    
    // Analyze cache hit rate
    const avgCacheHitRate = recentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / recentMetrics.length;
    if (avgCacheHitRate < 30) {
      recommendations.push({
        id: uuidv4(),
        organizationId,
        type: 'cache_optimization',
        priority: 'high',
        title: 'Improve Cache Hit Rate',
        description: `Your current cache hit rate is ${avgCacheHitRate.toFixed(1)}%. Optimizing cache warming and similarity thresholds could significantly reduce costs.`,
        estimatedSavings: {
          monthly: this.estimateCacheOptimizationSavings(recentMetrics),
          percentage: 25
        },
        implementation: {
          difficulty: 'easy',
          timeToImplement: '1-2 hours',
          steps: [
            'Review and expand cache warming queries',
            'Lower semantic similarity threshold from 85% to 80%',
            'Implement organization-specific cache patterns'
          ]
        },
        createdAt: Date.now(),
        status: 'pending'
      });
    }
    
    // Analyze provider usage
    const totalCost = recentMetrics.reduce((sum, m) => sum + m.totalCost, 0);
    const providerCosts = this.aggregateProviderCosts(recentMetrics);
    
    // Check if using expensive providers
    if (providerCosts.openai && providerCosts.openai > totalCost * 0.3) {
      recommendations.push({
        id: uuidv4(),
        organizationId,
        type: 'provider_switch',
        priority: 'medium',
        title: 'Consider DeepSeek for Cost Efficiency',
        description: 'OpenAI usage represents a significant portion of your costs. DeepSeek provides similar quality at 95% lower cost for most ESG queries.',
        estimatedSavings: {
          monthly: providerCosts.openai * 0.95 * 4.33, // weekly to monthly
          percentage: 60
        },
        implementation: {
          difficulty: 'easy',
          timeToImplement: '30 minutes',
          steps: [
            'Update AI service configuration to prefer DeepSeek',
            'Test critical queries with DeepSeek',
            'Gradually migrate traffic over 1 week'
          ]
        },
        createdAt: Date.now(),
        status: 'pending'
      });
    }
    
    // Store recommendations
    for (const rec of recommendations) {
      const key = `${this.RECOMMENDATION_KEY}:${organizationId}:${rec.id}`;
      await this.redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(rec)); // 30 days TTL
    }
  }

  /**
   * Estimate savings from cache optimization
   */
  private estimateCacheOptimizationSavings(metrics: CostMetrics[]): number {
    const avgWeeklyCost = metrics.reduce((sum, m) => sum + m.totalCost, 0) / metrics.length;
    const currentHitRate = metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / metrics.length;
    const improvedHitRate = Math.min(currentHitRate + 20, 80); // Assume 20% improvement, cap at 80%
    
    const potentialSavings = avgWeeklyCost * ((improvedHitRate - currentHitRate) / 100);
    return potentialSavings * 4.33; // Convert weekly to monthly
  }

  /**
   * Aggregate provider costs from metrics
   */
  private aggregateProviderCosts(metrics: CostMetrics[]): Record<string, number> {
    const aggregated: Record<string, number> = {};
    
    metrics.forEach(metric => {
      Object.entries(metric.costByProvider).forEach(([provider, cost]) => {
        aggregated[provider] = (aggregated[provider] || 0) + cost;
      });
    });
    
    return aggregated;
  }

  /**
   * Get budget alerts for an organization
   */
  async getAlerts(
    organizationId: string,
    acknowledged: boolean = false
  ): Promise<BudgetAlert[]> {
    try {
      const pattern = `${this.ALERT_KEY}:${organizationId}:*`;
      const keys = await this.redis.keys(pattern);
      
      const alerts: BudgetAlert[] = [];
      
      for (const key of keys) {
        const alertData = await this.redis.get(key) as BudgetAlert | null;
        if (alertData && alertData.acknowledged === acknowledged) {
          alerts.push(alertData);
        }
      }
      
      return alerts.sort((a, b) => b.createdAt - a.createdAt);
      
    } catch (error) {
      console.error('❌ Failed to get alerts:', error);
      return [];
    }
  }

  /**
   * Get optimization recommendations
   */
  async getRecommendations(
    organizationId: string,
    status: 'pending' | 'implemented' | 'dismissed' = 'pending'
  ): Promise<OptimizationRecommendation[]> {
    try {
      const pattern = `${this.RECOMMENDATION_KEY}:${organizationId}:*`;
      const keys = await this.redis.keys(pattern);
      
      const recommendations: OptimizationRecommendation[] = [];
      
      for (const key of keys) {
        const recData = await this.redis.get(key) as OptimizationRecommendation | null;
        if (recData && recData.status === status) {
          recommendations.push(recData);
        }
      }
      
      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
      
    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
      return [];
    }
  }

  /**
   * Get intelligent provider recommendation for a request
   */
  async getOptimalProvider(
    organizationId: string,
    requestType: 'simple' | 'complex' | 'creative',
    priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'
  ): Promise<{
    provider: string;
    model: string;
    reasoning: string;
    estimatedCost: number;
    estimatedLatency: number;
  }> {
    // Get recent performance data
    const metrics = await this.getCostMetrics(organizationId, 'daily', 3);
    
    // Default recommendation based on request characteristics
    if (requestType === 'simple' || priority === 'low') {
      return {
        provider: 'deepseek',
        model: 'deepseek-chat',
        reasoning: 'DeepSeek offers excellent cost-effectiveness for simple queries with 95% lower cost than GPT-4',
        estimatedCost: 0.0002,
        estimatedLatency: 2400
      };
    }
    
    if (requestType === 'complex' && (priority === 'high' || priority === 'critical')) {
      return {
        provider: 'openai',
        model: 'gpt-4',
        reasoning: 'GPT-4 provides superior performance for complex, high-priority tasks despite higher cost',
        estimatedCost: 0.02,
        estimatedLatency: 1800
      };
    }
    
    // Default to DeepSeek for most use cases
    return {
      provider: 'deepseek',
      model: 'deepseek-chat',
      reasoning: 'DeepSeek provides optimal balance of cost, performance, and reliability for ESG queries',
      estimatedCost: 0.0002,
      estimatedLatency: 2400
    };
  }

  /**
   * Cleanup old data
   */
  async cleanup(): Promise<void> {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    try {
      // Clean up old usage data
      const usagePattern = `${this.USAGE_KEY}:*`;
      const usageKeys = await this.redis.keys(usagePattern);
      
      for (const key of usageKeys) {
        await this.redis.zremrangebyscore(key, 0, cutoffTime);
      }
      
      console.log('🧹 Cost optimization data cleanup completed');
      
    } catch (error) {
      console.error('❌ Failed to cleanup cost data:', error);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    // Upstash Redis is connectionless - no cleanup needed
    console.log('📴 Cost Optimizer cleaned up');
  }
}

/**
 * Create cost optimizer instance
 */
export function createCostOptimizer(): CostOptimizer {
  return new CostOptimizer();
}