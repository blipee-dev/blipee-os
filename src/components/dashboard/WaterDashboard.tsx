"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Droplet,
  TrendingUp,
  TrendingDown,
  Cloud,
  Waves,
  Home,
  Recycle,
  DollarSign,
  Activity,
  Gauge,
  Info,
  ChevronDown,
  ChevronRight,
  Plus,
  PieChart as PieChartIcon,
  TrendingUp as TrendingUpIcon,
  BarChart3,
  Target,
  Settings,
  AlertTriangle,
  Building2
} from "lucide-react";
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
  ReferenceLine,
} from "recharts";
import { MetricTargetsCard } from '@/components/sustainability/MetricTargetsCard';
import { RecommendationsModal } from '@/components/sustainability/RecommendationsModal';
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import {
  useWaterDashboardAdapter as useWaterDashboard,
  useWaterSiteComparisonAdapter as useWaterSiteComparison,
} from '@/hooks/useConsolidatedDashboard';

interface WaterDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: { start: string; end: string; label: string };
}

interface WaterSource {
  name: string;
  type: string;
  withdrawal: number;
  discharge: number;
  cost: number;
  isRecycled: boolean;
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

export function WaterDashboard({
  organizationId,
  selectedSite,
  selectedPeriod,
}: WaterDashboardProps) {
  const t = useTranslations('sustainability.water');
  const { t: tGlobal } = useLanguage();

  // Fetch data with React Query (cached, parallel) - includes waterTarget and metricTargets
  const { sources, prevYearSources, fullPrevYearSources, forecast, waterTarget, metricTargets, isLoading } = useWaterDashboard(
    selectedPeriod || { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], label: 'Custom' },
    selectedSite,
    organizationId
  );

