'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle,
  Plus,
  TrendingUp,
  Activity
} from 'lucide-react';
import { RecommendationsModal } from './RecommendationsModal';

interface MetricTarget {
  id: string;
  metricId: string;
  metricCode: string;
  metricName: string;
  category: string;
  scope: string;
  unit: string;
  baselineValue: number;
  baselineEmissions: number;
  targetValue: number;
  targetEmissions: number;
  currentValue: number;
  currentEmissions: number;
  progress: {
    totalPlannedEmissions: number;
    totalActualEmissions: number;
    reductionNeeded: number;
    reductionAchieved: number;
    progressPercent: number;
    trajectoryStatus: 'on-track' | 'at-risk' | 'off-track';
  };
  monthlyData: Array<{
    year: number;
    month: number;
    targetEmissions: number;
    actualEmissions: number | null;
    variance: number;
    variancePercent: number;
  }>;
}

interface MetricTargetsCardProps {
  organizationId: string;
  targetId: string;
  categories: string[];
  title?: string;
}

export function MetricTargetsCard({
  organizationId,
  targetId,
  categories,
  title = 'Replanning Metric Targets'
}: MetricTargetsCardProps) {
  const [metricTargets, setMetricTargets] = useState<MetricTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  useEffect(() => {
    fetchMetricTargets();
  }, [organizationId, targetId, categories]);

  const fetchMetricTargets = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoriesParam = categories.join(',');
      const response = await fetch(
        `/api/sustainability/targets/by-category?organizationId=${organizationId}&targetId=${targetId}&categories=${categoriesParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch metric targets');
      }

      const result = await response.json();
      if (result.success) {
        setMetricTargets(result.data || []);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error fetching metric targets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: 'on-track' | 'at-risk' | 'off-track') => {
    switch (status) {
      case 'on-track':
        return 'text-green-500';
      case 'at-risk':
        return 'text-yellow-500';
      case 'off-track':
        return 'text-red-500';
    }
  };

  const getStatusIcon = (status: 'on-track' | 'at-risk' | 'off-track') => {
    switch (status) {
      case 'on-track':
        return <CheckCircle className="h-5 w-5" />;
      case 'at-risk':
        return <AlertCircle className="h-5 w-5" />;
      case 'off-track':
        return <TrendingUp className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: 'on-track' | 'at-risk' | 'off-track') => {
    switch (status) {
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'off-track':
        return 'Off Track';
    }
  };

  if (loading) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/5 rounded w-1/4"></div>
          <div className="h-32 bg-white/5 rounded"></div>
          <div className="h-32 bg-white/5 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <p>Error loading metric targets: {error}</p>
        </div>
      </div>
    );
  }

  if (metricTargets.length === 0) {
    return null; // Don't show card if no targets
  }

  return (
    <>
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <div className="text-sm text-gray-400">
            {metricTargets.length} active target{metricTargets.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="space-y-4">
          {metricTargets.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-white">{metric.metricName}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
                      {metric.scope}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{metric.category}</p>
                </div>

                <div className={`flex items-center gap-2 ${getStatusColor(metric.progress.trajectoryStatus)}`}>
                  {getStatusIcon(metric.progress.trajectoryStatus)}
                  <span className="text-sm font-medium">
                    {getStatusText(metric.progress.trajectoryStatus)}
                  </span>
                </div>
              </div>

              {/* Emissions Targets */}
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Baseline Emissions</div>
                  <div className="text-lg font-bold text-gray-300">
                    {metric.baselineEmissions?.toFixed(1) || '0.0'}
                    <span className="text-xs ml-1 text-gray-500">tCO2e</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Target Emissions</div>
                  <div className="text-lg font-bold text-purple-400">
                    {metric.targetEmissions?.toFixed(1) || '0.0'}
                    <span className="text-xs ml-1 text-gray-500">tCO2e</span>
                  </div>
                </div>
              </div>

              {/* Activity Targets */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Baseline Activity</div>
                  <div className="text-sm font-medium text-gray-400">
                    {metric.baselineValue?.toLocaleString() || '0'}
                    {metric.unit && <span className="text-xs ml-1 text-gray-500">{metric.unit}</span>}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Target Activity</div>
                  <div className="text-sm font-medium text-purple-300">
                    {metric.targetValue?.toLocaleString() || '0'}
                    {metric.unit && <span className="text-xs ml-1 text-gray-500">{metric.unit}</span>}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500">Reduction Progress</span>
                  <span className="text-gray-400 font-medium">
                    {metric.progress.progressPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, metric.progress.progressPercent)}%` }}
                    transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                    className={`h-full rounded-full ${
                      metric.progress.trajectoryStatus === 'on-track'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                        : metric.progress.trajectoryStatus === 'at-risk'
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                        : 'bg-gradient-to-r from-red-500 to-orange-400'
                    }`}
                  />
                </div>
              </div>

              {/* Reduction Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-400" />
                  <div>
                    <div className="text-gray-500">Reduction Needed</div>
                    <div className="font-medium text-gray-300">
                      {metric.progress.reductionNeeded.toFixed(1)} tCO2e
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-400" />
                  <div>
                    <div className="text-gray-500">Achieved So Far</div>
                    <div className="font-medium text-gray-300">
                      {metric.progress.reductionAchieved.toFixed(1)} tCO2e
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Initiative Button */}
              <button
                onClick={() => setSelectedMetricForInitiative(metric.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-300 text-sm font-medium transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Initiative
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recommendations Modal */}
      {selectedMetricForInitiative && (
        <RecommendationsModal
          isOpen={true}
          onClose={() => setSelectedMetricForInitiative(null)}
          organizationId={organizationId}
          metricTarget={metricTargets.find(mt => mt.id === selectedMetricForInitiative)}
          onSave={async (initiative) => {
            // TODO: Implement initiative saving logic
            setSelectedMetricForInitiative(null);
          }}
        />
      )}
    </>
  );
}
