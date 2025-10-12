'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Factory,
  Zap,
  Truck,
  TrendingDown,
  Target,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wind,
  Droplets,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
import { complianceColors } from '@/styles/compliance-design-tokens';
import { ReductionInitiativeForm } from './ReductionInitiativeForm';

interface GRIData {
  scope1_total: number;
  scope1_biogenic: number;
  scope2_location_based: number;
  scope2_market_based: number;
  scope3_total: number;
  scope3_categories: {
    category: number;
    name: string;
    emissions: number;
  }[];
  intensity_revenue: number;
  intensity_area: number;
  intensity_fte: number;
  reduction_initiatives: {
    id?: string;
    initiative: string;
    reduction: number;
    year: number;
    status?: string;
    category?: string;
  }[];
  base_year: number;
  base_year_emissions: number;
  gases_covered: string[];
  consolidation_approach: string;
  reporting_period: {
    start: string;
    end: string;
  };
}

interface GRI305DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function GRI305Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI305DisclosuresProps) {
  const [data, setData] = useState<GRIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInitiativeForm, setShowInitiativeForm] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [initiatives, setInitiatives] = useState<any[]>([]);

  // Check if viewing a past year (read-only mode)
  const isHistoricalYear = selectedYear < new Date().getFullYear();
  const isReadOnly = isHistoricalYear;

  useEffect(() => {
    async function fetchGRIData() {
      try {
        const params = new URLSearchParams({
          year: selectedYear.toString()
        });

        if (selectedSite?.id) {
          params.append('siteId', selectedSite.id);
        }

        const response = await fetch(`/api/compliance/gri-305?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch GRI 305 data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchGRIData();
  }, [selectedYear, selectedSite]);

  useEffect(() => {
    async function fetchInitiatives() {
      try {
        const params = new URLSearchParams({
          year: selectedYear.toString()
        });

        if (selectedSite?.id) {
          params.append('siteId', selectedSite.id);
        }

        const response = await fetch(`/api/compliance/reduction-initiatives?${params}`);
        if (response.ok) {
          const result = await response.json();
          setInitiatives(result);
        }
      } catch (err) {
        console.error('Failed to fetch initiatives:', err);
      }
    }

    fetchInitiatives();
  }, [selectedYear, selectedSite]);

  const handleSaveInitiative = async (formData: any) => {
    setSaving(true);
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const response = await fetch('/api/compliance/reduction-initiatives', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to save initiative');
      }

      // Refresh initiatives list
      const initiativesResponse = await fetch('/api/compliance/reduction-initiatives');
      if (initiativesResponse.ok) {
        const result = await initiativesResponse.json();
        setInitiatives(result);
      }

      // Refresh GRI data
      const griResponse = await fetch('/api/compliance/gri-305');
      if (griResponse.ok) {
        const griResult = await griResponse.json();
        setData(griResult);
      }

      setShowInitiativeForm(false);
      setSelectedInitiative(null);
    } catch (err) {
      console.error('Error saving initiative:', err);
      alert('Failed to save initiative. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInitiative = async (id: string) => {
    if (!confirm('Are you sure you want to delete this initiative?')) return;

    try {
      const response = await fetch(`/api/compliance/reduction-initiatives?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete initiative');
      }

      // Refresh initiatives list
      const initiativesResponse = await fetch('/api/compliance/reduction-initiatives');
      if (initiativesResponse.ok) {
        const result = await initiativesResponse.json();
        setInitiatives(result);
      }

      // Refresh GRI data
      const griResponse = await fetch('/api/compliance/gri-305');
      if (griResponse.ok) {
        const griResult = await griResponse.json();
        setData(griResult);
      }
    } catch (err) {
      console.error('Error deleting initiative:', err);
      alert('Failed to delete initiative. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-12 shadow-sm">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading GRI 305 disclosures...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load GRI 305 data. Please ensure emissions data is available.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            GRI 305: Emissions 2016
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          Complete greenhouse gas emissions disclosures in accordance with GRI Standards
        </p>
      </div>

      {/* 305-1: Direct (Scope 1) GHG emissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Factory className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            305-1: Direct (Scope 1) GHG Emissions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gross Direct Emissions</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {data.scope1_total.toLocaleString()}
                <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">tCO₂e</span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Biogenic CO₂ Emissions</p>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                {data.scope1_biogenic.toLocaleString()}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">tCO₂</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gases Included</p>
              <div className="flex flex-wrap gap-1">
                {data.gases_covered.map((gas) => (
                  <span
                    key={gas}
                    className="px-2 py-1 text-xs font-mono bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded"
                  >
                    {gas}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consolidation Approach</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                {data.consolidation_approach.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 305-2: Energy indirect (Scope 2) GHG emissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            305-2: Energy Indirect (Scope 2) GHG Emissions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Location-Based Method</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.scope2_location_based.toLocaleString()}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">tCO₂e</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Using average emission factors for the grid
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Market-Based Method</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.scope2_market_based.toLocaleString()}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">tCO₂e</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Reflecting contractual instruments
            </p>
          </div>
        </div>
      </motion.div>

      {/* 305-3: Other indirect (Scope 3) GHG emissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            305-3: Other Indirect (Scope 3) GHG Emissions
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {data.scope3_total.toLocaleString()}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">tCO₂e</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Scope 3 emissions</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Breakdown by Category:
          </p>
          {data.scope3_categories.map((cat) => (
            <div
              key={cat.category}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                  Cat {cat.category}
                </span>
                <span className="text-sm text-gray-700 dark:text-gray-300">{cat.name}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                {cat.emissions.toLocaleString()} tCO₂e
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 305-4: GHG emissions intensity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            305-4: GHG Emissions Intensity
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Revenue</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_revenue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO₂e / €M</p>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Area</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_area.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO₂e / m²</p>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Employee</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_fte.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO₂e / FTE</p>
          </div>
        </div>
      </motion.div>

      {/* 305-5: Reduction of GHG emissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            305-5: Reduction of GHG Emissions
          </h3>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Base year: <span className="font-semibold text-gray-900 dark:text-white">{data.base_year}</span>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Base year emissions: <span className="font-semibold text-gray-900 dark:text-white">{data.base_year_emissions.toLocaleString()} tCO₂e</span>
          </p>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Emission Reduction Initiatives:
            </p>
            {!isReadOnly && (
              <button
                onClick={() => {
                  setSelectedInitiative(null);
                  setShowInitiativeForm(true);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Initiative
              </button>
            )}
          </div>

          {initiatives.length > 0 ? (
            <div className="space-y-2">
              {initiatives.map((initiative) => (
                <div
                  key={initiative.id}
                  className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{initiative.initiative_name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Year: {initiative.implementation_year}</p>
                      {initiative.category && (
                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                          {initiative.category}
                        </span>
                      )}
                      {initiative.status && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          initiative.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                          initiative.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}>
                          {initiative.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                      -{initiative.reduction_tco2e.toLocaleString()} tCO₂e
                    </span>
                    {!isReadOnly && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedInitiative(initiative);
                            setShowInitiativeForm(true);
                          }}
                          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Edit initiative"
                        >
                          <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteInitiative(initiative.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Delete initiative"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No emission reduction initiatives reported for this period. Click "Add Initiative" to get started.
            </p>
          )}
        </div>
      </motion.div>

      {/* 305-6 & 305-7: Other emissions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Wind className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                305-6: Emissions of Ozone-Depleting Substances (ODS)
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Not applicable - No significant ODS emissions from operations.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-3">
              <Droplets className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                305-7: NOx, SOx and Other Significant Air Emissions
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Not applicable - No significant NOx, SOx, or other air emissions from operations.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Reporting Period */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <span className="font-semibold">Reporting Period:</span>{' '}
          {new Date(data.reporting_period.start).toLocaleDateString('en-GB')} –{' '}
          {new Date(data.reporting_period.end).toLocaleDateString('en-GB')}
        </p>
      </div>

      {/* Reduction Initiative Form Modal */}
      <ReductionInitiativeForm
        isOpen={showInitiativeForm}
        onClose={() => {
          setShowInitiativeForm(false);
          setSelectedInitiative(null);
        }}
        onSave={handleSaveInitiative}
        initialData={selectedInitiative}
        saving={saving}
      />
    </div>
  );
}
