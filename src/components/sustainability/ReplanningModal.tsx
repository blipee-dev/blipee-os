'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
  const [step, setStep] = useState<'adjust' | 'allocate' | 'review'>('adjust');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Target adjustment state
  const [newTargetYear, setNewTargetYear] = useState(targetYear);
  const [newReductionPercent, setNewReductionPercent] = useState(
    ((baselineEmissions - targetEmissions) / baselineEmissions) * 100
  );

  // Allocation strategy
  const [strategy, setStrategy] = useState<AllocationStrategy>('equal');
  const [budgetCap, setBudgetCap] = useState<number | null>(null);

  // Metric targets
  const [metricTargets, setMetricTargets] = useState<MetricTarget[]>([]);
  const [previewData, setPreviewData] = useState<any>(null);

  // Calculated values
  const newTargetEmissions = useMemo(() => {
    return baselineEmissions * (1 - newReductionPercent / 100);
  }, [baselineEmissions, newReductionPercent]);

  const reductionGap = useMemo(() => {
    return currentEmissions - newTargetEmissions;
  }, [currentEmissions, newTargetEmissions]);

  const annualReductionRate = useMemo(() => {
    const years = newTargetYear - currentYear;
    return years > 0 ? (reductionGap / years) : 0;
  }, [reductionGap, newTargetYear, currentYear]);

  const feasibilityColor = useMemo(() => {
    const annualRate = (annualReductionRate / currentEmissions) * 100;
    if (annualRate < 5) return 'text-green-500';
    if (annualRate < 10) return 'text-yellow-500';
    return 'text-red-500';
  }, [annualReductionRate, currentEmissions]);

  // Generate preview when strategy changes
  useEffect(() => {
    if (step === 'allocate' && !previewData) {
      generatePreview();
    }
  }, [step]);

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
          newTargetYear,
          newReductionPercent,
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
          newTargetYear,
          newReductionPercent,
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

      onReplanComplete();
      onClose();

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
              <StepIndicator active={step === 'adjust'} completed={step !== 'adjust'} label="1. Adjust Target" />
              <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600" />
              <StepIndicator active={step === 'allocate'} completed={step === 'review'} label="2. Allocate Reductions" />
              <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600" />
              <StepIndicator active={step === 'review'} completed={false} label="3. Review & Apply" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[600px] overflow-y-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800 dark:text-red-300">{error}</div>
              </div>
            )}

            {step === 'adjust' && (
              <AdjustTargetStep
                baselineYear={baselineYear}
                baselineEmissions={baselineEmissions}
                currentYear={currentYear}
                currentEmissions={currentEmissions}
                newTargetYear={newTargetYear}
                setNewTargetYear={setNewTargetYear}
                newReductionPercent={newReductionPercent}
                setNewReductionPercent={setNewReductionPercent}
                newTargetEmissions={newTargetEmissions}
                reductionGap={reductionGap}
                annualReductionRate={annualReductionRate}
                feasibilityColor={feasibilityColor}
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
              />
            )}

            {step === 'review' && previewData && (
              <ReviewStep
                previewData={previewData}
                newTargetYear={newTargetYear}
                newTargetEmissions={newTargetEmissions}
                strategy={strategy}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>

            <div className="flex space-x-3">
              {step !== 'adjust' && (
                <button
                  onClick={() => setStep(step === 'review' ? 'allocate' : 'adjust')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Back
                </button>
              )}

              {step === 'adjust' && (
                <button
                  onClick={() => setStep('allocate')}
                  disabled={reductionGap <= 0}
                  className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next: Allocate Reductions
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

// Step 1: Adjust Target
function AdjustTargetStep({
  baselineYear,
  baselineEmissions,
  currentYear,
  currentEmissions,
  newTargetYear,
  setNewTargetYear,
  newReductionPercent,
  setNewReductionPercent,
  newTargetEmissions,
  reductionGap,
  annualReductionRate,
  feasibilityColor
}: any) {
  return (
    <div className="space-y-6">
      {/* Current State */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Baseline"
          value={baselineEmissions.toFixed(1)}
          unit="tCO2e"
          sublabel={`${baselineYear}`}
          color="gray"
        />
        <MetricCard
          label="Current"
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
      </div>

      {/* Sliders */}
      <div className="space-y-6 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl">
        {/* Target Year Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Target Year: <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{newTargetYear}</span>
          </label>
          <input
            type="range"
            min={currentYear + 1}
            max={2050}
            step={1}
            value={newTargetYear}
            onChange={(e) => setNewTargetYear(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{currentYear + 1}</span>
            <span>2030</span>
            <span>2040</span>
            <span>2050</span>
          </div>
        </div>

        {/* Reduction Percent Slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Reduction Target: <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{newReductionPercent.toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={newReductionPercent}
            onChange={(e) => setNewReductionPercent(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Calculated Impact */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-4">Calculated Impact</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">New Target ({newTargetYear})</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {newTargetEmissions.toFixed(1)} <span className="text-sm font-normal">tCO2e</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">Required Annual Reduction</div>
            <div className={`text-2xl font-bold ${feasibilityColor}`}>
              {annualReductionRate.toFixed(1)} <span className="text-sm font-normal">tCO2e/year</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {((annualReductionRate / currentEmissions) * 100).toFixed(1)}% per year
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-blue-700 dark:text-blue-300">
          💡 <span className="font-medium">Feasibility:</span>{' '}
          {annualReductionRate / currentEmissions < 0.05
            ? '✅ Achievable with standard measures'
            : annualReductionRate / currentEmissions < 0.10
            ? '⚠️ Ambitious - requires significant investment'
            : '❌ Very aggressive - may require transformational changes'}
        </div>
      </div>
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

// Step 2: Allocate Reductions (placeholder for now)
function AllocateStep({ strategy, setStrategy, budgetCap, setBudgetCap, loading, previewData }: any) {
  return (
    <div className="space-y-6">
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
          />
          <StrategyCard
            id="cost_optimized"
            name="Cost Optimized"
            description="Prioritize cheapest reductions first"
            selected={strategy === 'cost_optimized'}
            onClick={() => setStrategy('cost_optimized')}
          />
          <StrategyCard
            id="quick_wins"
            name="Quick Wins"
            description="Fastest implementations first"
            selected={strategy === 'quick_wins'}
            onClick={() => setStrategy('quick_wins')}
          />
          <StrategyCard
            id="ai_recommended"
            name="AI Recommended"
            description="ML-optimized allocation"
            selected={strategy === 'ai_recommended'}
            onClick={() => setStrategy('ai_recommended')}
            badge="Beta"
          />
        </div>
      </div>

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

function StrategyCard({ id, name, description, selected, onClick, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 text-left transition-all ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="font-medium text-gray-900 dark:text-white">{name}</div>
        {badge && (
          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</div>
    </button>
  );
}

// Step 3: Review (placeholder)
function ReviewStep({ previewData, newTargetYear, newTargetEmissions, strategy }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-2">
          Ready to Apply Replanning
        </h3>
        <p className="text-sm text-green-700 dark:text-green-300">
          This will update {previewData.metricTargets?.length || 0} metric targets with monthly breakdowns from {new Date().getFullYear()} to {newTargetYear}.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="New Target"
          value={newTargetEmissions.toFixed(1)}
          unit="tCO2e"
          sublabel={`by ${newTargetYear}`}
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
          value={previewData.initiatives?.length || 0}
          unit="actions"
          sublabel="Recommended"
          color="orange"
        />
      </div>
    </div>
  );
}
