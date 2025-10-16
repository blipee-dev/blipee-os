'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { RecommendationsModal } from './RecommendationsModal';

interface ReplanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  targetId: string;
  targetName: string;
  baselineYear: number;
  baselineEmissions: number;
  currentYear: number;
  currentEmissions: number;
  targetYear: number;
  targetEmissions: number;
  onReplanComplete: () => void;
}

type AllocationStrategy = 'equal' | 'cost_optimized' | 'quick_wins' | 'custom' | 'ai_recommended';

interface MetricTarget {
  metricId: string;
  metricName: string;
  metricCode: string;
  scope: string;
  currentAnnualEmissions: number;
  targetAnnualEmissions: number;
  reductionPercent: number;
  customReduction?: number;
}

export default function ReplanningModal({
  isOpen,
  onClose,
  organizationId,
  targetId,
  targetName,
  baselineYear,
  baselineEmissions,
  currentYear,
  currentEmissions,
  targetYear,
  targetEmissions,
  onReplanComplete
}: ReplanningModalProps) {
  const [step, setStep] = useState<'overview' | 'allocate' | 'review' | 'success' | 'existing'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedResult, setAppliedResult] = useState<any>(null);
  const [existingPlan, setExistingPlan] = useState<any>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [feasibilityData, setFeasibilityData] = useState<any>(null);
  const [loadingFeasibility, setLoadingFeasibility] = useState(false);

  // Target is fixed - we're replanning to meet the existing target
  // No adjustment needed, just allocation

  // Allocation strategy
  const [strategy, setStrategy] = useState<AllocationStrategy>('equal');
  const [budgetCap, setBudgetCap] = useState<number | null>(null);

  // Metric targets
  const [metricTargets, setMetricTargets] = useState<MetricTarget[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  // Current emissions is already in tCO2e from the targets API
  // (calculated from currentYearEmissions in /api/sustainability/targets/route.ts line 254)
  const currentEmissionsTonnes = useMemo(() => {
    return currentEmissions; // Already in tCO2e, no conversion needed
  }, [currentEmissions]);

  // Calculated values - using the existing target, not adjusting it
  const reductionGap = useMemo(() => {
    return currentEmissionsTonnes - targetEmissions;
  }, [currentEmissionsTonnes, targetEmissions]);

  const annualReductionRate = useMemo(() => {
    const years = targetYear - currentYear;
    return years > 0 ? (reductionGap / years) : 0;
  }, [reductionGap, targetYear, currentYear]);

  const feasibilityColor = useMemo(() => {
    const annualRate = (annualReductionRate / currentEmissionsTonnes) * 100;
    if (annualRate < 5) return 'text-green-500';
    if (annualRate < 10) return 'text-yellow-500';
    return 'text-red-500';
  }, [annualReductionRate, currentEmissionsTonnes]);

  // Check for existing replanning when modal opens
  useEffect(() => {
    if (isOpen) {
      checkExistingPlan();
      fetchFeasibility();
    }
  }, [isOpen, targetId]);

  // Generate preview when strategy changes
  useEffect(() => {
    if (step === 'allocate' && !previewData) {
      generatePreview();
    }
  }, [step]);

  const checkExistingPlan = async () => {
    setCheckingExisting(true);
    try {
      const response = await fetch(`/api/sustainability/replan/actuals?targetId=${targetId}`);
      const result = await response.json();

      if (response.ok && result.success && result.data && result.data.length > 0) {
        // Existing plan found
        setExistingPlan(result.data);
        setStep('existing');
      } else {
        // No existing plan, start fresh
        setExistingPlan(null);
        setStep('overview');
      }
    } catch (err) {
      console.error('Error checking existing plan:', err);
      // If error, assume no plan exists
      setExistingPlan(null);
      setStep('overview');
    } finally {
      setCheckingExisting(false);
    }
  };

  const fetchFeasibility = async () => {
    setLoadingFeasibility(true);
    try {
      const response = await fetch(
        `/api/sustainability/targets/feasibility?organizationId=${organizationId}&targetId=${targetId}&year=${currentYear}`
      );
      const result = await response.json();

      if (response.ok && result.success) {
        setFeasibilityData(result.feasibility);
      } else {
        console.error('Failed to fetch feasibility:', result.error);
      }
    } catch (err) {
      console.error('Error fetching feasibility:', err);
    } finally {
      setLoadingFeasibility(false);
    }
  };

  const generatePreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sustainability/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          targetId,
          newTargetEmissions: targetEmissions, // Use the target from props (in tCO2e)
          newTargetYear: targetYear,
          allocationStrategy: strategy,
          budgetCap: budgetCap || undefined,
          applyImmediately: false // Preview only
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate preview');
      }

      setPreviewData(result.data);
      setMetricTargets(result.data.metricTargets.map((mt: any) => ({
        metricId: mt.metricId,
        metricName: mt.metricName,
        metricCode: mt.metricCode,
        scope: mt.scope,
        currentAnnualEmissions: mt.currentAnnualEmissions,
        targetAnnualEmissions: mt.targetAnnualEmissions,
        reductionPercent: mt.reductionPercent,
        customReduction: mt.reductionPercent
      })));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyReplanning = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/sustainability/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          targetId,
          newTargetEmissions: targetEmissions, // Use the target from props (in tCO2e)
          newTargetYear: targetYear,
          allocationStrategy: strategy,
          budgetCap: budgetCap || undefined,
          customAllocations: strategy === 'custom'
            ? metricTargets.map(mt => ({
                metricId: mt.metricId,
                reductionPercent: mt.customReduction || mt.reductionPercent
              }))
            : undefined,
          applyImmediately: true
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to apply replanning');
      }


      // Show success step with results
      setAppliedResult(result.data);
      setStep('success');
      // Don't call onReplanComplete() here - let user see results first

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-5xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                Replan Target: {targetName}
              </Dialog.Title>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Adjust your target and automatically recalculate metric-level monthly pathways
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Steps indicator */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-4">
              <StepIndicator active={step === 'overview'} completed={step !== 'overview'} label="1. Overview" />
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600" />
              <StepIndicator active={step === 'allocate'} completed={step === 'review' || step === 'success'} label="2. Allocate" />
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600" />
              <StepIndicator active={step === 'review'} completed={step === 'success'} label="3. Review" />
              <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600" />
              <StepIndicator active={step === 'success'} completed={false} label="4. Complete" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
              </div>
            )}

            {checkingExisting && (
              <div className="text-center py-12">
                <ArrowPathIcon className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Checking for existing plan...</p>
              </div>
            )}

            {!checkingExisting && step === 'existing' && existingPlan && (
              <ExistingPlanStep
                existingPlan={existingPlan}
                onCreateNew={() => {
                  setExistingPlan(null);
                  setStep('overview');
                }}
                onClose={onClose}
                organizationId={organizationId}
              />
            )}

            {!checkingExisting && step === 'overview' && (
              <OverviewStep
                targetName={targetName}
                baselineYear={baselineYear}
                baselineEmissions={baselineEmissions}
                currentYear={currentYear}
                currentEmissions={currentEmissionsTonnes}
                targetYear={targetYear}
                targetEmissions={targetEmissions}
                reductionGap={reductionGap}
                annualReductionRate={annualReductionRate}
                feasibilityColor={feasibilityColor}
                feasibilityData={feasibilityData}
                loadingFeasibility={loadingFeasibility}
              />
            )}

            {step === 'allocate' && (
              <AllocateStep
                strategy={strategy}
                setStrategy={setStrategy}
                budgetCap={budgetCap}
                setBudgetCap={setBudgetCap}
                metricTargets={metricTargets}
                setMetricTargets={setMetricTargets}
                loading={loading}
                previewData={previewData}
                feasibilityData={feasibilityData}
                currentYear={currentYear}
              />
            )}

            {step === 'review' && previewData && (
              <ReviewStep
                previewData={previewData}
                targetYear={targetYear}
                targetEmissions={targetEmissions}
                strategy={strategy}
              />
            )}

            {step === 'success' && appliedResult && (
              <SuccessStep
                result={appliedResult}
                targetYear={targetYear}
                targetEmissions={targetEmissions}
                currentEmissions={currentEmissions}
                baselineEmissions={baselineEmissions}
                baselineYear={baselineYear}
                onClose={onClose}
                organizationId={organizationId}
              />
            )}

            {step === 'success' && !appliedResult && (
              <div className="text-center text-red-500">
                ⚠️ Debug: Success step but no appliedResult data
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            {step !== 'success' && step !== 'existing' && !checkingExisting && (
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
            )}

            {step === 'existing' && (
              <button
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            )}

            <div className={`flex space-x-3 ${step === 'success' || step === 'existing' ? 'ml-auto' : ''}`}>
              {step !== 'overview' && step !== 'success' && (
                <button
                  onClick={() => setStep(step === 'review' ? 'allocate' : 'overview')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
              )}

              {step === 'overview' && (
                <button
                  onClick={() => setStep('allocate')}
                  disabled={reductionGap <= 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Choose Strategy
                </button>
              )}

              {step === 'allocate' && (
                <button
                  onClick={() => setStep('review')}
                  disabled={loading || !previewData}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Next: Review'
                  )}
                </button>
              )}

              {step === 'review' && (
                <button
                  onClick={applyReplanning}
                  disabled={loading}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Apply Replanning
                    </>
                  )}
                </button>
              )}

              {step === 'success' && (
                <button
                  onClick={() => {
                    onReplanComplete();
                    onClose();
                  }}
                  className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <CheckCircleIcon className="w-4 h-4 mr-2" />
                  Close (Add Initiatives Later)
                </button>
              )}
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

