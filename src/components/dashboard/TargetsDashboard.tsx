'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TargetData {
  id: string;
  target_name: string;
  baseline_year: number;
  target_year: number;
  baseline_emissions: number;
  target_emissions: number;
  current_emissions: number;
  target_reduction_percent: number;
  annual_reduction_rate: number;
  performance_status: 'exceeding' | 'on-track' | 'at-risk' | 'off-track' | 'pending';
  sbti_validated: boolean;
}

interface TargetsDashboardProps {
  organizationId: string;
}

export function TargetsDashboard({ organizationId }: TargetsDashboardProps) {
  const [targets, setTargets] = useState<TargetData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTargets();
  }, [organizationId]);

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/sustainability/targets');
      if (!response.ok) throw new Error('Failed to fetch targets');
      const data = await response.json();
      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'exceeding':
        return { color: '#10b981', icon: TrendingUp, label: 'Exceeding Target', bg: 'bg-green-500/10' };
      case 'on-track':
        return { color: '#3b82f6', icon: CheckCircle, label: 'On Track', bg: 'bg-blue-500/10' };
      case 'at-risk':
        return { color: '#f59e0b', icon: AlertTriangle, label: 'At Risk', bg: 'bg-amber-500/10' };
      case 'off-track':
        return { color: '#ef4444', icon: TrendingDown, label: 'Off Track', bg: 'bg-red-500/10' };
      default:
        return { color: '#64748b', icon: Target, label: 'Pending', bg: 'bg-gray-500/10' };
    }
  };

  const calculateProgress = (target: TargetData) => {
    if (!target.current_emissions || !target.baseline_emissions || !target.target_emissions) {
      return 0;
    }
    const totalReduction = target.baseline_emissions - target.target_emissions;
    const actualReduction = target.baseline_emissions - target.current_emissions;
    return (actualReduction / totalReduction) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500" />
      </div>
    );
  }

  if (targets.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Targets Set</h3>
        <p className="text-gray-500 mb-4">Set up your first sustainability target to track progress</p>
        <Link
          href="/sustainability/targets"
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Create Target <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Targets</span>
            <Target className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">{targets.length}</div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">SBTi Validated</span>
            <CheckCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {targets.filter(t => t.sbti_validated).length}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">On Track</span>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {targets.filter(t => t.performance_status === 'on-track' || t.performance_status === 'exceeding').length}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Avg Progress</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white">
            {(targets.reduce((sum, t) => sum + calculateProgress(t), 0) / targets.length).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Target Cards */}
      <div className="space-y-4">
        {targets.map((target) => {
          const status = getStatusConfig(target.performance_status);
          const StatusIcon = status.icon;
          const progress = calculateProgress(target);

          return (
            <motion.div
              key={target.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-6 hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{target.target_name}</h3>
                    {target.sbti_validated && (
                      <span className="px-2 py-1 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">
                        SBTi
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">
                    {target.baseline_year} → {target.target_year} | {target.target_reduction_percent.toFixed(1)}% reduction
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${status.bg}`}>
                  <StatusIcon className="w-4 h-4" style={{ color: status.color }} />
                  <span className="text-sm font-medium" style={{ color: status.color }}>
                    {status.label}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-white font-medium">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/[0.05]">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Baseline</div>
                  <div className="text-sm font-semibold text-white">
                    {target.baseline_emissions.toFixed(1)} tCO2e
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Current</div>
                  <div className="text-sm font-semibold text-white">
                    {target.current_emissions ? target.current_emissions.toFixed(1) : '-'} tCO2e
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Target</div>
                  <div className="text-sm font-semibold text-white">
                    {target.target_emissions.toFixed(1)} tCO2e
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="text-center pt-4">
        <Link
          href="/sustainability/targets"
          className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
        >
          View Detailed Targets Page <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
