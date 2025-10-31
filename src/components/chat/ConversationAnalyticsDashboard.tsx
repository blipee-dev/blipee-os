'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, TrendingUp, Clock, ThumbsUp, Loader2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsData {
  date: string;
  total_conversations: number;
  total_messages: number;
  avg_conversation_length: number;
  top_topics: string[];
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  ai_provider_usage: {
    [provider: string]: number;
  };
  response_times: {
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
  };
  user_satisfaction_score?: number;
}

interface ConversationAnalyticsDashboardProps {
  userId: string;
  organizationId: string;
  scope?: 'user' | 'organization'; // Show user-specific or org-wide analytics
  className?: string;
}

export function ConversationAnalyticsDashboard({
  userId,
  organizationId,
  scope = 'user',
  className
}: ConversationAnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  const supabase = createClient();

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
  }, [userId, organizationId, scope, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90));

      let query = supabase
        .from('conversation_analytics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (scope === 'user') {
        query = query.eq('user_id', userId);
      } else {
        query = query.eq('organization_id', organizationId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading analytics:', error);
        setAnalytics([]);
      } else {
        setAnalytics(data || []);
      }
    } catch (error) {
      console.error('Error in loadAnalytics:', error);
      setAnalytics([]);
    } finally {
      setLoading(false);
    }
  };

  // Aggregate metrics across all days
  const getTotals = () => {
    if (analytics.length === 0) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        avgConversationLength: 0,
        avgResponseTime: 0,
        avgSatisfaction: 0,
      };
    }

    const total = analytics.reduce(
      (acc, day) => ({
        conversations: acc.conversations + day.total_conversations,
        messages: acc.messages + day.total_messages,
        responseTimeSum: acc.responseTimeSum + (day.response_times?.avg || 0),
        satisfactionSum: acc.satisfactionSum + (day.user_satisfaction_score || 0),
        satisfactionCount: acc.satisfactionCount + (day.user_satisfaction_score ? 1 : 0),
      }),
      { conversations: 0, messages: 0, responseTimeSum: 0, satisfactionSum: 0, satisfactionCount: 0 }
    );

    return {
      totalConversations: total.conversations,
      totalMessages: total.messages,
      avgConversationLength: total.messages / total.conversations || 0,
      avgResponseTime: total.responseTimeSum / analytics.length || 0,
      avgSatisfaction: total.satisfactionSum / total.satisfactionCount || 0,
    };
  };

  // Get top topics across all days
  const getTopTopics = (): string[] => {
    const topicCounts = new Map<string, number>();

    analytics.forEach(day => {
      day.top_topics?.forEach(topic => {
        topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
      });
    });

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  };

  // Get overall sentiment distribution
  const getOverallSentiment = () => {
    if (analytics.length === 0) {
      return { positive: 0, neutral: 0, negative: 0 };
    }

    const total = analytics.reduce(
      (acc, day) => ({
        positive: acc.positive + (day.sentiment_distribution?.positive || 0),
        neutral: acc.neutral + (day.sentiment_distribution?.neutral || 0),
        negative: acc.negative + (day.sentiment_distribution?.negative || 0),
      }),
      { positive: 0, neutral: 0, negative: 0 }
    );

    const sum = total.positive + total.neutral + total.negative || 1;

    return {
      positive: (total.positive / sum) * 100,
      neutral: (total.neutral / sum) * 100,
      negative: (total.negative / sum) * 100,
    };
  };

  const totals = getTotals();
  const topTopics = getTopTopics();
  const sentiment = getOverallSentiment();

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-12", className)}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (analytics.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
        <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Analytics Data Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Start having conversations and analytics will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header with date range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          {scope === 'user' ? 'My Analytics' : 'Organization Analytics'}
        </h2>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                dateRange === range
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              )}
            >
              {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
            </button>
          ))}
        </div>
      </div>

      {/* Key metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Conversations */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversations</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totals.totalConversations}
          </div>
        </div>

        {/* Total Messages */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Messages</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totals.totalMessages}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {totals.avgConversationLength.toFixed(1)} avg per conversation
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totals.avgResponseTime.toFixed(1)}s
          </div>
        </div>

        {/* Satisfaction Score */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ThumbsUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {(totals.avgSatisfaction * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Top Topics */}
      {topTopics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Topics</h3>
          <div className="flex flex-wrap gap-2">
            {topTopics.map((topic, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sentiment Distribution */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sentiment Distribution</h3>
        <div className="space-y-3">
          {/* Positive */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Positive</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sentiment.positive.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${sentiment.positive}%` }}
              />
            </div>
          </div>

          {/* Neutral */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Neutral</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sentiment.neutral.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full transition-all"
                style={{ width: `${sentiment.neutral}%` }}
              />
            </div>
          </div>

          {/* Negative */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Negative</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {sentiment.negative.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all"
                style={{ width: `${sentiment.negative}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
