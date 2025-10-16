'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingDown,
  Calendar,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Zap
} from 'lucide-react';

interface ReplanningResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  targetId: string;
  targetName: string;
}

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
}

interface Initiative {
  id: string;
  name: string;
  description: string | null;
  estimated_reduction_tco2e: number;
  start_date: string;
  completion_date: string | null;
  capex: number | null;
  annual_opex: number | null;
  risk_level: string;
  confidence_score: number;
  implementation_status: string;
}

interface MonthlyTarget {
  year: number;
  month: number;
  planned_value: number;
  planned_emissions: number;
  actual_value?: number | null;
  actual_emissions?: number | null;
}

export default function ReplanningResultsModal({
  isOpen,
  onClose,
  organizationId,
  targetId,
  targetName
}: ReplanningResultsModalProps) {
  const [loading, setLoading] = useState(true);
  const [metricTargets, setMetricTargets] = useState<MetricTarget[]>([]);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const [selectedMetricInitiatives, setSelectedMetricInitiatives] = useState<{ [key: string]: Initiative[] }>({});
  const [selectedMetricMonthly, setSelectedMetricMonthly] = useState<{ [key: string]: MonthlyTarget[] }>({});

  useEffect(() => {
    if (isOpen) {
      fetchReplanningResults();
    }
  }, [isOpen, targetId]);

  const fetchReplanningResults = async () => {
    try {
      setLoading(true);

      // Fetch metric targets
      const metricsResponse = await fetch(
        `/api/sustainability/replan/metrics?organizationId=${organizationId}&targetId=${targetId}`
      );
      const metricsData = await metricsResponse.json();

      setMetricTargets(metricsData.metricTargets || []);
    } catch (error) {
      console.error('Error fetching replanning results:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInitiatives = async (metricTargetId: string) => {
    if (selectedMetricInitiatives[metricTargetId]) return; // Already loaded

    try {
      const response = await fetch(
        `/api/sustainability/replan/initiatives?metricTargetId=${metricTargetId}`
      );
      const data = await response.json();

      setSelectedMetricInitiatives(prev => ({
        ...prev,
        [metricTargetId]: data.initiatives || []
      }));
    } catch (error) {
      console.error('Error fetching initiatives:', error);
    }
  };

  const fetchMonthlyTargets = async (metricTargetId: string) => {
    if (selectedMetricMonthly[metricTargetId]) return; // Already loaded

    try {
      const response = await fetch(
        `/api/sustainability/replan/monthly?metricTargetId=${metricTargetId}`
      );
      const data = await response.json();

      setSelectedMetricMonthly(prev => ({
        ...prev,
        [metricTargetId]: data.monthlyTargets || []
      }));
    } catch (error) {
      console.error('Error fetching monthly targets:', error);
    }
  };

  const toggleMetric = async (metricTargetId: string) => {
    if (expandedMetric === metricTargetId) {
      setExpandedMetric(null);
    } else {
      setExpandedMetric(metricTargetId);
      // Fetch data for this metric
      await Promise.all([
        fetchInitiatives(metricTargetId),
        fetchMonthlyTargets(metricTargetId)
      ]);
    }
  };

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'activity_reduction': return 'Activity Reduction';
      case 'efficiency': return 'Efficiency Improvement';
      case 'fuel_switching': return 'Fuel Switching';
      case 'renewable_energy': return 'Renewable Energy';
      default: return strategy;
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    if (score >= 0.5) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30';
  };

  const getRiskLevelColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 dark:text-green-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'high': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const calculateTimelineMonths = (startDate: string, completionDate: string | null) => {
    if (!completionDate) return null;
    const start = new Date(startDate);
    const end = new Date(completionDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return months;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Replanning Action Plan
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {targetName} - Metric-level targets and initiatives
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
                  <p className="text-gray-400">Loading action plan...</p>
                </div>
              </div>
            ) : metricTargets.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Replanning Results Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Click "Replan Target" to generate a detailed action plan with metric-level targets.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Action Plan Generated
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {metricTargets.length} metrics targeted with specific reduction strategies
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Total Reduction</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {metricTargets.reduce((sum, m) => sum + (m.baseline_emissions - m.target_emissions), 0).toFixed(1)} tCO2e
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Avg Reduction</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {(metricTargets.reduce((sum, m) => sum + m.reduction_percent, 0) / metricTargets.length).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 dark:text-gray-400">Metrics</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {metricTargets.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metric Targets */}
                {metricTargets.map((metric) => (
                  <div
                    key={metric.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {/* Metric Header */}
                    <button
                      onClick={() => toggleMetric(metric.id)}
                      className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {metric.metric_name}
                            </h4>
                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded">
                              {metric.scope}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                              {metric.category}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Baseline: </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {metric.baseline_value.toFixed(1)} {metric.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Target: </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {metric.target_value.toFixed(1)} {metric.unit}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Reduction: </span>
                              <span className="font-medium text-green-600 dark:text-green-400">
                                {metric.reduction_percent.toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Strategy: </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {getStrategyLabel(metric.strategy_type)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          {expandedMetric === metric.id ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {expandedMetric === metric.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="p-4 space-y-4">
                            {/* Initiatives */}
                            {selectedMetricInitiatives[metric.id] && selectedMetricInitiatives[metric.id].length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                                  <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    Suggested Initiatives ({selectedMetricInitiatives[metric.id].length})
                                  </h5>
                                </div>
                                <div className="space-y-2">
                                  {selectedMetricInitiatives[metric.id].map((initiative) => {
                                    const timelineMonths = calculateTimelineMonths(initiative.start_date, initiative.completion_date);
                                    return (
                                      <div
                                        key={initiative.id}
                                        className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3"
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <h6 className="font-medium text-gray-900 dark:text-white text-sm">
                                            {initiative.name}
                                          </h6>
                                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getConfidenceColor(initiative.confidence_score)}`}>
                                            {(initiative.confidence_score * 100).toFixed(0)}% confidence
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                          {initiative.description || 'No description provided'}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                          <div className="flex items-center gap-1">
                                            <Zap className="w-3 h-3" />
                                            <span>{initiative.estimated_reduction_tco2e.toFixed(1)} tCO2e impact</span>
                                          </div>
                                          {timelineMonths && (
                                            <div className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              <span>{timelineMonths} months</span>
                                            </div>
                                          )}
                                          <div className="flex items-center gap-1">
                                            <Target className="w-3 h-3" />
                                            <span className={getRiskLevelColor(initiative.risk_level)}>
                                              {initiative.risk_level} risk
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Monthly Targets Preview */}
                            {selectedMetricMonthly[metric.id] && selectedMetricMonthly[metric.id].length > 0 && (
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <Calendar className="w-4 h-4 text-blue-500" />
                                  <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    Monthly Trajectory ({selectedMetricMonthly[metric.id].length} months)
                                  </h5>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                                  <div className="grid grid-cols-6 gap-2 text-xs">
                                    {selectedMetricMonthly[metric.id].slice(0, 6).map((monthly, idx) => (
                                      <div key={idx}>
                                        <div className="text-gray-500 dark:text-gray-400">
                                          {monthly.year}/{monthly.month}
                                        </div>
                                        <div className="font-medium text-gray-900 dark:text-white">
                                          {monthly.planned_value ? monthly.planned_value.toFixed(1) : 'N/A'}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  {selectedMetricMonthly[metric.id].length > 6 && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                      ...and {selectedMetricMonthly[metric.id].length - 6} more months
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Click on any metric to see detailed initiatives and monthly targets
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
