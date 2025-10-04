'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Info,
  TrendingDown,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';
import { complianceColors, getScope3CategoryColor, getDataQualityColor } from '@/styles/compliance-design-tokens';

interface CategoryData {
  category: number; // 1-15
  name: string;
  value: number;
  included: boolean;
  data_quality: number; // 0-1
  data_source_type: 'primary' | 'secondary' | 'modeled' | 'proxy' | 'industry_average';
  calculation_method: string;
  uncertainty_range?: number;
  primary_data_pct: number;
  secondary_data_pct: number;
  estimated_data_pct: number;
}

interface Scope3DataQualityProps {
  categories: CategoryData[];
  totalScope3: number;
}

const dataSourceLabels = {
  primary: 'Primary Data',
  secondary: 'Secondary Data',
  modeled: 'Modeled',
  proxy: 'Proxy/Extrapolation',
  industry_average: 'Industry Average'
};

const dataSourceColors = {
  primary: complianceColors.dataQuality.high.color,
  secondary: complianceColors.dataQuality.medium.color,
  modeled: complianceColors.dataQuality.medium.color,
  proxy: complianceColors.dataQuality.low.color,
  industry_average: complianceColors.dataQuality.low.color,
};

export function Scope3DataQuality({ categories, totalScope3 }: Scope3DataQualityProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryData | null>(null);

  // Calculate coverage
  const includedCategories = categories.filter(c => c.included);
  const coveragePercent = (includedCategories.length / 15) * 100;

  // Calculate overall data quality score
  const weightedQuality = includedCategories.reduce((sum, cat) => {
    const weight = cat.value / totalScope3;
    return sum + (cat.data_quality * weight);
  }, 0);

  // Prepare chart data - stacked by data quality
  const chartData = includedCategories
    .sort((a, b) => b.value - a.value)
    .map(cat => ({
      category: `Cat ${cat.category}`,
      fullName: cat.name,
      primary: (cat.value * cat.primary_data_pct) / 100,
      secondary: (cat.value * cat.secondary_data_pct) / 100,
      estimated: (cat.value * cat.estimated_data_pct) / 100,
      total: cat.value,
      quality: cat.data_quality,
      uncertainty: cat.uncertainty_range || 0,
    }));

  return (
    <div className="space-y-6">
      {/* Header with Coverage */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Scope 3 Value Chain Emissions
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            15 categories per GHG Protocol Corporate Value Chain Standard
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Category Coverage</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {includedCategories.length}/15
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 dark:text-gray-400">Data Quality</p>
            <p
              className="text-2xl font-bold"
              style={{ color: getDataQualityColor(weightedQuality).color }}
            >
              {(weightedQuality * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Stacked Bar Chart - Data Quality Breakdown */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">
            Emissions by Category & Data Quality
          </h4>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: complianceColors.dataQuality.high.color }} />
              <span className="text-gray-600 dark:text-gray-400">Primary</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: complianceColors.dataQuality.medium.color }} />
              <span className="text-gray-600 dark:text-gray-400">Secondary</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: complianceColors.dataQuality.low.color }} />
              <span className="text-gray-600 dark:text-gray-400">Estimated</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis type="number" tick={{ fill: '#64748B', fontSize: 11 }} />
            <YAxis dataKey="category" type="category" tick={{ fill: '#64748B', fontSize: 11 }} width={60} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl">
                    <p className="font-semibold text-white text-sm mb-2">{data.fullName}</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Primary data:</span>
                        <span className="text-green-400 font-medium">{data.primary.toFixed(1)} tCO₂e</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Secondary data:</span>
                        <span className="text-amber-400 font-medium">{data.secondary.toFixed(1)} tCO₂e</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Estimated:</span>
                        <span className="text-red-400 font-medium">{data.estimated.toFixed(1)} tCO₂e</span>
                      </div>
                      <div className="flex justify-between gap-4 pt-1 border-t border-gray-700">
                        <span className="text-white font-semibold">Total:</span>
                        <span className="text-white font-semibold">{data.total.toFixed(1)} tCO₂e</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Quality score:</span>
                        <span className="text-blue-400">{(data.quality * 100).toFixed(0)}%</span>
                      </div>
                      {data.uncertainty > 0 && (
                        <div className="flex justify-between gap-4">
                          <span className="text-gray-400">Uncertainty:</span>
                          <span className="text-gray-300">±{data.uncertainty}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="primary" stackId="a" fill={complianceColors.dataQuality.high.color} radius={[0, 0, 0, 0]} />
            <Bar dataKey="secondary" stackId="a" fill={complianceColors.dataQuality.medium.color} radius={[0, 0, 0, 0]} />
            <Bar dataKey="estimated" stackId="a" fill={complianceColors.dataQuality.low.color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Details Table */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Category Detail with Calculation Methods
        </h4>

        <div className="space-y-2">
          {categories.map((cat) => (
            <motion.div
              key={cat.category}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                cat.included
                  ? 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
                  : 'bg-gray-50 dark:bg-gray-900/30 border-gray-200 dark:border-gray-800 opacity-60'
              }`}
              onClick={() => cat.included && setSelectedCategory(selectedCategory?.category === cat.category ? null : cat)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-2 min-w-[40px]">
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {cat.category}
                    </span>
                    {cat.included ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{cat.name}</p>
                    {cat.included && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {dataSourceLabels[cat.data_source_type]}
                        </span>
                        <div className="flex gap-1">
                          {cat.primary_data_pct > 0 && (
                            <div
                              className="h-2 rounded"
                              style={{
                                width: `${cat.primary_data_pct}px`,
                                backgroundColor: complianceColors.dataQuality.high.color
                              }}
                            />
                          )}
                          {cat.secondary_data_pct > 0 && (
                            <div
                              className="h-2 rounded"
                              style={{
                                width: `${cat.secondary_data_pct}px`,
                                backgroundColor: complianceColors.dataQuality.medium.color
                              }}
                            />
                          )}
                          {cat.estimated_data_pct > 0 && (
                            <div
                              className="h-2 rounded"
                              style={{
                                width: `${cat.estimated_data_pct}px`,
                                backgroundColor: complianceColors.dataQuality.low.color
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {cat.included && (
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {cat.value.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {((cat.value / totalScope3) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded"
                      style={{
                        backgroundColor: getDataQualityColor(cat.data_quality).bg,
                        color: getDataQualityColor(cat.data_quality).color,
                      }}
                    >
                      {(cat.data_quality * 100).toFixed(0)}%
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        selectedCategory?.category === cat.category ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {selectedCategory?.category === cat.category && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Calculation Method</p>
                        <p className="text-gray-900 dark:text-white">{cat.calculation_method}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data Breakdown</p>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Primary:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{cat.primary_data_pct}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Secondary:</span>
                            <span className="font-medium text-amber-600 dark:text-amber-400">{cat.secondary_data_pct}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">Estimated:</span>
                            <span className="font-medium text-red-600 dark:text-red-400">{cat.estimated_data_pct}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {cat.uncertainty_range && cat.uncertainty_range > 0 && (
                      <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-amber-900 dark:text-amber-300">
                              Uncertainty Range: ±{cat.uncertainty_range}%
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                              Actual emissions may range from {(cat.value * (1 - cat.uncertainty_range / 100)).toFixed(1)} to {(cat.value * (1 + cat.uncertainty_range / 100)).toFixed(1)} tCO₂e
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Data Quality Guidance */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">
              GHG Protocol Scope 3 Data Quality Guidance
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• <span className="font-semibold">Primary data:</span> Supplier-specific or product-specific data (highest quality)</li>
              <li>• <span className="font-semibold">Secondary data:</span> Industry averages or databases (medium quality)</li>
              <li>• <span className="font-semibold">Estimated data:</span> Proxy data, extrapolations, spend-based (lower quality, plan for improvement)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
