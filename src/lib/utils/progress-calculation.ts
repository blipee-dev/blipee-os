/**
 * Unit-agnostic progress calculation utilities for sustainability targets
 *
 * Works with any unit (MWh, ML, tCO2e, kg, etc.) because calculations are based on
 * percentages and ratios, not absolute values.
 */

export interface ProgressResult {
  progressPercent: number;
  exceedancePercent: number;
  status: 'on-track' | 'at-risk' | 'off-track' | 'exceeded-baseline';
  reductionNeeded: number;
  reductionAchieved: number;
}

/**
 * Calculate progress toward a reduction target
 *
 * @param baseline - Baseline value (e.g., 2023 consumption/emissions)
 * @param target - Target value (e.g., 2025 goal)
 * @param projected - Projected value (e.g., 2025 forecast)
 * @returns ProgressResult with percentages and status
 *
 * @example
 * // Water: Baseline 0.76 ML, Target 0.72 ML, Projected 0.93 ML
 * const result = calculateProgress(0.76, 0.72, 0.93);
 * // Returns: { progressPercent: 0, exceedancePercent: 29, status: 'exceeded-baseline', ... }
 *
 * @example
 * // Energy: Baseline 1000 MWh, Target 916 MWh, Projected 900 MWh
 * const result = calculateProgress(1000, 916, 900);
 * // Returns: { progressPercent: 119, exceedancePercent: 0, status: 'on-track', ... }
 */
export function calculateProgress(
  baseline: number,
  target: number,
  projected: number
): ProgressResult {
  // Calculate reduction metrics
  const reductionNeeded = baseline - target;
  const reductionAchieved = baseline - projected;

  let progressPercent = 0;
  let exceedancePercent = 0;
  let status: ProgressResult['status'] = 'off-track';

  // Scenario 1: Projected exceeds baseline (things got worse)
  if (projected > baseline) {
    exceedancePercent = ((projected - target) / target) * 100;
    progressPercent = 0;
    status = 'exceeded-baseline';
  }
  // Scenario 2: Between baseline and target (partial progress)
  else if (projected > target) {
    progressPercent = reductionNeeded > 0
      ? (reductionAchieved / reductionNeeded) * 100
      : 0;

    // Determine status based on progress
    if (progressPercent >= 80) {
      status = 'at-risk';
    } else {
      status = 'off-track';
    }
  }
  // Scenario 3: Met or exceeded target
  else {
    progressPercent = 100;
    status = 'on-track';
  }

  return {
    progressPercent: Math.round(progressPercent * 10) / 10, // Round to 1 decimal
    exceedancePercent: Math.round(exceedancePercent * 10) / 10,
    status,
    reductionNeeded: Math.round(reductionNeeded * 10) / 10,
    reductionAchieved: Math.round(reductionAchieved * 10) / 10,
  };
}

/**
 * Determine trajectory status based on progress percentage
 *
 * @param progressPercent - Progress percentage (0-100+)
 * @returns Trajectory status
 */
export function getTrajectoryStatus(progressPercent: number): 'on-track' | 'at-risk' | 'off-track' {
  if (progressPercent >= 95) return 'on-track';
  if (progressPercent >= 80) return 'at-risk';
  return 'off-track';
}

/**
 * Format progress for display
 *
 * @param result - ProgressResult from calculateProgress
 * @returns Formatted string for UI display
 *
 * @example
 * formatProgressDisplay({ progressPercent: 85, exceedancePercent: 0, status: 'at-risk', ... })
 * // Returns: "85%"
 *
 * @example
 * formatProgressDisplay({ progressPercent: 0, exceedancePercent: 29, status: 'exceeded-baseline', ... })
 * // Returns: "+29%"
 */
export function formatProgressDisplay(result: ProgressResult): string {
  if (result.status === 'exceeded-baseline') {
    return `+${result.exceedancePercent.toFixed(0)}%`;
  }
  return `${result.progressPercent.toFixed(0)}%`;
}

/**
 * Get color class based on progress status
 *
 * @param status - Status from ProgressResult
 * @returns Tailwind CSS color classes
 */
export function getProgressColorClass(status: ProgressResult['status']): string {
  switch (status) {
    case 'on-track':
      return 'text-green-600 dark:text-green-400';
    case 'at-risk':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'off-track':
    case 'exceeded-baseline':
      return 'text-red-600 dark:text-red-400';
  }
}
