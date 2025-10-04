'use client';

import React, { useState } from 'react';
import { X, Save, Info } from 'lucide-react';

interface GHGProtocolFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  saving?: boolean;
}

export function GHGProtocolForm({ isOpen, onClose, onSave, initialData, saving }: GHGProtocolFormProps) {
  // Organizational Boundary
  const [consolidationApproach, setConsolidationApproach] = useState(
    initialData?.consolidation_approach || 'operational_control'
  );
  const [reportingEntity, setReportingEntity] = useState(
    initialData?.reporting_entity || initialData?.organization_name || ''
  );

  // Operational Boundary
  const allGases = ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6', 'NF3'];
  const [gasesCovered, setGasesCovered] = useState<string[]>(
    initialData?.gases_covered || allGases
  );
  const [gwpStandard, setGwpStandard] = useState(
    initialData?.gwp_standard || 'IPCC AR6'
  );

  // Base Year
  const [baseYear, setBaseYear] = useState(
    initialData?.base_year || new Date().getFullYear()
  );
  const [baseYearRationale, setBaseYearRationale] = useState(
    initialData?.base_year_rationale || ''
  );
  const [recalculationThreshold, setRecalculationThreshold] = useState(
    initialData?.recalculation_threshold || 5.0
  );

  // Reporting Period
  const [periodStart, setPeriodStart] = useState(
    initialData?.period_start || `${new Date().getFullYear()}-01-01`
  );
  const [periodEnd, setPeriodEnd] = useState(
    initialData?.period_end || `${new Date().getFullYear()}-12-31`
  );

  // Assurance
  const [assuranceLevel, setAssuranceLevel] = useState(
    initialData?.assurance_level || 'not_verified'
  );
  const [assuranceProvider, setAssuranceProvider] = useState(
    initialData?.assurance_provider || ''
  );
  const [assuranceStatementUrl, setAssuranceStatementUrl] = useState(
    initialData?.assurance_statement_url || ''
  );

  // Compliance Statement
  const [complianceStatement, setComplianceStatement] = useState(
    initialData?.compliance_statement ||
    'This inventory has been prepared in conformance with the GHG Protocol Corporate Accounting and Reporting Standard (Revised Edition). Scope 2 emissions are reported using both location-based and market-based methods as per the Scope 2 Guidance.'
  );
  const [methodologyDescription, setMethodologyDescription] = useState(
    initialData?.methodology_description ||
    'Emissions calculated using activity-based approach with region and year-specific emission factors from DEFRA, EPA, and IEA. Scope 3 categories screened per GHG Protocol Corporate Value Chain (Scope 3) Standard.'
  );

  // Scope 3
  const scope3Categories = [
    { num: 1, label: 'Purchased goods and services' },
    { num: 2, label: 'Capital goods' },
    { num: 3, label: 'Fuel and energy related activities' },
    { num: 4, label: 'Upstream transportation and distribution' },
    { num: 5, label: 'Waste generated in operations' },
    { num: 6, label: 'Business travel' },
    { num: 7, label: 'Employee commuting' },
    { num: 8, label: 'Upstream leased assets' },
    { num: 9, label: 'Downstream transportation and distribution' },
    { num: 10, label: 'Processing of sold products' },
    { num: 11, label: 'Use of sold products' },
    { num: 12, label: 'End-of-life treatment of sold products' },
    { num: 13, label: 'Downstream leased assets' },
    { num: 14, label: 'Franchises' },
    { num: 15, label: 'Investments' }
  ];

  const [scope3CategoriesIncluded, setScope3CategoriesIncluded] = useState<number[]>(
    initialData?.scope3_categories_included || []
  );
  const [scope3ScreeningRationale, setScope3ScreeningRationale] = useState(
    initialData?.scope3_screening_rationale || ''
  );

  const handleGasToggle = (gas: string) => {
    if (gasesCovered.includes(gas)) {
      setGasesCovered(gasesCovered.filter(g => g !== gas));
    } else {
      setGasesCovered([...gasesCovered, gas]);
    }
  };

  const handleScope3Toggle = (categoryNum: number) => {
    if (scope3CategoriesIncluded.includes(categoryNum)) {
      setScope3CategoriesIncluded(scope3CategoriesIncluded.filter(n => n !== categoryNum));
    } else {
      setScope3CategoriesIncluded([...scope3CategoriesIncluded, categoryNum].sort((a, b) => a - b));
    }
  };

  const handleSave = () => {
    onSave({
      reporting_year: initialData?.reporting_year || new Date().getFullYear(),
      consolidation_approach: consolidationApproach,
      reporting_entity: reportingEntity,
      gases_covered: gasesCovered,
      gwp_standard: gwpStandard,
      base_year: baseYear,
      base_year_rationale: baseYearRationale,
      recalculation_threshold: recalculationThreshold,
      period_start: periodStart,
      period_end: periodEnd,
      assurance_level: assuranceLevel,
      assurance_provider: assuranceProvider || null,
      assurance_statement_url: assuranceStatementUrl || null,
      compliance_statement: complianceStatement,
      methodology_description: methodologyDescription,
      scope3_categories_included: scope3CategoriesIncluded,
      scope3_screening_rationale: scope3ScreeningRationale || null
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#111827] rounded-xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-[#111827] border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between rounded-t-xl">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              GHG Inventory Settings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Configure your GHG Protocol Corporate Standard inventory parameters
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
        <div className="p-6 space-y-8 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Organizational Boundary */}
          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Organizational Boundary
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Consolidation Approach
                </label>
                <select
                  value={consolidationApproach}
                  onChange={(e) => setConsolidationApproach(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="operational_control">Operational Control</option>
                  <option value="financial_control">Financial Control</option>
                  <option value="equity_share">Equity Share</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Reporting Entity
                </label>
                <input
                  type="text"
                  value={reportingEntity}
                  onChange={(e) => setReportingEntity(e.target.value)}
                  placeholder="Organization name"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Operational Boundary */}
          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Operational Boundary
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Gases Covered (Kyoto Protocol)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {allGases.map((gas) => (
                  <label key={gas} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gasesCovered.includes(gas)}
                      onChange={() => handleGasToggle(gas)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{gas}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                GWP Standard
              </label>
              <select
                value={gwpStandard}
                onChange={(e) => setGwpStandard(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="IPCC AR6">IPCC AR6 (Sixth Assessment Report)</option>
                <option value="IPCC AR5">IPCC AR5 (Fifth Assessment Report)</option>
                <option value="IPCC SAR">IPCC SAR (Second Assessment Report)</option>
              </select>
            </div>
          </section>

          {/* Base Year */}
          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Base Year
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Base Year
                </label>
                <input
                  type="number"
                  value={baseYear}
                  onChange={(e) => setBaseYear(parseInt(e.target.value))}
                  min="2000"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Recalculation Threshold (%)
                </label>
                <input
                  type="number"
                  value={recalculationThreshold}
                  onChange={(e) => setRecalculationThreshold(parseFloat(e.target.value))}
                  step="0.1"
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Base Year Rationale
              </label>
              <textarea
                value={baseYearRationale}
                onChange={(e) => setBaseYearRationale(e.target.value)}
                rows={2}
                placeholder="e.g., First complete year of data collection, Year of significant operational change..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </section>

          {/* Reporting Period */}
          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Reporting Period
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Period Start
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Period End
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </section>

          {/* Assurance */}
          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Assurance
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Assurance Level
              </label>
              <select
                value={assuranceLevel}
                onChange={(e) => setAssuranceLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="not_verified">Not Verified</option>
                <option value="limited">Limited Assurance</option>
                <option value="reasonable">Reasonable Assurance</option>
              </select>
            </div>

            {assuranceLevel !== 'not_verified' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Assurance Provider
                  </label>
                  <input
                    type="text"
                    value={assuranceProvider}
                    onChange={(e) => setAssuranceProvider(e.target.value)}
                    placeholder="e.g., PwC, Deloitte, EY..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Assurance Statement URL (optional)
                  </label>
                  <input
                    type="url"
                    value={assuranceStatementUrl}
                    onChange={(e) => setAssuranceStatementUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </>
            )}
          </section>

          {/* Scope 3 Categories */}
          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Scope 3 Categories
            </h4>

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Select the Scope 3 categories relevant to your organization. Categories automatically detected from your data are shown below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              {scope3Categories.map((cat) => (
                <label key={cat.num} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={scope3CategoriesIncluded.includes(cat.num)}
                    onChange={() => handleScope3Toggle(cat.num)}
                    className="mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Category {cat.num}:</span> {cat.label}
                  </span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Scope 3 Screening Rationale (optional)
              </label>
              <textarea
                value={scope3ScreeningRationale}
                onChange={(e) => setScope3ScreeningRationale(e.target.value)}
                rows={2}
                placeholder="Explain why certain categories were included or excluded..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </section>

          {/* Compliance Statement */}
          <section className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              Compliance Statement & Methodology
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Compliance Statement
              </label>
              <textarea
                value={complianceStatement}
                onChange={(e) => setComplianceStatement(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Methodology Description
              </label>
              <textarea
                value={methodologyDescription}
                onChange={(e) => setMethodologyDescription(e.target.value)}
                rows={3}
                placeholder="Describe emission calculation methods, data sources, emission factors used..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white dark:bg-[#111827] border-t border-gray-200 dark:border-gray-700 p-6 flex justify-end gap-3 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
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
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
