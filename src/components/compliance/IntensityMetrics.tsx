'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  TrendingUp,
  DollarSign,
  Square,
  Users,
  Target,
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
  Legend
} from 'recharts';
import { complianceColors } from '@/styles/compliance-design-tokens';

interface IntensityData {
  current_year: number;
  total_emissions: number;
  revenue: number; // in millions
  area: number; // in m²
  employees: number; // FTE
  intensities: {
    revenue: number; // tCO2e/€M
    area: number; // tCO2e/m²
    fte: number; // tCO2e/FTE
  };
  trends: {
    revenue: number; // % change
    area: number;
    fte: number;
  };
  historical: Array<{
    year: number;
    revenue_intensity: number;
    area_intensity: number;
    fte_intensity: number;
  }>;
  targets?: {
    revenue_intensity_target?: number;
    target_year?: number;
  };
}

interface IntensityMetricsProps {
  data: IntensityData;
}

export function IntensityMetrics({ data }: IntensityMetricsProps) {
  const metrics = [
    {
      id: 'revenue',
      label: 'Revenue Intensity',
      value: data.intensities.revenue,
      unit: 'tCO₂e/€M',
      trend: data.trends.revenue,
      icon: DollarSign,
      color: complianceColors.primary[600],
      bgColor: complianceColors.primary[100],
      description: 'Emissions per million euros of revenue',
      gri: 'GRI 305-4',
      denominator: `€${data.revenue.toFixed(1)}M revenue`
    },
    {
      id: 'area',
      label: 'Area Intensity',
      value: data.intensities.area,
      unit: 'tCO₂e/m²',
      trend: data.trends.area,
      icon: Square,
      color: complianceColors.teal[600],
      bgColor: complianceColors.teal[100],
      description: 'Emissions per square meter of floor area',
      gri: 'GRI 305-4',
      denominator: `${data.area.toLocaleString()} m² total area`
    },
    {
      id: 'fte',
      label: 'Employee Intensity',
      value: data.intensities.fte,
      unit: 'tCO₂e/FTE',
      trend: data.trends.fte,
      icon: Users,
      color: complianceColors.green[600],
      bgColor: complianceColors.green[100],
      description: 'Emissions per full-time equivalent employee',
      gri: 'GRI 305-4',
      denominator: `${data.employees} FTE employees`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          GHG Emissions Intensity Metrics
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          GRI 305-4: Normalized emissions for comparability across time and organizations
        </p>
      </div>

      {/* Intensity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          const isImprovement = metric.trend < 0;

          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-5 shadow-sm"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: metric.bgColor }}
                  >
                    <Icon className="w-5 h-5" style={{ color: metric.color }} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {metric.label}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{metric.gri}</p>
                  </div>
                </div>
              </div>

              {/* Value */}
              <div className="mb-3">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metric.value.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{metric.unit}</p>
              </div>

              {/* Trend */}
              <div className="flex items-center gap-2 mb-3">
                {isImprovement ? (
                  <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={`text-sm font-medium ${
                    isImprovement
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isImprovement ? '' : '+'}
                  {metric.trend.toFixed(1)}% vs prior year
                </span>
              </div>

              {/* Description */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {metric.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {data.total_emissions.toFixed(1)} tCO₂e ÷ {metric.denominator}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Historical Trend Chart */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Intensity Trends Over Time
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Historical intensity metrics normalized for growth
            </p>
          </div>
          {data.targets?.revenue_intensity_target && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">
                Target: {data.targets.revenue_intensity_target.toFixed(2)} tCO₂e/€M by{' '}
                {data.targets.target_year}
              </span>
            </div>
          )}
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.historical}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis
              dataKey="year"
              tick={{ fill: '#64748B', fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: '#64748B', fontSize: 12 }}
              label={{
                value: 'Intensity (tCO₂e)',
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
                  revenue_intensity: 'Revenue Intensity (tCO₂e/€M)',
                  area_intensity: 'Area Intensity (tCO₂e/m²)',
                  fte_intensity: 'Employee Intensity (tCO₂e/FTE)'
                };
                return [value.toFixed(2), labels[name] || name];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const labels: any = {
                  revenue_intensity: 'Revenue',
                  area_intensity: 'Area',
                  fte_intensity: 'Employees'
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue_intensity"
              stroke={complianceColors.primary[600]}
              strokeWidth={2}
              dot={{ fill: complianceColors.primary[600], r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="area_intensity"
              stroke={complianceColors.teal[600]}
              strokeWidth={2}
              dot={{ fill: complianceColors.teal[600], r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="fte_intensity"
              stroke={complianceColors.green[600]}
              strokeWidth={2}
              dot={{ fill: complianceColors.green[600], r: 4 }}
              activeDot={{ r: 6 }}
            />
            {/* Target line if available */}
            {data.targets?.revenue_intensity_target && (
              <Line
                type="monotone"
                dataKey={() => data.targets!.revenue_intensity_target}
                stroke={complianceColors.charts.target.line}
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Interpretation Guide */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">
              Why Intensity Metrics Matter
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>
                • <span className="font-semibold">Comparability:</span> Intensity metrics enable
                fair comparison across organizations of different sizes
              </li>
              <li>
                • <span className="font-semibold">Growth decoupling:</span> Track whether emissions
                are decoupling from business growth (improving efficiency)
              </li>
              <li>
                • <span className="font-semibold">Target setting:</span> Science-based targets
                often use intensity metrics to account for business expansion
              </li>
              <li>
                • <span className="font-semibold">GRI requirement:</span> GRI 305-4 mandates
                reporting at least one intensity ratio relevant to your organization
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Calculation Transparency */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">
          Calculation Methodology
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">Revenue Intensity</p>
            <p className="font-mono text-gray-900 dark:text-white">
              {data.total_emissions.toFixed(1)} tCO₂e ÷ €{data.revenue.toFixed(1)}M ={' '}
              {data.intensities.revenue.toFixed(2)} tCO₂e/€M
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">Area Intensity</p>
            <p className="font-mono text-gray-900 dark:text-white">
              {data.total_emissions.toFixed(1)} tCO₂e ÷ {data.area.toLocaleString()} m² ={' '}
              {data.intensities.area.toFixed(4)} tCO₂e/m²
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 mb-1">Employee Intensity</p>
            <p className="font-mono text-gray-900 dark:text-white">
              {data.total_emissions.toFixed(1)} tCO₂e ÷ {data.employees} FTE ={' '}
              {data.intensities.fte.toFixed(2)} tCO₂e/FTE
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
