'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, SparklesIcon, LightBulbIcon, BanknotesIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { Recommendation } from '@/lib/sustainability/smart-recommendations';

interface RecommendationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  metricTarget: any;
  organizationId: string;
  onSave: (initiative: {
    name: string;
    description: string;
    estimatedReduction: number;
    estimatedCost?: number;
    timeline?: string;
  }) => Promise<void>;
}

export function RecommendationsModal({
  isOpen,
  onClose,
  metricTarget,
  organizationId,
  onSave
}: RecommendationsModalProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [initiativeName, setInitiativeName] = useState('');
  const [initiativeDescription, setInitiativeDescription] = useState('');
  const [estimatedReduction, setEstimatedReduction] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [timeline, setTimeline] = useState('');

  useEffect(() => {
    if (isOpen && metricTarget) {
      fetchRecommendations();
    }
  }, [isOpen, metricTarget, organizationId]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/sustainability/recommendations?organizationId=${organizationId}&metricTargetId=${metricTarget.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch recommendations (${response.status})`);
      }

      if (data.success) {
        setRecommendations(data.data.recommendations);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      setError(error.message || 'Failed to load recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCategory = (rec: Recommendation) => {
    setSelectedCategory(rec);
    // Pre-fill reduction estimate based on recommendation
    setEstimatedReduction((rec.potentialReduction).toFixed(2));
    setEstimatedCost(rec.capex?.toString() || '');
  };

  const handleSave = async () => {
    if (!initiativeName.trim() || !initiativeDescription.trim() || !estimatedReduction) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await onSave({
        name: initiativeName,
        description: initiativeDescription,
        estimatedReduction: parseFloat(estimatedReduction),
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        timeline: timeline || undefined
      });

      // Reset form
      setInitiativeName('');
      setInitiativeDescription('');
      setEstimatedReduction('');
      setEstimatedCost('');
      setTimeline('');
      setSelectedCategory(null);
      onClose();
    } catch (error) {
      console.error('Error saving initiative:', error);
      alert('Failed to save initiative');
    } finally {
      setSaving(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Smart Recommendations</h2>
              <p className="text-sm text-purple-100">{metricTarget.metricName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Failed to Load Recommendations</h3>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">{error}</p>
              <button
                onClick={fetchRecommendations}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Target Context */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowTrendingDownIcon className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Your Target</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Reduction Needed</p>
                    <p className="text-lg font-bold text-purple-600">
                      {metricTarget.reductionPercent?.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current Emissions</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {metricTarget.currentAnnualEmissions?.toFixed(1)} tCO2e
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Target Emissions</p>
                    <p className="text-lg font-bold text-green-600">
                      {metricTarget.targetAnnualEmissions?.toFixed(1)} tCO2e
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                  Recommended Approaches
                </h3>
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCategory?.id === rec.id
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
                      }`}
                      onClick={() => handleSelectCategory(rec)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">{rec.category}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(rec.priority)}`}>
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{rec.reasoning}</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-4 gap-3 mb-3 text-sm">
                        <div className="bg-white dark:bg-gray-800 rounded p-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Potential Reduction</p>
                          <p className="font-bold text-green-600">{rec.potentialReduction.toFixed(1)} tCO2e</p>
                          <p className="text-xs text-gray-500">({rec.potentialReductionPercent.toFixed(0)}% of target)</p>
                        </div>
                        {rec.capex !== undefined && (
                          <div className="bg-white dark:bg-gray-800 rounded p-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Investment</p>
                            <p className="font-bold text-gray-900 dark:text-white">
                              ${rec.capex === 0 ? '0' : (rec.capex / 1000).toFixed(0)}k
                            </p>
                          </div>
                        )}
                        {rec.annualSavings !== undefined && (
                          <div className="bg-white dark:bg-gray-800 rounded p-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Annual Savings</p>
                            <p className="font-bold text-green-600">${(rec.annualSavings / 1000).toFixed(0)}k</p>
                          </div>
                        )}
                        {rec.paybackYears !== undefined && (
                          <div className="bg-white dark:bg-gray-800 rounded p-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Payback</p>
                            <p className="font-bold text-gray-900 dark:text-white">{rec.paybackYears} years</p>
                          </div>
                        )}
                      </div>

                      {/* Examples */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Example Initiatives:</p>
                        <ul className="space-y-1">
                          {rec.examples.slice(0, 3).map((example, idx) => (
                            <li key={idx} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                              <span className="text-purple-500">•</span>
                              <span>{example}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {rec.dataSource && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                          📊 {rec.dataSource}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Initiative Form */}
              {selectedCategory && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-purple-900 dark:text-purple-100">
                    🎯 Describe Your Initiative
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Based on <strong>{selectedCategory.category}</strong>, describe what you'll actually do.
                  </p>

                  <div className="space-y-4">
                    {/* Initiative Name */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Initiative Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={initiativeName}
                        onChange={(e) => setInitiativeName(e.target.value)}
                        placeholder="e.g., Install LED lighting in all offices"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={initiativeDescription}
                        onChange={(e) => setInitiativeDescription(e.target.value)}
                        placeholder="Describe the specific actions you'll take..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    {/* Grid Layout for Numbers */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Est. Reduction (tCO2e) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={estimatedReduction}
                          onChange={(e) => setEstimatedReduction(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Est. Cost ($)
                        </label>
                        <input
                          type="number"
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                          Timeline
                        </label>
                        <input
                          type="text"
                          value={timeline}
                          onChange={(e) => setTimeline(e.target.value)}
                          placeholder="e.g., Q1 2025"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedCategory ? '✅ Category selected. Fill in your initiative details above.' : '👆 Select a recommended category above'}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedCategory || !initiativeName || !initiativeDescription || !estimatedReduction || saving}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {saving ? 'Saving...' : 'Save Initiative'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
