'use client';

import { useState, useEffect } from 'react';
import { Bot, MessageSquare, TrendingUp, TrendingDown, Activity, Brain, Target, ThumbsUp, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AgentConversationDashboardProps {
  className?: string;
  daysBack?: number;
}

export function AgentConversationDashboard({ className, daysBack = 30 }: AgentConversationDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [daysBack]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/agent-conversations?days_back=${daysBack}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-12', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No metrics available</p>
      </div>
    );
  }

  const { overallMetrics, byAgentType, recommendations } = metrics;
  const qualityDiff = overallMetrics.qualityImprovement;

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          Agent-Conversation Intelligence
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Last {daysBack} days
        </span>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Agent Conversations */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Agent Conversations</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {overallMetrics.totalAgentConversations}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {overallMetrics.agentInitiatedPercentage.toFixed(1)}% of total
          </div>
        </div>

        {/* User Conversations */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">User Conversations</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {overallMetrics.totalUserConversations}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {(100 - overallMetrics.agentInitiatedPercentage).toFixed(1)}% of total
          </div>
        </div>

        {/* Agent Quality */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Agent Quality</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {overallMetrics.avgAgentQualityScore.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Out of 100
          </div>
        </div>

        {/* Quality Comparison */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            {qualityDiff >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            )}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">vs User Quality</span>
          </div>
          <div className={cn(
            'text-3xl font-bold',
            qualityDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}>
            {qualityDiff >= 0 ? '+' : ''}{qualityDiff.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            User: {overallMetrics.avgUserQualityScore.toFixed(1)}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            AI Recommendations
          </h3>
          <ul className="space-y-2">
            {recommendations.map((rec: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="flex-shrink-0 w-1.5 h-1.5 bg-purple-600 rounded-full mt-1.5" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Agent Type Breakdown */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance by Agent Type
        </h3>

        <div className="space-y-4">
          {Object.entries(byAgentType).map(([agentType, data]: [string, any]) => (
            <div
              key={agentType}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              onClick={() => setSelectedAgent(selectedAgent === agentType ? null : agentType)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-gray-900 dark:text-white capitalize">
                    {agentType}
                  </h4>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {data.totalConversations} conversations
                  </span>
                  <span className={cn(
                    'font-semibold',
                    data.avgQualityScore >= 70 ? 'text-green-600 dark:text-green-400' :
                    data.avgQualityScore >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {data.avgQualityScore.toFixed(1)} quality
                  </span>
                </div>
              </div>

              {selectedAgent === agentType && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.avgResponseTime.toFixed(0)}ms
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Avg Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {(data.userSatisfactionScore * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Satisfaction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.aiPerformance.helpfulness.toFixed(1)}/10
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Helpfulness</div>
                    </div>
                  </div>

                  {/* Outcome Distribution */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Outcomes</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(data.outcomeDistribution).map(([outcome, count]: [string, any]) => (
                        <div key={outcome} className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">{outcome}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top Topics */}
                  {data.topTopics.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Top Topics</h5>
                      <div className="flex flex-wrap gap-2">
                        {data.topTopics.map((topic: any, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                          >
                            {topic.topic} ({topic.count})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sentiment Distribution */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sentiment</h5>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded p-2 text-center">
                        <div className="text-lg font-bold">{data.sentimentDistribution.positive}</div>
                        <div className="text-xs">Positive</div>
                      </div>
                      <div className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded p-2 text-center">
                        <div className="text-lg font-bold">{data.sentimentDistribution.neutral}</div>
                        <div className="text-xs">Neutral</div>
                      </div>
                      <div className="flex-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded p-2 text-center">
                        <div className="text-lg font-bold">{data.sentimentDistribution.negative}</div>
                        <div className="text-xs">Negative</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
