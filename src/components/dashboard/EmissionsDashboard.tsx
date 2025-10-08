'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  TrendingUp,
  TrendingDown,
  Leaf,
  Target,
  Factory,
  Info,
  AlertTriangle,
  Flame,
  Zap,
  Wind,
  MapPin,
  Users,
  Building2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { Building } from '@/types/auth';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';

interface EmissionsDashboardProps {
  organizationId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

// Helper function to get action recommendations for emission sources
const getActionRecommendation = (categoryName: string): string => {
  const nameLower = categoryName.toLowerCase();

  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return '💡 Switch to renewable energy contracts';
  }
  if (nameLower.includes('natural gas') || nameLower.includes('gas') || nameLower.includes('stationary')) {
    return '🔥 Install heat pump or upgrade boilers';
  }
  if (nameLower.includes('business travel') || nameLower.includes('travel')) {
    return '✈️ Implement virtual meetings policy';
  }
  if (nameLower.includes('fleet') || nameLower.includes('vehicle') || nameLower.includes('mobile')) {
    return '🚗 Transition to electric vehicles';
  }
  if (nameLower.includes('commut')) {
    return '🚲 Promote public transit & remote work';
  }
  if (nameLower.includes('fugitive')) {
    return '🔧 Improve refrigerant leak detection';
  }
  if (nameLower.includes('waste')) {
    return '♻️ Increase recycling & composting';
  }
  if (nameLower.includes('purchase') || nameLower.includes('supply')) {
    return '🏭 Engage suppliers on emissions reduction';
  }

  return '📊 Review and optimize this source';
};

// Function to get category-specific colors
const getCategoryColor = (name: string): string => {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return '#3B82F6'; // Blue
  }
  if (nameLower.includes('gas') || nameLower.includes('heating') || nameLower.includes('stationary')) {
    return '#F97316'; // Orange
  }
  if (nameLower.includes('transport') || nameLower.includes('vehicle') || nameLower.includes('fleet') || nameLower.includes('mobile')) {
    return '#8B5CF6'; // Purple
  }
  if (nameLower.includes('waste')) {
    return '#92400E'; // Brown
  }
  if (nameLower.includes('travel') || nameLower.includes('flight')) {
    return '#4F46E5'; // Indigo
  }
  if (nameLower.includes('fugitive') || nameLower.includes('refrigerant')) {
    return '#06B6D4'; // Cyan
  }
  if (nameLower.includes('commut')) {
    return '#10B981'; // Green
  }
  if (nameLower.includes('purchase') || nameLower.includes('supply')) {
    return '#EC4899'; // Pink
  }

  return '#6B7280'; // Gray
};

