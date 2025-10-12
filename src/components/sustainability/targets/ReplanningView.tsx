'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  Clock,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';

interface MetricTarget {
  id: string;
  metric_id: string;
  metric_name: string;
  metric_code: string;
  scope: string;
  category: string;
  unit: string;
  baseline_value: number;
  baseline_emissions: number;
  target_value: number;
  target_emissions: number;
  reduction_percent: number;
  strategy_type: string;
  confidence_level: string;
  created_at: string;
}

interface MonthlyTarget {
  id: string;
  metric_target_id: string;
  year: number;
  month: number;
  planned_value: number;
  planned_emissions: number;
  actual_value?: number;
  actual_emissions?: number;
}

interface Initiative {
  id: string;
  metric_target_id: string;
  initiative_name: string;
  description: string;
  estimated_cost: number;
  estimated_impact: number;
  implementation_timeline: string;
  status: string;
}

interface ReplanningHistory {
  id: string;
  target_id: string;
  previous_target: number;
  new_target: number;
  strategy: string;
  trigger: string;
  created_at: string;
  created_by?: string;
  notes?: string;
  metric_targets_count: number;
  initiatives_count: number;
}

interface ReplanningViewProps {
  organizationId: string;
  targetId?: string;
}

// Helper function to format scope labels
const formatScope = (scope: string): string => {
  if (!scope) return '';
  // Convert scope_1 -> Scope 1, scope_2 -> Scope 2, scope_3 -> Scope 3
  return scope.replace(/scope_(\d+)/i, 'Scope $1').replace(/scope(\d+)/i, 'Scope $1');
};

