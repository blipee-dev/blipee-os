'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Factory,
  Cloud,
  AlertTriangle,
  Target,
  Leaf,
  Info
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
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface OverviewDashboardProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

interface ScopeData {
  scope: string;
  total: number;
  percentage: number;
  yoyChange: number;
  categories: Array<{ name: string; value: number }>;
}

export function OverviewDashboard({ organizationId, selectedSite, selectedPeriod }: OverviewDashboardProps) {
  const [loading, setLoading] = useState(true);

  // Summary metrics
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalEmissionsYoY, setTotalEmissionsYoY] = useState(0);
  const [intensityMetric, setIntensityMetric] = useState(0);
  const [intensityYoY, setIntensityYoY] = useState(0);

  // Scope breakdown (just totals)
  const [scope1Total, setScope1Total] = useState(0);
  const [scope2Total, setScope2Total] = useState(0);
  const [scope3Total, setScope3Total] = useState(0);
  const [scopeYoY, setScopeYoY] = useState({ scope1: 0, scope2: 0, scope3: 0 });

  // Trends
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);

  // Targets
  const [targetsOnTrack, setTargetsOnTrack] = useState(0);
  const [totalTargets, setTotalTargets] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // Hotspots (biggest offenders)
  const [topEmitters, setTopEmitters] = useState<Array<{ name: string; emissions: number; percentage: number }>>([]);

  // NEW: Enhanced data from API
  // Data Quality
  const [dataQuality, setDataQuality] = useState<any>(null);

  // Scope 2 Dual Reporting
  const [scope2LocationBased, setScope2LocationBased] = useState(0);
  const [scope2MarketBased, setScope2MarketBased] = useState(0);
  const [renewablePercentage, setRenewablePercentage] = useState(0);

  // Scope 3 Coverage
  const [scope3Coverage, setScope3Coverage] = useState<any>(null);

  // Organizational Boundaries
  const [orgBoundaries, setOrgBoundaries] = useState<any>(null);

  // Organization context for intensity
  const [orgEmployees, setOrgEmployees] = useState(200); // Will be updated from API

  useEffect(() => {
    const fetchOverviewData = async () => {
      setLoading(true);
      try {
        // Build params exactly like Energy dashboard
        const params = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end,
        });
        if (selectedSite) {
          params.append('site_id', selectedSite.id);
        }

        // Fetch scope analysis for current period
        const scopeResponse = await fetch(`/api/sustainability/scope-analysis?${params}`);
        const scopeData = await scopeResponse.json();

        // Fetch previous year for YoY comparison
        const currentYear = new Date(selectedPeriod.start).getFullYear();
        const previousYear = currentYear - 1;

        const prevYearStart = new Date(selectedPeriod.start);
        prevYearStart.setFullYear(previousYear);
        const prevYearEnd = new Date(selectedPeriod.end);
        prevYearEnd.setFullYear(previousYear);

        const prevParams = new URLSearchParams({
          start_date: prevYearStart.toISOString().split('T')[0],
          end_date: prevYearEnd.toISOString().split('T')[0],
        });
        if (selectedSite) {
          prevParams.append('site_id', selectedSite.id);
        }

        const prevScopeResponse = await fetch(`/api/sustainability/scope-analysis?${prevParams}`);
        const prevScopeData = await prevScopeResponse.json();

        console.log('Current year scope data:', scopeData);
        console.log('Previous year scope data:', prevScopeData);

        // Extract scope totals
        const extractedScopeData = scopeData.scopeData || scopeData;
        const prevExtractedScopeData = prevScopeData.scopeData || prevScopeData;

        const s1Current = extractedScopeData.scope_1?.total || 0;
        const s2Current = extractedScopeData.scope_2?.total || 0;
        const s3Current = extractedScopeData.scope_3?.total || 0;

        const s1Previous = prevExtractedScopeData.scope_1?.total || 0;
        const s2Previous = prevExtractedScopeData.scope_2?.total || 0;
        const s3Previous = prevExtractedScopeData.scope_3?.total || 0;

        const currentTotal = s1Current + s2Current + s3Current;
        const previousTotal = s1Previous + s2Previous + s3Previous;

        setScope1Total(s1Current);
        setScope2Total(s2Current);
        setScope3Total(s3Current);
        setTotalEmissions(currentTotal);

        // Calculate YoY changes
        const totalYoY = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
        const s1YoY = s1Previous > 0 ? ((s1Current - s1Previous) / s1Previous) * 100 : 0;
        const s2YoY = s2Previous > 0 ? ((s2Current - s2Previous) / s2Previous) * 100 : 0;
        const s3YoY = s3Previous > 0 ? ((s3Current - s3Previous) / s3Previous) * 100 : 0;

        setTotalEmissionsYoY(totalYoY);
        setScopeYoY({ scope1: s1YoY, scope2: s2YoY, scope3: s3YoY });

        // Extract new enhanced data from API
        if (scopeData.dataQuality) {
          setDataQuality(scopeData.dataQuality);
        }

        if (scopeData.scope3Coverage) {
          setScope3Coverage(scopeData.scope3Coverage);
        }

        if (scopeData.organizationalBoundaries) {
          setOrgBoundaries(scopeData.organizationalBoundaries);
          // Update org employees from API
          if (scopeData.organizationalBoundaries.employees) {
            setOrgEmployees(scopeData.organizationalBoundaries.employees);
          }
        }

        // Scope 2 dual reporting
        if (extractedScopeData.scope_2) {
          setScope2LocationBased(extractedScopeData.scope_2.location_based || 0);
          setScope2MarketBased(extractedScopeData.scope_2.market_based || 0);
          setRenewablePercentage(extractedScopeData.scope_2.renewable_percentage || 0);
        }

        // Calculate intensity (tCO2e per employee) - use employees from API if available
        const employees = scopeData.organizationalBoundaries?.employees || orgEmployees;
        const currentIntensity = employees > 0 ? currentTotal / employees : 0;
        const previousIntensity = employees > 0 ? previousTotal / employees : 0;
        const intensityYoYCalc = previousIntensity > 0 ? ((currentIntensity - previousIntensity) / previousIntensity) * 100 : 0;

        setIntensityMetric(currentIntensity);
        setIntensityYoY(intensityYoYCalc);

        // Fetch monthly trends (for chart)
        const dashboardResponse = await fetch('/api/sustainability/dashboard?range=2024');
        const dashboardData = await dashboardResponse.json();

        // Transform to monthly emissions
        if (dashboardData.emissionsByMonth) {
          const trends = dashboardData.emissionsByMonth.map((m: any) => ({
            month: m.month,
            total: (m.scope1 || 0) + (m.scope2 || 0) + (m.scope3 || 0),
            scope1: m.scope1 || 0,
            scope2: m.scope2 || 0,
            scope3: m.scope3 || 0
          }));
          setMonthlyTrends(trends);
        }

        // Fetch targets summary
        const targetsResponse = await fetch('/api/sustainability/targets');
        const targetsData = await targetsResponse.json();

        if (targetsData.targets) {
          const activeTargets = targetsData.targets.filter((t: any) => t.status === 'active');
          setTotalTargets(activeTargets.length);

          // TODO: Calculate targets on track based on progress
          // For now, using placeholder logic
          const onTrack = activeTargets.filter((t: any) => {
            const progress = t.current_value && t.baseline_value
              ? ((t.baseline_value - t.current_value) / t.baseline_value) * 100
              : 0;
            return progress >= 70;
          }).length;

          setTargetsOnTrack(onTrack);

          const avgProgress = activeTargets.length > 0
            ? (onTrack / activeTargets.length) * 100
            : 0;
          setOverallProgress(avgProgress);
        }

        // Identify top emitters (biggest categories across all scopes)
        const allCategories: Array<{ name: string; emissions: number }> = [];

        // Scope 1 categories
        if (extractedScopeData.scope_1?.categories) {
          Object.entries(extractedScopeData.scope_1.categories).forEach(([key, value]) => {
            allCategories.push({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              emissions: value as number
            });
          });
        }

        // Scope 2 categories
        if (extractedScopeData.scope_2?.categories) {
          Object.entries(extractedScopeData.scope_2.categories).forEach(([key, value]) => {
            allCategories.push({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              emissions: value as number
            });
          });
        }

        // Scope 3 categories
        if (extractedScopeData.scope_3?.categories) {
          Object.entries(extractedScopeData.scope_3.categories).forEach(([key, value]: [string, any]) => {
            if (value.included && value.value > 0) {
              allCategories.push({
                name: value.name || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                emissions: value.value
              });
            }
          });
        }

        // Sort by emissions and take top 5
        const topFive = allCategories
          .sort((a, b) => b.emissions - a.emissions)
          .slice(0, 5)
          .map(cat => ({
            ...cat,
            percentage: currentTotal > 0 ? (cat.emissions / currentTotal) * 100 : 0
          }));

        setTopEmitters(topFive);

      } catch (error) {
        console.error('Error fetching overview data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, [organizationId, selectedSite, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto" />
          <p className="text-gray-400">Loading overview data...</p>
        </div>
      </div>
    );
  }

  // Scope breakdown data for pie chart
  const scopeBreakdown = [
    { name: 'Scope 1', value: scope1Total, color: '#EF4444' },
    { name: 'Scope 2', value: scope2Total, color: '#3B82F6' },
    { name: 'Scope 3', value: scope3Total, color: '#6B7280' }
  ].filter(s => s.value > 0);

  const scopePercentages = {
    scope1: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
    scope2: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
    scope3: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Leaf className="w-6 h-6 text-green-500" />
            Sustainability Overview
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GRI 305 • GHG Protocol • Executive summary of emissions and targets
          </p>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="p-6 grid grid-cols-3 gap-4">
        {/* Total Emissions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Emissions</span>
            <Cloud className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmissions.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            <div className="flex items-center gap-1">
              {totalEmissionsYoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${totalEmissionsYoY < 0 ? 'text-green-500' : totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {totalEmissionsYoY > 0 ? '+' : ''}{totalEmissionsYoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </div>

        {/* Emissions Intensity */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Intensity</span>
            <Leaf className="w-4 h-4 text-green-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {intensityMetric.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e/FTE</div>
            </div>
            <div className="flex items-center gap-1">
              {intensityYoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${intensityYoY < 0 ? 'text-green-500' : intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {intensityYoY > 0 ? '+' : ''}{intensityYoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-400">GRI 305-4</span>
          </div>
        </div>

        {/* Target Progress */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Target Progress</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {targetsOnTrack}/{totalTargets}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">on track</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Overall Progress</span>
              <span className="font-medium text-gray-900 dark:text-white">{overallProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scope Breakdown & Trend */}
      <div className="p-6 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scope Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emissions by Scope</h3>

          <div className="flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={scopeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {scopeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)} tCO2e`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {/* Scope 1 */}
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Scope 1</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Direct emissions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{scope1Total.toFixed(1)} tCO2e</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{scopePercentages.scope1.toFixed(0)}%</span>
                  {scopeYoY.scope1 !== 0 && (
                    <span className={`text-xs ${scopeYoY.scope1 < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ({scopeYoY.scope1 > 0 ? '+' : ''}{scopeYoY.scope1.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Scope 2 */}
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Scope 2</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Purchased energy</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{scope2Total.toFixed(1)} tCO2e</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{scopePercentages.scope2.toFixed(0)}%</span>
                  {scopeYoY.scope2 !== 0 && (
                    <span className={`text-xs ${scopeYoY.scope2 < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ({scopeYoY.scope2 > 0 ? '+' : ''}{scopeYoY.scope2.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Scope 3 */}
            <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Scope 3</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Value chain</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{scope3Total.toFixed(1)} tCO2e</p>
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{scopePercentages.scope3.toFixed(0)}%</span>
                  {scopeYoY.scope3 !== 0 && (
                    <span className={`text-xs ${scopeYoY.scope3 < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ({scopeYoY.scope3 > 0 ? '+' : ''}{scopeYoY.scope3.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emissions Trend */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emissions Trend</h3>

          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  formatter={(value: number) => `${value.toFixed(1)} tCO2e`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="Total Emissions"
                  dot={{ fill: '#8B5CF6', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="scope1"
                  stroke="#EF4444"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  name="Scope 1"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="scope2"
                  stroke="#3B82F6"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  name="Scope 2"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="scope3"
                  stroke="#6B7280"
                  strokeWidth={1.5}
                  strokeDasharray="5 5"
                  name="Scope 3"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-gray-400 text-sm">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Emitters */}
      <div className="p-6 pt-0">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Emission Sources</h3>
          </div>

          <div className="space-y-2">
            {topEmitters.map((emitter, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{emitter.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-white font-semibold">{emitter.emissions.toFixed(1)} tCO2e</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({emitter.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${emitter.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {topEmitters.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">No emission data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
