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

// Helper function to get action recommendations
const getActionRecommendation = (categoryName: string): string => {
  const nameLower = categoryName.toLowerCase();

  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return '💡 Increase renewable energy procurement to 50%';
  }
  if (nameLower.includes('natural gas') || nameLower.includes('gas')) {
    return '🔥 Install heat pump system for efficiency';
  }
  if (nameLower.includes('business travel') || nameLower.includes('travel')) {
    return '✈️ Implement virtual meetings policy (+30%)';
  }
  if (nameLower.includes('fleet') || nameLower.includes('vehicle')) {
    return '🚗 Transition fleet to electric vehicles';
  }
  if (nameLower.includes('waste') || nameLower.includes('disposal')) {
    return '♻️ Increase waste diversion rate to 90%';
  }
  if (nameLower.includes('heating')) {
    return '🌡️ Upgrade to efficient heating system';
  }
  if (nameLower.includes('cooling')) {
    return '❄️ Optimize HVAC system controls';
  }
  if (nameLower.includes('commut')) {
    return '🚲 Promote public transit & cycling';
  }
  if (nameLower.includes('water')) {
    return '💧 Install water efficiency measures';
  }

  return '📊 Review and optimize this category';
};

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

  // Projected emissions (ML forecast)
  const [projectedAnnualEmissions, setProjectedAnnualEmissions] = useState<number>(0);
  const [actualEmissionsYTD, setActualEmissionsYTD] = useState<number>(0);
  const [forecastedEmissions, setForecastedEmissions] = useState<number>(0);

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

  // SBTi Targets
  const [sbtiTargets, setSbtiTargets] = useState<any>(null);
  const [targetData, setTargetData] = useState<any>(null);

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

        // Fetch SBTi targets data (will be used later for both target card and progress calculations)
        const sbtiTargetsResponse = await fetch('/api/sustainability/targets');
        const sbtiTargetsResult = await sbtiTargetsResponse.json();
        console.log('🎯 SBTi Targets Response:', sbtiTargetsResult);
        console.log('🎯 Has targets?', sbtiTargetsResult?.targets, 'Length:', sbtiTargetsResult?.targets?.length);
        setTargetData(sbtiTargetsResult);

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

        console.log('📊 Calculated emissions:');
        console.log('  Scope 1:', s1Current.toFixed(2), 'tCO2e');
        console.log('  Scope 2:', s2Current.toFixed(2), 'tCO2e');
        console.log('  Scope 3:', s3Current.toFixed(2), 'tCO2e');
        console.log('  Total:', currentTotal.toFixed(2), 'tCO2e');
        console.log('  Previous year total:', previousTotal.toFixed(2), 'tCO2e');

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
        console.log('📊 Data Quality from API:', scopeData.dataQuality);
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

        // Extract SBTi targets
        if (scopeData.sbtiTargets) {
          setSbtiTargets(scopeData.sbtiTargets);
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

        // Fetch monthly trends (for chart) - use same approach as Energy
        const dashboardParams = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end,
        });
        if (selectedSite) {
          dashboardParams.append('site_id', selectedSite.id);
        }

        const dashboardResponse = await fetch(`/api/sustainability/dashboard?${dashboardParams}`);
        const dashboardData = await dashboardResponse.json();

        console.log('📈 Monthly trends data:', dashboardData);

        // Transform to monthly emissions with enterprise forecasting
        if (dashboardData.trendData && dashboardData.trendData.length > 0) {
          const trends = dashboardData.trendData.map((m: any) => ({
            month: m.month,
            total: m.emissions || 0,
            scope1: m.scope1 || 0,
            scope2: m.scope2 || 0,
            scope3: m.scope3 || 0,
            forecast: false
          }));

          console.log('📈 Monthly trends (actual):', trends.length, 'months');
          console.log('📈 Actual months:', trends.map(t => t.month));

          // Fetch enterprise forecast for remaining months (same approach as Energy)
          const forecastRes = await fetch(`/api/sustainability/forecast?${dashboardParams}`);
          if (forecastRes.ok) {
            const forecastData = await forecastRes.json();

            if (forecastData.forecast && forecastData.forecast.length > 0) {
              console.log('🔮 Enterprise forecast loaded:', forecastData.forecast.length, 'months');
              console.log('🔮 Forecast months:', forecastData.forecast.map((f: any) => f.month));
              console.log('📊 Model:', forecastData.model, 'Confidence:', forecastData.confidence);

              // Filter forecast months to only include months AFTER actual data
              // Create a Set of actual month keys for fast lookup
              const actualMonthKeys = new Set(trends.map(t => t.month));

              const forecastMonths = forecastData.forecast
                .filter((f: any) => !actualMonthKeys.has(f.month)) // Only months not in actual data
                .map((f: any) => ({
                  month: f.month,
                  totalForecast: f.total || 0,
                  scope1Forecast: f.scope1 || 0,
                  scope2Forecast: f.scope2 || 0,
                  scope3Forecast: f.scope3 || 0,
                  forecast: true
                }));

              console.log('🔮 Filtered forecast months:', forecastMonths.length, '(removed', forecastData.forecast.length - forecastMonths.length, 'overlapping months)');

              // Calculate total projected emissions for the year (actual + forecast)
              // Sum up actual emissions from trends data
              const actualEmissions = trends.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
              const forecastedEmissionsTotal = forecastMonths.reduce((sum: number, f: any) => sum + f.totalForecast, 0);
              const projectedTotal = actualEmissions + forecastedEmissionsTotal;

              console.log('📊 Projected annual emissions:', {
                actual: actualEmissions.toFixed(1),
                forecasted: forecastedEmissionsTotal.toFixed(1),
                total: projectedTotal.toFixed(1)
              });

              // Store projected emissions in state for SBTi tracker and current card
              setProjectedAnnualEmissions(projectedTotal);
              setActualEmissionsYTD(actualEmissions);
              setForecastedEmissions(forecastedEmissionsTotal);

              // Create bridge point to connect actual and forecast lines
              const lastActual = trends[trends.length - 1];
              const bridgePoint = {
                month: lastActual.month,
                // Actual data keys (for solid lines)
                total: lastActual.total,
                scope1: lastActual.scope1,
                scope2: lastActual.scope2,
                scope3: lastActual.scope3,
                // Forecast data keys with same values (for dashed lines)
                totalForecast: lastActual.total,
                scope1Forecast: lastActual.scope1,
                scope2Forecast: lastActual.scope2,
                scope3Forecast: lastActual.scope3,
                bridge: true
              };

              console.log('📊 Final combined:', trends.length, 'actual +', forecastMonths.length, 'forecast =', trends.length + forecastMonths.length + 1, 'total months (with bridge)');
              setMonthlyTrends([...trends, bridgePoint, ...forecastMonths]);
            } else {
              console.log('⚠️ No forecast data returned');
              setMonthlyTrends(trends);
            }
          } else {
            console.warn('⚠️ Forecast API not available, showing actual data only');
            setMonthlyTrends(trends);
          }
        } else {
          console.log('⚠️ No trendData received');
        }

        // Use targets data already fetched above
        if (sbtiTargetsResult.targets && sbtiTargetsResult.targets.length > 0) {
          const allTargets = sbtiTargetsResult.targets;
          const activeTargets = allTargets.filter((t: any) => t.target_status === 'active');
          console.log('📊 All targets:', allTargets.length, 'Active targets:', activeTargets.length, activeTargets);
          setTotalTargets(activeTargets.length);

          // Calculate targets on track based on actual vs required progress
          const onTrack = activeTargets.filter((t: any) => {
            const baseline = t.baseline_emissions || 0;
            const current = t.current_emissions || 0;
            const target = t.target_emissions || 0;
            const baselineYear = t.baseline_year;
            const currentYear = new Date().getFullYear();
            const targetYear = t.target_year;

            // Calculate required emissions for current year (linear trajectory)
            const yearsElapsed = currentYear - baselineYear;
            const totalYears = targetYear - baselineYear;
            const totalReduction = baseline - target;
            const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
            const requiredEmissions = baseline - requiredReduction;

            // On track if current emissions <= required emissions (with 10% tolerance)
            return current <= requiredEmissions * 1.1;
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

  // Function to get category-specific colors
  const getCategoryColor = (name: string): string => {
    const nameLower = name.toLowerCase();

    // Electricity - Blue
    if (nameLower.includes('electricity') || nameLower.includes('grid')) {
      return '#3B82F6'; // Blue
    }

    // Natural Gas / Heating - Orange
    if (nameLower.includes('gas') || nameLower.includes('heating')) {
      return '#F97316'; // Orange
    }

    // Transportation / Vehicles - Purple
    if (nameLower.includes('transport') || nameLower.includes('vehicle') || nameLower.includes('fleet')) {
      return '#8B5CF6'; // Purple
    }

    // Waste - Brown
    if (nameLower.includes('waste')) {
      return '#92400E'; // Brown
    }

    // Business Travel - Indigo
    if (nameLower.includes('travel') || nameLower.includes('flight')) {
      return '#4F46E5'; // Indigo
    }

    // Cooling / Refrigerants - Cyan
    if (nameLower.includes('cooling') || nameLower.includes('refrigerant') || nameLower.includes('hvac')) {
      return '#06B6D4'; // Cyan
    }

    // Fuel - Red
    if (nameLower.includes('fuel') || nameLower.includes('diesel') || nameLower.includes('petrol')) {
      return '#EF4444'; // Red
    }

    // Water - Teal
    if (nameLower.includes('water')) {
      return '#14B8A6'; // Teal
    }

    // Default - Gray
    return '#6B7280'; // Gray
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

        {/* Data Quality */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Data Quality</span>
            <Info className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {dataQuality?.primaryDataPercentage || 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Primary Data</div>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">Verified</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {dataQuality?.verifiedPercentage || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full transition-all"
                style={{ width: `${dataQuality?.verifiedPercentage || 0}%` }}
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
                GHG Scope 1
              </span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Scope 2
              </span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Scope 3
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-2
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-3
              </span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                TCFD
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
                              Direct GHG emissions from sources owned or controlled by the organization (e.g., company vehicles, on-site fuel combustion)
                            </div>
                            <div className="font-medium">{scope1Total.toFixed(1)} tCO2e ({scopePercentages.scope1.toFixed(0)}%)</div>
                          </div>
                        );
                      } else if (scopeName === 'Scope 2') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
                            <div className="font-semibold mb-2">Scope 2: Purchased Energy</div>
                            <div className="space-y-1 text-gray-300 mb-2">
                              <div><span className="font-medium">Location-Based:</span> {scope2LocationBased.toFixed(1)} tCO2e</div>
                              <div><span className="font-medium">Market-Based:</span> {scope2MarketBased.toFixed(1)} tCO2e</div>
                            </div>
                            <div className="text-gray-300 mb-2">
                              Indirect emissions from purchased electricity, heating, cooling, and steam. Dual reporting per GRI 305-2 & GHG Protocol.
                            </div>
                            <div className="font-medium">{scope2Total.toFixed(1)} tCO2e ({scopePercentages.scope2.toFixed(0)}%)</div>
                          </div>
                        );
                      } else if (scopeName === 'Scope 3') {
                        return (
                          <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
                            <div className="font-semibold mb-2">Scope 3: Value Chain Emissions</div>
                            <div className="space-y-1 text-gray-300 mb-2">
                              <div><span className="font-medium">Total Emissions:</span> {scope3Total.toFixed(1)} tCO2e</div>
                              <div><span className="font-medium">Percentage:</span> {scopePercentages.scope3.toFixed(0)}%</div>
                              <div className="pt-1 border-t border-gray-700 mt-1">
                                <div className="font-medium mb-1">Category Coverage: {scope3Coverage?.tracked || 0}/15</div>
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-green-400">✓ {scope3Coverage?.tracked || 0} Tracked</span>
                                  <span className="text-orange-400">⚠ {scope3Coverage?.missing || 12} Missing</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-gray-300 text-[10px]">
                              All indirect emissions in value chain (upstream & downstream). Per GRI 305-3.
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

          {monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  style={{ fontSize: '10px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: '10px' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isForecast = data.forecast;

                      // Get values from either actual or forecast keys
                      const scope1 = data.scope1 ?? data.scope1Forecast;
                      const scope2 = data.scope2 ?? data.scope2Forecast;
                      const scope3 = data.scope3 ?? data.scope3Forecast;
                      const total = data.total ?? data.totalForecast;

                      // Skip if all values are null
                      if (!total && !scope1 && !scope2 && !scope3) {
                        return null;
                      }
                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.month}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          <div className="space-y-1">
                            {scope1 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-red-400 text-sm">Scope 1:</span>
                                <span className="text-white font-medium">{scope1.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {scope2 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-blue-400 text-sm">Scope 2:</span>
                                <span className="text-white font-medium">{scope2.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {scope3 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-400 text-sm">Scope 3:</span>
                                <span className="text-white font-medium">{scope3.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {total != null && (
                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-700">
                                <span className="text-purple-400 text-sm font-semibold">Total:</span>
                                <span className="text-white font-semibold">{total.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  name="Total Emissions"
                  dot={{ r: 4, fill: "#8B5CF6" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope1"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Scope 1"
                  dot={{ r: 3, fill: "#EF4444" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope2"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Scope 2"
                  dot={{ r: 3, fill: "#3B82F6" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope3"
                  stroke="#6B7280"
                  strokeWidth={2}
                  name="Scope 3"
                  dot={{ r: 3, fill: "#6B7280" }}
                  connectNulls
                />
                {/* Forecast data - dashed lines (hidden from legend) */}
                <Line
                  type="monotone"
                  dataKey="totalForecast"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  strokeDasharray="5 5"
                  name="Total Emissions"
                  dot={{ fill: 'transparent', stroke: "#8B5CF6", strokeWidth: 2, r: 4 }}
                  connectNulls
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="scope1Forecast"
                  stroke="#EF4444"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Scope 1"
                  dot={{ fill: 'transparent', stroke: "#EF4444", strokeWidth: 2, r: 3 }}
                  connectNulls
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="scope2Forecast"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Scope 2"
                  dot={{ fill: 'transparent', stroke: "#3B82F6", strokeWidth: 2, r: 3 }}
                  connectNulls
                  legendType="none"
                />
                <Line
                  type="monotone"
                  dataKey="scope3Forecast"
                  stroke="#6B7280"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Scope 3"
                  dot={{ fill: 'transparent', stroke: "#6B7280", strokeWidth: 2, r: 3 }}
                  connectNulls
                  legendType="none"
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

      {/* Organizational Boundaries */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Factory className="w-5 h-5 text-purple-500" />
              Organizational Boundaries
            </h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 2-1
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 2-6
              </span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
            </div>
          </div>

          {orgBoundaries ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Consolidation Approach
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {orgBoundaries.consolidationApproach}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Sites Included
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {orgBoundaries.sitesIncluded}/{orgBoundaries.sitesTotal}
                  <span className="text-sm text-green-600 dark:text-green-400 ml-2">
                    ({orgBoundaries.coverage}%)
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Base Year
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {orgBoundaries.baseYear}
                </div>
              </div>

              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Employees (FTE)
                </div>
                <div className="text-base font-semibold text-gray-900 dark:text-white">
                  {orgBoundaries.employees?.toLocaleString() || 'Not set'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-400 text-sm">
              Loading organizational data...
            </div>
          )}

          {/* SBTi Targets Section */}
          {sbtiTargets && sbtiTargets.hasTargets && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Science Based Targets
                </h4>
                {sbtiTargets.validated && (
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded font-medium">
                    SBTi Validated ✓
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {sbtiTargets.ambition && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Ambition
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {sbtiTargets.ambition === '1.5C' ? '1.5°C aligned' :
                       sbtiTargets.ambition === 'well-below-2C' ? 'Well-below 2°C' :
                       sbtiTargets.ambition === 'net-zero' ? 'Net-Zero' : sbtiTargets.ambition}
                    </div>
                  </div>
                )}

                {sbtiTargets.nearTermTarget && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Near-term Target
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      -{sbtiTargets.nearTermTarget.reductionPercent}% by {sbtiTargets.nearTermTarget.targetYear}
                    </div>
                  </div>
                )}

                {sbtiTargets.netZeroTarget && (
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Net-Zero Target
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {sbtiTargets.netZeroTarget.targetYear}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Top Emitters */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Emission Sources</h3>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-5
              </span>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                TCFD
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {topEmitters.map((emitter, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3 group relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {index + 1}. {emitter.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-900 dark:text-white font-semibold">
                      {emitter.emissions.toFixed(1)} tCO2e
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({emitter.percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${emitter.percentage}%`,
                      backgroundColor: getCategoryColor(emitter.name)
                    }}
                  />
                </div>

                {/* Tooltip with recommendation */}
                <div className="absolute left-0 top-full mt-2 w-full p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="font-semibold mb-1 text-blue-400">Recommendation:</div>
                  <div className="text-gray-300">{getActionRecommendation(emitter.name)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SBTi Target Progress - Only show for current year */}
      {targetData?.targets && targetData.targets.length > 0 &&
       new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-6">
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
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-wrap justify-end">
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                    SBTi
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                    GRI 305-5
                  </span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                    TCFD
                  </span>
                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                    ESRS E1
                  </span>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  {(targetData.targets[0].reduction_percentage || 0).toFixed(1)}% Reduction Target
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {/* Baseline */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Baseline ({targetData.targets[0].baseline_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].baseline_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Current */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Current ({new Date().getFullYear()})
                    {targetData.targets[0].is_forecast && (
                      <span className="ml-1 text-purple-500">*</span>
                    )}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {projectedAnnualEmissions > 0 && forecastedEmissions > 0 ? (
                    <span className="text-sm">
                      {actualEmissionsYTD.toFixed(1)} + {forecastedEmissions.toFixed(1)}
                    </span>
                  ) : (
                    <span>{(targetData.targets[0].current_emissions || totalEmissions)?.toFixed(1)}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {projectedAnnualEmissions > 0 ? (
                    <span className="text-purple-500">Actual + ML Forecast</span>
                  ) : (
                    <span>tCO2e</span>
                  )}
                </div>
              </div>

              {/* Required (Current Year Target) */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Required ({new Date().getFullYear()})
                  </span>
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    const target = targetData.targets[0].target_emissions || 0;
                    const baselineYear = targetData.targets[0].baseline_year;
                    const targetYear = targetData.targets[0].target_year;
                    const currentYear = new Date().getFullYear();

                    const yearsElapsed = currentYear - baselineYear;
                    const totalYears = targetYear - baselineYear;
                    const totalReduction = baseline - target;
                    const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                    const requiredEmissions = baseline - requiredReduction;

                    return requiredEmissions.toFixed(1);
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e on track</div>
              </div>

              {/* Target */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Target ({targetData.targets[0].target_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].target_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Progress */}
              <div className="bg-white/50 dark:bg-gray-800/30 rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Progress</span>
                </div>
                <div className="text-xl font-bold">
                  {(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    // Use ML-forecasted annual projection
                    const current = projectedAnnualEmissions || targetData.targets[0].current_emissions || totalEmissions;
                    const target = targetData.targets[0].target_emissions || 0;

                    // Check if emissions increased or decreased
                    if (current > baseline) {
                      // Emissions INCREASED - show as % above baseline
                      const increasePercent = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
                      return (
                        <span className="text-red-600 dark:text-red-400">
                          ↑ {increasePercent.toFixed(1)}%
                        </span>
                      );
                    } else {
                      // Emissions DECREASED - show progress toward target
                      const progress = baseline > 0 ? ((baseline - current) / (baseline - target)) * 100 : 0;
                      const progressColor = progress >= 95 ? 'text-green-600 dark:text-green-400' :
                                          progress >= 85 ? 'text-yellow-600 dark:text-yellow-400' :
                                          'text-orange-600 dark:text-orange-400';
                      return (
                        <span className={progressColor}>
                          {progress.toFixed(1)}%
                        </span>
                      );
                    }
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    const baselineYear = targetData.targets[0].baseline_year;
                    // Use ML-forecasted annual projection
                    const current = projectedAnnualEmissions || targetData.targets[0].current_emissions || totalEmissions;
                    const currentYear = new Date().getFullYear();
                    const yearsElapsed = currentYear - baselineYear;
                    const annualRate = targetData.targets[0].annual_reduction_rate || 4.2;
                    const requiredReduction = annualRate * yearsElapsed;

                    if (current > baseline) {
                      return 'Above Baseline';
                    } else {
                      const actualReduction = baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;
                      const status = actualReduction >= requiredReduction ? 'On Track' : 'At Risk';
                      return status;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Waterfall Chart */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Emissions Trajectory</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={(() => {
                    const baseline = targetData.targets[0].baseline_emissions || 0;
                    // Use ML-forecasted annual projection instead of simple extrapolation
                    const current = projectedAnnualEmissions || targetData.targets[0].current_emissions || totalEmissions;
                    const target = targetData.targets[0].target_emissions || 0;
                    const baselineYear = targetData.targets[0].baseline_year;
                    const currentYear = new Date().getFullYear();
                    const targetYear = targetData.targets[0].target_year;

                    // Calculate the change from baseline to current
                    const changeFromBaseline = current - baseline;

                    // Calculate required emissions for current year (linear trajectory)
                    const yearsElapsed = currentYear - baselineYear;
                    const totalYears = targetYear - baselineYear;
                    const totalReduction = baseline - target;
                    const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                    const requiredEmissions = baseline - requiredReduction;
                    const gapFromRequired = current - requiredEmissions;

                    // Waterfall data with invisible base bars and visible change bars
                    return [
                      {
                        name: `${baselineYear}\nBaseline`,
                        base: 0,
                        value: baseline,
                        total: baseline,
                        label: baseline.toFixed(1)
                      },
                      {
                        name: `Required\nReduction`,
                        base: requiredEmissions, // Position at the bottom (where we should end up)
                        value: requiredReduction, // Height of the reduction bar
                        total: baseline, // Connects to baseline
                        label: `-${requiredReduction.toFixed(1)}`,
                        isRequiredReduction: true
                      },
                      {
                        name: `${currentYear}\nRequired`,
                        base: 0,
                        value: requiredEmissions,
                        total: requiredEmissions,
                        label: requiredEmissions.toFixed(1),
                        isRequired: true
                      },
                      {
                        name: 'Gap from\nRequired',
                        base: requiredEmissions,
                        value: gapFromRequired,
                        total: current,
                        label: `+${gapFromRequired.toFixed(1)}`,
                        isGap: true
                      },
                      {
                        name: `${currentYear}\nActual`,
                        base: 0,
                        value: current,
                        total: current,
                        label: current.toFixed(1),
                        isCurrent: true
                      },
                      {
                        name: `${targetYear}\nTarget`,
                        base: 0,
                        value: target,
                        total: target,
                        label: target.toFixed(1),
                        isTarget: true
                      }
                    ];
                  })()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={11}
                    tick={{ fill: '#6b7280' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    fontSize={11}
                    tick={{ fill: '#6b7280' }}
                    label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                    }}
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        const value = Math.abs(data.value || 0);
                        const total = data.total || 0;

                        return (
                          <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                            <p className="text-white font-semibold mb-2">
                              {data.name.replace('\n', ' ')}
                            </p>
                            <div className="space-y-1 text-xs">
                              {data.label && data.label.includes('-') ? (
                                <p className="text-green-400">
                                  Reduction: <span className="font-medium">{value.toFixed(1)} tCO2e</span>
                                </p>
                              ) : data.label && data.label.includes('+') ? (
                                <p className="text-red-400">
                                  Increase: <span className="font-medium">{value.toFixed(1)} tCO2e</span>
                                </p>
                              ) : (
                                <p className="text-gray-300">
                                  Total: <span className="font-medium text-white">{total.toFixed(1)} tCO2e</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Invisible base bars to create waterfall effect */}
                  <Bar dataKey="base" stackId="a" fill="transparent" />
                  {/* Visible value bars */}
                  <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                    {(() => {
                      const baseline = targetData.targets[0].baseline_emissions || 0;
                      const current = targetData.targets[0].current_emissions || totalEmissions;
                      const target = targetData.targets[0].target_emissions || 0;

                      const yearsElapsed = new Date().getFullYear() - targetData.targets[0].baseline_year;
                      const totalYears = targetData.targets[0].target_year - targetData.targets[0].baseline_year;
                      const totalReduction = baseline - target;
                      const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                      const requiredEmissions = baseline - requiredReduction;

                      const colors = [
                        '#6b7280', // baseline - gray
                        '#10b981', // required reduction - green (downward)
                        '#3b82f6', // required target - blue
                        '#ef4444', // gap from required - red (upward, showing we're off track)
                        '#f97316', // current actual - orange
                        '#10b981' // final target - green
                      ];

                      return colors.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ));
                    })()}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
