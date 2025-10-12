'use client';

import React, { useEffect, useState } from 'react';
import { ESRSE1Disclosures } from './ESRSE1Disclosures';
import { Loader2, AlertCircle } from 'lucide-react';

interface ESRSE1Data {
  reporting_year: number;
  transition_plan?: {
    decarbonization_levers: string[];
    target_alignment: string;
    resource_allocation: string;
    last_updated: string;
  };
  climate_policies?: {
    policy_name: string;
    description: string;
    scope: string[];
  }[];
  mitigation_actions?: {
    action: string;
    scope_coverage: string[];
    expected_reduction: number;
    status: string;
  }[];
  capex_green?: number;
  opex_green?: number;
  targets?: {
    target_type: string;
    base_year: number;
    target_year: number;
    reduction_percentage: number;
    scopes_covered: string[];
    target_description: string;
  }[];
  energy_consumption?: {
    total_consumption: number;
    renewable_percentage: number;
    by_source: { source: string; value: number }[];
  };
  scope_1_gross: number;
  scope_2_gross_lb: number;
  scope_2_gross_mb: number;
  scope_3_gross: number;
  total_gross: number;
  removals_total?: number;
  credits_total?: number;
  carbon_price_used?: number;
  carbon_price_currency?: string;
  financial_effects?: {
    physical_risks: { risk: string; financial_impact: number }[];
    transition_risks: { risk: string; financial_impact: number }[];
    opportunities: { opportunity: string; potential_benefit: number }[];
  };
}

interface ESRSE1DisclosuresWrapperProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function ESRSE1DisclosuresWrapper({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: ESRSE1DisclosuresWrapperProps) {
  const [data, setData] = useState<ESRSE1Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if viewing a past year (read-only mode)
  const isHistoricalYear = selectedYear < new Date().getFullYear();
  const isReadOnly = isHistoricalYear;

  useEffect(() => {
    async function fetchESRSData() {
      try {
        const params = new URLSearchParams({
          year: selectedYear.toString()
        });

        if (selectedSite?.id) {
          params.append('siteId', selectedSite.id);
        }

        const response = await fetch(`/api/compliance/esrs-e1?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch ESRS E1 data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchESRSData();
  }, [selectedYear, selectedSite]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading ESRS E1 disclosures...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-300 mb-1">Error Loading Data</p>
            <p className="text-sm text-red-700 dark:text-red-400">
              {error || 'Failed to load ESRS E1 disclosures. Please try again later.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ESRSE1Disclosures data={data} isReadOnly={isReadOnly} />;
}
