'use client';

import React, { useState, useMemo } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Sun,
  Wind,
  Flame,
  Droplets,
  Factory,
  Leaf,
  AlertCircle,
  Info,
  Cloud,
  Gauge,
  ChevronDown,
  ChevronRight,
  Plus,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  Target,
  Settings,
  Activity,
  Building2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import type { Building } from '@/types/auth';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import { MetricTargetsCard } from '@/components/sustainability/MetricTargetsCard';
import { RecommendationsModal } from '@/components/sustainability/RecommendationsModal';
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import { useEnergyDashboard, useEnergySiteComparison } from '@/hooks/useDashboardData';

interface EnergyDashboardProps {
  organizationId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

const COLORS = {
  renewable: '#10B981',
  fossil: '#6B7280',
  electricity: '#F59E0B',  // Amber for grid electricity
  heating: '#EF4444',
  cooling: '#06B6D4',
  steam: '#8B5CF6'
};

// Color palette for energy sources
const getSourceColor = (name: string): string => {
  const nameLower = name.toLowerCase();

  // EV Charging - Purple
  if (nameLower.includes('ev') || nameLower.includes('charging')) {
    return '#8B5CF6'; // Purple
  }

  // Grid/Purchased Electricity - Amber
  if (nameLower.includes('grid') || nameLower.includes('electricity')) {
    return '#F59E0B'; // Amber
  }

  // Heating - Orange
  if (nameLower.includes('heating')) {
    return '#F97316'; // Orange
  }

  // Cooling - Cyan
  if (nameLower.includes('cooling')) {
    return '#06B6D4'; // Cyan
  }

  // Solar - Amber
  if (nameLower.includes('solar')) {
    return '#F59E0B'; // Amber
  }

  // Wind - Green
  if (nameLower.includes('wind')) {
    return '#10B981'; // Green
  }

  // Natural Gas/Fossil - Gray
  if (nameLower.includes('gas') || nameLower.includes('fossil')) {
    return '#6B7280'; // Gray
  }

  // Default fallback
  return '#94A3B8'; // Slate
};

// Color palette for grid mix sources
const getGridMixColor = (name: string): string => {
  const nameLower = name.toLowerCase();

  // Renewable sources - Green shades
  if (nameLower.includes('solar')) return '#F59E0B'; // Amber
  if (nameLower.includes('wind')) return '#10B981'; // Green
  if (nameLower.includes('hydro')) return '#06B6D4'; // Cyan
  if (nameLower.includes('geothermal')) return '#EF4444'; // Red
  if (nameLower.includes('biomass')) return '#84CC16'; // Lime

  // Fossil fuels - Gray/Dark shades
  if (nameLower.includes('coal')) return '#1F2937'; // Dark gray
  if (nameLower.includes('gas') || nameLower.includes('natural gas')) return '#6B7280'; // Gray
  if (nameLower.includes('oil') || nameLower.includes('petroleum')) return '#374151'; // Medium gray

  // Nuclear - Purple
  if (nameLower.includes('nuclear')) return '#8B5CF6'; // Purple

  // Unknown - Light gray
  if (nameLower.includes('unknown')) return '#D1D5DB'; // Light gray

  return '#94A3B8'; // Slate fallback
};

// Helper function to format scope labels
const formatScope = (scope: string): string => {
  if (!scope) return '';
  // Convert scope_1 -> Scope 1, scope_2 -> Scope 2, scope_3 -> Scope 3
  return scope.replace(/scope_(\d+)/i, 'Scope $1').replace(/scope(\d+)/i, 'Scope $1');
};

// Helper function to translate energy source names
const translateEnergySource = (name: string, t: (key: string) => string): string => {
  const nameLower = name.toLowerCase().replace(/\s+/g, '');

  // Map common energy source names to translation keys
  const sourceMap: { [key: string]: string } = {
    'purchasedcooling': 'energySources.purchasedCooling',
    'gridelectricity': 'energySources.gridElectricity',
    'purchasedheating': 'energySources.purchasedHeating',
    'evcharging': 'energySources.evCharging',
    'purchasedenergy': 'energySources.purchasedEnergy',
    'electricity': 'energySources.electricity',
    'solar': 'energySources.solar',
    'wind': 'energySources.wind',
    'hydro': 'energySources.hydro',
    'geothermal': 'energySources.geothermal',
    'biomass': 'energySources.biomass',
    'coal': 'energySources.coal',
    'naturalgas': 'energySources.naturalGas',
    'oil': 'energySources.oil',
    'nuclear': 'energySources.nuclear',
    'other': 'energySources.other',
    'unknown': 'energySources.unknown'
  };

  const key = sourceMap[nameLower];
  if (key) {
    const translated = t(key);
    // If translation exists and is different from the key, return it
    if (translated && translated !== key) {
      return translated;
    }
  }

  // Return original name if no translation found
  return name;
};

// Helper function to translate category names
const translateCategory = (name: string, t: (key: string) => string): string => {
  const nameLower = name.toLowerCase().replace(/\s+/g, '');

  const categoryMap: { [key: string]: string } = {
    'electricity': 'categories.electricity',
    'purchasedenergy': 'categories.purchasedEnergy',
    'purchasedheating': 'categories.purchasedHeating',
    'purchasedcooling': 'categories.purchasedCooling',
    'purchasedsteam': 'categories.purchasedSteam',
    'naturalgas': 'categories.naturalGas',
    'heatingoil': 'categories.heatingOil',
    'diesel': 'categories.diesel',
    'gasoline': 'categories.gasoline',
    'propane': 'categories.propane',
    'heating': 'categories.heating',
    'cooling': 'categories.cooling',
    'steam': 'categories.steam'
  };

  const key = categoryMap[nameLower];
  if (key) {
    const translated = t(key);
    if (translated && translated !== key) {
      return translated;
    }
  }

  return name;
};

// Helper function to translate allocation reasons
const translateReason = (reason: string, t: (key: string) => string): string => {
  const reasonLower = reason.toLowerCase().trim();

  const reasonMap: { [key: string]: string } = {
    'high: renewable energy, efficiency, on-site generation': 'allocationReasons.highRenewableEfficiency',
    'high: renewable procurement, grid mix improvement, ppas': 'allocationReasons.highRenewableProcurement',
    'medium: energy efficiency, operational improvements': 'allocationReasons.mediumEfficiency',
    'low: baseline optimized, limited reduction potential': 'allocationReasons.lowBaselineOptimized',
    'targeted reduction potential': 'allocationReasons.targetedReduction'
  };

  const key = reasonMap[reasonLower];
  if (key) {
    const translated = t(key);
    if (translated && translated !== key) {
      return translated;
    }
  }

  return reason;
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

export function EnergyDashboard({ organizationId, selectedSite, selectedPeriod }: EnergyDashboardProps) {
  // Translation hooks
  const t = useTranslations('sustainability.energy');
  const { t: tGlobal } = useLanguage();

  // Fetch data with React Query (cached)
  const {
    sources,
    intensity,
    forecast,
    prevYearSources,
    fullPrevYearSources,
    targets,
    sustainabilityTargets,
    baselineYear,
    targetYear,
    baselineData,
    weightedAllocation,
    metricTargets: metricTargetsQuery,
    isLoading
  } = useEnergyDashboard(
    selectedPeriod,
    selectedSite,
    organizationId
  );

  // Fetch site comparison data (only when no site is selected)
  const siteComparisonQuery = useEnergySiteComparison(
    selectedPeriod,
    selectedSite,
    organizationId
  );

  const siteComparison = siteComparisonQuery.data || [];

  console.log('🔍 Site Comparison Query Status:', {
    isLoading: siteComparisonQuery.isLoading,
    isError: siteComparisonQuery.isError,
    error: siteComparisonQuery.error,
    hasData: !!siteComparisonQuery.data,
    dataLength: siteComparison.length,
    data: siteComparison,
    selectedSite,
    organizationId
  });

  // UI-only state (keep as useState)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'source' | 'type' | 'trends'>('overview');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  // Process all energy data with useMemo (replaces useEffect + useState pattern)
  const dashboardMetrics = useMemo(() => {
    if (!sources.data) {
      return {
        totalEnergy: 0,
        renewablePercentage: 0,
        totalEmissions: 0,
        energyIntensity: 0,
        yoyEnergyChange: null,
        yoyEmissionsChange: null,
        yoyRenewableChange: null,
        annualTarget: null,
        forecastedTotal: null,
        targetStatus: null,
        categoryTargets: [],
        overallTargetPercent: null,
        metricTargets: [],
        sourceBreakdown: [],
        prevYearSourceBreakdown: [],
        typeBreakdown: [],
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        forecastData: [],
        energyMixes: [],
        projectedAnnualEnergy: 0,
        forecastedEnergy: 0,
        previousYearTotalEnergy: 0,
      };
    }

    try {
      const sourcesData = sources.data;
      const intensityData = intensity.data;
      const prevSourcesData = prevYearSources.data;
      const forecastDataRes = forecast.data;
      const targetsData = targets.data;
      const weightedAllocationData = weightedAllocation.data;
      const baselineData2023 = baselineData.data;

      // Summary data
      const totalEnergyResult = sourcesData.total_consumption || 0;
      const renewablePercentageResult = sourcesData.renewable_percentage || 0;
      const totalEmissionsResult = sourcesData.total_emissions || 0;

      // Process source breakdown
      const sourceBreakdownResult = sourcesData.sources
        ? sourcesData.sources.map((s: any) => ({
            name: s.name,
            value: s.consumption,
            renewable: s.renewable,
            emissions: s.emissions
          }))
        : [];

      // Type breakdown
      const typeBreakdownResult = sourcesData.energy_types && sourcesData.energy_types.length > 0
        ? sourcesData.energy_types
        : [];

      // Get current date to determine what's actual vs forecast
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed

      // Monthly trends - filter out future months in current year from historical data
      let monthlyTrendsResult: any[] = [];
      if (sourcesData.monthly_trends && sourcesData.monthly_trends.length > 0) {
        monthlyTrendsResult = sourcesData.monthly_trends.filter((trend: any) => {
          // Parse the monthKey (format: "2025-01")
          const [yearStr, monthStr] = trend.monthKey.split('-');
          const trendYear = parseInt(yearStr);
          const trendMonth = parseInt(monthStr);

          // If it's the current year, only include months up to current month
          if (trendYear === currentYear) {
            return trendMonth <= currentMonth;
          }

          // Include all months from past years
          return trendYear < currentYear;
        });
      }

      // Energy mixes
      let energyMixesResult: any[] = [];
      if (sourcesData.energy_mixes && Array.isArray(sourcesData.energy_mixes)) {
        energyMixesResult = sourcesData.energy_mixes;
      } else if (sourcesData.grid_mix) {
        const legacyMix = sourcesData.grid_mix;
        energyMixesResult = [{
          energy_type: 'electricity' as const,
          provider_name: legacyMix.provider,
          year: legacyMix.year,
          sources: legacyMix.sources || [],
          renewable_percentage: legacyMix.renewable_percentage || 0,
          has_unknown_sources: legacyMix.has_unknown_sources || false
        }];
      }

      console.log('🔍 [EnergyDashboard] Grid Mix Debug:', {
        hasEnergyMixes: !!sourcesData.energy_mixes,
        energyMixesCount: sourcesData.energy_mixes?.length || 0,
        hasGridMix: !!sourcesData.grid_mix,
        energyMixesResult,
        sourcesDataKeys: Object.keys(sourcesData),
        renewablePercentageFromMix: energyMixesResult[0]?.renewable_percentage,
        gridMixRenewablePercentage: sourcesData.grid_mix?.renewable_percentage,
        totalConsumption: sourcesData.total_consumption,
        overallRenewablePercentage: sourcesData.renewable_percentage
      });

      // Energy intensity
      const energyIntensityResult = intensityData?.perSquareMeter?.value || 0;

      // YoY comparison
      let yoyEnergyChangeResult: number | null = null;
      let yoyEmissionsChangeResult: number | null = null;
      let yoyRenewableChangeResult: number | null = null;
      let prevYearSourceBreakdownResult: any[] = [];
      let prevYearMonthlyTrendsResult: any[] = [];

      if (prevSourcesData?.sources && prevSourcesData.total_consumption > 0) {
        console.log('🔍 YoY Debug:', {
          currentPeriod: { start: selectedPeriod.start, end: selectedPeriod.end },
          currentTotal: sourcesData.total_consumption,
          previousYearTotal: prevSourcesData.total_consumption,
          calculation: `(${sourcesData.total_consumption} - ${prevSourcesData.total_consumption}) / ${prevSourcesData.total_consumption} * 100`
        });

        yoyEnergyChangeResult = ((sourcesData.total_consumption - prevSourcesData.total_consumption) / prevSourcesData.total_consumption) * 100;
        yoyEmissionsChangeResult = ((sourcesData.total_emissions - prevSourcesData.total_emissions) / prevSourcesData.total_emissions) * 100;
        yoyRenewableChangeResult = sourcesData.renewable_percentage - prevSourcesData.renewable_percentage;

        if (prevSourcesData.sources && prevSourcesData.sources.length > 0) {
          prevYearSourceBreakdownResult = prevSourcesData.sources.map((s: any) => ({
            name: s.name,
            value: s.consumption,
            renewable: s.renewable,
            emissions: s.emissions
          }));
        }

        if (prevSourcesData.monthly_trends && prevSourcesData.monthly_trends.length > 0) {
          prevYearMonthlyTrendsResult = prevSourcesData.monthly_trends;
        }
      }

      // Forecast data
      let forecastDataResult: any[] = [];
      let projectedAnnualEnergyResult: number = 0;
      let forecastedEnergyResult: number = 0;

      console.log('🔍 [EnergyDashboard] Selected Period Debug:', {
        startDate: selectedPeriod.start,
        endDate: selectedPeriod.end,
        selectedYear: new Date(selectedPeriod.start).getFullYear(),
        currentYear,
        currentMonth,
        isCurrentYear: new Date(selectedPeriod.start).getFullYear() === currentYear
      });

      console.log('🔍 [EnergyDashboard] Forecast Hook Status:', {
        isLoading: forecast.isLoading,
        isError: forecast.isError,
        error: forecast.error,
        hasData: !!forecast.data,
        dataKeys: forecast.data ? Object.keys(forecast.data) : []
      });

      console.log('🔍 [EnergyDashboard] Forecast API Debug:', {
        hasForecastData: !!forecastDataRes,
        forecastDataRes,
        hasForecastArray: !!forecastDataRes?.forecast,
        forecastLength: forecastDataRes?.forecast?.length || 0,
        lastActualMonth: forecastDataRes?.lastActualMonth,
        model: forecastDataRes?.model,
        confidence: forecastDataRes?.confidence
      });

      if (forecastDataRes?.forecast && forecastDataRes.forecast.length > 0) {
        forecastDataResult = forecastDataRes.forecast;

        // Calculate forecasted energy from remaining months
        forecastedEnergyResult = forecastDataResult.reduce((sum, f) => sum + (f.total || 0), 0);

        // Projected annual = YTD + forecasted remaining months
        projectedAnnualEnergyResult = totalEnergyResult + forecastedEnergyResult;
      }

      // Get previous year's total energy
      // For YTD YoY: use same period last year
      // For Projected YoY: use FULL previous year (Jan-Dec)
      const previousYearTotalEnergyResult = fullPrevYearSources?.data?.total_consumption || prevSourcesData?.total_consumption || 0;

      console.log('🔍 [EnergyDashboard] Projected Energy Debug:', {
        currentYear,
        currentMonth,
        totalEnergy: totalEnergyResult,
        forecastedEnergy: forecastedEnergyResult,
        projectedAnnual: projectedAnnualEnergyResult,
        previousYearTotal: previousYearTotalEnergyResult,
        hasForecast: forecastDataResult.length > 0,
        forecastMonths: forecastDataResult.length,
        actualMonthlyTrends: monthlyTrendsResult.length,
        totalMonthlyFromAPI: sourcesData.monthly_trends?.length || 0
      });

      // Targets and category data
      let categoryTargetsResult: any[] = [];
      let overallTargetPercentResult: number | null = null;
      let annualTargetResult: number | null = null;
      let forecastedTotalResult: number | null = null;
      let targetStatusResult: 'on-track' | 'at-risk' | 'off-track' | null = null;
      let metricTargetsResult: any[] = [];

      // Use targets from hook instead of fetching
      if (targetsData && targetsData.targets && targetsData.targets.length > 0) {
        categoryTargetsResult = targetsData.targets.map((t: any) => ({
          category: t.category,
          currentEmissions: t.currentEmissions || t.baseline_emissions,
          emissionPercent: t.emission_percent,
          baselineTargetPercent: t.baseline_target_percent,
          adjustedTargetPercent: t.adjusted_target_percent,
          effortFactor: t.effort_factor,
          reason: t.allocation_reason,
          absoluteTarget: t.targetEmissions || t.target_emissions,
          feasibility: t.feasibility,
          annualReductionRate: t.reductionRate || t.annual_reduction_rate || null,
          baseline2023FullYear: t.baselineEmissions || t.baseline_emissions || 0,
          expectedEmissions2025: t.targetEmissions || t.target_emissions || 0,
          projected2025FullYear: t.projected2025FullYear || t.currentEmissions || t.baseline_emissions || 0,
          progressPercent: t.progress?.progressPercent || t.progress_percent || 0
        }));
      } else if (weightedAllocationData?.allocations) {
        // Use weighted allocation from hook as fallback
        categoryTargetsResult = weightedAllocationData.allocations.filter((a: any) =>
          a.category === 'Electricity' || a.category === 'Purchased Energy'
        ) || [];
      }

      // Use API-provided values directly (no recalculation needed)
      // The unified API already provides projected values with ML forecasting
      if (categoryTargetsResult.length > 0) {
        // Calculate aggregate target and projected from category data
        const totalBaselineTarget = categoryTargetsResult.reduce((sum, cat) =>
          sum + (cat.expectedEmissions2025 || 0), 0);

        const totalProjected = categoryTargetsResult.reduce((sum, cat) =>
          sum + (cat.projected2025FullYear || 0), 0);

        if (totalBaselineTarget > 0) {
          annualTargetResult = totalBaselineTarget;
          forecastedTotalResult = totalProjected;

          // Calculate status based on API-provided projected values
          if (totalProjected <= totalBaselineTarget) {
            targetStatusResult = 'on-track';
          } else if (totalProjected <= totalBaselineTarget * 1.1) {
            targetStatusResult = 'at-risk';
          } else {
            targetStatusResult = 'off-track';
          }
        }
      }

      // Use metric targets from hook
      if (metricTargetsQuery.data) {
        const targetsData = Array.isArray(metricTargetsQuery.data)
          ? metricTargetsQuery.data
          : metricTargetsQuery.data.data || [];
        metricTargetsResult = targetsData;
      }

      return {
        totalEnergy: totalEnergyResult,
        renewablePercentage: renewablePercentageResult,
        totalEmissions: totalEmissionsResult,
        energyIntensity: energyIntensityResult,
        yoyEnergyChange: yoyEnergyChangeResult,
        yoyEmissionsChange: yoyEmissionsChangeResult,
        yoyRenewableChange: yoyRenewableChangeResult,
        annualTarget: annualTargetResult,
        forecastedTotal: forecastedTotalResult,
        targetStatus: targetStatusResult,
        categoryTargets: categoryTargetsResult,
        overallTargetPercent: overallTargetPercentResult,
        metricTargets: metricTargetsResult,
        sourceBreakdown: sourceBreakdownResult,
        prevYearSourceBreakdown: prevYearSourceBreakdownResult,
        typeBreakdown: typeBreakdownResult,
        monthlyTrends: monthlyTrendsResult,
        prevYearMonthlyTrends: prevYearMonthlyTrendsResult,
        forecastData: forecastDataResult,
        energyMixes: energyMixesResult,
        projectedAnnualEnergy: projectedAnnualEnergyResult,
        forecastedEnergy: forecastedEnergyResult,
        previousYearTotalEnergy: previousYearTotalEnergyResult,
      };
    } catch (error) {
      console.error('Error processing energy data:', error);
      return {
        totalEnergy: 0,
        renewablePercentage: 0,
        totalEmissions: 0,
        energyIntensity: 0,
        yoyEnergyChange: null,
        yoyEmissionsChange: null,
        yoyRenewableChange: null,
        annualTarget: null,
        forecastedTotal: null,
        targetStatus: null,
        categoryTargets: [],
        overallTargetPercent: null,
        metricTargets: [],
        sourceBreakdown: [],
        prevYearSourceBreakdown: [],
        typeBreakdown: [],
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        forecastData: [],
        energyMixes: [],
        projectedAnnualEnergy: 0,
        forecastedEnergy: 0,
        previousYearTotalEnergy: 0,
      };
    }
  }, [
    sources.data,
    intensity.data,
    forecast.data,
    prevYearSources.data,
    fullPrevYearSources?.data,
    targets.data,
    weightedAllocation.data,
    baselineData.data,
    metricTargetsQuery.data,
    organizationId,
    selectedSite,
    selectedPeriod
  ]);

  // Destructure all computed metrics
  const {
    totalEnergy,
    renewablePercentage,
    totalEmissions,
    energyIntensity,
    yoyEnergyChange,
    yoyEmissionsChange,
    yoyRenewableChange,
    annualTarget,
    forecastedTotal,
    targetStatus,
    categoryTargets,
    overallTargetPercent,
    metricTargets,
    sourceBreakdown,
    prevYearSourceBreakdown,
    typeBreakdown,
    monthlyTrends,
    prevYearMonthlyTrends,
    forecastData,
    energyMixes,
    projectedAnnualEnergy,
    forecastedEnergy,
    previousYearTotalEnergy,
  } = dashboardMetrics;

  // Smart kWh/MWh unit selection based on total energy consumption magnitude
  const threshold = 10000; // 10,000 kWh = 10 MWh
  const useMWh = totalEnergy >= threshold;

  // Helper function to format energy consumption with smart unit selection
  const formatEnergyConsumption = (kWh: number) => {
    if (useMWh) {
      return {
        value: (kWh / 1000).toFixed(1),
        unit: t('cards.totalEnergy.unit'), // 'MWh'
        yAxisLabel: `${t('axisLabels.energyConsumption')} (MWh)`,
        fullLabel: `${(kWh / 1000).toFixed(1)} MWh`
      };
    } else {
      return {
        value: kWh.toFixed(0),
        unit: 'kWh',
        yAxisLabel: `${t('axisLabels.energyConsumption')} (kWh)`,
        fullLabel: `${kWh.toFixed(0)} kWh`
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  // Check if we're viewing the current year
  const isCurrentYear = new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear();

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Energy / YTD Energy */}
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 relative group">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
              {isCurrentYear ? t('cards.totalEnergy.ytdTitle') : t('cards.totalEnergy.title')}
            </h3>

            {/* Hover Tooltip */}
            <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
              <div className="mb-2">
                <p className="text-gray-200 text-[11px] leading-relaxed">
                  {t('cards.totalEnergy.explanation')}
                </p>
              </div>

              {/* Compliance Badges */}
              <div className="mt-3 pt-2 border-t border-purple-500/30">
                <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                  {tGlobal('carbonEquivalentTooltip.compliantWith')}
                </p>
                <div className="flex gap-1 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                    GRI 302-1
                  </span>
                  <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                    ESRS E1-5
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                    ISO 50001
                  </span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatEnergyConsumption(totalEnergy).value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatEnergyConsumption(totalEnergy).unit}
              </div>
            </div>
            {yoyEnergyChange !== null && (
              <div className="flex items-center gap-1">
                {yoyEnergyChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyEnergyChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyEnergyChange > 0 ? 'text-red-500' : yoyEnergyChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyEnergyChange > 0 ? '+' : ''}{yoyEnergyChange.toFixed(1)}% {t('units.yoy')}
                </span>
              </div>
            )}
          </div>
          {projectedAnnualEnergy > 0 &&
           forecastedEnergy > 0 &&
           isCurrentYear && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-purple-500 dark:text-purple-400">
                {t('cards.totalEnergy.projected')}: {formatEnergyConsumption(projectedAnnualEnergy).value} {formatEnergyConsumption(projectedAnnualEnergy).unit}
              </span>
              {(() => {
                // Calculate YoY for projected energy: compare projected annual vs previous year's total
                const projectedYoY = previousYearTotalEnergy > 0
                  ? ((projectedAnnualEnergy - previousYearTotalEnergy) / previousYearTotalEnergy) * 100
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

        {/* Renewable Percentage */}
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 relative group">
            <Leaf className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
              {t('cards.renewable.title')}
            </h3>

            {/* Hover Tooltip */}
            <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
              <div className="mb-2">
                <p className="text-gray-200 text-[11px] leading-relaxed">
                  {t('cards.renewable.explanation')}
                </p>
              </div>

              {/* Compliance Badges */}
              <div className="mt-3 pt-2 border-t border-purple-500/30">
                <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                  {tGlobal('carbonEquivalentTooltip.compliantWith')}
                </p>
                <div className="flex gap-1 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                    GRI 302-1
                  </span>
                  <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                    ESRS E1-5
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                    RE100
                  </span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {renewablePercentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.renewable.unit')}</div>
            </div>
            {yoyRenewableChange !== null && Math.abs(yoyRenewableChange) >= 0.1 && (
              <div className="flex items-center gap-1">
                {yoyRenewableChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${yoyRenewableChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {yoyRenewableChange > 0 ? '+' : ''}{yoyRenewableChange.toFixed(1)}{t('units.pp')} {t('units.yoy')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Emissions */}
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 relative group">
            <Cloud className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
              {t('cards.emissions.title')}
            </h3>

            {/* Hover Tooltip */}
            <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
              <div className="mb-2">
                <p className="text-gray-200 text-[11px] leading-relaxed">
                  {t('cards.emissions.explanation')}
                </p>
              </div>

              {/* Compliance Badges */}
              <div className="mt-3 pt-2 border-t border-purple-500/30">
                <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                  {tGlobal('carbonEquivalentTooltip.compliantWith')}
                </p>
                <div className="flex gap-1 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                    GHG Protocol
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                    SBTi
                  </span>
                  <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                    ESRS E1
                  </span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmissions.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.emissions.unit')}</div>
            </div>
            {yoyEmissionsChange !== null && (
              <div className="flex items-center gap-1">
                {yoyEmissionsChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyEmissionsChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyEmissionsChange > 0 ? 'text-red-500' : yoyEmissionsChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyEmissionsChange > 0 ? '+' : ''}{yoyEmissionsChange.toFixed(1)}% {t('units.yoy')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Intensity */}
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 relative group">
            <Gauge className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
              {t('cards.intensity.title')}
            </h3>

            {/* Hover Tooltip */}
            <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
              <div className="mb-2">
                <p className="text-gray-200 text-[11px] leading-relaxed">
                  {t('cards.intensity.explanation')}
                </p>
              </div>

              {/* Compliance Badges */}
              <div className="mt-3 pt-2 border-t border-purple-500/30">
                <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                  {tGlobal('carbonEquivalentTooltip.compliantWith')}
                </p>
                <div className="flex gap-1 flex-wrap">
                  <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                    GRI 302-3
                  </span>
                  <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                    ESRS E1-5
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                    ISO 50001
                  </span>
                </div>
              </div>

              {/* Arrow indicator */}
              <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {energyIntensity.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.intensity.unit')}</div>
        </div>
      </div>

      {/* Unified Grid for All Chart Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Energy Sources Pie Chart */}
        {sourceBreakdown.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm min-h-[480px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group">
                <PieChartIcon className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                  {t('charts.sourcesDistribution.title')}
                </h3>

              {/* Hover Tooltip */}
              <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                <div className="mb-2">
                  <p className="text-gray-200 text-[11px] leading-relaxed">
                    {t('charts.sourcesDistribution.explanation')}
                  </p>
                </div>

                {/* Compliance Badges */}
                <div className="mt-3 pt-2 border-t border-purple-500/30">
                  <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                    {tGlobal('carbonEquivalentTooltip.compliantWith')}
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                      GRI 302-1
                    </span>
                    <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                      ESRS E1-5
                    </span>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
              </div>
              </div>
            </div>

            <div className="flex items-center justify-center" style={{ height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="45%"
                  cy="50%"
                  outerRadius={130}
                  innerRadius={80}
                  label={(() => {
                    const labelPositions: Array<{ x: number; y: number; angle: number; name: string; value: number }> = [];
                    const MIN_LABEL_SPACING = 45;
                    const SMALL_SEGMENT_THRESHOLD = 5;

                    return ({ cx, cy, midAngle, outerRadius, name, percent, value, index }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 30;
                      let x = cx + radius * Math.cos(-midAngle * RADIAN);
                      let y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const translatedName = translateEnergySource(name, t);
                      const mwhValue = (value / 1000).toFixed(1);
                      const percentage = (percent * 100).toFixed(0);
                      const textAnchor = x > cx ? 'start' : 'end';
                      const color = getSourceColor(name);
                      const isSmallSegment = percent < (SMALL_SEGMENT_THRESHOLD / 100);

                      // Check for overlap with existing labels on the same side
                      const isRightSide = x > cx;
                      const labelsOnSameSide = labelPositions.filter(pos =>
                        (pos.x > cx) === isRightSide
                      );

                      // Smart positioning for small segments
                      if (isSmallSegment && labelsOnSameSide.length >= 2) {
                        const sortedLabels = [...labelsOnSameSide].sort((a, b) => a.y - b.y);
                        let largestGap = 0;
                        let bestY = y;

                        for (let i = 0; i < sortedLabels.length - 1; i++) {
                          const gap = sortedLabels[i + 1].y - sortedLabels[i].y;
                          const midpoint = (sortedLabels[i].y + sortedLabels[i + 1].y) / 2;

                          if (gap > largestGap && gap > MIN_LABEL_SPACING) {
                            largestGap = gap;
                            bestY = midpoint;
                          }
                        }

                        if (largestGap > MIN_LABEL_SPACING * 1.5) {
                          y = bestY;
                        }
                      }

                      // Final overlap check and adjustment
                      let needsAdjustment = true;
                      let attempts = 0;
                      const maxAttempts = 10;

                      while (needsAdjustment && attempts < maxAttempts) {
                        needsAdjustment = false;
                        attempts++;

                        for (const existingLabel of labelsOnSameSide) {
                          const distance = Math.abs(y - existingLabel.y);
                          if (distance < MIN_LABEL_SPACING) {
                            needsAdjustment = true;
                            if (y < existingLabel.y) {
                              y = existingLabel.y - MIN_LABEL_SPACING;
                            } else {
                              y = existingLabel.y + MIN_LABEL_SPACING;
                            }
                          }
                        }
                      }

                      // Store this label's position
                      labelPositions.push({ x, y, angle: midAngle, name, value });

                      return (
                        <text
                          x={x}
                          y={y}
                          fill={color}
                          textAnchor={textAnchor}
                          dominantBaseline="central"
                          style={{ fontSize: '12px' }}
                        >
                          <tspan x={x} dy="-8">{translatedName}</tspan>
                          <tspan x={x} dy="14">{mwhValue} MWh ({percentage}%)</tspan>
                        </text>
                      );
                    };
                  })()}
                  labelLine={true}
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSourceColor(entry.name)} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = getSourceColor(data.name);

                      // Find matching previous year source by name
                      const prevSource = prevYearSourceBreakdown.find((s: any) => s.name === data.name);
                      let yoyChange = null;
                      if (prevSource && prevSource.value > 0) {
                        yoyChange = ((data.value - prevSource.value) / prevSource.value) * 100;
                      }

                      return (
                        <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.name}</p>
                          <p className="text-sm" style={{ color }}>
                            {t('tooltips.consumption')} {formatEnergyConsumption(data.value).value} {formatEnergyConsumption(data.value).unit}
                          </p>
                          <p className="text-sm" style={{ color }}>
                            {t('tooltips.share')} {((data.value / totalEnergy) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-[#A1A1AA] mt-1">
                            {t('tooltips.emissions')} {data.emissions.toFixed(2)} tCO2e
                          </p>
                          {yoyChange !== null && (
                            <p className={`text-sm font-semibold mt-1 ${yoyChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {t('units.yoy')}: {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                            </p>
                          )}
                          {data.renewable && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              {t('tooltips.renewable')}
                            </span>
                          )}
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
        )}

        {/* Monthly Evolution Chart */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm min-h-[480px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1 relative group">
                <TrendingUpIcon className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                  {t('charts.monthlyEvolution.title')}
                </h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('charts.monthlyEvolution.explanation')}
                    </p>
                  </div>

                  {/* Compliance Badges */}
                  <div className="mt-3 pt-2 border-t border-purple-500/30">
                    <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                      {tGlobal('carbonEquivalentTooltip.compliantWith')}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                        ESRS E1-5
                      </span>
                      <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                        TCFD
                      </span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-[#A1A1AA]">
                {t('forecast.includesMLForecast', { count: forecastData.length })}
                {forecastData.length > 0 && forecastData[0].renewable === 0 && (
                  <span className="ml-2 text-amber-500 dark:text-amber-400">
                    {t('forecast.renewableForecastZero')}
                  </span>
                )}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={(() => {
                // Combine actual and forecast data, translating months
                let combinedData = monthlyTrends.map((trend: any) => ({
                  ...trend,
                  month: translateMonth(trend.month, t)
                }));

                if (forecastData.length > 0) {

                  // Add forecast keys to the last actual data point to create smooth transition
                  const lastActual = monthlyTrends[monthlyTrends.length - 1];
                  combinedData[combinedData.length - 1] = {
                    ...lastActual,
                    // Add forecast data keys with same values to create transition point
                    renewableForecast: lastActual.renewable,
                    fossilForecast: lastActual.fossil,
                    totalForecast: lastActual.total
                  };

                  // Add remaining forecast data with only forecast keys
                  forecastData.forEach((f: any) => {
                    combinedData.push({
                      month: translateMonth(f.month, t),
                      monthKey: f.monthKey,
                      renewableForecast: f.renewable,
                      fossilForecast: f.fossil,
                      totalForecast: f.total,
                      forecast: true
                    });
                  });

                }

                return combinedData;
              })()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(value) => useMWh ? `${(value / 1000).toFixed(0)}` : `${value.toFixed(0)}`}
                  label={{ value: formatEnergyConsumption(totalEnergy).yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      const isForecast = payload[0]?.payload?.forecast;
                      return (
                        <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {label}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">{t('tooltips.forecast')}</span>}
                          </p>
                          {payload.map((entry: any, index: number) => (
                            entry.value > 0 && (
                              <p key={index} style={{ color: entry.color }} className="text-sm">
                                {entry.name}: {(entry.value / 1000).toFixed(1)} MWh
                              </p>
                            )
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="renewable"
                  stroke={COLORS.renewable}
                  strokeWidth={2}
                  dot={{ fill: COLORS.renewable, r: 3 }}
                  name={t('legends.renewable')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="fossil"
                  stroke={COLORS.fossil}
                  strokeWidth={2}
                  dot={{ fill: COLORS.fossil, r: 3 }}
                  name={t('legends.fossil')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ fill: '#F59E0B', r: 4 }}
                  name={t('legends.total')}
                  connectNulls
                />
                {/* Forecast data - dashed lines (hide from legend) */}
                {forecastData.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="renewableForecast"
                      stroke={COLORS.renewable}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: COLORS.renewable, strokeWidth: 2, r: 3 }}
                      name={t('legends.renewable')}
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="fossilForecast"
                      stroke={COLORS.fossil}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: COLORS.fossil, strokeWidth: 2, r: 3 }}
                      name={t('legends.fossil')}
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalForecast"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: '#F59E0B', strokeWidth: 2, r: 4 }}
                      name={t('legends.total')}
                      connectNulls
                      legendType="none"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Year-over-Year Comparison */}
        {monthlyTrends.length > 0 && yoyEnergyChange !== null && (() => {
          return true;
        })() && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm flex flex-col min-h-[360px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1 relative group">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                  {t('charts.yoyComparison.title')}
                </h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('charts.yoyComparison.explanation')}
                    </p>
                  </div>

                  {/* Compliance Badges */}
                  <div className="mt-3 pt-2 border-t border-purple-500/30">
                    <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                      {tGlobal('carbonEquivalentTooltip.compliantWith')}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                        GRI 302-1
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                        ESRS E1-5
                      </span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-[#A1A1AA]">
                {t('charts.yoyComparison.description')}
              </p>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                data={(() => {
                  // Create a simple API call to get previous year data for the same months
                  const chartData = monthlyTrends.map((trend: any) => {
                    // Extract year from monthKey (format: "2025-01")
                    const currentYear = parseInt(trend.monthKey.split('-')[0]);
                    const monthNum = trend.monthKey.split('-')[1];
                    const prevYearKey = `${currentYear - 1}-${monthNum}`;

                    // Find matching month from previous year by monthKey
                    const prevTrend = prevYearMonthlyTrends.find((prev: any) =>
                      prev.monthKey === prevYearKey || prev.month === trend.month
                    );

                    // Calculate month-specific YoY change
                    let change = 0;
                    let previous = 0;

                    if (prevTrend && prevTrend.total > 0) {
                      previous = prevTrend.total;
                      change = ((trend.total - prevTrend.total) / prevTrend.total) * 100;
                    } else if (yoyEnergyChange !== null) {
                      // Fallback to overall YoY if no monthly data available
                      change = yoyEnergyChange;
                    }

                    return {
                      month: translateMonth(trend.month, t),
                      monthKey: trend.monthKey,
                      change: change,
                      current: trend.total,
                      previous: previous
                    };
                  });

                  return chartData;
                })()}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                <ReferenceLine y={0} stroke="rgba(156, 163, 175, 0.3)" strokeWidth={1} strokeDasharray="" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                  label={{ value: t('axisLabels.changePercent'), angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const change = data.change;
                      const current = data.current;
                      const previous = data.previous;
                      return (
                        <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.month}</p>
                          <div className="space-y-1 text-xs mb-2">
                            <p className="text-[#A1A1AA]">
                              {t('tooltips.current')} <span className="font-medium text-white">{formatEnergyConsumption(current).value} {formatEnergyConsumption(current).unit}</span>
                            </p>
                            <p className="text-[#A1A1AA]">
                              {t('tooltips.lastYear')} <span className="font-medium text-white">{formatEnergyConsumption(previous).value} {formatEnergyConsumption(previous).unit}</span>
                            </p>
                          </div>
                          <p className={`text-sm font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}% {t('units.yoy')}
                          </p>
                          <p className="text-xs text-[#A1A1AA] mt-1">
                            {change >= 0 ? t('tooltips.increase') : t('tooltips.decrease')} in consumption
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="change"
                  fill="#F59E0B"
                  shape={(props: any) => {
                    const { x, y, width, height, value } = props;
                    const absHeight = Math.abs(height);

                    if (value > 0) {
                      // Positive bar - round top corners only
                      return (
                        <g>
                          <rect x={x} y={y} width={width} height={absHeight} fill="#F59E0B" rx={4} ry={4} />
                          <rect x={x} y={y + absHeight - 4} width={width} height={4} fill="#F59E0B" />
                        </g>
                      );
                    } else if (value < 0) {
                      // Negative bar - round bottom corners only, adjust y to start from zero line
                      const adjustedY = y + height; // height is negative, so this moves up to zero line
                      return (
                        <g>
                          <rect x={x} y={adjustedY} width={width} height={absHeight} fill="#F59E0B" rx={4} ry={4} />
                          <rect x={x} y={adjustedY} width={width} height={4} fill="#F59E0B" />
                        </g>
                      );
                    } else {
                      return <rect x={x} y={y} width={width} height={absHeight} fill="#F59E0B" />;
                    }
                  }}
                />
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Energy Mix Card - Rebuilt */}
        {energyMixes.length > 0 && energyMixes.map((mix, idx) => {
          // Get title and icon based on energy type
          const getEnergyTypeConfig = (type: string) => {
            switch (type) {
              case 'electricity':
                return { title: t('energyMixTitles.electricity'), icon: Zap, color: '#3B82F6' };
              case 'district_heating':
                return { title: t('energyMixTitles.districtHeating'), icon: Flame, color: '#F97316' };
              case 'district_cooling':
                return { title: t('energyMixTitles.districtCooling'), icon: Droplets, color: '#06B6D4' };
              case 'steam':
                return { title: t('energyMixTitles.steam'), icon: Factory, color: '#8B5CF6' };
              default:
                return { title: t('energyMixTitles.default'), icon: Zap, color: '#10B981' };
            }
          };

          const config = getEnergyTypeConfig(mix.energy_type);
          const IconComponent = config.icon;

          return (
            <div key={idx} className="bg-white dark:bg-[#212121] rounded-lg shadow-sm overflow-hidden flex flex-col">
              {/* Header Section */}
              <div className="p-4 border-b border-gray-100 dark:border-[#1A1A1A]">
                <div className="flex items-center gap-2 mb-1 relative group">
                  <IconComponent className="w-5 h-5" style={{ color: config.color }} />
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                    {config.title}
                  </h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <div className="mb-2">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        {t('charts.gridMix.explanation')}
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                          GHG Scope 2
                        </span>
                        {mix.emission_factors && (
                          <span className="px-1.5 py-0.5 bg-orange-100/20 text-orange-300 text-[9px] rounded border border-orange-500/30">
                            GHG Scope 3.3
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                          TCFD
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-[#A1A1AA]">
                  {t('tooltips.year')} {mix.year}
                </p>
              </div>

              {/* Renewable Percentage Card */}
              <div className="p-3">
                <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-[#3A3A3A] relative group">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-medium text-gray-600 dark:text-[#A1A1AA] mb-1">
                        {t('gridMix.renewableEnergy')}
                      </div>
                      <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {mix.renewable_percentage.toFixed(1)}%
                      </div>
                    </div>
                    {mix.emission_factors && (
                      <div className="cursor-help">
                        <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
                      </div>
                    )}
                  </div>

                  {/* Explanatory Note */}
                  <div className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t('gridMix.renewableNote')} {t('gridMix.dataSource')}
                  </div>

                  {/* Emission Factors Tooltip */}
                  {mix.emission_factors && (mix.emission_factors.carbon_intensity_scope2 || mix.emission_factors.carbon_intensity_scope3_cat3 || mix.emission_factors.carbon_intensity_lifecycle) && (
                    <div className="absolute top-full right-4 mt-2 p-3 bg-[#111111] border border-[#1A1A1A] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-72">
                      <div className="text-xs font-semibold text-gray-300 mb-2 text-center">
                        {t('emissionFactors.title')}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {mix.emission_factors.carbon_intensity_scope2 && (
                          <div className="text-center">
                            <div className="text-[#A1A1AA] mb-1">{t('emissionFactors.scope2')}</div>
                            <div className="font-bold text-green-400">
                              {mix.emission_factors.carbon_intensity_scope2.toFixed(0)}
                            </div>
                            <div className="text-xs text-[#757575]">{t('emissionFactors.direct')}</div>
                          </div>
                        )}
                        {mix.emission_factors.carbon_intensity_scope3_cat3 && (
                          <div className="text-center">
                            <div className="text-[#A1A1AA] mb-1">{t('emissionFactors.scope3')}</div>
                            <div className="font-bold text-orange-400">
                              {mix.emission_factors.carbon_intensity_scope3_cat3.toFixed(0)}
                            </div>
                            <div className="text-xs text-[#757575]">{t('emissionFactors.upstream')}</div>
                          </div>
                        )}
                        {mix.emission_factors.carbon_intensity_lifecycle && (
                          <div className="text-center">
                            <div className="text-[#A1A1AA] mb-1">{t('emissionFactors.total')}</div>
                            <div className="font-bold text-blue-400">
                              {mix.emission_factors.carbon_intensity_lifecycle.toFixed(0)}
                            </div>
                            <div className="text-xs text-[#757575]">{t('emissionFactors.lifecycle')}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Energy Sources Grid */}
              {mix.sources.length > 0 ? (
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {mix.sources.map((source, sourceIdx) => {
                      const percentage = source.percentage !== null && source.percentage !== undefined ? source.percentage : 0;
                      const color = getGridMixColor(source.name);
                      const isRenewable = source.renewable === true;

                      return (
                        <div
                          key={sourceIdx}
                          className="bg-gray-50 dark:bg-[#1A1A1A] rounded-lg p-3 border border-gray-200 dark:border-[#212121] hover:border-gray-300 dark:hover:border-[#757575] transition-colors"
                        >
                          {/* Source Name and Percentage Row */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {translateEnergySource(source.name, t)}
                              </span>
                              {source.renewable === true && (
                                <Leaf className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                              )}
                              {source.renewable === false && (
                                <Flame className="w-3.5 h-3.5 text-[#A1A1AA] flex-shrink-0" />
                              )}
                            </div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2 flex-shrink-0">
                              {source.percentage !== null && source.percentage !== undefined
                                ? `${percentage.toFixed(1)}%`
                                : '?%'}
                            </span>
                          </div>

                          {/* Unknown Badge */}
                          {(source.percentage === null || source.percentage === undefined) && (
                            <div className="mb-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                                {t('gridMix.unknown')}
                              </span>
                            </div>
                          )}

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 dark:bg-[#111111] rounded-full h-2 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500 ease-out"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: color
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-[#1A1A1A] rounded-lg text-center">
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                      {t('gridMix.detailedBreakdownUnavailable')}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-[#A1A1AA]">
                      {t('gridMix.applyMigrations')}
                    </p>
                  </div>
                </div>
              )}

              {/* Unknown Sources Warning */}
              {mix.has_unknown_sources && (
                <div className="px-4 pb-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-[#1A1A1A] rounded-lg">
                    <p className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{t('gridMix.someSourcesUnknown')}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Monthly Consumption by Source - Stacked Bar Chart */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm min-h-[480px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts2.monthlyConsumptionBySource')}</h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('charts2.stackedBreakdownDescription')}
                    </p>
                  </div>

                  {/* Compliance Badges */}
                  <div className="mt-3 pt-2 border-t border-purple-500/30">
                    <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                      {tGlobal('carbonEquivalentTooltip.compliantWith')}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                        GRI 302-1
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                        ESRS E1-5
                      </span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={(() => {
                // Transform data to flatten sources, translating months
                const transformed = monthlyTrends.map((trend: any) => {
                  const flattened: any = {
                    month: translateMonth(trend.month, t),
                    monthKey: trend.monthKey,
                    total: trend.total
                  };
                  // Add each source as a separate key
                  if (trend.sources) {
                    Object.entries(trend.sources).forEach(([sourceName, value]: [string, any]) => {
                      flattened[sourceName] = value;
                    });
                  }
                  return flattened;
                });
                return transformed;
              })()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: t('axisLabels.mwh'), angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.month}</p>
                          <div className="space-y-1 text-sm">
                            {payload.map((entry: any, idx: number) => {
                              if (entry.dataKey !== 'month' && entry.dataKey !== 'monthKey' && entry.dataKey !== 'total') {
                                return (
                                  <p key={idx} style={{ color: entry.fill }}>
                                    {entry.dataKey}: {(entry.value / 1000).toFixed(1)} MWh
                                  </p>
                                );
                              }
                              return null;
                            })}
                            <p className="text-white font-bold border-t border-[#757575] pt-1 mt-1">
                              {t('legends.total')}: {(data.total / 1000).toFixed(1)} MWh
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px' }}
                  iconType="square"
                />
                {sourceBreakdown.map((source: any, idx: number) => (
                  <Bar
                    key={source.name}
                    dataKey={source.name}
                    stackId="energy"
                    fill={getSourceColor(source.name)}
                    name={translateEnergySource(source.name, t)}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Site Performance Ranking */}
        {siteComparison.length > 1 && (
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm min-h-[480px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-500" />
                <div className="relative group inline-block">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
                    {t('sitePerformance.title')}
                  </h3>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <div className="mb-2">
                      <p className="text-white text-[11px] leading-relaxed whitespace-pre-line">
                        {t('explanations.sitePerformance')}
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          GRI 302-3
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
                // Benchmark for energy intensity (kWh/m²/year)
                const benchmark = { low: 100, average: 200, high: 300 };

                const getBarColor = (intensity: number) => {
                  if (intensity <= benchmark.low) return '#10b981'; // green-500
                  if (intensity <= benchmark.average) return '#f59e0b'; // amber-500
                  return '#ef4444'; // red-500
                };

                // Prepare chart data - reverse to show best performers at top
                const chartData = [...siteComparison].reverse().map((siteData, index) => ({
                  name: siteData.name,
                  intensity: siteData.intensity,
                  fill: getBarColor(siteData.intensity),
                  rank: siteComparison.length - index
                }));

                return (
                  <>
                    <div className="mt-4">
                      <ResponsiveContainer width="100%" height={420}>
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
                            label={{ value: 'kWh/m²', position: 'bottom', offset: 10, fill: '#9CA3AF', fontSize: 11 }}
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
                                      {data.intensity} kWh/m²
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
                            label={{
                              position: 'inside',
                              fill: 'white',
                              fontSize: 11,
                              formatter: (value: number) => `${Math.round(value)} kWh/m²`
                            }}
                          >
                            {chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Legend for performance levels */}
                    <div className="flex items-center justify-center gap-4 mt-6 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-green-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('performanceLevels.excellent')} (≤{benchmark.low})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-amber-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('performanceLevels.good')} ({benchmark.low}-{benchmark.average})
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-red-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">
                          {t('performanceLevels.needsImprovement')} (&gt;{benchmark.average})
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Target Progress - Removed SBTi section */}
      {false && categoryTargets.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1 relative group">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('sbti.title')}</h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('sbti.description')}
                    </p>
                  </div>

                  {/* Compliance Badges */}
                  <div className="mt-3 pt-2 border-t border-purple-500/30">
                    <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                      {tGlobal('carbonEquivalentTooltip.compliantWith')}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                        GHG Protocol
                      </span>
                      <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                        SBTi
                      </span>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95"></div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-[#A1A1AA]">
                {t('sbti.pathway')} • {overallTargetPercent}% {t('sbti.annualReduction')} • {t('sbti.baseline2023')}
              </p>
            </div>

            <div className="space-y-3">
              {categoryTargets.map((cat: any) => {
                const isExpanded = expandedCategories.has(cat.category);
                // More flexible category matching - match if category contains or is contained in the metric category
                const categoryMetrics = metricTargets.filter(m =>
                  m.category === cat.category ||
                  m.category?.includes(cat.category) ||
                  cat.category?.includes(m.category)
                );

                console.log(`🔍 Category: "${cat.category}", Metrics found: ${categoryMetrics.length}`, {
                  allMetricCategories: metricTargets.map(m => m.category),
                  matchedMetrics: categoryMetrics.map(m => ({ name: m.metricName, category: m.category }))
                });

                return (
                  <div key={cat.category}>
                    {/* Category Row - Clickable to expand */}
                    <div
                      className="bg-gray-50 dark:bg-[#1A1A1A] rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#212121] transition-colors"
                      onClick={() => {
                        setExpandedCategories(prev => {
                          const next = new Set(prev);
                          if (next.has(cat.category)) {
                            next.delete(cat.category);
                          } else {
                            next.add(cat.category);
                          }
                          return next;
                        });
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm flex items-center gap-2">
                              {translateCategory(cat.category, t)}
                              {categoryMetrics.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                  {categoryMetrics.length} {t('sbti.metrics')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-[#A1A1AA]">
                              {cat.annualReductionRate ? `${cat.annualReductionRate.toFixed(1)}% ${t('targetSection.annual')} • ` : ''}{translateReason(cat.reason, t)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {cat.progressPercent !== null && cat.progressPercent !== undefined ? (
                            <>
                              <div className={`text-sm font-semibold ${
                                cat.progressPercent >= 100 ? 'text-green-600 dark:text-green-400' :
                                cat.progressPercent >= 80 ? 'text-blue-600 dark:text-blue-400' :
                                cat.progressPercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {cat.progressPercent.toFixed(0)}%
                              </div>
                              <div className={`text-xs font-medium ${
                                cat.progressPercent >= 100 ? 'text-green-600 dark:text-green-400' :
                                cat.progressPercent >= 80 ? 'text-blue-600 dark:text-blue-400' :
                                cat.progressPercent >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {cat.progressPercent >= 100 ? t('progressStatus.exceeding') :
                                 cat.progressPercent >= 80 ? t('progressStatus.onTrack') :
                                 cat.progressPercent >= 50 ? t('progressStatus.atRisk') :
                                 t('progressStatus.offTrack')}
                              </div>
                            </>
                          ) : (
                            <div className="text-sm font-medium text-gray-400 dark:text-gray-500">
                              N/A
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-[#A1A1AA]">{t('targetSection.baseline')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {(cat.baseline2023FullYear || 0).toFixed(1)} tCO2e
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-[#A1A1AA]">{t('targetSection.target2025')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {(cat.expectedEmissions2025 || 0).toFixed(1)} tCO2e
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-[#A1A1AA]">{t('targetSection.projected')}</span>
                          <span className={`ml-1 font-medium ${
                            (cat.projected2025FullYear || 0) <= (cat.expectedEmissions2025 || 0)
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {(cat.projected2025FullYear || 0).toFixed(1)} tCO2e
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 h-2 bg-gray-200 dark:bg-[#111111] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            cat.progressPercent >= 100 ? 'bg-green-500' :
                            cat.progressPercent >= 80 ? 'bg-blue-500' :
                            cat.progressPercent >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(cat.progressPercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Expanded Metric-level Targets */}
                    {isExpanded && categoryMetrics.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2">
                        {categoryMetrics.map((metric) => (
                          <div key={metric.id} className="bg-gray-50 dark:bg-[#111111] rounded-lg p-3 border-l-2 border-purple-400">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {metric.metricName}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                    {formatScope(metric.scope)}
                                  </span>
                                </div>
                              </div>
                              <div className={`text-sm font-semibold ${
                                metric.progress.trajectoryStatus === 'on-track' ? 'text-green-600 dark:text-green-400' :
                                metric.progress.trajectoryStatus === 'at-risk' ? 'text-yellow-600 dark:text-yellow-400' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {metric.progress.progressPercent.toFixed(0)}%
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                              <div>
                                <span className="text-gray-500 dark:text-[#A1A1AA]">{t('targetSection.baseline')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.baselineEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-[#A1A1AA]">{t('targetSection.target2025')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.targetEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-[#A1A1AA]">{t('targetSection.current')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.currentEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                            </div>

                            <div className="h-1.5 bg-gray-200 dark:bg-[#1A1A1A] rounded-full overflow-hidden mb-2">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  metric.progress.trajectoryStatus === 'on-track' ? 'bg-green-500' :
                                  metric.progress.trajectoryStatus === 'at-risk' ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, metric.progress.progressPercent)}%` }}
                              />
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMetricForInitiative(metric.id);
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded text-purple-300 text-xs font-medium transition-all"
                            >
                              <Plus className="h-3 w-3" />
                              {t('sbti.addInitiative')}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Energy Efficiency Target Progress - Only show for current year */}
      {baselineData.data &&
       new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 relative group">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('energyProgress.title')}</h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-blue-900/95 to-cyan-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-blue-500/30">
                    <div className="mb-2">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        Track progress toward energy efficiency targets and renewable energy adoption goals. Based on ISO 50001 Energy Management System standards.
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-blue-500/30">
                      <p className="text-blue-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          ISO 50001
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                          GRI 302-1
                        </span>
                        <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                          RE100
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-blue-900/95"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {'ISO 50001 Energy Efficiency Benchmark'} • {baselineYear} → {targetYear}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                  {(5.0).toFixed(1)}% {t('energyProgress.reductionTarget')}
                </div>
              </div>
            </div>

            {(() => {
              const baseline = baselineData.data?.total_consumption || 0; // kWh
              const currentYTD = sources.data?.total_consumption || 0; // kWh

              // Calculate projected full year consumption
              let projectedFullYear = 0;
              if (forecast.data?.forecast?.length > 0) {
                const forecastRemaining = forecast.data.forecast.reduce((sum: number, f: any) => {
                  return sum + (f.total || 0);
                }, 0);
                projectedFullYear = currentYTD + forecastRemaining;
              } else {
                const monthsOfData = sources.data?.monthly_trends?.length || 0;
                projectedFullYear = monthsOfData > 0 ? (currentYTD / monthsOfData) * 12 : 0;
              }

              const current = projectedFullYear;

              // Calculate required consumption (5% annual reduction)
              const annualReductionRate = 0.05; // 5% per year
              const yearsSinceBaseline = targetYear - baselineYear;
              const requiredConsumption = baseline * Math.pow(1 - annualReductionRate, yearsSinceBaseline);

              // Calculate 2030 target (30% total reduction from baseline)
              const target = baseline * 0.70; // 30% reduction by 2030

              // Calculate required reduction from baseline to required
              const requiredReduction = baseline - requiredConsumption;

              // Calculate gap from required to current
              const gapFromRequired = current - requiredConsumption;

              // Calculate progress
              const targetReduction = baseline - requiredConsumption;
              const actualReduction = baseline - current;
              const progress = targetReduction > 0 ? (actualReduction / targetReduction) * 100 : 0;

              // Determine status
              const isOnTrack = current <= requiredConsumption;
              const statusText = isOnTrack ? t('energyProgress.onTrackStatus') : t('energyProgress.atRisk');
              const statusColor = isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

              // Waterfall chart data
              const waterfallData = [
                {
                  name: `${baselineYear}\n${t('energyProgress.waterfallChart.baseline')}`,
                  base: 0,
                  value: baseline,
                  total: baseline,
                  label: (baseline / 1000).toFixed(1) + ' MWh'
                },
                {
                  name: `${t('energyProgress.waterfallChart.required')}\n${t('energyProgress.waterfallChart.reduction')}`,
                  base: requiredConsumption,
                  value: requiredReduction,
                  total: baseline,
                  label: `-(${(requiredReduction / 1000).toFixed(1)} MWh)`,
                  isRequiredReduction: true
                },
                {
                  name: `${targetYear}\n${t('energyProgress.waterfallChart.required')}`,
                  base: 0,
                  value: requiredConsumption,
                  total: requiredConsumption,
                  label: (requiredConsumption / 1000).toFixed(1) + ' MWh',
                  isRequired: true
                },
                {
                  name: `${t('energyProgress.waterfallChart.gap')}\n${t('energyProgress.waterfallChart.required')}`,
                  base: requiredConsumption,
                  value: Math.max(0, gapFromRequired),
                  total: current,
                  label: gapFromRequired > 0 ? `+(${(gapFromRequired / 1000).toFixed(1)} MWh)` : '0',
                  isGap: true
                },
                {
                  name: `${targetYear}\n${t('energyProgress.waterfallChart.actual')}`,
                  base: 0,
                  value: current,
                  total: current,
                  label: (current / 1000).toFixed(1) + ' MWh',
                  isCurrent: true
                },
                {
                  name: `2030\n${t('energyProgress.waterfallChart.target')}`,
                  base: 0,
                  value: target,
                  total: target,
                  label: (target / 1000).toFixed(1) + ' MWh',
                  isTarget: true
                }
              ];

              return (
                <>
                  {/* 5-card layout */}
                  <div className="grid grid-cols-5 gap-3 mb-6">
                    {/* Baseline */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('energyProgress.baseline')} ({baselineYear})
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{(baseline / 1000).toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">MWh</div>
                    </div>

                    {/* Current */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('energyProgress.current')} ({new Date().getFullYear()})
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{(current / 1000).toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">MWh (projected)</div>
                    </div>

                    {/* Required */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('energyProgress.required')} ({targetYear})
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{(requiredConsumption / 1000).toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">MWh</div>
                    </div>

                    {/* Target */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('energyProgress.target')} (2030)
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{(target / 1000).toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">MWh</div>
                    </div>

                    {/* Progress */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('energyProgress.progress')}</span>
                      </div>
                      <div className={`text-xl font-bold ${statusColor}`}>{progress.toFixed(0)}%</div>
                      <div className={`text-xs ${statusColor}`}>{statusText}</div>
                      {!isOnTrack && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          +{(gapFromRequired / 1000).toFixed(1)} MWh {t('energyProgress.aboveRequired')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Waterfall Chart */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('energyProgress.waterfallChart.title')}</h4>
                    <div className="h-[420px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={waterfallData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                            label={{ value: 'Energy Consumption (MWh)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
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
                                          {t('energyProgress.waterfallChart.tooltip.reduction')}: <span className="font-medium">{(value / 1000).toFixed(1)} MWh</span>
                                        </p>
                                      ) : data.label && data.label.includes('+') ? (
                                        <p className="text-red-400">
                                          {t('energyProgress.waterfallChart.tooltip.increase')}: <span className="font-medium">{(value / 1000).toFixed(1)} MWh</span>
                                        </p>
                                      ) : (
                                        <p className="text-gray-300">
                                          {t('energyProgress.waterfallChart.tooltip.total')}: <span className="font-medium text-white">{(total / 1000).toFixed(1)} MWh</span>
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          {/* Invisible base bars */}
                          <Bar dataKey="base" stackId="a" fill="transparent" />
                          {/* Visible value bars with conditional colors */}
                          <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                            {waterfallData.map((entry, index) => {
                              let color = '#6B7280'; // Default gray for baseline
                              if (entry.isRequiredReduction) color = '#10B981'; // Green for required reduction
                              else if (entry.isRequired) color = '#3B82F6'; // Blue for required target
                              else if (entry.isGap) color = '#EF4444'; // Red for gap
                              else if (entry.isCurrent) color = '#F59E0B'; // Orange for current actual
                              else if (entry.isTarget) color = '#10B981'; // Green for final target

                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={color}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Recommendations Modal */}
      {selectedMetricForInitiative && (
        <RecommendationsModal
          isOpen={true}
          onClose={() => setSelectedMetricForInitiative(null)}
          organizationId={organizationId}
          metricTarget={metricTargets.find(mt => mt.id === selectedMetricForInitiative)}
          onSave={async (initiative) => {
            try {

              const selectedMetric = metricTargets.find(mt => mt.id === selectedMetricForInitiative);
              if (!selectedMetric) {
                throw new Error('Metric target not found');
              }

              // Calculate estimated reduction percentage
              const baselineValue = selectedMetric.baselineEmissions || selectedMetric.baselineValue || 0;
              const estimatedReductionPercent = baselineValue > 0
                ? (initiative.estimatedReduction / baselineValue) * 100
                : 0;

              // Determine start and completion dates
              const startDate = new Date().toISOString().split('T')[0];
              const completionDate = initiative.timeline
                ? new Date(new Date().setMonth(new Date().getMonth() + 12)).toISOString().split('T')[0]
                : null;

              // Create the initiative via API
              const response = await fetch('/api/sustainability/initiatives', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  organization_id: organizationId,
                  metric_target_id: selectedMetricForInitiative,
                  sustainability_target_id: 'd4a00170-7964-41e2-a61e-3d7b0059cfe5', // SBTi target ID
                  name: initiative.name,
                  description: initiative.description,
                  initiative_type: 'energy_efficiency',
                  estimated_reduction_tco2e: initiative.estimatedReduction,
                  estimated_reduction_percentage: estimatedReductionPercent,
                  start_date: startDate,
                  completion_date: completionDate,
                  implementation_status: 'planned',
                  capex: initiative.estimatedCost || null,
                  annual_opex: null,
                  annual_savings: null,
                  roi_years: null,
                  confidence_score: 0.7,
                  risk_level: 'medium',
                  risks: null,
                  dependencies: null
                })
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save initiative');
              }

              const result = await response.json();

              // Close modal
              setSelectedMetricForInitiative(null);

              // Optionally: Show success message or refresh data
              // You could add a toast notification here
            } catch (error: any) {
              console.error('❌ Error saving energy initiative:', error);
              alert(`Failed to save initiative: ${error.message}`);
            }
          }}
        />
      )}
    </div>
  );
}
