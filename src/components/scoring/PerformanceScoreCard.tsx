'use client';

/**
 * Blipee Performance Index™ - Score Card Component
 *
 * Visual display of sustainability performance score
 * Inspired by Arc's circular design but with Blipee enhancements:
 * - Real-time improvement velocity indicator
 * - Peer percentile comparison
 * - ML predictions
 * - Category breakdown with trends
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Award,
  AlertTriangle,
  Target,
  Users,
} from 'lucide-react';
import type { BlipeePerformanceIndex } from '@/lib/ai/performance-scoring/blipee-performance-index';

interface PerformanceScoreCardProps {
  data: BlipeePerformanceIndex;
  variant?: 'full' | 'compact' | 'minimal';
  showPredictions?: boolean;
  showOpportunities?: boolean;
  animated?: boolean;
}

export function PerformanceScoreCard({
  data,
  variant = 'full',
  showPredictions = true,
  showOpportunities = true,
  animated = true,
}: PerformanceScoreCardProps) {
  if (variant === 'minimal') {
    return <MinimalScoreDisplay data={data} animated={animated} />;
  }

  if (variant === 'compact') {
    return <CompactScoreDisplay data={data} animated={animated} />;
  }

  return (
    <FullScoreDisplay
      data={data}
      showPredictions={showPredictions}
      showOpportunities={showOpportunities}
      animated={animated}
    />
  );
}

// ============================================================================
// FULL DISPLAY
// ============================================================================

function FullScoreDisplay({
  data,
  showPredictions,
  showOpportunities,
  animated,
}: {
  data: BlipeePerformanceIndex;
  showPredictions: boolean;
  showOpportunities: boolean;
  animated: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Main Score Circle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <CircularScore score={data.overallScore} grade={data.grade} animated={animated} />

          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Blipee Performance Index
            </h3>
            <div className="flex items-center space-x-3 mt-2">
              <ImprovementVelocityBadge velocity={data.improvementVelocity} />
              <PeerPercentileBadge percentile={data.peerPercentile} />
            </div>
            {showPredictions && (
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                <Sparkles className="inline w-4 h-4 mr-1" />
                Predicted in 90 days: <span className="text-purple-500 dark:text-purple-400 font-semibold">{data.predictedScore90Days}</span>
                <span className="text-green-500 dark:text-green-400 ml-1">
                  (+{data.predictedScore90Days - data.overallScore})
                </span>
              </div>
            )}
          </div>
        </div>

        <DataQualityBadge
          completeness={data.dataCompleteness}
          confidence={data.confidenceLevel}
        />
      </div>

      {/* Category Breakdown */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          Category Scores
        </h4>
        <div className="grid grid-cols-1 gap-3">
          {Object.entries(data.categoryScores).map(([category, score]) => (
            <CategoryScoreBar
              key={category}
              category={category}
              score={score}
              animated={animated}
            />
          ))}
        </div>
      </div>

      {/* Top Opportunities */}
      {showOpportunities && data.topOpportunities && data.topOpportunities.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
            Top Opportunities
          </h4>
          <div className="grid grid-cols-1 gap-3">
            {data.topOpportunities.slice(0, 3).map((opp, index) => (
              <OpportunityCard key={index} opportunity={opp} />
            ))}
          </div>
        </div>
      )}

      {/* Time Window Selector (optional) */}
      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="text-gray-500 dark:text-gray-400">
          Based on{' '}
          <span className="text-gray-900 dark:text-white font-semibold">
            365-day rolling average
          </span>
        </div>
        <div className="text-gray-400 dark:text-gray-500">
          Last updated: {new Date(data.calculatedAt).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT DISPLAY
// ============================================================================

function CompactScoreDisplay({
  data,
  animated,
}: {
  data: BlipeePerformanceIndex;
  animated: boolean;
}) {
  // Get all categories sorted by weight (importance)
  const allCategories = Object.entries(data.categoryScores)
    .sort((a, b) => b[1].weight - a[1].weight);

  return (
    <div className="h-full flex flex-col">
      {/* Header - Main Score Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <CircularScore score={data.overallScore} grade={data.grade} animated={animated} />
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <ImprovementVelocityBadge velocity={data.improvementVelocity} size="sm" />
              {data.peerPercentile > 0 && <PeerPercentileBadge percentile={data.peerPercentile} size="sm" />}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-900 dark:text-white">{data.dataCompleteness}%</span> data • {' '}
              <span className={`font-medium ${
                data.confidenceLevel === 'high' ? 'text-green-600 dark:text-green-400' :
                data.confidenceLevel === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {data.confidenceLevel}
              </span> confidence
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown - All Categories */}
      <div className="flex-1 space-y-2">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Category Scores
        </div>
        {allCategories.map(([category, score]) => (
          <div key={category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {formatCategoryName(category)}
                </span>
                {score.dataPoints > 0 && <TrendIcon trend={score.trend} size="sm" />}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {Math.round(score.weight * 100)}%
                </span>
                <span className={`font-bold text-lg ${getScoreTextColor(score.rawScore)}`}>
                  {score.rawScore}
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div className="relative w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`absolute left-0 top-0 h-full rounded-full ${getScoreColor(score.rawScore)}`}
                style={{ width: `${score.rawScore}%` }}
                initial={animated ? { width: 0 } : undefined}
                animate={animated ? { width: `${score.rawScore}%` } : undefined}
                transition={{ duration: 1, ease: 'easeOut', delay: allCategories.findIndex(([c]) => c === category) * 0.1 }}
              />
            </div>
            {score.insights && score.insights.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                {score.insights[0]}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer - Prediction */}
      {data.predictedScore90Days > 0 && data.predictedScore90Days !== data.overallScore && (
        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Predicted in 90 days:{' '}
            <span className={`font-semibold text-sm ${
              data.predictedScore90Days > data.overallScore
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {data.predictedScore90Days}/100
            </span>
            {data.predictedScore90Days !== data.overallScore && (
              <span className={`ml-1 font-medium ${
                data.predictedScore90Days > data.overallScore
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                ({data.predictedScore90Days > data.overallScore ? '+' : ''}{data.predictedScore90Days - data.overallScore})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MINIMAL DISPLAY
// ============================================================================

function MinimalScoreDisplay({
  data,
  animated,
}: {
  data: BlipeePerformanceIndex;
  animated: boolean;
}) {
  return (
    <div className="flex items-center space-x-3">
      <div className="relative w-16 h-16">
        <svg className="transform -rotate-90 w-16 h-16">
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200 dark:text-gray-700"
          />
          <motion.circle
            cx="32"
            cy="32"
            r="28"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 28}`}
            strokeDashoffset={`${2 * Math.PI * 28 * (1 - data.overallScore / 100)}`}
            className={getScoreColor(data.overallScore)}
            initial={animated ? { strokeDashoffset: 2 * Math.PI * 28 } : undefined}
            animate={animated ? { strokeDashoffset: 2 * Math.PI * 28 * (1 - data.overallScore / 100) } : undefined}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{data.overallScore}</span>
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-500 dark:text-gray-400">Performance Score</div>
        <div className="flex items-center space-x-2 mt-1">
          <span className={`text-xs font-semibold ${getGradeColor(data.grade)}`}>
            {data.grade}
          </span>
          <TrendIcon trend={data.improvementVelocity > 0 ? 'improving' : 'declining'} size="sm" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CircularScore({
  score,
  grade,
  animated,
}: {
  score: number;
  grade: string;
  animated: boolean;
}) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-48 h-48">
      <svg className="transform -rotate-90 w-48 h-48">
        {/* Background circle */}
        <circle
          cx="96"
          cy="96"
          r={radius}
          stroke="currentColor"
          strokeWidth="12"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx="96"
          cy="96"
          r={radius}
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? strokeDashoffset : 0}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={animated ? { strokeDashoffset } : undefined}
          transition={{ duration: 2, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={score >= 85 ? '#10b981' : score >= 70 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444'} />
            <stop offset="100%" stopColor={score >= 85 ? '#059669' : score >= 70 ? '#2563eb' : score >= 50 ? '#d97706' : '#dc2626'} />
          </linearGradient>
        </defs>
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          className="text-5xl font-bold text-gray-900 dark:text-white"
          initial={animated ? { opacity: 0, scale: 0.5 } : undefined}
          animate={animated ? { opacity: 1, scale: 1 } : undefined}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {score}
        </motion.div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">out of 100</div>
        <div className={`text-2xl font-bold mt-2 ${getGradeColor(grade)}`}>
          {grade}
        </div>
      </div>
    </div>
  );
}

function MiniCircularScore({
  score,
  animated,
}: {
  score: number;
  animated: boolean;
}) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-14 h-14">
      <svg className="transform -rotate-90 w-14 h-14">
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
        />
        <motion.circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={getScoreColor(score)}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={animated ? { strokeDashoffset } : undefined}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
    </div>
  );
}

function CategoryScoreBar({
  category,
  score,
  animated,
}: {
  category: string;
  score: any;
  animated: boolean;
}) {
  return (
    <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
            {formatCategoryName(category)}
          </span>
          <TrendIcon trend={score.trend} />
          {score.percentile >= 75 && <Award className="w-4 h-4 text-yellow-500" />}
          {score.percentile < 40 && <AlertTriangle className="w-4 h-4 text-orange-500" />}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {score.rawScore}/100
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {Math.round(score.percentile)}th percentile
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${getScoreColor(score.rawScore)}`}
          style={{ width: `${score.rawScore}%` }}
          initial={animated ? { width: 0 } : undefined}
          animate={animated ? { width: `${score.rawScore}%` } : undefined}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Weight indicator */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Weight: {Math.round(score.weight * 100)}%</span>
        <span>
          Contributes: {score.weightedScore.toFixed(1)} points
        </span>
      </div>

      {/* Insights */}
      {score.insights && score.insights.length > 0 && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
          {score.insights[0]}
        </div>
      )}
    </div>
  );
}

export function ImprovementVelocityBadge({
  velocity,
  size = 'md',
}: {
  velocity: number;
  size?: 'sm' | 'md';
}) {
  const isImproving = velocity > 0.5;
  const isDeclining = velocity < -0.5;

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  if (!isImproving && !isDeclining) {
    return (
      <span className={`${sizeClasses} rounded-full bg-gray-700 text-gray-300 flex items-center space-x-1`}>
        <Minus className="w-3 h-3" />
        <span>Stable</span>
      </span>
    );
  }

  return (
    <span
      className={`${sizeClasses} rounded-full flex items-center space-x-1 ${
        isImproving
          ? 'bg-green-500/20 text-green-400'
          : 'bg-red-500/20 text-red-400'
      }`}
    >
      {isImproving ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      <span>
        {isImproving ? '+' : ''}
        {velocity.toFixed(0)}
      </span>
      {size === 'md' && (
        <span className="text-xs opacity-75">velocity</span>
      )}
    </span>
  );
}

export function PeerPercentileBadge({
  percentile,
  size = 'md',
}: {
  percentile: number;
  size?: 'sm' | 'md';
}) {
  const isTop = percentile >= 75;
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`${sizeClasses} rounded-full flex items-center space-x-1 ${
        isTop
          ? 'bg-purple-500/20 text-purple-400'
          : 'bg-blue-500/20 text-blue-400'
      }`}
    >
      <Users className="w-3 h-3" />
      <span>
        {percentile}th percentile
      </span>
    </span>
  );
}

function DataQualityBadge({
  completeness,
  confidence,
}: {
  completeness: number;
  confidence: string;
}) {
  return (
    <div className="text-right">
      <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Data Quality
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {completeness}% complete
      </div>
      <div className={`text-xs mt-0.5 ${
        confidence === 'high' ? 'text-green-600 dark:text-green-400' :
        confidence === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
        'text-red-600 dark:text-red-400'
      }`}>
        {confidence} confidence
      </div>
    </div>
  );
}

function OpportunityCard({ opportunity }: { opportunity: any }) {
  return (
    <div className="bg-white dark:bg-[#2A2A2A] rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {opportunity.action}
            </span>
            {opportunity.agentWorking && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400">
                AI Working
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Category: <span className="text-gray-700 dark:text-gray-300">{opportunity.category}</span>
          </div>
        </div>

        <div className="text-right ml-4">
          <div className="text-lg font-bold text-green-600 dark:text-green-400">
            +{opportunity.potentialPoints}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          {opportunity.estimatedCost}
        </span>
        <span>
          {opportunity.paybackMonths === 'immediate'
            ? 'Immediate payback'
            : `${opportunity.paybackMonths}mo payback`}
        </span>
        <span className={`px-2 py-0.5 rounded-full ${
          opportunity.priority === 'high'
            ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
            : opportunity.priority === 'medium'
            ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
            : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
        }`}>
          {opportunity.priority}
        </span>
      </div>
    </div>
  );
}

export function TrendIcon({ trend, size = 'md' }: { trend: string; size?: 'sm' | 'md' }) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  if (trend === 'improving') {
    return <TrendingUp className={`${iconSize} text-green-400`} />;
  } else if (trend === 'declining') {
    return <TrendingDown className={`${iconSize} text-red-400`} />;
  } else {
    return <Minus className={`${iconSize} text-gray-400`} />;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 85) return 'text-green-500';
  if (score >= 70) return 'text-blue-500';
  if (score >= 50) return 'text-yellow-500';
  return 'text-red-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 85) return 'text-green-600 dark:text-green-400';
  if (score >= 70) return 'text-blue-600 dark:text-blue-400';
  if (score >= 50) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function getGradeColor(grade: string): string {
  if (grade === 'A+' || grade === 'A') return 'text-green-400';
  if (grade === 'B') return 'text-blue-400';
  if (grade === 'C') return 'text-yellow-400';
  if (grade === 'D') return 'text-orange-400';
  return 'text-red-400';
}

function formatCategoryName(category: string): string {
  const names: Record<string, string> = {
    energy: 'Energy',
    water: 'Water',
    waste: 'Waste',
    transportation: 'Transportation',
    humanExperience: 'Human Experience',
    scopeThree: 'Scope 3 Emissions',
    supplyChain: 'Supply Chain',
    compliance: 'Compliance',
  };
  return names[category] || category;
}
