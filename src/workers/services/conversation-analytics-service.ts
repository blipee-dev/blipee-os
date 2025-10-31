/**
 * Conversation Analytics Service
 *
 * Aggregates conversation metrics daily for analytics dashboards.
 * Part of FASE 2 - Conversation Intelligence
 *
 * Features:
 * - Daily aggregation of conversation metrics
 * - Topic extraction from conversations
 * - Sentiment analysis aggregation
 * - AI provider usage tracking
 * - Response time metrics
 * - User satisfaction scoring
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface AnalyticsMetrics {
  organizationId: string;
  userId: string;
  date: string;
  totalConversations: number;
  totalMessages: number;
  avgConversationLength: number;
  topTopics: string[];
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  aiProviderUsage: {
    [provider: string]: number;
  };
  responseTimes: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
  };
  userSatisfactionScore?: number;
}

export class ConversationAnalyticsService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Run daily analytics aggregation
   * Should be called by cron job once per day
   */
  async run(): Promise<void> {
    console.log('📊 Starting conversation analytics aggregation...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      // Get all organizations
      const { data: orgs } = await this.supabase
        .from('organizations')
        .select('id');

      if (!orgs || orgs.length === 0) {
        console.log('No organizations found');
        return;
      }

      let aggregatedCount = 0;

      for (const org of orgs) {
        // Get all users in this organization
        const { data: members } = await this.supabase
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', org.id);

        if (!members || members.length === 0) continue;

        for (const member of members) {
          const metrics = await this.aggregateUserMetrics(
            org.id,
            member.user_id,
            dateStr
          );

          if (metrics) {
            await this.saveMetrics(metrics);
            aggregatedCount++;
          }
        }
      }

      console.log(`✅ Aggregated analytics for ${aggregatedCount} user-days`);
    } catch (error) {
      console.error('❌ Error in analytics aggregation:', error);
      throw error;
    }
  }

  /**
   * Aggregate metrics for a specific user on a specific date
   */
  private async aggregateUserMetrics(
    organizationId: string,
    userId: string,
    date: string
  ): Promise<AnalyticsMetrics | null> {
    try {
      const startOfDay = new Date(date);
      const endOfDay = new Date(date);
      endOfDay.setDate(endOfDay.getDate() + 1);

      // Get conversations for this user on this date
      const { data: conversations } = await this.supabase
        .from('conversations')
        .select('id, model, created_at, metadata')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .gte('created_at', startOfDay.toISOString())
        .lt('created_at', endOfDay.toISOString());

      if (!conversations || conversations.length === 0) {
        return null; // No conversations on this date
      }

      const conversationIds = conversations.map(c => c.id);

      // Get all messages for these conversations
      const { data: messages } = await this.supabase
        .from('messages')
        .select('id, role, model, created_at, metadata')
        .in('conversation_id', conversationIds);

      const totalConversations = conversations.length;
      const totalMessages = messages?.length || 0;
      const avgConversationLength = totalMessages / totalConversations;

      // Extract topics from conversation contexts
      const { data: contexts } = await this.supabase
        .from('conversation_contexts')
        .select('context_data')
        .in('conversation_id', conversationIds);

      const topTopics = this.extractTopTopics(contexts || []);

      // Calculate sentiment distribution from feedback
      const { data: feedbacks } = await this.supabase
        .from('conversation_feedback')
        .select('feedback_type, feedback_value')
        .in('conversation_id', conversationIds);

      const sentimentDistribution = this.calculateSentimentDistribution(feedbacks || []);

      // Track AI provider usage
      const aiProviderUsage = this.calculateProviderUsage(messages || []);

      // Calculate response times (time between user message and assistant response)
      const responseTimes = this.calculateResponseTimes(messages || []);

      // Calculate user satisfaction from feedback
      const userSatisfactionScore = this.calculateSatisfactionScore(feedbacks || []);

      return {
        organizationId,
        userId,
        date,
        totalConversations,
        totalMessages,
        avgConversationLength,
        topTopics,
        sentimentDistribution,
        aiProviderUsage,
        responseTimes,
        userSatisfactionScore,
      };
    } catch (error) {
      console.error(`Error aggregating metrics for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Save metrics to conversation_analytics table
   */
  private async saveMetrics(metrics: AnalyticsMetrics): Promise<void> {
    try {
      await this.supabase
        .from('conversation_analytics')
        .upsert({
          organization_id: metrics.organizationId,
          user_id: metrics.userId,
          date: metrics.date,
          total_conversations: metrics.totalConversations,
          total_messages: metrics.totalMessages,
          avg_conversation_length: metrics.avgConversationLength,
          top_topics: metrics.topTopics,
          sentiment_distribution: metrics.sentimentDistribution,
          ai_provider_usage: metrics.aiProviderUsage,
          response_times: metrics.responseTimes,
          user_satisfaction_score: metrics.userSatisfactionScore,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'organization_id,user_id,date'
        });
    } catch (error) {
      console.error('Error saving metrics:', error);
      throw error;
    }
  }

  /**
   * Extract top topics from conversation contexts
   */
  private extractTopTopics(contexts: any[]): string[] {
    const topicCounts = new Map<string, number>();

    for (const context of contexts) {
      const topic = context.context_data?.current_topic;
      if (topic) {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      }
    }

    // Return top 5 topics by frequency
    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  /**
   * Calculate sentiment distribution from feedback
   */
  private calculateSentimentDistribution(feedbacks: any[]): {
    positive: number;
    neutral: number;
    negative: number;
  } {
    let positive = 0;
    let negative = 0;
    let neutral = 0;

    for (const feedback of feedbacks) {
      if (feedback.feedback_type === 'thumbs_up') {
        positive++;
      } else if (feedback.feedback_type === 'thumbs_down') {
        negative++;
      } else {
        neutral++;
      }
    }

    const total = positive + negative + neutral || 1;

    return {
      positive: positive / total,
      neutral: neutral / total,
      negative: negative / total,
    };
  }

  /**
   * Calculate AI provider usage
   */
  private calculateProviderUsage(messages: any[]): { [provider: string]: number } {
    const providerCounts = new Map<string, number>();

    for (const message of messages) {
      if (message.role === 'assistant' && message.model) {
        const provider = this.extractProvider(message.model);
        providerCounts.set(provider, (providerCounts.get(provider) || 0) + 1);
      }
    }

    return Object.fromEntries(providerCounts);
  }

  /**
   * Extract provider from model name
   */
  private extractProvider(model: string): string {
    if (model.startsWith('gpt-')) return 'openai';
    if (model.startsWith('claude')) return 'anthropic';
    if (model.includes('gemini')) return 'google';
    return 'other';
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimes(messages: any[]): {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
  } {
    const responseTimes: number[] = [];

    // Sort messages by timestamp
    const sortedMessages = messages.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Calculate time between user message and next assistant message
    for (let i = 0; i < sortedMessages.length - 1; i++) {
      if (sortedMessages[i].role === 'user' && sortedMessages[i + 1].role === 'assistant') {
        const userTime = new Date(sortedMessages[i].created_at).getTime();
        const assistantTime = new Date(sortedMessages[i + 1].created_at).getTime();
        const responseTime = (assistantTime - userTime) / 1000; // Convert to seconds
        responseTimes.push(responseTime);
      }
    }

    if (responseTimes.length === 0) {
      return { avg: 0, min: 0, max: 0, p50: 0, p95: 0 };
    }

    responseTimes.sort((a, b) => a - b);

    const avg = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
    const min = responseTimes[0];
    const max = responseTimes[responseTimes.length - 1];
    const p50 = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95 = responseTimes[Math.floor(responseTimes.length * 0.95)];

    return { avg, min, max, p50, p95 };
  }

  /**
   * Calculate user satisfaction score from feedback
   */
  private calculateSatisfactionScore(feedbacks: any[]): number | undefined {
    if (feedbacks.length === 0) return undefined;

    let totalScore = 0;

    for (const feedback of feedbacks) {
      if (feedback.feedback_type === 'thumbs_up') {
        totalScore += 1;
      } else if (feedback.feedback_type === 'thumbs_down') {
        totalScore += 0;
      } else if (feedback.feedback_type === 'rating' && feedback.feedback_value?.rating) {
        totalScore += feedback.feedback_value.rating / 5; // Normalize to 0-1
      }
    }

    return totalScore / feedbacks.length;
  }

  /**
   * Get analytics for a user within a date range
   */
  async getUserAnalytics(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching user analytics:', error);
        return [];
      }

      return (data || []).map(row => ({
        organizationId: row.organization_id,
        userId: row.user_id,
        date: row.date,
        totalConversations: row.total_conversations,
        totalMessages: row.total_messages,
        avgConversationLength: row.avg_conversation_length,
        topTopics: row.top_topics,
        sentimentDistribution: row.sentiment_distribution,
        aiProviderUsage: row.ai_provider_usage,
        responseTimes: row.response_times,
        userSatisfactionScore: row.user_satisfaction_score,
      }));
    } catch (error) {
      console.error('Error in getUserAnalytics:', error);
      return [];
    }
  }

  /**
   * Get organization-wide analytics
   */
  async getOrganizationAnalytics(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<AnalyticsMetrics[]> {
    try {
      const { data, error } = await this.supabase
        .from('conversation_analytics')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (error) {
        console.error('Error fetching organization analytics:', error);
        return [];
      }

      return (data || []).map(row => ({
        organizationId: row.organization_id,
        userId: row.user_id,
        date: row.date,
        totalConversations: row.total_conversations,
        totalMessages: row.total_messages,
        avgConversationLength: row.avg_conversation_length,
        topTopics: row.top_topics,
        sentimentDistribution: row.sentiment_distribution,
        aiProviderUsage: row.ai_provider_usage,
        responseTimes: row.response_times,
        userSatisfactionScore: row.user_satisfaction_score,
      }));
    } catch (error) {
      console.error('Error in getOrganizationAnalytics:', error);
      return [];
    }
  }
}
