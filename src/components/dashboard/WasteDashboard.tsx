'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Recycle,
  TrendingUp,
  TrendingDown,
  Leaf,
  Package,
  Factory,
  Activity,
  AlertTriangle,
  Info,
  Cloud,
  ChevronDown,
  ChevronRight,
  Plus,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  Settings,
  Target,
  Gauge,
  Building2
} from 'lucide-react';
import { SBTiWasteTarget } from '@/components/sustainability/waste/SBTiWasteTarget';
import { RecommendationsModal } from '@/components/sustainability/RecommendationsModal';
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import { useWasteDashboard, useWasteSiteComparison } from '@/hooks/useDashboardData';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface WasteDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: { start: string; end: string; label: string };
}

interface WasteStream {
  type: string;
  disposal_method: string;
  quantity: number;
  unit: string;
  diverted: boolean;
  emissions: number;
}

// Helper function to format scope labels
const formatScope = (scope: string): string => {
  if (!scope) return '';
  // Convert scope_1 -> Scope 1, scope_2 -> Scope 2, scope_3 -> Scope 3
  return scope.replace(/scope_(\d+)/i, 'Scope $1').replace(/scope(\d+)/i, 'Scope $1');
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

export function WasteDashboard({ organizationId, selectedSite, selectedPeriod }: WasteDashboardProps) {
  const t = useTranslations('sustainability.waste');
  const { t: tGlobal } = useLanguage();

  // UI-only state
  const [activeEducationalModal, setActiveEducationalModal] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  // Fetch data with React Query (cached, parallel)
  const { streams, prevYearStreams, fullPrevYearStreams, forecast, baselineData, baselineYear, targetYear, metricTargets: metricTargetsQuery, isLoading } = useWasteDashboard(
    selectedPeriod || { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], label: 'Custom' },
    selectedSite,
    organizationId
  );

  // Fetch site comparison data (only when no site is selected)
  const siteComparisonQuery = useWasteSiteComparison(
    selectedPeriod || { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], label: 'Custom' },
    selectedSite,
    organizationId
  );

  const siteComparison = siteComparisonQuery.data || [];

  // Compute all dashboard metrics with useMemo (synchronous, single re-render)
  const dashboardMetrics = useMemo(() => {
    if (!streams.data) {
      return {
        wasteStreams: [],
        totalGenerated: 0,
        totalDiverted: 0,
        totalDisposal: 0,
        totalLandfill: 0,
        diversionRate: 0,
        recyclingRate: 0,
        totalEmissions: 0,
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        forecastData: null,
        yoyGeneratedChange: null,
        yoyDiversionChange: null,
        yoyRecyclingChange: null,
        yoyEmissionsChange: null,
        materialBreakdown: [],
        wasteTargetData: null,
        metricTargets: [],
      };
    }

    const data = streams.data;
    const prevData = prevYearStreams.data;
    const wasteForecastData = forecast.data;
    const baseline2023Data = baselineData.data;

    // Process current period data
    const wasteStreams = data.streams || [];
    const totalGenerated = data.total_generated || 0;
    const totalDiverted = data.total_diverted || 0;
    const totalDisposal = data.total_disposal || 0;
    const totalLandfill = data.total_landfill || 0;
    const diversionRate = data.diversion_rate || 0;
    const recyclingRate = data.recycling_rate || 0;
    const totalEmissions = data.total_emissions || 0;

    // Filter monthly trends to only show selected period
    const filteredTrends = (data.monthly_trends || []).filter((trend: any) => {
      if (!selectedPeriod) return true;
      const trendYear = parseInt(trend.monthKey.split('-')[0]);
      const selectedYear = new Date(selectedPeriod.start).getFullYear();
      return trendYear === selectedYear;
    });
    const monthlyTrends = filteredTrends;
    const materialBreakdown = data.material_breakdown || [];

    // Process previous year data for YoY comparison
    let prevYearMonthlyTrends: any[] = [];
    let yoyGeneratedChange: number | null = null;
    let yoyDiversionChange: number | null = null;
    let yoyRecyclingChange: number | null = null;
    let yoyEmissionsChange: number | null = null;

    if (prevData && monthlyTrends.length > 0) {
      if (prevData.monthly_trends && prevData.monthly_trends.length > 0) {
        prevYearMonthlyTrends = prevData.monthly_trends;
      }

      // Calculate YoY changes
      if (prevData.total_generated && prevData.total_generated > 0) {
        yoyGeneratedChange = ((totalGenerated - prevData.total_generated) / prevData.total_generated) * 100;
        yoyDiversionChange = diversionRate - prevData.diversion_rate;
        yoyRecyclingChange = recyclingRate - prevData.recycling_rate;
        yoyEmissionsChange = ((totalEmissions - prevData.total_emissions) / prevData.total_emissions) * 100;
      }
    }

    // Process forecast data
    const forecastData =
      wasteForecastData && wasteForecastData.forecast && wasteForecastData.forecast.length > 0
        ? wasteForecastData
        : null;

    // Calculate projected annual waste generation (YTD + forecasted remaining months)
    let forecastedWaste = 0;
    let projectedAnnualWaste = 0;
    // For YTD YoY: use same period last year
    // For Projected YoY: use FULL previous year (Jan-Dec)
    let previousYearTotalWaste = fullPrevYearStreams?.data?.total_generated || prevData?.total_generated || 0;

    if (forecastData && forecastData.forecast && forecastData.forecast.length > 0) {
      // Calculate forecasted waste from remaining months
      forecastedWaste = forecastData.forecast.reduce((sum: number, f: any) => sum + (f.generated || 0), 0);

      // Projected annual = YTD + forecasted remaining months
      projectedAnnualWaste = totalGenerated + forecastedWaste;
    }

    // Process SBTi baseline data (2023) - only for current year view
    const currentYear = new Date().getFullYear();
    const selectedYear = selectedPeriod ? new Date(selectedPeriod.start).getFullYear() : currentYear;

    const wasteTargetData =
      selectedYear === currentYear && baseline2023Data
        ? {
            baseline2023Emissions: baseline2023Data.total_emissions || 0,
            baseline2023DiversionRate: baseline2023Data.diversion_rate || 0,
          }
        : null;

    // Process metric targets from React Query
    const metricTargets = metricTargetsQuery.data
      ? Array.isArray(metricTargetsQuery.data)
        ? metricTargetsQuery.data
        : metricTargetsQuery.data.data || []
      : [];

    return {
      wasteStreams,
      totalGenerated,
      totalDiverted,
      totalDisposal,
      totalLandfill,
      diversionRate,
      recyclingRate,
      totalEmissions,
      monthlyTrends,
      prevYearMonthlyTrends,
      forecastData,
      yoyGeneratedChange,
      yoyDiversionChange,
      yoyRecyclingChange,
      yoyEmissionsChange,
      materialBreakdown,
      wasteTargetData,
      metricTargets,
      forecastedWaste,
      projectedAnnualWaste,
      previousYearTotalWaste,
    };
  }, [streams.data, prevYearStreams.data, fullPrevYearStreams?.data, forecast.data, baselineData.data, metricTargetsQuery.data, selectedPeriod]);

  // Destructure computed metrics for cleaner code
  const {
    wasteStreams,
    totalGenerated,
    totalDiverted,
    totalDisposal,
    totalLandfill,
    diversionRate,
    recyclingRate,
    totalEmissions,
    monthlyTrends,
    prevYearMonthlyTrends,
    forecastData,
    yoyGeneratedChange,
    yoyDiversionChange,
    yoyRecyclingChange,
    yoyEmissionsChange,
    materialBreakdown,
    wasteTargetData,
    metricTargets,
    forecastedWaste,
    projectedAnnualWaste,
    previousYearTotalWaste,
  } = dashboardMetrics;

  // Check if selected period is current year
  const isCurrentYear = new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear();

  // Smart kg/tonnes unit selection based on total generated waste magnitude
  // Note: totalGenerated is in tonnes from the API
  const threshold = 10; // 10 tonnes
  const useTonnes = totalGenerated >= threshold;

  // Helper function to format waste quantity with smart unit selection
  // Parameter is in tonnes (from API)
  const formatWasteQuantity = (tonnes: number) => {
    if (useTonnes) {
      return {
        value: tonnes.toFixed(1),
        unit: t('cards.generated.unit'), // 'tonnes' or 'tons'
        yAxisLabel: `${t('axisLabels.wasteGeneration')} (${t('axisLabels.tons')})`,
        fullLabel: `${tonnes.toFixed(1)} ${t('axisLabels.tons')}`
      };
    } else {
      return {
        value: (tonnes * 1000).toFixed(0),
        unit: 'kg',
        yAxisLabel: `${t('axisLabels.wasteGeneration')} (kg)`,
        fullLabel: `${(tonnes * 1000).toFixed(0)} kg`
      };
    }
  };

  // Helper functions
  const getDisposalColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'recycling': '#10b981',      // Green - positive/circular
      'composting': '#22c55e',     // Light green - positive/circular
      'incineration': '#f97316',   // Orange - energy recovery
      'incineration_no_recovery': '#f97316', // Orange
      'incineration_recovery': '#fb923c',    // Light orange
      'landfill': '#ef4444',       // Red - worst option
      'hazardous_treatment': '#dc2626', // Dark red - dangerous
      'other': '#92400E'           // Brown - waste category color (design system)
    };
    return colors[method] || colors['other'];
  };

  const formatDisposalMethod = (method: string) => {
    const methodKey = method.replace('incineration_no_recovery', 'incineration')
                            .replace('incineration_recovery', 'wasteToEnergy')
                            .replace('hazardous_treatment', 'hazardousTreatment');

    // Try to get translation, fallback to formatted method name
    try {
      const translationKey = `disposalMethods.${methodKey}`;
      const translated = t(translationKey);
      // If translation returns the key itself (not found), format the method name
      if (translated === translationKey) {
        return method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
      return translated;
    } catch {
      return method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  // Prepare disposal method breakdown (exclude entries with 0 or negligible quantity)
  const disposalBreakdown = wasteStreams.reduce((acc: any[], stream) => {
    const existing = acc.find(s => s.method === stream.disposal_method);
    if (existing) {
      existing.quantity += stream.quantity;
      existing.emissions += stream.emissions;
    } else {
      acc.push({
        method: stream.disposal_method,
        quantity: stream.quantity,
        emissions: stream.emissions,
        diverted: stream.diverted
      });
    }
    return acc;
  }, []).filter(d => d.quantity > 0.01); // Only show disposal methods with meaningful waste (>0.01 tons)

  const totalQuantity = disposalBreakdown.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isCurrentYear ? t('cards.generated.ytdTitle') : t('cards.generated.title')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="relative group inline-block">
                <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                  {formatWasteQuantity(totalGenerated).value}
                </div>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('tooltips.wasteHierarchy')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 306-3
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E5
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatWasteQuantity(totalGenerated).unit}
              </div>
            </div>
            {yoyGeneratedChange !== null && (
              <div className="flex items-center gap-1">
                {yoyGeneratedChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyGeneratedChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyGeneratedChange > 0 ? 'text-red-500' : yoyGeneratedChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyGeneratedChange > 0 ? '+' : ''}{yoyGeneratedChange.toFixed(1)}% {t('yoy')}
                </span>
              </div>
            )}
          </div>
          {projectedAnnualWaste > 0 &&
           forecastedWaste > 0 &&
           isCurrentYear && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-purple-500 dark:text-purple-400">
                {t('cards.generated.projected')}: {formatWasteQuantity(projectedAnnualWaste).value} {formatWasteQuantity(projectedAnnualWaste).unit}
              </span>
              {(() => {
                // Calculate YoY for projected waste: compare projected annual vs previous year's total
                const projectedYoY = previousYearTotalWaste > 0
                  ? ((projectedAnnualWaste - previousYearTotalWaste) / previousYearTotalWaste) * 100
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

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{t('cards.diverted.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="relative group inline-block">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400 cursor-help">
                  {diversionRate.toFixed(1)}
                </div>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('tooltips.circularEconomy')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 306-4/5
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E5
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.diverted.unit')}</div>
            </div>
            {yoyDiversionChange !== null && (
              <div className="flex items-center gap-1">
                {yoyDiversionChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyDiversionChange > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${yoyDiversionChange > 0 ? 'text-green-500' : yoyDiversionChange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {yoyDiversionChange > 0 ? '+' : ''}{yoyDiversionChange.toFixed(1)}pp {t('yoy')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{t('cards.toDisposal.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="relative group inline-block">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 cursor-help">
                  {formatWasteQuantity(totalDisposal).value}
                </div>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('tooltips.disposalDistribution')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 306-5
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E5
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatWasteQuantity(totalDisposal).unit}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.recycling.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="relative group inline-block">
                <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                  {recyclingRate.toFixed(1)}
                </div>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('tooltips.circularEconomy')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 306-4
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E5
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.recycling.unit')}</div>
            </div>
            {yoyRecyclingChange !== null && (
              <div className="flex items-center gap-1">
                {yoyRecyclingChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyRecyclingChange > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${yoyRecyclingChange > 0 ? 'text-green-500' : yoyRecyclingChange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {yoyRecyclingChange > 0 ? '+' : ''}{yoyRecyclingChange.toFixed(1)}pp {t('yoy')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.emissions.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="relative group inline-block">
                <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                  {totalEmissions.toFixed(1)}
                </div>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('tooltips.emissionsTooltip')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 305-3
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E1
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
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
                  {yoyEmissionsChange > 0 ? '+' : ''}{yoyEmissionsChange.toFixed(1)}% {t('yoy')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.intensity.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="relative group inline-block">
                <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                  {totalGenerated > 0 ? (totalEmissions / totalGenerated).toFixed(2) : '0.00'}
                </div>
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                    {t('tooltips.intensityTooltip')}
                  </p>
                  <div className="flex gap-1 mt-3 flex-wrap">
                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                      GRI 306-3
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                      ESRS E5
                    </span>
                  </div>
                  <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.intensity.unit')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disposal Method Distribution, Monthly Trends, Year-over-Year Comparison, and Circular Economy Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Disposal Method Pie Chart */}
        {disposalBreakdown.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 min-h-[480px]">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-500" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.disposalDistribution.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Breakdown of waste by disposal method, showing the proportion sent to each treatment pathway. Prioritize waste hierarchy: reduce, reuse, recycle, recover, then dispose.
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 306-4/5
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                        ESRS E5
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={disposalBreakdown}
                  dataKey="quantity"
                  nameKey="method"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  innerRadius={80}
                  label={(() => {
                    const labelPositions: Array<{ x: number; y: number; angle: number; method: string; value: number }> = [];
                    const MIN_LABEL_SPACING = 45;
                    const SMALL_SEGMENT_THRESHOLD = 5;

                    return ({ cx, cy, midAngle, outerRadius, method, quantity, percent, index }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 30;
                      let x = cx + radius * Math.cos(-midAngle * RADIAN);
                      let y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const percentage = ((quantity / totalQuantity) * 100).toFixed(1);
                      const color = getDisposalColor(method);
                      const formattedName = formatDisposalMethod(method);
                      const textAnchor = x > cx ? 'start' : 'end';
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
                      labelPositions.push({ x, y, angle: midAngle, method, value: quantity });

                      return (
                        <text
                          x={x}
                          y={y}
                          fill={color}
                          textAnchor={textAnchor}
                          dominantBaseline="central"
                          style={{ fontSize: '13px' }}
                        >
                          <tspan x={x} dy="0">{formattedName}</tspan>
                          <tspan x={x} dy="14" fontWeight="bold" style={{ fontSize: '14px' }}>{percentage}%</tspan>
                        </text>
                      );
                    };
                  })()}
                  labelLine={false}
                >
                  {disposalBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDisposalColor(entry.method)} stroke="none" />
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
                      const color = getDisposalColor(data.method);

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{formatDisposalMethod(data.method)}</p>
                          <p className="text-sm" style={{ color }}>
                            {t('charts.disposalDistribution.tooltip.quantity')} {formatWasteQuantity(data.quantity).value} {formatWasteQuantity(data.quantity).unit}
                          </p>
                          <p className="text-sm" style={{ color }}>
                            {t('charts.disposalDistribution.tooltip.share')} {((data.quantity / totalQuantity) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {t('charts.disposalDistribution.tooltip.emissions')} {data.emissions.toFixed(2)} tCO2e
                          </p>
                          {data.diverted && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              {t('charts.disposalDistribution.tooltip.divertedFromDisposal')}
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

        {/* Monthly Waste Trends */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 min-h-[480px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUpIcon className="w-5 h-5 text-purple-500" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.monthlyTrends.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Monthly trends in waste generation, diversion, and emissions with ML-powered forecasting. Monitor progress toward circular economy goals and identify seasonal patterns.
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 306-3/4/5
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                        ESRS E5
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('charts.monthlyTrends.description')}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={(() => {
                // Prepare chart data with separate keys for actual and forecast, translating months
                const actualData = monthlyTrends.map((trend: any) => ({
                  ...trend,
                  month: translateMonth(trend.month, t)
                }));

                if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
                  return actualData;
                }

                // Create forecast months with separate keys
                const forecastMonths = forecastData.forecast.map((f: any) => ({
                  month: translateMonth(f.month, t),
                  generatedForecast: f.generated || 0,
                  divertedForecast: f.diverted || 0,
                  emissionsForecast: f.emissions || 0,
                  forecast: true
                }));

                // Add forecast keys to the last actual data point to create smooth transition
                const modifiedActualData = [...actualData];
                const lastActual = actualData[actualData.length - 1];
                modifiedActualData[modifiedActualData.length - 1] = {
                  ...lastActual,
                  // Add forecast data keys with same values to create transition point
                  generatedForecast: lastActual.generated,
                  divertedForecast: lastActual.diverted,
                  emissionsForecast: lastActual.emissions
                };

                return [...modifiedActualData, ...forecastMonths];
              })()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: formatWasteQuantity(totalGenerated).yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => useTonnes ? value.toFixed(0) : (value * 1000).toFixed(0)}
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
                      const isForecast = data.forecast;

                      // Get values from either actual or forecast keys
                      const generated = data.generated ?? data.generatedForecast;
                      const diverted = data.diverted ?? data.divertedForecast;
                      const emissions = data.emissions ?? data.emissionsForecast;

                      // Skip if all values are null
                      if (!generated && !diverted && !emissions) {
                        return null;
                      }

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.month}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">({t('forecast.label')})</span>}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm" style={{ color: "#92400E" }}>
                              {t('charts.monthlyTrends.tooltip.generated')} {formatWasteQuantity(generated || 0).value} {formatWasteQuantity(generated || 0).unit}
                            </p>
                            <p className="text-sm" style={{ color: "#10b981" }}>
                              {t('charts.monthlyTrends.tooltip.diverted')} {formatWasteQuantity(diverted || 0).value} {formatWasteQuantity(diverted || 0).unit}
                            </p>
                          </div>
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
                  dataKey="generated"
                  stroke="#92400E"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#92400E" }}
                  name={t('charts.monthlyTrends.legends.generated')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="diverted"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#10b981" }}
                  name={t('charts.monthlyTrends.legends.diverted')}
                  connectNulls
                />
                {/* Forecast data - dashed lines (hidden from legend) */}
                {forecastData && forecastData.forecast && forecastData.forecast.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="generatedForecast"
                      stroke="#92400E"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#92400E", strokeWidth: 2, r: 3 }}
                      name={t('charts.monthlyTrends.legends.generated')}
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="divertedForecast"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#10b981", strokeWidth: 2, r: 3 }}
                      name={t('charts.monthlyTrends.legends.diverted')}
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
        {monthlyTrends.length > 0 && yoyGeneratedChange !== null && prevYearMonthlyTrends.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col min-h-[480px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.yoyComparison.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Year-over-year comparison of waste generation showing percentage changes. Track performance improvements and identify trends across reporting periods.
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 306-3
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                        ESRS E5
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('charts.yoyComparison.description')}
              </p>
            </div>

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrends.map((trend: any) => {
                    // Find matching previous year data by month name
                    const prevTrend = prevYearMonthlyTrends.find((prev: any) =>
                      prev.month === trend.month
                    );

                    let change = 0;
                    let previous = 0;

                    if (prevTrend && prevTrend.generated > 0) {
                      previous = prevTrend.generated;
                      change = ((trend.generated - prevTrend.generated) / prevTrend.generated) * 100;
                    }

                    return {
                      month: translateMonth(trend.month, t),
                      monthKey: trend.monthKey,
                      change: change,
                      current: trend.generated,
                      previous: previous
                    };
                  })}
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
                        const { current, previous, change } = data;

                        // Skip if data is incomplete
                        if (current == null || previous == null || change == null) {
                          return null;
                        }

                        return (
                          <div className="bg-[#111111] border border-[#1A1A1A] rounded-lg p-3">
                            <p className="text-white font-semibold mb-2">{data.month}</p>
                            <div className="space-y-1 text-xs mb-2">
                              <p className="text-[#A1A1AA]">
                                {t('charts.yoyComparison.tooltip.current')} <span className="font-medium text-white">{formatWasteQuantity(current).value} {formatWasteQuantity(current).unit}</span>
                              </p>
                              <p className="text-[#A1A1AA]">
                                {t('charts.yoyComparison.tooltip.lastYear')} <span className="font-medium text-white">{formatWasteQuantity(previous).value} {formatWasteQuantity(previous).unit}</span>
                              </p>
                            </div>
                            <p className={`text-sm font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% {t('yoy')}
                            </p>
                            <p className="text-xs text-[#A1A1AA] mt-1">
                              {change >= 0 ? t('charts.yoyComparison.tooltip.increase') : t('charts.yoyComparison.tooltip.decrease')} {t('charts.yoyComparison.tooltip.inWasteGenerated')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="change"
                    fill="#92400E"
                    shape={(props: any) => {
                      const { x, y, width, height, value } = props;
                      const absHeight = Math.abs(height);

                      if (value > 0) {
                        // Positive bar - round top corners only
                        return (
                          <g>
                            <rect x={x} y={y} width={width} height={absHeight} fill="#92400E" rx={4} ry={4} />
                            <rect x={x} y={y + absHeight - 4} width={width} height={4} fill="#92400E" />
                          </g>
                        );
                      } else if (value < 0) {
                        // Negative bar - round bottom corners only, adjust y to start from zero line
                        const adjustedY = y + height; // height is negative, so this moves up to zero line
                        return (
                          <g>
                            <rect x={x} y={adjustedY} width={width} height={absHeight} fill="#92400E" rx={4} ry={4} />
                            <rect x={x} y={adjustedY} width={width} height={4} fill="#92400E" />
                          </g>
                        );
                      } else {
                        return <rect x={x} y={y} width={width} height={absHeight} fill="#92400E" />;
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Circular Economy Metrics */}
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col min-h-[480px]">
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-green-500" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.circularEconomy.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Key circular economy indicators: diversion rate, recycling rate, landfill percentage, and Scope 3 emissions. These metrics track progress toward zero waste and circular business models.
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 306-4/5
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                        ESRS E5
                      </span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded border border-blue-400/30">
                        Circular Economy
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                {/* Diversion Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Recycle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{t('charts.circularEconomy.diversionRate')}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {diversionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${diversionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalDiverted.toFixed(1)} {t('cards.generated.unit')} {t('charts.circularEconomy.divertedFromDisposal')}
                  </p>
                </div>

                {/* Recycling Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{t('charts.circularEconomy.recyclingRate')}</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {recyclingRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${recyclingRate}%` }}
                    />
                  </div>
                </div>

                {/* Landfill Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{t('charts.circularEconomy.toLandfill')}</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {((totalLandfill / totalGenerated) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${(totalLandfill / totalGenerated) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalLandfill.toFixed(1)} {t('cards.generated.unit')} {t('charts.circularEconomy.toLandfillAmount')}
                  </p>
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Monthly Waste by Disposal Method and Site Performance Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Waste Hierarchy Stacked Bar Chart */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.monthlyByMethod.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Monthly breakdown by disposal method following the waste hierarchy. Prioritize reduction at source, then reuse, recycling, recovery, and finally disposal.
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 306-4/5
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                        ESRS E5
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('charts.monthlyByMethod.description')}
              </p>
            </div>

            <ResponsiveContainer width="100%" height={420}>
              <BarChart data={monthlyTrends.map((trend: any) => ({ ...trend, month: translateMonth(trend.month, t) }))}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: formatWasteQuantity(totalGenerated).yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => useTonnes ? value.toFixed(0) : (value * 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [value.toFixed(2) + ' ' + t('axisLabels.tons'), '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="recycled" stackId="waste" fill="#10b981" name={t('charts.monthlyByMethod.legends.recycled')} />
                <Bar dataKey="composted" stackId="waste" fill="#22c55e" name={t('charts.monthlyByMethod.legends.composted')} />
                <Bar dataKey="incinerated" stackId="waste" fill="#f97316" name={t('charts.monthlyByMethod.legends.incinerated')} />
                <Bar dataKey="landfill" stackId="waste" fill="#ef4444" name={t('charts.monthlyByMethod.legends.landfill')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Site Performance Ranking - moved here from below */}
        {siteComparison.length > 1 && (
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
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
                          GRI 306-3
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
                // Benchmark for waste intensity (kg/m²/year)
                const benchmark = { low: 10, average: 20, high: 40 };

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
                            label={{ value: 'kg/m²', position: 'bottom', offset: 10, fill: '#9CA3AF', fontSize: 11 }}
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
                                      {data.intensity} kg/m²
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
                                    {value} kg/m²
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

      {/* SBTi Waste Target Progress - Removed */}
      {false && wasteTargetData && monthlyTrends.length > 0 && metricTargets.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.sbtiProgress.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Science-Based Targets initiative (SBTi) waste reduction progress aligned with 1.5°C pathway. Tracks annual {metricTargets.length > 0 && metricTargets[0].reductionPercent ? metricTargets[0].reductionPercent.toFixed(1) : '3.0'}% reduction in waste-related emissions toward 2030 targets.
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        SBTi
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-400/30">
                        TCFD
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                        ESRS E5
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('charts.sbtiProgress.description')}
              </p>
            </div>

            <div className="space-y-3">
              {/* Group metrics by category (should be "Waste") */}
              {Array.from(new Set(metricTargets.map(mt => mt.category))).map((category) => {
                const isExpanded = expandedCategories.has(category);
                const categoryMetrics = metricTargets.filter(m => m.category === category);

                return (
                  <div key={category}>
                    {/* Category Row - Clickable to expand */}
                    <div
                      className="bg-white dark:bg-[#1A1A1A] rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#212121] transition-colors"
                      onClick={() => {
                        setExpandedCategories(prev => {
                          const next = new Set(prev);
                          if (next.has(category)) {
                            next.delete(category);
                          } else {
                            next.add(category);
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
                              {category}
                              {categoryMetrics.length > 0 && (
                                <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                  {categoryMetrics.length} {t('charts.sbtiProgress.metrics')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-[#A1A1AA]">
                              {categoryMetrics.length > 0 && categoryMetrics[0].reductionPercent ? `${categoryMetrics[0].reductionPercent.toFixed(1)}% ${t('charts.sbtiProgress.annualReduction')}` : t('charts.sbtiProgress.annualReduction')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {categoryMetrics.length > 0 ? categoryMetrics[0].progress.progressPercent.toFixed(0) : 0}%
                          </div>
                          <div className="text-xs font-medium text-green-600 dark:text-green-400">
                            {t('charts.sbtiProgress.onTrack')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-[#A1A1AA]">{t('charts.sbtiProgress.baseline')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {wasteTargetData.baseline2023Emissions.toFixed(1)} {t('cards.emissions.unit')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-[#A1A1AA]">{t('charts.sbtiProgress.current')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {totalEmissions.toFixed(1)} {t('cards.emissions.unit')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 h-2 bg-gray-200 dark:bg-[#111111] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-green-500"
                          style={{ width: `${Math.min(categoryMetrics.length > 0 ? categoryMetrics[0].progress.progressPercent : 0, 100)}%` }}
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
                                <span className="text-gray-500 dark:text-[#A1A1AA]">{t('charts.sbtiProgress.baseline')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.baselineEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-[#A1A1AA]">{t('charts.sbtiProgress.target')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {metric.targetEmissions?.toFixed(1)} tCO2e
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-[#A1A1AA]">{t('charts.sbtiProgress.current')}</span>
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
                              {t('addInitiative')}
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

      {/* Material Breakdown */}
      {materialBreakdown.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-6">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-5 h-5 text-purple-500" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.materialBreakdown.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Material Insights: Track recycling and diversion rates by specific material types. Historical data (2022-2024) has been split using industry-standard composition ratios. Future data can be entered at the material level for precise tracking.
                    </p>
                    <div className="flex gap-1 mt-3 flex-wrap">
                      <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded border border-green-400/30">
                        GRI 306-3/4/5
                      </span>
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded border border-orange-400/30">
                        ESRS E5
                      </span>
                    </div>
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-purple-900/95" />
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Table View */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t('charts.materialBreakdown.material')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t('charts.materialBreakdown.total')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t('charts.materialBreakdown.recyclingRate')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t('charts.materialBreakdown.diversionRate')}</th>
                    <th className="text-right py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-400">{t('charts.materialBreakdown.toDisposal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {materialBreakdown
                    .filter((m: any) => m.total > 0)
                    .sort((a: any, b: any) => b.total - a.total)
                    .map((material: any) => {
                      const materialRecyclingRate = material.total > 0
                        ? (material.recycled / material.total) * 100
                        : 0;
                      const materialDiversionRate = material.total > 0
                        ? (material.diverted / material.total) * 100
                        : 0;

                      const getMaterialIcon = (materialType: string) => {
                        switch (materialType.toLowerCase()) {
                          case 'paper': return '📄';
                          case 'plastic': return '♻️';
                          case 'metal': return '🔩';
                          case 'glass': return '🍾';
                          case 'organic': return '🌱';
                          case 'food': return '🍎';
                          case 'garden': return '🌿';
                          case 'ewaste': return '💻';
                          case 'hazardous': return '⚠️';
                          default: return '📦';
                        }
                      };

                      return (
                        <tr key={material.material} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/30">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getMaterialIcon(material.material)}</span>
                              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                {t(`materials.${material.material}`) !== `materials.${material.material}` ? t(`materials.${material.material}`) : material.material}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {material.total.toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                              {t('cards.generated.unit')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-blue-500"
                                  style={{ width: `${Math.min(materialRecyclingRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400 w-12 text-right">
                                {materialRecyclingRate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="h-1.5 rounded-full bg-green-500"
                                  style={{ width: `${Math.min(materialDiversionRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-green-600 dark:text-green-400 w-12 text-right">
                                {materialDiversionRate.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`text-sm font-medium ${material.disposal > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400'}`}>
                              {material.disposal.toFixed(1)} {t('cards.generated.unit')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Waste Reduction Target Progress - Only show for current year */}
      {baselineData && baselineData.data &&
       new Date(selectedPeriod?.start || '').getFullYear() === new Date().getFullYear() && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 relative group">
                  <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('wasteProgress.title')}</h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-amber-900/95 to-orange-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-amber-500/30">
                    <div className="mb-2">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        Track progress toward waste reduction and circular economy targets. Aligned with zero waste goals and circular economy principles.
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-amber-500/30">
                      <p className="text-amber-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          Zero Waste
                        </span>
                        <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                          GRI 306-3
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                          Circular Economy
                        </span>
                      </div>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute bottom-full left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-amber-900/95"></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {'Zero Waste & Circular Economy Target'} • {baselineYear} → {targetYear}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                  {(3.0).toFixed(1)}% {t('wasteProgress.reductionTarget')}
                </div>
              </div>
            </div>

            {(() => {
              const baseline = baselineData.data?.total_generated || 0; // tonnes (from API)
              const currentYTD = streams.data?.total_generated || 0; // tonnes (from API)

              // Calculate projected full year waste generation
              let projectedFullYear = 0;
              if (forecast.data?.forecast?.length > 0) {
                const forecastRemaining = forecast.data.forecast.reduce((sum: number, f: any) => {
                  return sum + (f.generated || 0);
                }, 0);
                projectedFullYear = currentYTD + forecastRemaining;
              } else {
                const monthsOfData = streams.data?.monthly_trends?.length || 0;
                projectedFullYear = monthsOfData > 0 ? (currentYTD / monthsOfData) * 12 : 0;
              }

              const current = projectedFullYear;

              // Calculate required waste generation (3% annual reduction)
              const annualReductionRate = 0.03; // 3% per year
              const yearsSinceBaseline = targetYear - baselineYear;
              const requiredGeneration = baseline * Math.pow(1 - annualReductionRate, yearsSinceBaseline);

              // Calculate 2030 target (50% total reduction - zero waste goal)
              const target = baseline * 0.50; // 50% reduction by 2030

              // Calculate required reduction from baseline to required
              const requiredReduction = baseline - requiredGeneration;

              // Calculate gap from required to current
              const gapFromRequired = current - requiredGeneration;

              // Calculate progress
              const targetReduction = baseline - requiredGeneration;
              const actualReduction = baseline - current;
              const progress = targetReduction > 0 ? (actualReduction / targetReduction) * 100 : 0;

              // Determine status
              const isOnTrack = current <= requiredGeneration;
              const statusText = isOnTrack ? t('wasteProgress.onTrackStatus') : t('wasteProgress.atRisk');
              const statusColor = isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';

              // Waterfall chart data
              const waterfallData = [
                {
                  name: `${baselineYear}\n${t('wasteProgress.waterfallChart.baseline')}`,
                  base: 0,
                  value: baseline,
                  total: baseline,
                  label: baseline.toFixed(1) + ' t'
                },
                {
                  name: `${t('wasteProgress.waterfallChart.required')}\n${t('wasteProgress.waterfallChart.reduction')}`,
                  base: requiredGeneration,
                  value: requiredReduction,
                  total: baseline,
                  label: `-(${requiredReduction.toFixed(1)} t)`,
                  isRequiredReduction: true
                },
                {
                  name: `${targetYear}\n${t('wasteProgress.waterfallChart.required')}`,
                  base: 0,
                  value: requiredGeneration,
                  total: requiredGeneration,
                  label: requiredGeneration.toFixed(1) + ' t',
                  isRequired: true
                },
                {
                  name: `${t('wasteProgress.waterfallChart.gap')}\n${t('wasteProgress.waterfallChart.required')}`,
                  base: requiredGeneration,
                  value: Math.max(0, gapFromRequired),
                  total: current,
                  label: gapFromRequired > 0 ? `+(${gapFromRequired.toFixed(1)} t)` : '0',
                  isGap: true
                },
                {
                  name: `${targetYear}\n${t('wasteProgress.waterfallChart.actual')}`,
                  base: 0,
                  value: current,
                  total: current,
                  label: current.toFixed(1) + ' t',
                  isCurrent: true
                },
                {
                  name: `2030\n${t('wasteProgress.waterfallChart.target')}`,
                  base: 0,
                  value: target,
                  total: target,
                  label: target.toFixed(1) + ' t',
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
                          {t('wasteProgress.baseline')} ({baselineYear})
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{baseline.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">tonnes</div>
                    </div>

                    {/* Current */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('wasteProgress.current')} ({new Date().getFullYear()})
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{current.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">tonnes (projected)</div>
                    </div>

                    {/* Required */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-amber-200/50 dark:border-amber-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('wasteProgress.required')} ({targetYear})
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{requiredGeneration.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">tonnes</div>
                    </div>

                    {/* Target */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t('wasteProgress.target')} (2030)
                        </span>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{target.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">tonnes</div>
                    </div>

                    {/* Progress */}
                    <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{t('wasteProgress.progress')}</span>
                      </div>
                      <div className={`text-xl font-bold ${statusColor}`}>{progress.toFixed(0)}%</div>
                      <div className={`text-xs ${statusColor}`}>{statusText}</div>
                      {!isOnTrack && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                          +{gapFromRequired.toFixed(1)} t {t('wasteProgress.aboveRequired')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Waterfall Chart */}
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('wasteProgress.waterfallChart.title')}</h4>
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
                            label={{ value: 'Waste Generated (tonnes)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(31, 41, 55, 0.95)',
                              border: '1px solid rgba(75, 85, 99, 0.3)',
                              borderRadius: '8px',
                              color: '#fff'
                            }}
                            formatter={(value: any, name: any, props: any) => {
                              const item = props.payload;
                              if (item.isRequiredReduction) {
                                return [`${t('wasteProgress.waterfallChart.tooltip.reduction')}: ${value.toFixed(1)} t`, ''];
                              } else if (item.isGap) {
                                return [`${t('wasteProgress.waterfallChart.tooltip.increase')}: ${value.toFixed(1)} t`, ''];
                              } else {
                                return [`${t('wasteProgress.waterfallChart.tooltip.total')}: ${item.total.toFixed(1)} t`, ''];
                              }
                            }}
                          />
                          {/* Invisible base bars */}
                          <Bar dataKey="base" stackId="a" fill="transparent" />
                          {/* Visible value bars with conditional colors */}
                          <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]}>
                            {waterfallData.map((entry, index) => {
                              let color = '#6B7280'; // Default gray for baseline
                              if (entry.isRequiredReduction) color = '#10B981'; // Green for required reduction
                              else if (entry.isRequired) color = '#F59E0B'; // Amber for required target
                              else if (entry.isGap) color = '#EF4444'; // Red for gap
                              else if (entry.isCurrent) color = '#F97316'; // Orange for current actual
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
                  initiative_type: 'waste_reduction',
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
            } catch (error: any) {
              console.error('❌ Error saving waste initiative:', error);
              alert(`Failed to save initiative: ${error.message}`);
            }
          }}
        />
      )}
    </div>
  );
}
