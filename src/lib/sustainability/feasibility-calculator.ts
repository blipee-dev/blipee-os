/**
 * Feasibility Calculator for Replanning
 *
 * Determines if annual targets are still achievable based on YTD performance
 * and calculates required adjustments.
 */

export interface FeasibilityResult {
  // Status
  status: 'on-track' | 'challenging' | 'at-risk' | 'impossible';
  isAchievable: boolean;

  // Current state
  ytdActual: number;
  ytdTarget: number;
  ytdVariance: number;
  ytdVariancePercent: number;
  monthsElapsed: number;
  monthsRemaining: number;

  // Budget
  annualTarget: number;
  remainingBudget: number;

  // Required adjustments
  requiredMonthlyAvg: number;
  historicalMonthlyAvg: number;
  reductionRequired: number;
  reductionRequiredPercent: number;

  // Recommendations
  recommendation: string;
  adjustmentStrategy: 'redistribute' | 'aggressive' | 'adjust-future' | 'investigate';

  // Future year impact
  projectedAnnualTotal: number;
  projectedMiss: number;
  futureYearAdjustment?: number;
}

export interface FeasibilityInput {
  // Current date context
  currentYear: number;
  currentMonth: number; // 1-12

  // Actual emissions
  ytdActualEmissions: number;

  // Target trajectory
  annualTarget: number;
  baselineYear: number;
  baselineEmissions: number;
  targetYear: number;
  targetEmissions: number;
}

/**
 * Calculate feasibility of hitting annual target given YTD performance
 */
export function calculateFeasibility(input: FeasibilityInput): FeasibilityResult {
  const {
    currentYear,
    currentMonth,
    ytdActualEmissions,
    annualTarget,
    baselineYear,
    baselineEmissions,
    targetYear,
    targetEmissions
  } = input;

  // Calculate time context
  const monthsElapsed = currentMonth;
  const monthsRemaining = 12 - currentMonth;

  // Calculate YTD target (linear distribution)
  const ytdTarget = (annualTarget / 12) * monthsElapsed;
  const ytdVariance = ytdActualEmissions - ytdTarget;
  const ytdVariancePercent = (ytdVariance / ytdTarget) * 100;

  // Calculate remaining budget
  const remainingBudget = annualTarget - ytdActualEmissions;

  // Calculate required monthly average for remaining months
  const requiredMonthlyAvg = monthsRemaining > 0 ? remainingBudget / monthsRemaining : 0;

  // Calculate historical monthly average
  const historicalMonthlyAvg = ytdActualEmissions / monthsElapsed;

  // Calculate reduction required
  const reductionRequired = historicalMonthlyAvg - requiredMonthlyAvg;
  const reductionRequiredPercent = historicalMonthlyAvg > 0
    ? (reductionRequired / historicalMonthlyAvg) * 100
    : 0;

  // Project annual total if continuing at current pace
  const projectedAnnualTotal = (historicalMonthlyAvg * 12);
  const projectedMiss = projectedAnnualTotal - annualTarget;

  // Determine status and strategy
  let status: FeasibilityResult['status'];
  let adjustmentStrategy: FeasibilityResult['adjustmentStrategy'];
  let recommendation: string;
  let isAchievable: boolean;

  // Decision logic based on required reduction and time remaining
  if (remainingBudget < 0) {
    // Already over budget
    status = 'impossible';
    adjustmentStrategy = 'adjust-future';
    isAchievable = false;
    recommendation = `Already exceeded annual target by ${Math.abs(remainingBudget).toFixed(1)} tCO2e. Need to adjust ${currentYear + 1}-${targetYear} targets to compensate.`;
  } else if (reductionRequiredPercent <= 15) {
    // Minor adjustment needed
    status = 'on-track';
    adjustmentStrategy = 'redistribute';
    isAchievable = true;
    recommendation = `On track. Reduce monthly emissions by ${reductionRequiredPercent.toFixed(1)}% (${reductionRequired.toFixed(1)} tCO2e/month) to hit ${currentYear} target.`;
  } else if (reductionRequiredPercent <= 30) {
    // Moderate adjustment needed
    status = 'challenging';
    adjustmentStrategy = monthsRemaining >= 6 ? 'redistribute' : 'aggressive';
    isAchievable = true;
    recommendation = `Challenging but achievable. Need ${reductionRequiredPercent.toFixed(1)}% reduction (${reductionRequired.toFixed(1)} tCO2e/month). ${monthsRemaining} months to course-correct.`;
  } else if (reductionRequiredPercent <= 50) {
    // Significant adjustment needed
    status = 'at-risk';
    adjustmentStrategy = monthsRemaining >= 6 ? 'aggressive' : 'adjust-future';
    isAchievable = monthsRemaining >= 6;
    recommendation = `Target at risk. Requires ${reductionRequiredPercent.toFixed(1)}% reduction (${reductionRequired.toFixed(1)} tCO2e/month). ${isAchievable ? 'Consider aggressive initiatives.' : 'Recommend adjusting future year targets.'}`;
  } else {
    // Unrealistic adjustment
    status = 'impossible';
    adjustmentStrategy = monthsElapsed <= 2 ? 'investigate' : 'adjust-future';
    isAchievable = false;

    if (monthsElapsed <= 2) {
      recommendation = `Requires ${reductionRequiredPercent.toFixed(1)}% reduction - investigate if recent months were anomalies before adjusting targets.`;
    } else {
      recommendation = `Requires unrealistic ${reductionRequiredPercent.toFixed(1)}% reduction. Spread ${projectedMiss.toFixed(1)} tCO2e deficit across ${targetYear - currentYear} remaining years.`;
    }
  }

  // Calculate future year adjustment if needed
  let futureYearAdjustment: number | undefined;
  if (!isAchievable && projectedMiss > 0) {
    const yearsRemaining = targetYear - currentYear;
    futureYearAdjustment = yearsRemaining > 0 ? projectedMiss / yearsRemaining : projectedMiss;
  }

  return {
    status,
    isAchievable,
    ytdActual: ytdActualEmissions,
    ytdTarget,
    ytdVariance,
    ytdVariancePercent,
    monthsElapsed,
    monthsRemaining,
    annualTarget,
    remainingBudget,
    requiredMonthlyAvg,
    historicalMonthlyAvg,
    reductionRequired,
    reductionRequiredPercent,
    recommendation,
    adjustmentStrategy,
    projectedAnnualTotal,
    projectedMiss,
    futureYearAdjustment
  };
}

