'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { complianceColors } from '@/styles/compliance-design-tokens';

interface TrajectoryPoint {
  year: number;
  actual?: number;
  projected?: number;
  target?: number;
  scope_1?: number;
  scope_2?: number;
  scope_3?: number;
}

interface EmissionsTrajectoryProps {
  baseYear: number;
  baseYearEmissions: number;
  currentYear: number;
  currentEmissions: number;
  targetYear: number;
  targetEmissions: number;
  targetType: 'absolute' | 'intensity' | 'sbti';
  trajectoryData: TrajectoryPoint[];
  targetDescription?: string;
  isOnTrack: boolean;
  gapToTarget?: number;
}

export function EmissionsTrajectory({
  baseYear,
  baseYearEmissions,
  currentYear,
  currentEmissions,
  targetYear,
  targetEmissions,
  targetType,
  trajectoryData,
  targetDescription,
  isOnTrack,
  gapToTarget
}: EmissionsTrajectoryProps) {
  const totalReductionNeeded = baseYearEmissions - targetEmissions;
  const reductionPercentage = (totalReductionNeeded / baseYearEmissions) * 100;
  const achievedReduction = baseYearEmissions - currentEmissions;
  const achievedPercentage = (achievedReduction / baseYearEmissions) * 100;
  const remainingReduction = targetEmissions - currentEmissions;
  const yearsRemaining = targetYear - currentYear;
  const annualReductionNeeded = yearsRemaining > 0 ? remainingReduction / yearsRemaining : 0;

  const targetTypeLabels = {
    absolute: 'Absolute Reduction',
    intensity: 'Intensity-Based',
    sbti: 'Science-Based Target (SBTi)'
  };

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Base Year */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Base Year</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{baseYear}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {baseYearEmissions.toLocaleString()} tCO₂e
          </p>
        </motion.div>

        {/* Current Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Current ({currentYear})</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currentEmissions.toLocaleString()}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            -{achievedPercentage.toFixed(1)}% vs base year
          </p>
        </motion.div>

        {/* Target */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">Target ({targetYear})</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {targetEmissions.toLocaleString()}
          </p>
          <p className="text-sm text-purple-600 dark:text-purple-400">
            -{reductionPercentage.toFixed(1)}% reduction goal
          </p>
        </motion.div>

        {/* Progress Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`border rounded-xl p-4 shadow-sm ${
            isOnTrack
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
              : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {isOnTrack ? (
              <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            )}
            <span
              className={`text-xs ${
                isOnTrack
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              Track Status
            </span>
          </div>
          <p
            className={`text-2xl font-bold ${
              isOnTrack
                ? 'text-green-700 dark:text-green-300'
                : 'text-amber-700 dark:text-amber-300'
            }`}
          >
            {isOnTrack ? 'On Track' : 'Off Track'}
          </p>
          {gapToTarget && !isOnTrack && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {gapToTarget.toLocaleString()} tCO₂e gap
            </p>
          )}
        </motion.div>
      </div>

      {/* Trajectory Chart */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Emissions Reduction Trajectory
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {targetTypeLabels[targetType]}
                {targetDescription && ` • ${targetDescription}`}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded" />
                <span className="text-gray-600 dark:text-gray-400">Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-purple-600 rounded opacity-50" />
                <span className="text-gray-600 dark:text-gray-400">Projected</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-0.5 bg-red-600" style={{ width: '12px' }} />
                <span className="text-gray-600 dark:text-gray-400">Target</span>
              </div>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={trajectoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              label={{
                value: 'Emissions (tCO₂e)',
                angle: -90,
                position: 'insideLeft',
                style: { fill: '#64748B', fontSize: 12 }
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: any, name: string) => {
                const labels: any = {
                  actual: 'Actual Emissions',
                  projected: 'Projected Emissions',
                  target: 'Target Emissions',
                  scope_1: 'Scope 1',
                  scope_2: 'Scope 2',
                  scope_3: 'Scope 3'
                };
                return [
                  `${typeof value === 'number' ? value.toLocaleString() : value} tCO₂e`,
                  labels[name] || name
                ];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: any = {
                  actual: 'Actual',
                  projected: 'Projected',
                  target: 'Target Path'
                };
                return labels[value] || value;
              }}
            />

            {/* Base year reference line */}
            <ReferenceLine
              y={baseYearEmissions}
              stroke={complianceColors.gray300}
              strokeDasharray="3 3"
              label={{
                value: `Base Year (${baseYear})`,
                position: 'insideTopRight',
                fill: '#64748B',
                fontSize: 10
              }}
            />

            {/* Actual emissions (solid line) */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke={complianceColors.primary[600]}
              strokeWidth={3}
              dot={{ fill: complianceColors.primary[600], r: 5 }}
              activeDot={{ r: 7 }}
              connectNulls={false}
            />

            {/* Projected emissions (dashed line) */}
            <Line
              type="monotone"
              dataKey="projected"
              stroke={complianceColors.primary[600]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: complianceColors.primary[400], r: 4 }}
              opacity={0.6}
              connectNulls={false}
            />

            {/* Target trajectory (red dashed) */}
            <Line
              type="monotone"
              dataKey="target"
              stroke={complianceColors.charts.target.line}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: complianceColors.charts.target.line, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Reduction Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Achieved vs Required */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5 shadow-sm">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-4">Progress Analysis</h5>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Achieved Reduction</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {achievedReduction.toLocaleString()} tCO₂e
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(achievedReduction / totalReductionNeeded) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {((achievedReduction / totalReductionNeeded) * 100).toFixed(1)}% of total reduction needed
              </p>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Remaining Reduction</span>
                <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {Math.abs(remainingReduction).toLocaleString()} tCO₂e
                </span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500"
                  style={{
                    width: `${(Math.abs(remainingReduction) / totalReductionNeeded) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Over {yearsRemaining} years ({Math.abs(annualReductionNeeded).toFixed(0)} tCO₂e/year needed)
              </p>
            </div>
          </div>
        </div>

        {/* Annual Reduction Rate */}
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5 shadow-sm">
          <h5 className="font-semibold text-gray-900 dark:text-white mb-4">
            Required Annual Reduction Rate
          </h5>
          <div className="flex items-end gap-4 mb-4">
            <div>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                {((Math.abs(annualReductionNeeded) / currentEmissions) * 100).toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">per year</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To reach target by {targetYear}
              </p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Calculation:</span>{' '}
              {Math.abs(remainingReduction).toLocaleString()} tCO₂e ÷ {yearsRemaining} years ={' '}
              {Math.abs(annualReductionNeeded).toFixed(0)} tCO₂e/year
            </p>
          </div>
        </div>
      </div>

      {/* Guidance */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">
              Target Setting Best Practices
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>
                • <span className="font-semibold">GHG Protocol:</span> Define base year, target
                year, scopes covered, and recalculation policy
              </li>
              <li>
                • <span className="font-semibold">SBTi alignment:</span> Targets should align
                with 1.5°C pathway (4.2% annual reduction for Scope 1+2)
              </li>
              <li>
                • <span className="font-semibold">Interim milestones:</span> Set 5-year interim
                targets to track progress and adjust strategies
              </li>
              <li>
                • <span className="font-semibold">Transparency:</span> Disclose assumptions,
                methodologies, and any changes to trajectory
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
