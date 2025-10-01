'use client';

import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target } from 'lucide-react';
import { GHG_PROTOCOL_COLORS, getScopeColor } from '@/lib/constants/ghg-colors';

interface EmissionsTrendProps {
  historicalData: any[];
  forecastData: any[];
  selectedMetric: string;
  onMetricChange: (metric: string) => void;
  totalAreaM2?: number;
  scope1Forecast?: number[];
  scope2Forecast?: number[];
  scope3Forecast?: number[];
  sbtiTarget?: {
    reductionPercent: number;
    baselineYear: number;
    targetYear: number;
    ambition: string;
  } | null;
}

export function EmissionsTrend({
  historicalData,
  forecastData,
  selectedMetric,
  onMetricChange,
  totalAreaM2 = 0,
  scope1Forecast = [],
  scope2Forecast = [],
  scope3Forecast = [],
  sbtiTarget
}: EmissionsTrendProps) {
  // Debug logging
  console.log('📊 EmissionsTrend Debug:', {
    totalAreaM2,
    historicalDataSample: historicalData.slice(0, 2).map(d => ({
      month: d.month,
      total: d.total,
      intensity: d.intensity
    })),
    selectedMetric
  });

  // Calculate SBTi target trajectory with seasonality
  const calculateSBTiTrajectory = () => {
    if (historicalData.length === 0) return [];

    // Calculate historical seasonal patterns
    const monthlyPatterns: Record<string, number[]> = {};
    historicalData.forEach(d => {
      const month = d.month;
      if (!monthlyPatterns[month]) monthlyPatterns[month] = [];
      monthlyPatterns[month].push(d.total);
    });

    // Calculate average seasonal multipliers
    const seasonalMultipliers: Record<string, number> = {};
    const overallAverage = historicalData.reduce((sum, d) => sum + d.total, 0) / historicalData.length;

    Object.entries(monthlyPatterns).forEach(([month, values]) => {
      const monthAverage = values.reduce((sum, val) => sum + val, 0) / values.length;
      seasonalMultipliers[month] = monthAverage / overallAverage;
    });

    // Use organization-specific target or default values
    const baselineData = historicalData[0];
    const baselineYear = sbtiTarget?.baselineYear || parseInt(baselineData.year || '2022');
    const targetYear = sbtiTarget?.targetYear || 2030;
    const targetReduction = sbtiTarget?.reductionPercent ? sbtiTarget.reductionPercent / 100 : 0.42; // Convert percentage to decimal

    // Calculate annual baseline (sum of 12 months with seasonal patterns)
    const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const annualBaseline = monthOrder.reduce((sum, month) => {
      const multiplier = seasonalMultipliers[month] || 1;
      return sum + (overallAverage * multiplier);
    }, 0);

    const annualTarget = annualBaseline * (1 - targetReduction);

    // Calculate yearly reduction rate
    const yearsToTarget = targetYear - baselineYear;
    const annualReductionRate = (annualBaseline - annualTarget) / yearsToTarget;

    // Generate trajectory maintaining seasonal patterns
    const trajectory = [];

    // Historical period
    historicalData.forEach((d, index) => {
      const yearsSinceBaseline = (index / 12);
      const targetAnnualLevel = annualBaseline - (annualReductionRate * yearsSinceBaseline);
      const seasonalMultiplier = seasonalMultipliers[d.month] || 1;
      const monthlyTarget = (targetAnnualLevel / 12) * seasonalMultiplier;

      trajectory.push({
        month: d.month,
        year: d.year,
        sbti_target: Math.max(monthlyTarget, annualTarget / 12) // Don't go below final target
      });
    });

    // Forecast period
    forecastData.forEach((d, index) => {
      const totalMonthsFromBaseline = historicalData.length + index;
      const yearsSinceBaseline = totalMonthsFromBaseline / 12;
      const targetAnnualLevel = annualBaseline - (annualReductionRate * yearsSinceBaseline);
      const seasonalMultiplier = seasonalMultipliers[d.month] || 1;
      const monthlyTarget = (targetAnnualLevel / 12) * seasonalMultiplier;

      trajectory.push({
        month: d.month,
        year: d.year,
        sbti_target: Math.max(monthlyTarget, annualTarget / 12)
      });
    });

    // Debug logging for seasonal SBTi calculation
    if (trajectory.length > 0) {
      console.log('🎯 SBTi Seasonal Target Analysis:', {
        seasonalMultipliers,
        annualBaseline: annualBaseline.toFixed(1),
        annualTarget: annualTarget.toFixed(1),
        sampleTargets: trajectory.slice(-3).map(t => ({
          month: t.month,
          target: t.sbti_target.toFixed(1)
        }))
      });
    }

    return trajectory;
  };

  const sbtiTrajectory = calculateSBTiTrajectory();

  // Combine historical and forecast data with separate fields
  const combinedData = [
    ...historicalData.map((d, index) => ({
      ...d,
      type: 'historical',
      historical_total: d.total,
      // Use intensity from API if available, otherwise calculate with real area
      historical_intensity: d.intensity || (totalAreaM2 > 0 ? (d.total * 1000) / totalAreaM2 : 0),
      forecast_total: null,
      forecast_intensity: null,
      sbti_target: sbtiTrajectory[index]?.sbti_target || null
    })),
    ...forecastData.map((d, index) => ({
      month: d.month,
      year: d.year,
      total: d.predicted,
      // Use actual scope forecasts from ML model
      scope1: scope1Forecast[index] || 0,
      scope2: scope2Forecast[index] || 0,
      scope3: scope3Forecast[index] || 0,
      // Calculate intensity with real area (predicted is in tons, convert to kg)
      intensity: totalAreaM2 > 0 ? (d.predicted * 1000) / totalAreaM2 : 0,
      lower_bound: d.lower_bound,
      upper_bound: d.upper_bound,
      type: 'forecast',
      historical_total: null,
      historical_intensity: null,
      forecast_total: d.predicted,
      forecast_intensity: totalAreaM2 > 0 ? (d.predicted * 1000) / totalAreaM2 : 0,
      sbti_target: sbtiTrajectory[historicalData.length + index]?.sbti_target || null
    }))
  ];

  const currentMonthIndex = historicalData.length - 1;

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
          <p className="text-white font-semibold">
            {data.month} {data.year}
          </p>
          {data.type === 'historical' ? (
            <>
              <p className="text-sm text-gray-300">
                Total: {data.total.toFixed(1)} tCO2e
              </p>
              {selectedMetric === 'breakdown' && (
                <>
                  <p className="text-xs text-red-400">
                    Scope 1: {data.scope1.toFixed(1)} tCO2e
                  </p>
                  <p className="text-xs text-orange-400">
                    Scope 2: {data.scope2.toFixed(1)} tCO2e
                  </p>
                  <p className="text-xs text-blue-400">
                    Scope 3: {data.scope3.toFixed(1)} tCO2e
                  </p>
                </>
              )}
            </>
          ) : (
            <>
              <p className="text-sm text-green-300">
                Forecast: {data.total.toFixed(1)} tCO2e
              </p>
              <p className="text-xs text-gray-400">
                Range: {data.lower_bound?.toFixed(1)} - {data.upper_bound?.toFixed(1)}
              </p>
            </>
          )}
          {selectedMetric === 'intensity' && (
            <p className="text-xs text-gray-400">
              Intensity: {(data.intensity || data.historical_intensity || data.forecast_intensity || 0).toFixed(1)} kgCO2e/m²
            </p>
          )}
          {selectedMetric === 'absolute' && data.sbti_target && (
            <p className="text-xs text-red-400">
              SBTi Target: {data.sbti_target.toFixed(1)} tCO2e
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (selectedMetric === 'breakdown') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              {/* GHG Protocol Official Colors */}
              <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GHG_PROTOCOL_COLORS.scope1.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={GHG_PROTOCOL_COLORS.scope1.primary} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GHG_PROTOCOL_COLORS.scope2.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={GHG_PROTOCOL_COLORS.scope2.primary} stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorScope3" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GHG_PROTOCOL_COLORS.scope3.primary} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={GHG_PROTOCOL_COLORS.scope3.primary} stopOpacity={0.1}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />

            <XAxis
              dataKey="month"
              stroke="#999"
              style={{ fontSize: '12px' }}
            />

            <YAxis
              stroke="#999"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value.toFixed(1)}`}
            />

            <Tooltip content={<CustomTooltip />} />


            <Area
              type="monotone"
              dataKey="scope3"
              stackId="1"
              stroke={GHG_PROTOCOL_COLORS.scope3.primary}
              fill="url(#colorScope3)"
              name="Scope 3"
            />
            <Area
              type="monotone"
              dataKey="scope2"
              stackId="1"
              stroke={GHG_PROTOCOL_COLORS.scope2.primary}
              fill="url(#colorScope2)"
              name="Scope 2"
            />
            <Area
              type="monotone"
              dataKey="scope1"
              stackId="1"
              stroke={GHG_PROTOCOL_COLORS.scope1.primary}
              fill="url(#colorScope1)"
              name="Scope 1"
            />

            {/* Current month marker */}
            <ReferenceLine
              x={historicalData[currentMonthIndex]?.month}
              stroke="#666"
              strokeDasharray="3 3"
              label={{ value: "Now", position: "top" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={combinedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />

          <XAxis
            dataKey="month"
            stroke="#999"
            style={{ fontSize: '12px' }}
          />

          <YAxis
            stroke="#999"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) =>
              selectedMetric === 'intensity' ? value.toFixed(1) : value.toFixed(1)
            }
          />

          <Tooltip content={<CustomTooltip />} />


          {/* Historical line */}
          <Line
            type="monotone"
            dataKey={selectedMetric === 'intensity' ? 'historical_intensity' : 'historical_total'}
            stroke={GHG_PROTOCOL_COLORS.historical.primary}
            strokeWidth={2}
            dot={{ r: 3, fill: GHG_PROTOCOL_COLORS.historical.primary }}
            name="Historical"
            connectNulls={false}
          />

          {/* Forecast line */}
          <Line
            type="monotone"
            dataKey={selectedMetric === 'intensity' ? 'forecast_intensity' : 'forecast_total'}
            stroke={GHG_PROTOCOL_COLORS.forecast.primary}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 3, fill: GHG_PROTOCOL_COLORS.forecast.primary }}
            name="Forecast"
            connectNulls={false}
          />

          {/* SBTi Target trajectory */}
          {selectedMetric === 'absolute' && (
            <Line
              type="monotone"
              dataKey="sbti_target"
              stroke={GHG_PROTOCOL_COLORS.target.primary}
              strokeWidth={2}
              strokeDasharray="2 8"
              dot={false}
              name={`SBTi Target (${sbtiTarget ? `-${sbtiTarget.reductionPercent}%` : '-42%'} by ${sbtiTarget?.targetYear || 2030})`}
              connectNulls={false}
            />
          )}

          {/* Confidence bands for forecast */}
          {selectedMetric === 'absolute' && (
            <>
              <Area
                type="monotone"
                dataKey="upper_bound"
                stroke="transparent"
                fill="#3B82F6"
                fillOpacity={0.1}
                connectNulls={false}
              />
              <Area
                type="monotone"
                dataKey="lower_bound"
                stroke="transparent"
                fill="#3B82F6"
                fillOpacity={0.1}
                connectNulls={false}
              />
            </>
          )}

          {/* Current month marker */}
          <ReferenceLine
            x={historicalData[currentMonthIndex]?.month}
            stroke="#666"
            strokeDasharray="3 3"
            label={{ value: "Now", position: "top" }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Calculate trend
  const recentTrend = historicalData.length >= 2
    ? ((historicalData[historicalData.length - 1].total - historicalData[historicalData.length - 2].total) /
       historicalData[historicalData.length - 2].total) * 100
    : 0;

  // Calculate SBTi performance (using seasonal-aware targets)
  const sbtiPerformance = (() => {
    if (historicalData.length === 0 || sbtiTrajectory.length === 0) return null;

    const latestData = historicalData[historicalData.length - 1];
    const latestTarget = sbtiTrajectory[historicalData.length - 1];

    if (!latestData || !latestTarget) return null;

    const isOnTrack = latestData.total <= latestTarget.sbti_target;
    const difference = latestData.total - latestTarget.sbti_target;
    const percentageOff = (difference / latestTarget.sbti_target) * 100;

    // Calculate overall annual performance (rolling 12 months vs target)
    const last12Months = historicalData.slice(-12);
    const last12Targets = sbtiTrajectory.slice(-12);

    const actualAnnual = last12Months.reduce((sum, d) => sum + d.total, 0);
    const targetAnnual = last12Targets.reduce((sum, t) => sum + t.sbti_target, 0);
    const annualPerformance = ((actualAnnual - targetAnnual) / targetAnnual) * 100;

    // Debug logging for SBTi performance
    console.log('🎯 SBTi Performance Calculation:', {
      latestActual: latestData.total.toFixed(2),
      latestTarget: latestTarget.sbti_target.toFixed(2),
      monthlyDifference: difference.toFixed(2),
      monthlyPercentageOff: percentageOff.toFixed(1),
      isOnTrack,
      actualAnnual: actualAnnual.toFixed(1),
      targetAnnual: targetAnnual.toFixed(1),
      annualPerformance: annualPerformance.toFixed(1),
      isAnnualOnTrack: actualAnnual <= targetAnnual
    });

    return {
      isOnTrack,
      difference,
      percentageOff: Math.abs(percentageOff),
      annualPerformance: Math.abs(annualPerformance),
      isAnnualOnTrack: actualAnnual <= targetAnnual
    };
  })();

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Emissions Trend & Forecast
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Historical data with ML-powered predictions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMetricChange('absolute')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedMetric === 'absolute'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300'
            }`}
          >
            Absolute
          </button>
          <button
            onClick={() => onMetricChange('intensity')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedMetric === 'intensity'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300'
            }`}
          >
            Intensity
          </button>
          <button
            onClick={() => onMetricChange('breakdown')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              selectedMetric === 'breakdown'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300'
            }`}
          >
            Breakdown
          </button>
        </div>
      </div>

      {/* Trend Indicator */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {recentTrend < 0 ? (
              <TrendingDown className="w-5 h-5 text-green-500" />
            ) : recentTrend > 0 ? (
              <TrendingUp className="w-5 h-5 text-red-500" />
            ) : (
              <Activity className="w-5 h-5 text-gray-500" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Recent Trend
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Month-over-month change
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold ${
              recentTrend < 0 ? 'text-green-500' : recentTrend > 0 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {recentTrend > 0 ? '+' : ''}{recentTrend.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {historicalData[historicalData.length - 1]?.total.toFixed(1)} tCO2e
            </p>
          </div>
        </div>

        {/* SBTi Performance Indicator */}
        {sbtiPerformance && (
          <div className="border-t border-gray-200 dark:border-white/[0.05] pt-3 space-y-3">
            {/* Monthly Performance */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className={`w-4 h-4 ${sbtiPerformance.isOnTrack ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    SBTi Monthly Target
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {sbtiPerformance.isOnTrack ? 'On track' : 'Behind target'} (seasonal-adjusted)
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  sbtiPerformance.isOnTrack ? 'text-green-500' : 'text-red-500'
                }`}>
                  {sbtiPerformance.isOnTrack ? '-' : '+'}{sbtiPerformance.percentageOff.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  vs monthly target
                </p>
              </div>
            </div>

            {/* Annual Performance (Rolling 12 months) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${sbtiPerformance.isAnnualOnTrack ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Annual Progress
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rolling 12-month performance
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${
                  sbtiPerformance.isAnnualOnTrack ? 'text-green-500' : 'text-red-500'
                }`}>
                  {sbtiPerformance.isAnnualOnTrack ? '-' : '+'}{sbtiPerformance.annualPerformance.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  vs annual target
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      {renderChart()}

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-gray-600"></div>
          <span className="text-gray-500 dark:text-gray-400">Historical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-emerald-600 border-dashed border-t border-emerald-600"></div>
          <span className="text-gray-500 dark:text-gray-400">Forecast</span>
        </div>
        {selectedMetric === 'absolute' && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-red-500 border-dotted border-t-2 border-red-500"></div>
              <span className="text-gray-500 dark:text-gray-400">SBTi Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 opacity-20"></div>
              <span className="text-gray-500 dark:text-gray-400">Confidence Band</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}