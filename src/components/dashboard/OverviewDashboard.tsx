'use client';

import React, { useState, useMemo } from 'react';
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
  Info,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  Building2,
  BookOpen,
  HelpCircle,
  Lightbulb
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
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import { FloatingHelpButton } from '@/components/education/FloatingHelpButton';
import { EducationalModal } from '@/components/education/EducationalModal';
import { getCarbonEquivalent } from '@/lib/education/carbon-equivalents';
import { useOverviewDashboard } from '@/hooks/useDashboardData';

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
  const t = useTranslations('sustainability.dashboard');
  const tEmissions = useTranslations('sustainability.ghgEmissions');
  const { t: tGlobal } = useLanguage(); // For carbon equivalents translations

  // Fetch data with React Query (cached, parallel)
  const {
    scopeAnalysis,
    targets: targetsQuery,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    dashboard: dashboardQuery,
    forecast: forecastQuery,
    topMetrics: topMetricsQuery,
    isLoading
  } = useOverviewDashboard(selectedPeriod, selectedSite, organizationId);

  // Helper function to get action recommendations
  const getActionRecommendation = (categoryName: string): string => {
    const nameLower = categoryName.toLowerCase();

    if (nameLower.includes('electricity') || nameLower.includes('grid')) {
      return t('topEmitters.recommendations.electricity');
    }
    if (nameLower.includes('natural gas') || nameLower.includes('gas')) {
      return t('topEmitters.recommendations.naturalGas');
    }
    if (nameLower.includes('business travel') || nameLower.includes('travel')) {
      return t('topEmitters.recommendations.businessTravel');
    }
    if (nameLower.includes('fleet') || nameLower.includes('vehicle')) {
      return t('topEmitters.recommendations.fleet');
    }
    if (nameLower.includes('waste') || nameLower.includes('disposal')) {
      return t('topEmitters.recommendations.waste');
    }
    if (nameLower.includes('heating')) {
      return t('topEmitters.recommendations.heating');
    }
    if (nameLower.includes('cooling')) {
      return t('topEmitters.recommendations.cooling');
    }
    if (nameLower.includes('commut')) {
      return t('topEmitters.recommendations.commuting');
    }
    if (nameLower.includes('water')) {
      return t('topEmitters.recommendations.water');
    }

    return t('topEmitters.recommendations.default');
  };

  // Helper function to translate month abbreviations
  const translateMonth = (monthAbbr: string, t: (key: string) => string): string => {
    const monthLower = monthAbbr.toLowerCase().trim();

    const monthMap: { [key: string]: string } = {
      'jan': 'jan',
      'feb': 'feb',
      'mar': 'mar',
      'apr': 'apr',
      'may': 'may',
      'jun': 'jun',
      'jul': 'jul',
      'aug': 'aug',
      'sep': 'sep',
      'oct': 'oct',
      'nov': 'nov',
      'dec': 'dec'
    };

    const key = monthMap[monthLower];
    if (key) {
      const translated = t(key);
      if (translated && translated !== key) {
        return translated;
      }
    }

    return monthAbbr;
  };

  // Compute all dashboard metrics with useMemo (synchronous, single re-render)
  const dashboardMetrics = useMemo(() => {
    // Wait for all required data to be available
    if (!scopeAnalysis.data || !dashboardQuery.data) {
      return {
        totalEmissions: 0,
        totalEmissionsYoY: 0,
        intensityMetric: 0,
        intensityYoY: 0,
        scope1Total: 0,
        scope2Total: 0,
        scope3Total: 0,
        scopeYoY: { scope1: 0, scope2: 0, scope3: 0 },
        monthlyTrends: [],
        projectedAnnualEmissions: 0,
        actualEmissionsYTD: 0,
        forecastedEmissions: 0,
        previousYearTotalEmissions: 0,
        targetsOnTrack: 0,
        totalTargets: 0,
        overallProgress: 0,
        topEmitters: [],
        siteComparison: [],
        dataQuality: null,
        scope2LocationBased: 0,
        scope2MarketBased: 0,
        renewablePercentage: 0,
        scope3Coverage: null,
        orgBoundaries: null,
        sbtiTargets: null,
        targetData: null,
        orgEmployees: 200,
      };
    }

    try {
      // Get data from React Query hooks
      const scopeData = scopeAnalysis.data;
      const sbtiTargetsResult = targetsQuery.data;
      const prevScopeData = prevYearScopeAnalysis.data;
      const fullPrevYearData = fullPrevYearScopeAnalysis.data;
      const dashboardData = dashboardQuery.data;
      const forecastResult = forecastQuery.data;
      const topMetricsData = topMetricsQuery.data;

      // Set targetData
      const targetData = sbtiTargetsResult || null;

      // Extract scope totals
      const extractedScopeData = scopeData.scopeData || scopeData;
      const prevExtractedScopeData = prevScopeData?.scopeData || prevScopeData || {};
      const fullPrevYearExtractedScopeData = fullPrevYearData?.scopeData || fullPrevYearData || {};

      const s1Current = extractedScopeData.scope_1?.total || 0;
      const s2Current = extractedScopeData.scope_2?.total || 0;
      const s3Current = extractedScopeData.scope_3?.total || 0;

      const s1Previous = prevExtractedScopeData.scope_1?.total || 0;
      const s2Previous = prevExtractedScopeData.scope_2?.total || 0;
      const s3Previous = prevExtractedScopeData.scope_3?.total || 0;

      const s1FullPrevYear = fullPrevYearExtractedScopeData.scope_1?.total || 0;
      const s2FullPrevYear = fullPrevYearExtractedScopeData.scope_2?.total || 0;
      const s3FullPrevYear = fullPrevYearExtractedScopeData.scope_3?.total || 0;

      const currentTotal = s1Current + s2Current + s3Current;
      const previousTotal = s1Previous + s2Previous + s3Previous;
      const fullPreviousYearTotal = s1FullPrevYear + s2FullPrevYear + s3FullPrevYear;

      const scope1Total = s1Current;
      const scope2Total = s2Current;
      const scope3Total = s3Current;
      const totalEmissions = currentTotal;
      const previousYearTotalEmissions = fullPreviousYearTotal;

      // Calculate YoY changes
      const totalYoY = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
      const s1YoY = s1Previous > 0 ? ((s1Current - s1Previous) / s1Previous) * 100 : 0;
      const s2YoY = s2Previous > 0 ? ((s2Current - s2Previous) / s2Previous) * 100 : 0;
      const s3YoY = s3Previous > 0 ? ((s3Current - s3Previous) / s3Previous) * 100 : 0;

      const totalEmissionsYoY = totalYoY;
      const scopeYoY = { scope1: s1YoY, scope2: s2YoY, scope3: s3YoY };

      // Extract new enhanced data from API
      const dataQuality = scopeData.dataQuality || null;
      const scope3Coverage = scopeData.scope3Coverage || null;

      let orgBoundaries = null;
      let orgEmployees = 200; // Default value
      if (scopeData.organizationalBoundaries) {
        orgBoundaries = scopeData.organizationalBoundaries;
        // Update org employees from API
        if (scopeData.organizationalBoundaries.employees) {
          orgEmployees = scopeData.organizationalBoundaries.employees;
        }
      }

      // Extract SBTi targets
      const sbtiTargets = scopeData.sbtiTargets || null;

      // Scope 2 dual reporting
      const scope2LocationBased = extractedScopeData.scope_2?.location_based || 0;
      const scope2MarketBased = extractedScopeData.scope_2?.market_based || 0;
      const renewablePercentage = extractedScopeData.scope_2?.renewable_percentage || 0;

      // Calculate intensity (tCO2e per employee) - use employees from API if available
      const employees = scopeData.organizationalBoundaries?.employees || orgEmployees;
      const currentIntensity = employees > 0 ? currentTotal / employees : 0;
      const previousIntensity = employees > 0 ? previousTotal / employees : 0;
      const intensityYoYCalc = previousIntensity > 0 ? ((currentIntensity - previousIntensity) / previousIntensity) * 100 : 0;

      const intensityMetric = currentIntensity;
      const intensityYoY = intensityYoYCalc;

      // Process top emitters data
      let topEmitters: Array<{ name: string; emissions: number; percentage: number }> = [];
      if (topMetricsData?.metrics && topMetricsData.metrics.length > 0) {
        topEmitters = topMetricsData.metrics.slice(0, 5).map((metric: any) => ({
          name: metric.name,
          emissions: metric.emissions,
          percentage: currentTotal > 0 ? (metric.emissions / currentTotal) * 100 : 0
        }));
      }

      // Transform to monthly emissions with enterprise forecasting
      let monthlyTrends: any[] = [];
      let projectedAnnualEmissions = 0;
      let actualEmissionsYTD = 0;
      let forecastedEmissions = 0;
      let targetsOnTrack = 0;
      let totalTargets = 0;
      let overallProgress = 0;

      if (dashboardData.trendData && dashboardData.trendData.length > 0) {
        const trends = dashboardData.trendData.map((m: any) => ({
          month: m.month,
          total: m.emissions || 0,
          scope1: m.scope1 || 0,
          scope2: m.scope2 || 0,
          scope3: m.scope3 || 0,
          forecast: false
        }));

        // Process forecast data (already fetched in parallel)
        if (forecastResult && forecastResult.forecast && forecastResult.forecast.length > 0) {
          const forecastData = forecastResult;

          if (forecastData.forecast && forecastData.forecast.length > 0) {

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

            // Calculate total projected emissions for the year (actual + forecast)
            // Sum up actual emissions from trends data
            const actualEmissions = trends.reduce((sum: number, t: any) => sum + (t.total || 0), 0);
            const forecastedEmissionsTotal = forecastMonths.reduce((sum: number, f: any) => sum + f.totalForecast, 0);
            const projectedTotal = actualEmissions + forecastedEmissionsTotal;

            console.log('📊 Projected annual emissions:', {
              actual: actualEmissions.toFixed(1),
              forecasted: forecastedEmissionsTotal.toFixed(1),
              total: projectedTotal.toFixed(1),
              previousYearFullTotal: fullPreviousYearTotal.toFixed(1),
              projectedYoY: fullPreviousYearTotal > 0 ? (((projectedTotal - fullPreviousYearTotal) / fullPreviousYearTotal) * 100).toFixed(1) + '%' : '0%'
            });

            // Store projected emissions for SBTi tracker and current card
            projectedAnnualEmissions = projectedTotal;
            actualEmissionsYTD = actualEmissions;
            forecastedEmissions = forecastedEmissionsTotal;

            // Add forecast keys to the last actual data point to create smooth transition
            const lastActual = trends[trends.length - 1];
            const modifiedTrends = [...trends];
            modifiedTrends[modifiedTrends.length - 1] = {
              ...lastActual,
              // Add forecast data keys with same values to create transition point
              totalForecast: lastActual.total,
              scope1Forecast: lastActual.scope1,
              scope2Forecast: lastActual.scope2,
              scope3Forecast: lastActual.scope3
            };

            monthlyTrends = [...modifiedTrends, ...forecastMonths];

            // Calculate target tracking AFTER we have the projected total
            // This ensures we use the ML-forecasted projection, not just YTD
            // IMPORTANT: This must be inside the forecast block to access projectedTotal
            if (sbtiTargetsResult?.targets && sbtiTargetsResult.targets.length > 0) {
              const allTargets = sbtiTargetsResult.targets;
              // Filter out auto-calculated targets (they have 'calculated-' prefix in their ID)
              // Only show committed targets that exist in the database
              const committedTargets = allTargets.filter((t: any) =>
                !t.id?.toString().startsWith('calculated-')
              );
              // API returns 'status' field, not 'target_status'
              const activeTargets = committedTargets.filter((t: any) =>
                t.status === 'on_track' || t.status === 'at_risk' || t.status === 'off_track' || t.status === 'active'
              );
              totalTargets = activeTargets.length;

              // Calculate targets on track based on projected vs required progress
              // Use projectedTotal directly (local variable from forecast calculation)
              const onTrack = activeTargets.filter((t: any) => {
                const baseline = t.baseline_emissions || 0;
                // Use ML-forecasted projected total (local variable, not state)
                const current = projectedTotal || currentTotal || 0;
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

                // On track if projected emissions <= required emissions (with 10% tolerance)
                return current <= requiredEmissions * 1.1;
              }).length;

              targetsOnTrack = onTrack;

              const avgProgress = activeTargets.length > 0
                ? (onTrack / activeTargets.length) * 100
                : 0;
              overallProgress = avgProgress;
            }
          } else {
            monthlyTrends = trends;
          }
        } else {
          console.warn('⚠️ Forecast API not available, showing actual data only');
          monthlyTrends = trends;
        }
      }

      return {
        totalEmissions,
        totalEmissionsYoY,
        intensityMetric,
        intensityYoY,
        scope1Total,
        scope2Total,
        scope3Total,
        scopeYoY,
        monthlyTrends,
        projectedAnnualEmissions,
        actualEmissionsYTD,
        forecastedEmissions,
        previousYearTotalEmissions,
        targetsOnTrack,
        totalTargets,
        overallProgress,
        topEmitters,
        siteComparison: dashboardData?.siteComparison || [],
        dataQuality,
        scope2LocationBased,
        scope2MarketBased,
        renewablePercentage,
        scope3Coverage,
        orgBoundaries,
        sbtiTargets,
        targetData,
        orgEmployees,
      };
    } catch (error) {
      console.error('Error processing overview data:', error);
      return {
        totalEmissions: 0,
        totalEmissionsYoY: 0,
        intensityMetric: 0,
        intensityYoY: 0,
        scope1Total: 0,
        scope2Total: 0,
        scope3Total: 0,
        scopeYoY: { scope1: 0, scope2: 0, scope3: 0 },
        monthlyTrends: [],
        projectedAnnualEmissions: 0,
        actualEmissionsYTD: 0,
        forecastedEmissions: 0,
        previousYearTotalEmissions: 0,
        targetsOnTrack: 0,
        totalTargets: 0,
        overallProgress: 0,
        topEmitters: [],
        siteComparison: [],
        dataQuality: null,
        scope2LocationBased: 0,
        scope2MarketBased: 0,
        renewablePercentage: 0,
        scope3Coverage: null,
        orgBoundaries: null,
        sbtiTargets: null,
        targetData: null,
        orgEmployees: 200,
      };
    }
  }, [
    scopeAnalysis.data,
    targetsQuery.data,
    prevYearScopeAnalysis.data,
    fullPrevYearScopeAnalysis.data,
    dashboardQuery.data,
    forecastQuery.data,
    topMetricsQuery.data,
    selectedPeriod,
    selectedSite,
    organizationId
  ]);

  // Destructure computed metrics for cleaner code
  const {
    totalEmissions,
    totalEmissionsYoY,
    intensityMetric,
    intensityYoY,
    scope1Total,
    scope2Total,
    scope3Total,
    scopeYoY,
    monthlyTrends,
    projectedAnnualEmissions,
    actualEmissionsYTD,
    forecastedEmissions,
    previousYearTotalEmissions,
    targetsOnTrack,
    totalTargets,
    overallProgress,
    topEmitters,
    siteComparison,
    dataQuality,
    scope2LocationBased,
    scope2MarketBased,
    renewablePercentage,
    scope3Coverage,
    orgBoundaries,
    sbtiTargets,
    targetData,
    orgEmployees,
  } = dashboardMetrics;

  // UI-only state (keep as useState) - must be defined before early return
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [activeEducationalModal, setActiveEducationalModal] = useState<string | null>(null);

  const toggleTooltip = (tooltipId: string) => {
    setActiveTooltip(activeTooltip === tooltipId ? null : tooltipId);
  };

  // Function to get category-specific colors (must be before pieChartData useMemo)
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

  // Transform topEmitters into pie chart data (top 5 + Others)
  const pieChartData = useMemo(() => {
    if (topEmitters.length === 0) return [];

    // Take top 5 sources
    const top5 = topEmitters.slice(0, 5);
    const others = topEmitters.slice(5);

    // Calculate "Others" total if there are more than 5 sources
    const othersTotal = others.reduce((sum, source) => sum + source.emissions, 0);
    const othersPercentage = others.reduce((sum, source) => sum + source.percentage, 0);

    // Create pie chart data array
    const chartData = top5.map(source => ({
      name: source.name,
      value: source.emissions,
      percentage: source.percentage,
      color: getCategoryColor(source.name)
    }));

    // Add "Others" category if needed
    if (others.length > 0) {
      chartData.push({
        name: 'Others',
        value: othersTotal,
        percentage: othersPercentage,
        color: '#6B7280' // Gray color for Others
      });
    }

    // Custom sort: Electricity, EV Charging, Plane Travel, then others
    chartData.sort((a, b) => {
      const order = ['Electricity', 'EV Charging', 'Plane Travel'];
      const aIndex = order.findIndex(item => a.name.includes(item));
      const bIndex = order.findIndex(item => b.name.includes(item));

      // If both are in the order list, sort by their order
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      // If only a is in the list, it comes first
      if (aIndex !== -1) return -1;
      // If only b is in the list, it comes first
      if (bIndex !== -1) return 1;
      // Keep "Others" at the end
      if (a.name === 'Others') return 1;
      if (b.name === 'Others') return -1;
      // Otherwise maintain original order
      return 0;
    });

    return chartData;
  }, [topEmitters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto" />
          <p className="text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Scope breakdown data for pie chart
  const scopeBreakdown = [
    { name: t('emissionsTrend.scope1'), value: scope1Total, color: '#EF4444' },
    { name: t('emissionsTrend.scope2'), value: scope2Total, color: '#3B82F6' },
    { name: t('emissionsTrend.scope3'), value: scope3Total, color: '#6B7280' }
  ].filter(s => s.value > 0);

  const scopePercentages = {
    scope1: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
    scope2: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
    scope3: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0
  };

  return (
    <>
      {/* Executive Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total Emissions */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear()
                ? t('cards.totalEmissions.ytdTitle')
                : t('cards.totalEmissions.title')}
            </span>
          </div>
          <div>
            <div className="relative group">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1 cursor-help">
                {totalEmissions.toFixed(1)}
              </div>
              {/* Carbon Equivalent Tooltip on Emissions Value */}
              {(() => {
                const carbonEquiv = getCarbonEquivalent(totalEmissions, orgBoundaries?.country || 'portugal', tGlobal);
                return carbonEquiv && (
                  <div className="absolute left-0 top-full mt-1 w-72 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    {/* Intro */}
                    <div className="mb-2">
                      <p className="text-purple-200 text-[11px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.intro')}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{carbonEquiv.icon}</span>
                        <span className="font-semibold text-white">{carbonEquiv.description}</span>
                      </div>
                    </div>

                    {carbonEquiv.educationalContext && (
                      <div className="mb-2 pt-2 border-t border-purple-500/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-purple-300">ℹ️</span>
                          <span className="font-semibold text-purple-200">{tGlobal('carbonEquivalentTooltip.howThisWorks')}</span>
                        </div>
                        <p className="text-gray-200 text-[11px] leading-relaxed">
                          {carbonEquiv.educationalContext}
                        </p>
                      </div>
                    )}
                    {carbonEquiv.didYouKnow && (
                      <div className="pt-2 border-t border-purple-500/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-yellow-300">💡</span>
                          <span className="font-semibold text-yellow-200">{tGlobal('carbonEquivalentTooltip.didYouKnow')}</span>
                        </div>
                        <p className="text-gray-200 text-[11px] leading-relaxed">
                          {carbonEquiv.didYouKnow}
                        </p>
                      </div>
                    )}

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.ghgProtocol')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.gri305')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.tcfd')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.esrsE1')}
                        </span>
                      </div>
                    </div>

                    {/* Learn More Link */}
                    <div className="mt-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEducationalModal('carbon-basics');
                        }}
                        className="text-blue-300 hover:text-blue-200 text-[10px] underline transition-colors"
                      >
                        {t('learnMore')} →
                      </button>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
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
            {projectedAnnualEmissions > 0 &&
             forecastedEmissions > 0 &&
             new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-purple-500 dark:text-purple-400">
                  {t('cards.totalEmissions.projected')}: {projectedAnnualEmissions.toFixed(1)} tCO2e
                </span>
                {(() => {
                  // Calculate YoY for projected emissions: compare projected annual vs previous year's total
                  const projectedYoY = previousYearTotalEmissions > 0
                    ? ((projectedAnnualEmissions - previousYearTotalEmissions) / previousYearTotalEmissions) * 100
                    : 0;

                  return (
                    <div className="flex items-center gap-1">
                      {projectedYoY < 0 ? (
                        <TrendingDown className="w-3 h-3 text-green-500" />
                      ) : (
                        <TrendingUp className={`w-3 h-3 ${projectedYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                      )}
                      <span className={`text-xs ${projectedYoY < 0 ? 'text-green-500' : projectedYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        {projectedYoY > 0 ? '+' : ''}{projectedYoY.toFixed(1)}% YoY
                      </span>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Emissions Intensity */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.intensity.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="relative group">
              <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                {intensityMetric.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.intensity.unit')}</div>
              {/* Carbon Equivalent Tooltip on Emissions Value */}
              {(() => {
                const carbonEquiv = getCarbonEquivalent(intensityMetric, orgBoundaries?.country || 'portugal', tGlobal);
                return carbonEquiv && (
                  <div className="absolute left-0 top-full mt-1 w-72 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    {/* Intensity Explanation */}
                    <div className="mb-2 pb-2 border-b border-purple-500/30">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        {t('intensityExplanation')}
                      </p>
                    </div>

                    {/* Intro */}
                    <div className="mb-2">
                      <p className="text-purple-200 text-[11px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.intro')}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">{carbonEquiv.icon}</span>
                        <span className="font-semibold text-white">{carbonEquiv.description}</span>
                      </div>
                    </div>

                    {carbonEquiv.educationalContext && (
                      <div className="mb-2 pt-2 border-t border-purple-500/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-purple-300">ℹ️</span>
                          <span className="font-semibold text-purple-200">{tGlobal('carbonEquivalentTooltip.howThisWorks')}</span>
                        </div>
                        <p className="text-gray-200 text-[11px] leading-relaxed">
                          {carbonEquiv.educationalContext}
                        </p>
                      </div>
                    )}
                    {carbonEquiv.didYouKnow && (
                      <div className="pt-2 border-t border-purple-500/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-yellow-300">💡</span>
                          <span className="font-semibold text-yellow-200">{tGlobal('carbonEquivalentTooltip.didYouKnow')}</span>
                        </div>
                        <p className="text-gray-200 text-[11px] leading-relaxed">
                          {carbonEquiv.didYouKnow}
                        </p>
                      </div>
                    )}

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.ghgProtocol')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.gri305')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.tcfd')}
                        </span>
                        <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                          {tGlobal('carbonEquivalentTooltip.badges.esrsE1')}
                        </span>
                      </div>
                    </div>

                    {/* Learn More Link */}
                    <div className="mt-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEducationalModal('carbon-basics');
                        }}
                        className="text-blue-300 hover:text-blue-200 text-[10px] underline transition-colors"
                      >
                        {t('learnMore')} →
                      </button>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-1">
              {intensityYoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${intensityYoY < 0 ? 'text-green-500' : intensityYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {intensityYoY > 0 ? '+' : ''}{intensityYoY.toFixed(1)}{t('cards.intensity.yoy')}
              </span>
            </div>
          </div>
        </div>

        {/* Target Progress */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.targetProgress.title')}</span>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div className="relative group">
              <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                {targetsOnTrack}/{totalTargets}
              </div>
              {/* Target Progress Explanation Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-72 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                {/* Explanation */}
                <div className="mb-2">
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    {t('targetProgressExplanation')}
                  </p>
                </div>

                {/* Learn More Link */}
                <div className="mt-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEducationalModal('sbti-targets');
                    }}
                    className="text-blue-300 hover:text-blue-200 text-[10px] underline transition-colors"
                  >
                    {t('learnMore')} →
                  </button>
                </div>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.targetProgress.onTrack')}</div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-900 dark:text-white">{overallProgress.toFixed(0)}%</span>
            </div>
          </div>
          {/* Only show progress bar when on track */}
          {targetsOnTrack > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 dark:text-gray-400">{t('cards.targetProgress.overallProgress')}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
          {/* Show off-track warning when projected > required */}
          {targetsOnTrack === 0 && totalTargets > 0 && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="font-medium">{t('cards.targetProgress.offTrackWarning')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Data Quality */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 relative shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.dataQuality.title')}</span>
          </div>
          <div className="flex items-end justify-between mb-3">
            <div className="relative group">
              <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                {dataQuality?.primaryDataPercentage || 0}%
              </div>
              {/* Data Quality Explanation Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-72 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                {/* Explanation */}
                <div>
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    {t('dataQualityExplanation')}
                  </p>
                </div>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.dataQuality.primaryData')}</div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-gray-900 dark:text-white">{dataQuality?.verifiedPercentage || 0}%</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 dark:text-gray-400">{t('cards.dataQuality.verified')}</span>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Scope Breakdown */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 relative group">
              <PieChartIcon className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('scopeBreakdown.title')}</h3>
              {/* Scope Breakdown Explanation Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-96 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                {/* Explanation */}
                <div className="mb-2">
                  <p className="text-purple-200 text-[11px] font-medium mb-2">
                    {t('scopeBreakdownExplanation')}
                  </p>
                  <div className="space-y-2">
                    {/* Scope 1 */}
                    <div className="bg-white/5 rounded p-2">
                      <p className="text-gray-200 text-[10px] leading-relaxed mb-1">
                        {t('scope1Explanation')}
                      </p>
                      <p className="text-white font-medium text-[10px]">
                        {scope1Total.toFixed(1)} tCO2e ({scopePercentages.scope1.toFixed(0)}%)
                      </p>
                    </div>

                    {/* Scope 2 */}
                    <div className="bg-white/5 rounded p-2">
                      <p className="text-gray-200 text-[10px] leading-relaxed mb-1">
                        {t('scope2Explanation')}
                      </p>
                      <div className="space-y-0.5 text-[10px] mb-1">
                        <div className="text-gray-300">
                          <span className="font-medium">{t('scopeBreakdown.scope2Tooltip.locationBased')}</span> {scope2LocationBased.toFixed(1)} tCO2e
                        </div>
                        <div className="text-gray-300">
                          <span className="font-medium">{t('scopeBreakdown.scope2Tooltip.marketBased')}</span> {scope2MarketBased.toFixed(1)} tCO2e
                        </div>
                      </div>
                      <p className="text-white font-medium text-[10px]">
                        {scope2Total.toFixed(1)} tCO2e ({scopePercentages.scope2.toFixed(0)}%)
                      </p>
                    </div>

                    {/* Scope 3 */}
                    <div className="bg-white/5 rounded p-2">
                      <p className="text-gray-200 text-[10px] leading-relaxed mb-1">
                        {t('scope3Explanation')}
                      </p>
                      <div className="pt-1 border-t border-white/10 mt-1 mb-1">
                        <div className="text-[10px] mb-0.5">
                          <span className="font-medium text-gray-200">{t('scopeBreakdown.scope3Tooltip.categoryCoverage')}:</span> {scope3Coverage?.tracked || 0}/15
                        </div>
                        <div className="flex items-center gap-2 text-[9px]">
                          <span className="text-green-400">✓ {scope3Coverage?.tracked || 0} {t('scopeBreakdown.scope3Tooltip.tracked')}</span>
                          <span className="text-orange-400">⚠ {scope3Coverage?.missing || 12} {t('scopeBreakdown.scope3Tooltip.missing')}</span>
                        </div>
                      </div>
                      <p className="text-white font-medium text-[10px]">
                        {scope3Total.toFixed(1)} tCO2e ({scopePercentages.scope3.toFixed(0)}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Compliance Badges */}
                <div className="mt-3 pt-2 border-t border-purple-500/30">
                  <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                    {tGlobal('carbonEquivalentTooltip.compliantWith')}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                      {tGlobal('carbonEquivalentTooltip.badges.ghgProtocol')}
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                      {tGlobal('carbonEquivalentTooltip.badges.gri305')}
                    </span>
                    <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                      {tGlobal('carbonEquivalentTooltip.badges.tcfd')}
                    </span>
                    <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                      {tGlobal('carbonEquivalentTooltip.badges.esrsE1')}
                    </span>
                  </div>
                </div>

                {/* Learn More Link */}
                <div className="mt-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEducationalModal('scopes-explained');
                    }}
                    className="text-blue-300 hover:text-blue-200 text-[10px] underline transition-colors"
                  >
                    {t('learnMore')} →
                  </button>
                </div>
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
              </div>
            </div>
          </div>

          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scopeBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  innerRadius={80}
                  label={({ cx, cy, midAngle, outerRadius, name, percent, value }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 30;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = (percent * 100).toFixed(0);
                    const textAnchor = x > cx ? 'start' : 'end';
                    const entry = scopeBreakdown.find(s => s.name === name);
                    const color = entry?.color || '#6B7280';

                    return (
                      <text
                        x={x}
                        y={y}
                        fill={color}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        style={{ fontSize: '12px' }}
                      >
                        <tspan x={x} dy="-8">{name}</tspan>
                        <tspan x={x} dy="14">{value.toFixed(1)} tCO2e ({percentage}%)</tspan>
                      </text>
                    );
                  }}
                  labelLine={true}
                >
                  {scopeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
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
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 relative group">
              <TrendingUpIcon className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('emissionsTrend.title')}</h3>

              {/* Hover Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                <div className="mb-2">
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    {t('emissionsTrendExplanation')}
                  </p>
                </div>

                {/* Compliance Badges */}
                <div className="mt-3 pt-2 border-t border-purple-500/30">
                  <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                    {tGlobal('carbonEquivalentTooltip.compliantWith')}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                      TCFD
                    </span>
                    <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                      ESRS E1
                    </span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gradient-to-br from-purple-900 to-blue-900 border-r border-b border-purple-500/30 transform rotate-45"></div>
              </div>
            </div>
          </div>

          {monthlyTrends.length > 0 ? (
            <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrends.map((trend: any) => ({ ...trend, month: translateMonth(trend.month, t) }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  style={{ fontSize: '10px' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  style={{ fontSize: '10px' }}
                  label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', offset: 10, style: { fill: '#9CA3AF', fontSize: '10px' } }}
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
                            {isForecast && <span className="ml-2 text-xs text-blue-400">({t('emissionsTrend.forecast')})</span>}
                          </p>
                          <div className="space-y-1">
                            {scope1 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-red-400 text-sm">{t('emissionsTrend.scope1')}:</span>
                                <span className="text-white font-medium">{scope1.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {scope2 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-blue-400 text-sm">{t('emissionsTrend.scope2')}:</span>
                                <span className="text-white font-medium">{scope2.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {scope3 != null && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-gray-400 text-sm">{t('emissionsTrend.scope3')}:</span>
                                <span className="text-white font-medium">{scope3.toFixed(1)} tCO2e</span>
                              </div>
                            )}
                            {total != null && (
                              <div className="flex items-center justify-between gap-3 pt-1 border-t border-gray-700">
                                <span className="text-purple-400 text-sm font-semibold">{t('emissionsTrend.total')}:</span>
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
                  name={t('emissionsTrend.totalEmissions')}
                  dot={{ r: 4, fill: "#8B5CF6" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope1"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name={t('emissionsTrend.scope1')}
                  dot={{ r: 3, fill: "#EF4444" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope2"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name={t('emissionsTrend.scope2')}
                  dot={{ r: 3, fill: "#3B82F6" }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="scope3"
                  stroke="#6B7280"
                  strokeWidth={2}
                  name={t('emissionsTrend.scope3')}
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
                  name={t('emissionsTrend.totalEmissions')}
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
                  name={t('emissionsTrend.scope1')}
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
                  name={t('emissionsTrend.scope2')}
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
                  name={t('emissionsTrend.scope3')}
                  dot={{ fill: 'transparent', stroke: "#6B7280", strokeWidth: 2, r: 3 }}
                  connectNulls
                  legendType="none"
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[250px]">
              <p className="text-gray-400 text-sm">{t('emissionsTrend.noData')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Site Performance Ranking & Top Emitters */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Site Performance Ranking */}
        {siteComparison.length > 1 && (
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-500" />
                <div className="relative group inline-block">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
                    {tEmissions('sitePerformance.title')}
                  </h3>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <div className="mb-2">
                      <p className="text-white text-[11px] leading-relaxed whitespace-pre-line">
                        {tEmissions('explanations.sitePerformance')}
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          GRI 305-4
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gradient-to-br from-purple-900 to-blue-900 border-r border-b border-purple-500/30 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              {/* Horizontal Bar Chart */}
              {(() => {
                // Benchmark from sector-intensity.ts for Professional Services: perArea
                const benchmark = { low: 20.0, average: 35.0, high: 60.0 };

                const getBarColor = (intensity: number) => {
                  if (intensity <= benchmark.low) return '#10b981'; // green-500
                  if (intensity <= benchmark.average) return '#f59e0b'; // amber-500
                  return '#ef4444'; // red-500
                };

                // Prepare chart data - reverse to show best performers at top
                const chartData = [...siteComparison].reverse().map((siteData, index) => ({
                  name: siteData.name || siteData.site || 'Unknown Site',
                  intensity: parseFloat(siteData.intensity.toFixed(1)),
                  fill: getBarColor(siteData.intensity),
                  rank: siteComparison.length - index
                }));

                return (
                  <>
                    <div className="mt-4 h-[420px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 5, right: 20, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                          <XAxis
                            type="number"
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            tickLine={{ stroke: '#9CA3AF' }}
                            axisLine={{ stroke: '#9CA3AF' }}
                            label={{ value: 'kgCO2e/m²', position: 'bottom', offset: 10, fill: '#9CA3AF', fontSize: 11 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            className="stroke-gray-400 dark:stroke-gray-500"
                            tick={false}
                            tickLine={false}
                            width={0}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                            content={({ active, payload }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                                    <p className="text-white font-semibold mb-1">
                                      {data.name}
                                    </p>
                                    <p className="text-white text-sm">
                                      {data.intensity} kgCO2e/m²
                                    </p>
                                    <p className="text-gray-400 text-xs mt-1">
                                      Rank #{data.rank} of {chartData.length}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar
                            dataKey="intensity"
                            radius={[0, 4, 4, 0]}
                            label={(props: any) => {
                              const { x, y, width, height, value, index } = props;
                              const site = chartData[index];
                              return (
                                <g>
                                  {/* Site name on top */}
                                  <text
                                    x={x + 10}
                                    y={y + height / 2 - 8}
                                    fill="white"
                                    fontSize={11}
                                    fontWeight={600}
                                    textAnchor="start"
                                  >
                                    {site.name}
                                  </text>
                                  {/* Intensity value below site name */}
                                  <text
                                    x={x + 10}
                                    y={y + height / 2 + 8}
                                    fill="white"
                                    fontSize={10}
                                    fontWeight={400}
                                    textAnchor="start"
                                  >
                                    {value} kgCO2e/m²
                                  </text>
                                </g>
                              );
                            }}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend for performance levels */}
                    <div className="flex items-center justify-center gap-4 mt-6 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Excelente (≤{benchmark.low})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Bom ({benchmark.low}-{benchmark.average})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          Precisa Melhorar (&gt;{benchmark.average})
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
        </div>
        )}

        {/* Top Emitters */}
        <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 relative group">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('topEmitters.title')}</h3>

              {/* Hover Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                <div className="mb-2">
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    {t('topEmittersExplanation')}
                  </p>
                </div>

                {/* Compliance Badges */}
                <div className="mt-3 pt-2 border-t border-purple-500/30">
                  <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                    {tGlobal('carbonEquivalentTooltip.compliantWith')}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                      GRI 305-5
                    </span>
                    <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                      TCFD
                    </span>
                  </div>
                </div>

                {/* Learn More Link */}
                <div className="mt-4 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveEducationalModal('reduction-strategies');
                    }}
                    className="text-purple-200 hover:text-white underline font-medium transition-colors text-[11px]"
                  >
                    {t('learnMore')} →
                  </button>
                </div>

                {/* Arrow indicator */}
                <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gradient-to-br from-purple-900 to-blue-900 border-r border-b border-purple-500/30 transform rotate-45"></div>
              </div>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="47%"
                  cy="50%"
                  outerRadius={120}
                  innerRadius={75}
                  label={({ cx, cy, midAngle, outerRadius, name, percent, value }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 40;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = (percent * 100).toFixed(0);
                    const textAnchor = x > cx ? 'start' : 'end';
                    const entry = pieChartData.find(s => s.name === name);
                    const color = entry?.color || '#6B7280';

                    return (
                      <text
                        x={x}
                        y={y}
                        fill={color}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        style={{ fontSize: '10px', fontWeight: '500' }}
                      >
                        <tspan x={x} dy="-14">{name}</tspan>
                        <tspan x={x} dy="11">{value.toFixed(1)} tCO2e</tspan>
                        <tspan x={x} dy="11">({percentage}%)</tspan>
                      </text>
                    );
                  }}
                  labelLine={true}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl max-w-xs">
                          <div className="font-semibold mb-1">{data.name}</div>
                          <div className="text-gray-300 mb-2">
                            {data.value.toFixed(1)} tCO2e ({data.percentage.toFixed(1)}%)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SBTi Target Progress - Only show for current year */}
      {targetData?.targets && targetData.targets.length > 0 &&
       new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 relative group">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('sbtiProgress.title')}</h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <div className="mb-2">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        {t('sbtiProgressExplanation')}
                      </p>
                    </div>

                    {/* Carbon Equivalent - Polar Bear */}
                    {(() => {
                      const currentEmissionsValue = projectedAnnualEmissions > 0 ? projectedAnnualEmissions : (targetData.targets[0].current_emissions || totalEmissions);
                      const carbonEquiv = getCarbonEquivalent(currentEmissionsValue, orgBoundaries?.country || 'portugal', tGlobal);
                      return carbonEquiv && (
                        <div className="mt-3 pt-3 border-t border-purple-500/30">
                          <p className="text-purple-200 text-[11px] font-medium mb-1.5">
                            {tGlobal('carbonEquivalentTooltip.intro')}
                          </p>
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-lg">{carbonEquiv.icon}</span>
                            <span className="font-semibold text-white text-[11px]">{carbonEquiv.description}</span>
                          </div>

                          {carbonEquiv.educationalContext && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-purple-300">ℹ️</span>
                                <span className="font-semibold text-purple-200 text-[10px]">{tGlobal('carbonEquivalentTooltip.howThisWorks')}</span>
                              </div>
                              <p className="text-gray-200 text-[10px] leading-relaxed">
                                {carbonEquiv.educationalContext}
                              </p>
                            </div>
                          )}

                          {carbonEquiv.didYouKnow && (
                            <div className="mt-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-yellow-300">💡</span>
                                <span className="font-semibold text-yellow-200 text-[10px]">{tGlobal('carbonEquivalentTooltip.didYouKnow')}</span>
                              </div>
                              <p className="text-gray-200 text-[10px] leading-relaxed">
                                {carbonEquiv.didYouKnow}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          SBTi
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                          GRI 305-5
                        </span>
                        <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                          TCFD
                        </span>
                        <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                          ESRS E1
                        </span>
                      </div>
                    </div>

                    {/* Learn More Link */}
                    <div className="mt-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEducationalModal('sbti-targets');
                        }}
                        className="text-purple-200 hover:text-white underline font-medium transition-colors text-[11px]"
                      >
                        {t('learnMore')} →
                      </button>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gradient-to-br from-purple-900 to-blue-900 border-r border-b border-purple-500/30 transform rotate-45"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {targetData.targets[0].target_name} • {targetData.targets[0].baseline_year} → {targetData.targets[0].target_year}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                  {(targetData.targets[0].reduction_percentage || 0).toFixed(1)}% {t('sbtiProgress.reductionTarget')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {/* Baseline */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.baseline')} ({targetData.targets[0].baseline_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].baseline_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Current */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.current')} ({new Date().getFullYear()})
                    {targetData.targets[0].is_forecast && (
                      <span className="ml-1 text-purple-500">*</span>
                    )}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {projectedAnnualEmissions > 0 && forecastedEmissions > 0 ? (
                    <span>{projectedAnnualEmissions.toFixed(1)}</span>
                  ) : (
                    <span>{(targetData.targets[0].current_emissions || totalEmissions)?.toFixed(1)}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <span>tCO2e</span>
                  {projectedAnnualEmissions > 0 && forecastedEmissions > 0 && (
                    <span className="ml-1 text-purple-500">({t('sbtiProgress.projected')})</span>
                  )}
                </div>
              </div>

              {/* Required (Current Year Target) */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.required')} ({new Date().getFullYear()})
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
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('sbtiProgress.onTrack')}</div>
              </div>

              {/* Target */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('sbtiProgress.target')} ({targetData.targets[0].target_year})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {targetData.targets[0].target_emissions?.toFixed(1) || '-'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
              </div>

              {/* Progress */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('sbtiProgress.progress')}</span>
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
                      return t('sbtiProgress.aboveBaseline');
                    } else {
                      const actualReduction = baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;
                      const status = actualReduction >= requiredReduction ? t('sbtiProgress.onTrackStatus') : t('sbtiProgress.atRisk');
                      return status;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Waterfall Chart */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('waterfallChart.title')}</h4>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
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
                        name: `${baselineYear}\n${t('waterfallChart.baseline')}`,
                        base: 0,
                        value: baseline,
                        total: baseline,
                        label: baseline.toFixed(1)
                      },
                      {
                        name: `${t('waterfallChart.required')}\n${t('waterfallChart.reduction')}`,
                        base: requiredEmissions, // Position at the bottom (where we should end up)
                        value: requiredReduction, // Height of the reduction bar
                        total: baseline, // Connects to baseline
                        label: `-${requiredReduction.toFixed(1)}`,
                        isRequiredReduction: true
                      },
                      {
                        name: `${currentYear}\n${t('waterfallChart.required')}`,
                        base: 0,
                        value: requiredEmissions,
                        total: requiredEmissions,
                        label: requiredEmissions.toFixed(1),
                        isRequired: true
                      },
                      {
                        name: `${t('waterfallChart.gap')}\n${t('waterfallChart.required')}`,
                        base: requiredEmissions,
                        value: gapFromRequired,
                        total: current,
                        label: `+${gapFromRequired.toFixed(1)}`,
                        isGap: true
                      },
                      {
                        name: `${currentYear}\n${t('waterfallChart.actual')}`,
                        base: 0,
                        value: current,
                        total: current,
                        label: current.toFixed(1),
                        isCurrent: true
                      },
                      {
                        name: `${targetYear}\n${t('waterfallChart.target')}`,
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
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
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
                                  {t('waterfallChart.tooltip.reduction')}: <span className="font-medium">{value.toFixed(1)} tCO2e</span>
                                </p>
                              ) : data.label && data.label.includes('+') ? (
                                <p className="text-red-400">
                                  {t('waterfallChart.tooltip.increase')}: <span className="font-medium">{value.toFixed(1)} tCO2e</span>
                                </p>
                              ) : (
                                <p className="text-gray-300">
                                  {t('waterfallChart.tooltip.total')}: <span className="font-medium text-white">{total.toFixed(1)} tCO2e</span>
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
        </div>
      )}

      {/* Educational System */}
      <FloatingHelpButton onTopicSelect={(topicId) => setActiveEducationalModal(topicId)} />
      <EducationalModal
        activeModal={activeEducationalModal}
        onClose={() => setActiveEducationalModal(null)}
        organizationContext={{
          country: orgBoundaries?.country || 'Portugal',
          sector: 'professional_services' // TODO: Get from organization data
        }}
      />
    </>
  );
}