  // Fetch site comparison data (only when no site is selected)
  const siteComparisonQuery = useWaterSiteComparison(
    selectedPeriod || { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], label: 'Custom' },
    selectedSite,
    organizationId
  );

  const siteComparison = siteComparisonQuery.data || [];

  // UI-only state (modal and expansion)
  const [activeEducationalModal, setActiveEducationalModal] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  // Compute all dashboard metrics with useMemo (synchronous, single re-render)
  const dashboardMetrics = useMemo(() => {
    if (!sources.data) {
      return {
        waterSources: [],
        totalWithdrawal: 0,
        totalConsumption: 0,
        totalDischarge: 0,
        totalRecycled: 0,
        totalCost: 0,
        recyclingRate: 0,
        monthlyTrends: [],
        prevYearMonthlyTrends: [],
        waterIntensity: 0,
        endUseBreakdown: [],
        endUseYoY: [],
        forecastData: null,
        yoyWithdrawalChange: null,
        yoyConsumptionChange: null,
        yoyDischargeChange: null,
        yoyRecyclingChange: null,
      };
    }

    const data = sources.data;
    const prevData = prevYearSources.data;
    const waterForecastData = forecast.data;

    // Process current period data
    const waterSources = data.sources || [];
    const totalWithdrawal = data.total_withdrawal || 0;
    const totalConsumption = data.total_consumption || 0;
    const totalDischarge = data.total_discharge || 0;
    const totalRecycled = data.total_recycled || 0;
    const totalCost = data.total_cost || 0;
    const recyclingRate = data.recycling_rate || 0;
    const monthlyTrends = data.monthly_trends || [];
    const waterIntensity = data.waterIntensity || 0; // ✅ FIXED: Use camelCase from API
    const endUseBreakdown = data.end_use_breakdown || [];
    const endUseYoY = data.end_use_yoy || [];

    // Process previous year data for YoY comparison
    let prevYearMonthlyTrends: any[] = [];
    let yoyWithdrawalChange: number | null = null;
    let yoyConsumptionChange: number | null = null;
    let yoyDischargeChange: number | null = null;
    let yoyRecyclingChange: number | null = null;

    if (prevData && monthlyTrends.length > 0) {
      if (prevData.monthly_trends && prevData.monthly_trends.length > 0) {
        prevYearMonthlyTrends = prevData.monthly_trends;
      }

      // Calculate YoY changes
      if (prevData.total_withdrawal && prevData.total_withdrawal > 0) {
        yoyWithdrawalChange =
          ((totalWithdrawal - prevData.total_withdrawal) / prevData.total_withdrawal) * 100;
        yoyConsumptionChange =
          ((totalConsumption - prevData.total_consumption) / prevData.total_consumption) * 100;
        yoyDischargeChange =
          ((totalDischarge - prevData.total_discharge) / prevData.total_discharge) * 100;
        yoyRecyclingChange = recyclingRate - prevData.recycling_rate;
      }
    }

    // Process forecast data
    const forecastData =
      waterForecastData && waterForecastData.forecast && waterForecastData.forecast.length > 0
        ? waterForecastData
        : null;

    // Calculate projected annual withdrawal (YTD + forecasted remaining months)
    let forecastedWithdrawal = 0;
    let projectedAnnualWithdrawal = 0;
    // For YTD YoY: use same period last year
    // For Projected YoY: use FULL previous year (Jan-Dec)
    let previousYearTotalWithdrawal = fullPrevYearSources?.data?.total_withdrawal || prevData?.total_withdrawal || 0;

    if (forecastData && forecastData.forecast && forecastData.forecast.length > 0) {
      // Calculate forecasted withdrawal from remaining months
      forecastedWithdrawal = forecastData.forecast.reduce((sum: number, f: any) => sum + (f.withdrawal || 0), 0);

      // Projected annual = YTD + forecasted remaining months
      projectedAnnualWithdrawal = totalWithdrawal + forecastedWithdrawal;
    }

    return {
      waterSources,
      totalWithdrawal,
      totalConsumption,
      totalDischarge,
      totalRecycled,
      totalCost,
      recyclingRate,
      monthlyTrends,
      prevYearMonthlyTrends,
      waterIntensity,
      endUseBreakdown,
      endUseYoY,
      forecastData,
      yoyWithdrawalChange,
      yoyConsumptionChange,
      yoyDischargeChange,
      yoyRecyclingChange,
      forecastedWithdrawal,
      projectedAnnualWithdrawal,
      previousYearTotalWithdrawal,
    };
  }, [sources.data, prevYearSources.data, fullPrevYearSources?.data, forecast.data]);

  // Destructure computed metrics for cleaner code
  const {
    waterSources,
    totalWithdrawal,
    totalConsumption,
    totalDischarge,
    totalRecycled,
    totalCost,
    recyclingRate,
    monthlyTrends,
    prevYearMonthlyTrends,
    waterIntensity,
    endUseBreakdown,
    endUseYoY,
    forecastData,
    yoyWithdrawalChange,
    yoyConsumptionChange,
    yoyDischargeChange,
    yoyRecyclingChange,
    forecastedWithdrawal,
    projectedAnnualWithdrawal,
    previousYearTotalWithdrawal,
  } = dashboardMetrics;

  // Check if selected period is current year
  const isCurrentYear = new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear();

  // Always use m³ as the standard unit (no kL/ML conversion)
  const threshold = 10000; // 10,000 m³
  const useKL = totalWithdrawal < threshold; // Keep for legacy intensity calculations

  // Helper function to format water volume - ALWAYS use m³
  const formatWaterVolume = (m3: number) => {
    return {
      value: m3.toFixed(0),
      unit: 'm³',
      yAxisLabel: 'Water Volume (m³)',
      fullLabel: `${m3.toFixed(0)} m³`
    };
  };

  // Show loading spinner while fetching data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const getSourceColor = (type: string) => {
    const colors: { [key: string]: string } = {
      municipal: "#3b82f6",
      groundwater: "#06b6d4",
      surface_water: "#0ea5e9",
      rainwater: "#60a5fa",
      recycled: "#10b981",
      seawater: "#0284c7",
      wastewater: "#6b7280",
      other: "#94a3b8",
      // End-use colors
      toilet: "#8b5cf6",
      kitchen: "#f59e0b",
      cleaning: "#06b6d4",
      irrigation: "#10b981",
      other_use: "#6366f1",
    };
    return colors[type] || colors["other"];
  };

  // Prepare data for source breakdown pie chart - filter out sources with 0 withdrawal
  const sourceBreakdown = waterSources
    .filter((source) => source.withdrawal > 0)
    .map((source) => ({
      name: source.name,
      value: source.withdrawal,
      type: source.type,
      discharge: source.discharge,
      isRecycled: source.isRecycled,
    }));

  const totalWithdrawalForPie = sourceBreakdown.reduce(
    (sum, s) => sum + s.value,
    0,
  );

  return (
    <div>
      {/* Summary Cards */}
      <section
        aria-labelledby="executive-summary-heading"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
      >
        <h2 id="executive-summary-heading" className="sr-only">Executive Summary</h2>

        <article
          className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm"
          aria-labelledby="water-withdrawal-title"
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-5 h-5 text-blue-500" aria-hidden="true" />
            <span
              id="water-withdrawal-title"
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {isCurrentYear ? t('cards.withdrawal.ytdTitle') : t('cards.withdrawal.title')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatWaterVolume(totalWithdrawal).value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatWaterVolume(totalWithdrawal).unit}
              </div>
            </div>
            {yoyWithdrawalChange !== null && (
              <div className="flex items-center gap-1">
                {yoyWithdrawalChange >= 0 ? (
                  <TrendingUp
                    className={`w-3 h-3 ${yoyWithdrawalChange > 0 ? "text-red-500" : "text-gray-400"}`}
                  />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-xs ${yoyWithdrawalChange > 0 ? "text-red-500" : yoyWithdrawalChange < 0 ? "text-green-500" : "text-gray-400"}`}
                >
                  {yoyWithdrawalChange > 0 ? "+" : ""}
                  {yoyWithdrawalChange.toFixed(1)}% {t('yoy')}
                </span>
              </div>
            )}
          </div>
          {projectedAnnualWithdrawal > 0 &&
           forecastedWithdrawal > 0 &&
           isCurrentYear && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-purple-500 dark:text-purple-400">
                {t('cards.withdrawal.projected')}: {formatWaterVolume(projectedAnnualWithdrawal).value} {formatWaterVolume(projectedAnnualWithdrawal).unit}
              </span>
              {(() => {
                // Calculate YoY for projected withdrawal: compare projected annual vs previous year's total
                const projectedYoY = previousYearTotalWithdrawal > 0
                  ? ((projectedAnnualWithdrawal - previousYearTotalWithdrawal) / previousYearTotalWithdrawal) * 100
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
        </article>

        <article
          className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm"
          aria-labelledby="water-consumption-title"
        >
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-cyan-500" aria-hidden="true" />
            <span
              id="water-consumption-title"
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {t('cards.consumption.title')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatWaterVolume(totalConsumption).value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatWaterVolume(totalConsumption).unit}
              </div>
            </div>
            {yoyConsumptionChange !== null && (
              <div className="flex items-center gap-1">
                {yoyConsumptionChange >= 0 ? (
                  <TrendingUp
                    className={`w-3 h-3 ${yoyConsumptionChange > 0 ? "text-red-500" : "text-gray-400"}`}
                  />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-xs ${yoyConsumptionChange > 0 ? "text-red-500" : yoyConsumptionChange < 0 ? "text-green-500" : "text-gray-400"}`}
                >
                  {yoyConsumptionChange > 0 ? "+" : ""}
                  {yoyConsumptionChange.toFixed(1)}% {t('yoy')}
                </span>
              </div>
            )}
          </div>
        </article>

        <article
          className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm"
          aria-labelledby="water-discharge-title"
        >
          <div className="flex items-center gap-2 mb-2">
            <Waves className="w-5 h-5 text-blue-400" aria-hidden="true" />
            <span
              id="water-discharge-title"
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {t('cards.discharge.title')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatWaterVolume(totalDischarge).value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatWaterVolume(totalDischarge).unit}
              </div>
            </div>
            {yoyDischargeChange !== null && (
              <div className="flex items-center gap-1">
                {yoyDischargeChange >= 0 ? (
                  <TrendingUp
                    className={`w-3 h-3 ${yoyDischargeChange > 0 ? "text-red-500" : "text-gray-400"}`}
                  />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span
                  className={`text-xs ${yoyDischargeChange > 0 ? "text-red-500" : yoyDischargeChange < 0 ? "text-green-500" : "text-gray-400"}`}
                >
                  {yoyDischargeChange > 0 ? "+" : ""}
                  {yoyDischargeChange.toFixed(1)}% {t('yoy')}
                </span>
              </div>
            )}
          </div>
        </article>

        <article
          className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm"
          aria-labelledby="water-recycling-title"
        >
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-5 h-5 text-green-500" aria-hidden="true" />
            <span
              id="water-recycling-title"
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {t('cards.recycling.title')}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {recyclingRate.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {t('cards.recycling.unit')}
            </div>
            {yoyRecyclingChange !== null && (
              <div className="flex items-center gap-1">
                {yoyRecyclingChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span
                  className={`text-xs ${yoyRecyclingChange >= 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {yoyRecyclingChange > 0 ? "+" : ""}
                  {yoyRecyclingChange.toFixed(1)}{t('pp')} {t('yoy')}
                </span>
              </div>
            )}
          </div>
        </article>

        <article
          className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm"
          aria-labelledby="water-intensity-title"
        >
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-5 h-5 text-purple-500" aria-hidden="true" />
            <span
              id="water-intensity-title"
              className="text-sm text-gray-500 dark:text-gray-400"
            >
              {t('cards.intensity.title')}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {waterIntensity.toFixed(3)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            m³/m²
          </div>
        </article>
      </section>

      {/* Water Sources Distribution and Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Water Sources Distribution Pie Chart */}
        {sourceBreakdown.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group">
                <PieChartIcon className="w-5 h-5 text-blue-500" aria-hidden="true" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                  {t('charts.sourcesDistribution.title')}
                </h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-w-[90vw] p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('waterSourcesExplanation')}
                    </p>
                  </div>

                  {/* Compliance Badges */}
                  <div className="mt-3 pt-2 border-t border-purple-500/30">
                    <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                      {tGlobal('carbonEquivalentTooltip.compliantWith')}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                        GRI 303-3
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                        ESRS E3
                      </span>
                    </div>
                  </div>

                  {/* Learn More Link */}
                  <div className="mt-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEducationalModal('water-sources');
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

            <ResponsiveContainer width="100%" height={420}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(() => {
                    const labelPositions: Array<{ x: number; y: number; angle: number; name: string; value: number }> = [];
                    const MIN_LABEL_SPACING = 50; // Increased for multi-line labels
                    const SMALL_SEGMENT_THRESHOLD = 5; // Segments < 5% are considered small

                    const CustomPieLabel = ({ cx, cy, midAngle, outerRadius, name, value, percent, index }: any) => {
                      const RADIAN = Math.PI / 180;
                      const radius = outerRadius + 30;
                      let x = cx + radius * Math.cos(-midAngle * RADIAN);
                      let y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const percentage = ((value / totalWithdrawalForPie) * 100).toFixed(1);
                      const color = getSourceColor(sourceBreakdown.find(s => s.name === name)?.type || '');
                      const textAnchor = x > cx ? 'start' : 'end';
                      const isSmallSegment = percent < (SMALL_SEGMENT_THRESHOLD / 100);

                      // Split name into words and wrap into max 3 lines
                      const words = name.split(' ');
                      let lines: string[] = [];

                      if (words.length <= 2) {
                        lines = words;
                      } else if (words.length === 3) {
                        lines = words;
                      } else {
                        const midPoint = Math.ceil(words.length / 2);
                        lines = [
                          words.slice(0, midPoint).join(' '),
                          words.slice(midPoint).join(' ')
                        ];
                      }

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
                        <text x={x} y={y} fill={color} textAnchor={textAnchor} dominantBaseline="central" style={{ fontSize: '12px' }}>
                          {lines.map((line, i) => (
                            <tspan key={i} x={x} dy={i === 0 ? 0 : 13}>{line}</tspan>
                          ))}
                          <tspan x={x} dy="13" fontWeight="bold" style={{ fontSize: '13px' }}>{percentage}%</tspan>
                        </text>
                      );
                    };
                    return CustomPieLabel;
                  })()}
                  outerRadius={130}
                  innerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSourceColor(entry.type)}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = getSourceColor(data.type);

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.name}
                          </p>
                          <p className="text-sm" style={{ color }}>
                            {t('tooltips.withdrawal')} {formatWaterVolume(data.value).value} {formatWaterVolume(data.value).unit}
                          </p>
                          <p className="text-sm" style={{ color }}>
                            {t('tooltips.share')}{" "}
                            {(
                              (data.value / totalWithdrawalForPie) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {t('tooltips.discharge')} {formatWaterVolume(data.discharge).value} {formatWaterVolume(data.discharge).unit}
                          </p>
                          {data.isRecycled && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              {t('tooltips.recycled')}
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

        {/* Monthly Water Balance Trend */}
        {monthlyTrends.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group mb-1">
                <TrendingUpIcon className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                  {t('charts.monthlyBalance.title')}
                </h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-w-[90vw] p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('waterBalanceExplanation')}
                    </p>
                  </div>

                  {/* Compliance Badges */}
                  <div className="mt-3 pt-2 border-t border-purple-500/30">
                    <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                      {tGlobal('carbonEquivalentTooltip.compliantWith')}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                        ESRS E3
                      </span>
                      <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                        TCFD
                      </span>
                    </div>
                  </div>

                  {/* Learn More Link */}
                  <div className="mt-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEducationalModal('water-balance');
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('charts.monthlyBalance.description')}
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
                  withdrawalForecast: f.withdrawal || 0,
                  dischargeForecast: f.discharge || 0,
                  consumptionForecast: f.consumption || 0,
                  forecast: true
                }));

                // Add forecast keys to the last actual data point to create smooth transition
                const modifiedActualData = [...actualData];
                const lastActual = actualData[actualData.length - 1];
                modifiedActualData[modifiedActualData.length - 1] = {
                  ...lastActual,
                  // Add forecast data keys with same values to create transition point
                  withdrawalForecast: lastActual.withdrawal,
                  dischargeForecast: lastActual.discharge,
                  consumptionForecast: lastActual.consumption
                };

                return [...modifiedActualData, ...forecastMonths];
              })()}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-white/10"
                  vertical={true}
                  horizontal={true}
                />
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: formatWaterVolume(totalWithdrawal).yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#888", fontSize: 12 },
                  }}
                  tickFormatter={(value) => useKL ? value.toFixed(0) : (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isForecast = data.forecast;

                      // Get values from either actual or forecast keys
                      const withdrawal = data.withdrawal ?? data.withdrawalForecast;
                      const discharge = data.discharge ?? data.dischargeForecast;
                      const consumption = data.consumption ?? data.consumptionForecast;

                      // Skip if all values are null
                      if (!withdrawal && !discharge && !consumption) {
                        return null;
                      }

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.month}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">({t('forecast.label')})</span>}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm" style={{ color: "#3b82f6" }}>
                              {t('tooltips.withdrawal')} {formatWaterVolume(withdrawal || 0).value} {formatWaterVolume(withdrawal || 0).unit}
                            </p>
                            <p className="text-sm" style={{ color: "#06b6d4" }}>
                              {t('tooltips.discharge')} {formatWaterVolume(discharge || 0).value} {formatWaterVolume(discharge || 0).unit}
                            </p>
                            <p className="text-sm" style={{ color: "#6366f1" }}>
                              {t('tooltips.consumption')} {formatWaterVolume(consumption || 0).value} {formatWaterVolume(consumption || 0).unit}
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="withdrawal"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#3b82f6" }}
                  name={t('legends.withdrawal')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="discharge"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#06b6d4" }}
                  name={t('legends.discharge')}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#6366f1" }}
                  name={t('legends.consumptionTotal')}
                  connectNulls
                />
                {/* Forecast data - dashed lines (hidden from legend) */}
                {forecastData && forecastData.forecast && forecastData.forecast.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="withdrawalForecast"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#3b82f6", strokeWidth: 2, r: 3 }}
                      name={t('legends.withdrawal')}
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="dischargeForecast"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#06b6d4", strokeWidth: 2, r: 3 }}
                      name={t('legends.discharge')}
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="consumptionForecast"
                      stroke="#6366f1"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#6366f1", strokeWidth: 2, r: 4 }}
                      name={t('legends.consumptionTotal')}
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

      {/* Year-over-Year Comparison and Water Balance */}
      {monthlyTrends.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Monthly YoY Comparison - only show when we have previous year data */}
          {yoyWithdrawalChange !== null && prevYearMonthlyTrends.length > 0 && (
            <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 relative group mb-1">
                  <BarChart3 className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                    {t('charts.yoyComparison.title')}
                  </h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-w-[90vw] p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <div className="mb-2">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        {t('yoyComparisonExplanation')}
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          GRI 303-5
                        </span>
                        <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                          TCFD
                        </span>
                      </div>
                    </div>

                    {/* Learn More Link */}
                    <div className="mt-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEducationalModal('water-yoy');
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
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('charts.yoyComparison.description')}
                </p>
              </div>

              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={(() => {
                    // GRI 303-5: Water Consumption YoY comparison
                    const chartData = monthlyTrends.map((trend: any) => {
                      // Extract year from monthKey (format: "2025-01")
                      const currentYear = parseInt(
                        trend.monthKey.split("-")[0],
                      );
                      const monthNum = trend.monthKey.split("-")[1];
                      const prevYearKey = `${currentYear - 1}-${monthNum}`;

                      // Find matching month from previous year by monthKey
                      const prevTrend = prevYearMonthlyTrends.find(
                        (prev: any) =>
                          prev.monthKey === prevYearKey ||
                          prev.month === trend.month,
                      );

                      // Calculate consumption (withdrawal - discharge) for GRI 303-5
                      const currentConsumption =
                        trend.consumption || trend.withdrawal - trend.discharge;
                      const previousConsumption = prevTrend
                        ? prevTrend.consumption ||
                          prevTrend.withdrawal - prevTrend.discharge
                        : 0;

                      // Calculate month-specific YoY change
                      let change = 0;

                      if (previousConsumption > 0) {
                        change =
                          ((currentConsumption - previousConsumption) /
                            previousConsumption) *
                          100;
                      }

                      return {
                        month: translateMonth(trend.month, t),
                        monthKey: trend.monthKey,
                        change: change,
                        current: currentConsumption,
                        previous: previousConsumption,
                      };
                    });

                    return chartData;
                  })()}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-white/10" vertical={true} horizontal={true} />
                  <ReferenceLine y={0} stroke="rgba(156, 163, 175, 0.3)" strokeWidth={1} strokeDasharray="" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#888", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${value > 0 ? "+" : ""}${value}%`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0, 0, 0, 0.8)",
                      border: "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
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
                                {t('tooltips.current')} <span className="font-medium text-white">{formatWaterVolume(current).value} {formatWaterVolume(current).unit}</span>
                              </p>
                              <p className="text-[#A1A1AA]">
                                {t('tooltips.lastYear')} <span className="font-medium text-white">{formatWaterVolume(previous).value} {formatWaterVolume(previous).unit}</span>
                              </p>
                            </div>
                            <p className={`text-sm font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% {t('yoy')}
                            </p>
                            <p className="text-xs text-[#A1A1AA] mt-1">
                              {change >= 0 ? t('tooltips.increase') : t('tooltips.decrease')} {t('tooltips.inConsumption')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="change"
                    fill="#3b82f6"
                    shape={(props: any) => {
                      const { x, y, width, height, value } = props;
                      const absHeight = Math.abs(height);

                      if (value > 0) {
                        // Positive bar - round top corners only
                        return (
                          <g>
                            <rect x={x} y={y} width={width} height={absHeight} fill="#3b82f6" rx={4} ry={4} />
                            <rect x={x} y={y + absHeight - 4} width={width} height={4} fill="#3b82f6" />
                          </g>
                        );
                      } else if (value < 0) {
                        // Negative bar - round bottom corners only, adjust y to start from zero line
                        const adjustedY = y + height; // height is negative, so this moves up to zero line
                        return (
                          <g>
                            <rect x={x} y={adjustedY} width={width} height={absHeight} fill="#3b82f6" rx={4} ry={4} />
                            <rect x={x} y={adjustedY} width={width} height={4} fill="#3b82f6" />
                          </g>
                        );
                      } else {
                        return <rect x={x} y={y} width={width} height={absHeight} fill="#3b82f6" />;
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Water Balance Summary */}
          {waterSources.length > 0 && (
            <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col">
              <div className="mb-4">
                <div className="flex items-center gap-2 relative group">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                    {t('charts.balanceSummary.title')}
                  </h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-w-[90vw] p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <div className="mb-2">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        {t('waterBalanceSummaryExplanation')}
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-2 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          GRI 303-5
                        </span>
                        <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                          ESRS E3
                        </span>
                      </div>
                    </div>

                    {/* Learn More Link */}
                    <div className="mt-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEducationalModal('water-balance-summary');
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

              <div className="flex-1 flex flex-col justify-evenly">
                <div className="space-y-8">
                  {/* Withdrawal */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Droplet className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('balanceSummary.totalWithdrawal')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatWaterVolume(totalWithdrawal).fullLabel}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>

                  {/* Discharge */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Waves className="w-4 h-4 text-cyan-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('balanceSummary.totalDischarge')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatWaterVolume(totalDischarge).fullLabel}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-cyan-500"
                        style={{
                          width: `${(totalDischarge / totalWithdrawal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Consumption */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('balanceSummary.consumption')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatWaterVolume(totalConsumption).fullLabel}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-indigo-500"
                        style={{
                          width: `${(totalConsumption / totalWithdrawal) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Recycled */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Recycle className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {t('balanceSummary.recycledWater')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatWaterVolume(totalRecycled).fullLabel} (
                        {recyclingRate.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${recyclingRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Site Performance Ranking - Moved here, one column only */}
      {siteComparison.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-500" aria-hidden="true" />
                <div className="relative group inline-block">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
                    {t('sitePerformance.title')}
                  </h3>
                  {/* Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-w-[90vw] p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
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
                          GRI 303-1
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
                // Benchmark for water intensity (m³/m²/year)
                const benchmark = { low: 0.5, average: 1.0, high: 2.0 };

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
                            label={{ value: 'm³/m²', position: 'bottom', offset: 10, fill: '#9CA3AF', fontSize: 11 }}
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
                                      {data.intensity} m³/m²
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
                                    {value} m³/m²
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
          {/* Empty space in second column */}
          <div></div>
        </div>
      )}

      {/* Water Reduction Target */}
      {/* CDP Water Security Target Progress - Only show for current year */}
      {waterTarget.data &&
       new Date(selectedPeriod.start).getFullYear() === new Date().getFullYear() && (() => {
        const baseline = waterTarget.data.baseline || 0;

        return (
        <div className="mb-12">
          <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 relative group">
                  <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">{t('cdpProgress.title')}</h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-w-[90vw] p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <div className="mb-2">
                      <p className="text-gray-200 text-[11px] leading-relaxed">
                        {t('waterReductionTargetExplanation')}
                      </p>
                    </div>

                    {/* Compliance Badges */}
                    <div className="mt-3 pt-3 border-t border-purple-500/30">
                      <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                        {tGlobal('carbonEquivalentTooltip.compliantWith')}
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                          CDP Water
                        </span>
                        <span className="px-1.5 py-0.5 bg-green-100/20 text-green-300 text-[9px] rounded border border-green-500/30">
                          GRI 303-5
                        </span>
                        <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                          ESRS E3
                        </span>
                      </div>
                    </div>

                    {/* Learn More Link */}
                    <div className="mt-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveEducationalModal('water-targets');
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
                  {waterTarget.data.isDefault ? 'CDP Water Security Benchmark' : 'Custom Target'} • {waterTarget.data.baselineYear} → {waterTarget.data.targetYear}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                  {(waterTarget.data.annualReductionRate || 0).toFixed(1)}% {t('cdpProgress.reductionTarget')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Baseline */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('cdpProgress.baseline')} ({waterTarget.data.baselineYear})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatWaterVolume(waterTarget.data.baseline).value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{formatWaterVolume(waterTarget.data.baseline).unit}</div>
              </div>

              {/* Current */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-orange-200/50 dark:border-orange-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('cdpProgress.current')} ({new Date().getFullYear()})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {(() => {
                    const currentYTD = totalWithdrawal || 0;
                    let projectedFullYear = 0;
                    if (forecast.data?.forecast?.length > 0) {
                      const forecastRemaining = forecast.data.forecast.reduce((sum: number, f: any) => {
                        return sum + (f.withdrawal || 0);
                      }, 0);
                      projectedFullYear = currentYTD + forecastRemaining;
                    } else {
                      const monthsOfData = sources.data?.monthly_trends?.length || 0;
                      projectedFullYear = monthsOfData > 0 ? (currentYTD / monthsOfData) * 12 : currentYTD;
                    }
                    const projected = projectedFullYear || waterTarget.data.baseline;
                    return formatWaterVolume(projected).value;
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {(() => {
                    const currentYTD = totalWithdrawal || 0;
                    let projectedFullYear = 0;
                    if (forecast.data?.forecast?.length > 0) {
                      const forecastRemaining = forecast.data.forecast.reduce((sum: number, f: any) => {
                        return sum + (f.withdrawal || 0);
                      }, 0);
                      projectedFullYear = currentYTD + forecastRemaining;
                    } else {
                      const monthsOfData = sources.data?.monthly_trends?.length || 0;
                      projectedFullYear = monthsOfData > 0 ? (currentYTD / monthsOfData) * 12 : currentYTD;
                    }
                    const projected = projectedFullYear || waterTarget.data.baseline;
                    return formatWaterVolume(projected).unit;
                  })()}
                  {' (projected)'}
                </div>
              </div>

              {/* Required (Current Year Target) */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('cdpProgress.required')} ({new Date().getFullYear()})
                  </span>
                </div>
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {(() => {
                    const baseline = waterTarget.data.baseline || 0;
                    const target = waterTarget.data.target || 0;
                    const baselineYear = waterTarget.data.baselineYear;
                    const targetYear = waterTarget.data.targetYear;
                    const currentYear = new Date().getFullYear();

                    const yearsElapsed = currentYear - baselineYear;
                    const totalYears = targetYear - baselineYear;
                    const totalReduction = baseline - target;
                    const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                    const requiredConsumption = baseline - requiredReduction;

                    return formatWaterVolume(requiredConsumption).value;
                  })()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('cdpProgress.onTrack')}</div>
              </div>

              {/* Target */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {t('cdpProgress.target')} ({waterTarget.data.targetYear})
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatWaterVolume(waterTarget.data.target).value}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{formatWaterVolume(waterTarget.data.target).unit}</div>
              </div>

              {/* Progress */}
              <div className="bg-gray-50 dark:bg-[#1a1a1a] rounded-lg p-3 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('cdpProgress.progress')}</span>
                </div>
                <div className="text-xl font-bold">
                  {(() => {
                    const baseline = waterTarget.data.baseline || 0;
                    const current = totalWithdrawal || waterTarget.data.baseline;
                    const target = waterTarget.data.target || 0;

                    // Check if consumption increased or decreased
                    if (current > baseline) {
                      // Consumption INCREASED - show as % above baseline
                      const increasePercent = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
                      return (
                        <span className="text-red-600 dark:text-red-400">
                          ↑ {increasePercent.toFixed(1)}%
                        </span>
                      );
                    } else {
                      // Consumption DECREASED - show progress toward target
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
                    const baseline = waterTarget.data.baseline || 0;
                    const current = totalWithdrawal || waterTarget.data.baseline;
                    const baselineYear = waterTarget.data.baselineYear;
                    const currentYear = new Date().getFullYear();
                    const yearsElapsed = currentYear - baselineYear;
                    const annualRate = waterTarget.data.annualReductionRate || 2.5;
                    const requiredReduction = annualRate * yearsElapsed;

                    if (current > baseline) {
                      return t('cdpProgress.aboveBaseline');
                    } else {
                      const actualReduction = baseline > 0 ? ((baseline - current) / baseline) * 100 : 0;
                      const status = actualReduction >= requiredReduction ? t('cdpProgress.onTrackStatus') : t('cdpProgress.atRisk');
                      return status;
                    }
                  })()}
                </div>
              </div>
            </div>

            {/* Waterfall Chart */}
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('cdpProgress.waterfallChart.title')}</h4>
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={(() => {
                      const baseline = waterTarget.data.baseline || 0;
                      const currentYTD = totalWithdrawal || 0;

                      // Calculate projected full year withdrawal
                      let projectedFullYear = 0;
                      if (forecast.data?.forecast?.length > 0) {
                        const forecastRemaining = forecast.data.forecast.reduce((sum: number, f: any) => {
                          return sum + (f.withdrawal || 0);
                        }, 0);
                        projectedFullYear = currentYTD + forecastRemaining;
                      } else {
                        const monthsOfData = sources.data?.monthly_trends?.length || 0;
                        projectedFullYear = monthsOfData > 0 ? (currentYTD / monthsOfData) * 12 : currentYTD;
                      }

                      const current = projectedFullYear || waterTarget.data.baseline;
                      const target = waterTarget.data.target || 0;
                      const baselineYear = waterTarget.data.baselineYear;
                      const currentYear = new Date().getFullYear();
                      const targetYear = waterTarget.data.targetYear;

                      // Calculate the change from baseline to current
                      const changeFromBaseline = current - baseline;

                      // Calculate required consumption for current year (linear trajectory)
                      const yearsElapsed = currentYear - baselineYear;
                      const totalYears = targetYear - baselineYear;
                      const totalReduction = baseline - target;
                      const requiredReduction = (totalReduction * yearsElapsed) / totalYears;
                      const requiredConsumption = baseline - requiredReduction;
                      const gapFromRequired = current - requiredConsumption;

                      // Waterfall data with invisible base bars and visible change bars
                      return [
                        {
                          name: `${baselineYear}\n${t('cdpProgress.waterfallChart.baseline')}`,
                          base: 0,
                          value: baseline,
                          total: baseline,
                          label: formatWaterVolume(baseline).value + ' ' + formatWaterVolume(baseline).unit
                        },
                        {
                          name: `${t('cdpProgress.waterfallChart.required')}\n${t('cdpProgress.waterfallChart.reduction')}`,
                          base: requiredConsumption,
                          value: requiredReduction,
                          total: baseline,
                          label: `-${formatWaterVolume(requiredReduction).value} ${formatWaterVolume(requiredReduction).unit}`,
                          isRequiredReduction: true
                        },
                        {
                          name: `${currentYear}\n${t('cdpProgress.waterfallChart.required')}`,
                          base: 0,
                          value: requiredConsumption,
                          total: requiredConsumption,
                          label: formatWaterVolume(requiredConsumption).value + ' ' + formatWaterVolume(requiredConsumption).unit,
                          isRequired: true
                        },
                        {
                          name: `${t('cdpProgress.waterfallChart.gap')}\n${t('cdpProgress.waterfallChart.required')}`,
                          base: requiredConsumption,
                          value: gapFromRequired,
                          total: current,
                          label: `+${formatWaterVolume(gapFromRequired).value} ${formatWaterVolume(gapFromRequired).unit}`,
                          isGap: true
                        },
                        {
                          name: `${currentYear}\n${t('cdpProgress.waterfallChart.actual')}`,
                          base: 0,
                          value: current,
                          total: current,
                          label: formatWaterVolume(current).value + ' ' + formatWaterVolume(current).unit,
                          isCurrent: true
                        },
                        {
                          name: `${targetYear}\n${t('cdpProgress.waterfallChart.target')}`,
                          base: 0,
                          value: target,
                          total: target,
                          label: formatWaterVolume(target).value + ' ' + formatWaterVolume(target).unit,
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
                      label={{ value: formatWaterVolume(baseline).yAxisLabel, angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
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
                                    {t('cdpProgress.waterfallChart.tooltip.reduction')}: <span className="font-medium">{formatWaterVolume(value).value} {formatWaterVolume(value).unit}</span>
                                  </p>
                                ) : data.label && data.label.includes('+') ? (
                                  <p className="text-red-400">
                                    {t('cdpProgress.waterfallChart.tooltip.increase')}: <span className="font-medium">{formatWaterVolume(value).value} {formatWaterVolume(value).unit}</span>
                                  </p>
                                ) : (
                                  <p className="text-gray-300">
                                    {t('cdpProgress.waterfallChart.tooltip.total')}: <span className="font-medium text-white">{formatWaterVolume(total).value} {formatWaterVolume(total).unit}</span>
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
        );
      })()}

      {/* Water Metric Targets - Expandable View with Initiatives */}
      {metricTargets.data && (metricTargets.data.data || metricTargets.data).length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group mb-1">
                <Settings className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.initiatives.title')}</h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-72 sm:w-80 max-w-[90vw] p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('waterInitiativesExplanation')}
                    </p>
                  </div>

                  {/* Compliance Badges */}
                  <div className="mt-3 pt-2 border-t border-purple-500/30">
                    <p className="text-purple-200 text-[10px] font-medium mb-1.5">
                      {tGlobal('carbonEquivalentTooltip.compliantWith')}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                        GRI 303
                      </span>
                      <span className="px-1.5 py-0.5 bg-blue-100/20 text-blue-300 text-[9px] rounded border border-blue-500/30">
                        CDP Water
                      </span>
                      <span className="px-1.5 py-0.5 bg-purple-100/20 text-purple-300 text-[9px] rounded border border-purple-500/30">
                        ESRS E3
                      </span>
                    </div>
                  </div>

                  {/* Learn More Link */}
                  <div className="mt-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveEducationalModal('water-initiatives');
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('target.initiativesSubtitle')}
              </p>
            </div>

            <div className="space-y-3">
              {/* Group metrics by category */}
              {Array.from(new Set((metricTargets.data.data || metricTargets.data).map(m => m.category))).map((category) => {
                const isExpanded = expandedCategories.has(category);
                const categoryMetrics = (metricTargets.data.data || metricTargets.data).filter(m => m.category === category);

                // Calculate category-level aggregate progress
                const categoryTotalBaseline = categoryMetrics.reduce((sum, m) => sum + (m.baselineEmissions || 0), 0);
                const categoryTotalTarget = categoryMetrics.reduce((sum, m) => sum + (m.targetEmissions || 0), 0);
                const categoryTotalCurrent = categoryMetrics.reduce((sum, m) => sum + (m.currentEmissions || 0), 0);
                const categoryProgress = categoryMetrics.length > 0
                  ? categoryMetrics.reduce((sum, m) => sum + m.progress.progressPercent, 0) / categoryMetrics.length
                  : 0;

                return (
                  <div key={category}>
                    {/* Category Row - Clickable to expand */}
                    <div
                      className="bg-white dark:bg-gray-800/50 rounded-lg p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/70 transition-colors"
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
                                <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">
                                  {categoryMetrics.length} {t('tooltips.metrics')}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {t('target.annualReductionTarget')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${
                            categoryProgress >= 100 ? 'text-green-600 dark:text-green-400' :
                            categoryProgress >= 80 ? 'text-blue-600 dark:text-blue-400' :
                            categoryProgress >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {categoryProgress.toFixed(0)}%
                          </div>
                          <div className={`text-xs font-medium ${
                            categoryProgress >= 100 ? 'text-green-600 dark:text-green-400' :
                            categoryProgress >= 80 ? 'text-blue-600 dark:text-blue-400' :
                            categoryProgress >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {categoryProgress >= 100 ? t('target.status.exceeding') :
                             categoryProgress >= 80 ? t('target.status.onTrack') :
                             categoryProgress >= 50 ? t('target.status.atRisk') :
                             t('target.status.offTrack')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{t('tooltips.baseline')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {categoryTotalBaseline.toFixed(1)} m³
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{t('tooltips.target')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {categoryTotalTarget.toFixed(1)} m³
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{t('tooltips.current')}</span>
                          <span className={`ml-1 font-medium ${
                            categoryTotalCurrent <= categoryTotalTarget
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {categoryTotalCurrent.toFixed(1)} m³
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            categoryProgress >= 100 ? 'bg-green-500' :
                            categoryProgress >= 80 ? 'bg-blue-500' :
                            categoryProgress >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(categoryProgress, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Expanded Metric-level Targets */}
                    {isExpanded && categoryMetrics.length > 0 && (
                      <div className="ml-6 mt-2 space-y-2">
                        {categoryMetrics.map((metric) => (
                          <div key={metric.id} className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-3 border-l-2 border-blue-400">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {metric.metricName}
                                  </span>
                                  <span className="text-xs px-1.5 py-0.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded">
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-2">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">{t('tooltips.baseline')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {(metric.baselineValue || 0).toFixed(1)} m³
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">{t('tooltips.target')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {(metric.targetValue || 0).toFixed(1)} m³
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">{t('tooltips.current')}</span>
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {(metric.currentValue || 0).toFixed(1)} m³
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
                              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded text-blue-300 text-xs font-medium transition-all"
                            >
                              <Plus className="h-3 w-3" />
                              {t('actions.addInitiative')}
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

      {/* Recommendations Modal for Water Initiatives */}
      {selectedMetricForInitiative && (
        <RecommendationsModal
          isOpen={true}
          onClose={() => setSelectedMetricForInitiative(null)}
          organizationId={organizationId}
          metricTarget={(metricTargets.data?.data || metricTargets.data)?.find(mt => mt.id === selectedMetricForInitiative)}
          onSave={async (initiative) => {
            try {

              const selectedMetric = (metricTargets.data?.data || metricTargets.data)?.find(mt => mt.id === selectedMetricForInitiative);
              if (!selectedMetric) {
                throw new Error('Metric target not found');
              }

              // Calculate estimated reduction percentage
              const baselineValue = selectedMetric.baselineValue || selectedMetric.baselineEmissions || 0;
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
                  sustainability_target_id: 'd4a00170-7964-41e2-a61e-3d7b0059cfe5', // Water target ID
                  name: initiative.name,
                  description: initiative.description,
                  initiative_type: 'water_conservation',
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
              console.error('❌ Error saving water initiative:', error);
              alert(`Failed to save initiative: ${error.message}`);
            }
          }}
        />
      )}
    </div>
  );
}
