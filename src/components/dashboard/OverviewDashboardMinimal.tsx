'use client';

/**
 * COMPLETELY REDESIGNED Minimal Dashboard
 * ALL features from OverviewDashboardWithScore but with BOLD Firecrawl aesthetic
 * - Huge numbers (60px+)
 * - No cards, no borders
 * - Massive whitespace (60-80px gaps)
 * - Ultra-light fonts
 * - Single green accent
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSitePerformanceScore, usePortfolioPerformanceScore, useRecalculateScore, useSiteRankings } from '@/hooks/usePerformanceScore';
import { useOverviewDashboard } from '@/hooks/useDashboardData';
import { useTranslations } from '@/providers/LanguageProvider';
import { useUserRole } from '@/hooks/useUserRole';

interface OverviewDashboardMinimalProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function OverviewDashboardMinimal({ organizationId, selectedSite, selectedPeriod }: OverviewDashboardMinimalProps) {
  const t = useTranslations('sustainability.dashboard');
  const tIndex = useTranslations('sustainability.performanceIndex');

  // Determine view type
  const isPortfolioView = React.useMemo(
    () => !selectedSite || selectedSite === 'all',
    [selectedSite]
  );

  const siteId = React.useMemo(
    () => !isPortfolioView ? selectedSite?.id || selectedSite : undefined,
    [isPortfolioView, selectedSite]
  );

  const isCurrentYear = React.useMemo(() => {
    if (!selectedPeriod) return true;
    const currentYear = new Date().getFullYear();
    const periodStart = selectedPeriod.start || '';
    const periodYear = parseInt(periodStart.split('-')[0]);
    return periodYear === currentYear;
  }, [selectedPeriod]);

  // Fetch performance scores
  const { data: siteScore, isLoading: siteScoreLoading, refetch: refetchSiteScore } = useSitePerformanceScore(
    isCurrentYear ? siteId : undefined
  );
  const { data: portfolioScore, isLoading: portfolioScoreLoading, refetch: refetchPortfolioScore } = usePortfolioPerformanceScore(
    isCurrentYear && isPortfolioView ? organizationId : undefined
  );
  const { recalculateSiteScore, recalculatePortfolioScore } = useRecalculateScore();
  const { isSuperAdmin } = useUserRole();
  const { data: siteRankings = [], isLoading: rankingsLoading } = useSiteRankings(organizationId);

  const scoreData = React.useMemo(
    () => isPortfolioView ? portfolioScore : siteScore,
    [isPortfolioView, portfolioScore, siteScore]
  );

  // Fetch dashboard data
  const {
    scopeAnalysis,
    prevYearScopeAnalysis,
    fullPrevYearScopeAnalysis,
    dashboard: dashboardQuery,
    forecast: forecastQuery,
    topMetrics: topMetricsQuery,
    isLoading
  } = useOverviewDashboard(selectedPeriod, selectedSite, organizationId);

  // Process data
  const scopeData = scopeAnalysis.data?.scopeData || scopeAnalysis.data || {};
  const scope1Total = scopeData.scope_1?.total || 0;
  const scope2Total = scopeData.scope_2?.total || 0;
  const scope3Total = scopeData.scope_3?.total || 0;
  const totalEmissions = scope1Total + scope2Total + scope3Total;

  const prevScopeData = prevYearScopeAnalysis.data?.scopeData || prevYearScopeAnalysis.data || {};
  const prevTotal = (prevScopeData.scope_1?.total || 0) + (prevScopeData.scope_2?.total || 0) + (prevScopeData.scope_3?.total || 0);
  const totalYoY = prevTotal > 0 ? ((totalEmissions - prevTotal) / prevTotal) * 100 : 0;

  const employees = 200;
  const intensityMetric = employees > 0 ? totalEmissions / employees : 0;
  const prevIntensity = employees > 0 ? prevTotal / employees : 0;
  const intensityYoY = prevIntensity > 0 ? ((intensityMetric - prevIntensity) / prevIntensity) * 100 : 0;

  const projectedAnnualEmissions = forecastQuery.data?.projectedTotal || 0;
  const fullPrevYearData = fullPrevYearScopeAnalysis.data?.scopeData || fullPrevYearScopeAnalysis.data || {};
  const previousYearTotal = (fullPrevYearData.scope_1?.total || 0) + (fullPrevYearData.scope_2?.total || 0) + (fullPrevYearData.scope_3?.total || 0);
  const projectedYoY = previousYearTotal > 0 ? ((projectedAnnualEmissions - previousYearTotal) / previousYearTotal) * 100 : 0;

  const monthlyData = dashboardQuery.data?.trendData?.map((m: any) => ({
    month: m.month,
    total: m.emissions || 0,
  })) || [];

  const topEmitters = topMetricsQuery.data?.metrics?.slice(0, 8).map((metric: any) => ({
    name: metric.name,
    emissions: metric.emissions,
    percentage: totalEmissions > 0 ? (metric.emissions / totalEmissions) * 100 : 0,
  })) || [];

  // Recalculate handler
  const [isRecalculating, setIsRecalculating] = React.useState(false);
  const handleRecalculate = React.useCallback(async () => {
    setIsRecalculating(true);
    try {
      if (isPortfolioView) {
        await recalculatePortfolioScore(organizationId);
        await refetchPortfolioScore();
      } else if (siteId) {
        await recalculateSiteScore(siteId);
        await refetchSiteScore();
      }
    } catch (error) {
      console.error('Failed to recalculate score:', error);
    } finally {
      setIsRecalculating(false);
    }
  }, [isPortfolioView, organizationId, siteId, recalculatePortfolioScore, refetchPortfolioScore, recalculateSiteScore, refetchSiteScore]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-3">
          <div className="w-2 h-2 bg-green-500 rounded-full mx-auto animate-pulse" />
          <p className="text-sm text-gray-500">Loading</p>
        </div>
      </div>
    );
  }

  const scopePercentages = {
    scope1: totalEmissions > 0 ? (scope1Total / totalEmissions) * 100 : 0,
    scope2: totalEmissions > 0 ? (scope2Total / totalEmissions) * 100 : 0,
    scope3: totalEmissions > 0 ? (scope3Total / totalEmissions) * 100 : 0,
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-20">

      {/* Performance Score - HUGE circular display, no card */}
      {isCurrentYear && scoreData && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-[1fr_2fr_1fr] gap-16 items-start"
        >
          {/* Left: Circular Score */}
          <div className="space-y-6">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
              Performance
            </div>

            {/* HUGE Circular Score - 240px */}
            <div className="relative w-[240px] h-[240px]">
              <svg className="transform -rotate-90 w-[240px] h-[240px]">
                <circle
                  cx="120"
                  cy="120"
                  r="110"
                  stroke="#F3F4F6"
                  strokeWidth="8"
                  fill="none"
                />
                <motion.circle
                  cx="120"
                  cy="120"
                  r="110"
                  stroke="#10B981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 110}
                  strokeDashoffset={2 * Math.PI * 110 - (scoreData.overallScore / 100) * 2 * Math.PI * 110}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 110 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 110 - (scoreData.overallScore / 100) * 2 * Math.PI * 110 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-7xl font-light text-gray-900 tabular-nums">
                  {scoreData.overallScore}
                </div>
                <div className="text-xs text-gray-400 mt-1">out of 100</div>
                <div className="text-5xl font-light text-green-600 mt-2">
                  {scoreData.grade}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {scoreData.improvementVelocity === 'fast' && (
                  <><ArrowUpRight className="w-4 h-4 text-green-600" /> Fast improving</>
                )}
                {scoreData.improvementVelocity === 'steady' && (
                  <><ArrowUpRight className="w-4 h-4 text-blue-600" /> Steady progress</>
                )}
              </div>
              {scoreData.peerPercentile > 0 && (
                <div className="text-sm text-gray-600">
                  Top {100 - scoreData.peerPercentile}% of peers
                </div>
              )}
              <div className="text-xs text-gray-400">
                {scoreData.dataCompleteness}% data • {scoreData.confidenceLevel} confidence
              </div>
            </div>

            {isSuperAdmin && (
              <button
                onClick={handleRecalculate}
                disabled={isRecalculating}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-3 h-3 ${isRecalculating ? 'animate-spin' : ''}`} />
                Recalculate
              </button>
            )}
          </div>

          {/* Middle: Category Scores */}
          <div className="space-y-8">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
              Category Scores
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              {Object.entries(scoreData.categoryScores).map(([category, score]: [string, any]) => (
                <div key={category} className="space-y-3">
                  <div className="text-xs uppercase tracking-wider text-gray-400">
                    {formatCategoryName(category)}
                  </div>
                  {score.dataPoints > 0 ? (
                    <>
                      <div className="flex items-baseline gap-3">
                        <span className="text-5xl font-light text-gray-900 tabular-nums">
                          {score.rawScore}
                        </span>
                        <span className="text-sm text-gray-400">/100</span>
                      </div>
                      <div>
                        {score.trend === 'improving' && (
                          <span className="text-sm text-green-600 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Improving
                          </span>
                        )}
                        {score.trend === 'declining' && (
                          <span className="text-sm text-red-600 flex items-center gap-1">
                            <ArrowDownRight className="w-3 h-3" /> Declining
                          </span>
                        )}
                        {score.trend === 'stable' && (
                          <span className="text-sm text-gray-500">Stable</span>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-gray-400">No data</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Site Rankings */}
          <div className="space-y-8">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium">
              Site Rankings
            </div>

            {siteRankings.slice(0, 5).map((site: any, index: number) => (
              <motion.div
                key={site.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-baseline gap-4"
              >
                <span className="text-2xl font-light text-gray-400 tabular-nums w-8">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 truncate">{site.name}</div>
                  <div className="text-xs text-gray-500">Grade {site.grade}</div>
                </div>
                <span className="text-2xl font-light text-gray-900 tabular-nums">
                  {Math.round(site.score)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Key Metrics - HUGE numbers in grid */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-12">
          Key Metrics
        </div>

        <div className="grid grid-cols-4 gap-16">
          {/* Metric 1: Total Emissions */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-gray-400">
              Total Emissions
            </div>
            <div className="text-7xl font-light text-gray-900 tabular-nums">
              {totalEmissions.toFixed(0)}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">tCO2e</span>
              <div className={`flex items-center gap-1 text-sm ${
                totalYoY < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {totalYoY < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                <span>{Math.abs(totalYoY).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Metric 2: Intensity */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-gray-400">
              Intensity
            </div>
            <div className="text-7xl font-light text-gray-900 tabular-nums">
              {intensityMetric.toFixed(1)}
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">per employee</span>
              <div className={`flex items-center gap-1 text-sm ${
                intensityYoY < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {intensityYoY < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                <span>{Math.abs(intensityYoY).toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Metric 3: Projected (if current year) */}
          {isCurrentYear && projectedAnnualEmissions > 0 && (
            <div className="space-y-4">
              <div className="text-xs uppercase tracking-wider text-gray-400">
                Projected EOY
              </div>
              <div className="text-7xl font-light text-gray-900 tabular-nums">
                {projectedAnnualEmissions.toFixed(0)}
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-sm text-gray-500">tCO2e</span>
                <div className={`flex items-center gap-1 text-sm ${
                  projectedYoY < 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {projectedYoY < 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  <span>{Math.abs(projectedYoY).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Metric 4: Data Quality */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider text-gray-400">
              Data Quality
            </div>
            <div className="text-7xl font-light text-gray-900 tabular-nums">
              94
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">%</span>
              <span className="text-sm text-green-600">Primary</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Emissions Trend Chart - Ultra minimal */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">
            Emissions Trend
          </div>
          <div className="text-sm text-gray-500">
            Monthly emissions over time
          </div>
        </div>

        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid
                strokeDasharray="0"
                stroke="#F3F4F6"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                stroke="#D1D5DB"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#D1D5DB"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
                labelStyle={{ fontSize: '12px', color: '#6B7280' }}
                itemStyle={{ fontSize: '12px', color: '#10B981' }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Scope Breakdown - HUGE percentages */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="mb-12">
          <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">
            Emissions by Scope
          </div>
          <div className="text-sm text-gray-500">
            Breakdown across all three scopes
          </div>
        </div>

        <div className="grid grid-cols-3 gap-16">
          {/* Scope 1 */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <div className="text-6xl font-light text-gray-900 tabular-nums">
                {scopePercentages.scope1.toFixed(0)}
              </div>
              <span className="text-lg text-gray-400">%</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                Scope 1
              </div>
              <div className="text-sm text-gray-600">
                {scope1Total.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Direct emissions
              </div>
            </div>
          </div>

          {/* Scope 2 */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <div className="text-6xl font-light text-gray-900 tabular-nums">
                {scopePercentages.scope2.toFixed(0)}
              </div>
              <span className="text-lg text-gray-400">%</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                Scope 2
              </div>
              <div className="text-sm text-gray-600">
                {scope2Total.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Purchased electricity
              </div>
            </div>
          </div>

          {/* Scope 3 */}
          <div className="space-y-4">
            <div className="flex items-baseline gap-3">
              <div className="text-6xl font-light text-gray-900 tabular-nums">
                {scopePercentages.scope3.toFixed(0)}
              </div>
              <span className="text-lg text-gray-400">%</span>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                Scope 3
              </div>
              <div className="text-sm text-gray-600">
                {scope3Total.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Value chain
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Top Emitters - Clean table */}
      {topEmitters.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="mb-12">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-medium mb-2">
              Top Emission Sources
            </div>
            <div className="text-sm text-gray-500">
              Largest contributors to your carbon footprint
            </div>
          </div>

          <div className="space-y-6">
            {topEmitters.map((source: any, idx: number) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + (idx * 0.05) }}
                className="grid grid-cols-[2fr_1fr_1fr] gap-8 items-baseline border-b border-gray-50 pb-6 last:border-0"
              >
                <div className="text-sm text-gray-900">{source.name}</div>
                <div className="text-right">
                  <span className="text-2xl font-light text-gray-900 tabular-nums">
                    {source.emissions.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">tCO2e</span>
                </div>
                <div className="text-right text-sm text-gray-600 tabular-nums">
                  {source.percentage.toFixed(0)}%
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );
}

// Helper function
function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    scope1: 'Scope 1',
    scope2: 'Scope 2',
    scope3: 'Scope 3',
    energy: 'Energy',
    water: 'Water',
    waste: 'Waste',
    transportation: 'Transportation',
    supplyChain: 'Supply Chain',
    humanExperience: 'Human Experience',
    compliance: 'Compliance',
  };
  return names[category] || category;
}
