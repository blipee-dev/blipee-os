'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  title: string;
  children: React.ReactNode;
  saving?: boolean;
}

function FormModal({ isOpen, onClose, onSave, title, children, saving }: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="sticky bottom-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700 p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// E1-1: Transition Plan Form
interface TransitionPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  saving?: boolean;
}

export function TransitionPlanForm({ isOpen, onClose, onSave, initialData, saving }: TransitionPlanFormProps) {
  const [levers, setLevers] = useState<string[]>(initialData?.decarbonization_levers || ['']);
  const [targetAlignment, setTargetAlignment] = useState(initialData?.target_alignment || '');
  const [resourceAllocation, setResourceAllocation] = useState(initialData?.resource_allocation || '');

  const handleSave = () => {
    onSave({
      transition_plan: {
        decarbonization_levers: levers.filter(l => l.trim()),
        target_alignment: targetAlignment,
        resource_allocation: resourceAllocation,
        last_updated: new Date().toISOString()
      }
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSave={handleSave} title="E1-1: Transition Plan" saving={saving}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Decarbonization Levers
          </label>
          {levers.map((lever, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={lever}
                onChange={(e) => {
                  const newLevers = [...levers];
                  newLevers[index] = e.target.value;
                  setLevers(newLevers);
                }}
                placeholder="e.g., Energy efficiency improvements"
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
              <button
                onClick={() => setLevers(levers.filter((_, i) => i !== index))}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setLevers([...levers, ''])}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add lever
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Target Alignment (Paris Agreement, SBTi, etc.)
          </label>
          <textarea
            value={targetAlignment}
            onChange={(e) => setTargetAlignment(e.target.value)}
            rows={3}
            placeholder="Describe how your transition plan aligns with climate targets"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Resource Allocation
          </label>
          <textarea
            value={resourceAllocation}
            onChange={(e) => setResourceAllocation(e.target.value)}
            rows={3}
            placeholder="Describe financial and human resources allocated to the transition"
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </FormModal>
  );
}

// E1-2: Policies Form
interface PoliciesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any[];
  saving?: boolean;
}

export function PoliciesForm({ isOpen, onClose, onSave, initialData, saving }: PoliciesFormProps) {
  const [policies, setPolicies] = useState(initialData || [{ policy_name: '', description: '', scope: [] }]);

  const handleSave = () => {
    onSave({
      climate_policies: policies.filter(p => p.policy_name.trim())
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSave={handleSave} title="E1-2: Climate Policies" saving={saving}>
      <div className="space-y-4">
        {policies.map((policy, index) => (
          <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <h4 className="font-medium text-gray-900 dark:text-white">Policy {index + 1}</h4>
              {policies.length > 1 && (
                <button
                  onClick={() => setPolicies(policies.filter((_, i) => i !== index))}
                  className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={policy.policy_name}
              onChange={(e) => {
                const newPolicies = [...policies];
                newPolicies[index].policy_name = e.target.value;
                setPolicies(newPolicies);
              }}
              placeholder="Policy name"
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
            <textarea
              value={policy.description}
              onChange={(e) => {
                const newPolicies = [...policies];
                newPolicies[index].description = e.target.value;
                setPolicies(newPolicies);
              }}
              placeholder="Policy description"
              rows={2}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Scope Coverage</label>
              <div className="flex flex-wrap gap-2">
                {['Scope 1', 'Scope 2', 'Scope 3'].map(scope => (
                  <label key={scope} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={policy.scope.includes(scope)}
                      onChange={(e) => {
                        const newPolicies = [...policies];
                        if (e.target.checked) {
                          newPolicies[index].scope = [...newPolicies[index].scope, scope];
                        } else {
                          newPolicies[index].scope = newPolicies[index].scope.filter(s => s !== scope);
                        }
                        setPolicies(newPolicies);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{scope}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={() => setPolicies([...policies, { policy_name: '', description: '', scope: [] }])}
          className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Add another policy
        </button>
      </div>
    </FormModal>
  );
}

// E1-8: Carbon Pricing Form (simpler example)
interface CarbonPricingFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: { price: number; currency: string };
  saving?: boolean;
}

export function CarbonPricingForm({ isOpen, onClose, onSave, initialData, saving }: CarbonPricingFormProps) {
  const [price, setPrice] = useState(initialData?.price || 0);
  const [currency, setCurrency] = useState(initialData?.currency || '€');

  const handleSave = () => {
    onSave({
      carbon_price_used: price,
      carbon_price_currency: currency
    });
  };

  return (
    <FormModal isOpen={isOpen} onClose={onClose} onSave={handleSave} title="E1-8: Internal Carbon Pricing" saving={saving}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
            Internal Carbon Price (per tonne CO₂e)
          </label>
          <div className="flex gap-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <option value="€">€ EUR</option>
              <option value="$">$ USD</option>
              <option value="£">£ GBP</option>
            </select>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value))}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
            />
          </div>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Internal carbon pricing helps guide investment decisions and incentivize emissions reductions across your organization.
          </p>
        </div>
      </div>
    </FormModal>
  );
}
