'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Info,
  Building2,
  Calendar,
  Shield,
  Leaf,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { complianceColors, components } from '@/styles/compliance-design-tokens';

interface InventorySettings {
  consolidation_approach: 'equity_share' | 'financial_control' | 'operational_control';
  consolidation_percentage?: number;
  gases_covered: string[];
  base_year: number;
  base_year_rationale: string;
  reporting_period_start: string;
  reporting_period_end: string;
  assurance_level: 'none' | 'limited' | 'reasonable';
  assurance_provider?: string;
  gwp_version: string;
  organization_name?: string;
}

export function AboutInventory() {
  const [settings, setSettings] = useState<InventorySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const organizationName = settings?.organization_name || 'Your Organization';

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/compliance/inventory-settings');
        if (!response.ok) {
          throw new Error('Failed to fetch inventory settings');
        }
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-12 shadow-sm">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-3 text-gray-500">Loading inventory settings...</span>
        </div>
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center text-amber-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load inventory settings. Please configure your organization settings.</span>
        </div>
      </div>
    );
  }
  const consolidationLabels = {
    equity_share: 'Equity Share',
    financial_control: 'Financial Control',
    operational_control: 'Operational Control'
  };

  const assuranceLabels = {
    none: 'Not Verified',
    limited: 'Limited Assurance',
    reasonable: 'Reasonable Assurance'
  };

  const assuranceColors = {
    none: complianceColors.compliance.incomplete,
    limited: complianceColors.compliance.inProgress,
    reasonable: complianceColors.compliance.complete,
  };

  const currentAssuranceColor = assuranceColors[settings.assurance_level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            About This Inventory
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            GHG Protocol Corporate Standard requirements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organizational Boundary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Organizational Boundary</h4>
          </div>
          <div className="pl-6 space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Consolidation Approach</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                  {consolidationLabels[settings.consolidation_approach]}
                </span>
                {settings.consolidation_percentage && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({settings.consolidation_percentage}% equity share)
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reporting Entity</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{organizationName}</p>
            </div>
          </div>
        </div>

        {/* Operational Boundary */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Operational Boundary</h4>
          </div>
          <div className="pl-6 space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Gases Covered</p>
              <div className="flex flex-wrap gap-1">
                {settings.gases_covered.map((gas) => (
                  <span
                    key={gas}
                    className="px-2 py-0.5 text-xs font-mono bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                  >
                    {gas}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">GWP Standard</p>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                IPCC {settings.gwp_version}
              </span>
            </div>
          </div>
        </div>

        {/* Base Year */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Base Year</h4>
          </div>
          <div className="pl-6 space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Selected Year</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{settings.base_year}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rationale</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{settings.base_year_rationale}</p>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Recalculation threshold: ±5% significance
              </p>
            </div>
          </div>
        </div>

        {/* Reporting Period & Assurance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h4 className="font-medium text-gray-900 dark:text-white">Reporting Period & Assurance</h4>
          </div>
          <div className="pl-6 space-y-2">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reporting Period</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(settings.reporting_period_start).toLocaleDateString('en-GB')} –{' '}
                {new Date(settings.reporting_period_end).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Assurance Level</p>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 text-xs font-semibold rounded-full"
                  style={{
                    backgroundColor: currentAssuranceColor.bg,
                    color: currentAssuranceColor.color
                  }}
                >
                  {assuranceLabels[settings.assurance_level]}
                </span>
                {settings.assurance_level !== 'none' && (
                  <CheckCircle2 className="w-4 h-4" style={{ color: currentAssuranceColor.color }} />
                )}
              </div>
            </div>
            {settings.assurance_provider && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Verified By</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{settings.assurance_provider}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compliance Statement */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
          <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-300">
              GHG Protocol Compliance Statement
            </p>
            <p className="text-xs text-green-700 dark:text-green-400 mt-1">
              This inventory has been prepared in conformance with the GHG Protocol Corporate Accounting
              and Reporting Standard (Revised Edition). Scope 2 emissions are reported using both
              location-based and market-based methods as per the Scope 2 Guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-semibold">Methodology:</span> Emissions calculated using activity-based
          approach with region and year-specific emission factors from DEFRA, EPA, and IEA. Scope 3
          categories screened per GHG Protocol Corporate Value Chain (Scope 3) Standard.
        </p>
      </div>
    </motion.div>
  );
}