export function ReplanningView({ organizationId, targetId }: ReplanningViewProps) {
  const [loading, setLoading] = useState(true);
  const [metricTargets, setMetricTargets] = useState<MetricTarget[]>([]);
  const [monthlyData, setMonthlyData] = useState<Record<string, MonthlyTarget[]>>({});
  const [initiatives, setInitiatives] = useState<Record<string, Initiative[]>>({});
  const [history, setHistory] = useState<ReplanningHistory[]>([]);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<'metrics' | 'timeline' | 'initiatives' | 'history'>('metrics');

  useEffect(() => {
    if (targetId) {
      fetchReplanningData();
    }
  }, [targetId, organizationId]);

  const fetchReplanningData = async () => {
    try {
      setLoading(true);

      // Fetch metric targets
      const metricsResponse = await fetch(
        `/api/sustainability/replan/metrics?organizationId=${organizationId}&targetId=${targetId}`
      );

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetricTargets(metricsData.metricTargets || []);
      }

      // Fetch replanning history
      const historyResponse = await fetch(
        `/api/sustainability/replan/history?organizationId=${organizationId}&targetId=${targetId}`
      );

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistory(historyData.history || []);
      }
    } catch (error) {
      console.error('Error fetching replanning data:', error);
      toast.error('Failed to load replanning data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMonthlyData = async (metricTargetId: string) => {
    try {
      const response = await fetch(
        `/api/sustainability/replan/monthly?metricTargetId=${metricTargetId}`
      );

      if (response.ok) {
        const data = await response.json();
        setMonthlyData(prev => ({ ...prev, [metricTargetId]: data.monthlyTargets || [] }));
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    }
  };

  const fetchInitiatives = async (metricTargetId: string) => {
    try {
      const response = await fetch(
        `/api/sustainability/replan/initiatives?metricTargetId=${metricTargetId}`
      );

      if (response.ok) {
        const data = await response.json();
        setInitiatives(prev => ({ ...prev, [metricTargetId]: data.initiatives || [] }));
      }
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    }
  };

  const handleMetricExpand = (metricId: string) => {
    if (expandedMetric === metricId) {
      setExpandedMetric(null);
    } else {
      setExpandedMetric(metricId);
      // Fetch detailed data for this metric
      const metric = metricTargets.find(m => m.id === metricId);
      if (metric) {
        fetchMonthlyData(metric.id);
        fetchInitiatives(metric.id);
      }
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress >= 100) return 'text-green-500';
    if (progress >= 75) return 'text-blue-500';
    if (progress >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStrategyLabel = (strategy: string) => {
    const labels: Record<string, string> = {
      activity_reduction: 'Activity Reduction',
      efficiency_improvement: 'Efficiency Improvement',
      fuel_switch: 'Fuel Switch',
      renewable_energy: 'Renewable Energy',
      carbon_offset: 'Carbon Offset'
    };
    return labels[strategy] || strategy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!targetId) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Target Selected
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select a sustainability target to view replanning details
        </p>
      </div>
    );
  }

  if (metricTargets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Replanning Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Use the scenario simulator to create a replanning with metric-level targets
        </p>
      </div>
    );
  }

  // Calculate summary metrics
  const totalMetrics = metricTargets.length;
  const totalReduction = metricTargets.reduce((sum, m) => sum + (m.baseline_emissions - m.target_emissions), 0);
  const avgReduction = metricTargets.reduce((sum, m) => sum + m.reduction_percent, 0) / totalMetrics;
  const totalInvestment = Object.values(initiatives).flat().reduce((sum, i) => sum + i.estimated_cost, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Target className="w-5 h-5 text-purple-500" />
            <span className="text-xs text-gray-500">Metrics</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalMetrics}
          </div>
          <div className="text-xs text-gray-500 mt-1">Active targets</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingDown className="w-5 h-5 text-green-500" />
            <span className="text-xs text-gray-500">Total Reduction</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalReduction.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 mt-1">tCO2e planned</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-xs text-gray-500">Avg. Reduction</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgReduction.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Per metric</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <span className="text-xs text-gray-500">Investment</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            ${(totalInvestment / 1000).toFixed(0)}k
          </div>
          <div className="text-xs text-gray-500 mt-1">Total budget</div>
        </motion.div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 w-fit">
        {[
          { id: 'metrics', label: 'Metrics', icon: Target },
          { id: 'timeline', label: 'Timeline', icon: Calendar },
          { id: 'initiatives', label: 'Initiatives', icon: CheckCircle },
          { id: 'history', label: 'History', icon: History }
        ].map(view => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id as typeof selectedView)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${selectedView === view.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
      </div>

      {/* Metrics View */}
      {selectedView === 'metrics' && (
        <div className="space-y-3">
          {metricTargets.map((metric, index) => {
            const isExpanded = expandedMetric === metric.id;
            const monthly = monthlyData[metric.id] || [];
            const metricInitiatives = initiatives[metric.id] || [];

            return (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Metric Header */}
                <button
                  onClick={() => handleMetricExpand(metric.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {metric.metric_name}
                        </h4>
                        <span className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                          {formatScope(metric.scope)}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                          {metric.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{getStrategyLabel(metric.strategy_type)}</span>
                        <span>•</span>
                        <span>{metric.reduction_percent.toFixed(1)}% reduction</span>
                        <span>•</span>
                        <span className="capitalize">{metric.confidence_level} confidence</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Current</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {metric.baseline_emissions.toFixed(1)} tCO2e
                        </div>
                      </div>
                      <TrendingDown className="w-5 h-5 text-gray-400" />
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Target</div>
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          {metric.target_emissions.toFixed(1)} tCO2e
                        </div>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 p-4"
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Monthly Progress */}
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          Monthly Trajectory
                        </h5>
                        {monthly.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {monthly.slice(0, 12).map(month => (
                              <div
                                key={`${month.year}-${month.month}`}
                                className="flex items-center justify-between p-2 bg-white dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 text-sm"
                              >
                                <span className="text-gray-600 dark:text-gray-400">
                                  {new Date(month.year, month.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-xs text-gray-500">Planned</div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {month.planned_emissions.toFixed(2)} tCO2e
                                    </div>
                                  </div>
                                  {month.actual_emissions && (
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500">Actual</div>
                                      <div className={`font-medium ${
                                        month.actual_emissions <= month.planned_emissions
                                          ? 'text-green-600 dark:text-green-400'
                                          : 'text-red-600 dark:text-red-400'
                                      }`}>
                                        {month.actual_emissions.toFixed(2)} tCO2e
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Loading monthly data...</p>
                        )}
                      </div>

                      {/* Initiatives */}
                      <div>
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Reduction Initiatives
                        </h5>
                        {metricInitiatives.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {metricInitiatives.map(initiative => (
                              <div
                                key={initiative.id}
                                className="p-3 bg-white dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                                    {initiative.initiative_name}
                                  </h6>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    initiative.status === 'completed'
                                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                      : initiative.status === 'in_progress'
                                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'
                                  }`}>
                                    {initiative.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                  {initiative.description}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    ${initiative.estimated_cost.toLocaleString()}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TrendingDown className="w-3 h-3" />
                                    {initiative.estimated_impact.toFixed(1)} tCO2e
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {initiative.implementation_timeline}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Loading initiatives...</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* History View */}
      {selectedView === 'history' && (
        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <History className="w-5 h-5 text-purple-500" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {entry.trigger === 'manual' ? 'Manual Replanning' : 'Automated Replanning'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">
                        {entry.strategy}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <div>
                        Target: {entry.previous_target.toFixed(1)} → {entry.new_target.toFixed(1)} tCO2e
                      </div>
                      <span>•</span>
                      <div>{entry.metric_targets_count} metrics</div>
                      <span>•</span>
                      <div>{entry.initiatives_count} initiatives</div>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-500 mt-2">{entry.notes}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </div>
                    <button className="mt-2 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" />
                      Rollback
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No replanning history yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
