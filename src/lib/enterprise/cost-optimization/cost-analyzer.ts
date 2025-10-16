/**
 * Cost Optimization Analyzer
 * Advanced cost analysis and optimization recommendations for enterprise deployments
 */

export interface ResourceCost {
  resourceId: string;
  resourceType: 'compute' | 'storage' | 'network' | 'database' | 'ai-inference' | 'cdn' | 'monitoring';
  provider: 'vercel' | 'supabase' | 'openai' | 'deepseek' | 'anthropic' | 'cloudflare';
  region: string;
  costMetrics: {
    hourly: number;
    daily: number;
    monthly: number;
    yearly: number;
  };
  usage: {
    current: number;
    average30Day: number;
    peak: number;
    unit: string; // e.g., 'requests', 'GB', 'tokens', 'hours'
  };
  efficiency: {
    utilizationRate: number; // 0-100%
    wastePercentage: number; // 0-100%
    rightsizingOpportunity: number; // potential savings in $
  };
  tags: Record<string, string>;
  lastUpdated: Date;
}

export interface CostOptimizationRecommendation {
  id: string;
  type: 'rightsizing' | 'reserved-capacity' | 'spot-instances' | 'auto-scaling' | 'resource-scheduling' | 'provider-switch' | 'architecture-change';
  priority: 'low' | 'medium' | 'high' | 'critical';
  resourceId: string;
  title: string;
  description: string;
  impact: {
    costSavings: {
      monthly: number;
      yearly: number;
      percentage: number;
    };
    performanceImpact: 'positive' | 'neutral' | 'minimal-negative' | 'significant-negative';
    implementationComplexity: 'low' | 'medium' | 'high';
    riskLevel: 'low' | 'medium' | 'high';
  };
  implementation: {
    steps: string[];
    estimatedTimeHours: number;
    requiredSkills: string[];
    dependencies: string[];
  };
  monitoring: {
    metricsToWatch: string[];
    successCriteria: string[];
    rollbackPlan: string;
  };
  createdAt: Date;
  implementedAt?: Date;
  status: 'pending' | 'approved' | 'implementing' | 'completed' | 'rejected';
}

export interface CostBudget {
  id: string;
  name: string;
  scope: 'global' | 'region' | 'team' | 'project' | 'resource-type';
  scopeFilter: string;
  budgetLimits: {
    monthly: number;
    quarterly: number;
    yearly: number;
  };
  alerts: {
    thresholds: number[]; // e.g., [50, 80, 95, 100]
    recipients: string[];
    channels: ('email' | 'slack' | 'webhook')[];
  };
  currentSpend: {
    thisMonth: number;
    thisQuarter: number;
    thisYear: number;
    projectedMonth: number;
  };
  isActive: boolean;
  createdAt: Date;
}

export interface CostTrend {
  period: 'hour' | 'day' | 'week' | 'month';
  data: Array<{
    timestamp: Date;
    totalCost: number;
    breakdown: Record<string, number>; // by resource type or provider
  }>;
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    changeRate: number; // percentage change
    seasonality: boolean;
    anomalies: Date[];
  };
}

/**
 * Cost Optimization Analyzer
 */
export class CostOptimizationAnalyzer {
  private resources: Map<string, ResourceCost> = new Map();
  private recommendations: Map<string, CostOptimizationRecommendation> = new Map();
  private budgets: Map<string, CostBudget> = new Map();
  private trends: Map<string, CostTrend> = new Map();

  constructor() {
    this.initializeResources();
    this.initializeBudgets();
  }

