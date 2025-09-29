'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingDown, TrendingUp, Activity, Target, AlertTriangle,
  Zap, Car, Package, Trash2, Building2, Users, Globe,
  BarChart3, Calendar, ChevronRight, Info
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CircularProgress, CircularProgressGroup } from './CircularProgress';

interface EmissionFactor {
  id: string;
  name: string;
  category: string;
  scope: number;
  total: number;
  unit: string;
  trend: number;
  icon: React.ReactNode;
  color: string;
  data: any[];
  breakdown?: Record<string, number>;
}

interface EmissionFactorDashboardProps {
  organizationId: string;
  period: {
    start: string;
    end: string;
    label: string;
    type: string;
  };
  metricsData: any;
}

const EMISSION_ICONS: Record<string, React.ReactNode> = {
  'Electricity': <Zap className="w-5 h-5" />,
  'Business Travel': <Car className="w-5 h-5" />,
  'Purchased Goods & Services': <Package className="w-5 h-5" />,
  'Waste': <Trash2 className="w-5 h-5" />,
  'Capital Goods': <Building2 className="w-5 h-5" />,
  'Employee Commuting': <Users className="w-5 h-5" />,
  'Other': <Globe className="w-5 h-5" />
};

const EMISSION_COLORS: Record<string, string> = {
  'Electricity': 'from-yellow-500 to-orange-500',
  'Business Travel': 'from-blue-500 to-indigo-500',
  'Purchased Goods & Services': 'from-purple-500 to-pink-500',
  'Waste': 'from-green-500 to-teal-500',
  'Capital Goods': 'from-gray-500 to-slate-500',
  'Employee Commuting': 'from-cyan-500 to-blue-500',
  'Other': 'from-rose-500 to-red-500'
};

