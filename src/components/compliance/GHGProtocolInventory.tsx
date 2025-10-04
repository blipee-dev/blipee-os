'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Calendar,
  CheckCircle2,
  Edit,
  Globe,
  Info,
  Shield,
  TrendingDown
} from 'lucide-react';
import { GHGProtocolForm } from './GHGProtocolForm';

interface GHGInventoryData {
  reporting_year: number;
  organization_name: string;
  consolidation_approach: string;
  reporting_entity: string;
  gases_covered: string[];
  gwp_standard: string;
  base_year: number;
  base_year_rationale: string;
  recalculation_threshold: number;
  base_year_emissions: {
    scope_1: number;
    scope_2: number;
    scope_3: number;
    total: number;
  } | null;
  period_start: string;
  period_end: string;
  assurance_level: string;
  assurance_provider: string | null;
  assurance_statement_url: string | null;
  compliance_statement: string;
  methodology_description: string;
  scope3_categories_included: number[];
  scope3_categories_in_data: string[];
  scope3_screening_rationale: string | null;
  emissions: {
    scope_1_gross: number;
    scope_2_location_based: number;
    scope_2_market_based: number;
    scope_3_gross: number;
    total_gross: number;
  };
}

export function GHGProtocolInventory() {
  const [data, setData] = useState<GHGInventoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/compliance/ghg-protocol?year=${selectedYear}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching GHG Protocol data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: any) => {
    setSaving(true);
    try {
      const response = await fetch('/api/compliance/ghg-protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowForm(false);
        fetchData(); // Refresh data
      } else {
        console.error('Failed to save GHG Protocol settings');
      }
    } catch (error) {
      console.error('Error saving GHG Protocol settings:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">No inventory data available</p>
      </div>
    );
  }

  const getConsolidationLabel = (approach: string) => {
    switch (approach) {
      case 'operational_control': return 'Operational Control';
      case 'financial_control': return 'Financial Control';
      case 'equity_share': return 'Equity Share';
      default: return approach;
    }
  };

  const getAssuranceLabel = (level: string) => {
    switch (level) {
      case 'not_verified': return 'Not Verified';
      case 'limited': return 'Limited Assurance';
      case 'reasonable': return 'Reasonable Assurance';
      default: return level;
    }
  };

  const getAssuranceColor = (level: string) => {
    switch (level) {
      case 'reasonable': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'limited': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <GHGProtocolForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSave={handleSave}
        initialData={data}
        saving={saving}
      />

      {/* Header */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              About This Inventory
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              GHG Protocol Corporate Standard requirements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white"
            >
              <option value={2024}>2024</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022</option>
            </select>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Settings
            </button>
          </div>
        </div>
      </div>

      {/* Organizational Boundary */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Building2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Organizational Boundary
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Consolidation Approach</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {getConsolidationLabel(data.consolidation_approach)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reporting Entity</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {data.reporting_entity}
            </p>
          </div>
        </div>
      </div>

      {/* Operational Boundary */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Operational Boundary
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Gases Covered</p>
            <div className="flex flex-wrap gap-2">
              {data.gases_covered.map((gas) => (
                <span
                  key={gas}
                  className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium"
                >
                  {gas}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">GWP Standard</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {data.gwp_standard}
            </p>
          </div>
        </div>
      </div>

      {/* Base Year */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Base Year
          </h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Selected Year</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.base_year}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Recalculation Threshold</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ±{data.recalculation_threshold}%
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Rationale</p>
            <p className="text-gray-700 dark:text-gray-300">
              {data.base_year_rationale}
            </p>
          </div>

          {data.base_year_emissions && data.base_year !== selectedYear && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Base Year Emissions ({data.base_year})
              </p>
              <div className="grid grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Scope 1</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {data.base_year_emissions.scope_1.toLocaleString()} tCO₂e
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Scope 2</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {data.base_year_emissions.scope_2.toLocaleString()} tCO₂e
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Scope 3</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {data.base_year_emissions.scope_3.toLocaleString()} tCO₂e
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Total</p>
                  <p className="font-semibold text-purple-900 dark:text-purple-300">
                    {data.base_year_emissions.total.toLocaleString()} tCO₂e
                  </p>
                </div>
              </div>

              {data.base_year_emissions.total > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Change from base year:{' '}
                      <span className={`font-semibold ${
                        data.emissions.total_gross < data.base_year_emissions.total
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {((data.emissions.total_gross - data.base_year_emissions.total) / data.base_year_emissions.total * 100).toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reporting Period & Assurance */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Reporting Period & Assurance
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Reporting Period</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {new Date(data.period_start).toLocaleDateString()} – {new Date(data.period_end).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assurance Level</p>
            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${getAssuranceColor(data.assurance_level)}`}>
              {getAssuranceLabel(data.assurance_level)}
            </span>
          </div>
        </div>

        {data.assurance_provider && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Assurance Provider</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {data.assurance_provider}
            </p>
          </div>
        )}
      </div>

      {/* GHG Protocol Compliance Statement */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            GHG Protocol Compliance Statement
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {data.compliance_statement}
          </p>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Methodology:</p>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {data.methodology_description}
            </p>
          </div>
        </div>
      </div>

      {/* Current Year Emissions Summary */}
      <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <TrendingDown className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Emissions Summary ({data.reporting_year})
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 1</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.emissions.scope_1_gross.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 2 (LB)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.emissions.scope_2_location_based.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 2 (MB)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.emissions.scope_2_market_based.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Scope 3</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.emissions.scope_3_gross.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">tCO₂e</p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 md:col-span-2">
            <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">
              {data.emissions.total_gross.toLocaleString()}
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">tCO₂e</p>
          </div>
        </div>

        {data.scope3_categories_in_data.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Scope 3 Categories Reported:
            </p>
            <div className="flex flex-wrap gap-2">
              {data.scope3_categories_in_data.map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">About the GHG Protocol</p>
            <p>
              The GHG Protocol Corporate Standard provides requirements and guidance for companies preparing a corporate-level
              GHG emissions inventory. It covers the accounting and reporting of seven greenhouse gases covered by the Kyoto
              Protocol.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