  /**
   * Initialize resource cost tracking
   */
  private initializeResources(): void {
    const sampleResources: ResourceCost[] = [
      {
        resourceId: 'vercel-pro-functions',
        resourceType: 'compute',
        provider: 'vercel',
        region: 'global',
        costMetrics: {
          hourly: 2.50,
          daily: 60.00,
          monthly: 1800.00,
          yearly: 21600.00
        },
        usage: {
          current: 1200,
          average30Day: 950,
          peak: 2400,
          unit: 'function-hours'
        },
        efficiency: {
          utilizationRate: 65,
          wastePercentage: 35,
          rightsizingOpportunity: 630.00
        },
        tags: {
          environment: 'production',
          team: 'platform',
          project: 'blipee-os'
        },
        lastUpdated: new Date()
      },
      {
        resourceId: 'supabase-pro-database',
        resourceType: 'database',
        provider: 'supabase',
        region: 'us-east-1',
        costMetrics: {
          hourly: 1.25,
          daily: 30.00,
          monthly: 900.00,
          yearly: 10800.00
        },
        usage: {
          current: 85,
          average30Day: 78,
          peak: 95,
          unit: 'cpu-percentage'
        },
        efficiency: {
          utilizationRate: 85,
          wastePercentage: 15,
          rightsizingOpportunity: 135.00
        },
        tags: {
          environment: 'production',
          team: 'platform',
          project: 'blipee-os'
        },
        lastUpdated: new Date()
      },
      {
        resourceId: 'openai-gpt-4-api',
        resourceType: 'ai-inference',
        provider: 'openai',
        region: 'global',
        costMetrics: {
          hourly: 8.33,
          daily: 200.00,
          monthly: 6000.00,
          yearly: 72000.00
        },
        usage: {
          current: 2500000,
          average30Day: 2200000,
          peak: 3800000,
          unit: 'tokens'
        },
        efficiency: {
          utilizationRate: 92,
          wastePercentage: 8,
          rightsizingOpportunity: 480.00
        },
        tags: {
          environment: 'production',
          team: 'ai',
          project: 'blipee-os'
        },
        lastUpdated: new Date()
      },
      {
        resourceId: 'deepseek-r1-api',
        resourceType: 'ai-inference',
        provider: 'deepseek',
        region: 'global',
        costMetrics: {
          hourly: 1.67,
          daily: 40.00,
          monthly: 1200.00,
          yearly: 14400.00
        },
        usage: {
          current: 5000000,
          average30Day: 4500000,
          peak: 7200000,
          unit: 'tokens'
        },
        efficiency: {
          utilizationRate: 88,
          wastePercentage: 12,
          rightsizingOpportunity: 144.00
        },
        tags: {
          environment: 'production',
          team: 'ai',
          project: 'blipee-os'
        },
        lastUpdated: new Date()
      }
    ];

    sampleResources.forEach(resource => {
      this.resources.set(resource.resourceId, resource);
    });
  }