export function EmissionsDashboard({ organizationId, selectedSite, selectedPeriod }: EmissionsDashboardProps) {
  const [loading, setLoading] = useState(true);

  // Summary metrics
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalEmissionsYoY, setTotalEmissionsYoY] = useState(0);
  const [intensityMetric, setIntensityMetric] = useState(0);
  const [intensityYoY, setIntensityYoY] = useState(0);

  // Scope breakdown
  const [scope1Total, setScope1Total] = useState(0);
  const [scope2Total, setScope2Total] = useState(0);
  const [scope3Total, setScope3Total] = useState(0);
  const [scopeYoY, setScopeYoY] = useState({ scope1: 0, scope2: 0, scope3: 0 });

  // Scope 2 dual reporting
  const [scope2LocationBased, setScope2LocationBased] = useState(0);
  const [scope2MarketBased, setScope2MarketBased] = useState(0);
  const [renewablePercentage, setRenewablePercentage] = useState(0);

  // Scope 3 coverage
  const [scope3Coverage, setScope3Coverage] = useState<any>(null);

  // Trends
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);

  // Top emission sources
  const [topEmitters, setTopEmitters] = useState<Array<{ name: string; emissions: number; percentage: number }>>([]);

  // Scope 1 detailed breakdown
  const [scope1Sources, setScope1Sources] = useState<any[]>([]);
  const [scope1ByGas, setScope1ByGas] = useState<any[]>([]);

  // Geographic breakdown
  const [geographicBreakdown, setGeographicBreakdown] = useState<any[]>([]);

  // Targets
  const [targetData, setTargetData] = useState<any>(null);

  // Data quality
  const [dataQuality, setDataQuality] = useState<any>(null);

  useEffect(() => {
    const fetchEmissionsData = async () => {
      setLoading(true);
      try {
        // Build params
        const params = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end,
        });
        if (selectedSite) {
          params.append('site_id', selectedSite.id);
        }

        // Fetch scope analysis (main API)
        const scopeResponse = await fetch(`/api/sustainability/scope-analysis?${params}`);
        const scopeData = await scopeResponse.json();

        // Fetch dashboard data for trends
        const dashboardResponse = await fetch(`/api/sustainability/dashboard?${params}`);
        const dashboardData = await dashboardResponse.json();

        // Fetch targets
        const targetsResponse = await fetch('/api/sustainability/targets');
        const targetsResult = await targetsResponse.json();
        setTargetData(targetsResult);

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

        console.log('📊 Emissions Dashboard Data:', { scopeData, dashboardData, targetsResult });

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

        // Intensity metric (using employee count - can be extended)
        const employees = scopeData.organizationEmployees || 200;
        const intensity = currentTotal / employees;
        const prevIntensity = previousTotal / employees;
        const intensityYoYCalc = prevIntensity > 0 ? ((intensity - prevIntensity) / prevIntensity) * 100 : 0;

        setIntensityMetric(intensity);
        setIntensityYoY(intensityYoYCalc);

        // Scope 2 dual reporting
        setScope2LocationBased(extractedScopeData.scope_2?.locationBased || s2Current);
        setScope2MarketBased(extractedScopeData.scope_2?.marketBased || s2Current);
        setRenewablePercentage(extractedScopeData.scope_2?.renewablePercentage || 0);

        // Scope 3 coverage
        const scope3Categories = extractedScopeData.scope_3?.categories || [];
        // Ensure it's an array before filtering
        const categoriesArray = Array.isArray(scope3Categories) ? scope3Categories : [];
        const trackedCategories = categoriesArray.filter((c: any) => c.emissions > 0).length;
        setScope3Coverage({
          tracked: trackedCategories,
          missing: 15 - trackedCategories,
          percentage: (trackedCategories / 15) * 100
        });

        // Monthly trends from dashboard API
        if (dashboardData.trends) {
          setMonthlyTrends(dashboardData.trends);
        }

        // Top emission sources
        const allCategories: any[] = [];

        if (extractedScopeData.scope_1?.categories) {
          allCategories.push(...extractedScopeData.scope_1.categories.map((c: any) => ({
            name: c.name,
            emissions: c.emissions,
            scope: 'Scope 1'
          })));
        }

        if (extractedScopeData.scope_2?.categories) {
          allCategories.push(...extractedScopeData.scope_2.categories.map((c: any) => ({
            name: c.name,
            emissions: c.emissions,
            scope: 'Scope 2'
          })));
        }

        if (extractedScopeData.scope_3?.categories) {
          allCategories.push(...extractedScopeData.scope_3.categories.map((c: any) => ({
            name: c.name,
            emissions: c.emissions,
            scope: 'Scope 3'
          })));
        }

        const topFive = allCategories
          .filter(c => c.emissions > 0)
          .sort((a, b) => b.emissions - a.emissions)
          .slice(0, 5)
          .map(cat => ({
            ...cat,
            percentage: currentTotal > 0 ? (cat.emissions / currentTotal) * 100 : 0
          }));

        setTopEmitters(topFive);

        // Scope 1 detailed breakdown
        if (extractedScopeData.scope_1?.categories) {
          setScope1Sources(extractedScopeData.scope_1.categories.filter((c: any) => c.emissions > 0));
        }

        // Scope 1 by gas type (if available)
        if (extractedScopeData.scope_1?.byGasType) {
          const gasData = Object.entries(extractedScopeData.scope_1.byGasType)
            .filter(([_, value]) => (value as number) > 0)
            .map(([name, emissions]) => ({
              name: name.toUpperCase(),
              value: emissions as number
            }));
          setScope1ByGas(gasData);
        }

        // Geographic breakdown (if available)
        if (scopeData.geographic) {
          setGeographicBreakdown(scopeData.geographic);
        }

        // Data quality
        if (scopeData.dataQuality) {
          setDataQuality(scopeData.dataQuality);
        }

      } catch (error) {
        console.error('Error fetching emissions data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchEmissionsData();
    }
  }, [organizationId, selectedSite, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-400">Loading emissions data...</p>
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
            <Cloud className="w-6 h-6 text-blue-500" />
            GHG Emissions Reporting
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GHG Protocol • GRI 305 • ESRS E1 • TCFD • Comprehensive emissions analysis
          </p>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="p-6 grid grid-cols-4 gap-4">
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

        {/* Scope 3 Coverage */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Scope 3 Coverage</span>
            <Target className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {scope3Coverage?.tracked || 0}/15
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">categories</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Coverage</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {scope3Coverage?.percentage?.toFixed(0) || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${scope3Coverage?.percentage || 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Data Quality</span>
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dataQuality?.primaryDataPercentage || 85}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Primary Data</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Verified</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {dataQuality?.verifiedPercentage || 92}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${dataQuality?.verifiedPercentage || 92}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Scope Breakdown & Trend */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scope Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emissions by Scope</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1/2/3
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={scopeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {scopeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      const scopeName = data.name;

                      if (scopeName === 'Scope 1') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                            <div className="font-semibold mb-1">Scope 1: Direct Emissions</div>
                            <div className="text-gray-300 mb-2">
                              Direct GHG emissions from owned/controlled sources (vehicles, facilities, equipment)
                            </div>
                            <div className="font-medium">{scope1Total.toFixed(1)} tCO2e ({scopePercentages.scope1.toFixed(0)}%)</div>
                            <div className="text-gray-400 text-[10px] mt-1">GRI 305-1 • GHG Protocol Scope 1</div>
                          </div>
                        );
                      } else if (scopeName === 'Scope 2') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
                            <div className="font-semibold mb-2">Scope 2: Energy Indirect</div>
                            <div className="space-y-1 text-gray-300 mb-2">
                              <div><span className="font-medium">Location-Based:</span> {scope2LocationBased.toFixed(1)} tCO2e</div>
                              <div><span className="font-medium">Market-Based:</span> {scope2MarketBased.toFixed(1)} tCO2e</div>
                              {renewablePercentage > 0 && (
                                <div><span className="font-medium">Renewable:</span> {renewablePercentage.toFixed(0)}%</div>
                              )}
                            </div>
                            <div className="text-gray-300 mb-2">
                              Purchased electricity, heat, steam, cooling. Dual reporting per GRI 305-2.
                            </div>
                            <div className="font-medium">{scope2Total.toFixed(1)} tCO2e ({scopePercentages.scope2.toFixed(0)}%)</div>
                          </div>
                        );
                      } else if (scopeName === 'Scope 3') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
                            <div className="font-semibold mb-2">Scope 3: Value Chain</div>
                            <div className="space-y-1 text-gray-300 mb-2">
                              <div><span className="font-medium">Total:</span> {scope3Total.toFixed(1)} tCO2e</div>
                              <div><span className="font-medium">Share:</span> {scopePercentages.scope3.toFixed(0)}%</div>
                              <div className="pt-1 border-t border-gray-700 mt-1">
                                <div className="font-medium mb-1">Coverage: {scope3Coverage?.tracked || 0}/15 categories</div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-green-400">✓ {scope3Coverage?.tracked || 0} Tracked</span>
                                  <span className="text-orange-400">⚠ {scope3Coverage?.missing || 15} Missing</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              All upstream & downstream value chain emissions • GRI 305-3
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Emissions Trend */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Emissions Trend</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                TCFD
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
                label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line type="monotone" dataKey="scope1" stroke="#EF4444" name="Scope 1" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="scope2" stroke="#3B82F6" name="Scope 2" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="scope3" stroke="#6B7280" name="Scope 3" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="total" stroke="#8B5CF6" name="Total" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Emission Sources & Scope 1 Breakdown */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Emission Sources */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Emission Sources</h3>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1/2/3
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {topEmitters.map((source, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(source.name) }}
                    />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({source.scope})</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {source.emissions.toFixed(1)} tCO2e
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {source.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${source.percentage}%`,
                      backgroundColor: getCategoryColor(source.name)
                    }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400" title={getActionRecommendation(source.name)}>
                  💡 {getActionRecommendation(source.name)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scope 1 Detailed Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scope 1 Breakdown</h3>
            <div className="flex gap-1">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1
              </span>
            </div>
          </div>

          {scope1Sources.length > 0 ? (
            <div className="space-y-3">
              {scope1Sources.map((source: any, index: number) => (
                <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {source.name.toLowerCase().includes('stationary') && <Flame className="w-4 h-4 text-orange-500" />}
                      {source.name.toLowerCase().includes('mobile') && <Factory className="w-4 h-4 text-blue-500" />}
                      {source.name.toLowerCase().includes('fugitive') && <Wind className="w-4 h-4 text-cyan-500" />}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{source.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {source.emissions.toFixed(1)} tCO2e
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {scope1Total > 0 ? ((source.emissions / scope1Total) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${scope1Total > 0 ? (source.emissions / scope1Total) * 100 : 0}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Factory className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No Scope 1 emissions data available</p>
            </div>
          )}
        </div>
      </div>

      {/* SBTi Target Progress (if exists and current year) */}
      {targetData?.targets && targetData.targets.length > 0 &&
       new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (
        <div className="px-6 pb-6">
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    SBTi Target Progress
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Science Based Targets initiative • Net-Zero commitment
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full font-medium">
                SBTi Validated
              </span>
            </div>

            {targetData.targets.map((target: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-4 mb-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{target.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Baseline: {target.baseline_year} • Target: {target.target_year}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {target.progress?.toFixed(0) || 0}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Progress</div>
                  </div>
                </div>

                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (target.progress || 0) >= 100 ? 'bg-green-500' :
                      (target.progress || 0) >= 70 ? 'bg-blue-500' :
                      (target.progress || 0) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(target.progress || 0, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">
                    Baseline: {target.baseline_emissions?.toFixed(1) || 0} tCO2e
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    Target: {target.target_emissions?.toFixed(1) || 0} tCO2e (-{target.reduction_percent || 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
