'use client';

import { useState, useEffect } from 'react';
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus, Target, Lightbulb, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MLConversationAssistantProps {
  conversationId: string;
  onReplySelect?: (reply: string) => void;
  className?: string;
}

export function MLConversationAssistant({
  conversationId,
  onReplySelect,
  className
}: MLConversationAssistantProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState({
    smartReplies: true,
    quality: true,
    forecasts: true,
  });

  useEffect(() => {
    loadMLFeatures();
  }, [conversationId]);

  const loadMLFeatures = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/integrations/ml-conversation?conversation_id=${conversationId}&feature=all`
      );
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error loading ML features:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'answer': return <Target className="w-4 h-4" />;
      case 'clarification': return <Lightbulb className="w-4 h-4" />;
      case 'followup': return <Zap className="w-4 h-4" />;
      case 'data_insight': return <Brain className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'answer': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'clarification': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'followup': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30';
      case 'data_insight': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { smartReplies, qualityPrediction, forecastInsights } = data;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Smart Replies */}
      {smartReplies && smartReplies.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('smartReplies')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Smart Reply Suggestions
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({smartReplies.length})
              </span>
            </div>
            {expandedSections.smartReplies ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.smartReplies && (
            <div className="p-4 pt-0 space-y-3">
              {smartReplies.map((reply: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                  onClick={() => onReplySelect && onReplySelect(reply.text)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                      getCategoryColor(reply.category)
                    )}>
                      {getCategoryIcon(reply.category)}
                      {reply.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {(reply.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 dark:text-white mb-2">
                    {reply.text}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                    {reply.reasoning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quality Prediction */}
      {qualityPrediction && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('quality')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Quality Prediction
              </h3>
              <span className={cn(
                'text-sm font-bold px-2 py-0.5 rounded',
                qualityPrediction.predictedQuality >= 70 ? 'text-green-600 bg-green-100 dark:bg-green-900/30' :
                qualityPrediction.predictedQuality >= 50 ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' :
                'text-red-600 bg-red-100 dark:bg-red-900/30'
              )}>
                {qualityPrediction.predictedQuality.toFixed(0)}/100
              </span>
            </div>
            {expandedSections.quality ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.quality && (
            <div className="p-4 pt-0 space-y-3">
              {/* Confidence */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Prediction confidence: {(qualityPrediction.confidence * 100).toFixed(0)}%
              </div>

              {/* Factors */}
              {qualityPrediction.factors && qualityPrediction.factors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contributing Factors
                  </h4>
                  <div className="space-y-2">
                    {qualityPrediction.factors.map((factor: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          factor.impact === 'positive' ? 'bg-green-500' :
                          factor.impact === 'negative' ? 'bg-red-500' :
                          'bg-gray-400'
                        )} />
                        <span className="text-gray-700 dark:text-gray-300">{factor.factor}</span>
                        {factor.weight !== 0 && (
                          <span className={cn(
                            'text-xs ml-auto',
                            factor.weight > 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {factor.weight > 0 ? '+' : ''}{(factor.weight * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {qualityPrediction.recommendations && qualityPrediction.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommendations
                  </h4>
                  <ul className="space-y-1">
                    {qualityPrediction.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex-shrink-0 w-1 h-1 bg-blue-600 rounded-full mt-1.5" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Forecast Insights */}
      {forecastInsights && forecastInsights.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('forecasts')}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Forecast Insights
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                ({forecastInsights.length})
              </span>
            </div>
            {expandedSections.forecasts ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedSections.forecasts && (
            <div className="p-4 pt-0 space-y-3">
              {forecastInsights.map((insight: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTrendIcon(insight.trend)}
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {insight.metricType}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {insight.timeframe}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-2 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Current:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {insight.currentValue.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Predicted:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">
                        {insight.predictedValue.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {insight.recommendation}
                  </p>
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    Confidence: {(insight.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
