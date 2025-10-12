'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Droplets,
  Trash2,
  Zap,
  TrendingUp,
  CheckCircle,
  X,
  AlertCircle,
  Info,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

interface MetricRecommendation {
  id: string;
  metric_catalog_id: string;
  priority: 'high' | 'medium' | 'low';
  recommendation_reason: string;
  peer_adoption_percent: number;
  estimated_baseline_value: number;
  estimated_baseline_unit: string;
  estimation_confidence: 'high' | 'medium' | 'low';
  required_for_frameworks: string[];
  gri_disclosure: string;
  metric: {
    id: string;
    name: string;
    code: string;
    category: string;
    scope: string;
    unit: string;
  };
}

interface RecommendedMetricsPanelProps {
  organizationId: string;
  industry?: string;
  region?: string;
  size?: string;
  onMetricAdded?: () => void;
}

const getMetricIcon = (category: string) => {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('water')) return Droplets;
  if (categoryLower.includes('waste')) return Trash2;
  if (categoryLower.includes('energy') || categoryLower.includes('renewable')) return Zap;
  return TrendingUp;
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'from-red-500/20 to-orange-500/20 border-red-500/30';
    case 'medium': return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30';
    case 'low': return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30';
    default: return 'from-gray-500/20 to-gray-500/20 border-gray-500/30';
  }
};

const getPriorityBadgeColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
    case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
    case 'low': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
    default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
  }
};

export function RecommendedMetricsPanel({
  organizationId,
  industry = 'general',
  region = 'EU',
  size = '100-300',
  onMetricAdded
}: RecommendedMetricsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<{
    high: MetricRecommendation[];
    medium: MetricRecommendation[];
    low: MetricRecommendation[];
  }>({ high: [], medium: [], low: [] });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['high']));
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [organizationId, industry, region, size]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        industry,
        region,
        size
      });

      const response = await fetch(`/api/sustainability/recommendations/metrics?${params}`);
      const data = await response.json();

      if (response.ok) {
        setRecommendations(data.recommendations);
      } else {
        console.error('Failed to fetch recommendations:', data.error);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRecommendation = async (recommendationId: string) => {
    try {
      setProcessingId(recommendationId);

      const response = await fetch('/api/sustainability/recommendations/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recommendationId,
          action: 'accept',
          use_estimate: true,
          restate_baseline: false
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from recommendations
        setRecommendations(prev => ({
          high: prev.high.filter(r => r.id !== recommendationId),
          medium: prev.medium.filter(r => r.id !== recommendationId),
          low: prev.low.filter(r => r.id !== recommendationId)
        }));

        if (onMetricAdded) {
          onMetricAdded();
        }
      } else {
        console.error('Failed to accept recommendation:', data.error);
        alert('Failed to accept recommendation. Please try again.');
      }
    } catch (error) {
      console.error('Error accepting recommendation:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismissRecommendation = async (recommendationId: string) => {
    try {
      setProcessingId(recommendationId);

      const response = await fetch('/api/sustainability/recommendations/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendation_id: recommendationId,
          action: 'dismiss',
          dismiss_reason: 'User dismissed'
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from recommendations
        setRecommendations(prev => ({
          high: prev.high.filter(r => r.id !== recommendationId),
          medium: prev.medium.filter(r => r.id !== recommendationId),
          low: prev.low.filter(r => r.id !== recommendationId)
        }));
      } else {
        console.error('Failed to dismiss recommendation:', data.error);
      }
    } catch (error) {
      console.error('Error dismissing recommendation:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSection = (priority: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(priority)) {
        newSet.delete(priority);
      } else {
        newSet.add(priority);
      }
      return newSet;
    });
  };

  const totalRecommendations = recommendations.high.length + recommendations.medium.length + recommendations.low.length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (totalRecommendations === 0) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              You're all caught up!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              You're tracking all recommended metrics for your industry. Great work!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* High Priority */}
      {recommendations.high.length > 0 && (
        <div className={`bg-gradient-to-r ${getPriorityColor('high')} border rounded-xl overflow-hidden`}>
          <button
            onClick={() => toggleSection('high')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                High Priority Metrics ({recommendations.high.length})
              </h3>
            </div>
            {expandedSections.has('high') ? (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('high') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-4 space-y-3"
              >
                {recommendations.high.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    processing={processingId === rec.id}
                    onAccept={() => handleAcceptRecommendation(rec.id)}
                    onDismiss={() => handleDismissRecommendation(rec.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Medium Priority */}
      {recommendations.medium.length > 0 && (
        <div className={`bg-gradient-to-r ${getPriorityColor('medium')} border rounded-xl overflow-hidden`}>
          <button
            onClick={() => toggleSection('medium')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Medium Priority Metrics ({recommendations.medium.length})
              </h3>
            </div>
            {expandedSections.has('medium') ? (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('medium') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-4 space-y-3"
              >
                {recommendations.medium.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    processing={processingId === rec.id}
                    onAccept={() => handleAcceptRecommendation(rec.id)}
                    onDismiss={() => handleDismissRecommendation(rec.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Low Priority */}
      {recommendations.low.length > 0 && (
        <div className={`bg-gradient-to-r ${getPriorityColor('low')} border rounded-xl overflow-hidden`}>
          <button
            onClick={() => toggleSection('low')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Optional Metrics ({recommendations.low.length})
              </h3>
            </div>
            {expandedSections.has('low') ? (
              <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.has('low') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-4 space-y-3"
              >
                {recommendations.low.map((rec) => (
                  <RecommendationCard
                    key={rec.id}
                    recommendation={rec}
                    processing={processingId === rec.id}
                    onAccept={() => handleAcceptRecommendation(rec.id)}
                    onDismiss={() => handleDismissRecommendation(rec.id)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: MetricRecommendation;
  processing: boolean;
  onAccept: () => void;
  onDismiss: () => void;
}

function RecommendationCard({ recommendation, processing, onAccept, onDismiss }: RecommendationCardProps) {
  const Icon = getMetricIcon(recommendation.metric.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-white dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {recommendation.metric.name}
              </h4>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityBadgeColor(recommendation.priority)}`}>
                {recommendation.priority.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {recommendation.recommendation_reason}
            </p>

            {/* Peer adoption */}
            {recommendation.peer_adoption_percent && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <TrendingUp className="w-3 h-3" />
                <span>Tracked by {recommendation.peer_adoption_percent.toFixed(0)}% of peers</span>
              </div>
            )}

            {/* Estimated baseline */}
            {recommendation.estimated_baseline_value && (
              <div className="flex items-center gap-2 text-xs bg-gray-50 dark:bg-gray-900/30 rounded px-2 py-1 mb-2">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-gray-700 dark:text-gray-300">
                  Estimated baseline: {recommendation.estimated_baseline_value.toFixed(1)} {recommendation.estimated_baseline_unit}
                </span>
                <span className="text-gray-500">
                  (Confidence: {recommendation.estimation_confidence})
                </span>
              </div>
            )}

            {/* Compliance frameworks */}
            {recommendation.required_for_frameworks && recommendation.required_for_frameworks.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {recommendation.required_for_frameworks.map((fw: string) => (
                  <span key={fw} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                    {fw.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onDismiss}
          disabled={processing}
          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
        >
          Dismiss
        </button>
        <button
          onClick={onAccept}
          disabled={processing}
          className="px-4 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              <span>Start Tracking</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
