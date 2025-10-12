'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Target as TargetIcon
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

interface TrajectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  target: {
    id: string;
    name: string;
    baseline_year: number;
    baseline_emissions: number;
    target_year: number;
    target_emissions: number;
    current_emissions?: number;
    reduction_percentage?: number;
    performance_status?: string;
  };
}

interface DataPoint {
  name: string;
  base: number;
  value: number;
  total: number;
  label: string;
  isRequiredReduction?: boolean;
  isGap?: boolean;
  isTarget?: boolean;
  isActual?: boolean;
}

export default function TrajectoryModal({
  isOpen,
  onClose,
  organizationId,
  target
}: TrajectoryModalProps) {
  const [loading, setLoading] = useState(true);
  const [trajectoryData, setTrajectoryData] = useState<DataPoint[]>([]);
  const [hasReplanning, setHasReplanning] = useState(false);
  const [initiatives, setInitiatives] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      generateTrajectoryData();
      fetchReplanningData();
    }
  }, [isOpen, target.id]);

  const fetchReplanningData = async () => {
    try {
      // Check if target has been replanned
      const historyResponse = await fetch(
        `/api/sustainability/replan/history?targetId=${target.id}&organizationId=${organizationId}`
      );
      const historyData = await historyResponse.json();

      if (historyData.success && historyData.history && historyData.history.length > 0) {
        setHasReplanning(true);

        // Fetch metric targets for this sustainability target
        const metricsResponse = await fetch(
          `/api/sustainability/replan/actuals?targetId=${target.id}&organizationId=${organizationId}`
        );
        const metricsData = await metricsResponse.json();

        if (metricsData.success && metricsData.metricTargets) {
          // Fetch initiatives for each metric target
          const allInitiatives: any[] = [];

          for (const metricTarget of metricsData.metricTargets) {
            const initiativesResponse = await fetch(
              `/api/sustainability/replan/initiatives?metricTargetId=${metricTarget.id}`
            );
            const initiativesData = await initiativesResponse.json();

            if (initiativesData.success && initiativesData.initiatives) {
              allInitiatives.push(...initiativesData.initiatives);
            }
          }

          // Sort initiatives by reduction amount (highest first)
          allInitiatives.sort((a, b) => {
            const aReduction = Math.abs(a.estimated_reduction_tco2e || 0);
            const bReduction = Math.abs(b.estimated_reduction_tco2e || 0);
            return bReduction - aReduction;
          });

          setInitiatives(allInitiatives);
        }
      }
    } catch (error) {
      console.error('Error fetching replanning data:', error);
    }
  };

  const generateTrajectoryData = async () => {
    try {
      setLoading(true);

      const baseline = target.baseline_emissions;
      const current = target.current_emissions || baseline;
      const targetEmissions = target.target_emissions;
      const baselineYear = target.baseline_year;
      const currentYear = new Date().getFullYear();
      const targetYear = target.target_year;

      // Calculate required emissions for current year (linear trajectory)
      const yearsElapsed = currentYear - baselineYear;
      const totalYears = targetYear - baselineYear;
      const totalReduction = baseline - targetEmissions;
      const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
      const requiredEmissions = baseline - requiredReduction;
      const gapFromRequired = current - requiredEmissions;

      // Build waterfall data
      const data: DataPoint[] = [
        {
          name: `${baselineYear}\nBaseline`,
          base: 0,
          value: baseline,
          total: baseline,
          label: baseline.toFixed(1)
        },
        {
          name: `Required\nReduction`,
          base: requiredEmissions,
          value: requiredReduction,
          total: baseline,
          label: `-${requiredReduction.toFixed(1)}`,
          isRequiredReduction: true
        },
        {
          name: `${currentYear}\nRequired`,
          base: 0,
          value: requiredEmissions,
          total: requiredEmissions,
          label: requiredEmissions.toFixed(1),
          isTarget: true
        },
        {
          name: `Gap from\nRequired`,
          base: requiredEmissions,
          value: Math.abs(gapFromRequired),
          total: requiredEmissions + (gapFromRequired > 0 ? gapFromRequired : 0),
          label: gapFromRequired >= 0 ? `+${gapFromRequired.toFixed(1)}` : gapFromRequired.toFixed(1),
          isGap: true
        },
        {
          name: `${currentYear}\nActual`,
          base: 0,
          value: current,
          total: current,
          label: current.toFixed(1),
          isActual: true
        }
      ];

      // Add initiative bars if replanning exists
      if (hasReplanning && initiatives.length > 0) {
        let runningTotal = current;

        // Add each initiative as a separate bar
        initiatives.slice(0, 5).forEach((initiative, idx) => {
          const reduction = Math.abs(initiative.estimated_reduction_tco2e || 0);
          runningTotal -= reduction;

          data.push({
            name: initiative.name.length > 15
              ? initiative.name.substring(0, 15) + '...'
              : initiative.name,
            base: runningTotal,
            value: reduction,
            total: runningTotal + reduction,
            label: `-${reduction.toFixed(1)}`,
            isRequiredReduction: true
          });
        });

        // If more than 5 initiatives, show "Other initiatives"
        if (initiatives.length > 5) {
          const remainingReduction = initiatives.slice(5).reduce(
            (sum, init) => sum + Math.abs(init.estimated_reduction_tco2e || 0),
            0
          );
          runningTotal -= remainingReduction;

          data.push({
            name: `+${initiatives.length - 5} more\ninitiatives`,
            base: runningTotal,
            value: remainingReduction,
            total: runningTotal + remainingReduction,
            label: `-${remainingReduction.toFixed(1)}`,
            isRequiredReduction: true
          });
        }

        // Final projected position
        data.push({
          name: `${targetYear}\nProjected`,
          base: 0,
          value: runningTotal,
          total: runningTotal,
          label: runningTotal.toFixed(1),
          isActual: true
        });
      } else {
        // Original trajectory (no replanning)
        data.push({
          name: `Required to\n${targetYear}`,
          base: targetEmissions,
          value: current - targetEmissions,
          total: current,
          label: `-${(current - targetEmissions).toFixed(1)}`,
          isRequiredReduction: true
        });
      }

      // Final target
      data.push({
        name: `${targetYear}\nTarget`,
        base: 0,
        value: targetEmissions,
        total: targetEmissions,
        label: targetEmissions.toFixed(1),
        isTarget: true
      });

      setTrajectoryData(data);
    } catch (error) {
      console.error('Error generating trajectory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    const status = target.performance_status || 'pending';
    switch (status) {
      case 'exceeding':
        return {
          icon: CheckCircle2,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          label: 'Exceeding Target',
          message: 'You are ahead of schedule and exceeding your reduction target!'
        };
      case 'on-track':
        return {
          icon: CheckCircle2,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-100 dark:bg-blue-900/30',
          label: 'On Track',
          message: 'Your emissions are aligned with the target trajectory.'
        };
      case 'at-risk':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          label: 'At Risk',
          message: 'You are slightly behind target. Consider reviewing your reduction initiatives.'
        };
      case 'off-track':
        return {
          icon: TrendingUp,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: 'Off Track',
          message: 'Significant gap detected. Replanning recommended to get back on track.'
        };
      default:
        return {
          icon: Info,
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-800',
          label: 'Pending',
          message: 'Awaiting emissions data to calculate trajectory.'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Emissions Trajectory
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {target.name} - {target.baseline_year} to {target.target_year}
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
              <div className="flex items-center justify-center h-96">
                <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto" />
                  <p className="text-gray-400">Generating trajectory...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Status Banner */}
                <div className={`${statusInfo.bg} border border-current rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    <StatusIcon className={`w-6 h-6 ${statusInfo.color} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <h3 className={`font-semibold ${statusInfo.color} mb-1`}>
                        {statusInfo.label}
                      </h3>
                      <p className={`text-sm ${statusInfo.color}`}>
                        {statusInfo.message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Baseline ({target.baseline_year})</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {target.baseline_emissions.toFixed(1)} tCO2e
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current ({new Date().getFullYear()})</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {target.current_emissions ? `${target.current_emissions.toFixed(1)} tCO2e` : 'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target ({target.target_year})</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {target.target_emissions.toFixed(1)} tCO2e
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Required Reduction</div>
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {target.reduction_percentage ? `${target.reduction_percentage.toFixed(1)}%` : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Waterfall Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Emissions Trajectory (Waterfall)</h4>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={trajectoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                      <XAxis
                        dataKey="name"
                        stroke="#9CA3AF"
                        style={{ fontSize: '11px' }}
                        interval={0}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        style={{ fontSize: '12px' }}
                        label={{ value: 'Emissions (tCO2e)', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }}
                        formatter={(value: number, name: string, props: any) => {
                          if (name === 'base') return null;
                          return [`${props.payload.label} tCO2e`, 'Value'];
                        }}
                      />
                      {/* Invisible base bars to create waterfall effect */}
                      <Bar dataKey="base" stackId="a" fill="transparent" />
                      {/* Visible value bars */}
                      <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                        {trajectoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.isRequiredReduction ? '#10b981' :  // green for reductions
                              entry.isTarget ? '#3b82f6' :             // blue for target points
                              entry.isGap ? '#ef4444' :                // red for gap
                              entry.isActual ? '#f97316' :             // orange for actual
                              '#6b7280'                                // gray for baseline
                            }
                          />
                        ))}
                        <LabelList
                          dataKey="label"
                          position="top"
                          style={{ fill: '#9CA3AF', fontSize: '11px', fontWeight: 'bold' }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend Explanation */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-200">
                      <p className="font-semibold mb-2">How to read this waterfall chart:</p>
                      <ul className="space-y-1 text-blue-800 dark:text-blue-300">
                        <li>• <strong className="text-gray-600 dark:text-gray-400">Gray bar</strong>: Baseline emissions ({target.baseline_year})</li>
                        <li>• <strong className="text-green-600 dark:text-green-400">Green bars</strong>: Required reductions (downward movement)</li>
                        <li>• <strong className="text-blue-600 dark:text-blue-400">Blue bars</strong>: Target trajectory points</li>
                        <li>• <strong className="text-red-600 dark:text-red-400">Red bar</strong>: Gap from required trajectory (shows you're off track)</li>
                        <li>• <strong className="text-orange-600 dark:text-orange-400">Orange bar</strong>: Current actual emissions</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Data includes Scope 2 and Scope 3 emissions
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
