'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Factory,
  Users,
  Leaf
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Tooltip,
  Cell
} from 'recharts';

interface TargetData {
  id: string;
  target_type: string;
  target_name: string;
  baseline_year: number;
  baseline_emissions: number;
  target_year: number;
  target_reduction_percent: number;
  current_emissions?: number;
  performance_status?: string;
  sbti_validated: boolean;
}

interface SBTiTrackerProps {
  targets: TargetData[];
  predictions?: any;
  onTargetSelect?: (targetId: string) => void;
}

export function SBTiTracker({ targets, predictions, onTargetSelect }: SBTiTrackerProps) {
  // Calculate progress for each target
  const targetsWithProgress = targets.map(target => {
    const progress = target.baseline_emissions && target.current_emissions
      ? ((target.baseline_emissions - target.current_emissions) / target.baseline_emissions) * 100
      : 0;

    const requiredProgress = target.target_reduction_percent *
      ((new Date().getFullYear() - target.baseline_year) /
       (target.target_year - target.baseline_year));

    return {
      ...target,
      progress,
      requiredProgress,
      gap: progress - requiredProgress
    };
  });

  // Prepare data for radial chart
  const radialData = targetsWithProgress
    .filter(t => t.target_type === 'near-term' || t.target_type === 'net-zero')
    .map(target => ({
      name: target.target_name,
      value: Math.max(0, Math.min(100, target.progress)),
      required: target.requiredProgress,
      fill: target.gap >= 0 ? '#10B981' : target.gap > -5 ? '#F59E0B' : '#EF4444'
    }));

  const getStatusColor = (status?: string, gap?: number) => {
    if (gap !== undefined) {
      if (gap >= 0) return 'text-green-500';
      if (gap > -5) return 'text-yellow-500';
      return 'text-red-500';
    }
    switch (status) {
      case 'on-track':
      case 'exceeding':
        return 'text-green-500';
      case 'at-risk':
        return 'text-yellow-500';
      case 'off-track':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'near-term':
        return <Target className="w-5 h-5" />;
      case 'net-zero':
        return <Leaf className="w-5 h-5" />;
      case 'renewable-energy':
        return <Zap className="w-5 h-5" />;
      case 'supplier-engagement':
        return <Users className="w-5 h-5" />;
      default:
        return <Factory className="w-5 h-5" />;
    }
  };

  // Calculate overall SBTi readiness score
  const sbtiScore = targetsWithProgress.reduce((score, target) => {
    if (target.sbti_validated) score += 30;
    if (target.gap >= 0) score += 20;
    if (target.target_type === 'near-term') score += 15;
    if (target.target_type === 'net-zero') score += 15;
    if (target.progress > 0) score += 20;
    return score;
  }, 0) / Math.max(targetsWithProgress.length, 1);

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          SBTi Progress Tracker
        </h3>
        <div className="flex items-center gap-2">
          <div className={`text-sm font-medium ${sbtiScore >= 80 ? 'text-green-500' : sbtiScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
            {sbtiScore.toFixed(0)}% Ready
          </div>
          <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${sbtiScore >= 80 ? 'bg-green-500' : sbtiScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${sbtiScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Radial Progress Chart */}
      {radialData.length > 0 && (
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="20%"
              outerRadius="90%"
              data={radialData}
              startAngle={180}
              endAngle={0}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                fill="#10B981"
              />
              <Tooltip
                content={({ payload }) => {
                  if (payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
                        <p className="text-white font-semibold">{data.name}</p>
                        <p className="text-sm text-gray-300">
                          Progress: {data.value.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-300">
                          Required: {data.required.toFixed(1)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Target List */}
      <div className="space-y-3">
        {targetsWithProgress.map((target, index) => (
          <motion.div
            key={target.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onTargetSelect?.(target.id)}
            className="border border-gray-200 dark:border-white/[0.05] rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`mt-1 ${getStatusColor(target.performance_status, target.gap)}`}>
                  {getTargetIcon(target.target_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {target.target_name}
                    </h4>
                    {target.sbti_validated && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                        SBTi Validated
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {target.baseline_year} → {target.target_year} | {target.target_reduction_percent}% reduction
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs">
                    <span className="text-gray-500">
                      Progress: <span className={getStatusColor(undefined, target.gap)}>
                        {target.progress.toFixed(1)}%
                      </span>
                    </span>
                    <span className="text-gray-500">
                      Required: {target.requiredProgress.toFixed(1)}%
                    </span>
                    <span className={getStatusColor(undefined, target.gap)}>
                      {target.gap >= 0 ? '+' : ''}{target.gap.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className={`${getStatusColor(target.performance_status, target.gap)}`}>
                {target.gap >= 0 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : target.gap > -5 ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="relative">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      target.gap >= 0 ? 'bg-green-500' : target.gap > -5 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(100, target.progress)}%` }}
                  />
                </div>
                {/* Required progress marker */}
                <div
                  className="absolute top-0 w-0.5 h-2 bg-gray-600 dark:bg-gray-400"
                  style={{ left: `${Math.min(100, target.requiredProgress)}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ML Predictions Alert */}
      {predictions && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                ML Prediction Insight
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                Based on current trends, you're projected to achieve a {predictions.projectedReduction || '15.2'}% reduction by {new Date().getFullYear() + 1}.
                {predictions.recommendation && ` ${predictions.recommendation}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Target CTA */}
      {targets.length === 0 && (
        <div className="text-center py-8">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            No targets set yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Start by creating your first science-based target
          </p>
        </div>
      )}
    </div>
  );
}