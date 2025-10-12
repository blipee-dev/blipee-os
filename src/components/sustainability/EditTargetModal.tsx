'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  AlertCircle,
  Info,
  Target as TargetIcon,
  Calendar,
  TrendingDown
} from 'lucide-react';

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  target: {
    id: string;
    name: string;
    target_type: 'near-term' | 'long-term' | 'net-zero';
    scope_coverage?: string[];
    baseline_year: number;
    baseline_emissions: number;
    target_year: number;
    target_emissions: number;
    reduction_percentage?: number;
  };
  onSave: () => void;
}

export default function EditTargetModal({
  isOpen,
  onClose,
  organizationId,
  target,
  onSave
}: EditTargetModalProps) {
  const [formData, setFormData] = useState({
    name: target.name,
    baseline_year: target.baseline_year,
    baseline_emissions: target.baseline_emissions,
    target_year: target.target_year,
    reduction_percentage: target.reduction_percentage ||
      ((target.baseline_emissions - target.target_emissions) / target.baseline_emissions * 100),
    scope_1: target.scope_coverage?.includes('scope_1') || false,
    scope_2: target.scope_coverage?.includes('scope_2') || false,
    scope_3: target.scope_coverage?.includes('scope_3') || false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  // Calculate target emissions based on reduction percentage
  const calculatedTargetEmissions = formData.baseline_emissions *
    (1 - formData.reduction_percentage / 100);

  // Validate form
  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Target name is required';
    }

    if (formData.baseline_year >= formData.target_year) {
      newErrors.target_year = 'Target year must be after baseline year';
    }

    if (formData.baseline_emissions <= 0) {
      newErrors.baseline_emissions = 'Baseline emissions must be greater than 0';
    }

    if (formData.reduction_percentage < 0 || formData.reduction_percentage > 100) {
      newErrors.reduction_percentage = 'Reduction must be between 0% and 100%';
    }

    // SBTi validation for near-term targets
    if (target.target_type === 'near-term' && formData.reduction_percentage < 42) {
      newErrors.reduction_percentage = 'Near-term targets require at least 42% reduction (SBTi 1.5°C pathway)';
    }

    // Long-term target validation
    if (target.target_type === 'long-term' && formData.reduction_percentage < 90) {
      newErrors.reduction_percentage = 'Long-term targets require at least 90% reduction by 2050';
    }

    if (!formData.scope_1 && !formData.scope_2 && !formData.scope_3) {
      newErrors.scopes = 'At least one scope must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const scopeCoverage = [];
      if (formData.scope_1) scopeCoverage.push('scope_1');
      if (formData.scope_2) scopeCoverage.push('scope_2');
      if (formData.scope_3) scopeCoverage.push('scope_3');

      const response = await fetch(`/api/sustainability/targets/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          name: formData.name,
          baseline_year: formData.baseline_year,
          baseline_value: formData.baseline_emissions,
          target_year: formData.target_year,
          target_value: calculatedTargetEmissions,
          scopes: scopeCoverage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update target');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating target:', error);
      setErrors({ submit: 'Failed to save changes. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-gray-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Edit Target
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {target.target_type === 'near-term' ? 'Near-Term (2030)' :
                   target.target_type === 'long-term' ? 'Long-Term (2050)' : 'Net-Zero (2050)'} Target
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Target Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                  placeholder="e.g., SBTi Near-Term Target"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Baseline Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Baseline
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Baseline Year
                    </label>
                    <input
                      type="number"
                      value={formData.baseline_year}
                      onChange={(e) => setFormData({ ...formData, baseline_year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                      min="2015"
                      max={new Date().getFullYear()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Baseline Emissions (tCO2e)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.baseline_emissions}
                      onChange={(e) => setFormData({ ...formData, baseline_emissions: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                      min="0"
                    />
                    {errors.baseline_emissions && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.baseline_emissions}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Target Section */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <TargetIcon className="w-5 h-5 text-green-500" />
                  Target
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Target Year
                    </label>
                    <input
                      type="number"
                      value={formData.target_year}
                      onChange={(e) => setFormData({ ...formData, target_year: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                      min={formData.baseline_year + 1}
                      max="2050"
                    />
                    {errors.target_year && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.target_year}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Reduction Target (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.reduction_percentage}
                      onChange={(e) => setFormData({ ...formData, reduction_percentage: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white"
                      min="0"
                      max="100"
                    />
                    {errors.reduction_percentage && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.reduction_percentage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Calculated Target Emissions */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Target Emissions:</span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      {calculatedTargetEmissions.toFixed(1)} tCO2e
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Total Reduction:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {(formData.baseline_emissions - calculatedTargetEmissions).toFixed(1)} tCO2e
                    </span>
                  </div>
                </div>
              </div>

              {/* Scope Coverage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Scope Coverage
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.scope_1}
                      onChange={(e) => setFormData({ ...formData, scope_1: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Scope 1</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Direct emissions from owned sources</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.scope_2}
                      onChange={(e) => setFormData({ ...formData, scope_2: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Scope 2</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Indirect emissions from purchased energy</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.scope_3}
                      onChange={(e) => setFormData({ ...formData, scope_3: e.target.checked })}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">Scope 3</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Indirect emissions from value chain</div>
                    </div>
                  </label>
                </div>
                {errors.scopes && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.scopes}
                  </p>
                )}
              </div>

              {/* Info Banner */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-1">About Editing Targets</p>
                    <ul className="text-blue-800 dark:text-blue-300 space-y-1 text-xs">
                      <li>• Updating baseline or target values will recalculate your trajectory</li>
                      <li>• Existing replanning data and initiatives will remain unchanged</li>
                      <li>• You may need to replan after making significant changes</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Error */}
              {errors.submit && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{errors.submit}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
