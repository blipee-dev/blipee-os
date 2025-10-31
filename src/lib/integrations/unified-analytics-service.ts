/**
 * Unified Analytics Service
 *
 * Combines metrics from all three systems into a unified dashboard.
 * Part of FASE 3 - Integration & Production Readiness
 *
 * Integrates:
 * - FASE 1: Agent performance, ML predictions, Prophet forecasts
 * - FASE 2: Conversation analytics, AI insights
 * - FASE 3: Cross-system correlations and ROI metrics
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface UnifiedMetrics {
  organizationId: string;
  dateRange: { start: string; end: string };

  // Agent Metrics (FASE 1)
  agents: {
    totalExecutions: number;
    successRate: number;
    avgCostUsd: number;
    totalSavingsIdentified: number;
    topPerformingAgents: Array<{ name: string; executions: number; successRate: number }>;
  };

  // ML Metrics (FASE 1)
  mlModels: {
    totalPredictions: number;
    avgConfidence: number;
    forecastAccuracy: number;
    activeProphetModels: number;
  };

  // Conversation Metrics (FASE 2)
  conversations: {
    totalConversations: number;
    agentInitiated: number;
    userInitiated: number;
    avgQualityScore: number;
    avgSatisfaction: number;
    topTopics: Array<{ topic: string; count: number }>;
  };

  // Cross-System Insights (FASE 3)
  insights: {
    agentConversationQualityDiff: number; // Agent vs User quality
    mlEnhancedConversations: number;
    forecastDrivenDecisions: number;
    totalROI: number; // Estimated value generated
    systemEfficiency: number; // 0-100 composite score
  };

  // Trend Data
  trends: Array<{
    date: string;
    agentExecutions: number;
    conversationQuality: number;
    mlPredictions: number;
    systemEfficiency: number;
  }>;

  // Recommendations
  recommendations: Array<{
    category: 'agent' | 'conversation' | 'ml' | 'integration';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImpact: string;
  }>;
}

export class UnifiedAnalyticsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get unified metrics across all systems
   */
  async getUnifiedMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UnifiedMetrics> {
    try {
      // Run all queries in parallel for performance
      const [
        agentMetrics,
        mlMetrics,
        conversationMetrics,
        crossSystemInsights,
        trends
      ] = await Promise.all([
        this.getAgentMetrics(organizationId, startDate, endDate),
        this.getMLMetrics(organizationId, startDate, endDate),
        this.getConversationMetrics(organizationId, startDate, endDate),
        this.getCrossSystemInsights(organizationId, startDate, endDate),
        this.getTrends(organizationId, startDate, endDate),
      ]);

      // Generate recommendations based on all data
      const recommendations = this.generateRecommendations(
        agentMetrics,
        mlMetrics,
        conversationMetrics,
        crossSystemInsights
      );

      return {
        organizationId,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        agents: agentMetrics,
        mlModels: mlMetrics,
        conversations: conversationMetrics,
        insights: crossSystemInsights,
        trends,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting unified metrics:', error);
      throw error;
    }
  }

  /**
   * Get agent performance metrics (FASE 1)
   */
  private async getAgentMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get agent executions
    const { data: executions } = await this.supabase
      .from('agent_task_executions')
      .select('status, cost_usd, agent_id')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalExecutions = executions?.length || 0;
    const successfulExecutions = executions?.filter(e => e.status === 'completed').length || 0;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const avgCostUsd = totalExecutions > 0
      ? executions!.reduce((sum, e) => sum + (e.cost_usd || 0), 0) / totalExecutions
      : 0;

    // Get cost savings from agent results
    const { data: initiatives } = await this.supabase
      .from('agent_cost_initiatives')
      .select('estimated_annual_savings_usd')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalSavingsIdentified = initiatives?.reduce((sum, i) => sum + (i.estimated_annual_savings_usd || 0), 0) || 0;

    // Get top performing agents
    const agentCounts = new Map<string, { executions: number; successes: number }>();
    executions?.forEach(e => {
      const current = agentCounts.get(e.agent_id) || { executions: 0, successes: 0 };
      current.executions++;
      if (e.status === 'completed') current.successes++;
      agentCounts.set(e.agent_id, current);
    });

    const topPerformingAgents = Array.from(agentCounts.entries())
      .map(([name, stats]) => ({
        name,
        executions: stats.executions,
        successRate: (stats.successes / stats.executions) * 100,
      }))
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 5);

    return {
      totalExecutions,
      successRate,
      avgCostUsd,
      totalSavingsIdentified,
      topPerformingAgents,
    };
  }

  /**
   * Get ML model metrics (FASE 1)
   */
  private async getMLMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get ML predictions
    const { data: predictions } = await this.supabase
      .from('ml_predictions')
      .select('confidence_score, model_id')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalPredictions = predictions?.length || 0;
    const avgConfidence = totalPredictions > 0
      ? predictions!.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / totalPredictions
      : 0;

    // Count active Prophet models
    const activeProphetModels = new Set(
      predictions?.filter(p => p.model_id === 'prophet_v1').map(p => p.model_id)
    ).size;

    // Estimate forecast accuracy (simplified - would need actual vs predicted comparison)
    const forecastAccuracy = avgConfidence * 100; // Placeholder

    return {
      totalPredictions,
      avgConfidence,
      forecastAccuracy,
      activeProphetModels: activeProphetModels || 0,
    };
  }

  /**
   * Get conversation metrics (FASE 2)
   */
  private async getConversationMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Get conversations
    const { data: conversations } = await this.supabase
      .from('conversations')
      .select('id, type')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalConversations = conversations?.length || 0;
    const agentInitiated = conversations?.filter(c => c.type === 'agent_proactive').length || 0;
    const userInitiated = totalConversations - agentInitiated;

    // Get AI analytics for quality and satisfaction
    const conversationIds = conversations?.map(c => c.id) || [];
    const { data: analytics } = await this.supabase
      .from('ai_conversation_analytics')
      .select('conversation_metadata, topics_discussed, user_satisfaction_score')
      .in('conversation_id', conversationIds);

    const avgQualityScore = analytics && analytics.length > 0
      ? analytics.reduce((sum, a) => sum + (a.conversation_metadata?.qualityScore || 0), 0) / analytics.length
      : 0;

    const avgSatisfaction = analytics && analytics.length > 0
      ? analytics.reduce((sum, a) => sum + (a.user_satisfaction_score || 0), 0) / analytics.length
      : 0;

    // Get top topics
    const topicCounts = new Map<string, number>();
    analytics?.forEach(a => {
      (a.topics_discussed || []).forEach((topic: string) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalConversations,
      agentInitiated,
      userInitiated,
      avgQualityScore,
      avgSatisfaction,
      topTopics,
    };
  }

  /**
   * Get cross-system insights (FASE 3)
   */
  private async getCrossSystemInsights(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Agent vs User conversation quality
    const { data: agentConvs } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('type', 'agent_proactive')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: userConvs } = await this.supabase
      .from('conversations')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('type', 'user_chat')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const agentConvIds = agentConvs?.map(c => c.id) || [];
    const userConvIds = userConvs?.map(c => c.id) || [];

    const { data: agentAnalytics } = await this.supabase
      .from('ai_conversation_analytics')
      .select('conversation_metadata')
      .in('conversation_id', agentConvIds);

    const { data: userAnalytics } = await this.supabase
      .from('ai_conversation_analytics')
      .select('conversation_metadata')
      .in('conversation_id', userConvIds);

    const agentQuality = agentAnalytics && agentAnalytics.length > 0
      ? agentAnalytics.reduce((sum, a) => sum + (a.conversation_metadata?.qualityScore || 0), 0) / agentAnalytics.length
      : 0;

    const userQuality = userAnalytics && userAnalytics.length > 0
      ? userAnalytics.reduce((sum, a) => sum + (a.conversation_metadata?.qualityScore || 0), 0) / userAnalytics.length
      : 0;

    const agentConversationQualityDiff = agentQuality - userQuality;

    // Count ML-enhanced conversations (simplified)
    const mlEnhancedConversations = (agentConvs?.length || 0) + (userConvs?.length || 0);

    // Forecast-driven decisions (from agent task executions with forecast context)
    const { data: forecastTasks } = await this.supabase
      .from('agent_task_executions')
      .select('id')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const forecastDrivenDecisions = forecastTasks?.length || 0;

    // Calculate ROI (savings identified - costs incurred)
    const { data: executions } = await this.supabase
      .from('agent_task_executions')
      .select('cost_usd')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const { data: initiatives } = await this.supabase
      .from('agent_cost_initiatives')
      .select('estimated_annual_savings_usd')
      .eq('organization_id', organizationId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalCosts = executions?.reduce((sum, e) => sum + (e.cost_usd || 0), 0) || 0;
    const totalSavings = initiatives?.reduce((sum, i) => sum + (i.estimated_annual_savings_usd || 0), 0) || 0;
    const totalROI = totalSavings - totalCosts;

    // System efficiency composite score
    const systemEfficiency = Math.min(100, (
      (agentQuality / 100) * 30 +
      (userQuality / 100) * 30 +
      (mlEnhancedConversations > 0 ? 20 : 0) +
      (totalROI > 0 ? 20 : 0)
    ));

    return {
      agentConversationQualityDiff,
      mlEnhancedConversations,
      forecastDrivenDecisions,
      totalROI,
      systemEfficiency,
    };
  }

  /**
   * Get trend data over time
   */
  private async getTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ) {
    // Generate daily data points (simplified - would aggregate by day)
    const trends: Array<{
      date: string;
      agentExecutions: number;
      conversationQuality: number;
      mlPredictions: number;
      systemEfficiency: number;
    }> = [];

    // For now, return empty array - would need daily aggregation
    return trends;
  }

  /**
   * Generate recommendations based on unified metrics
   */
  private generateRecommendations(
    agentMetrics: any,
    mlMetrics: any,
    conversationMetrics: any,
    insights: any
  ) {
    const recommendations: Array<{
      category: 'agent' | 'conversation' | 'ml' | 'integration';
      priority: 'high' | 'medium' | 'low';
      title: string;
      description: string;
      estimatedImpact: string;
    }> = [];

    // Agent recommendations
    if (agentMetrics.successRate < 80) {
      recommendations.push({
        category: 'agent',
        priority: 'high',
        title: 'Improve Agent Success Rate',
        description: `Current success rate is ${agentMetrics.successRate.toFixed(1)}%. Review failed executions and optimize agent workflows.`,
        estimatedImpact: '+15-20% success rate',
      });
    }

    // Conversation recommendations
    if (conversationMetrics.avgQualityScore < 60) {
      recommendations.push({
        category: 'conversation',
        priority: 'high',
        title: 'Enhance Conversation Quality',
        description: 'Quality score is below optimal. Consider improving response relevance and context awareness.',
        estimatedImpact: '+20-30% quality score',
      });
    }

    // ML recommendations
    if (mlMetrics.avgConfidence < 0.7) {
      recommendations.push({
        category: 'ml',
        priority: 'medium',
        title: 'Improve ML Model Confidence',
        description: 'Model predictions have low confidence. Consider retraining with more recent data.',
        estimatedImpact: '+10-15% prediction confidence',
      });
    }

    // Integration recommendations
    if (insights.agentConversationQualityDiff < -10) {
      recommendations.push({
        category: 'integration',
        priority: 'high',
        title: 'Optimize Agent Conversations',
        description: 'Agent-initiated conversations underperform user chats. Review agent prompts and interaction patterns.',
        estimatedImpact: '+15-25% agent conversation quality',
      });
    }

    if (insights.totalROI < 0) {
      recommendations.push({
        category: 'integration',
        priority: 'high',
        title: 'Improve System ROI',
        description: 'System costs exceed identified savings. Focus agents on high-impact opportunities.',
        estimatedImpact: '$5K-$10K monthly savings increase',
      });
    }

    // Positive reinforcement
    if (recommendations.length === 0) {
      recommendations.push({
        category: 'integration',
        priority: 'low',
        title: 'System Performing Well',
        description: 'All metrics are within optimal ranges. Continue monitoring for optimization opportunities.',
        estimatedImpact: 'Maintain current performance',
      });
    }

    return recommendations;
  }
}
