'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Info,
  Zap,
  Car,
  Trash2,
  Plane,
  Factory,
  Droplet,
  Package,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CategoryAllocation {
  category: string;
  currentEmissions: number;
  emissionPercent: number;
  baselineTargetPercent: number;
  adjustedTargetPercent: number;
  effortFactor: number;
  reason: string;
  absoluteTarget: number;
  feasibility: 'high' | 'medium' | 'low';
}

interface WeightedTargetBreakdownProps {
  organizationId: string;
  overallTarget?: number;
  baselineYear?: number;
  siteId?: string;
  onCategoryUpdate?: (category: string, customTarget: number) => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  'Purchased Energy': Zap,
  'Electricity': Zap,
  'Stationary Combustion': Factory,
  'Mobile Combustion': Car,
  'Business Travel': Plane,
  'Employee Commuting': Car,
  'Waste': Trash2,
  'Water': Droplet,
  'Transport': Car,
  'Purchased Goods': Package,
  'Fugitive Emissions': Factory,
  'Other': Target
};

export function WeightedTargetBreakdown({
  organizationId,
  overallTarget = 4.2, // SBTi 1.5°C default
  baselineYear,
  siteId,
  onCategoryUpdate
}: WeightedTargetBreakdownProps) {
  const [allocations, setAllocations] = useState<CategoryAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchWeightedAllocation();
  }, [organizationId, overallTarget, baselineYear, siteId]);

  const fetchWeightedAllocation = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        target: overallTarget.toString(),
        ...(baselineYear && { baseline_year: baselineYear.toString() }),
        ...(siteId && { site_id: siteId })
      });

      const response = await fetch(`/api/sustainability/targets/weighted-allocation?${params}`);
      if (!response.ok) throw new Error('Failed to fetch weighted allocation');

      const data = await response.json();
      setAllocations(data.allocations || []);
      setTotalEmissions(data.totalEmissions || 0);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching weighted allocation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeasibilityColor = (feasibility: string) => {
    switch (feasibility) {
      case 'high':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getFeasibilityIcon = (feasibility: string) => {
    switch (feasibility) {
      case 'high':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'medium':
        return <Info className="w-4 h-4" />;
      case 'low':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Science-Based Target Allocation
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Weighted by emission profile, abatement potential, and technology readiness
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              {overallTarget}%
            </div>
            <div className="text-xs text-gray-500">Overall Target</div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalEmissions.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">Total Emissions (tCO2e)</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {allocations.length}
            </div>
            <div className="text-xs text-gray-500">Emission Categories</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600">
              {summary?.highFeasibility || 0}
            </div>
            <div className="text-xs text-gray-500">High Feasibility</div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
          Category-Level Targets
        </h4>

        <div className="space-y-3">
          {allocations.map((allocation, index) => {
            const Icon = CATEGORY_ICONS[allocation.category] || Target;
            const isExpanded = expandedCategory === allocation.category;

            return (
              <motion.div
                key={allocation.category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : allocation.category)}
                  className="w-full p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {allocation.category}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {allocation.currentEmissions.toFixed(1)} tCO2e ({allocation.emissionPercent.toFixed(1)}%)
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getFeasibilityColor(allocation.feasibility)}`}>
                            {getFeasibilityIcon(allocation.feasibility)}
                            {allocation.feasibility} feasibility
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-4 h-4 text-purple-500" />
                          <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                            {allocation.adjustedTargetPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          → {allocation.absoluteTarget.toFixed(1)} tCO2e
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/30"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Allocation Logic
                        </h5>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Baseline target: {allocation.baselineTargetPercent.toFixed(1)}% (proportional to emissions)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Effort factor: {allocation.effortFactor}x ({allocation.reason})</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>Adjusted target: {allocation.adjustedTargetPercent.toFixed(1)}%</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Target Breakdown
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Current:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {allocation.currentEmissions.toFixed(1)} tCO2e
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Reduction:</span>
                            <span className="font-medium text-red-600 dark:text-red-400">
                              -{((allocation.currentEmissions - allocation.absoluteTarget)).toFixed(1)} tCO2e
                            </span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Target:</span>
                            <span className="font-bold text-green-600 dark:text-green-400">
                              {allocation.absoluteTarget.toFixed(1)} tCO2e
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              How Weighted Allocation Works
            </h5>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Categories with high emissions AND high abatement potential receive higher reduction targets.
              This ensures the overall {overallTarget}% target is achievable by focusing efforts where they matter most.
              Categories are weighted by emission percentage × effort factor (based on technology readiness and cost-effectiveness).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
