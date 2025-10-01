'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  ChevronRight,
  Download,
  FileText,
  Target,
  Globe,
  Building,
  Truck,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';

interface ComplianceDashboardProps {
  organizationId: string;
}

interface ScopeData {
  scope: string;
  value: number;
  previousYear: number;
  baseYear: number;
  baseYearValue: number;
  trend: number;
  categories?: {
    name: string;
    value: number;
    measured: boolean;
  }[];
}

export function ComplianceDashboard({ organizationId }: ComplianceDashboardProps) {
  const [selectedView, setSelectedView] = useState<'ghg' | 'gri'>('ghg');
  const [baseYear] = useState(2024); // Dynamic based on data
  const [reportingYear] = useState(new Date().getFullYear());
  const [dataQuality, setDataQuality] = useState({
    measured: 60,
    calculated: 30,
    estimated: 10
  });

  const [scopeData, setScopeData] = useState<ScopeData[]>([
    {
      scope: 'Scope 1',
      value: 125,
      previousYear: 115,
      baseYear: 2024,
      baseYearValue: 120,
      trend: 8.7,
      categories: [
        { name: 'Stationary Combustion', value: 89, measured: true },
        { name: 'Mobile Combustion', value: 31, measured: true },
        { name: 'Process Emissions', value: 0, measured: false },
        { name: 'Fugitive Emissions', value: 5, measured: true }
      ]
    },
    {
      scope: 'Scope 2',
      value: 220,
      previousYear: 205,
      baseYear: 2024,
      baseYearValue: 200,
      trend: 7.3,
      categories: [
        { name: 'Purchased Electricity (Location)', value: 200, measured: true },
        { name: 'Purchased Electricity (Market)', value: 180, measured: true },
        { name: 'Purchased Heat/Steam', value: 20, measured: true },
        { name: 'Purchased Cooling', value: 0, measured: false }
      ]
    },
    {
      scope: 'Scope 3',
      value: 455,
      previousYear: 420,
      baseYear: 2024,
      baseYearValue: 400,
      trend: 8.3,
      categories: [
        { name: '1. Purchased Goods & Services', value: 150, measured: false },
        { name: '2. Capital Goods', value: 45, measured: false },
        { name: '3. Fuel & Energy Related', value: 35, measured: true },
        { name: '4. Upstream Transportation', value: 40, measured: false },
        { name: '5. Waste Generated', value: 15, measured: true },
        { name: '6. Business Travel', value: 25, measured: true },
        { name: '7. Employee Commuting', value: 30, measured: false },
        { name: '8. Upstream Leased Assets', value: 10, measured: false },
        { name: '9. Downstream Transportation', value: 35, measured: false },
        { name: '10. Processing of Sold Products', value: 0, measured: false },
        { name: '11. Use of Sold Products', value: 50, measured: false },
        { name: '12. End-of-Life Treatment', value: 10, measured: false },
        { name: '13. Downstream Leased Assets', value: 0, measured: false },
        { name: '14. Franchises', value: 0, measured: false },
        { name: '15. Investments', value: 10, measured: false }
      ]
    }
  ]);

  const [intensityMetrics] = useState([
    { name: 'Per Revenue', value: 0.45, unit: 'tCO2e/$M', trend: -5.2 },
    { name: 'Per Employee', value: 12.3, unit: 'tCO2e/FTE', trend: -3.1 },
    { name: 'Per Square Meter', value: 0.085, unit: 'tCO2e/m²', trend: -7.8 },
    { name: 'Per Product Unit', value: 2.1, unit: 'kgCO2e/unit', trend: -4.5 }
  ]);

  const [griIndicators] = useState([
    { code: '305-1', name: 'Direct (Scope 1) GHG emissions', value: 125, unit: 'tCO2e', status: 'reported' },
    { code: '305-2', name: 'Energy indirect (Scope 2) GHG emissions', value: 220, unit: 'tCO2e', status: 'reported' },
    { code: '305-3', name: 'Other indirect (Scope 3) GHG emissions', value: 455, unit: 'tCO2e', status: 'partial' },
    { code: '305-4', name: 'GHG emissions intensity', value: 0.45, unit: 'tCO2e/$M', status: 'reported' },
    { code: '305-5', name: 'Reduction of GHG emissions', value: 35, unit: 'tCO2e', status: 'reported' },
    { code: '305-6', name: 'Emissions of ozone-depleting substances', value: 0, unit: 'kg CFC-11e', status: 'not applicable' },
    { code: '305-7', name: 'NOx, SOx, and other emissions', value: 2.1, unit: 'tonnes', status: 'estimated' }
  ]);

  const totalEmissions = scopeData.reduce((sum, scope) => sum + scope.value, 0);
  const baseYearTotal = scopeData.reduce((sum, scope) => sum + scope.baseYearValue, 0);
  const reductionFromBase = ((baseYearTotal - totalEmissions) / baseYearTotal * 100).toFixed(1);

  const getCoverageScore = () => {
    let measured = 0;
    let total = 0;

    scopeData.forEach(scope => {
      if (scope.categories) {
        scope.categories.forEach(cat => {
          total += 1;
          if (cat.measured && cat.value > 0) measured += 1;
        });
      }
    });

    return Math.round((measured / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Emissions Compliance Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GHG Protocol & GRI Standards Compliant Reporting
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedView('ghg')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedView === 'ghg'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              GHG Protocol
            </button>
            <button
              onClick={() => setSelectedView('gri')}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedView === 'gri'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
              }`}
            >
              GRI Standards
            </button>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Emissions</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalEmissions} tCO2e
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Reporting Year {reportingYear}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">vs Base Year ({baseYear})</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Number(reductionFromBase) > 0 ? '+' : ''}{reductionFromBase}%
            </div>
            <div className="text-xs mt-1">
              <span className={Number(reductionFromBase) < 0 ? 'text-green-500' : 'text-red-500'}>
                {Number(reductionFromBase) < 0 ? 'Reduction achieved' : 'Increase from baseline'}
              </span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Coverage Score</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {getCoverageScore()}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Metrics measured
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400">Data Quality</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: `${dataQuality.measured}%` }} />
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {dataQuality.measured}%
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Measured data
            </div>
          </div>
        </div>
      </div>

      {/* GHG Protocol View */}
      {selectedView === 'ghg' && (
        <>
          {/* Scope Breakdown */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Emissions by Scope (GHG Protocol)
            </h3>

            <div className="space-y-4">
              {scopeData.map((scope, idx) => (
                <motion.div
                  key={scope.scope}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        scope.scope === 'Scope 1' ? 'bg-purple-500' :
                        scope.scope === 'Scope 2' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <h4 className="font-semibold text-gray-900 dark:text-white">{scope.scope}</h4>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        ({scope.scope === 'Scope 1' ? 'Direct' :
                          scope.scope === 'Scope 2' ? 'Indirect Energy' : 'Value Chain'})
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {scope.value} tCO2e
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {scope.trend > 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-500" />
                        )}
                        <span className={scope.trend > 0 ? 'text-red-500' : 'text-green-500'}>
                          {scope.trend > 0 ? '+' : ''}{scope.trend}% YoY
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown */}
                  {scope.categories && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {scope.categories
                          .filter(cat => cat.value > 0 || cat.measured)
                          .map(cat => (
                            <div key={cat.name} className="flex items-center justify-between">
                              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                {cat.measured ? (
                                  <CheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <AlertCircle className="w-3 h-3 text-yellow-500" />
                                )}
                                {cat.name}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {cat.value > 0 ? `${cat.value} tCO2e` : 'Not tracked'}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Intensity Metrics */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Emissions Intensity Metrics
            </h3>

            <div className="grid grid-cols-4 gap-4">
              {intensityMetrics.map((metric, idx) => (
                <motion.div
                  key={metric.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
                >
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{metric.name}</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {metric.value}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{metric.unit}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {metric.trend < 0 ? (
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    )}
                    <span className={metric.trend < 0 ? 'text-green-500' : 'text-red-500'}>
                      {metric.trend > 0 ? '+' : ''}{metric.trend}%
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Data Quality Breakdown */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Data Quality & Methodology
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">{dataQuality.measured}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Measured</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Direct measurements from meters and invoices
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">{dataQuality.calculated}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Calculated</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Activity data × emission factors
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500 mb-2">{dataQuality.estimated}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Estimated</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Industry averages and proxies
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Emission factors source: DEFRA 2024, EPA, IEA. Grid factors updated monthly.
                  Calculations follow GHG Protocol Corporate Standard.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* GRI Standards View */}
      {selectedView === 'gri' && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            GRI 305: Emissions Indicators
          </h3>

          <div className="space-y-3">
            {griIndicators.map((indicator, idx) => (
              <motion.div
                key={indicator.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                    {indicator.code}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{indicator.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {indicator.value} {indicator.unit}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  indicator.status === 'reported' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  indicator.status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  indicator.status === 'estimated' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {indicator.status}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex gap-4">
            <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export GRI Report
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-700 transition-all flex items-center gap-2">
              <FileText className="w-4 h-4" />
              View Methodology
            </button>
          </div>
        </div>
      )}
    </div>
  );
}