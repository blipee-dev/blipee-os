'use client';

/**
 * Firecrawl-Inspired Light Mode Dashboard
 * This is the new design with light-mode-first, single accent color, and generous spacing
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cloud,
  Zap,
  Target,
  TrendingDown,
  TrendingUp,
  Leaf,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useOverviewDashboard } from '@/hooks/useDashboardData';
import { useTranslations } from '@/providers/LanguageProvider';

interface OverviewDashboardLightProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  change?: number;
  trend?: 'up' | 'down';
  projected?: {
    value: number;
    yoy: number;
  };
}

function MetricCard({ icon: Icon, label, value, unit, subtitle, change, trend, projected }: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-green-600" />
        </div>
        <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
          {label}
        </span>
      </div>

      {/* Value - BIG */}
      <div className="mb-1">
        <span className="text-4xl font-medium text-gray-900">{value}</span>
      </div>

      {/* Unit + Change or Subtitle */}
      <div className="flex items-center justify-between">
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}

        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'down' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* Projected (if current year) */}
      {projected && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Projected: {projected.value.toFixed(1)} {unit}</span>
            <div className={`flex items-center gap-1 text-xs font-medium ${
              projected.yoy < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {projected.yoy < 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
              <span>{Math.abs(projected.yoy).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ScopeItem({ scope, value, percentage, color, description }: any) {
  const colorClasses = {
    red: { bg: 'bg-red-500', light: 'bg-red-100', text: 'text-red-600' },
    blue: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-600' },
    gray: { bg: 'bg-gray-500', light: 'bg-gray-100', text: 'text-gray-600' },
  };

  const colors = colorClasses[color as keyof typeof colorClasses];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
          <div>
            <div className="text-sm font-medium text-gray-900">{scope}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{value.toFixed(1)} tCO2e</div>
          <div className="text-xs text-gray-500">{percentage.toFixed(0)}%</div>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colors.bg}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

export function OverviewDashboardLight({ organizationId, selectedSite, selectedPeriod }: OverviewDashboardLightProps) {
  const t = useTranslations('sustainability.dashboard');

  // Fetch data with React Query
  const {
    scopeAnalysis,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    dashboard: dashboardQuery,
    forecast: forecastQuery,
    topMetrics: topMetricsQuery,
    isLoading
  } = useOverviewDashboard(selectedPeriod, selectedSite, organizationId);

  // Process data (simplified version)
  const scopeData = scopeAnalysis.data?.scopeData || scopeAnalysis.data || {};
  const scope1Total = scopeData.scope_1?.total || 0;
  const scope2Total = scopeData.scope_2?.total || 0;
  const scope3Total = scopeData.scope_3?.total || 0;
  const totalEmissions = scope1Total + scope2Total + scope3Total;

  const prevScopeData = prevYearScopeAnalysis.data?.scopeData || prevYearScopeAnalysis.data || {};
  const prevTotal = (prevScopeData.scope_1?.total || 0) + (prevScopeData.scope_2?.total || 0) + (prevScopeData.scope_3?.total || 0);
  const totalYoY = prevTotal > 0 ? ((totalEmissions - prevTotal) / prevTotal) * 100 : 0;

  // Calculate intensity
  const employees = 200; // Default
  const intensityMetric = employees > 0 ? totalEmissions / employees : 0;
  const prevIntensity = employees > 0 ? prevTotal / employees : 0;
  const intensityYoY = prevIntensity > 0 ? ((intensityMetric - prevIntensity) / prevIntensity) * 100 : 0;

  // Forecast data
  const projectedAnnualEmissions = forecastQuery.data?.projectedTotal || 0;
  const fullPrevYearData = fullPrevYearScopeAnalysis.data?.scopeData || fullPrevYearScopeAnalysis.data || {};
  const previousYearTotal = (fullPrevYearData.scope_1?.total || 0) + (fullPrevYearData.scope_2?.total || 0) + (fullPrevYearData.scope_3?.total || 0);
  const projectedYoY = previousYearTotal > 0 ? ((projectedAnnualEmissions - previousYearTotal) / previousYearTotal) * 100 : 0;

  // Monthly trend data
  const monthlyData = dashboardQuery.data?.trendData?.map((m: any) => ({
    month: m.month,
    total: m.emissions || 0,
  })) || [];

  // Top emitters
  const topEmitters = topMetricsQuery.data?.metrics?.slice(0, 5).map((metric: any) => ({
    name: metric.name,
    emissions: metric.emissions,
    percentage: totalEmissions > 0 ? (metric.emissions / totalEmissions) * 100 : 0,
    change: Math.random() > 0.5 ? -(Math.random() * 15) : (Math.random() * 10), // Mock change
  })) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const scopePercentages = {
    scope1: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
    scope2: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
    scope3: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0,
  };

  const currentYear = new Date().getFullYear();
  const isCurrentYear = new Date(selectedPeriod.start).getFullYear() === currentYear;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-green-50 border border-green-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-green-900 mb-1">
              🎨 Firecrawl-Inspired Design
            </h4>
            <p className="text-sm text-green-700">
              You're viewing the new light-mode-first design with generous spacing, single accent color (green),
              and minimal borders. Toggle back to compare with the current dark design.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Cloud}
          label={isCurrentYear ? "Total Emissions YTD" : "Total Emissions"}
          value={totalEmissions.toFixed(1)}
          unit="tCO2e"
          change={totalYoY}
          trend={totalYoY < 0 ? 'down' : 'up'}
          projected={isCurrentYear && projectedAnnualEmissions > 0 ? {
            value: projectedAnnualEmissions,
            yoy: projectedYoY
          } : undefined}
        />
        <MetricCard
          icon={Zap}
          label="Emissions Intensity"
          value={intensityMetric.toFixed(2)}
          unit="tCO2e/employee"
          change={intensityYoY}
          trend={intensityYoY < 0 ? 'down' : 'up'}
        />
        <MetricCard
          icon={Target}
          label="Target Progress"
          value="67%"
          subtitle="On track for 2030"
        />
        <MetricCard
          icon={TrendingUp}
          label="Data Quality"
          value="94%"
          subtitle="Primary data"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Emissions Trend
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Monthly emissions over time
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E5E7EB"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9CA3AF"
                  fontSize={12}
                  tickLine={false}
                  label={{
                    value: 'tCO2e',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#6B7280', fontSize: 12 }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Scope Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Emissions by Scope
          </h3>

          <div className="space-y-6">
            <ScopeItem
              scope="Scope 1"
              value={scope1Total}
              percentage={scopePercentages.scope1}
              color="red"
              description="Direct emissions"
            />
            <ScopeItem
              scope="Scope 2"
              value={scope2Total}
              percentage={scopePercentages.scope2}
              color="blue"
              description="Purchased electricity"
            />
            <ScopeItem
              scope="Scope 3"
              value={scope3Total}
              percentage={scopePercentages.scope3}
              color="gray"
              description="Value chain"
            />
          </div>
        </motion.div>
      </div>

      {/* Top Emitters Table */}
      {topEmitters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-xl p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            Top Emission Sources
          </h3>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                  Source
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                  Emissions
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                  % of Total
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topEmitters.map((source: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {source.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-right text-sm text-gray-900">
                    {source.emissions.toFixed(1)} tCO2e
                  </td>
                  <td className="text-right text-sm text-gray-600">
                    {source.percentage.toFixed(1)}%
                  </td>
                  <td className="text-right">
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                      source.change < 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {source.change < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      {Math.abs(source.change).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}
