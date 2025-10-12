'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface NewMetric {
  metric_id: string;
  metric_name: string;
  metric_code: string;
  category: string;
  scope: string;
  first_data_date: string;
  data_points_count: number;
  total_emissions: number;
}

interface BaselineRestatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  targetId: string;
  targetName: string;
  originalBaselineYear: number;
  originalBaselineEmissions: number;
  newMetrics: NewMetric[];
  onRestatementCreated?: () => void;
}

export default function BaselineRestatementModal({
  isOpen,
  onClose,
  organizationId,
  targetId,
  targetName,
  originalBaselineYear,
  originalBaselineEmissions,
  newMetrics,
  onRestatementCreated
}: BaselineRestatementModalProps) {
  const [step, setStep] = useState<'review' | 'estimate' | 'confirm' | 'success'>('review');
  const [metricEstimates, setMetricEstimates] = useState<Record<string, {
    estimated_emissions: number;
    estimation_method: string;
    estimation_confidence: string;
    estimation_notes: string;
  }>>({});
  const [restatementReason, setRestatementReason] = useState('');
  const [methodologyNotes, setMethodologyNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize estimates for each metric
    const initialEstimates: typeof metricEstimates = {};
    newMetrics.forEach(metric => {
      initialEstimates[metric.metric_id] = {
        estimated_emissions: 0,
        estimation_method: 'industry_average',
        estimation_confidence: 'medium',
        estimation_notes: ''
      };
    });
    setMetricEstimates(initialEstimates);
  }, [newMetrics]);

  if (!isOpen) return null;

  const updateEstimate = (metricId: string, field: string, value: any) => {
    setMetricEstimates(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        [field]: value
      }
    }));
  };

  const calculateRestatedBaseline = () => {
    const additionalEmissions = Object.values(metricEstimates).reduce(
      (sum, est) => sum + (est.estimated_emissions || 0),
      0
    );
    return originalBaselineEmissions + additionalEmissions;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare new metrics data
      const newMetricsData = newMetrics.map(metric => ({
        metric_id: metric.metric_id,
        metric_name: metric.metric_name,
        metric_code: metric.metric_code,
        category: metric.category,
        scope: metric.scope,
        estimated_emissions: metricEstimates[metric.metric_id]?.estimated_emissions || 0,
        estimation_method: metricEstimates[metric.metric_id]?.estimation_method || 'industry_average',
        estimation_confidence: metricEstimates[metric.metric_id]?.estimation_confidence || 'medium',
        estimation_notes: metricEstimates[metric.metric_id]?.estimation_notes || '',
        started_tracking_date: metric.first_data_date,
        first_data_entry_date: metric.first_data_date
      }));

      const response = await fetch('/api/sustainability/baseline/restatements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          targetId,
          restatementReason,
          restatementType: 'scope_expansion',
          originalBaselineYear,
          originalBaselineEmissions,
          newMetrics: newMetricsData,
          methodologyNotes,
          supportingDocuments: []
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create restatement');
      }

      setStep('success');
      if (onRestatementCreated) {
        onRestatementCreated();
      }

    } catch (err: any) {
      console.error('Error creating restatement:', err);
      setError(err.message || 'Failed to create baseline restatement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const restatedBaseline = calculateRestatedBaseline();
  const restatementDelta = restatedBaseline - originalBaselineEmissions;
  const restatementPercent = (restatementDelta / originalBaselineEmissions) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <ExclamationTriangleIcon className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Baseline Restatement Required
            </h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            New metrics detected that were not in your {originalBaselineYear} baseline.
            SBTi recommends restating your baseline to include historical estimates.
          </p>
        </div>

        {/* Step: Review New Metrics */}
        {step === 'review' && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                {newMetrics.length} New Metric{newMetrics.length > 1 ? 's' : ''} Detected
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                These metrics started being tracked after your baseline year ({originalBaselineYear}).
                To maintain accurate progress tracking, we need to restate your baseline.
              </p>
            </div>

            <div className="space-y-3">
              {newMetrics.map(metric => (
                <div
                  key={metric.metric_id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {metric.metric_name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {metric.category} • Started tracking: {metric.first_data_date}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {metric.data_points_count} data points
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('estimate')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Continue to Estimation
              </button>
            </div>
          </div>
        )}

        {/* Step: Estimate Historical Emissions */}
        {step === 'estimate' && (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                Estimate Historical Emissions
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Provide estimates for what these metrics would have been in {originalBaselineYear}.
                Use industry averages, extrapolation, or proxy data.
              </p>
            </div>

            <div className="space-y-6">
              {newMetrics.map(metric => (
                <div
                  key={metric.metric_id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {metric.metric_name}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimated {originalBaselineYear} Emissions (tCO2e)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={metricEstimates[metric.metric_id]?.estimated_emissions || 0}
                        onChange={(e) => updateEstimate(metric.metric_id, 'estimated_emissions', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimation Method
                      </label>
                      <select
                        value={metricEstimates[metric.metric_id]?.estimation_method || 'industry_average'}
                        onChange={(e) => updateEstimate(metric.metric_id, 'estimation_method', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      >
                        <option value="industry_average">Industry Average</option>
                        <option value="extrapolation">Extrapolation</option>
                        <option value="proxy_data">Proxy Data</option>
                        <option value="direct_calculation">Direct Calculation</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confidence Level
                      </label>
                      <select
                        value={metricEstimates[metric.metric_id]?.estimation_confidence || 'medium'}
                        onChange={(e) => updateEstimate(metric.metric_id, 'estimation_confidence', e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estimation Notes
                      </label>
                      <textarea
                        value={metricEstimates[metric.metric_id]?.estimation_notes || ''}
                        onChange={(e) => updateEstimate(metric.metric_id, 'estimation_notes', e.target.value)}
                        placeholder="Explain how you arrived at this estimate..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep('review')}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Continue to Confirmation
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm Restatement */}
        {step === 'confirm' && (
          <div className="space-y-6">
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">
                Review Baseline Restatement
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-400">
                Confirm the new baseline before applying changes to your target.
              </p>
            </div>

            {/* Baseline comparison */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Original Baseline ({originalBaselineYear})
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {originalBaselineEmissions.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">tCO2e</div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">
                  Additional Emissions
                </div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  +{restatementDelta.toFixed(1)}
                </div>
                <div className="text-xs text-blue-500">tCO2e ({restatementPercent.toFixed(1)}%)</div>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400 mb-1">
                  Restated Baseline
                </div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-300">
                  {restatedBaseline.toFixed(1)}
                </div>
                <div className="text-xs text-green-500">tCO2e</div>
              </div>
            </div>

            {/* Restatement reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Restatement Reason *
              </label>
              <input
                type="text"
                value={restatementReason}
                onChange={(e) => setRestatementReason(e.target.value)}
                placeholder="e.g., Added Water and Waste metrics to scope"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                required
              />
            </div>

            {/* Methodology notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Methodology Notes (Optional)
              </label>
              <textarea
                value={methodologyNotes}
                onChange={(e) => setMethodologyNotes(e.target.value)}
                placeholder="Describe the methodology used for historical estimates..."
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <button
                onClick={() => setStep('estimate')}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !restatementReason.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Restatement...' : 'Create Restatement'}
              </button>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && (
          <div className="space-y-6 text-center py-8">
            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Baseline Restatement Created
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your baseline restatement has been saved as a draft. Review and approve it to apply
              the changes to your sustainability target.
            </p>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Restated Baseline
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {restatedBaseline.toFixed(1)} tCO2e
              </div>
              <div className="text-sm text-gray-500 mt-1">
                +{restatementDelta.toFixed(1)} tCO2e from {originalBaselineEmissions.toFixed(1)} tCO2e
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
