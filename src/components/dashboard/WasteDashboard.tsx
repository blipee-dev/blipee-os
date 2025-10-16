'use client';

import React, { useState } from 'react';
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
  Gauge
} from 'lucide-react';
import { SBTiWasteTarget } from '@/components/sustainability/waste/SBTiWasteTarget';
import { RecommendationsModal } from '@/components/sustainability/RecommendationsModal';
import { useTranslations, useLanguage } from '@/providers/LanguageProvider';
import { useWasteDashboard } from '@/hooks/useDashboardData';
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
  ResponsiveContainer
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

export function WasteDashboard({ organizationId, selectedSite, selectedPeriod }: WasteDashboardProps) {
  const t = useTranslations('sustainability.waste');
  const { t: tGlobal } = useLanguage();
  const [activeEducationalModal, setActiveEducationalModal] = useState<string | null>(null);

  // Fetch data with React Query (cached, parallel)
  const { streams, prevYearStreams, forecast, baseline2023, metricTargets: metricTargetsQuery, isLoading } = useWasteDashboard(
    selectedPeriod || { start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0], label: 'Custom' },
    selectedSite,
    organizationId
  );
  const [wasteStreams, setWasteStreams] = useState<WasteStream[]>([]);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [totalDiverted, setTotalDiverted] = useState(0);
  const [totalDisposal, setTotalDisposal] = useState(0);
  const [totalLandfill, setTotalLandfill] = useState(0);
  const [diversionRate, setDiversionRate] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);

  // YoY comparison state
  const [yoyGeneratedChange, setYoyGeneratedChange] = useState<number | null>(null);
  const [yoyDiversionChange, setYoyDiversionChange] = useState<number | null>(null);
  const [yoyRecyclingChange, setYoyRecyclingChange] = useState<number | null>(null);
  const [yoyEmissionsChange, setYoyEmissionsChange] = useState<number | null>(null);

  // Material breakdown state
  const [materialBreakdown, setMaterialBreakdown] = useState<any[]>([]);

  // SBTi waste target state
  const [wasteTargetData, setWasteTargetData] = useState<{
    baseline2023Emissions: number;
    baseline2023DiversionRate: number;
  } | null>(null);

  // Metric-level targets for expandable view
  const [metricTargets, setMetricTargets] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedMetricForInitiative, setSelectedMetricForInitiative] = useState<string | null>(null);

  // Process cached data from React Query when it changes
  React.useEffect(() => {
    // Wait for data to be fetched
    if (!streams.data) return;

    const data = streams.data;
    const prevData = prevYearStreams.data;
    const wasteForecastData = forecast.data;
    const baseline2023Data = baseline2023.data;

    // Process current period data
    if (data.streams) {
      setWasteStreams(data.streams);
      setTotalGenerated(data.total_generated || 0);
      setTotalDiverted(data.total_diverted || 0);
      setTotalDisposal(data.total_disposal || 0);
      setTotalLandfill(data.total_landfill || 0);
      setDiversionRate(data.diversion_rate || 0);
      setRecyclingRate(data.recycling_rate || 0);
      setTotalEmissions(data.total_emissions || 0);

      // Filter monthly trends to only show selected period
      const filteredTrends = (data.monthly_trends || []).filter((trend: any) => {
        if (!selectedPeriod) return true;
        const trendYear = parseInt(trend.monthKey.split('-')[0]);
        const selectedYear = new Date(selectedPeriod.start).getFullYear();
        return trendYear === selectedYear;
      });
      setMonthlyTrends(filteredTrends);
      setMaterialBreakdown(data.material_breakdown || []);
    }

    // Process previous year data for YoY comparison
    if (prevData && data.monthly_trends && data.monthly_trends.length > 0) {
      if (prevData.monthly_trends && prevData.monthly_trends.length > 0) {
        setPrevYearMonthlyTrends(prevData.monthly_trends);
      } else {
        setPrevYearMonthlyTrends([]);
      }

      // Calculate YoY changes
      if (prevData.total_generated && prevData.total_generated > 0) {
        const generatedChange = ((data.total_generated - prevData.total_generated) / prevData.total_generated) * 100;
        const diversionChange = data.diversion_rate - prevData.diversion_rate;
        const recyclingChange = data.recycling_rate - prevData.recycling_rate;
        const emissionsChange = ((data.total_emissions - prevData.total_emissions) / prevData.total_emissions) * 100;

        setYoyGeneratedChange(generatedChange);
        setYoyDiversionChange(diversionChange);
        setYoyRecyclingChange(recyclingChange);
        setYoyEmissionsChange(emissionsChange);
      }
    } else {
      // Clear YoY data if no previous year data
      setPrevYearMonthlyTrends([]);
      setYoyGeneratedChange(null);
      setYoyDiversionChange(null);
      setYoyRecyclingChange(null);
      setYoyEmissionsChange(null);
    }

    // Process forecast data
    if (wasteForecastData && wasteForecastData.forecast && wasteForecastData.forecast.length > 0) {
      setForecastData(wasteForecastData);
    } else {
      setForecastData(null);
    }

    // Process SBTi baseline data (2023) - only for current year view
    const currentYear = new Date().getFullYear();
    const selectedYear = selectedPeriod ? new Date(selectedPeriod.start).getFullYear() : currentYear;

    if (selectedYear === currentYear && baseline2023Data) {
      setWasteTargetData({
        baseline2023Emissions: baseline2023Data.total_emissions || 0,
        baseline2023DiversionRate: baseline2023Data.diversion_rate || 0,
      });
    } else {
      setWasteTargetData(null);
    }

    // Process metric targets from React Query
    if (metricTargetsQuery.data) {
      setMetricTargets(metricTargetsQuery.data);
    } else {
      setMetricTargets([]);
    }
  }, [streams.data, prevYearStreams.data, forecast.data, baseline2023.data, metricTargetsQuery.data, selectedPeriod]);

  // Helper functions
  const getDisposalColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'recycling': '#10b981',
      'composting': '#22c55e',
      'incineration': '#f97316',
      'incineration_no_recovery': '#f97316',
      'incineration_recovery': '#fb923c',
      'landfill': '#ef4444',
      'hazardous_treatment': '#dc2626',
      'other': '#6b7280'
    };
    return colors[method] || colors['other'];
  };

  const formatDisposalMethod = (method: string) => {
    const labels: { [key: string]: string } = {
      'recycling': 'Recycling',
      'composting': 'Composting',
      'incineration_no_recovery': 'Incineration',
      'incineration_recovery': 'Waste-to-Energy',
      'landfill': 'Landfill',
      'hazardous_treatment': 'Hazardous Treatment',
      'reuse': 'Reuse',
      'other': 'Other'
    };
    return labels[method] || method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  // Prepare disposal method breakdown
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
  }, []);

  const totalQuantity = disposalBreakdown.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div>
      {/* Summary Cards */}
      <div className="grid grid-cols-6 gap-4 mb-6">
        <div className="bg-white dark:bg-[#212121] rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{t('cards.generated.title')}</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="relative group inline-block">
                <div className="text-2xl font-bold text-gray-900 dark:text-white cursor-help">
                  {totalGenerated.toFixed(1)}
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
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.generated.unit')}</div>
            </div>
            {yoyGeneratedChange !== null && (
              <div className="flex items-center gap-1">
                {yoyGeneratedChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyGeneratedChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyGeneratedChange > 0 ? 'text-red-500' : yoyGeneratedChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyGeneratedChange > 0 ? '+' : ''}{yoyGeneratedChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
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
                  {yoyDiversionChange > 0 ? '+' : ''}{yoyDiversionChange.toFixed(1)}pp YoY
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
                  {totalDisposal.toFixed(1)}
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
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('cards.toDisposal.unit')}</div>
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
                  {yoyRecyclingChange > 0 ? '+' : ''}{yoyRecyclingChange.toFixed(1)}pp YoY
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
                    Scope 3 emissions from waste disposal, including landfill methane, incineration CO2, and transportation. Lower emissions indicate better waste management and higher diversion rates.
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
                  {yoyEmissionsChange > 0 ? '+' : ''}{yoyEmissionsChange.toFixed(1)}% YoY
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
                    Emissions intensity per ton of waste generated (tCO2e/t). Lower intensity indicates more efficient waste management and higher diversion to low-emission methods like recycling and composting.
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

      {/* Disposal Method Distribution and Monthly Trends */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Disposal Method Pie Chart */}
        {disposalBreakdown.length > 0 && (
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 h-[440px]">
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

            <ResponsiveContainer width="100%" height={360}>
              <PieChart>
                <Pie
                  data={disposalBreakdown}
                  dataKey="quantity"
                  nameKey="method"
                  cx="40%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={0}
                  label={({ cx, cy, midAngle, outerRadius, method, quantity }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 30;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = ((quantity / totalQuantity) * 100).toFixed(1);
                    const color = getDisposalColor(method);
                    const formattedName = formatDisposalMethod(method);

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
                        <tspan x={x} dy="0">{formattedName}</tspan>
                        <tspan x={x} dy="14" fontWeight="bold" style={{ fontSize: '14px' }}>{percentage}%</tspan>
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {disposalBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDisposalColor(entry.method)} />
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
                            Quantity: {data.quantity.toFixed(2)} tons
                          </p>
                          <p className="text-sm" style={{ color }}>
                            Share: {((data.quantity / totalQuantity) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Emissions: {data.emissions.toFixed(2)} tCO2e
                          </p>
                          {data.diverted && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              Diverted from Disposal
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
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 h-[440px]">
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

            <ResponsiveContainer width="100%" height={340}>
              <LineChart data={(() => {
                // Prepare chart data with separate keys for actual and forecast
                const actualData = monthlyTrends;

                if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
                  return actualData;
                }

                // Create forecast months with separate keys
                const forecastMonths = forecastData.forecast.map((f: any) => ({
                  month: f.month,
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
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'tons', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => value.toFixed(0)}
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
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm" style={{ color: "#6b7280" }}>
                              Generated: {(generated || 0).toFixed(2)} tons
                            </p>
                            <p className="text-sm" style={{ color: "#10b981" }}>
                              Diverted: {(diverted || 0).toFixed(2)} tons
                            </p>
                            <p className="text-sm" style={{ color: "#ef4444" }}>
                              Emissions: {(emissions || 0).toFixed(2)} tCO2e
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
                  stroke="#6b7280"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6b7280" }}
                  name="Generated"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="diverted"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#10b981" }}
                  name="Diverted"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="emissions"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ef4444" }}
                  name="Emissions (tCO2e)"
                  connectNulls
                />
                {/* Forecast data - dashed lines (hidden from legend) */}
                {forecastData && forecastData.forecast && forecastData.forecast.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="generatedForecast"
                      stroke="#6b7280"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#6b7280", strokeWidth: 2, r: 3 }}
                      name="Generated"
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
                      name="Diverted"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="emissionsForecast"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#ef4444", strokeWidth: 2, r: 3 }}
                      name="Emissions (tCO2e)"
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

      {/* Year-over-Year Comparison and Diversion Rate */}
      {monthlyTrends.length > 0 && yoyGeneratedChange !== null && prevYearMonthlyTrends.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col h-[420px]">
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
                      month: trend.month,
                      monthKey: trend.monthKey,
                      change: change,
                      current: trend.generated,
                      previous: previous
                    };
                  })}
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
                                Current: <span className="font-medium text-white">{current.toFixed(1)} tons</span>
                              </p>
                              <p className="text-gray-300">
                                Last Year: <span className="font-medium text-white">{previous.toFixed(1)} tons</span>
                              </p>
                            </div>
                            <p className={`text-sm font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% YoY
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {change >= 0 ? 'Increase' : 'Decrease'} in waste generated
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

          {/* Circular Economy Metrics */}
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4 flex flex-col h-[420px]">
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

                {/* Emissions from Waste */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{t('charts.circularEconomy.scope3Emissions')}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {totalEmissions.toFixed(1)} {t('cards.emissions.unit')}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full bg-gray-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('charts.circularEconomy.category5')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waste Hierarchy Stacked Bar Chart */}
      {monthlyTrends.length > 0 && (
        <div className="mb-6">
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

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'tons', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [value.toFixed(2) + ' tons', '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="recycled" stackId="waste" fill="#10b981" name="Recycled" />
                <Bar dataKey="composted" stackId="waste" fill="#22c55e" name="Composted" />
                <Bar dataKey="incinerated" stackId="waste" fill="#f97316" name="Incinerated" />
                <Bar dataKey="landfill" stackId="waste" fill="#ef4444" name="Landfill" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* SBTi Waste Target Progress - Only for current year */}
      {wasteTargetData && monthlyTrends.length > 0 && metricTargets.length > 0 && (
        <div className="mb-6">
          <div className="bg-white dark:bg-[#212121] rounded-lg p-4">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="relative group inline-block">
                  <h3 className="font-semibold text-gray-900 dark:text-white cursor-help">{t('charts.sbtiProgress.title')}</h3>
                  <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
                    <p className="text-gray-200 text-[11px] leading-relaxed whitespace-pre-line">
                      Science-Based Targets initiative (SBTi) waste reduction progress aligned with 1.5°C pathway. Tracks annual 4.2% reduction in waste-related emissions toward 2030 targets.
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
                                <span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                                  {categoryMetrics.length} metrics
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              4.2% annual • SBTi 1.5°C pathway
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
                          <span className="text-gray-500 dark:text-gray-400">{t('charts.sbtiProgress.baseline')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {wasteTargetData.baseline2023Emissions.toFixed(1)} {t('cards.emissions.unit')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{t('charts.sbtiProgress.current')}</span>
                          <span className="ml-1 text-gray-900 dark:text-white font-medium">
                            {totalEmissions.toFixed(1)} {t('cards.emissions.unit')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                      Waste performance by material type showing recycling and diversion rates. Identify material-specific improvement opportunities and track circular economy progress.
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
                {t('charts.materialBreakdown.description')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <div key={material.material} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getMaterialIcon(material.material)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                              {material.material}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {material.total.toFixed(2)} {t('charts.materialBreakdown.totalAmount')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recycling Rate */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{t('charts.materialBreakdown.recyclingRate')}</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {materialRecyclingRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${Math.min(materialRecyclingRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {material.recycled.toFixed(2)} {t('cards.generated.unit')} {t('charts.materialBreakdown.recycled')}
                        </p>
                      </div>

                      {/* Diversion Rate */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">{t('charts.materialBreakdown.diversionRate')}</span>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            {materialDiversionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-green-500"
                            style={{ width: `${Math.min(materialDiversionRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {material.diverted.toFixed(2)} {t('cards.generated.unit')} {t('charts.materialBreakdown.diverted')}
                        </p>
                      </div>

                      {/* Disposal */}
                      {material.disposal > 0 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t('charts.materialBreakdown.toDisposal')}</span>
                            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                              {material.disposal.toFixed(2)} {t('cards.generated.unit')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  <strong>{t('insights.title')}</strong> {t('insights.description')}
                </div>
              </div>
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
