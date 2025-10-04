'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  MapPin,
  ShoppingBag,
  Award,
  Info,
  TrendingDown,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { complianceColors } from '@/styles/compliance-design-tokens';

interface Scope2Data {
  location_based: number;
  market_based: number;
  difference: number;
  trend_lb: number;
  trend_mb: number;
  instruments: {
    type: 'go' | 'rec' | 'ppa' | 'contract' | 'supplier_specific';
    name: string;
    mwh_covered: number;
    quality_grade: 'A' | 'B' | 'C' | 'D';
    quality_criteria: {
      sourcing_geography: boolean;
      vintage: boolean;
      additionality: boolean;
      tracking_cancellation: boolean;
      scope_2_guidance: boolean;
    };
  }[];
  categories: {
    electricity: { lb: number; mb: number };
    heat: { lb: number; mb: number };
    steam: { lb: number; mb: number };
    cooling: { lb: number; mb: number };
  };
}

interface Scope2DualReportingProps {
  data: Scope2Data;
}

export function Scope2DualReporting({ data }: Scope2DualReportingProps) {
  const instrumentTypeLabels = {
    go: 'Guarantee of Origin',
    rec: 'Renewable Energy Certificate',
    ppa: 'Power Purchase Agreement',
    contract: 'Supplier-Specific Contract',
    supplier_specific: 'Supplier-Specific Data'
  };

  const qualityGradeColors = {
    A: complianceColors.green[600],
    B: complianceColors.green[400],
    C: complianceColors.amber[500],
    D: complianceColors.amber[700],
  };

  const qualityGradeBg = {
    A: complianceColors.green[100],
    B: complianceColors.green[100],
    C: complianceColors.amber[100],
    D: complianceColors.amber[100],
  };

  // Prepare chart data
  const comparisonData = [
    {
      method: 'Location-Based',
      value: data.location_based,
      color: complianceColors.scopes.scope2LocationBased.primary,
    },
    {
      method: 'Market-Based',
      value: data.market_based,
      color: complianceColors.scopes.scope2MarketBased.primary,
    }
  ];

  const categoryData = Object.entries(data.categories)
    .filter(([_, values]) => values.lb > 0 || values.mb > 0)
    .map(([category, values]) => ({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      'Location-Based': values.lb,
      'Market-Based': values.mb,
    }));

  const reductionAchieved = ((data.location_based - data.market_based) / data.location_based) * 100;
  const isReduction = data.market_based < data.location_based;

  return (
    <div className="space-y-6">
      {/* Header with Explanation */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-300">
              Dual Reporting Requirement (GHG Protocol Scope 2 Guidance)
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              <span className="font-medium">Location-based method</span> reflects average emissions intensity
              of grids. <span className="font-medium">Market-based method</span> reflects contractual
              instruments (RECs, GOs, PPAs) with quality assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Dual Comparison - Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Location-Based */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#111827] border-2 border-blue-500 dark:border-blue-400 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Location-Based</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Grid average emissions</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.location_based.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {data.trend_lb < 0 ? (
              <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={data.trend_lb < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {Math.abs(data.trend_lb).toFixed(1)}% vs prior year
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Method:</span> Official grid emission factors by region and year (IEA, EPA, DEFRA)
            </p>
          </div>
        </motion.div>

        {/* Market-Based */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-[#111827] border-2 border-emerald-500 dark:border-emerald-400 rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
              <ShoppingBag className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Market-Based</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">Contractual instruments</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.market_based.toFixed(1)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {data.trend_mb < 0 ? (
              <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
            ) : (
              <TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />
            )}
            <span className={data.trend_mb < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {Math.abs(data.trend_mb).toFixed(1)}% vs prior year
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-semibold">Instruments:</span> {data.instruments.length} tracked ({data.instruments.filter(i => i.quality_grade === 'A' || i.quality_grade === 'B').length} high quality)
            </p>
          </div>
        </motion.div>
      </div>

      {/* Reduction Achievement */}
      {isReduction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-300">
                  Renewable Energy Impact
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Market-based method shows{' '}
                  <span className="font-bold">{reductionAchieved.toFixed(1)}% reduction</span>{' '}
                  vs. grid average through renewable procurement
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                -{(data.location_based - data.market_based).toFixed(1)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">tCO₂e avoided</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Dual Chart Comparison */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Dual Method Comparison by Category
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
            <XAxis type="number" tick={{ fill: '#64748B', fontSize: 12 }} />
            <YAxis dataKey="category" type="category" tick={{ fill: '#64748B', fontSize: 12 }} width={80} />
            <Tooltip
              formatter={(value: any) => `${value.toFixed(1)} tCO₂e`}
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend />
            <Bar dataKey="Location-Based" fill={complianceColors.scopes.scope2LocationBased.primary} radius={[0, 4, 4, 0]} />
            <Bar dataKey="Market-Based" fill={complianceColors.scopes.scope2MarketBased.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Instrument Quality Assessment */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              Contractual Instrument Quality Assessment
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Per GHG Protocol Scope 2 Guidance quality criteria
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {data.instruments.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No contractual instruments tracked. Market-based equals location-based.</p>
            </div>
          ) : (
            data.instruments.map((instrument, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h5 className="font-medium text-gray-900 dark:text-white">{instrument.name}</h5>
                      <span
                        className="px-2 py-0.5 text-xs font-bold rounded"
                        style={{
                          backgroundColor: qualityGradeBg[instrument.quality_grade],
                          color: qualityGradeColors[instrument.quality_grade],
                        }}
                      >
                        Grade {instrument.quality_grade}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {instrumentTypeLabels[instrument.type]} • {instrument.mwh_covered.toLocaleString()} MWh
                    </p>

                    {/* Quality Criteria Checklist */}
                    <div className="grid grid-cols-5 gap-2">
                      {Object.entries(instrument.quality_criteria).map(([criterion, met]) => (
                        <div
                          key={criterion}
                          className="flex items-center gap-1"
                          title={criterion.replace(/_/g, ' ')}
                        >
                          <div className={`w-2 h-2 rounded-full ${met ? 'bg-green-500' : 'bg-gray-400'}`} />
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {criterion.split('_')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Quality Criteria Legend */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">
            GHG Protocol Scope 2 Guidance Quality Criteria:
          </p>
          <div className="grid grid-cols-5 gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div>1. Geography match</div>
            <div>2. Vintage alignment</div>
            <div>3. Additionality</div>
            <div>4. Tracking/retirement</div>
            <div>5. Scope 2 compliance</div>
          </div>
        </div>
      </div>
    </div>
  );
}
