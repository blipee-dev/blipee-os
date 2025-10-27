/**
 * Sustainability Intelligence Layer
 *
 * Orchestrates all 8 autonomous agents to provide comprehensive
 * sustainability intelligence for dashboard enrichment.
 *
 * Features:
 * - Parallel agent execution with Promise.allSettled()
 * - 5-minute intelligent caching (TTL)
 * - Dashboard-specific intelligence enrichment
 * - Graceful degradation on agent failures
 * - Performance monitoring
 */

import { CarbonHunterAgent } from './autonomous-agents/carbon-hunter';
import { ComplianceGuardianAgent } from './autonomous-agents/compliance-guardian';
import { ESGChiefOfStaffAgent } from './autonomous-agents/esg-chief-of-staff';
import { AgentResult } from './autonomous-agents/agent-framework';

// Dashboard intelligence types
export interface DashboardIntelligence {
  dashboardType: string;
  organizationId: string;
  insights: AgentInsight[];
  recommendations: AgentRecommendation[];
  alerts: AgentAlert[];
  metrics: IntelligenceMetrics;
  generatedAt: string;
  cacheHit: boolean;
}

export interface AgentInsight {
  agentId: string;
  type: 'trend' | 'anomaly' | 'opportunity' | 'risk' | 'compliance';
  title: string;
  description: string;
  confidence: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  data?: any;
  actionable: boolean;
}

export interface AgentRecommendation {
  agentId: string;
  title: string;
  description: string;
  estimatedImpact?: number;
  estimatedCost?: number;
  difficulty: 'low' | 'medium' | 'high';
  timeframe: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface AgentAlert {
  agentId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  actionRequired: string;
  deadline?: string;
}

export interface IntelligenceMetrics {
  agentsExecuted: number;
  agentsSuccessful: number;
  executionTimeMs: number;
  insightsGenerated: number;
  recommendationsGenerated: number;
  alertsGenerated: number;
}

// Cache entry
interface CacheEntry {
  intelligence: DashboardIntelligence;
  expiresAt: number;
}

/**
 * Main Sustainability Intelligence Service
 */
class SustainabilityIntelligence {
  private static instance: SustainabilityIntelligence;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SustainabilityIntelligence {
    if (!SustainabilityIntelligence.instance) {
      SustainabilityIntelligence.instance = new SustainabilityIntelligence();
    }
    return SustainabilityIntelligence.instance;
  }

