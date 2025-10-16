'use client';

import React, { useState, useEffect } from 'react';
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
  Activity
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
  ComposedChart
} from 'recharts';
import type { Building } from '@/types/auth';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import { MetricTargetsCard } from '@/components/sustainability/MetricTargetsCard';
import { RecommendationsModal } from '@/components/sustainability/RecommendationsModal';
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import { useEnergyDashboard } from '@/hooks/useDashboardData';

interface EnergyDashboardProps {
  organizationId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

const COLORS = {
  renewable: '#10B981',
  fossil: '#6B7280',
  electricity: '#3B82F6',
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

  // Grid/Purchased Electricity - Blue
  if (nameLower.includes('grid') || nameLower.includes('electricity')) {
    return '#3B82F6'; // Blue
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

export function EnergyDashboard({ organizationId, selectedSite, selectedPeriod }: EnergyDashboardProps) {
  // Translation hooks
  const t = useTranslations('sustainability.energy');
  const { t: tGlobal } = useLanguage();

  // Fetch data with React Query (cached)
  const { sources, intensity, forecast, prevYearSources, targets, isLoading } = useEnergyDashboard(
    selectedPeriod,
    selectedSite,
    organizationId
  );

  const [selectedTab, setSelectedTab] = useState<'overview' | 'source' | 'type' | 'trends'>('overview');

  // Summary data
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [renewablePercentage, setRenewablePercentage] = useState(0);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [energyIntensity, setEnergyIntensity] = useState(0);

  // YoY comparison data
  const [yoyEnergyChange, setYoyEnergyChange] = useState<number | null>(null);
  const [yoyEmissionsChange, setYoyEmissionsChange] = useState<number | null>(null);
  const [yoyRenewableChange, setYoyRenewableChange] = useState<number | null>(null);

  // Target and compliance data
  const [annualTarget, setAnnualTarget] = useState<number | null>(null);
  const [forecastedTotal, setForecastedTotal] = useState<number | null>(null);
  const [targetStatus, setTargetStatus] = useState<'on-track' | 'at-risk' | 'off-track' | null>(null);

  // Weighted allocation targets
  const [categoryTargets, setCategoryTargets] = useState<any[]>([]);
  const [overallTargetPercent, setOverallTargetPercent] = useState<number | null>(null);

  // Metric-level targets for expandable view
  const [metricTargets, setMetricTargets] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  // Breakdown data
  const [sourceBreakdown, setSourceBreakdown] = useState<any[]>([]);
  const [prevYearSourceBreakdown, setPrevYearSourceBreakdown] = useState<any[]>([]);
  const [typeBreakdown, setTypeBreakdown] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  // Energy mix data for different energy types (electricity, district heating, etc.)
  const [energyMixes, setEnergyMixes] = useState<Array<{
    energy_type: 'electricity' | 'district_heating' | 'district_cooling' | 'steam';
    provider_name?: string;
    year: number;
    sources: Array<{
      name: string;
      percentage: number | null;
      renewable: boolean;
    }>;
    renewable_percentage: number;
    has_unknown_sources: boolean;
    emission_factors?: {
      carbon_intensity_lifecycle: number;
      carbon_intensity_scope2: number;
      carbon_intensity_scope3_cat3: number;
    } | null;
  }>>([]);

  // Process cached data when it changes
  useEffect(() => {
    if (!sources.data) return;

    const processData = async () => {
      try {
        const sourcesData = sources.data;

        if (sourcesData.sources) {
          setTotalEnergy(sourcesData.total_consumption || 0);
          setRenewablePercentage(sourcesData.renewable_percentage || 0);
          setTotalEmissions(sourcesData.total_emissions || 0);

          // Process source breakdown
          const processedSources = sourcesData.sources.map((s: any) => ({
            name: s.name,
            value: s.consumption,
            renewable: s.renewable,
            emissions: s.emissions
          }));

          setSourceBreakdown(processedSources);

          // Use only real energy type breakdown from API - no fallback
          if (sourcesData.energy_types && sourcesData.energy_types.length > 0) {
            setTypeBreakdown(sourcesData.energy_types);
          } else {
            setTypeBreakdown([]);
          }

          // Use only real monthly trends from API - no fallback
          if (sourcesData.monthly_trends && sourcesData.monthly_trends.length > 0) {
            setMonthlyTrends(sourcesData.monthly_trends);
          } else {
            setMonthlyTrends([]);
          }

          // Set energy mix data if available (can be multiple types)
          if (sourcesData.energy_mixes && Array.isArray(sourcesData.energy_mixes)) {
            setEnergyMixes(sourcesData.energy_mixes);
          } else if (sourcesData.grid_mix) {
            // Backward compatibility: convert old grid_mix format
            const legacyMix = sourcesData.grid_mix;
            const converted = [{
              energy_type: 'electricity' as const,
              provider_name: legacyMix.provider,
              year: legacyMix.year,
              sources: legacyMix.sources || [],
              renewable_percentage: legacyMix.renewable_percentage || 0,
              has_unknown_sources: legacyMix.has_unknown_sources || false
            }];
            setEnergyMixes(converted);
          }
        }

        // Process intensity data (cached)
        const intensityData = intensity.data;
        if (intensityData?.perSquareMeter?.value) {
          setEnergyIntensity(intensityData.perSquareMeter.value);
        }

        // Process previous year data for YoY comparison (cached)
        const prevSourcesData = prevYearSources.data;
        if (prevSourcesData?.sources && prevSourcesData.total_consumption > 0) {
          // Calculate YoY changes
          const energyChange = ((sourcesData.total_consumption - prevSourcesData.total_consumption) / prevSourcesData.total_consumption) * 100;
          const emissionsChange = ((sourcesData.total_emissions - prevSourcesData.total_emissions) / prevSourcesData.total_emissions) * 100;
          const renewableChange = sourcesData.renewable_percentage - prevSourcesData.renewable_percentage;

          setYoyEnergyChange(energyChange);
          setYoyEmissionsChange(emissionsChange);
          setYoyRenewableChange(renewableChange);

          // Store previous year source breakdown for pie chart tooltips
          if (prevSourcesData.sources && prevSourcesData.sources.length > 0) {
            const processedPrevSources = prevSourcesData.sources.map((s: any) => ({
              name: s.name,
              value: s.consumption,
              renewable: s.renewable,
              emissions: s.emissions
            }));
            setPrevYearSourceBreakdown(processedPrevSources);
          }

          // Store previous year monthly trends for comparison
          if (prevSourcesData.monthly_trends && prevSourcesData.monthly_trends.length > 0) {
            setPrevYearMonthlyTrends(prevSourcesData.monthly_trends);
          }
        }

        // Process ML forecast data (cached)
        const forecastDataRes = forecast.data;
        let currentForecastData: any[] = [];

        if (forecastDataRes?.forecast && forecastDataRes.forecast.length > 0) {
          // The API returns forecast for all months after the last actual data
          // Since we have data through July 2025, all forecast months (Aug-Dec) should be included
          // We use all forecast data since it represents months without actual data
          currentForecastData = forecastDataRes.forecast;

          if (forecastDataRes.metadata) {
          }

          // Map forecast data with different keys to avoid overlapping with actual data
          setForecastData(forecastDataRes.forecast.map((f: any) => ({
            month: f.month,
            monthKey: f.monthKey,
            totalForecast: f.total,
            renewableForecast: f.renewable,
            fossilForecast: f.fossil,
            forecast: true
          })));

          // Calculate forecasted annual total
          const currentTotal = sourcesData.total_consumption || 0;
          const forecastTotal = forecastDataRes.forecast.reduce((sum: number, f: any) => sum + f.total, 0);
          const annualForecast = currentTotal + forecastTotal;
          setForecastedTotal(annualForecast);

          // Set annual target based on SBTi - ONLY for current year
          const currentYear = new Date().getFullYear();
          const selectedYear = new Date(selectedPeriod.start).getFullYear();

          // Note: SBTi targets apply to EMISSIONS, not energy consumption
          // Energy consumption can increase while emissions decrease (via renewable transition)
          // Removed incorrect SBTi energy consumption target logic
        } else {
          setForecastData([]);
        }

        // Fetch weighted allocation targets for energy categories
        const currentYear = new Date().getFullYear();
        const selectedYear = new Date(selectedPeriod.start).getFullYear();
        const baselineYear = 2023;

        if (selectedYear === currentYear) {
          // Fetch category-level targets from the database (source of truth) via API
          // This table stores the exact target percentages set for each category
          const categoryParams = new URLSearchParams({
            baseline_year: baselineYear.toString(),
            categories: 'Electricity,Purchased Energy'
          });

          const categoryRes = await fetch(`/api/sustainability/targets/category?${categoryParams}`);
          const categoryData = await categoryRes.json();

          // Use database targets if available, otherwise fall back to weighted allocation API
          let energyCategories: any[] = [];

          if (categoryData.targets && categoryData.targets.length > 0) {
            // Use targets from database
            energyCategories = categoryData.targets.map((t: any) => ({
              category: t.category,
              currentEmissions: t.baseline_emissions,
              emissionPercent: t.emission_percent,
              baselineTargetPercent: t.baseline_target_percent,
              adjustedTargetPercent: t.adjusted_target_percent,
              effortFactor: t.effort_factor,
              reason: t.allocation_reason,
              absoluteTarget: t.target_emissions,
              feasibility: t.feasibility
            }));
          } else {
            // Fall back to weighted allocation API
            const allocParams = new URLSearchParams({
              baseline_year: baselineYear.toString(),
            });
            if (selectedSite) {
              allocParams.append('site_id', selectedSite.id);
            }

            const allocRes = await fetch(`/api/sustainability/targets/weighted-allocation?${allocParams}`);
            const allocData = await allocRes.json();

            energyCategories = allocData.allocations?.filter((a: any) =>
              a.category === 'Electricity' || a.category === 'Purchased Energy'
            ) || [];
          }

          // Fetch FULL YEAR 2023 baseline (not just same period)
          const baseline2023Params = new URLSearchParams({
            start_date: '2023-01-01',
            end_date: '2023-12-31',
          });
          if (selectedSite) {
            baseline2023Params.append('site_id', selectedSite.id);
          }

          const baseline2023Res = await fetch(`/api/energy/sources?${baseline2023Params}`);
          const baseline2023Data = await baseline2023Res.json();

          // Calculate 2025 full year projection = Actual YTD + Forecast remaining months
          const current2025YTD = sourcesData.total_emissions; // Jan-Jul actual (tCO2e)

          // Sum up forecast for remaining months (Aug-Dec)
          // Forecast data is in kWh, need to convert to tCO2e using emission factors
          const RENEWABLE_EMISSION_FACTOR = 0.02; // kgCO2e/kWh
          const FOSSIL_EMISSION_FACTOR = 0.4; // kgCO2e/kWh (IEA average)


          const forecastRemaining = currentForecastData.reduce((sum: number, f: any) => {
            const renewableKWh = f.renewable || 0;
            const fossilKWh = f.fossil || 0;
            const renewableEmissions = renewableKWh * RENEWABLE_EMISSION_FACTOR / 1000; // Convert to tCO2e
            const fossilEmissions = fossilKWh * FOSSIL_EMISSION_FACTOR / 1000; // Convert to tCO2e
            return sum + renewableEmissions + fossilEmissions;
          }, 0);

          const projected2025FullYear = current2025YTD + forecastRemaining;


          if (energyCategories.length > 0 && baseline2023Data.total_emissions) {
            // energyCategories is already populated from database or API above

            // Map energy sources to categories
            // Electricity = grid_electricity, solar, wind, renewable_electricity, ev_charging
            // Purchased Energy = purchased_heating, purchased_cooling, district_heating, district_cooling, steam
            const mapSourcesToCategories = (sources: any[]) => {
              const electricity = sources.filter((s: any) =>
                ['grid_electricity', 'solar', 'wind', 'renewable_electricity', 'ev_charging'].includes(s.type)
              ).reduce((sum, s) => sum + s.emissions, 0);

              const purchasedEnergy = sources.filter((s: any) =>
                ['purchased_heating', 'purchased_cooling', 'district_heating', 'district_cooling', 'steam'].includes(s.type)
              ).reduce((sum, s) => sum + s.emissions, 0);

              return {
                Electricity: electricity,
                'Purchased Energy': purchasedEnergy
              };
            };


            const current2025YTDCategories = mapSourcesToCategories(sourcesData.sources);
            const baseline2023FullYearCategories = mapSourcesToCategories(baseline2023Data.sources);

            // Project 2025 full year by category using forecast data
            // Assume forecast proportions match YTD proportions
            const ytdTotal = sourcesData.total_emissions;
            const forecastTotal = forecastRemaining;
            const projectedTotal = projected2025FullYear;


            const projected2025FullYearCategories: any = {};
            Object.keys(current2025YTDCategories).forEach(category => {
              const ytdCategoryEmissions = current2025YTDCategories[category];
              const categoryShare = ytdCategoryEmissions / ytdTotal;
              const forecastCategoryEmissions = forecastTotal * categoryShare;
              projected2025FullYearCategories[category] = ytdCategoryEmissions + forecastCategoryEmissions;
            });


            const enrichedCategories = energyCategories.map((cat: any) => {
              // Calculate expected reduction based on ANNUAL COMPOUNDING
              const yearsElapsed = currentYear - baselineYear; // 2025 - 2023 = 2 years
              const targetYear = 2030; // SBTi target year
              const annualReductionRate = cat.adjustedTargetPercent / 100; // e.g., 5.2% = 0.052


              // Calculate target emissions using compound reduction: baseline × (1 - rate)^years
              const categoryFullYearBaseline = baseline2023FullYearCategories[cat.category] || 0;
              const expectedEmissions2025 = categoryFullYearBaseline * Math.pow(1 - annualReductionRate, yearsElapsed);


              // Calculate cumulative reduction percentage from baseline to current year
              const cumulativeReductionPercent = ((categoryFullYearBaseline - expectedEmissions2025) / categoryFullYearBaseline) * 100;

              // Get actual projected emissions for this category
              const categoryProjected2025 = projected2025FullYearCategories[cat.category] || 0;

              // Calculate actual change (comparing full years: 2023 baseline vs 2025 projected)
              // Positive = reduction, Negative = increase
              const categoryActualChange = categoryFullYearBaseline > 0
                ? ((categoryFullYearBaseline - categoryProjected2025) / categoryFullYearBaseline) * 100
                : 0;

              // Calculate progress: (actual reduction / expected reduction) * 100
              const progressPercent = cumulativeReductionPercent > 0
                ? (categoryActualChange / cumulativeReductionPercent) * 100
                : 0;

              return {
                ...cat,
                baselineEmissions: cat.currentEmissions, // From weighted allocation (full year 2023)
                baseline2023FullYear: categoryFullYearBaseline,
                projected2025FullYear: categoryProjected2025,
                expectedEmissions2025, // Target emissions for 2025
                actualReductionPercent: categoryActualChange, // Actual % change from baseline
                expectedReductionPercent: cumulativeReductionPercent, // Expected % reduction by 2025
                annualReductionRate: cat.adjustedTargetPercent, // Annual % (e.g., 5.2%)
                progressPercent,
                yearsElapsed,
                targetYear
              };
            });

            setCategoryTargets(enrichedCategories);
            setOverallTargetPercent(4.2); // SBTi 1.5°C target
            enrichedCategories.forEach((cat: any) => {
            });

            // Fetch metric-level targets for expandable view (all energy categories)
            try {
              const energyCategories = [
                'Electricity', 'Purchased Energy', 'Purchased Heating', 'Purchased Cooling', 'Purchased Steam',
                'Natural Gas', 'Heating Oil', 'Diesel', 'Gasoline', 'Propane',
                'Heating', 'Cooling', 'Steam'
              ].join(',');

              const metricTargetsRes = await fetch(
                `/api/sustainability/targets/by-category?organizationId=${organizationId}&targetId=d4a00170-7964-41e2-a61e-3d7b0059cfe5&categories=${encodeURIComponent(energyCategories)}`
              );
              const metricTargetsData = await metricTargetsRes.json();
              if (metricTargetsData.success && metricTargetsData.data) {
                setMetricTargets(metricTargetsData.data);
              }
            } catch (err) {
              console.error('Error fetching metric targets:', err);
            }
          }
        }

      } catch (error) {
        console.error('Error processing energy data:', error);
      }
    };

    processData();
  }, [sources.data, intensity.data, forecast.data, prevYearSources.data, targets.data, organizationId, selectedSite, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }


  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            {t('title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {/* Total Energy */}
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 relative group">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
              {t('cards.totalEnergy.title')}
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
                {(totalEnergy / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.totalEnergy.unit')}</div>
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

      {/* Energy Sources Pie Chart and Monthly Evolution - Side by Side */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Energy Sources Pie Chart */}
        {sourceBreakdown.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm h-[440px]">
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

            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="40%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={0}
                  label={({ cx, cy, midAngle, outerRadius, name, value }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 30;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = ((value / totalEnergy) * 100).toFixed(1);
                    const color = getSourceColor(name);

                    // Determine text anchor - force right side labels to always be 'start'
                    const textAnchor = x > cx ? 'start' : 'end';

                    return (
                      <text
                        x={x}
                        y={y}
                        fill={color}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        style={{ fontSize: '13px' }}
                      >
                        <tspan x={x} dy="0">{name}</tspan>
                        <tspan x={x} dy="14" fontWeight="bold" style={{ fontSize: '14px' }}>{percentage}%</tspan>
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSourceColor(entry.name)} />
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
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.name}</p>
                          <p className="text-sm" style={{ color }}>
                            Consumption: {(data.value / 1000).toFixed(1)} MWh
                          </p>
                          <p className="text-sm" style={{ color }}>
                            Share: {((data.value / totalEnergy) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Emissions: {data.emissions.toFixed(2)} tCO2e
                          </p>
                          {yoyChange !== null && (
                            <p className={`text-sm font-semibold mt-1 ${yoyChange >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              YoY: {yoyChange > 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                            </p>
                          )}
                          {data.renewable && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              Renewable
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
        )}

        {/* Monthly Evolution Chart */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Includes ML forecast for {forecastData.length} remaining months
                {forecastData.length > 0 && forecastData[0].renewableForecast === 0 && (
                  <span className="ml-2 text-amber-500 dark:text-amber-400">
                    (Renewable forecast: 0 MWh - based on historical trend)
                  </span>
                )}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(() => {
                // Combine actual and forecast data
                let combinedData = [...monthlyTrends];

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
                      month: f.month,
                      monthKey: f.monthKey,
                      renewableForecast: f.renewableForecast,
                      fossilForecast: f.fossilForecast,
                      totalForecast: f.totalForecast,
                      forecast: true
                    });
                  });

                }

                return combinedData;
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="month" tick={{ fill: '#888', fontSize: 12 }} />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}`}
                  label={{ value: 'MWh', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
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
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {label}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
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
                <Legend />
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="renewable"
                  stroke={COLORS.renewable}
                  strokeWidth={2}
                  dot={{ fill: COLORS.renewable, r: 3 }}
                  name="Renewable"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="fossil"
                  stroke={COLORS.fossil}
                  strokeWidth={2}
                  dot={{ fill: COLORS.fossil, r: 3 }}
                  name="Fossil"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ fill: '#6366f1', r: 4 }}
                  name="Total"
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
                      name="Renewable"
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
                      name="Fossil"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalForecast"
                      stroke="#6366f1"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: '#6366f1', strokeWidth: 2, r: 4 }}
                      name="Total"
                      connectNulls
                      legendType="none"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Year-over-Year Comparison and Energy Mix Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {monthlyTrends.length > 0 && yoyEnergyChange !== null && (() => {
          return true;
        })() && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm flex flex-col h-[420px]">
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Monthly change vs previous year
              </p>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
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
                      month: trend.month,
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                  label={{ value: 'Change (%)', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
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
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.month}</p>
                          <div className="space-y-1 text-xs mb-2">
                            <p className="text-gray-300">
                              Current: <span className="font-medium text-white">{(current / 1000).toFixed(1)} MWh</span>
                            </p>
                            <p className="text-gray-300">
                              Last Year: <span className="font-medium text-white">{(previous / 1000).toFixed(1)} MWh</span>
                            </p>
                          </div>
                          <p className={`text-sm font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {change > 0 ? '+' : ''}{change.toFixed(1)}% YoY
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {change >= 0 ? 'Increase' : 'Decrease'} in consumption
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="change"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Electricity Grid Mix beside YoY */}
        {energyMixes.length > 0 && energyMixes.map((mix, idx) => {
          // Get title and icon based on energy type
          const getEnergyTypeConfig = (type: string) => {
            switch (type) {
              case 'electricity':
                return { title: t('charts.gridMix.title'), icon: Zap, color: 'text-blue-500' };
              case 'district_heating':
                return { title: 'District Heating Mix', icon: Flame, color: 'text-orange-500' };
              case 'district_cooling':
                return { title: 'District Cooling Mix', icon: Droplets, color: 'text-cyan-500' };
              case 'steam':
                return { title: 'Steam Mix', icon: Factory, color: 'text-purple-500' };
              default:
                return { title: 'Energy Mix', icon: Zap, color: 'text-green-500' };
            }
          };

          const config = getEnergyTypeConfig(mix.energy_type);
          const IconComponent = config.icon;

          return (
            <div key={idx} className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm flex flex-col h-[420px]">
              <div className="mb-4">
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Year {mix.year}
                </p>
              </div>

              {/* Renewable Share with Emission Factors Tooltip */}
              <div className="mb-3 p-3 bg-white dark:bg-gray-800/50 rounded-lg text-center relative group">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('gridMix.renewableEnergy')}</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {mix.renewable_percentage.toFixed(1)}%
                </div>

                {/* Emission Factors Tooltip */}
                {mix.emission_factors && (
                  <>
                    <Info className="w-4 h-4 text-gray-400 absolute top-3 right-3 cursor-help" />
                    <div className="absolute top-full right-0 mt-2 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 w-72">
                      <div className="text-xs font-semibold text-gray-300 mb-2 text-center">
                        {t('emissionFactors.title')}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">{t('emissionFactors.scope2')}</div>
                          <div className="font-bold text-green-400">
                            {mix.emission_factors.carbon_intensity_scope2.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">{t('emissionFactors.direct')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">{t('emissionFactors.scope3')}</div>
                          <div className="font-bold text-orange-400">
                            {mix.emission_factors.carbon_intensity_scope3_cat3.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">{t('emissionFactors.upstream')}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-gray-400 mb-1">{t('emissionFactors.total')}</div>
                          <div className="font-bold text-blue-400">
                            {mix.emission_factors.carbon_intensity_lifecycle.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-500">{t('emissionFactors.lifecycle')}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {mix.sources.length > 0 ? (
                <div className="space-y-1.5 flex-1 overflow-y-auto">
                  {mix.sources.map((source, sourceIdx) => {
                    const percentage = source.percentage !== null && source.percentage !== undefined ? source.percentage : 0;
                    const color = getGridMixColor(source.name);

                    return (
                      <div key={sourceIdx} className="bg-white dark:bg-gray-800/50 rounded-lg p-2">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-gray-900 dark:text-white">{source.name}</span>
                            {source.renewable === true && (
                              <Leaf className="w-2.5 h-2.5 text-green-500" />
                            )}
                            {source.renewable === false && (
                              <Flame className="w-2.5 h-2.5 text-gray-400" />
                            )}
                            {(source.percentage === null || source.percentage === undefined) && (
                              <span className="text-xs text-orange-500 dark:text-orange-400">{t('gridMix.unknown')}</span>
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {source.percentage !== null && source.percentage !== undefined ? `${percentage.toFixed(1)}%` : '?%'}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all duration-300"
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
              ) : (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center">
                  <p className="text-sm text-blue-700 dark:text-blue-400 mb-2">
                    {t('gridMix.detailedBreakdownUnavailable')}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-500">
                    {t('gridMix.applyMigrations')}
                  </p>
                </div>
              )}

              {mix.has_unknown_sources && (
                <div className="mt-3 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <p className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t('gridMix.someSourcesUnknown')}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Monthly Consumption by Source - Stacked Bar Chart */}
      {monthlyTrends.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">Monthly Consumption by Source</h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      Stacked breakdown of monthly energy consumption by source, showing contribution of each energy type to total consumption over time.
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

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={(() => {
                // Transform data to flatten sources
                const transformed = monthlyTrends.map((trend: any) => {
                  const flattened: any = {
                    month: trend.month,
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'MWh', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
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
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
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
                            <p className="text-white font-bold border-t border-gray-600 pt-1 mt-1">
                              Total: {(data.total / 1000).toFixed(1)} MWh
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
                    name={source.name}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Target Progress */}
      {categoryTargets.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1 relative group">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">SBTi Target Progress</h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      Science Based Targets initiative (SBTi) progress tracking for energy-related emissions. Shows annual reduction targets aligned with 1.5°C pathway to limit global warming.
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                1.5°C pathway • {overallTargetPercent}% annual reduction • Baseline 2023
              </p>
            </div>

            <div className="space-y-3">
              {categoryTargets.map((cat: any) => {
                const isExpanded = expandedCategories.has(cat.category);
                const categoryMetrics = metricTargets.filter(m => m.category === cat.category);

                return (
                  <div key={cat.category}>
                    {/* Category Row - Click able to expand */}
                    <div
                      className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1f1f1f] transition-colors"
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
                              {cat.category}
                              {categoryMetrics.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                  {categoryMetrics.length} metrics
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {cat.annualReductionRate.toFixed(1)}% annual • {cat.reason}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
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
                            {cat.progressPercent >= 100 ? 'exceeding' :
                             cat.progressPercent >= 80 ? 'on track' :
                             cat.progressPercent >= 50 ? 'at risk' :
                             'off track'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Baseline:</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {cat.baseline2023FullYear.toFixed(1)} tCO2e
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Target 2025:</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {cat.expectedEmissions2025.toFixed(1)} tCO2e
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Projected:</span>
                          <span className={`ml-1 font-medium ${
                            cat.projected2025FullYear <= cat.expectedEmissions2025
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {cat.projected2025FullYear.toFixed(1)} tCO2e
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                          <div key={metric.id} className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border-l-2 border-purple-400">
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
                                <span className="text-gray-500 dark:text-gray-400">Baseline:</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.baselineEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Target:</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.targetEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Current:</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.currentEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                            </div>

                            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
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
                              Add Initiative
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
