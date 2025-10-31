'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Brain, Lightbulb, Target, TrendingUp, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightsData {
  conversationId: string;
  messageCount: number;
  avgResponseTimeMs: number;
  userSatisfactionScore?: number;
  topicsDiscussed: string[];
  commonIntents: string[];
  conversationMetadata: {
    summary: string;
    qualityScore: number;
    keyInsights: string[];
    actionableItems?: string[];
    conversationOutcome?: 'resolved' | 'escalated' | 'ongoing' | 'abandoned';
    userSentiment?: 'positive' | 'neutral' | 'negative';
    aiPerformance?: {
      helpfulness: number;
      accuracy: number;
      clarity: number;
    };
  };
}

interface ConversationAIInsightsProps {
  conversationId: string;
  className?: string;
}

export function ConversationAIInsights({ conversationId, className }: ConversationAIInsightsProps) {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<AIInsightsData | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadInsights();
  }, [conversationId]);

  const loadInsights = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('ai_conversation_analytics')
        .select('*')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error || !data) {
        setInsights(null);
      } else {
        setInsights({
          conversationId: data.conversation_id,
          messageCount: data.message_count,
          avgResponseTimeMs: data.avg_response_time_ms,
          userSatisfactionScore: data.user_satisfaction_score,
          topicsDiscussed: data.topics_discussed || [],
          commonIntents: data.common_intents || [],
          conversationMetadata: data.conversation_metadata || {},
        });
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeIcon = (outcome?: string) => {
    switch (outcome) {
      case 'resolved':
        return <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'escalated':
        return <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'ongoing':
        return <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30';
      case 'negative':
        return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 8) return 'text-green-700 dark:text-green-300';
    if (score >= 6) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-red-700 dark:text-red-300';
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <Brain className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No AI Insights Yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          AI analysis will be generated after the conversation ends.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          AI Insights
        </h2>
        <div className="flex items-center gap-2">
          {getOutcomeIcon(insights.conversationMetadata.conversationOutcome)}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
            {insights.conversationMetadata.conversationOutcome || 'ongoing'}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Summary</h3>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
          {insights.conversationMetadata.summary}
        </p>
      </div>

      {/* Quality & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quality Score */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Quality Score</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {insights.conversationMetadata.qualityScore}/100
          </div>
        </div>

        {/* Message Count */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Messages</div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {insights.messageCount}
          </div>
        </div>

        {/* Sentiment */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sentiment</div>
          <div className={cn("text-lg font-semibold capitalize px-3 py-1 rounded-full inline-block", getSentimentColor(insights.conversationMetadata.userSentiment))}>
            {insights.conversationMetadata.userSentiment || 'neutral'}
          </div>
        </div>
      </div>

      {/* Topics & Intents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Topics */}
        {insights.topicsDiscussed.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Topics Discussed
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.topicsDiscussed.map((topic, index) => (
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

        {/* Intents */}
        {insights.commonIntents.length > 0 && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              User Intents
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.commonIntents.map((intent, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
                >
                  {intent}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Key Insights */}
      {insights.conversationMetadata.keyInsights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            Key Insights
          </h3>
          <ul className="space-y-2">
            {insights.conversationMetadata.keyInsights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-yellow-600 dark:text-yellow-400 rounded-full mt-2" />
                <span className="text-gray-700 dark:text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actionable Items */}
      {insights.conversationMetadata.actionableItems && insights.conversationMetadata.actionableItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            Action Items
          </h3>
          <ul className="space-y-2">
            {insights.conversationMetadata.actionableItems.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <input type="checkbox" className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                <span className="text-gray-700 dark:text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AI Performance */}
      {insights.conversationMetadata.aiPerformance && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className={cn("text-3xl font-bold mb-1", getPerformanceColor(insights.conversationMetadata.aiPerformance.helpfulness))}>
                {insights.conversationMetadata.aiPerformance.helpfulness.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Helpfulness</div>
            </div>
            <div className="text-center">
              <div className={cn("text-3xl font-bold mb-1", getPerformanceColor(insights.conversationMetadata.aiPerformance.accuracy))}>
                {insights.conversationMetadata.aiPerformance.accuracy.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
            </div>
            <div className="text-center">
              <div className={cn("text-3xl font-bold mb-1", getPerformanceColor(insights.conversationMetadata.aiPerformance.clarity))}>
                {insights.conversationMetadata.aiPerformance.clarity.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Clarity</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
