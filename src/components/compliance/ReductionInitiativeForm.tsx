'use client';

import React, { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';

interface ReductionInitiativeFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  saving?: boolean;
}

export function ReductionInitiativeForm({
  isOpen,
  onClose,
  onSave,
  initialData,
  saving
}: ReductionInitiativeFormProps) {
  const [initiativeName, setInitiativeName] = useState(initialData?.initiative_name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || 'Energy Efficiency');
  const [reductionTco2e, setReductionTco2e] = useState(initialData?.reduction_tco2e || '');
  const [costEur, setCostEur] = useState(initialData?.cost_eur || '');
  const [costSavingsEur, setCostSavingsEur] = useState(initialData?.cost_savings_eur || '');
  const [implementationYear, setImplementationYear] = useState(
    initialData?.implementation_year || new Date().getFullYear()
  );
  const [startDate, setStartDate] = useState(initialData?.start_date || '');
  const [completionDate, setCompletionDate] = useState(initialData?.completion_date || '');
  const [status, setStatus] = useState(initialData?.status || 'planned');
  const [scopes, setScopes] = useState<string[]>(initialData?.scopes || []);
  const [verified, setVerified] = useState(initialData?.verified || false);
  const [verificationMethod, setVerificationMethod] = useState(initialData?.verification_method || '');

  const categories = [
    'Energy Efficiency',
    'Renewable Energy',
    'Process Optimization',
    'Transport & Fleet',
    'Waste Management',
    'Buildings & Facilities',
    'Supply Chain',
    'Behavioral Change',
    'Other'
  ];

  const scopeOptions = [
    { value: 'scope_1', label: 'Scope 1 (Direct)' },
    { value: 'scope_2', label: 'Scope 2 (Indirect Energy)' },
    { value: 'scope_3', label: 'Scope 3 (Value Chain)' }
  ];

  const handleScopeToggle = (scope: string) => {
    if (scopes.includes(scope)) {
      setScopes(scopes.filter(s => s !== scope));
    } else {
      setScopes([...scopes, scope]);
    }
  };

  const handleSubmit = () => {
    const formData: any = {
      initiative_name: initiativeName,
      description: description || null,
      category,
      reduction_tco2e: parseFloat(reductionTco2e),
      cost_eur: costEur ? parseFloat(costEur) : null,
      cost_savings_eur: costSavingsEur ? parseFloat(costSavingsEur) : null,
      implementation_year: implementationYear,
      start_date: startDate || null,
      completion_date: completionDate || null,
      status,
      scopes,
      verified,
      verification_method: verificationMethod || null
    };

    // Include ID if editing existing initiative
    if (initialData?.id) {
      formData.id = initialData.id;
    }

    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {initialData ? 'Edit' : 'Add'} Reduction Initiative
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track emission reduction projects and their impact
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Basic Information
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Initiative Name *
              </label>
              <input
                type="text"
                value={initiativeName}
                onChange={(e) => setInitiativeName(e.target.value)}
                placeholder="e.g., LED Lighting Upgrade, Solar Panel Installation"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe the initiative and its expected impact..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </section>

          {/* Impact Metrics */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Impact Metrics
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Annual Emission Reduction (tCO₂e) *
              </label>
              <input
                type="number"
                value={reductionTco2e}
                onChange={(e) => setReductionTco2e(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Implementation Cost (€)
                </label>
                <input
                  type="number"
                  value={costEur}
                  onChange={(e) => setCostEur(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Annual Cost Savings (€)
                </label>
                <input
                  type="number"
                  value={costSavingsEur}
                  onChange={(e) => setCostSavingsEur(e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Scope Coverage
              </label>
              <div className="space-y-2">
                {scopeOptions.map(option => (
                  <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={scopes.includes(option.value)}
                      onChange={() => handleScopeToggle(option.value)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </section>

          {/* Timeline */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Timeline
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Implementation Year *
              </label>
              <input
                type="number"
                value={implementationYear}
                onChange={(e) => setImplementationYear(parseInt(e.target.value))}
                min="2000"
                max="2100"
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Completion Date
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Verification */}
          <section className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Verification
            </h4>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={verified}
                  onChange={(e) => setVerified(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Reduction impact has been verified</span>
              </label>
            </div>

            {verified && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Verification Method
                </label>
                <input
                  type="text"
                  value={verificationMethod}
                  onChange={(e) => setVerificationMethod(e.target.value)}
                  placeholder="e.g., Third-party audit, Metered data, Engineering calculation"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !initiativeName || !reductionTco2e}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {initialData ? 'Update' : 'Create'} Initiative
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
