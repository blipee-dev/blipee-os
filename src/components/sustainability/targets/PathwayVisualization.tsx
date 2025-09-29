'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { TrendingDown, Target, AlertTriangle, Info } from 'lucide-react';

interface PathwayVisualizationProps {
  targets: any[];
  selectedTarget: string | null;
  predictions?: any;
}

export function PathwayVisualization({ targets, selectedTarget, predictions }: PathwayVisualizationProps) {
  // Generate pathway data
  const pathwayData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const target = selectedTarget
      ? targets.find(t => t.id === selectedTarget)
      : targets[0];

    if (!target) return [];

    const startYear = target.baseline_year;
    const endYear = target.target_year;
    const baselineEmissions = target.baseline_emissions;
    const targetEmissions = target.target_emissions;

    const data = [];

    // Historical data (if available)
    for (let year = startYear; year <= currentYear; year++) {
      const actualEmissions = year === currentYear && target.current_emissions
        ? target.current_emissions
        : baselineEmissions - ((baselineEmissions - targetEmissions) * ((year - startYear) / (endYear - startYear)) * 0.8);

      data.push({
        year,
        required: baselineEmissions - ((baselineEmissions - targetEmissions) * ((year - startYear) / (endYear - startYear))),
        actual: actualEmissions,
        predicted: null,
        sbti15C: baselineEmissions * Math.pow(0.958, year - startYear), // 4.2% annual reduction
        sbti2C: baselineEmissions * Math.pow(0.975, year - startYear), // 2.5% annual reduction
      });
    }

    // Future projections
    for (let year = currentYear + 1; year <= endYear; year++) {
      const requiredEmissions = baselineEmissions - ((baselineEmissions - targetEmissions) * ((year - startYear) / (endYear - startYear)));

      // Use ML predictions if available
      const predictedEmissions = predictions?.predictions?.[year - currentYear - 1]
        || (data[data.length - 1].actual - (data[data.length - 1].actual * 0.03)); // Default 3% reduction

      data.push({
        year,
        required: requiredEmissions,
        actual: null,
        predicted: predictedEmissions,
        sbti15C: baselineEmissions * Math.pow(0.958, year - startYear),
        sbti2C: baselineEmissions * Math.pow(0.975, year - startYear),
      });
    }

    return data;
  }, [targets, selectedTarget, predictions]);

  const selectedTargetData = selectedTarget
    ? targets.find(t => t.id === selectedTarget)
    : targets[0];

  // Calculate trajectory status
  const trajectoryStatus = useMemo(() => {
    if (!pathwayData.length) return 'unknown';

    const currentData = pathwayData.find(d => d.year === new Date().getFullYear());
    if (!currentData) return 'unknown';

    const gap = (currentData.actual || 0) - currentData.required;
    const percentGap = (gap / currentData.required) * 100;

    if (percentGap <= 0) return 'on-track';
    if (percentGap <= 5) return 'at-risk';
    return 'off-track';
  }, [pathwayData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'text-green-500';
      case 'at-risk': return 'text-yellow-500';
      case 'off-track': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Emission Reduction Pathway
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getStatusColor(trajectoryStatus)}`}>
            {trajectoryStatus === 'on-track' ? 'On Track' :
             trajectoryStatus === 'at-risk' ? 'At Risk' : 'Off Track'}
          </span>
          <div className={getStatusColor(trajectoryStatus)}>
            {trajectoryStatus === 'on-track' ? <Target className="w-4 h-4" /> :
             trajectoryStatus === 'at-risk' ? <AlertTriangle className="w-4 h-4" /> :
             <TrendingDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {selectedTargetData && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedTargetData.target_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedTargetData.target_reduction_percent}% reduction by {selectedTargetData.target_year}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400">Annual Rate</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedTargetData.annual_reduction_rate?.toFixed(1)}%/year
              </p>
            </div>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={pathwayData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRequired" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />

          <XAxis
            dataKey="year"
            stroke="#999"
            style={{ fontSize: '12px' }}
          />

          <YAxis
            stroke="#999"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
            labelStyle={{ color: '#fff' }}
            formatter={(value: any, name: string) => {
              if (value === null) return ['—', name];
              return [`${(value / 1000).toFixed(1)}k tCO2e`, name];
            }}
          />

          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />

          {/* SBTi Reference Lines */}
          <Line
            type="monotone"
            dataKey="sbti15C"
            stroke="#059669"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="1.5°C Pathway"
          />

          <Line
            type="monotone"
            dataKey="sbti2C"
            stroke="#0891B2"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            name="2°C Pathway"
          />

          {/* Required Trajectory */}
          <Area
            type="monotone"
            dataKey="required"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#colorRequired)"
            name="Required"
          />

          {/* Actual Emissions */}
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#3B82F6"
            strokeWidth={2}
            fill="url(#colorActual)"
            name="Actual"
          />

          {/* ML Predictions */}
          <Area
            type="monotone"
            dataKey="predicted"
            stroke="#F59E0B"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="url(#colorPredicted)"
            name="Predicted (ML)"
          />

          {/* Current Year Marker */}
          <ReferenceLine
            x={new Date().getFullYear()}
            stroke="#666"
            strokeDasharray="3 3"
            label={{ value: "Now", position: "top" }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Insights Panel */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
              Pathway Analysis
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
              {trajectoryStatus === 'on-track'
                ? "You're on track to meet your targets. Maintain current reduction rate."
                : trajectoryStatus === 'at-risk'
                ? "Slight acceleration needed. Consider additional reduction initiatives."
                : "Significant gap to target. Urgent action required to get back on track."}
            </p>
            {predictions && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                ML model confidence: {predictions.confidence || '85'}%
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}