/**
 * Agent-Conversation Integration Service
 *
 * Bridges FASE 1 (Autonomous Agents) with FASE 2 (Conversation Intelligence)
 * Part of FASE 3 - Integration & Production Readiness
 *
 * Features:
 * - Track agent-initiated conversations
 * - Correlate agent performance with conversation quality
 * - Generate insights on agent effectiveness
 * - Provide feedback loop for agent improvement
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface AgentConversationMetrics {
  agentType: string;
  totalConversations: number;
  avgQualityScore: number;
  avgResponseTime: number;
  userSatisfactionScore: number;
  outcomeDistribution: {
    resolved: number;
    escalated: number;
    ongoing: number;
    abandoned: number;
  };
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topTopics: Array<{ topic: string; count: number }>;
  commonIntents: Array<{ intent: string; count: number }>;
  aiPerformance: {
    helpfulness: number;
    accuracy: number;
    clarity: number;
  };
}

interface AgentEffectivenessReport {
  organizationId: string;
  dateRange: {
    start: string;
    end: string;
  };
  overallMetrics: {
    totalAgentConversations: number;
    totalUserConversations: number;
    agentInitiatedPercentage: number;
    avgAgentQualityScore: number;
    avgUserQualityScore: number;
    qualityImprovement: number; // positive if agents are better
  };
  byAgentType: Record<string, AgentConversationMetrics>;
  recommendations: string[];
  performanceTrends: Array<{
    date: string;
    agentQuality: number;
    userQuality: number;
  }>;
}

export class AgentConversationIntegrationService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Get comprehensive metrics for agent conversations
   */
  async getAgentConversationMetrics(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AgentEffectivenessReport> {
    try {
      // Get agent conversations
      const { data: agentConversations } = await this.supabase
        .from('conversations')
        .select('id, metadata, created_at')
        .eq('organization_id', organizationId)
        .eq('type', 'agent_proactive')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      // Get user conversations for comparison
      const { data: userConversations } = await this.supabase
        .from('conversations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('type', 'user_chat')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const totalAgentConversations = agentConversations?.length || 0;
      const totalUserConversations = userConversations?.length || 0;
      const totalConversations = totalAgentConversations + totalUserConversations;

      // Get AI analytics for agent conversations
      const agentConversationIds = agentConversations?.map(c => c.id) || [];
      const { data: agentAnalytics } = await this.supabase
        .from('ai_conversation_analytics')
        .select('*')
        .in('conversation_id', agentConversationIds);

      // Get AI analytics for user conversations
      const userConversationIds = userConversations?.map(c => c.id) || [];
      const { data: userAnalytics } = await this.supabase
        .from('ai_conversation_analytics')
        .select('*')
        .in('conversation_id', userConversationIds);

      // Calculate overall metrics
      const avgAgentQualityScore = this.calculateAverageQuality(agentAnalytics || []);
      const avgUserQualityScore = this.calculateAverageQuality(userAnalytics || []);
      const qualityImprovement = avgAgentQualityScore - avgUserQualityScore;

      // Group agent conversations by agent type
      const byAgentType = this.groupByAgentType(agentConversations || [], agentAnalytics || []);

      // Calculate performance trends
      const performanceTrends = await this.calculatePerformanceTrends(
        organizationId,
        startDate,
        endDate
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        avgAgentQualityScore,
        avgUserQualityScore,
        byAgentType
      );

      return {
        organizationId,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
        overallMetrics: {
          totalAgentConversations,
          totalUserConversations,
          agentInitiatedPercentage: totalConversations > 0
            ? (totalAgentConversations / totalConversations) * 100
            : 0,
          avgAgentQualityScore,
          avgUserQualityScore,
          qualityImprovement,
        },
        byAgentType,
        recommendations,
        performanceTrends,
      };
    } catch (error) {
      console.error('Error getting agent conversation metrics:', error);
      throw error;
    }
  }

  /**
   * Calculate average quality score from analytics
   */
  private calculateAverageQuality(analytics: any[]): number {
    if (analytics.length === 0) return 0;

    const totalQuality = analytics.reduce((sum, a) => {
      return sum + (a.conversation_metadata?.qualityScore || 0);
    }, 0);

    return totalQuality / analytics.length;
  }

  /**
   * Group conversations by agent type and calculate metrics
   */
  private groupByAgentType(
    conversations: any[],
    analytics: any[]
  ): Record<string, AgentConversationMetrics> {
    const analyticsMap = new Map(analytics.map(a => [a.conversation_id, a]));
    const agentGroups: Record<string, any[]> = {};

    // Group conversations by agent type from metadata
    for (const conv of conversations) {
      const agentType = conv.metadata?.agent_type || 'unknown';
      if (!agentGroups[agentType]) {
        agentGroups[agentType] = [];
      }
      agentGroups[agentType].push(conv);
    }

    // Calculate metrics for each agent type
    const result: Record<string, AgentConversationMetrics> = {};

    for (const [agentType, convs] of Object.entries(agentGroups)) {
      const agentAnalytics = convs
        .map(c => analyticsMap.get(c.id))
        .filter(a => a !== undefined);

      result[agentType] = this.calculateAgentTypeMetrics(agentType, agentAnalytics);
    }

    return result;
  }

  /**
   * Calculate metrics for a specific agent type
   */
  private calculateAgentTypeMetrics(
    agentType: string,
    analytics: any[]
  ): AgentConversationMetrics {
    const totalConversations = analytics.length;

    if (totalConversations === 0) {
      return {
        agentType,
        totalConversations: 0,
        avgQualityScore: 0,
        avgResponseTime: 0,
        userSatisfactionScore: 0,
        outcomeDistribution: { resolved: 0, escalated: 0, ongoing: 0, abandoned: 0 },
        sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
        topTopics: [],
        commonIntents: [],
        aiPerformance: { helpfulness: 0, accuracy: 0, clarity: 0 },
      };
    }

    // Calculate averages
    const avgQualityScore = analytics.reduce((sum, a) =>
      sum + (a.conversation_metadata?.qualityScore || 0), 0) / totalConversations;

    const avgResponseTime = analytics.reduce((sum, a) =>
      sum + (a.avg_response_time_ms || 0), 0) / totalConversations;

    const avgSatisfaction = analytics.reduce((sum, a) =>
      sum + (a.user_satisfaction_score || 0), 0) / totalConversations;

    // Calculate outcome distribution
    const outcomeDistribution = { resolved: 0, escalated: 0, ongoing: 0, abandoned: 0 };
    analytics.forEach(a => {
      const outcome = a.conversation_metadata?.conversationOutcome || 'ongoing';
      if (outcome in outcomeDistribution) {
        outcomeDistribution[outcome as keyof typeof outcomeDistribution]++;
      }
    });

    // Calculate sentiment distribution
    const sentimentDistribution = { positive: 0, neutral: 0, negative: 0 };
    analytics.forEach(a => {
      const sentiment = a.conversation_metadata?.userSentiment || 'neutral';
      if (sentiment in sentimentDistribution) {
        sentimentDistribution[sentiment as keyof typeof sentimentDistribution]++;
      }
    });

    // Get top topics
    const topicCounts = new Map<string, number>();
    analytics.forEach(a => {
      (a.topics_discussed || []).forEach((topic: string) => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });
    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get common intents
    const intentCounts = new Map<string, number>();
    analytics.forEach(a => {
      (a.common_intents || []).forEach((intent: string) => {
        intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
      });
    });
    const commonIntents = Array.from(intentCounts.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate AI performance averages
    const aiPerformance = {
      helpfulness: 0,
      accuracy: 0,
      clarity: 0,
    };

    let perfCount = 0;
    analytics.forEach(a => {
      const perf = a.conversation_metadata?.aiPerformance;
      if (perf) {
        aiPerformance.helpfulness += perf.helpfulness || 0;
        aiPerformance.accuracy += perf.accuracy || 0;
        aiPerformance.clarity += perf.clarity || 0;
        perfCount++;
      }
    });

    if (perfCount > 0) {
      aiPerformance.helpfulness /= perfCount;
      aiPerformance.accuracy /= perfCount;
      aiPerformance.clarity /= perfCount;
    }

    return {
      agentType,
      totalConversations,
      avgQualityScore,
      avgResponseTime,
      userSatisfactionScore: avgSatisfaction,
      outcomeDistribution,
      sentimentDistribution,
      topTopics,
      commonIntents,
      aiPerformance,
    };
  }

  /**
   * Calculate performance trends over time
   */
  private async calculatePerformanceTrends(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; agentQuality: number; userQuality: number }>> {
    const trends: Array<{ date: string; agentQuality: number; userQuality: number }> = [];

    // Calculate daily averages
    const { data: agentData } = await this.supabase
      .from('conversation_analytics')
      .select('date, metadata')
      .eq('organization_id', organizationId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Group by date and calculate averages (simplified for now)
    const dateMap = new Map<string, { agent: number; user: number; agentCount: number; userCount: number }>();

    agentData?.forEach(row => {
      if (!dateMap.has(row.date)) {
        dateMap.set(row.date, { agent: 0, user: 0, agentCount: 0, userCount: 0 });
      }
    });

    for (const [date, values] of dateMap.entries()) {
      trends.push({
        date,
        agentQuality: values.agentCount > 0 ? values.agent / values.agentCount : 0,
        userQuality: values.userCount > 0 ? values.user / values.userCount : 0,
      });
    }

    return trends;
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(
    avgAgentQuality: number,
    avgUserQuality: number,
    byAgentType: Record<string, AgentConversationMetrics>
  ): string[] {
    const recommendations: string[] = [];

    // Compare agent vs user quality
    const qualityDiff = avgAgentQuality - avgUserQuality;
    if (qualityDiff > 10) {
      recommendations.push('Agent conversations are performing significantly better than user chats. Consider expanding agent capabilities.');
    } else if (qualityDiff < -10) {
      recommendations.push('User conversations are outperforming agent conversations. Review agent conversation strategies.');
    }

    // Analyze each agent type
    for (const [agentType, metrics] of Object.entries(byAgentType)) {
      if (metrics.avgQualityScore < 50) {
        recommendations.push(`${agentType}: Quality score is low (${metrics.avgQualityScore.toFixed(1)}). Review conversation patterns and improve prompts.`);
      }

      if (metrics.sentimentDistribution.negative > metrics.sentimentDistribution.positive) {
        recommendations.push(`${agentType}: Negative sentiment is higher than positive. Review user feedback and adjust agent behavior.`);
      }

      if (metrics.outcomeDistribution.abandoned > metrics.totalConversations * 0.3) {
        recommendations.push(`${agentType}: High abandonment rate (${((metrics.outcomeDistribution.abandoned / metrics.totalConversations) * 100).toFixed(1)}%). Investigate conversation flow issues.`);
      }

      if (metrics.aiPerformance.helpfulness < 6) {
        recommendations.push(`${agentType}: Low helpfulness score (${metrics.aiPerformance.helpfulness.toFixed(1)}/10). Improve response relevance.`);
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('All agent conversations are performing well. Continue monitoring for optimization opportunities.');
    }

    return recommendations;
  }

  /**
   * Get agent conversation details with analytics
   */
  async getAgentConversationDetails(conversationId: string): Promise<any> {
    try {
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('type', 'agent_proactive')
        .single();

      if (!conversation) {
        return null;
      }

      const { data: analytics } = await this.supabase
        .from('ai_conversation_analytics')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      const { data: messages } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return {
        conversation,
        analytics,
        messages,
      };
    } catch (error) {
      console.error('Error getting agent conversation details:', error);
      return null;
    }
  }
}
