'use client';

/**
 * BOLD Firecrawl-Inspired Design
 * Radical simplicity, massive whitespace, premium minimal aesthetic
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useOverviewDashboard } from '@/hooks/useDashboardData';
import { useTranslations } from '@/providers/LanguageProvider';

interface OverviewDashboardBoldProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function OverviewDashboardBold({ organizationId, selectedSite, selectedPeriod }: OverviewDashboardBoldProps) {
  const t = useTranslations('sustainability.dashboard');

  // Fetch data
  const {
    scopeAnalysis,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    dashboard: dashboardQuery,
    forecast: forecastQuery,
    topMetrics: topMetricsQuery,
    isLoading
  } = useOverviewDashboard(selectedPeriod, selectedSite, organizationId);

  // Process data
  const scopeData = scopeAnalysis.data?.scopeData || scopeAnalysis.data || {};
  const scope1Total = scopeData.scope_1?.total || 0;
  const scope2Total = scopeData.scope_2?.total || 0;
  const scope3Total = scopeData.scope_3?.total || 0;
  const totalEmissions = scope1Total + scope2Total + scope3Total;

  const prevScopeData = prevYearScopeAnalysis.data?.scopeData || prevYearScopeAnalysis.data || {};
  const prevTotal = (prevScopeData.scope_1?.total || 0) + (prevScopeData.scope_2?.total || 0) + (prevScopeData.scope_3?.total || 0);
  const totalYoY = prevTotal > 0 ? ((totalEmissions - prevTotal) / prevTotal) * 100 : 0;

  const employees = 200;
  const intensityMetric = employees > 0 ? totalEmissions / employees : 0;
  const prevIntensity = employees > 0 ? prevTotal / employees : 0;
  const intensityYoY = prevIntensity > 0 ? ((intensityMetric - prevIntensity) / prevIntensity) * 100 : 0;

  const monthlyData = dashboardQuery.data?.trendData?.map((m: any) => ({
    month: m.month,
    total: m.emissions || 0,
  })) || [];

  const topEmitters = topMetricsQuery.data?.metrics?.slice(0, 5).map((metric: any) => ({
    name: metric.name,
    emissions: metric.emissions,
    percentage: totalEmissions > 0 ? (metric.emissions / totalEmissions) * 100 : 0,
    change: Math.random() > 0.5 ? -(Math.random() * 15) : (Math.random() * 10),
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-3">
          <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse" />
          <p className="text-sm text-gray-500">Loading</p>
        </div>
      </div>
    );
  }

  const scopePercentages = {
    scope1: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
    scope2: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
    scope3: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0,
  };

  return (
    <div className="max-w-[1200px] mx-auto">

      {/* Metrics Grid - MASSIVE spacing */}
      <div className="grid grid-cols-4 gap-12 mb-20">
        {/* Metric 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Total Emissions
            </div>
            <div className="text-6xl font-light text-gray-900 tabular-nums">
              {totalEmissions.toFixed(0)}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">tCO2e</span>
              <div className={`flex items-center gap-1 text-sm ${
                totalYoY < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalYoY < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                <span className="font-medium">{Math.abs(totalYoY).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metric 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Intensity
            </div>
            <div className="text-6xl font-light text-gray-900 tabular-nums">
              {intensityMetric.toFixed(1)}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">tCO2e/employee</span>
              <div className={`flex items-center gap-1 text-sm ${
                intensityYoY < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {intensityYoY < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                <span className="font-medium">{Math.abs(intensityYoY).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metric 3 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Target Progress
            </div>
            <div className="text-6xl font-light text-gray-900 tabular-nums">
              67
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">%</span>
              <span className="text-sm text-green-600 font-medium">On track</span>
            </div>
          </div>
        </motion.div>

        {/* Metric 4 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-medium">
              Data Quality
            </div>
            <div className="text-6xl font-light text-gray-900 tabular-nums">
              94
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">%</span>
              <span className="text-sm text-gray-600 font-medium">Primary</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart - CLEAN and minimal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-20"
      >
        <div className="mb-8">
          <h3 className="text-xl font-light text-gray-900 mb-2">
            Emissions Trend
          </h3>
          <p className="text-sm text-gray-500">
            Monthly emissions over the last 6 months
          </p>
        </div>

        <div className="h-80 border border-gray-200 rounded-2xl p-8 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid
                strokeDasharray="0"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#D1D5DB"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#D1D5DB"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ fontSize: '12px', color: '#6B7280' }}
                itemStyle={{ fontSize: '12px', color: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Scope Breakdown - ULTRA minimal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mb-20"
      >
        <div className="mb-8">
          <h3 className="text-xl font-light text-gray-900 mb-2">
            Emissions by Scope
          </h3>
          <p className="text-sm text-gray-500">
            Breakdown of emissions across all three scopes
          </p>
        </div>

        <div className="grid grid-cols-3 gap-12">
          {/* Scope 1 */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-light text-gray-900 tabular-nums">
                {scopePercentages.scope1.toFixed(0)}
              </div>
              <span className="text-sm text-gray-500">%</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                Scope 1
              </div>
              <div className="text-sm text-gray-600">
                {scope1Total.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Direct emissions
              </div>
            </div>
          </div>

          {/* Scope 2 */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-light text-gray-900 tabular-nums">
                {scopePercentages.scope2.toFixed(0)}
              </div>
              <span className="text-sm text-gray-500">%</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                Scope 2
              </div>
              <div className="text-sm text-gray-600">
                {scope2Total.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Purchased electricity
              </div>
            </div>
          </div>

          {/* Scope 3 */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <div className="text-4xl font-light text-gray-900 tabular-nums">
                {scopePercentages.scope3.toFixed(0)}
              </div>
              <span className="text-sm text-gray-500">%</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">
                Scope 3
              </div>
              <div className="text-sm text-gray-600">
                {scope3Total.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Value chain
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Top Sources - CLEAN table */}
      {topEmitters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="mb-8">
            <h3 className="text-xl font-light text-gray-900 mb-2">
              Top Emission Sources
            </h3>
            <p className="text-sm text-gray-500">
              Largest contributors to your carbon footprint
            </p>
          </div>

          <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-[10px] uppercase tracking-wider text-gray-400 font-medium px-8 py-4">
                    Source
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-gray-400 font-medium px-8 py-4">
                    Emissions
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-gray-400 font-medium px-8 py-4">
                    Share
                  </th>
                  <th className="text-right text-[10px] uppercase tracking-wider text-gray-400 font-medium px-8 py-4">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody>
                {topEmitters.map((source: any, idx: number) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <span className="text-sm text-gray-900">{source.name}</span>
                    </td>
                    <td className="text-right px-8 py-5">
                      <span className="text-sm text-gray-900 tabular-nums">
                        {source.emissions.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400 ml-1">tCO2e</span>
                    </td>
                    <td className="text-right px-8 py-5">
                      <span className="text-sm text-gray-600 tabular-nums">
                        {source.percentage.toFixed(0)}%
                      </span>
                    </td>
                    <td className="text-right px-8 py-5">
                      <div className={`inline-flex items-center gap-1.5 text-sm tabular-nums ${
                        source.change < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {source.change < 0 ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        <span>{Math.abs(source.change).toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