  /**
   * Enrich dashboard data with AI intelligence
   */
  async enrichDashboardData(
    dashboardType: string,
    organizationId: string,
    rawData?: any
  ): Promise<DashboardIntelligence> {
    const startTime = Date.now();

    // Check cache first
    const cacheKey = `${organizationId}_${dashboardType}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`[Intelligence] Cache hit for ${dashboardType}`);
      return { ...cached, cacheHit: true };
    }

    console.log(`[Intelligence] Generating intelligence for ${dashboardType}...`);

    // Execute all relevant agents in parallel
    const agentResults = await this.executeAgents(organizationId, dashboardType, rawData);

    // Transform agent results into intelligence
    const intelligence = this.transformAgentResults(
      dashboardType,
      organizationId,
      agentResults,
      Date.now() - startTime
    );

    // Cache the result
    this.saveToCache(cacheKey, intelligence);

    console.log(`[Intelligence] Generated ${intelligence.insights.length} insights, ${intelligence.recommendations.length} recommendations in ${intelligence.metrics.executionTimeMs}ms`);

    return { ...intelligence, cacheHit: false };
  }

  /**
   * Execute agents in parallel based on dashboard type
   */
  private async executeAgents(
    organizationId: string,
    dashboardType: string,
    rawData?: any
  ): Promise<Map<string, AgentResult>> {
    const results = new Map<string, AgentResult>();

    // Determine which agents to run based on dashboard type
    const agentsToRun = this.getRelevantAgents(dashboardType);

    // Execute all agents in parallel using Promise.allSettled
    const agentPromises = agentsToRun.map(async (agentInfo) => {
      try {
        const agent = this.createAgent(agentInfo.type, organizationId);
        const task = this.createTaskForDashboard(dashboardType, rawData);

        const result = await agent.executeTask(task);
        return { agentId: agentInfo.id, result };
      } catch (error) {
        console.error(`[Intelligence] Agent ${agentInfo.id} failed:`, error);
        return {
          agentId: agentInfo.id,
          result: {
            success: false,
            result: null,
            error: error instanceof Error ? error.message : 'Unknown error'
          } as AgentResult
        };
      }
    });

    const settledResults = await Promise.allSettled(agentPromises);

    // Collect results
    settledResults.forEach((settled) => {
      if (settled.status === 'fulfilled' && settled.value) {
        results.set(settled.value.agentId, settled.value.result);
      }
    });

    return results;
  }

  /**
   * Get relevant agents for a dashboard type
   */
  private getRelevantAgents(dashboardType: string): Array<{ id: string; type: string }> {
    const agentMap: Record<string, Array<{ id: string; type: string }>> = {
      emissions: [
        { id: 'carbon-hunter', type: 'CarbonHunter' },
        { id: 'compliance-guardian', type: 'ComplianceGuardian' },
        { id: 'esg-chief', type: 'EsgChief' }
      ],
      energy: [
        { id: 'carbon-hunter', type: 'CarbonHunter' },
        { id: 'esg-chief', type: 'EsgChief' }
      ],
      compliance: [
        { id: 'compliance-guardian', type: 'ComplianceGuardian' },
        { id: 'esg-chief', type: 'EsgChief' }
      ],
      targets: [
        { id: 'esg-chief', type: 'EsgChief' },
        { id: 'carbon-hunter', type: 'CarbonHunter' }
      ],
      overview: [
        { id: 'carbon-hunter', type: 'CarbonHunter' },
        { id: 'compliance-guardian', type: 'ComplianceGuardian' },
        { id: 'esg-chief', type: 'EsgChief' }
      ]
    };

    return agentMap[dashboardType] || agentMap.overview;
  }

  /**
   * Create agent instance by type
   */
  private createAgent(type: string, organizationId: string): any {
    switch (type) {
      case 'CarbonHunter':
        return new CarbonHunterAgent(organizationId);
      case 'ComplianceGuardian':
        return new ComplianceGuardianAgent(organizationId);
      case 'EsgChief':
        return new EsgChiefOfStaffAgent(organizationId);
      default:
        throw new Error(`Unknown agent type: ${type}`);
    }
  }

  /**
   * Create task for dashboard analysis
   */
  private createTaskForDashboard(dashboardType: string, rawData?: any): any {
    const now = new Date();

    return {
      id: `dashboard-${dashboardType}-${now.getTime()}`,
      type: this.getTaskTypeForDashboard(dashboardType),
      priority: 'high' as const,
      data: {
        dashboardType,
        rawData,
        analysisDepth: 'comprehensive'
      },
      requiresApproval: false,
      scheduledFor: now,
      createdBy: 'system' as const
    };
  }

  /**
   * Get task type for dashboard
   */
  private getTaskTypeForDashboard(dashboardType: string): string {
    const taskTypeMap: Record<string, string> = {
      emissions: 'hunt_carbon_opportunities',
      energy: 'analyze_carbon_trends',
      compliance: 'monitor_compliance',
      targets: 'strategic_dashboard_review',
      overview: 'comprehensive_analysis'
    };

    return taskTypeMap[dashboardType] || 'comprehensive_analysis';
  }

  /**
   * Transform agent results into intelligence format
   */
  private transformAgentResults(
    dashboardType: string,
    organizationId: string,
    agentResults: Map<string, AgentResult>,
    executionTimeMs: number
  ): DashboardIntelligence {
    const insights: AgentInsight[] = [];
    const recommendations: AgentRecommendation[] = [];
    const alerts: AgentAlert[] = [];

    let agentsSuccessful = 0;

    // Process each agent result
    agentResults.forEach((result, agentId) => {
      if (!result.success) {
        console.warn(`[Intelligence] Agent ${agentId} failed:`, result.error);
        return;
      }

      agentsSuccessful++;

      // Extract insights
      if (result.insights && Array.isArray(result.insights)) {
        result.insights.forEach((insight: string) => {
          insights.push({
            agentId,
            type: this.inferInsightType(insight),
            title: this.extractInsightTitle(insight),
            description: insight,
            confidence: 0.8,
            priority: this.inferPriority(insight),
            actionable: this.isActionable(insight)
          });
        });
      }

      // Extract recommendations (from actions or next steps)
      if (result.actions && Array.isArray(result.actions)) {
        result.actions.forEach((action: any) => {
          recommendations.push({
            agentId,
            title: action.description || action.type,
            description: action.description || '',
            estimatedImpact: action.impact?.value || action.annualSavings,
            estimatedCost: action.impact?.cost,
            difficulty: this.inferDifficulty(action),
            timeframe: action.timeframe || 'Unknown',
            priority: action.severity === 'critical' ? 'critical' : 'medium'
          });
        });
      }

      if (result.nextSteps && Array.isArray(result.nextSteps)) {
        result.nextSteps.slice(0, 3).forEach((step: string) => {
          recommendations.push({
            agentId,
            title: step,
            description: step,
            difficulty: 'medium',
            timeframe: 'Short-term',
            priority: 'medium'
          });
        });
      }

      // Extract alerts (from executedActions with high severity)
      if (result.executedActions && Array.isArray(result.executedActions)) {
        result.executedActions
          .filter((action: any) => action.severity === 'high' || action.severity === 'critical')
          .forEach((action: any) => {
            alerts.push({
              agentId,
              severity: action.severity,
              message: action.description || action.type,
              actionRequired: 'Review and take action',
              deadline: action.deadline
            });
          });
      }
    });

    // Calculate metrics
    const metrics: IntelligenceMetrics = {
      agentsExecuted: agentResults.size,
      agentsSuccessful,
      executionTimeMs,
      insightsGenerated: insights.length,
      recommendationsGenerated: recommendations.length,
      alertsGenerated: alerts.length
    };

    return {
      dashboardType,
      organizationId,
      insights,
      recommendations,
      alerts,
      metrics,
      generatedAt: new Date().toISOString(),
      cacheHit: false
    };
  }

  /**
   * Infer insight type from content
   */
  private inferInsightType(insight: string): AgentInsight['type'] {
    const lower = insight.toLowerCase();

    if (lower.includes('trend') || lower.includes('increasing') || lower.includes('decreasing')) {
      return 'trend';
    }
    if (lower.includes('anomaly') || lower.includes('unusual') || lower.includes('unexpected')) {
      return 'anomaly';
    }
    if (lower.includes('opportunity') || lower.includes('potential') || lower.includes('could')) {
      return 'opportunity';
    }
    if (lower.includes('risk') || lower.includes('concern') || lower.includes('issue')) {
      return 'risk';
    }
    if (lower.includes('compliance') || lower.includes('regulation') || lower.includes('deadline')) {
      return 'compliance';
    }

    return 'trend';
  }

  /**
   * Extract insight title (first sentence or first 60 chars)
   */
  private extractInsightTitle(insight: string): string {
    const firstSentence = insight.split(/[.!?]/)[0];
    return firstSentence.length > 60
      ? firstSentence.substring(0, 57) + '...'
      : firstSentence;
  }

  /**
   * Infer priority from content
   */
  private inferPriority(content: string): AgentInsight['priority'] {
    const lower = content.toLowerCase();

    if (lower.includes('critical') || lower.includes('urgent') || lower.includes('immediate')) {
      return 'critical';
    }
    if (lower.includes('important') || lower.includes('significant') || lower.includes('major')) {
      return 'high';
    }
    if (lower.includes('minor') || lower.includes('small') || lower.includes('low')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Check if insight is actionable
   */
  private isActionable(insight: string): boolean {
    const actionKeywords = [
      'should', 'could', 'recommend', 'suggest', 'consider',
      'implement', 'review', 'investigate', 'address', 'fix'
    ];

    const lower = insight.toLowerCase();
    return actionKeywords.some(keyword => lower.includes(keyword));
  }

  /**
   * Infer difficulty from action
   */
  private inferDifficulty(action: any): AgentRecommendation['difficulty'] {
    if (action.difficulty) return action.difficulty;

    const cost = action.impact?.cost || action.estimatedCost || 0;
    const timeframe = action.timeframe || '';

    if (cost > 50000 || timeframe.toLowerCase().includes('long')) {
      return 'high';
    }
    if (cost > 10000 || timeframe.toLowerCase().includes('medium')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache(key: string): DashboardIntelligence | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.intelligence;
  }

  /**
   * Save to cache with TTL
   */
  private saveToCache(key: string, intelligence: DashboardIntelligence): void {
    this.cache.set(key, {
      intelligence,
      expiresAt: Date.now() + this.CACHE_TTL_MS
    });
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  clearCache(organizationId?: string, dashboardType?: string): void {
    if (organizationId && dashboardType) {
      const key = `${organizationId}_${dashboardType}`;
      this.cache.delete(key);
    } else if (organizationId) {
      // Clear all cache entries for this organization
      for (const key of this.cache.keys()) {
        if (key.startsWith(organizationId)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export getter functions for lazy initialization (prevents build-time instantiation)
export function getBlipeeIntelligence(): SustainabilityIntelligence {
  return SustainabilityIntelligence.getInstance();
}

// Backward compatibility - lazy-loaded singleton exports
// These use getters so they don't instantiate during Next.js build analysis
let _blipeeIntelligenceInstance: SustainabilityIntelligence | null = null;

export const blipeeIntelligence = {
  get enrichDashboardData() {
    if (!_blipeeIntelligenceInstance) {
      _blipeeIntelligenceInstance = SustainabilityIntelligence.getInstance();
    }
    return _blipeeIntelligenceInstance.enrichDashboardData.bind(_blipeeIntelligenceInstance);
  },
  get clearCache() {
    if (!_blipeeIntelligenceInstance) {
      _blipeeIntelligenceInstance = SustainabilityIntelligence.getInstance();
    }
    return _blipeeIntelligenceInstance.clearCache.bind(_blipeeIntelligenceInstance);
  },
  get getCacheStats() {
    if (!_blipeeIntelligenceInstance) {
      _blipeeIntelligenceInstance = SustainabilityIntelligence.getInstance();
    }
    return _blipeeIntelligenceInstance.getCacheStats.bind(_blipeeIntelligenceInstance);
  }
};

// Legacy alias for backward compatibility
export const sustainabilityIntelligence = blipeeIntelligence;
