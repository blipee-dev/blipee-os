'use client';

import { useState, useEffect } from 'react';
import { Activity, Bot, Brain, MessageSquare, TrendingUp, DollarSign, CheckCircle, AlertCircle, Zap, Target, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UnifiedDashboardProps {
  className?: string;
  daysBack?: number;
}

export function UnifiedDashboard({ className, daysBack = 30 }: UnifiedDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    loadMetrics();
  }, [daysBack]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/integrations/unified-analytics?days_back=${daysBack}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Error loading unified metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-12', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={cn('text-center py-12', className)}>
        <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No data available</p>
      </div>
    );
  }

  const { agents, mlModels, conversations, insights, recommendations } = metrics;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      default: return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={cn('space-y-6 p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            Mission Control
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Unified view across Agents, ML, and Conversations
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600 dark:text-gray-400">Last {daysBack} days</div>
          <div className={cn(
            'text-2xl font-bold mt-1',
            insights.systemEfficiency >= 70 ? 'text-green-600' :
            insights.systemEfficiency >= 50 ? 'text-yellow-600' :
            'text-red-600'
          )}>
            {insights.systemEfficiency.toFixed(0)}% Efficient
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Agents */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Autonomous Agents</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {agents.totalExecutions}
              </div>
              <div className="text-xs text-blue-700 dark:text-blue-300">Total Executions</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">Success Rate</span>
              <span className="font-bold text-blue-900 dark:text-blue-100">
                {agents.successRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 dark:text-blue-300">Savings ID'd</span>
              <span className="font-bold text-green-600 dark:text-green-400">
                ${(agents.totalSavingsIdentified / 1000).toFixed(1)}K
              </span>
            </div>
          </div>
        </div>

        {/* ML Models */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-300">ML Models</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                {mlModels.totalPredictions}
              </div>
              <div className="text-xs text-purple-700 dark:text-purple-300">Predictions Made</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-700 dark:text-purple-300">Confidence</span>
              <span className="font-bold text-purple-900 dark:text-purple-100">
                {(mlModels.avgConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-700 dark:text-purple-300">Prophet Models</span>
              <span className="font-bold text-purple-900 dark:text-purple-100">
                {mlModels.activeProphetModels}
              </span>
            </div>
          </div>
        </div>

        {/* Conversations */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-300">Conversations</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                {conversations.totalConversations}
              </div>
              <div className="text-xs text-green-700 dark:text-green-300">Total Conversations</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Quality Score</span>
              <span className="font-bold text-green-900 dark:text-green-100">
                {conversations.avgQualityScore.toFixed(0)}/100
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Agent/User</span>
              <span className="font-bold text-green-900 dark:text-green-100">
                {conversations.agentInitiated}/{conversations.userInitiated}
              </span>
            </div>
          </div>
        </div>

        {/* ROI */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-300">Total ROI</span>
          </div>
          <div className="space-y-2">
            <div>
              <div className={cn(
                'text-3xl font-bold',
                insights.totalROI >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                ${(insights.totalROI / 1000).toFixed(1)}K
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300">Savings - Costs</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-700 dark:text-yellow-300">ML Enhanced</span>
              <span className="font-bold text-yellow-900 dark:text-yellow-100">
                {insights.mlEnhancedConversations}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-yellow-700 dark:text-yellow-300">Quality Diff</span>
              <span className={cn(
                'font-bold',
                insights.agentConversationQualityDiff >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {insights.agentConversationQualityDiff >= 0 ? '+' : ''}{insights.agentConversationQualityDiff.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            AI Recommendations
          </h2>
          <div className="grid gap-3">
            {recommendations.map((rec: any, index: number) => (
              <div
                key={index}
                className={cn(
                  'border-l-4 rounded-lg p-4',
                  getPriorityColor(rec.priority)
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {rec.priority === 'high' && <AlertCircle className="w-5 h-5 text-red-600" />}
                    {rec.priority === 'medium' && <Zap className="w-5 h-5 text-yellow-600" />}
                    {rec.priority === 'low' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    <h3 className="font-semibold text-gray-900 dark:text-white">{rec.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium capitalize">
                      {rec.category}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full font-medium capitalize',
                      rec.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                      rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    )}>
                      {rec.priority}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{rec.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>Estimated Impact: {rec.estimatedImpact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Agents */}
      {agents.topPerformingAgents && agents.topPerformingAgents.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Top Performing Agents
          </h2>
          <div className="space-y-3">
            {agents.topPerformingAgents.map((agent: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full font-bold text-sm">
                    #{index + 1}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {agent.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {agent.executions} runs
                  </span>
                  <span className={cn(
                    'font-bold',
                    agent.successRate >= 80 ? 'text-green-600 dark:text-green-400' :
                    agent.successRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {agent.successRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Topics */}
      {conversations.topTopics && conversations.topTopics.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            Trending Conversation Topics
          </h2>
          <div className="flex flex-wrap gap-2">
            {conversations.topTopics.map((topic: any, index: number) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
              >
                {topic.topic} ({topic.count})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
