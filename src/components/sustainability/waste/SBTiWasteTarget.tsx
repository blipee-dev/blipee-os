'use client';

import React from 'react';
import { Info, TrendingDown, TrendingUp, Target, Recycle, AlertTriangle } from 'lucide-react';

interface SBTiWasteTargetProps {
  // SBTi Emissions Target Data
  baseline2023Emissions: number;
  currentEmissions: number;
  projectedFullYearEmissions: number;

  // Waste Diversion Target Data (TRUE Zero Waste standard)
  baseline2023DiversionRate: number;
  currentDiversionRate: number;
  projectedFullYearDiversionRate: number;

  // Additional context
  currentYear: number;
  baselineYear?: number;
  targetYear?: number;
  annualEmissionsReductionRate?: number; // Default 4.2% (SBTi 1.5°C)
  targetDiversionRate?: number; // Default 90% (TRUE Zero Waste)
}

export function SBTiWasteTarget({
  baseline2023Emissions,
  currentEmissions,
  projectedFullYearEmissions,
  baseline2023DiversionRate,
  currentDiversionRate,
  projectedFullYearDiversionRate,
  currentYear,
  baselineYear = 2023,
  targetYear = 2030,
  annualEmissionsReductionRate = 4.2,
  targetDiversionRate = 90,
}: SBTiWasteTargetProps) {
  // Calculate SBTi emissions progress
  const yearsElapsed = currentYear - baselineYear;
  const targetEmissions = baseline2023Emissions * Math.pow(1 - annualEmissionsReductionRate / 100, yearsElapsed);
  const expectedReduction = ((baseline2023Emissions - targetEmissions) / baseline2023Emissions) * 100;
  const actualReduction = ((baseline2023Emissions - projectedFullYearEmissions) / baseline2023Emissions) * 100;
  const emissionsProgress = expectedReduction > 0 ? (actualReduction / expectedReduction) * 100 : 0;

  // Calculate diversion rate progress
  const diversionRateIncrease = projectedFullYearDiversionRate - baseline2023DiversionRate;
  const targetDiversionIncrease = targetDiversionRate - baseline2023DiversionRate;
  const diversionProgress = targetDiversionIncrease > 0 ? (diversionRateIncrease / targetDiversionIncrease) * 100 : 0;

  // Status determination
  const getEmissionsStatus = () => {
    if (emissionsProgress >= 100) return 'on-track';
    if (emissionsProgress >= 70) return 'at-risk';
    return 'off-track';
  };

  const getDiversionStatus = () => {
    if (diversionProgress >= 100) return 'on-track';
    if (diversionProgress >= 70) return 'at-risk';
    return 'off-track';
  };

  const emissionsStatus = getEmissionsStatus();
  const diversionStatus = getDiversionStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'at-risk':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'off-track':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'On Track';
      case 'at-risk':
        return 'At Risk';
      case 'off-track':
        return 'Off Track';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-white">SBTi Waste Target Progress</h3>
          <div
            className="group relative"
            title="Science Based Targets initiative (SBTi) for Scope 3 Category 5: Waste generated in operations. Includes emissions reduction targets and waste diversion goals aligned with TRUE Zero Waste certification."
          >
            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
            <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto absolute z-[9999] w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-2xl right-0 top-7 border border-gray-700 transition-opacity duration-200">
              <strong>SBTi Waste Targets:</strong> Track progress toward science-based emissions reductions (4.2% annual) and circular economy goals (90% waste diversion).
              <br /><br />
              <strong>Standards:</strong> SBTi 1.5°C pathway for emissions, TRUE Zero Waste certification for diversion rates, aligned with GRI 306 and ESRS E5.
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
            SBTi
          </span>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
            TRUE
          </span>
          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
            GRI 306
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Emissions Target (SBTi) */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  Scope 3 Cat 5 Emissions
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {annualEmissionsReductionRate}% annual reduction • Baseline {baselineYear}
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(emissionsStatus)}`}>
              {getStatusText(emissionsStatus)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Baseline {baselineYear}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {baseline2023Emissions.toFixed(1)} tCO2e
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentYear} Target</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {targetEmissions.toFixed(1)} tCO2e
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                (-{expectedReduction.toFixed(1)}%)
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentYear} Projected</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {projectedFullYearEmissions.toFixed(1)} tCO2e
              </p>
              <div className="flex items-center gap-1">
                {actualReduction >= 0 ? (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                )}
                <p className={`text-xs font-medium ${actualReduction >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {actualReduction >= 0 ? '-' : '+'}{Math.abs(actualReduction).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Progress to {currentYear} target</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.min(emissionsProgress, 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  emissionsStatus === 'on-track'
                    ? 'bg-green-500'
                    : emissionsStatus === 'at-risk'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(emissionsProgress, 100)}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              On track for {targetYear} target: {(baseline2023Emissions * Math.pow(1 - annualEmissionsReductionRate / 100, targetYear - baselineYear)).toFixed(1)} tCO2e
              ({((1 - Math.pow(1 - annualEmissionsReductionRate / 100, targetYear - baselineYear)) * 100).toFixed(1)}% cumulative reduction)
            </p>
          </div>
        </div>

        {/* Waste Diversion Target (TRUE Zero Waste) */}
        <div className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Recycle className="w-5 h-5 text-green-500" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  Waste Diversion Rate
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target: {targetDiversionRate}% by {targetYear} • TRUE Zero Waste standard
                </p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(diversionStatus)}`}>
              {getStatusText(diversionStatus)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Baseline {baselineYear}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {baseline2023DiversionRate.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{targetYear} Target</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {targetDiversionRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                (+{(targetDiversionRate - baseline2023DiversionRate).toFixed(1)}pp)
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{currentYear} Projected</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {projectedFullYearDiversionRate.toFixed(1)}%
              </p>
              <div className="flex items-center gap-1">
                {diversionRateIncrease >= 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <p className={`text-xs font-medium ${diversionRateIncrease >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {diversionRateIncrease >= 0 ? '+' : ''}{diversionRateIncrease.toFixed(1)}pp
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600 dark:text-gray-400">Progress to {targetYear} target</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {Math.min(diversionProgress, 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  diversionStatus === 'on-track'
                    ? 'bg-green-500'
                    : diversionStatus === 'at-risk'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(diversionProgress, 100)}%` }}
              />
            </div>
          </div>

          {projectedFullYearDiversionRate >= 90 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Recycle className="w-4 h-4" />
                <p className="text-xs font-medium">
                  Eligible for TRUE Zero Waste Certification (≥90% diversion)
                </p>
              </div>
            </div>
          )}

          {projectedFullYearDiversionRate < 90 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <AlertTriangle className="w-4 h-4" />
                <p className="text-xs">
                  {(90 - projectedFullYearDiversionRate).toFixed(1)}pp increase needed for TRUE certification
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
