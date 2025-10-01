'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Info,
  AlertTriangle,
  Leaf,
  Factory,
  Zap,
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TargetSettingWizardProps {
  onClose: () => void;
  onSave: () => void;
}

export function TargetSettingWizard({ onClose, onSave }: TargetSettingWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [formData, setFormData] = useState({
    target_name: '',
    target_type: 'near-term',
    target_scope: 'all_scopes',
    baseline_year: new Date().getFullYear() - 2,
    baseline_emissions: 0,
    target_year: new Date().getFullYear() + 5,
    target_reduction_percent: 42, // SBTi 1.5C aligned
    sbti_ambition: '1.5C',
    methodology: 'SBTi',
    sectors: [] as string[],
    facilities: [] as string[]
  });

  // Fetch baseline emissions from existing data when component mounts
  useEffect(() => {
    const fetchBaselineEmissions = async () => {
      setLoadingBaseline(true);
      try {
        const response = await fetch('/api/sustainability/targets/current-emissions', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'same-origin', // Ensure cookies are sent
        });

        if (response.ok) {
          const data = await response.json();

          if (data.total > 0) {
            // Convert from kg to tonnes (divide by 1000)
            const baselineInTonnes = data.total / 1000;
            setFormData(prev => ({
              ...prev,
              baseline_emissions: parseFloat(baselineInTonnes.toFixed(2))
            }));
          }
        } else {
          // Silently handle errors - user can still enter baseline manually
          // Only log errors for debugging purposes
          if (response.status !== 401) {
            console.error('Failed to fetch baseline emissions:', response.status);
          }
        }
      } catch (error) {
        // Silently handle network errors
        console.error('Error fetching baseline emissions:', error);
      } finally {
        setLoadingBaseline(false);
      }
    };

    // Add a small delay to ensure auth context is ready
    const timeoutId = setTimeout(fetchBaselineEmissions, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  const steps = [
    { id: 1, title: 'Target Type', description: 'Choose your sustainability target' },
    { id: 2, title: 'Baseline', description: 'Set your baseline emissions' },
    { id: 3, title: 'Ambition', description: 'Define your reduction goals' },
    { id: 4, title: 'Scope', description: 'Select emissions scope' },
    { id: 5, title: 'Review', description: 'Confirm your target' }
  ];

  const targetTypes = [
    {
      value: 'near-term',
      label: 'Near-term Target',
      description: '5-10 year science-based target',
      icon: <Target className="w-6 h-6" />,
      recommended: true
    },
    {
      value: 'net-zero',
      label: 'Net-Zero Target',
      description: 'Long-term net-zero by 2050',
      icon: <Leaf className="w-6 h-6" />
    },
    {
      value: 'renewable-energy',
      label: 'Renewable Energy',
      description: '100% renewable electricity',
      icon: <Zap className="w-6 h-6" />
    },
    {
      value: 'supplier-engagement',
      label: 'Supplier Engagement',
      description: 'Supply chain emissions reduction',
      icon: <Users className="w-6 h-6" />
    }
  ];

  const ambitionLevels = [
    {
      value: '1.5C',
      label: '1.5°C Aligned',
      reduction: 42,
      description: 'Minimum 4.2% annual reduction',
      recommended: true
    },
    {
      value: 'well-below-2C',
      label: 'Well Below 2°C',
      reduction: 25,
      description: 'Minimum 2.5% annual reduction'
    },
    {
      value: 'net-zero',
      label: 'Net-Zero',
      reduction: 90,
      description: '90% reduction by 2050'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/sustainability/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_emissions: formData.baseline_emissions * (1 - formData.target_reduction_percent / 100),
          target_status: 'draft'
        })
      });

      if (!response.ok) throw new Error('Failed to create target');

      toast.success('Target created successfully');
      onSave();
    } catch (error) {
      console.error('Error creating target:', error);
      toast.error('Failed to create target');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Target Type
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {targetTypes.map(type => (
                <motion.button
                  key={type.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData({ ...formData, target_type: type.value })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.target_type === type.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-white/[0.05] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={formData.target_type === type.value ? 'text-green-500' : 'text-gray-500'}>
                      {type.icon}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {type.label}
                        </span>
                        {type.recommended && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Set Baseline Emissions
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Name
              </label>
              <input
                type="text"
                value={formData.target_name}
                onChange={(e) => setFormData({ ...formData, target_name: e.target.value })}
                placeholder="e.g., 2030 Near-term Science-based Target"
                className="w-full px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Baseline Year
                </label>
                <select
                  value={formData.baseline_year}
                  onChange={(e) => setFormData({ ...formData, baseline_year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Baseline Emissions (tCO2e)
                  {formData.baseline_emissions > 0 && !loadingBaseline && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Auto-populated from your data
                    </span>
                  )}
                  {formData.baseline_emissions === 0 && !loadingBaseline && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      Enter manually or add emissions data first
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.baseline_emissions}
                    onChange={(e) => setFormData({ ...formData, baseline_emissions: parseFloat(e.target.value) })}
                    placeholder={loadingBaseline ? "Loading..." : "0"}
                    disabled={loadingBaseline}
                    className={`w-full px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 ${
                      loadingBaseline ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />
                  {loadingBaseline && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    {formData.baseline_emissions > 0
                      ? `Baseline automatically calculated from your organization's emissions data: ${formData.baseline_emissions.toFixed(2)} tCO2e. You can adjust this value if needed.`
                      : 'Enter your baseline emissions manually, or add emissions data to your organization first for automatic calculation. SBTi requires at least 95% coverage of Scope 1 & 2 emissions.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Define Your Ambition
            </h3>

            <div className="space-y-3">
              {ambitionLevels.map(level => (
                <motion.button
                  key={level.value}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => setFormData({
                    ...formData,
                    sbti_ambition: level.value,
                    target_reduction_percent: level.reduction
                  })}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    formData.sbti_ambition === level.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-white/[0.05] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {level.label}
                        </span>
                        {level.recommended && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {level.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {level.reduction}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        reduction
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Year
                </label>
                <select
                  value={formData.target_year}
                  onChange={(e) => setFormData({ ...formData, target_year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {Array.from({ length: 26 }, (_, i) => new Date().getFullYear() + 5 + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reduction (%)
                </label>
                <input
                  type="number"
                  value={formData.target_reduction_percent}
                  onChange={(e) => setFormData({ ...formData, target_reduction_percent: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {formData.baseline_emissions > 0 && (
              <div className="p-4 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">Target Emissions</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(formData.baseline_emissions * (1 - formData.target_reduction_percent / 100)).toFixed(0)} tCO2e
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Annual Reduction Rate</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    {(formData.target_reduction_percent / (formData.target_year - formData.baseline_year)).toFixed(1)}%/year
                  </span>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Select Emissions Scope
            </h3>

            <div className="space-y-3">
              {[
                { value: 'scope_1', label: 'Scope 1', description: 'Direct emissions from owned sources' },
                { value: 'scope_2', label: 'Scope 2', description: 'Indirect emissions from purchased energy' },
                { value: 'scope_3', label: 'Scope 3', description: 'All other indirect emissions' },
                { value: 'scope_1_2', label: 'Scope 1 & 2', description: 'Direct and energy indirect' },
                { value: 'all_scopes', label: 'All Scopes', description: 'Comprehensive coverage (Recommended)' }
              ].map(scope => (
                <button
                  key={scope.value}
                  onClick={() => setFormData({ ...formData, target_scope: scope.value })}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    formData.target_scope === scope.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-white/[0.05] hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {scope.label}
                      </span>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {scope.description}
                      </p>
                    </div>
                    {formData.target_scope === scope.value && (
                      <Check className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    SBTi requires Scope 3 targets if they represent more than 40% of total emissions.
                    At minimum, 67% of Scope 3 emissions must be covered.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Review Your Target
            </h3>

            <div className="bg-gray-50 dark:bg-white/[0.02] rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Target Name</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.target_name || 'Unnamed Target'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {formData.target_type.replace('-', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Baseline</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.baseline_emissions} tCO2e ({formData.baseline_year})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Target</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {(formData.baseline_emissions * (1 - formData.target_reduction_percent / 100)).toFixed(0)} tCO2e ({formData.target_year})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reduction</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.target_reduction_percent}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Ambition</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formData.sbti_ambition} aligned
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Scope</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                  {formData.target_scope.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-300">
                    Ready to Create Target
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">
                    Your target aligns with SBTi criteria and can be submitted for validation
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-[#212121] rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/[0.05]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Create Sustainability Target
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center mt-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : currentStep === step.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-2 ${
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {steps[currentStep - 1].description}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-white/[0.05] flex items-center justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <span className="text-sm text-gray-500">
              Step {currentStep} of {steps.length}
            </span>

            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Target
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}