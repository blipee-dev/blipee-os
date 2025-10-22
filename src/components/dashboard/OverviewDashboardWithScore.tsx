'use client';

/**
 * Overview Dashboard with Blipee Performance Index™
 *
 * Wraps the existing OverviewDashboard and adds the performance score card
 * at the top for immediate visibility.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, TrendingUp, Award, Layers, Flame, Zap, Globe, Recycle, Droplet, Truck, Users, FileCheck, Link } from 'lucide-react';
import { OverviewDashboard } from './OverviewDashboard';
import {
  PerformanceScoreCard,
  ImprovementVelocityBadge,
  PeerPercentileBadge,
  TrendIcon,
} from '../scoring/PerformanceScoreCard';
import { useSitePerformanceScore, usePortfolioPerformanceScore, useRecalculateScore, useSiteRankings, type SiteRanking } from '@/hooks/usePerformanceScore';
import { useTranslations } from '@/providers/LanguageProvider';
import { useUserRole } from '@/hooks/useUserRole';

interface OverviewDashboardWithScoreProps {
  organizationId: string;
  selectedSite?: any;
  selectedPeriod?: any;
}

const OverviewDashboardWithScoreComponent = ({
  organizationId,
  selectedSite,
  selectedPeriod,
}: OverviewDashboardWithScoreProps) => {
  const t = useTranslations('sustainability.dashboard');
  const tIndex = useTranslations('sustainability.performanceIndex');

  // Determine if we're showing site or portfolio view - memoized
  const isPortfolioView = React.useMemo(
    () => !selectedSite || selectedSite === 'all',
    [selectedSite]
  );

  const siteId = React.useMemo(
    () => !isPortfolioView ? selectedSite?.id || selectedSite : undefined,
    [isPortfolioView, selectedSite]
  );

  // Check if we're viewing the current year
  const isCurrentYear = React.useMemo(() => {
    if (!selectedPeriod) return true; // Default to showing if no period selected

    const currentYear = new Date().getFullYear();
    const periodStart = selectedPeriod.start || '';
    const periodYear = parseInt(periodStart.split('-')[0]);

    return periodYear === currentYear;
  }, [selectedPeriod]);

  // Only fetch scores for current year
  const { data: siteScore, isLoading: siteScoreLoading, refetch: refetchSiteScore, error: siteError } = useSitePerformanceScore(
    isCurrentYear ? siteId : undefined
  );
  const { data: portfolioScore, isLoading: portfolioScoreLoading, refetch: refetchPortfolioScore, error: portfolioError } = usePortfolioPerformanceScore(
    isCurrentYear && isPortfolioView ? organizationId : undefined
  );

  const { recalculateSiteScore, recalculatePortfolioScore } = useRecalculateScore();
  const { isSuperAdmin } = useUserRole();

  // Fetch site rankings
  const { data: siteRankings = [], isLoading: rankingsLoading } = useSiteRankings(organizationId);

  // Memoize derived data
  const scoreData = React.useMemo(
    () => isPortfolioView ? portfolioScore : siteScore,
    [isPortfolioView, portfolioScore, siteScore]
  );

  const isScoreLoading = React.useMemo(
    () => isPortfolioView ? portfolioScoreLoading : siteScoreLoading,
    [isPortfolioView, portfolioScoreLoading, siteScoreLoading]
  );

  // Handle score recalculation
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

  // Auto-calculate on mount if no score exists
  React.useEffect(() => {
    const autoCalculate = async () => {
      if (!scoreData && !isScoreLoading && isCurrentYear) {
        console.log('📊 No score found, auto-calculating...');
        await handleRecalculate();
      }
    };
    autoCalculate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoreData, isScoreLoading, isCurrentYear]);

  // Auto-refresh every 5 minutes
  React.useEffect(() => {
    if (!isCurrentYear) return; // Only auto-refresh for current year

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing performance score...');
      if (isPortfolioView) {
        refetchPortfolioScore();
      } else if (siteId) {
        refetchSiteScore();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isCurrentYear, isPortfolioView, siteId, refetchPortfolioScore, refetchSiteScore]);

  return (
    <div className="space-y-6">
      {/* Performance Score Section - Only show for current year */}
      {isCurrentYear && (
        <>
          <div className="relative">
            {/* Three Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Column 1 - Circular Score Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white dark:bg-[#2A2A2A] rounded-lg p-6 shadow-sm overflow-visible"
              >
                {isScoreLoading ? (
                  <ScoreCardSkeleton />
                ) : scoreData ? (
                  <SimpleScoreDisplay
                    data={scoreData}
                    animated={true}
                    isPortfolioView={isPortfolioView}
                    selectedSite={selectedSite}
                    onRecalculate={handleRecalculate}
                    isRecalculating={isRecalculating}
                    isSuperAdmin={isSuperAdmin}
                  />
                ) : (
                  <ScoreCardEmpty isPortfolio={isPortfolioView} onCalculate={handleRecalculate} />
                )}
              </motion.div>

              {/* Column 2 - Category Scores */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm"
              >
                {isScoreLoading ? (
                  <CategoryScoresSkeleton />
                ) : scoreData ? (
                  <CategoryScoresDisplay data={scoreData} animated={true} />
                ) : null}
              </motion.div>

              {/* Column 3 - Site Rankings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm"
              >
                <SiteRankingsDisplay rankings={siteRankings} loading={rankingsLoading} selectedSite={selectedSite} />
              </motion.div>
            </div>
          </div>
        </>
      )}

      {/* Original Dashboard Content */}
      <div>
        <OverviewDashboard
          organizationId={organizationId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
          externalLoading={isCurrentYear ? isScoreLoading : false}
        />
      </div>
    </div>
  );
}

// ============================================================================
// DISPLAY COMPONENTS
// ============================================================================

function SimpleScoreDisplay({
  data,
  animated,
  isPortfolioView,
  selectedSite,
  onRecalculate,
  isRecalculating,
  isSuperAdmin,
}: {
  data: any;
  animated: boolean;
  isPortfolioView: boolean;
  selectedSite: any;
  onRecalculate: () => void;
  isRecalculating: boolean;
  isSuperAdmin: boolean;
}) {
  const tIndex = useTranslations('sustainability.performanceIndex');

  // Format last updated time
  const formatLastUpdated = (timestamp: string) => {
    const now = new Date();
    const updated = new Date(timestamp);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex flex-col h-full overflow-visible">
      {/* Title - Matching EmissionsDashboard style */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 relative group">
            <Award className="w-5 h-5 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
              {tIndex('title')}
            </h3>
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-1 w-96 p-3 bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-purple-500/30">
              <p className="font-semibold text-white text-sm mb-2">
                {tIndex('tooltip.title')}
              </p>

              <p className="text-gray-200 text-[11px] mb-3 leading-relaxed">
                {tIndex('tooltip.description')}
              </p>

              <div className="space-y-2">
                <div className="bg-white/5 rounded p-2">
                  <strong className="text-white text-[10px]">{tIndex('tooltip.howCalculated.title')}</strong>
                  <p className="mt-1 text-gray-200 text-[10px] leading-relaxed">
                    {tIndex('tooltip.howCalculated.description')}
                  </p>
                </div>

                <div className="bg-white/5 rounded p-2">
                  <strong className="text-white text-[10px]">{tIndex('tooltip.whatScoresMean.title')}</strong>
                  <p className="mt-1 text-gray-200 text-[10px] leading-relaxed">
                    <span className="text-green-400 font-medium">80-100 (A):</span> {tIndex('tooltip.whatScoresMean.gradeA')}<br/>
                    <span className="text-blue-400 font-medium">60-79 (B):</span> {tIndex('tooltip.whatScoresMean.gradeB')}<br/>
                    <span className="text-yellow-400 font-medium">40-59 (C):</span> {tIndex('tooltip.whatScoresMean.gradeC')}<br/>
                    <span className="text-red-400 font-medium">0-39 (D-F):</span> {tIndex('tooltip.whatScoresMean.gradeD')}
                  </p>
                </div>

                <div className="bg-white/5 rounded p-2">
                  <strong className="text-white text-[10px]">{tIndex('tooltip.improvingScore.title')}</strong>
                  <p className="mt-1 text-gray-200 text-[10px] leading-relaxed">
                    {tIndex('tooltip.improvingScore.description')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isPortfolioView
              ? tIndex('subtitle')
              : tIndex('siteSubtitle', { siteName: selectedSite?.name || 'Site' })
            }
          </p>
          {data.calculatedAt && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              Updated {formatLastUpdated(data.calculatedAt)}
            </p>
          )}
        </div>
        {isSuperAdmin && (
          <button
            onClick={onRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] hover:bg-gray-100 dark:hover:bg-[#222] border border-gray-200 dark:border-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            title="Recalculate Score (Super Admin Only)"
          >
            <RefreshCw className={`w-3 h-3 text-gray-500 dark:text-gray-400 ${isRecalculating ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Circular Score - Centered with proper padding */}
      <div className="flex-1 flex flex-col items-center justify-center overflow-visible">
        <div className="mb-4">
          <CircularScoreLarge score={data.overallScore} grade={data.grade} animated={animated} />
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ImprovementVelocityBadge velocity={data.improvementVelocity} size="sm" />
          {data.peerPercentile > 0 && <PeerPercentileBadge percentile={data.peerPercentile} size="sm" />}
        </div>

        {/* Data Quality */}
        <div className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">{data.dataCompleteness}%</span> {tIndex('metrics.dataCompleteness')}
          {' • '}
          <span className={`font-medium ${
            data.confidenceLevel === 'high' ? 'text-green-600 dark:text-green-400' :
            data.confidenceLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-red-600 dark:text-red-400'
          }`}>
            {tIndex(`metrics.${data.confidenceLevel}`)}
          </span> {tIndex('metrics.confidence')}
        </div>
      </div>
    </div>
  );
}

function CategoryScoresDisplay({
  data,
  animated,
}: {
  data: any;
  animated: boolean;
}) {
  const tIndex = useTranslations('sustainability.performanceIndex');

  // Separate categories with data from those without
  const categoriesWithData = Object.entries(data.categoryScores)
    .filter(([_, score]: [string, any]) => score.dataPoints > 0)
    .sort((a: any, b: any) => b[1].weight - a[1].weight);

  const categoriesWithoutData = Object.entries(data.categoryScores)
    .filter(([_, score]: [string, any]) => score.dataPoints === 0)
    .sort((a: any, b: any) => b[1].weight - a[1].weight);

  // Combine: categories with data first, then those without
  const categories = [...categoriesWithData, ...categoriesWithoutData];

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'scope1': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'scope2': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'scope3': return <Globe className="w-4 h-4 text-blue-500" />;
      case 'waste': return <Recycle className="w-4 h-4 text-green-500" />;
      case 'water': return <Droplet className="w-4 h-4 text-cyan-500" />;
      case 'energy': return <Zap className="w-4 h-4 text-purple-500" />;
      case 'transportation': return <Truck className="w-4 h-4 text-indigo-500" />;
      case 'supplychain': return <Link className="w-4 h-4 text-teal-500" />;
      case 'humanexperience': return <Users className="w-4 h-4 text-pink-500" />;
      case 'compliance': return <FileCheck className="w-4 h-4 text-amber-500" />;
      default: return <Layers className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 relative group">
        <Layers className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
          {tIndex('categoryScores.title')}
        </h3>

        {/* Tooltip */}
        <div className="absolute left-0 top-full mt-1 w-96 p-3 bg-gradient-to-br from-blue-900/95 to-purple-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-blue-500/30">
          <p className="font-semibold text-white text-sm mb-2">
            {tIndex('categoryScores.tooltip.title')}
          </p>

          <p className="text-gray-200 text-[11px] mb-3 leading-relaxed">
            {tIndex('categoryScores.tooltip.description')}
          </p>

          <div className="space-y-2">
            <div className="bg-white/5 rounded p-2">
              <strong className="text-white text-[10px]">{tIndex('categoryScores.tooltip.columns.title')}</strong>
              <p className="mt-1 text-gray-200 text-[10px] leading-relaxed">
                • <strong className="text-white">Score:</strong> {tIndex('categoryScores.tooltip.columns.score')}<br/>
                • <strong className="text-white">Trend:</strong> {tIndex('categoryScores.tooltip.columns.trend')}<br/>
                • <strong className="text-white">Percentile:</strong> {tIndex('categoryScores.tooltip.columns.percentile')}
              </p>
            </div>

            <div className="bg-white/5 rounded p-2">
              <strong className="text-white text-[10px]">{tIndex('categoryScores.tooltip.percentileColors.title')}</strong>
              <p className="mt-1 text-gray-200 text-[10px] leading-relaxed">
                <span className="inline-block w-3 h-3 bg-purple-400 rounded mr-1"></span> <strong className="text-purple-300">75-100:</strong> {tIndex('categoryScores.tooltip.percentileColors.top')}<br/>
                <span className="inline-block w-3 h-3 bg-blue-400 rounded mr-1"></span> <strong className="text-blue-300">50-74:</strong> {tIndex('categoryScores.tooltip.percentileColors.good')}<br/>
                <span className="inline-block w-3 h-3 bg-yellow-400 rounded mr-1"></span> <strong className="text-yellow-300">25-49:</strong> {tIndex('categoryScores.tooltip.percentileColors.average')}<br/>
                <span className="inline-block w-3 h-3 bg-orange-400 rounded mr-1"></span> <strong className="text-orange-300">0-24:</strong> {tIndex('categoryScores.tooltip.percentileColors.needsWork')}
              </p>
            </div>

            <div className="bg-white/5 rounded p-2">
              <strong className="text-white text-[10px]">{tIndex('categoryScores.tooltip.improving.title')}</strong>
              <p className="mt-1 text-gray-200 text-[10px] leading-relaxed">
                {tIndex('categoryScores.tooltip.improving.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map(([category, score]: [string, any], index) => (
          <motion.div
            key={category}
            initial={animated ? { opacity: 0, x: -20 } : undefined}
            animate={animated ? { opacity: 1, x: 0 } : undefined}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="grid grid-cols-[220px_auto_auto] gap-3 items-center pl-4"
          >
            {/* Column 1: Icon and name */}
            <div className="flex items-center gap-2">
              {getCategoryIcon(category)}
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {tIndex(`categoryScores.categories.${category}`) || formatCategoryName(category)}
              </span>
            </div>

            {/* Column 2: Score */}
            <div className={`text-sm font-semibold ${score.dataPoints > 0 ? getScoreTextColor(score.rawScore) : 'text-gray-400 dark:text-gray-500'}`}>
              {score.dataPoints > 0 && (
                <>{score.rawScore}<span className="text-gray-400 dark:text-gray-500">/100</span></>
              )}
            </div>

            {/* Column 3: Tendency */}
            <div className="w-8 flex justify-center">
              {score.dataPoints > 0 && <TrendIcon trend={score.trend} size="md" />}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Large Circular Score Component (180px diameter - more compact)
function CircularScoreLarge({
  score,
  grade,
  animated,
}: {
  score: number;
  grade: string;
  animated: boolean;
}) {
  const tIndex = useTranslations('sustainability.performanceIndex');
  const radius = 80; // 160px diameter = 80px radius (smaller)
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-blue-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGradeColor = (grade: string): string => {
    if (grade === 'A+' || grade === 'A') return 'text-green-400';
    if (grade === 'B') return 'text-blue-400';
    if (grade === 'C') return 'text-yellow-400';
    if (grade === 'D') return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="relative w-[180px] h-[180px]">
      <svg className="transform -rotate-90 w-[180px] h-[180px]">
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={getScoreColor(score)}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={animated ? { strokeDashoffset } : undefined}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-4xl font-bold text-gray-900 dark:text-white"
          initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tIndex('overallScore.outOf')}</div>
        <div className={`text-3xl font-bold mt-1 ${getGradeColor(grade)}`}>
          {grade}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    energy: 'Energy',
    water: 'Water',
    waste: 'Waste',
    transportation: 'Transportation',
    scope3: 'Scope 3 Emissions',
    supplyChain: 'Supply Chain',
    humanExperience: 'Human Experience',
    compliance: 'Compliance',
  };
  return names[category] || category;
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getDataCoverageMessage(category: string, score: any): string {
  if (category === 'compliance') {
    return '0% of area';
  }
  if (['humanExperience', 'scope3', 'supplyChain', 'transportation'].includes(category)) {
    return '0% of employees';
  }
  return 'No data';
}

// ============================================================================
// LOADING & EMPTY STATES
// ============================================================================

function ScoreCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center space-x-6">
        {/* Circle skeleton */}
        <div className="w-48 h-48 rounded-full bg-gray-700/50" />

        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-700/50 rounded w-3/4" />
          <div className="h-4 bg-gray-700/50 rounded w-1/2" />
          <div className="h-4 bg-gray-700/50 rounded w-2/3" />
        </div>
      </div>

      {/* Category bars skeleton */}
      <div className="mt-8 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-700/50 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function CategoryScoresSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-48" />
      </div>

      {/* Category rows skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="grid grid-cols-[300px_auto_auto_auto] gap-3 items-center pl-4">
            {/* Column 1: Icon and name */}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-32" />
            </div>

            {/* Column 2: Score */}
            <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-12" />

            {/* Column 3: Trend */}
            <div className="w-4 h-4 bg-gray-300 dark:bg-gray-700 rounded" />

            {/* Column 4: Percentile */}
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreCardEmpty({
  isPortfolio,
  onCalculate,
}: {
  isPortfolio: boolean;
  onCalculate: () => void;
}) {
  const tIndex = useTranslations('sustainability.performanceIndex');

  return (
    <div className="text-center py-12">
      <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
        <span className="text-5xl">🎯</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-2">
        {tIndex('emptyState.title')}
      </h3>
      <p className="text-gray-400 mb-6 max-w-md mx-auto">
        {isPortfolio
          ? tIndex('emptyState.portfolioDescription')
          : tIndex('emptyState.siteDescription')}
      </p>

      <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 max-w-lg mx-auto">
        <p className="text-sm text-gray-300 mb-2">
          <strong className="text-white">{tIndex('emptyState.whatGetsScored')}</strong>
        </p>
        <ul className="text-xs text-gray-400 space-y-1 text-left">
          <li>• {tIndex('emptyState.categories.energy')}</li>
          <li>• {tIndex('emptyState.categories.water')}</li>
          <li>• {tIndex('emptyState.categories.waste')}</li>
          <li>• {tIndex('emptyState.categories.transportation')}</li>
          <li>• {tIndex('emptyState.categories.scope3')}</li>
          <li>• {tIndex('emptyState.categories.circularity')}</li>
        </ul>
        <p className="text-xs text-gray-500 mt-3 italic">
          {tIndex('emptyState.adaptiveNote')}
        </p>
      </div>

      <button
        onClick={onCalculate}
        className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold transition-all shadow-lg hover:shadow-xl"
      >
        {tIndex('emptyState.calculateButton')}
      </button>
      <p className="text-xs text-gray-500 mt-4">
        {tIndex('emptyState.worksWith')}
      </p>
    </div>
  );
};

// Site Rankings Display Component
function SiteRankingsDisplay({
  rankings,
  loading,
  selectedSite
}: {
  rankings: SiteRanking[];
  loading: boolean;
  selectedSite: any;
}) {
  const tIndex = useTranslations('sustainability.performanceIndex');

  if (loading) {
    return null;
  }

  if (rankings.length === 0) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tIndex('siteRankings.title')}
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {tIndex('siteRankings.noData')}
        </p>
      </div>
    );
  }

  const getRankColor = (index: number) => {
    if (index === 0) return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'; // Best
    if (index === 1) return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'; // Second
    if (index === 2) return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'; // Third
    return 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'; // Others
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 relative group">
        <TrendingUp className="w-5 h-5 text-cyan-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-help">
          {tIndex('siteRankings.title')}
        </h3>

        {/* Tooltip */}
        <div className="absolute left-0 top-full mt-1 w-80 p-3 bg-gradient-to-br from-cyan-900/95 to-blue-900/95 backdrop-blur-sm text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-cyan-500/30">
          <p className="font-semibold text-white text-sm mb-2">
            {tIndex('siteRankings.tooltip.title')}
          </p>
          <p className="text-gray-200 text-[11px] leading-relaxed">
            {tIndex('siteRankings.tooltip.description')}
          </p>
          {/* Arrow indicator */}
          <div className="absolute -bottom-1 left-4 w-2 h-2 bg-gradient-to-br from-cyan-900 to-blue-900 border-r border-b border-cyan-500/30 transform rotate-45"></div>
        </div>
      </div>

      <div className="space-y-2 max-h-[280px] overflow-y-auto overflow-x-hidden pr-1">
        {rankings.map((site: any, index: number) => {
          const isSelected = selectedSite && site.id === selectedSite.id;
          return (
            <motion.div
              key={site.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`
                p-3 rounded-lg transition-all
                ${isSelected
                  ? 'border-2 border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }
              `}
            >
              <div className="flex items-center gap-3">
                {/* Rank Badge */}
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg flex-shrink-0
                  ${getRankColor(index)}
                `}>
                  {getRankIcon(index)}
                </div>

                {/* Site Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {site.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Grade {site.grade}
                  </div>
                </div>

                {/* Performance Score */}
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(site.score)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    / 100
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when props haven't changed
export const OverviewDashboardWithScore = React.memo(OverviewDashboardWithScoreComponent);