// Step Indicator Component
function StepIndicator({ active, completed, label }: { active: boolean; completed: boolean; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
        completed
          ? 'bg-green-500 text-white'
          : active
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
      }`}>
        {completed ? <CheckCircleIcon className="w-6 h-6" /> : label.charAt(0)}
      </div>
      <div className={`text-xs mt-2 font-medium ${
        active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
      }`}>
        {label}
      </div>
    </div>
  );
}

// Step 1: Overview - Show existing target and gap (read-only)
function OverviewStep({
  targetName,
  baselineYear,
  baselineEmissions,
  currentYear,
  currentEmissions,
  targetYear,
  targetEmissions,
  reductionGap,
  annualReductionRate,
  feasibilityColor,
  feasibilityData,
  loadingFeasibility
}: any) {
  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'on-track':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
          text: 'text-green-900 dark:text-green-100',
          icon: '✓',
          label: 'On Track'
        };
      case 'challenging':
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-900 dark:text-yellow-100',
          icon: '⚡',
          label: 'Challenging'
        };
      case 'at-risk':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
          text: 'text-orange-900 dark:text-orange-100',
          icon: '⚠',
          label: 'At Risk'
        };
      case 'impossible':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          text: 'text-red-900 dark:text-red-100',
          icon: '✗',
          label: 'Target Missed'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700',
          text: 'text-gray-900 dark:text-white',
          icon: '?',
          label: 'Unknown'
        };
    }
  };

  const statusBadge = feasibilityData ? getStatusBadge(feasibilityData.status) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Replanning Target: {targetName}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your existing SBTi target needs reallocation across metrics to create actionable monthly pathways
        </p>
      </div>

      {/* Target Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center">
          🎯 Existing Target (SBTi Approved)
        </h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Target Emissions</div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {targetEmissions.toFixed(1)} <span className="text-lg font-normal">tCO2e</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">by {targetYear}</div>
          </div>
          <div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Baseline ({baselineYear})</div>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              {baselineEmissions.toFixed(1)} <span className="text-lg font-normal">tCO2e</span>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {((baselineEmissions - targetEmissions) / baselineEmissions * 100).toFixed(0)}% reduction required
            </div>
          </div>
        </div>
      </div>

      {/* Current State & Gap */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Current Emissions"
          value={currentEmissions.toFixed(1)}
          unit="tCO2e"
          sublabel={`${currentYear} (projected)`}
          color="blue"
        />
        <MetricCard
          label="Gap to Close"
          value={reductionGap > 0 ? reductionGap.toFixed(1) : '0.0'}
          unit="tCO2e"
          sublabel={reductionGap > 0 ? 'Reduction needed' : 'Already achieved'}
          color={reductionGap > 0 ? 'orange' : 'green'}
        />
        <MetricCard
          label="Annual Rate Required"
          value={annualReductionRate.toFixed(1)}
          unit="tCO2e/yr"
          sublabel={`${((annualReductionRate / currentEmissions) * 100).toFixed(1)}% per year`}
          color="gray"
        />
      </div>

      {/* Smart Feasibility Assessment */}
      {loadingFeasibility && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-center">
            <ArrowPathIcon className="w-5 h-5 text-gray-400 animate-spin mr-2" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Calculating feasibility...</span>
          </div>
        </div>
      )}

      {!loadingFeasibility && feasibilityData && statusBadge && (
        <div className={`border-2 rounded-xl p-6 ${statusBadge.bg}`}>
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <span className="text-xl">{statusBadge.icon}</span>
              <span className={statusBadge.text}>
                {currentYear} Target: {statusBadge.label}
              </span>
            </h4>
            {feasibilityData.isAchievable ? (
              <span className="px-2 py-1 bg-green-500/10 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                Achievable
              </span>
            ) : (
              <span className="px-2 py-1 bg-red-500/10 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                Needs Adjustment
              </span>
            )}
          </div>

          {/* YTD Performance */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs opacity-70 mb-1">YTD Actual</div>
              <div className="text-lg font-bold">
                {feasibilityData.ytdActual.toFixed(1)} <span className="text-xs font-normal">tCO2e</span>
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70 mb-1">YTD Target</div>
              <div className="text-lg font-bold">
                {feasibilityData.ytdTarget.toFixed(1)} <span className="text-xs font-normal">tCO2e</span>
              </div>
            </div>
            <div>
              <div className="text-xs opacity-70 mb-1">Variance</div>
              <div className={`text-lg font-bold ${feasibilityData.ytdVariance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {feasibilityData.ytdVariance > 0 ? '+' : ''}{feasibilityData.ytdVariance.toFixed(1)}
                <span className="text-xs font-normal ml-1">
                  ({feasibilityData.ytdVariancePercent > 0 ? '+' : ''}{feasibilityData.ytdVariancePercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Required Adjustment */}
          <div className="bg-white/50 dark:bg-black/20 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs opacity-70 mb-1">Months Remaining</div>
                <div className="text-2xl font-bold">{feasibilityData.monthsRemaining}</div>
              </div>
              <div>
                <div className="text-xs opacity-70 mb-1">Reduction Required</div>
                <div className={`text-2xl font-bold ${
                  feasibilityData.reductionRequiredPercent <= 15 ? 'text-green-600 dark:text-green-400' :
                  feasibilityData.reductionRequiredPercent <= 30 ? 'text-yellow-600 dark:text-yellow-400' :
                  feasibilityData.reductionRequiredPercent <= 50 ? 'text-orange-600 dark:text-orange-400' :
                  'text-red-600 dark:text-red-400'
                }`}>
                  {feasibilityData.reductionRequiredPercent.toFixed(1)}%
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {feasibilityData.requiredMonthlyAvg.toFixed(1)} tCO2e/month (vs {feasibilityData.historicalMonthlyAvg.toFixed(1)} current avg)
                </div>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="text-sm">
            <div className="font-semibold mb-2">💡 Recommendation</div>
            <p className="opacity-90">{feasibilityData.recommendation}</p>
          </div>

          {/* Adjustment Strategy */}
          <div className="mt-4 pt-4 border-t border-current/10">
            <div className="text-xs opacity-70 mb-1">Suggested Strategy</div>
            <div className="text-sm font-medium">
              {feasibilityData.adjustmentStrategy === 'redistribute' && '📊 Redistribute remaining budget across months'}
              {feasibilityData.adjustmentStrategy === 'aggressive' && '🚀 Aggressive catch-up initiatives required'}
              {feasibilityData.adjustmentStrategy === 'adjust-future' && '📅 Adjust future year targets to compensate'}
              {feasibilityData.adjustmentStrategy === 'investigate' && '🔍 Investigate if recent months were anomalies'}
            </div>
          </div>

          {/* Future Year Impact */}
          {feasibilityData.futureYearAdjustment && (
            <div className="mt-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3">
              <div className="text-xs font-semibold text-orange-900 dark:text-orange-100 mb-1">
                ⚠️ Future Year Impact
              </div>
              <div className="text-sm text-orange-800 dark:text-orange-200">
                Spread {feasibilityData.projectedMiss.toFixed(1)} tCO2e deficit across {targetYear - currentYear} remaining years
                (+{feasibilityData.futureYearAdjustment.toFixed(1)} tCO2e per year)
              </div>
            </div>
          )}
        </div>
      )}

      {!loadingFeasibility && !feasibilityData && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">📊 Feasibility Assessment</h4>
          <div className={`text-sm ${feasibilityColor}`}>
            <span className="font-medium">
              {annualReductionRate / currentEmissions < 0.05
                ? '✅ Achievable'
                : annualReductionRate / currentEmissions < 0.10
                ? '⚠️ Ambitious'
                : '❌ Very Aggressive'}
            </span>
            {' - '}
            {annualReductionRate / currentEmissions < 0.05
              ? 'Standard decarbonization measures should suffice'
              : annualReductionRate / currentEmissions < 0.10
              ? 'Requires significant investment and operational changes'
              : 'May require transformational changes and major capital investment'}
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            Replanning will allocate this reduction across all active metrics with monthly trajectories
          </div>
        </div>
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, unit, sublabel, color }: any) {
  const colors = {
    gray: 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color as keyof typeof colors]}`}>
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">
        {value} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">{unit}</span>
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sublabel}</div>
    </div>
  );
}

// Step 2: Allocate Reductions - Smart strategy selection based on feasibility
function AllocateStep({ strategy, setStrategy, budgetCap, setBudgetCap, loading, previewData, feasibilityData, currentYear }: any) {
  // Determine recommended strategies based on feasibility
  const getRecommendedStrategies = () => {
    if (!feasibilityData) {
      return ['equal', 'cost_optimized', 'quick_wins', 'ai_recommended'];
    }

    switch (feasibilityData.adjustmentStrategy) {
      case 'redistribute':
        // On-track or challenging - all strategies work
        return ['equal', 'cost_optimized', 'quick_wins', 'ai_recommended'];

      case 'aggressive':
        // At-risk - prioritize cost and quick wins
        return ['cost_optimized', 'quick_wins', 'ai_recommended', 'equal'];

      case 'adjust-future':
        // Impossible for current year - focus on realistic reallocation
        return ['ai_recommended', 'equal', 'cost_optimized'];

      case 'investigate':
        // Early year anomaly - use balanced approach
        return ['equal', 'ai_recommended', 'cost_optimized'];

      default:
        return ['equal', 'cost_optimized', 'quick_wins', 'ai_recommended'];
    }
  };

  const recommendedStrategies = getRecommendedStrategies();
  const topRecommendation = recommendedStrategies[0];

  // Get strategy guidance message
  const getStrategyGuidance = () => {
    if (!feasibilityData) return null;

    switch (feasibilityData.status) {
      case 'on-track':
        return {
          type: 'success',
          icon: '✓',
          title: 'On Track - Flexible Strategy Selection',
          message: 'You have flexibility to choose any allocation strategy. Consider cost optimization or quick wins to maximize efficiency.'
        };

      case 'challenging':
        return {
          type: 'warning',
          icon: '⚡',
          title: 'Challenging - Strategic Allocation Needed',
          message: `${feasibilityData.reductionRequiredPercent.toFixed(0)}% reduction needed. Focus on strategies that deliver results quickly while managing costs.`
        };

      case 'at-risk':
        return {
          type: 'danger',
          icon: '⚠',
          title: 'At Risk - Aggressive Action Required',
          message: `${feasibilityData.reductionRequiredPercent.toFixed(0)}% reduction needed with only ${feasibilityData.monthsRemaining} months remaining. Prioritize quick wins and cost-effective initiatives.`
        };

      case 'impossible':
        return {
          type: 'critical',
          icon: '✗',
          title: `${currentYear} Target Not Achievable`,
          message: `Already ${Math.abs(feasibilityData.remainingBudget).toFixed(0)} tCO2e over budget. Focus on minimizing overshoot and adjusting future years. Use AI-recommended strategy for optimal reallocation.`
        };

      default:
        return null;
    }
  };

  const guidance = getStrategyGuidance();

  return (
    <div className="space-y-6">
      {/* Feasibility Context */}
      {guidance && (
        <div className={`border-2 rounded-xl p-4 ${
          guidance.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
          guidance.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
          guidance.type === 'danger' ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' :
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
            <span className="text-xl">{guidance.icon}</span>
            <span className={
              guidance.type === 'success' ? 'text-green-900 dark:text-green-100' :
              guidance.type === 'warning' ? 'text-yellow-900 dark:text-yellow-100' :
              guidance.type === 'danger' ? 'text-orange-900 dark:text-orange-100' :
              'text-red-900 dark:text-red-100'
            }>
              {guidance.title}
            </span>
          </h4>
          <p className={`text-sm ${
            guidance.type === 'success' ? 'text-green-700 dark:text-green-300' :
            guidance.type === 'warning' ? 'text-yellow-700 dark:text-yellow-300' :
            guidance.type === 'danger' ? 'text-orange-700 dark:text-orange-300' :
            'text-red-700 dark:text-red-300'
          }`}>
            {guidance.message}
          </p>
        </div>
      )}

      {/* Strategy Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choose Allocation Strategy
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <StrategyCard
            id="equal"
            name="Equal Distribution"
            description="All metrics reduce by same percentage"
            selected={strategy === 'equal'}
            onClick={() => setStrategy('equal')}
            recommended={topRecommendation === 'equal'}
            suitability={
              recommendedStrategies.indexOf('equal') === 0 ? 'optimal' :
              recommendedStrategies.indexOf('equal') <= 2 ? 'suitable' :
              'available'
            }
          />
          <StrategyCard
            id="cost_optimized"
            name="Cost Optimized"
            description="Prioritize cheapest reductions first"
            selected={strategy === 'cost_optimized'}
            onClick={() => setStrategy('cost_optimized')}
            recommended={topRecommendation === 'cost_optimized'}
            suitability={
              recommendedStrategies.indexOf('cost_optimized') === 0 ? 'optimal' :
              recommendedStrategies.indexOf('cost_optimized') <= 2 ? 'suitable' :
              'available'
            }
          />
          <StrategyCard
            id="quick_wins"
            name="Quick Wins"
            description="Fastest implementations first"
            selected={strategy === 'quick_wins'}
            onClick={() => setStrategy('quick_wins')}
            recommended={topRecommendation === 'quick_wins'}
            suitability={
              recommendedStrategies.indexOf('quick_wins') === 0 ? 'optimal' :
              recommendedStrategies.indexOf('quick_wins') <= 2 ? 'suitable' :
              'available'
            }
          />
          <StrategyCard
            id="ai_recommended"
            name="AI Recommended"
            description="ML-optimized allocation"
            selected={strategy === 'ai_recommended'}
            onClick={() => setStrategy('ai_recommended')}
            badge="Beta"
            recommended={topRecommendation === 'ai_recommended'}
            suitability={
              recommendedStrategies.indexOf('ai_recommended') === 0 ? 'optimal' :
              recommendedStrategies.indexOf('ai_recommended') <= 2 ? 'suitable' :
              'available'
            }
          />
        </div>
      </div>

      {/* Time Distribution Options */}
      {feasibilityData && feasibilityData.monthsRemaining > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            📅 Monthly Distribution Pattern
          </h4>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
              <input type="radio" name="distribution" defaultChecked className="w-4 h-4" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Equal Monthly Distribution</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {feasibilityData.requiredMonthlyAvg.toFixed(1)} tCO2e/month for remaining {feasibilityData.monthsRemaining} months
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
              <input type="radio" name="distribution" className="w-4 h-4" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Front-Loaded (Aggressive Early)</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Higher reductions now, ease off later
                </div>
              </div>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer">
              <input type="radio" name="distribution" className="w-4 h-4" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Back-Loaded (Gradual Ramp)</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Build momentum, more aggressive later
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Scenario Comparison */}
      {feasibilityData && feasibilityData.monthsRemaining > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
            📊 Scenario Comparison
          </h4>

          {/* Current Trajectory vs Required */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Historical Avg</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {feasibilityData.historicalMonthlyAvg.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO2e/month (past {feasibilityData.monthsElapsed} months)</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Required Avg</div>
              <div className={`text-2xl font-bold ${
                feasibilityData.reductionRequiredPercent <= 15 ? 'text-green-600 dark:text-green-400' :
                feasibilityData.reductionRequiredPercent <= 30 ? 'text-yellow-600 dark:text-yellow-400' :
                feasibilityData.reductionRequiredPercent <= 50 ? 'text-orange-600 dark:text-orange-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {feasibilityData.requiredMonthlyAvg.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO2e/month (next {feasibilityData.monthsRemaining} months)</div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Difference</div>
              <div className={`text-2xl font-bold ${
                feasibilityData.reductionRequired > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {feasibilityData.reductionRequired > 0 ? '-' : '+'}{Math.abs(feasibilityData.reductionRequired).toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {Math.abs(feasibilityData.reductionRequiredPercent).toFixed(0)}% {feasibilityData.reductionRequired > 0 ? 'reduction' : 'increase'} needed
              </div>
            </div>
          </div>

          {/* Outcome Projections */}
          <div className="space-y-3">
            <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Outcome Projections</h5>

            {/* Continue Current Pace */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-red-500">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-gray-900 dark:text-white">❌ Continue Current Pace</div>
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                  Miss Target
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                If you maintain {feasibilityData.historicalMonthlyAvg.toFixed(1)} tCO2e/month average:
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                  {feasibilityData.projectedAnnualTotal.toFixed(1)} tCO2e
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  (miss by {feasibilityData.projectedMiss.toFixed(1)} tCO2e)
                </span>
              </div>
            </div>

            {/* Adjust and Hit Target */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 ${
              feasibilityData.isAchievable ? 'border-green-500' : 'border-orange-500'
            }`}>
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-gray-900 dark:text-white">
                  {feasibilityData.isAchievable ? '✓' : '⚠'} Adjust to Hit {currentYear} Target
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                  feasibilityData.isAchievable
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                }`}>
                  {feasibilityData.isAchievable ? 'Achievable' : 'Challenging'}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Reduce to {feasibilityData.requiredMonthlyAvg.toFixed(1)} tCO2e/month for remaining months:
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-lg font-bold ${
                  feasibilityData.isAchievable
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {feasibilityData.annualTarget.toFixed(1)} tCO2e
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({feasibilityData.reductionRequiredPercent.toFixed(0)}% reduction required)
                </span>
              </div>
            </div>

            {/* Spread to Future Years (if target missed) */}
            {!feasibilityData.isAchievable && feasibilityData.futureYearAdjustment && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500">
                <div className="flex items-start justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-white">📅 Adjust Future Years</div>
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                    Recommended
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Minimize {currentYear} overshoot and compensate in future years:
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    +{feasibilityData.futureYearAdjustment.toFixed(1)} tCO2e/year
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    additional reduction per year ({currentYear + 1}-{feasibilityData.targetYear})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {previewData && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Preview: {previewData.metricTargets?.length || 0} metrics will be updated
          </h4>
        </div>
      )}
    </div>
  );
}

function StrategyCard({ id, name, description, selected, onClick, badge, recommended, suitability }: any) {
  // Determine badge styling based on suitability
  const getSuitabilityBadge = () => {
    if (recommended) {
      return {
        text: 'Recommended',
        class: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      };
    }

    switch (suitability) {
      case 'optimal':
        return {
          text: 'Optimal',
          class: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
        };
      case 'suitable':
        return {
          text: 'Suitable',
          class: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
        };
      default:
        return null;
    }
  };

  const suitabilityBadge = getSuitabilityBadge();

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 text-left transition-all relative ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : recommended
          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 hover:border-green-600'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="font-medium text-gray-900 dark:text-white">{name}</div>
        <div className="flex gap-1.5">
          {suitabilityBadge && (
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${suitabilityBadge.class}`}>
              {suitabilityBadge.text}
            </span>
          )}
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
      )}
    </button>
  );
}

// Step 3: Review
function ReviewStep({ previewData, targetYear, targetEmissions, strategy }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
          Ready to Apply Replanning
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          This will update {previewData.metricTargets?.length || 0} metric targets with monthly breakdowns from {new Date().getFullYear()} to {targetYear}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Target"
          value={targetEmissions.toFixed(1)}
          unit="tCO2e"
          sublabel={`by ${targetYear} (SBTi)`}
          color="blue"
        />
        <MetricCard
          label="Strategy"
          value={strategy.replace('_', ' ')}
          unit=""
          sublabel="Allocation method"
          color="gray"
        />
        <MetricCard
          label="Initiatives"
          value={previewData.recommendedInitiatives?.length || 0}
          unit="actions"
          sublabel="Recommended"
          color="orange"
        />
      </div>
    </div>
  );
}

// Step 0: Existing Plan - Show existing metrics and allow creating new plan
function ExistingPlanStep({ existingPlan, onCreateNew, onClose, organizationId }: any) {
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleSaveInitiative = async (initiative: {
    name: string;
    description: string;
    estimatedReduction: number;
    estimatedCost?: number;
    timeline?: string;
  }) => {
    if (!selectedMetric) return;

    const response = await fetch('/api/sustainability/replan/initiatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metricTargetId: selectedMetric.id,
        organizationId: organizationId,
        name: initiative.name,
        description: initiative.description,
        estimatedReduction: initiative.estimatedReduction,
        estimatedCost: initiative.estimatedCost,
        timeline: initiative.timeline
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save initiative');
    }

    // Close modal and reset selected metric
    setShowRecommendations(false);
    setSelectedMetric(null);
  };

  return (
    <>
      <RecommendationsModal
        isOpen={showRecommendations}
        onClose={() => {
          setShowRecommendations(false);
          setSelectedMetric(null);
        }}
        metricTarget={selectedMetric}
        organizationId={organizationId}
        onSave={handleSaveInitiative}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                <CheckCircleIcon className="w-6 h-6 mr-2" />
                Existing Replanning Found
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                You already have a replanning with {existingPlan.length} metric targets. You can add initiatives or create a new plan.
              </p>
            </div>
          </div>
        </div>

        {/* Existing Metrics */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Current Metric Targets</h4>
          <div className="space-y-3">
            {existingPlan.map((metric: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between py-3 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{metric.metricName}</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
                      {metric.scope}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {metric.targetEmissions?.toFixed(1) || '0.0'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        tCO2e target (from {metric.baselineEmissions?.toFixed(1) || '0.0'} tCO2e)
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        {metric.targetValue?.toLocaleString() || '0'}
                        {metric.unit && <span className="text-xs ml-1 text-gray-500">{metric.unit}</span>}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        target (from {metric.baselineValue?.toLocaleString() || '0'}{metric.unit ? ` ${metric.unit}` : ''})
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const metricTargetForModal = {
                      id: metric.id,
                      metricName: metric.metricName,
                      metricCode: metric.metricCode,
                      scope: metric.scope,
                      currentAnnualEmissions: metric.baselineEmissions,
                      targetAnnualEmissions: metric.targetEmissions,
                      reductionPercent: metric.baselineEmissions > 0
                        ? ((metric.baselineEmissions - metric.targetEmissions) / metric.baselineEmissions) * 100
                        : 0
                    };
                    setSelectedMetric(metricTargetForModal);
                    setShowRecommendations(true);
                  }}
                  className="flex-shrink-0 ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Add Initiative
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            Create New Plan?
          </h4>
          <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
            Creating a new plan will replace the existing metric targets. This action cannot be undone.
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Create New Replanning
          </button>
        </div>
      </div>
    </>
  );
}

// Step 4: Success - Show results
function SuccessStep({ result, targetYear, targetEmissions, currentEmissions, baselineEmissions, baselineYear, onClose, organizationId }: any) {
  // Use the exact same values from the Targets Dashboard (no recalculation)
  // All values are already in tCO2e from the targets API
  const totalReductionTonnes = result.totalReductionNeeded / 1000; // API returns kg, convert to tCO2e
  const [selectedMetric, setSelectedMetric] = useState<any>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleSaveInitiative = async (initiative: {
    name: string;
    description: string;
    estimatedReduction: number;
    estimatedCost?: number;
    timeline?: string;
  }) => {
    if (!selectedMetric) return;

    const response = await fetch('/api/sustainability/replan/initiatives', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metricTargetId: selectedMetric.id,
        organizationId: organizationId,
        name: initiative.name,
        description: initiative.description,
        estimatedReduction: initiative.estimatedReduction,
        estimatedCost: initiative.estimatedCost,
        timeline: initiative.timeline
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save initiative');
    }

    // Close modal and reset selected metric
    setShowRecommendations(false);
    setSelectedMetric(null);
  };

  return (
    <>
      <RecommendationsModal
        isOpen={showRecommendations}
        onClose={() => {
          setShowRecommendations(false);
          setSelectedMetric(null);
        }}
        metricTarget={selectedMetric}
        organizationId={organizationId}
        onSave={handleSaveInitiative}
      />
    <div className="space-y-6">
      {/* Success Banner */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl p-6 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
          <CheckCircleIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
          Replanning Applied Successfully!
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          {result.metricTargets?.length || 0} metric targets have been updated with monthly pathways to reach your SBTi target.
        </p>
      </div>

      {/* Summary Cards - Use exact same values from Targets Dashboard */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Current Emissions"
          value={currentEmissions.toFixed(1)}
          unit="tCO2e"
          sublabel={`${new Date().getFullYear()} (projected)`}
          color="gray"
        />
        <MetricCard
          label="Target"
          value={targetEmissions.toFixed(1)}
          unit="tCO2e"
          sublabel={`by ${targetYear} (SBTi)`}
          color="blue"
        />
        <MetricCard
          label="Total Reduction"
          value={totalReductionTonnes.toFixed(1)}
          unit="tCO2e"
          sublabel="Allocated across metrics"
          color="green"
        />
      </div>

      {/* Next Steps: Add Initiatives */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center">
          🎯 Next Step: Define Your Initiatives
        </h4>
        <p className="text-sm text-purple-700 dark:text-purple-300 mb-4">
          We've allocated reductions across your metrics. Now describe what you'll do to achieve these targets.
        </p>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
          <div className="space-y-3">
            {result.metricTargets?.map((metric: any, idx: number) => (
              <div key={idx} className="flex items-start justify-between py-3 px-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 dark:text-white truncate">{metric.metricName}</span>
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full whitespace-nowrap">
                      {metric.scope}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {metric.reductionPercent.toFixed(1)}%
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      reduction target ({(metric.currentAnnualEmissions * metric.reductionPercent / 100).toFixed(1)} tCO2e)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Build metric target object for recommendations modal
                    const metricTargetForModal = {
                      id: metric.metricId, // Use metricId, not id
                      metricName: metric.metricName,
                      metricCode: metric.metricCode,
                      scope: metric.scope,
                      currentAnnualEmissions: metric.currentAnnualEmissions,
                      targetAnnualEmissions: metric.targetAnnualEmissions,
                      reductionPercent: metric.reductionPercent
                    };
                    setSelectedMetric(metricTargetForModal);
                    setShowRecommendations(true);
                  }}
                  className="flex-shrink-0 ml-4 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  Add Initiative
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-purple-700 dark:text-purple-300">
          <span>💡</span>
          <p>
            For each metric, describe what you'll actually do. Examples: "Install LED lighting in all offices",
            "Switch to renewable energy provider", "Implement flight booking policy limiting short-haul flights"
          </p>
        </div>
      </div>

      {/* Monte Carlo Results */}
      {result.monteCarloResults && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🎲 Uncertainty Analysis (Monte Carlo Simulation)
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Probability of Success</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {(result.monteCarloResults.probabilityOfSuccess * 100).toFixed(0)}%
              </div>
            </div>
            <div>
              <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Median Projected Emissions</div>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {(result.monteCarloResults.medianOutcome / 1000).toFixed(1)} <span className="text-sm">tCO2e</span>
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">by {targetYear}</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
            Based on {result.monteCarloResults.runs.toLocaleString()} simulation runs
          </div>
        </div>
      )}

      {/* Feasibility */}
      <div className={`rounded-xl p-4 border-2 ${
        result.feasibilityScore > 0.7
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          : result.feasibilityScore > 0.4
          ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
          : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
      }`}>
        <div className="text-sm font-medium">
          <span className="mr-2">
            {result.feasibilityScore > 0.7 ? '✅' : result.feasibilityScore > 0.4 ? '⚠️' : '❌'}
          </span>
          Feasibility Score: {(result.feasibilityScore * 100).toFixed(0)}%
        </div>
        {result.validationWarnings?.length > 0 && (
          <div className="mt-2 text-xs space-y-1">
            {result.validationWarnings.slice(0, 3).map((warning: string, idx: number) => (
              <div key={idx}>⚠️ {warning}</div>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