  /**
   * Initialize cost budgets
   */
  private initializeBudgets(): void {
    const defaultBudgets: CostBudget[] = [
      {
        id: 'global-monthly-budget',
        name: 'Global Monthly Budget',
        scope: 'global',
        scopeFilter: '*',
        budgetLimits: {
          monthly: 10000,
          quarterly: 28000,
          yearly: 100000
        },
        alerts: {
          thresholds: [50, 75, 90, 100],
          recipients: ['finance@blipee.ai', 'cto@blipee.ai'],
          channels: ['email', 'slack']
        },
        currentSpend: {
          thisMonth: 7800,
          thisQuarter: 22400,
          thisYear: 89600,
          projectedMonth: 9900
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'ai-inference-budget',
        name: 'AI Inference Budget',
        scope: 'resource-type',
        scopeFilter: 'ai-inference',
        budgetLimits: {
          monthly: 8000,
          quarterly: 22000,
          yearly: 80000
        },
        alerts: {
          thresholds: [60, 80, 95, 100],
          recipients: ['ai-team@blipee.ai'],
          channels: ['slack', 'email']
        },
        currentSpend: {
          thisMonth: 7200,
          thisQuarter: 20800,
          thisYear: 79200,
          projectedMonth: 8640
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    defaultBudgets.forEach(budget => {
      this.budgets.set(budget.id, budget);
    });
  }

  /**
   * Analyze costs and generate optimization recommendations
   */
  async analyzeAndOptimize(): Promise<{
    totalMonthlyCost: number;
    totalPotentialSavings: number;
    recommendations: CostOptimizationRecommendation[];
    topWastefulResources: ResourceCost[];
    budgetStatus: 'under' | 'approaching' | 'over';
  }> {
    // Calculate total costs
    let totalMonthlyCost = 0;
    let totalPotentialSavings = 0;
    const resourcesArray = Array.from(this.resources.values());
    
    for (const resource of resourcesArray) {
      totalMonthlyCost += resource.costMetrics.monthly;
      totalPotentialSavings += resource.efficiency.rightsizingOpportunity;
    }

    // Generate recommendations
    const recommendations = await this.generateRecommendations();
    
    // Find most wasteful resources
    const topWastefulResources = resourcesArray
      .sort((a, b) => b.efficiency.wastePercentage - a.efficiency.wastePercentage)
      .slice(0, 5);

    // Check budget status
    const globalBudget = this.budgets.get('global-monthly-budget');
    const budgetStatus = globalBudget 
      ? (globalBudget.currentSpend.thisMonth > globalBudget.budgetLimits.monthly ? 'over' :
         globalBudget.currentSpend.projectedMonth > globalBudget.budgetLimits.monthly * 0.8 ? 'approaching' : 'under')
      : 'under';

    return {
      totalMonthlyCost,
      totalPotentialSavings,
      recommendations,
      topWastefulResources,
      budgetStatus
    };
  }

  /**
   * Generate optimization recommendations
   */
  private async generateRecommendations(): Promise<CostOptimizationRecommendation[]> {
    const recommendations: CostOptimizationRecommendation[] = [];
    
    for (const [resourceId, resource] of Array.from(this.resources)) {
      // Rightsizing recommendation for underutilized resources
      if (resource.efficiency.utilizationRate < 70) {
        const recommendation: CostOptimizationRecommendation = {
          id: `rightsize_${resourceId}`,
          type: 'rightsizing',
          priority: resource.efficiency.utilizationRate < 50 ? 'high' : 'medium',
          resourceId,
          title: `Rightsize ${resource.resourceType} - ${resource.resourceId}`,
          description: `Resource is only ${resource.efficiency.utilizationRate}% utilized. Consider scaling down to reduce costs.`,
          impact: {
            costSavings: {
              monthly: resource.efficiency.rightsizingOpportunity,
              yearly: resource.efficiency.rightsizingOpportunity * 12,
              percentage: (resource.efficiency.rightsizingOpportunity / resource.costMetrics.monthly) * 100
            },
            performanceImpact: resource.efficiency.utilizationRate < 30 ? 'neutral' : 'minimal-negative',
            implementationComplexity: 'medium',
            riskLevel: 'low'
          },
          implementation: {
            steps: [
              'Analyze usage patterns over the last 30 days',
              'Identify peak usage times and requirements',
              'Calculate optimal resource size',
              'Schedule downscaling during low-usage periods',
              'Monitor performance after changes'
            ],
            estimatedTimeHours: 4,
            requiredSkills: ['infrastructure', 'monitoring'],
            dependencies: ['monitoring-setup']
          },
          monitoring: {
            metricsToWatch: ['utilization-rate', 'response-time', 'error-rate'],
            successCriteria: ['Cost reduction achieved', 'Performance maintained', 'No increase in errors'],
            rollbackPlan: 'Scale resources back to original size if performance degrades'
          },
          createdAt: new Date(),
          status: 'pending'
        };
        
        recommendations.push(recommendation);
        this.recommendations.set(recommendation.id, recommendation);
      }

      // AI model switching recommendation
      if (resource.resourceType === 'ai-inference' && resource.provider === 'openai') {
        const recommendation: CostOptimizationRecommendation = {
          id: `switch_ai_${resourceId}`,
          type: 'provider-switch',
          priority: 'high',
          resourceId,
          title: 'Switch to DeepSeek for cost optimization',
          description: 'DeepSeek R1 offers 80% cost savings compared to GPT-4 with comparable performance for sustainability tasks.',
          impact: {
            costSavings: {
              monthly: resource.costMetrics.monthly * 0.8,
              yearly: resource.costMetrics.yearly * 0.8,
              percentage: 80
            },
            performanceImpact: 'neutral',
            implementationComplexity: 'low',
            riskLevel: 'medium'
          },
          implementation: {
            steps: [
              'Set up DeepSeek API integration',
              'Implement A/B testing framework',
              'Run parallel inference for quality comparison',
              'Gradually shift traffic to DeepSeek',
              'Monitor quality metrics and user feedback'
            ],
            estimatedTimeHours: 8,
            requiredSkills: ['backend-development', 'ai-integration'],
            dependencies: ['deepseek-api-access']
          },
          monitoring: {
            metricsToWatch: ['response-quality', 'latency', 'cost-per-request'],
            successCriteria: ['80% cost reduction achieved', 'Quality maintained above 95%', 'Latency under 2s'],
            rollbackPlan: 'Switch back to OpenAI if quality drops below threshold'
          },
          createdAt: new Date(),
          status: 'pending'
        };
        
        recommendations.push(recommendation);
        this.recommendations.set(recommendation.id, recommendation);
      }

      // Auto-scaling recommendation for variable workloads
      if (resource.usage.peak > resource.usage.average30Day * 1.5) {
        const recommendation: CostOptimizationRecommendation = {
          id: `autoscale_${resourceId}`,
          type: 'auto-scaling',
          priority: 'medium',
          resourceId,
          title: 'Implement auto-scaling',
          description: `Peak usage is ${Math.round((resource.usage.peak / resource.usage.average30Day - 1) * 100)}% higher than average. Auto-scaling can optimize costs.`,
          impact: {
            costSavings: {
              monthly: resource.costMetrics.monthly * 0.25,
              yearly: resource.costMetrics.yearly * 0.25,
              percentage: 25
            },
            performanceImpact: 'positive',
            implementationComplexity: 'high',
            riskLevel: 'medium'
          },
          implementation: {
            steps: [
              'Implement resource monitoring and alerting',
              'Define scaling policies and thresholds',
              'Set up automatic scaling infrastructure',
              'Test scaling behavior under load',
              'Monitor cost and performance impacts'
            ],
            estimatedTimeHours: 16,
            requiredSkills: ['devops', 'infrastructure', 'monitoring'],
            dependencies: ['infrastructure-automation']
          },
          monitoring: {
            metricsToWatch: ['scaling-events', 'resource-utilization', 'response-time'],
            successCriteria: ['25% cost reduction', 'Improved performance during peaks', 'Successful scale-down during low usage'],
            rollbackPlan: 'Disable auto-scaling and return to fixed capacity'
          },
          createdAt: new Date(),
          status: 'pending'
        };
        
        recommendations.push(recommendation);
        this.recommendations.set(recommendation.id, recommendation);
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Check budget alerts
   */
  checkBudgetAlerts(): Array<{
    budgetId: string;
    budgetName: string;
    alertLevel: string;
    currentSpend: number;
    budgetLimit: number;
    percentageUsed: number;
    projectedOverage: number;
  }> {
    const alerts: Array<{
      budgetId: string;
      budgetName: string;
      alertLevel: string;
      currentSpend: number;
      budgetLimit: number;
      percentageUsed: number;
      projectedOverage: number;
    }> = [];

    for (const [budgetId, budget] of Array.from(this.budgets)) {
      if (!budget.isActive) continue;

      const percentageUsed = (budget.currentSpend.thisMonth / budget.budgetLimits.monthly) * 100;
      const projectedOverage = Math.max(0, budget.currentSpend.projectedMonth - budget.budgetLimits.monthly);

      // Check each threshold
      for (const threshold of budget.alerts.thresholds) {
        if (percentageUsed >= threshold) {
          alerts.push({
            budgetId,
            budgetName: budget.name,
            alertLevel: threshold >= 100 ? 'critical' : threshold >= 90 ? 'high' : 'medium',
            currentSpend: budget.currentSpend.thisMonth,
            budgetLimit: budget.budgetLimits.monthly,
            percentageUsed: Math.round(percentageUsed),
            projectedOverage: Math.round(projectedOverage)
          });
          break; // Only trigger the highest applicable threshold
        }
      }
    }

    return alerts;
  }

  /**
   * Get cost breakdown by category
   */
  getCostBreakdown(): {
    byResourceType: Record<string, number>;
    byProvider: Record<string, number>;
    byRegion: Record<string, number>;
    byTeam: Record<string, number>;
    total: number;
  } {
    const byResourceType: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    const byRegion: Record<string, number> = {};
    const byTeam: Record<string, number> = {};
    let total = 0;

    for (const resource of Array.from(this.resources.values())) {
      const monthlyCost = resource.costMetrics.monthly;
      total += monthlyCost;

      byResourceType[resource.resourceType] = (byResourceType[resource.resourceType] || 0) + monthlyCost;
      byProvider[resource.provider] = (byProvider[resource.provider] || 0) + monthlyCost;
      byRegion[resource.region] = (byRegion[resource.region] || 0) + monthlyCost;
      
      const team = resource.tags.team || 'untagged';
      byTeam[team] = (byTeam[team] || 0) + monthlyCost;
    }

    return {
      byResourceType,
      byProvider,
      byRegion,
      byTeam,
      total
    };
  }

  /**
   * Generate cost forecast
   */
  generateCostForecast(months: number = 12): Array<{
    month: string;
    projectedCost: number;
    confidence: 'high' | 'medium' | 'low';
    factors: string[];
  }> {
    const forecast: Array<{
      month: string;
      projectedCost: number;
      confidence: 'high' | 'medium' | 'low';
      factors: string[];
    }> = [];

    const currentMonthlyCost = this.getCostBreakdown().total;
    const growthRate = 0.15; // 15% monthly growth assumption
    const seasonalityFactor = [1.0, 0.9, 1.1, 1.0, 0.95, 1.05, 1.2, 1.1, 1.0, 1.1, 1.3, 1.4]; // Holiday patterns

    for (let i = 1; i <= months; i++) {
      const baseProjection = currentMonthlyCost * Math.pow(1 + growthRate / 12, i);
      const seasonalAdjustment = seasonalityFactor[(new Date().getMonth() + i - 1) % 12];
      const projectedCost = Math.round(baseProjection * seasonalAdjustment);
      
      const date = new Date();
      date.setMonth(date.getMonth() + i);
      const month = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      const confidence = i <= 3 ? 'high' : i <= 6 ? 'medium' : 'low';
      const factors = [
        'Business growth',
        'Seasonal patterns',
        i > 6 ? 'Market uncertainty' : 'Historical trends'
      ];

      forecast.push({
        month,
        projectedCost,
        confidence,
        factors
      });
    }

    return forecast;
  }

  /**
   * Get all resources
   */
  getResources(): Map<string, ResourceCost> {
    return new Map(this.resources);
  }

  /**
   * Get all recommendations
   */
  getRecommendations(): Map<string, CostOptimizationRecommendation> {
    return new Map(this.recommendations);
  }

  /**
   * Get all budgets
   */
  getBudgets(): Map<string, CostBudget> {
    return new Map(this.budgets);
  }

  /**
   * Update resource cost data
   */
  updateResourceCost(resourceId: string, updates: Partial<ResourceCost>): void {
    const resource = this.resources.get(resourceId);
    if (resource) {
      Object.assign(resource, updates, { lastUpdated: new Date() });
      this.resources.set(resourceId, resource);
    }
  }

  /**
   * Implement recommendation
   */
  implementRecommendation(recommendationId: string, implementedBy: string): void {
    const recommendation = this.recommendations.get(recommendationId);
    if (recommendation) {
      recommendation.status = 'implementing';
      recommendation.implementedAt = new Date();
      this.recommendations.set(recommendationId, recommendation);
      
    }
  }
}

/**
 * Global cost optimization analyzer instance
 */
export const costOptimizationAnalyzer = new CostOptimizationAnalyzer();