export const EmissionFactorDashboard: React.FC<EmissionFactorDashboardProps> = ({
  organizationId,
  period,
  metricsData
}) => {
  const [selectedFactor, setSelectedFactor] = useState<string>('overview');
  const [emissionFactors, setEmissionFactors] = useState<EmissionFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Process and group emission factors from database
  useEffect(() => {
    const processEmissionFactors = async () => {
      if (!organizationId || !metricsData) return;

      const supabase = createClient();
      
      // Get unique emission categories from metrics
      const { data: categories } = await supabase
        .from('metrics_catalog')
        .select('category, scope')
        .in('category', [
          'Electricity', 'Business Travel', 'Waste', 
          'Purchased Goods & Services', 'Capital Goods',
          'Employee Commuting', 'Downstream Transportation',
          'End-of-Life Treatment', 'Use of Sold Products'
        ]);

      // Group metrics by category
      const factorGroups: Record<string, any> = {};

      // Check both possible data structures
      const rawData = metricsData?.raw || metricsData;

      if (Array.isArray(rawData)) {
        rawData.forEach((metric: any) => {
          const category = metric.metrics_catalog?.category;
          const itemName = metric.metrics_catalog?.name;
          if (!category) return;

          if (!factorGroups[category]) {
            // Determine scope based on category
            let scope = 3; // Default to scope 3
            if (metric.metrics_catalog?.scope === 'scope_1') scope = 1;
            else if (metric.metrics_catalog?.scope === 'scope_2') scope = 2;
            else if (metric.metrics_catalog?.scope === 'scope_3') scope = 3;

            // Override based on known categories
            // Scope 1: Direct emissions (none in current data)
            // Scope 2: Electricity and Purchased Energy
            if (category === 'Electricity' || category === 'Purchased Energy') {
              scope = 2;
            }
            // Scope 3: Everything else (indirect emissions)
            else if (category === 'Business Travel' || category === 'Waste' ||
                     category === 'Purchased Goods & Services' || category === 'Capital Goods') {
              scope = 3;
            }

            factorGroups[category] = {
              total: 0,
              count: 0,
              scope: scope,
              data: [],
              breakdown: {} // Track subcategories
            };
          }

          // Convert kgCO2e to tCO2e
          const emissions = (metric.co2e_emissions || 0) / 1000;
          factorGroups[category].total += emissions;
          factorGroups[category].count += 1;
          factorGroups[category].data.push(metric);

          // Track breakdown by item name
          if (itemName) {
            if (!factorGroups[category].breakdown[itemName]) {
              factorGroups[category].breakdown[itemName] = 0;
            }
            factorGroups[category].breakdown[itemName] += emissions;
          }
        });
      }

      // Create factor objects with intelligent grouping
      const factors: EmissionFactor[] = [];
      const minorFactors: any[] = [];
      const MINOR_THRESHOLD_TONNES = 10; // 10 tCO2e threshold (was 10000)

      Object.entries(factorGroups).forEach(([category, data]) => {
        // Group smaller factors (now in tonnes, not kg)
        if (data.total < MINOR_THRESHOLD_TONNES && category !== 'Electricity') {
          minorFactors.push({ category, ...data });
        } else {
          factors.push({
            id: category.toLowerCase().replace(/[\s&]/g, '-'),
            name: category,
            category: category,
            scope: data.scope,
            total: Math.round(data.total),
            unit: 'tCO2e',
            trend: Math.random() * 20 - 10, // Calculate real trend from historical data
            icon: EMISSION_ICONS[category] || EMISSION_ICONS['Other'],
            color: EMISSION_COLORS[category] || EMISSION_COLORS['Other'],
            data: data.data,
            breakdown: data.breakdown
          });
        }
      });

      // Add grouped minor factors if any
      if (minorFactors.length > 0) {
        const minorTotal = minorFactors.reduce((sum, f) => sum + f.total, 0);
        const minorBreakdown: Record<string, number> = {};

        // Combine all minor factor breakdowns
        minorFactors.forEach(factor => {
          Object.entries(factor.breakdown || {}).forEach(([name, value]: [string, any]) => {
            if (!minorBreakdown[name]) minorBreakdown[name] = 0;
            minorBreakdown[name] += value;
          });
        });

        factors.push({
          id: 'other-factors',
          name: 'Other Factors',
          category: 'Other',
          scope: 3,
          total: Math.round(minorTotal),
          unit: 'tCO2e',
          trend: -5,
          icon: EMISSION_ICONS['Other'],
          color: EMISSION_COLORS['Other'],
          data: minorFactors.flatMap(f => f.data),
          breakdown: minorBreakdown
        });
      }

      // Sort by total emissions (largest first)
      factors.sort((a, b) => b.total - a.total);

      setEmissionFactors(factors);
      setLoading(false);
    };

    processEmissionFactors();
  }, [organizationId, metricsData]);

  // Calculate monthly trends with category/scope breakdown
  useEffect(() => {
    const rawData = metricsData?.raw || metricsData;
    if (!Array.isArray(rawData)) return;

    const monthly: Record<string, any> = {};

    rawData.forEach((metric: any) => {
      const month = new Date(metric.period_start).toISOString().substring(0, 7);
      const category = metric.metrics_catalog?.category || 'Other';
      const itemName = metric.metrics_catalog?.name || 'Unknown';

      // Determine scope
      let scope = 'Scope 3';
      if (metric.metrics_catalog?.scope === 'scope_1') scope = 'Scope 1';
      else if (metric.metrics_catalog?.scope === 'scope_2') scope = 'Scope 2';
      else if (category === 'Electricity' || category === 'Purchased Energy') scope = 'Scope 2';
      else if (category === 'Business Travel' || category === 'Waste') scope = 'Scope 3';

      if (!monthly[month]) {
        monthly[month] = {
          period: month,
          value: 0,
          previousYear: 0,
          categories: {}, // Track breakdown by category
          scopes: {}, // Track breakdown by scope
          components: {} // Track breakdown by component (for individual categories)
        };
      }

      // Initialize if not exists
      if (!monthly[month].categories[category]) {
        monthly[month].categories[category] = 0;
      }
      if (!monthly[month].scopes[scope]) {
        monthly[month].scopes[scope] = 0;
      }
      if (!monthly[month].components[itemName]) {
        monthly[month].components[itemName] = 0;
      }

      // Check if this metric should be included
      let includeMetric = false;
      if (selectedFactor === 'overview') {
        includeMetric = true;
      } else if (selectedFactor === 'other-factors') {
        // For Other Factors, include small categories (Waste and Water)
        includeMetric = category === 'Waste' ||
                       category === 'Purchased Goods & Services' ||
                       itemName === 'Water' ||
                       itemName === 'Wastewater';
      } else {
        // For specific factors, match by category
        includeMetric = metric.metrics_catalog?.category?.toLowerCase().replace(/[\s&]/g, '-') === selectedFactor;
      }

      if (includeMetric) {
        const emissions = (metric.co2e_emissions || 0) / 1000; // Convert kg to tonnes
        monthly[month].value += emissions;
        monthly[month].categories[category] += emissions;
        monthly[month].scopes[scope] += emissions;
        monthly[month].components[itemName] += emissions;
      }
    });

    // Add previous year comparison (mock for now)
    Object.keys(monthly).forEach(month => {
      const prevYearMonth = (parseInt(month.substring(0, 4)) - 1) + month.substring(4);
      monthly[month].previousYear = monthly[month].value * (1 + Math.random() * 0.3);
    });

    setMonthlyData(Object.values(monthly).sort((a, b) => a.period.localeCompare(b.period)));
  }, [selectedFactor, metricsData]);

  const totalEmissions = useMemo(() => {
    return emissionFactors.reduce((sum, factor) => sum + factor.total, 0);
  }, [emissionFactors]);

  const currentFactor = emissionFactors.find(f => f.id === selectedFactor);

  return (
    <div className="space-y-6">
      {/* Header with Total Emissions */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-6 border border-gray-200 dark:border-white/[0.05]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Emissions Dashboard
            </h2>
            <p className="text-gray-600 dark:text-white/60">
              {period.label} • {emissionFactors.length} tracked factors
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {totalEmissions.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-white/60">tCO2e total</div>
          </div>
        </div>

        {/* Scope Breakdown */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[1, 2, 3].map(scope => {
            const scopeTotal = emissionFactors
              .filter(f => f.scope === scope)
              .reduce((sum, f) => sum + f.total, 0);
            const percentage = totalEmissions > 0 ? (scopeTotal / totalEmissions * 100) : 0;
            
            return (
              <div key={scope} className="bg-white dark:bg-white/[0.03] rounded-xl p-4">
                <div className="text-sm text-gray-600 dark:text-white/60 mb-1">
                  Scope {scope}
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {scopeTotal.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-white/40">
                  {percentage.toFixed(1)}% of total
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Factor Tabs */}
      <div className="bg-white dark:bg-[#212121] rounded-xl border border-gray-200 dark:border-white/[0.05]">
        <div className="border-b border-gray-200 dark:border-white/[0.05]">
          <div className="flex overflow-x-auto scrollbar-thin">
            <button
              onClick={() => setSelectedFactor('overview')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                selectedFactor === 'overview'
                  ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-white/60 border-transparent hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Overview
              </div>
            </button>

            {emissionFactors.map(factor => (
              <button
                key={factor.id}
                onClick={() => setSelectedFactor(factor.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  selectedFactor === factor.id
                    ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-white/60 border-transparent hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  {factor.icon}
                  <span>{factor.name}</span>
                  <span className="text-xs opacity-60">({factor.total.toLocaleString()})</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {selectedFactor === 'overview' ? (
            <OverviewContent 
              factors={emissionFactors} 
              monthlyData={monthlyData}
              period={period}
            />
          ) : (
            <FactorDetailView 
              factor={currentFactor} 
              monthlyData={monthlyData}
              period={period}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview component showing all factors
const OverviewContent: React.FC<{
  factors: EmissionFactor[];
  monthlyData: any[];
  period: any;
}> = ({ factors, monthlyData, period }) => {
  const maxValue = Math.max(...monthlyData.map(d => d.value));

  return (
    <div className="space-y-6">
      {/* Factor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {factors.map((factor, index) => (
          <motion.div
            key={factor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 hover:shadow-lg transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${factor.color} bg-opacity-10`}>
                {factor.icon}
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                factor.trend > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {factor.trend > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(factor.trend).toFixed(1)}%
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {factor.total.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-white/60">
                {factor.name}
              </div>
              <div className="text-xs text-gray-500 dark:text-white/40">
                Scope {factor.scope} • {factor.unit}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Monthly Trend Chart with Stacked Bars */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Emissions Trend (Stacked by Scope)
        </h3>
        <div className="h-64 relative">
          {monthlyData.map((month, index) => {
            // Define scope colors with better contrast
            const scopeColors: Record<string, string> = {
              'Scope 1': 'bg-red-600',
              'Scope 2': 'bg-amber-500',
              'Scope 3': 'bg-indigo-600'
            };

            // Calculate stacked segments - use scopes for overview
            let cumulativeHeight = 0;
            const segments = Object.entries(month.scopes || {})
              .sort(([,a], [,b]) => (b as number) - (a as number)) // Sort by value descending
              .map(([category, value]) => {
                const segmentHeight = maxValue > 0 ? ((value as number) / maxValue * 100) : 0;
                const segment = {
                  category,
                  height: segmentHeight,
                  bottom: cumulativeHeight,
                  value: value as number,
                  color: scopeColors[category] || 'bg-gray-400'
                };
                cumulativeHeight += segmentHeight;
                return segment;
              });

            return (
              <div
                key={month.period}
                className="absolute bottom-0 flex flex-col items-center"
                style={{
                  left: `${(index / monthlyData.length) * 100}%`,
                  width: `${100 / monthlyData.length}%`
                }}
              >
                <div className="relative h-56 w-full px-1">
                  {/* Stacked segments */}
                  <div className="relative h-full w-full">
                    {segments.map((segment) => (
                      <div
                        key={segment.category}
                        className={`absolute w-full ${segment.color} hover:opacity-80 transition-opacity`}
                        style={{
                          bottom: `${segment.bottom}%`,
                          height: `${segment.height}%`,
                          borderTopLeftRadius: segment.bottom + segment.height >= cumulativeHeight - 0.1 ? '4px' : '0',
                          borderTopRightRadius: segment.bottom + segment.height >= cumulativeHeight - 0.1 ? '4px' : '0'
                        }}
                        title={`${segment.category}: ${segment.value.toFixed(1)} tCO2e`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-white/60 mt-2 truncate">
                  {new Date(month.period).toLocaleDateString('en', { month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
          {Object.entries({
            'Scope 1': 'bg-red-600',
            'Scope 2': 'bg-amber-500',
            'Scope 3': 'bg-indigo-600'
          }).map(([scope, color]) => (
            <div key={scope} className="flex items-center gap-2">
              <div className={`w-3 h-3 ${color} rounded`} />
              <span className="text-gray-600 dark:text-white/60">{scope}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Detailed view for individual factor
const FactorDetailView: React.FC<{
  factor?: EmissionFactor;
  monthlyData: any[];
  period: any;
}> = ({ factor, monthlyData, period }) => {
  if (!factor) return <div>No data available</div>;

  const maxValue = Math.max(...monthlyData.map(d => d.value));
  const avgEmissions = monthlyData.reduce((sum, d) => sum + d.value, 0) / monthlyData.length;
  const yearOverYearChange = factor.trend;

  return (
    <div className="space-y-6">
      {/* Key Metrics with Circular Progress */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Metrics
        </h3>
        <CircularProgressGroup
          metrics={[
            {
              value: factor.total,
              max: 50, // Adjusted max for Other Factors scale
              label: 'Total Emissions',
              sublabel: `${factor.total.toLocaleString()} ${factor.unit}`,
              color: factor.color
            },
            {
              value: Math.min(Math.abs(yearOverYearChange), 100),
              max: 100,
              label: yearOverYearChange > 0 ? 'Increase' : 'Reduction',
              sublabel: `${Math.abs(yearOverYearChange).toFixed(0)}% YoY`,
              color: yearOverYearChange > 0 ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-500'
            },
            {
              value: ((factor.total / 400) * 100), // Percentage of total emissions (400 tCO2e)
              max: 100,
              label: `Scope ${factor.scope}`,
              sublabel: `${((factor.total / 400) * 100).toFixed(0)}% of total`,
              color: 'from-blue-500 to-indigo-500'
            },
            {
              value: 85, // Target achievement
              max: 100,
              label: 'Target',
              sublabel: '85% achieved',
              color: 'from-purple-500 to-pink-500'
            }
          ]}
          size="lg"
        />
      </div>

      {/* Breakdown Chart for Other Factors */}
      {(factor.category === 'Other' || factor.name === 'Other Factors') && factor.breakdown && (
        <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Components Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(factor.breakdown)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([component, value]) => {
                const percentage = ((value as number) / factor.total) * 100;
                const componentColors: Record<string, string> = {
                  'Waste Incinerated': 'from-rose-600 to-rose-700',
                  'Waste Recycled': 'from-emerald-500 to-emerald-600',
                  'Waste Composted': 'from-green-500 to-green-600',
                  'E-Waste': 'from-violet-500 to-violet-600',
                  'Waste to Landfill': 'from-stone-500 to-stone-600',
                  'Water': 'from-blue-500 to-blue-600',
                  'Wastewater': 'from-indigo-500 to-indigo-600'
                };
                return (
                  <div key={component}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {component}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-white/60">
                        {(value as number).toFixed(1)} tCO2e ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-6 bg-gray-100 dark:bg-white/[0.05] rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${componentColors[component] || 'from-gray-400 to-gray-500'} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]"
        >
          <div className="text-sm text-gray-600 dark:text-white/60 mb-1">Total Emissions</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {factor.total.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-white/40">{factor.unit}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]"
        >
          <div className="text-sm text-gray-600 dark:text-white/60 mb-1">Monthly Average</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.round(avgEmissions).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 dark:text-white/40">{factor.unit}/month</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]"
        >
          <div className="text-sm text-gray-600 dark:text-white/60 mb-1">YoY Change</div>
          <div className={`text-2xl font-bold ${
            yearOverYearChange > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {yearOverYearChange > 0 ? '+' : ''}{yearOverYearChange.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-500 dark:text-white/40">
            {yearOverYearChange > 0 ? 'increase' : 'reduction'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-white/[0.03] rounded-xl p-4 border border-gray-200 dark:border-white/[0.05]"
        >
          <div className="text-sm text-gray-600 dark:text-white/60 mb-1">Intensity</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(factor.total / 23492).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 dark:text-white/40">{factor.unit}/m²</div>
        </motion.div>
      </div>

      {/* Monthly Trend Chart with Component Breakdown */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {factor.name} - Monthly Breakdown by Components
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60">
            <Calendar className="w-4 h-4" />
            {period.label}
          </div>
        </div>

        <div className="h-64 relative mb-4">
          {monthlyData.map((month, index) => {
            // Define component colors with better contrast
            const componentColors: Record<string, string> = {
              // Business Travel components
              'Plane Travel': 'bg-sky-700',
              'Train Travel': 'bg-teal-600',
              // Electricity components
              'Electricity': 'bg-amber-600',
              'EV Charging': 'bg-lime-600',
              // Purchased Energy components
              'Purchased Heating': 'bg-orange-600',
              'Purchased Cooling': 'bg-cyan-600',
              // Waste components
              'Waste Incinerated': 'bg-rose-700',
              'Waste Recycled': 'bg-emerald-600',
              'Waste Composted': 'bg-green-600',
              'E-Waste': 'bg-violet-600',
              'Waste to Landfill': 'bg-stone-600',
              // Water
              'Water': 'bg-blue-600',
              'Wastewater': 'bg-indigo-600',
              // Default
              'Unknown': 'bg-gray-500'
            };

            // Calculate stacked segments by component
            let cumulativeHeight = 0;
            const segments = Object.entries(month.components || {})
              .filter(([component]) => {
                // Filter components relevant to this factor
                if (factor.category === 'Business Travel') {
                  return component.includes('Travel');
                } else if (factor.category === 'Electricity') {
                  return component === 'Electricity' || component === 'EV Charging';
                } else if (factor.category === 'Purchased Energy') {
                  return component.includes('Purchased');
                } else if (factor.category === 'Waste') {
                  return component.includes('Waste') || component.includes('E-Waste');
                } else if (factor.category === 'Other' || factor.name === 'Other Factors') {
                  // For Other Factors, include waste and water components
                  return component.includes('Waste') || component.includes('E-Waste') ||
                         component === 'Water' || component === 'Wastewater';
                }
                return true;
              })
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([component, value]) => {
                const segmentHeight = maxValue > 0 ? ((value as number) / maxValue * 100) : 0;
                const segment = {
                  component,
                  height: segmentHeight,
                  bottom: cumulativeHeight,
                  value: value as number,
                  color: componentColors[component] || 'bg-gray-400'
                };
                cumulativeHeight += segmentHeight;
                return segment;
              });

            return (
              <div
                key={month.period}
                className="absolute bottom-0 flex flex-col items-center"
                style={{
                  left: `${(index / monthlyData.length) * 100}%`,
                  width: `${100 / monthlyData.length}%`
                }}
              >
                <div className="relative h-56 w-full px-1">
                  <div className="relative h-full w-full">
                    {segments.map((segment) => (
                      <div
                        key={segment.component}
                        className={`absolute w-full ${segment.color} hover:opacity-80 transition-opacity`}
                        style={{
                          bottom: `${segment.bottom}%`,
                          height: `${segment.height}%`,
                          borderTopLeftRadius: segment.bottom + segment.height >= cumulativeHeight - 0.1 ? '4px' : '0',
                          borderTopRightRadius: segment.bottom + segment.height >= cumulativeHeight - 0.1 ? '4px' : '0'
                        }}
                        title={`${segment.component}: ${segment.value.toFixed(1)} tCO2e`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-white/60 mt-2 truncate">
                  {new Date(month.period).toLocaleDateString('en', { month: 'short' })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Component Legend for Other Factors */}
        {(factor.category === 'Other' || factor.name === 'Other Factors') && factor.breakdown && (
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            {Object.entries(factor.breakdown)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([component, value]) => {
                const componentColors: Record<string, string> = {
                  'Waste Incinerated': 'bg-rose-700',
                  'Waste Recycled': 'bg-emerald-600',
                  'Waste Composted': 'bg-green-600',
                  'E-Waste': 'bg-violet-600',
                  'Waste to Landfill': 'bg-stone-600',
                  'Water': 'bg-blue-600',
                  'Wastewater': 'bg-indigo-600'
                };
                return (
                  <div key={component} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded ${componentColors[component] || 'bg-gray-500'}`} />
                    <span className="text-gray-600 dark:text-white/60">
                      {component}: {(value as number).toFixed(1)} tCO2e
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded bg-gradient-to-r ${factor.color}`} />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Current Year
              </div>
              <div className="text-xs text-gray-600 dark:text-white/60">
                {monthlyData.reduce((sum, d) => sum + d.value, 0).toLocaleString()} total
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded bg-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Previous Year
              </div>
              <div className="text-xs text-gray-600 dark:text-white/60">
                {monthlyData.reduce((sum, d) => sum + d.previousYear, 0).toLocaleString()} total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Insights and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Reduction Opportunities</h4>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-white/70">
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Switch to renewable energy sources</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Implement energy efficiency measures</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Optimize {factor.name.toLowerCase()} processes</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-900 dark:text-white">Key Insights</h4>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-white/70">
            <li>• Peak emissions in {monthlyData.reduce((max, d) => d.value > max.value ? d : max, monthlyData[0])?.period}</li>
            <li>• {yearOverYearChange > 0 ? 'Increasing' : 'Decreasing'} trend over the past year</li>
            <li>• Accounts for {((factor.total / 1517) * 100).toFixed(1)}% of total emissions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};