/**
 * Generate monthly trajectory based on adjustment strategy
 */
export function generateAdjustedTrajectory(
  feasibility: FeasibilityResult,
  currentYear: number,
  currentMonth: number,
  strategy: 'equal' | 'front-loaded' | 'back-loaded' = 'equal'
): Array<{ year: number; month: number; target: number }> {
  const trajectory: Array<{ year: number; month: number; target: number }> = [];

  if (feasibility.monthsRemaining === 0) {
    return trajectory;
  }

  const { remainingBudget, monthsRemaining } = feasibility;

  // Generate targets for remaining months
  for (let i = 0; i < monthsRemaining; i++) {
    const month = currentMonth + i + 1;
    const year = currentYear;

    let target: number;

    switch (strategy) {
      case 'front-loaded':
        // Higher reduction early, ease off later
        const frontLoadFactor = 1.5 - (i / monthsRemaining);
        target = (remainingBudget / monthsRemaining) * frontLoadFactor;
        break;

      case 'back-loaded':
        // Gradual reduction, more aggressive later
        const backLoadFactor = 0.5 + (i / monthsRemaining);
        target = (remainingBudget / monthsRemaining) * backLoadFactor;
        break;

      case 'equal':
      default:
        // Equal distribution
        target = remainingBudget / monthsRemaining;
        break;
    }

    trajectory.push({ year, month, target: Math.max(0, target) });
  }

  return trajectory;
}

/**
 * Get status badge info
 */
export function getStatusBadge(status: FeasibilityResult['status']): {
  color: string;
  bgColor: string;
  icon: string;
  label: string;
} {
  switch (status) {
    case 'on-track':
      return {
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        icon: '✓',
        label: 'On Track'
      };
    case 'challenging':
      return {
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        icon: '⚡',
        label: 'Challenging'
      };
    case 'at-risk':
      return {
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/10',
        icon: '⚠',
        label: 'At Risk'
      };
    case 'impossible':
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        icon: '✗',
        label: 'Target Missed'
      };
  }
}
