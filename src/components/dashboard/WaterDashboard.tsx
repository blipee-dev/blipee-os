"use client";

import React, { useState } from "react";
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
  Settings
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
} from "recharts";
import { MetricTargetsCard } from '@/components/sustainability/MetricTargetsCard';
import { RecommendationsModal } from '@/components/sustainability/RecommendationsModal';
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import { useWaterDashboard } from '@/hooks/useDashboardData';

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

export function WaterDashboard({
  organizationId,
  selectedSite,
  selectedPeriod,
}: WaterDashboardProps) {
  const t = useTranslations('sustainability.water');
  const { t: tGlobal } = useLanguage();

  // Fetch data with React Query (cached, parallel)
  const { sources, prevYearSources, forecast, isLoading } = useWaterDashboard(
    selectedPeriod || { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], label: 'Custom' },
    selectedSite,
    organizationId
  );

  // Local state for processed data
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [totalWithdrawal, setTotalWithdrawal] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalDischarge, setTotalDischarge] = useState(0);
  const [totalRecycled, setTotalRecycled] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [waterIntensity, setWaterIntensity] = useState(0);
  const [endUseBreakdown, setEndUseBreakdown] = useState<any[]>([]);
  const [endUseYoY, setEndUseYoY] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);
  const [activeEducationalModal, setActiveEducationalModal] = useState<string | null>(null);

  // YoY comparison state
  const [yoyWithdrawalChange, setYoyWithdrawalChange] = useState<number | null>(null);
  const [yoyConsumptionChange, setYoyConsumptionChange] = useState<number | null>(null);
  const [yoyDischargeChange, setYoyDischargeChange] = useState<number | null>(null);
  const [yoyRecyclingChange, setYoyRecyclingChange] = useState<number | null>(null);

  // Water reduction target state
  const [waterTarget, setWaterTarget] = useState<any>(null);
  const [defaultTargetPercent] = useState(2.5); // CDP Water Security benchmark: 2.5% annual reduction

  // Metric-level targets for expandable view (similar to energy dashboard)
  const [metricTargets, setMetricTargets] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  // Process cached data from React Query when it changes
  React.useEffect(() => {
    // Wait for all data to be fetched
    if (!sources.data) return;

    const data = sources.data;
    const prevData = prevYearSources.data;
    const waterForecastData = forecast.data;

    // Process current period data
    if (data.sources) {
      setWaterSources(data.sources);
      setTotalWithdrawal(data.total_withdrawal || 0);
      setTotalConsumption(data.total_consumption || 0);
      setTotalDischarge(data.total_discharge || 0);
      setTotalRecycled(data.total_recycled || 0);
      setTotalCost(data.total_cost || 0);
      setRecyclingRate(data.recycling_rate || 0);
      setMonthlyTrends(data.monthly_trends || []);
      setWaterIntensity(data.water_intensity || 0);
      setEndUseBreakdown(data.end_use_breakdown || []);
      setEndUseYoY(data.end_use_yoy || []);
    }

    // Process previous year data for YoY comparison
    if (prevData && data.monthly_trends && data.monthly_trends.length > 0) {
      if (prevData.monthly_trends && prevData.monthly_trends.length > 0) {
        setPrevYearMonthlyTrends(prevData.monthly_trends);
      } else {
        setPrevYearMonthlyTrends([]);
      }

      // Calculate YoY changes
      if (prevData.total_withdrawal && prevData.total_withdrawal > 0) {
        const withdrawalChange =
          ((data.total_withdrawal - prevData.total_withdrawal) /
            prevData.total_withdrawal) *
          100;
        const consumptionChange =
          ((data.total_consumption - prevData.total_consumption) /
            prevData.total_consumption) *
          100;
        const dischargeChange =
          ((data.total_discharge - prevData.total_discharge) /
            prevData.total_discharge) *
          100;
        const recyclingChange =
          data.recycling_rate - prevData.recycling_rate;

        setYoyWithdrawalChange(withdrawalChange);
        setYoyConsumptionChange(consumptionChange);
        setYoyDischargeChange(dischargeChange);
        setYoyRecyclingChange(recyclingChange);
      }
    } else {
      // Clear YoY data if no previous year data
      setPrevYearMonthlyTrends([]);
      setYoyWithdrawalChange(null);
      setYoyConsumptionChange(null);
      setYoyDischargeChange(null);
      setYoyRecyclingChange(null);
    }

    // Process forecast data
    if (waterForecastData && waterForecastData.forecast && waterForecastData.forecast.length > 0) {
      setForecastData(waterForecastData);
    } else {
      setForecastData(null);
    }

    // Calculate water reduction target (CDP Water Security benchmark)
    // Only show for current year
    const calculateTarget = async () => {
      const baselineYear = 2023;
      const currentYear = new Date().getFullYear();
      const selectedYear = selectedPeriod ? new Date(selectedPeriod.start).getFullYear() : currentYear;

      // Only calculate target if viewing current year
      if (selectedYear === currentYear) {
        const yearsSinceBaseline = currentYear - baselineYear;

        // For baseline, we need full year 2023 data
        const baseline2023Params = new URLSearchParams({
          start_date: "2023-01-01",
          end_date: "2023-12-31",
        });
        if (selectedSite) {
          baseline2023Params.append("site_id", selectedSite.id);
        }

        try {
          const baseline2023Res = await fetch(
            `/api/water/sources?${baseline2023Params}`,
          );
          const baseline2023Data = await baseline2023Res.json();
          const baseline2023Consumption = baseline2023Data.total_consumption || 0;

          // Calculate target for current year using compound reduction
          const annualReductionRate = defaultTargetPercent / 100; // 2.5% = 0.025
          const targetConsumption =
            baseline2023Consumption *
            Math.pow(1 - annualReductionRate, yearsSinceBaseline);

          // Project full year consumption using YTD actual + forecast
          let projectedFullYear = 0;
          const currentYTD = data.total_consumption || 0;

          if (waterForecastData && waterForecastData.forecast && waterForecastData.forecast.length > 0) {
            // Sum up forecast consumption for remaining months
            const forecastRemaining = waterForecastData.forecast.reduce((sum: number, f: any) => {
              return sum + (f.consumption || 0);
            }, 0);

            projectedFullYear = currentYTD + forecastRemaining;

          } else {
            // Fallback: simple linear projection if no forecast available
            const monthsOfData = data.monthly_trends?.length || 0;
            projectedFullYear = monthsOfData > 0 ? (currentYTD / monthsOfData) * 12 : 0;
          }

          // Calculate progress
          const reductionNeeded = baseline2023Consumption - targetConsumption;
          const reductionAchieved = baseline2023Consumption - projectedFullYear;
          const progressPercent =
            reductionNeeded > 0 ? (reductionAchieved / reductionNeeded) * 100 : 0;

          setWaterTarget({
            baseline: baseline2023Consumption,
            target: targetConsumption,
            projected: projectedFullYear,
            progressPercent,
            annualReductionRate: defaultTargetPercent,
            isDefault: true, // Flag to show it's using CDP default
            targetYear: currentYear,
          });

          // Fetch metric-level targets for expandable view (all water-related categories)
          try {
            const waterCategories = [
              'Water Consumption', 'Water Withdrawal', 'Water Discharge',
              'Water Recycling', 'Water Reuse', 'Rainwater Harvesting',
              'Groundwater', 'Surface Water', 'Municipal Water', 'Wastewater'
            ].join(',');

            const metricTargetsRes = await fetch(
              `/api/sustainability/targets/by-category?organizationId=${organizationId}&targetId=d4a00170-7964-41e2-a61e-3d7b0059cfe5&categories=${encodeURIComponent(waterCategories)}`
            );
            const metricTargetsData = await metricTargetsRes.json();
            if (metricTargetsData.success && metricTargetsData.data) {
              setMetricTargets(metricTargetsData.data);
            }
          } catch (err) {
            console.error('Error fetching water metric targets:', err);
          }
        } catch (error) {
          console.error("Error calculating water target:", error);
        }
      } else {
        // Clear target when viewing past years
        setWaterTarget(null);
        setMetricTargets([]);
      }
    };

    calculateTarget();
  }, [sources.data, prevYearSources.data, forecast.data, selectedSite, selectedPeriod, defaultTargetPercent, organizationId]);

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

  // Prepare data for source breakdown pie chart
  const sourceBreakdown = waterSources.map((source) => ({
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
      {/* Header */}
      <div className="mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Droplet className="w-6 h-6 text-blue-500" />
            {t('title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('subtitle')}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('cards.withdrawal.title')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalWithdrawal / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.withdrawal.unit')}</div>
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
                  {yoyWithdrawalChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-cyan-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('cards.consumption.title')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalConsumption / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.consumption.unit')}</div>
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
                  {yoyConsumptionChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Waves className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('cards.discharge.title')}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(totalDischarge / 1000).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.discharge.unit')}</div>
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
                  {yoyDischargeChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Recycle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
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
                  {yoyRecyclingChange.toFixed(1)}pp YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('cards.intensity.title')}
            </span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {(waterIntensity / 1000).toFixed(3)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('cards.intensity.unit')}
          </div>
        </div>
      </div>

      {/* Water Sources Distribution and Monthly Trends */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Water Sources Distribution Pie Chart */}
        {sourceBreakdown.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 h-[440px]">
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

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => {
                    const percent = (
                      (entry.value / totalWithdrawalForPie) *
                      100
                    ).toFixed(1);
                    const words = entry.name.split(" ");
                    // If name has multiple words, split into 3 lines max
                    if (words.length > 2) {
                      return `${words.slice(0, 2).join(" ")}\n${words.slice(2).join(" ")}\n${percent}%`;
                    } else if (words.length === 2) {
                      return `${words[0]}\n${words[1]}\n${percent}%`;
                    }
                    return `${entry.name}\n${percent}%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: "11px" }}
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getSourceColor(entry.type)}
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
                            {t('tooltips.withdrawal')} {(data.value / 1000).toFixed(2)} ML
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
                            {t('tooltips.discharge')} {(data.discharge / 1000).toFixed(2)} ML
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
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 h-[440px]">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group mb-1">
                <TrendingUpIcon className="w-5 h-5 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                  {t('charts.monthlyBalance.title')}
                </h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
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

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(() => {
                // Prepare chart data with separate keys for actual and forecast
                const actualData = monthlyTrends;

                if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
                  return actualData;
                }

                // Create forecast months with separate keys
                const forecastMonths = forecastData.forecast.map((f: any) => ({
                  month: f.month,
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
                  stroke="rgba(255,255,255,0.1)"
                />
                <XAxis dataKey="month" tick={{ fill: "#888", fontSize: 12 }} />
                <YAxis
                  tick={{ fill: "#888", fontSize: 12 }}
                  label={{
                    value: "ML",
                    angle: -90,
                    position: "insideLeft",
                    style: { fill: "#888", fontSize: 12 },
                  }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
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
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm" style={{ color: "#3b82f6" }}>
                              {t('tooltips.withdrawal')} {((withdrawal || 0) / 1000).toFixed(2)} ML
                            </p>
                            <p className="text-sm" style={{ color: "#06b6d4" }}>
                              {t('tooltips.discharge')} {((discharge || 0) / 1000).toFixed(2)} ML
                            </p>
                            <p className="text-sm" style={{ color: "#6366f1" }}>
                              {t('tooltips.consumption')} {((consumption || 0) / 1000).toFixed(2)} ML
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Monthly YoY Comparison - only show when we have previous year data */}
          {yoyWithdrawalChange !== null && prevYearMonthlyTrends.length > 0 && (
            <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col h-[420px]">
              <div className="mb-4">
                <div className="flex items-center gap-2 relative group mb-1">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                    {t('charts.yoyComparison.title')}
                  </h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
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

              <ResponsiveContainer width="100%" height={350}>
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
                        month: trend.month,
                        monthKey: trend.monthKey,
                        change: change,
                        current: currentConsumption,
                        previous: previousConsumption,
                      };
                    });

                    return chartData;
                  })()}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#888", fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 12 }}
                    tickFormatter={(value) =>
                      `${value > 0 ? "+" : ""}${value}%`
                    }
                    label={{
                      value: "Change (%)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#888", fontSize: 12 },
                    }}
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
                        const change = data.change;
                        const current = data.current;
                        const previous = data.previous;
                        return (
                          <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                            <p className="text-white font-semibold mb-2">
                              {data.month}
                            </p>
                            <div className="space-y-1 text-xs mb-2">
                              <p className="text-gray-300">
                                {t('tooltips.current')}{" "}
                                <span className="font-medium text-white">
                                  {(current / 1000).toFixed(2)} ML
                                </span>
                              </p>
                              <p className="text-gray-300">
                                {t('tooltips.lastYear')}{" "}
                                <span className="font-medium text-white">
                                  {(previous / 1000).toFixed(2)} ML
                                </span>
                              </p>
                            </div>
                            <p
                              className={`text-sm font-bold ${change >= 0 ? "text-red-400" : "text-green-400"}`}
                            >
                              {change > 0 ? "+" : ""}
                              {change.toFixed(1)}% YoY
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {change >= 0 ? t('tooltips.increase') : t('tooltips.decrease')} {t('tooltips.inConsumption')}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="change" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Water Balance Summary */}
          {waterSources.length > 0 && (
            <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col h-[420px]">
              <div className="mb-4">
                <div className="flex items-center gap-2 relative group">
                  <Activity className="w-5 h-5 text-cyan-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                    {t('charts.balanceSummary.title')}
                  </h3>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
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
                        {(totalWithdrawal / 1000).toFixed(1)} ML
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
                        {(totalDischarge / 1000).toFixed(1)} ML
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
                        {(totalConsumption / 1000).toFixed(1)} ML
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
                        {(totalRecycled / 1000).toFixed(1)} ML (
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

      {/* Water Reduction Target */}
      {waterTarget && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group mb-1">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">
                  {t('charts.reductionTarget.title')}
                </h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                  <div className="mb-2">
                    <p className="text-gray-200 text-[11px] leading-relaxed">
                      {t('waterReductionTargetExplanation')}
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
                        CDP Water
                      </span>
                      <span className="px-1.5 py-0.5 bg-cyan-100/20 text-cyan-300 text-[9px] rounded border border-cyan-500/30">
                        ESRS E3
                      </span>
                    </div>
                  </div>

                  {/* Learn More Link */}
                  <div className="mt-3 text-right">
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
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {waterTarget.isDefault ? t('target.cdpBenchmark') : t('target.custom')} •{" "}
                {waterTarget.annualReductionRate}% {t('target.annualReduction')} • {t('target.baseline')}
                2023
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {t('target.waterConsumption')}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {waterTarget.isDefault
                      ? t('target.cdpDescription')
                      : t('target.customDescription', { rate: waterTarget.annualReductionRate })}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold ${
                      waterTarget.progressPercent >= 100
                        ? "text-green-600 dark:text-green-400"
                        : waterTarget.progressPercent >= 80
                          ? "text-blue-600 dark:text-blue-400"
                          : waterTarget.progressPercent >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {waterTarget.progressPercent.toFixed(0)}%
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      waterTarget.progressPercent >= 100
                        ? "text-green-600 dark:text-green-400"
                        : waterTarget.progressPercent >= 80
                          ? "text-blue-600 dark:text-blue-400"
                          : waterTarget.progressPercent >= 50
                            ? "text-yellow-600 dark:text-yellow-400"
                            : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {waterTarget.progressPercent >= 100
                      ? t('target.status.exceeding')
                      : waterTarget.progressPercent >= 80
                        ? t('target.status.onTrack')
                        : waterTarget.progressPercent >= 50
                          ? t('target.status.atRisk')
                          : t('target.status.offTrack')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {t('target.columns.baseline')}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">2023</div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {(waterTarget.baseline / 1000).toFixed(2)} ML
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">{t('target.columns.target')}</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {waterTarget.targetYear}
                  </div>
                  <div className="text-gray-900 dark:text-white font-medium">
                    {(waterTarget.target / 1000).toFixed(2)} ML
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {t('target.columns.projected')}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {waterTarget.targetYear}
                  </div>
                  <div
                    className={`font-medium ${
                      waterTarget.projected <= waterTarget.target
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {(waterTarget.projected / 1000).toFixed(2)} ML
                  </div>
                </div>
              </div>

              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    waterTarget.progressPercent >= 100
                      ? "bg-green-500"
                      : waterTarget.progressPercent >= 80
                        ? "bg-blue-500"
                        : waterTarget.progressPercent >= 50
                          ? "bg-yellow-500"
                          : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(Math.max(waterTarget.progressPercent, 0), 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Water Metric Targets - Expandable View with Initiatives */}
      {metricTargets.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 relative group mb-1">
                <Settings className="w-5 h-5 text-blue-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.initiatives.title')}</h3>

                {/* Hover Tooltip */}
                <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
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
              {Array.from(new Set(metricTargets.map(m => m.category))).map((category) => {
                const isExpanded = expandedCategories.has(category);
                const categoryMetrics = metricTargets.filter(m => m.category === category);

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

                            <div className="grid grid-cols-3 gap-2 text-xs mb-2">
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
          metricTarget={metricTargets.find(mt => mt.id === selectedMetricForInitiative)}
          onSave={async (initiative) => {
            try {

              const selectedMetric = metricTargets.find(mt => mt.id === selectedMetricForInitiative);
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
