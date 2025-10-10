'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity
} from 'lucide-react';

interface VarianceTrackerProps {
  organizationId: string;
  targetId: string;
  targetName: string;
}

interface MetricVariance {
  metric_name: string;
  metric_code: string;
  scope: string;
  planned_ytd: number;
  actual_ytd: number;
  variance_ytd: number;
  variance_percent: number;
  status: 'on_track' | 'at_risk' | 'off_track';
  months_tracked: number;
  months_planned: number;
}

export default function VarianceTracker({
  organizationId,
  targetId,
  targetName
}: VarianceTrackerProps) {
  const [variance, setVariance] = useState<MetricVariance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [alerts, setAlerts] = useState<MetricVariance[]>([]);

  useEffect(() => {
    fetchVariance();
    // Refresh every 5 minutes
    const interval = setInterval(fetchVariance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [organizationId, targetId]);

  useEffect(() => {
    // Calculate alerts (metrics that are off_track or at_risk)
    const newAlerts = variance.filter(v => v.status !== 'on_track');
    setAlerts(newAlerts);
  }, [variance]);

  const fetchVariance = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/sustainability/replan?organizationId=${organizationId}&targetId=${targetId}`
      );
      const data = await response.json();

      if (data.success && data.data.variance) {
        setVariance(data.data.variance);
      }
    } catch (error) {
      console.error('Error fetching variance:', error);
    } finally {
      setLoading(false);
    }
  };

  const overallStatus = variance.length > 0
    ? variance.every(v => v.status === 'on_track')
      ? 'on_track'
      : variance.some(v => v.status === 'off_track')
      ? 'off_track'
      : 'at_risk'
    : 'on_track';

  const statusConfig = {
    on_track: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: CheckCircle,
      label: 'On Track'
    },
    at_risk: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
      label: 'At Risk'
    },
    off_track: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: XCircle,
      label: 'Off Track'
    }
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (variance.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              No Active Tracking Yet
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Start tracking your progress by applying a replanning strategy. The system will automatically monitor
              planned vs actual performance and alert you to variances.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900/50 border ${config.border} rounded-xl overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${config.bg}`}>
            <StatusIcon className={`w-6 h-6 ${config.color}`} />
          </div>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Variance Tracking: {targetName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {variance.length} metrics tracked • {alerts.length} alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg ${config.bg} flex items-center gap-2`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
            <span className={`text-sm font-semibold ${config.color}`}>
              {config.label}
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-gray-200 dark:border-gray-700"
          >
            {/* Alerts Section */}
            {alerts.length > 0 && (
              <div className="p-6 bg-red-50 dark:bg-red-900/10 border-b border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                      {alerts.length} Metric{alerts.length > 1 ? 's' : ''} Need Attention
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      The following metrics are not tracking to plan. Consider adjusting your strategy or
                      implementing additional initiatives.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {alerts.map((metric) => (
                    <AlertCard key={metric.metric_code} metric={metric} />
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Table */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Metric
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Scope
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Planned YTD
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Actual YTD
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Variance
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Status
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Coverage
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {variance.map((metric) => (
                      <MetricRow key={metric.metric_code} metric={metric} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
                </div>
                <button
                  onClick={fetchVariance}
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Alert Card Component
function AlertCard({ metric }: { metric: MetricVariance }) {
  const isOverPerforming = metric.variance_ytd < 0; // Negative variance = better than planned

  return (
    <div className={`p-4 rounded-lg border ${
      metric.status === 'off_track'
        ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
        : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {metric.metric_name}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {metric.scope.toUpperCase()} • {metric.metric_code}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${
            isOverPerforming
              ? 'text-green-600 dark:text-green-400'
              : metric.status === 'off_track'
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
          }`}>
            {isOverPerforming ? '-' : '+'}{Math.abs(metric.variance_percent).toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {Math.abs(metric.variance_ytd).toFixed(2)} tCO2e {isOverPerforming ? 'under' : 'over'} plan
          </div>
        </div>
      </div>
    </div>
  );
}

// Metric Row Component
function MetricRow({ metric }: { metric: MetricVariance }) {
  const statusConfig = {
    on_track: {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: CheckCircle
    },
    at_risk: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      icon: AlertTriangle
    },
    off_track: {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: XCircle
    }
  };

  const config = statusConfig[metric.status];
  const StatusIcon = config.icon;
  const isOverPerforming = metric.variance_ytd < 0;

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
      <td className="py-4 px-4">
        <div className="font-medium text-gray-900 dark:text-white">
          {metric.metric_name}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {metric.metric_code}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded">
          {metric.scope.toUpperCase()}
        </span>
      </td>
      <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
        {metric.planned_ytd.toFixed(2)}
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">tCO2e</span>
      </td>
      <td className="py-4 px-4 text-right font-medium text-gray-900 dark:text-white">
        {metric.actual_ytd?.toFixed(2) || 'N/A'}
        {metric.actual_ytd && (
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">tCO2e</span>
        )}
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-1">
          {isOverPerforming ? (
            <TrendingDown className="w-4 h-4 text-green-500" />
          ) : (
            <TrendingUp className="w-4 h-4 text-red-500" />
          )}
          <span className={`font-bold ${
            isOverPerforming
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {isOverPerforming ? '' : '+'}{metric.variance_percent.toFixed(1)}%
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {isOverPerforming ? '' : '+'}{metric.variance_ytd.toFixed(2)} tCO2e
        </div>
      </td>
      <td className="py-4 px-4 text-center">
        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${config.bg}`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-xs font-semibold ${config.color}`}>
            {metric.status === 'on_track' ? 'On Track' : metric.status === 'at_risk' ? 'At Risk' : 'Off Track'}
          </span>
        </div>
      </td>
      <td className="py-4 px-4 text-center text-sm text-gray-600 dark:text-gray-400">
        {metric.months_tracked}/{metric.months_planned}
      </td>
    </tr>
  );
}
