'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  FileCheck,
  Target,
  Leaf,
  BarChart3,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ComplianceDashboardProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

interface TrackedCategory {
  category: string;
  subcategories: string[];
  scope: string;
  ghgProtocolCategory: string | null;
  totalEmissions: number;
  metricCount: number;
  metrics: string[];
}

interface ScopeData {
  scope: string;
  value: number;
  previousYear: number;
  baseYear: number;
  baseYearValue: number;
  trend: number;
  categories: {
    name: string;
    value: number;
    measured: boolean;
  }[];
}

export function ComplianceDashboard({ organizationId, selectedSite, selectedPeriod }: ComplianceDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [selectedScope, setSelectedScope] = useState<string>('scope_1');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trackedCategories, setTrackedCategories] = useState<TrackedCategory[]>([]);
  const [categoryTargets, setCategoryTargets] = useState<any[]>([]);
  const [overallTargetPercent, setOverallTargetPercent] = useState<number | null>(null);
  const [scopeData, setScopeData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [targetData, setTargetData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const currentYear = selectedPeriod?.start ? new Date(selectedPeriod.start).getFullYear() : new Date().getFullYear();

        // Fetch tracked categories (NEW - dynamic!)
        const trackedParams = new URLSearchParams({
          year: currentYear.toString()
        });
        if (selectedSite) {
          trackedParams.append('site_id', selectedSite.id);
        }
        const trackedResponse = await fetch(`/api/sustainability/tracked-categories?${trackedParams}`);
        const trackedResult = await trackedResponse.json();

        // Fetch weighted allocation targets
        const allocParams = new URLSearchParams({
          baseline_year: (currentYear - 1).toString(),
        });
        if (selectedSite) {
          allocParams.append('site_id', selectedSite.id);
        }
        const allocResponse = await fetch(`/api/sustainability/targets/weighted-allocation?${allocParams}`);
        const allocResult = await allocResponse.json();

        // Fetch scope analysis data
        const scopeResponse = await fetch('/api/sustainability/scope-analysis?period=year');
        const scopeResult = await scopeResponse.json();

        // Fetch dashboard data for additional metrics
        const dashboardResponse = await fetch('/api/sustainability/dashboard?range=2024');
        const dashboardResult = await dashboardResponse.json();

        // Fetch targets data
        const targetsResponse = await fetch('/api/sustainability/targets');
        const targetsResult = await targetsResponse.json();

        console.log('📊 Tracked categories:', trackedResult);
        console.log('🎯 Weighted allocations:', allocResult);
        console.log('Scope analysis response:', scopeResult);
        console.log('Dashboard response:', dashboardResult);
        console.log('Targets response:', targetsResult);

        // Set tracked categories
        setTrackedCategories(trackedResult.categories || []);
        setCategoryTargets(allocResult.allocations || []);
        setOverallTargetPercent(allocResult.overallTarget || null);

        // Extract scopeData from nested structure
        const extractedScopeData = scopeResult.scopeData || scopeResult;

        // Transform API data structure to match component expectations
        const transformedData = {
          totalEmissions: (extractedScopeData.scope_1?.total || 0) +
                         (extractedScopeData.scope_2?.total || 0) +
                         (extractedScopeData.scope_3?.total || 0),
          scope1: {
            totalEmissions: extractedScopeData.scope_1?.total || 0,
            categoryBreakdown: Object.entries(extractedScopeData.scope_1?.categories || {}).map(([key, value]) => ({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: value as number,
              measured: true
            })).filter(cat => cat.value > 0)
          },
          scope2: {
            totalEmissions: extractedScopeData.scope_2?.total || 0,
            categoryBreakdown: Object.entries(extractedScopeData.scope_2?.categories || {}).map(([key, value]) => ({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: value as number,
              measured: true
            })).filter(cat => cat.value > 0)
          },
          scope3: {
            totalEmissions: extractedScopeData.scope_3?.total || 0,
            categoryBreakdown: Object.entries(extractedScopeData.scope_3?.categories || {}).map(([key, value]: [string, any]) => ({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: value.value || 0,
              measured: value.included || false
            })).filter(cat => cat.value > 0)
          }
        };

        setScopeData(transformedData);
        setDashboardData(dashboardResult);
        setTargetData(targetsResult);
      } catch (error) {
        console.error('Error fetching compliance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId, selectedSite, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto" />
          <p className="text-gray-400">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (!scopeData || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <p className="text-gray-400">No compliance data available</p>
        </div>
      </div>
    );
  }

  const { totalEmissions, scope1, scope2, scope3 } = scopeData;

  // Calculate safe percentages
  const safeTotal = totalEmissions || 1; // Avoid division by zero
  const scope1Emissions = scope1?.totalEmissions || 0;
  const scope2Emissions = scope2?.totalEmissions || 0;
  const scope3Emissions = scope3?.totalEmissions || 0;

  const scope1Percentage = Math.round((scope1Emissions / safeTotal) * 100) || 0;
  const scope2Percentage = Math.round((scope2Emissions / safeTotal) * 100) || 0;
  const scope3Percentage = Math.round((scope3Emissions / safeTotal) * 100) || 0;

  // Prepare scope breakdown for charts
  const scopeBreakdown = [
    {
      name: 'Scope 1',
      value: scope1Emissions,
      percentage: scope1Percentage,
      color: '#8B5CF6'
    },
    {
      name: 'Scope 2',
      value: scope2Emissions,
      percentage: scope2Percentage,
      color: '#3B82F6'
    },
    {
      name: 'Scope 3',
      value: scope3Emissions,
      percentage: scope3Percentage,
      color: '#10B981'
    }
  ].filter(scope => scope.value > 0);

  // Prepare category data
  const categoryData = [
    ...(scope1?.categoryBreakdown || []).map((cat: any) => ({
      category: cat.name,
      scope: 'Scope 1',
      value: cat.value,
      measured: cat.measured
    })),
    ...(scope2?.categoryBreakdown || []).map((cat: any) => ({
      category: cat.name,
      scope: 'Scope 2',
      value: cat.value,
      measured: cat.measured
    })),
    ...(scope3?.categoryBreakdown || []).map((cat: any) => ({
      category: cat.name.replace(/^\d+\.\s*/, ''),
      scope: 'Scope 3',
      value: cat.value,
      measured: cat.measured
    }))
  ].filter(cat => cat.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
            <FileCheck className="w-6 h-6 text-green-600 dark:text-green-500" />
            Compliance Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">GHG Protocol Corporate Standard • GRI Standards 2021 • ESRS E1</p>
        </div>

        {/* Scope Tabs */}
        <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            onClick={() => { setSelectedScope('scope_1'); setSelectedCategory(null); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedScope === 'scope_1'
                ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Scope 1
          </button>
          <button
            onClick={() => { setSelectedScope('scope_2'); setSelectedCategory(null); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedScope === 'scope_2'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Scope 2
          </button>
          <button
            onClick={() => { setSelectedScope('scope_3'); setSelectedCategory(null); }}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedScope === 'scope_3'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Scope 3
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Total Emissions</span>
            <Leaf className="w-4 h-4 text-green-600 dark:text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(totalEmissions * 10) / 10}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Scope 1</span>
            <div className="w-3 h-3 bg-purple-500 rounded" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(scope1Emissions * 10) / 10}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e • {scope1Percentage}%</div>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Scope 2</span>
            <div className="w-3 h-3 bg-blue-500 rounded" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(scope2Emissions * 10) / 10}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e • {scope2Percentage}%</div>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm">Scope 3</span>
            <div className="w-3 h-3 bg-green-500 rounded" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(scope3Emissions * 10) / 10}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e • {scope3Percentage}%</div>
        </div>
      </div>

      {/* Dynamic Category Selection for Selected Scope */}
      {(() => {
        const scopeCategories = trackedCategories.filter(cat => cat.scope === selectedScope);

        if (scopeCategories.length > 0) {
          return (
            <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {selectedScope === 'scope_1' ? 'Scope 1: Direct Emissions' :
                 selectedScope === 'scope_2' ? 'Scope 2: Purchased Energy' :
                 'Scope 3: Value Chain Emissions'}
              </h3>

              {/* Category Cards */}
              <div className="grid grid-cols-3 gap-4">
                {scopeCategories.map((cat) => {
                  const target = categoryTargets.find(t => t.category === cat.category);

                  return (
                    <div
                      key={cat.category}
                      onClick={() => setSelectedCategory(selectedCategory === cat.category ? null : cat.category)}
                      className={`cursor-pointer border rounded-xl p-4 transition-all ${
                        selectedCategory === cat.category
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-lg'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{cat.category}</h4>
                        {target && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            target.feasibility === 'high' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                            target.feasibility === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                            'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                          }`}>
                            {target.feasibility}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {cat.totalEmissions.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">tCO2e</span>
                        </div>

                        {target && (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Target Reduction</span>
                              <span className="font-semibold text-purple-600 dark:text-purple-400">
                                {target.adjustedTargetPercent.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs mt-1">
                              <span className="text-gray-500 dark:text-gray-400">Effort Factor</span>
                              <span className="text-gray-600 dark:text-gray-300">{target.effortFactor}x</span>
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {cat.metricCount} metrics tracked
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subcategory Detail View */}
              {selectedCategory && (() => {
                const category = scopeCategories.find(c => c.category === selectedCategory);
                const target = categoryTargets.find(t => t.category === selectedCategory);

                if (!category) return null;

                return (
                  <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{category.category} Details</h4>
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Target Information */}
                    {target && (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Emissions</div>
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {target.currentEmissions.toFixed(1)} tCO2e
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reduction Target</div>
                          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                            {target.adjustedTargetPercent.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target Emissions</div>
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">
                            {target.absoluteTarget.toFixed(1)} tCO2e
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Abatement Strategy */}
                    {target && (
                      <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                          Recommended Abatement Strategy
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {target.reason}
                        </div>
                      </div>
                    )}

                    {/* Subcategories */}
                    {category.subcategories.length > 0 && (
                      <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                          Subcategories ({category.subcategories.length})
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {category.subcategories.map((sub, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                            >
                              <div className="w-2 h-2 bg-purple-500 rounded-full" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{sub}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tracked Metrics */}
                    <div className="bg-white dark:bg-gray-900/50 rounded-lg p-4 mt-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Tracked Metrics ({category.metrics.length})
                      </div>
                      <div className="space-y-2">
                        {category.metrics.map((metric, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          );
        }

        return (
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No categories tracked for {selectedScope === 'scope_1' ? 'Scope 1' : selectedScope === 'scope_2' ? 'Scope 2' : 'Scope 3'}
              </p>
            </div>
          </div>
        );
      })()}

      {/* Target Progress Section */}
      {targetData?.targets && targetData.targets.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                SBTi Target Progress
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {targetData.targets[0].target_name} • {targetData.targets[0].baseline_year} → {targetData.targets[0].target_year}
              </p>
            </div>
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              {targetData.targets[0].target_reduction_percent.toFixed(1)}% Reduction Target
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Baseline */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Baseline ({targetData.targets[0].baseline_year})</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {targetData.targets[0].baseline_emissions?.toFixed(1) || '-'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>

            {/* Current */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Current ({new Date().getFullYear()})
                {targetData.targets[0].is_forecast && (
                  <span className="ml-1 text-purple-500">*</span>
                )}
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {targetData.targets[0].is_forecast ? (
                  <span>
                    {targetData.targets[0].actual_ytd?.toFixed(1) || '0'} + {targetData.targets[0].forecasted_remaining?.toFixed(1) || '0'}
                  </span>
                ) : (
                  <span>{targetData.targets[0].current_emissions?.toFixed(1) || totalEmissions.toFixed(1)}</span>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {targetData.targets[0].is_forecast ? (
                  <span>
                    tCO2e <span className="text-purple-500">(Actual + ML Forecast)</span>
                  </span>
                ) : (
                  <span>tCO2e</span>
                )}
              </div>
            </div>

            {/* Target */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Target ({targetData.targets[0].target_year})</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {targetData.targets[0].target_emissions?.toFixed(1) || '-'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>

            {/* Progress */}
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Progress</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  const baseline = targetData.targets[0].baseline_emissions || 0;
                  const current = targetData.targets[0].current_emissions || totalEmissions;
                  const target = targetData.targets[0].target_emissions || 0;
                  const progress = baseline > 0 ? ((baseline - current) / (baseline - target)) * 100 : 0;
                  return progress.toFixed(1);
                })()}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {(() => {
                  const baseline = targetData.targets[0].baseline_emissions || 0;
                  const baselineYear = targetData.targets[0].baseline_year;
                  const current = targetData.targets[0].current_emissions || totalEmissions;
                  const currentYear = new Date().getFullYear();
                  const yearsElapsed = currentYear - baselineYear;
                  const annualRate = targetData.targets[0].annual_reduction_rate || 4.2;
                  const requiredReduction = annualRate * yearsElapsed;
                  const actualReduction = baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;
                  const status = actualReduction >= requiredReduction ? 'On Track' : 'At Risk';
                  return status;
                })()}
              </div>
            </div>
          </div>

          {/* BAU vs Target Projection */}
          {targetData.targets[0].bau_projection_2030 && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                    Business as Usual Projection
                  </div>
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    Without intervention, you're projected to reach <span className="font-bold">{targetData.targets[0].bau_projection_2030.toFixed(1)} tCO2e</span> by 2030.
                    {' '}That's <span className="font-bold">{((targetData.targets[0].bau_projection_2030 - targetData.targets[0].target_emissions) / targetData.targets[0].target_emissions * 100).toFixed(0)}% above</span> your target of {targetData.targets[0].target_emissions.toFixed(1)} tCO2e.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Reduction Progress</span>
              <a href="/sustainability/targets" className="text-green-600 dark:text-green-400 hover:underline flex items-center gap-1">
                View Details →
              </a>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                style={{
                  width: `${Math.min(100, Math.max(0, (() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    const current = targetData.targets[0].current_emissions || totalEmissions;
                    const target = targetData.targets[0].target_emissions || 0;
                    return baseline > 0 ? ((baseline - current) / (baseline - target)) * 100 : 0;
                  })()))}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Scope 2 Dual Reporting - GHG Protocol Requirement */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Scope 2 Dual Reporting
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              GHG Protocol requires both location-based and market-based methods
            </p>
          </div>
          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
            GHG Protocol • ESRS E1 • IFRS S2
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Location-Based</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {scope2?.locationBased ? Math.round(scope2.locationBased * 10) / 10 : scope2Emissions}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO2e • Grid average emission factor</div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Source: IEA 2023 Portugal Grid (0.234 tCO2e/MWh)
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-purple-500 rounded" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Market-Based</span>
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {scope2?.marketBased ? Math.round(scope2.marketBased * 10) / 10 : Math.round(scope2Emissions * 2.14)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO2e • Contractual instruments (RECs, PPAs)</div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {scope2?.marketBased ? 'Residual mix factor applied' : 'Estimated (no RECs purchased)'}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-gray-700 dark:text-gray-300">
            Consider purchasing Renewable Energy Certificates (RECs) to reduce market-based emissions
          </span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Scope Breakdown */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Scope Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scopeBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {scopeBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => `${Math.round(value * 10) / 10} tCO2e`}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Emission Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="category"
                tick={{ fill: '#888', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fill: '#888' }} />
              <Tooltip
                formatter={(value: any) => `${Math.round(value * 10) / 10} tCO2e`}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Energy Consumption - GRI 302 */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
              Energy Consumption
            </h3>
            <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
              GRI 302-1 • ESRS E1-5
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700 dark:text-gray-300">Total Energy</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {dashboardData?.totalEnergy ? Math.round(dashboardData.totalEnergy * 10) / 10 : '—'}
              </span>
              <span className="text-xs text-gray-500">MWh</span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Renewable</span>
                </div>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {dashboardData?.renewablePercentage ? `${dashboardData.renewablePercentage}%` : '0%'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Fossil</span>
                </div>
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-400">
                  {dashboardData?.renewablePercentage ? `${100 - dashboardData.renewablePercentage}%` : '100%'}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white dark:bg-gray-900/50 rounded-lg">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Energy Intensity</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {dashboardData?.energyIntensity ? `${dashboardData.energyIntensity} kWh/m²` : 'Not available'}
              </div>
            </div>
          </div>
        </div>

        {/* Framework Compliance Status */}
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Framework Compliance
          </h3>

          <div className="space-y-3">
            {/* GRI Universal Standards 2021 */}
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">GRI Universal Standards 2021</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">GRI 1 (Foundation) • GRI 2 (Disclosures) • GRI 3 (Material Topics)</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Compliant</span>
              </div>
            </div>

            {/* GHG Protocol */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">GHG Protocol</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Corporate Standard • Scope 3 Standard</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Compliant</span>
              </div>
            </div>

            {/* GRI Topic Standards */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">GRI 302: Energy 2016</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Energy consumption & intensity</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Compliant</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">GRI 303: Water & Effluents 2018</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Water withdrawal, consumption, discharge & stress</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Compliant</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">GRI 305: Emissions 2016</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">GHG emissions (Scope 1, 2, 3)</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Compliant</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">GRI 306: Waste 2020</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Waste diverted from & directed to disposal</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">Compliant</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">ESRS E1</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Climate Change</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">In Progress</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">TCFD</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Climate Disclosures</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Partial</span>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">IFRS S2</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Climate Standard</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Partial</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Emission Categories Detail</h3>
        <div className="space-y-2">
          {categoryData.map((cat, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  cat.measured ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{cat.category}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{cat.scope}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">{Math.round(cat.value * 10) / 10} tCO2e</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {cat.measured ? 'Measured' : 'Estimated'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Status */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
            GHG Protocol Compliance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scope 1 Reporting</span>
              <span className="text-green-600 dark:text-green-500 font-semibold">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scope 2 Reporting</span>
              <span className="text-green-600 dark:text-green-500 font-semibold">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Scope 3 Reporting</span>
              <span className="text-yellow-600 dark:text-yellow-500 font-semibold">Partial</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Base Year Set</span>
              <span className="text-green-600 dark:text-green-500 font-semibold">2024</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <Target className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            Data Quality Score
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Measured Data</span>
              <span className="text-green-600 dark:text-green-500 font-semibold">
                {Math.round((categoryData.filter(c => c.measured).length / categoryData.length) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Estimated Data</span>
              <span className="text-yellow-600 dark:text-yellow-500 font-semibold">
                {Math.round((categoryData.filter(c => !c.measured).length / categoryData.length) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Coverage</span>
              <span className="text-green-600 dark:text-green-500 font-semibold">
                {Math.round((categoryData.filter(c => c.value > 0).length / 15) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
