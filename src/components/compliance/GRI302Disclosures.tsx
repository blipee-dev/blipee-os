'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingDown,
  Activity,
  Sun,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';
import { useGRIDisclosures } from '@/hooks/useDashboardData';

interface EnergyData {
  total_consumption: number;
  renewable_energy: number;
  non_renewable_energy: number;
  renewable_percentage: number;
  non_renewable_percentage: number;
  by_source: {
    source: string;
    value: number;
    unit: string;
    is_renewable: boolean;
  }[];
  intensity_revenue: number;
  intensity_area: number;
  intensity_fte: number;
  reduction_from_previous_year?: number;
  base_year?: number;
  base_year_consumption?: number;
}

interface GRI302DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function GRI302Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI302DisclosuresProps) {
  // Fetch data using React Query hook
  const { data, isLoading, error: queryError } = useGRIDisclosures('302', selectedYear, selectedSite);

  const loading = isLoading;
  const error = queryError?.message || null;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-12 shadow-sm">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading GRI 302 data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load GRI 302 data. Please ensure energy data is available for {selectedYear}.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            GRI 302: Energy 2016
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          Energy consumption within the organization, energy intensity, and reduction of energy consumption
        </p>
      </div>

      {/* 302-1: Energy consumption within the organization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            302-1: Energy Consumption Within the Organization
          </h3>
        </div>

        {/* Total Consumption */}
        <div className="mb-6 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Energy Consumption</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white">
            {data.total_consumption.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
            <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">MWh</span>
          </p>
        </div>

        {/* Renewable vs Non-Renewable Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sun className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Renewable Energy</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {data.renewable_energy.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {data.renewable_percentage.toFixed(1)}% of total consumption
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Non-Renewable Energy</span>
            </div>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-300">
              {data.non_renewable_energy.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh
            </p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
              {data.non_renewable_percentage.toFixed(1)}% of total consumption
            </p>
          </div>
        </div>

        {/* Energy by Source Breakdown */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Energy Consumption by Source:
          </p>
          {data.by_source.map((source, i) => {
            const percentage = (source.value / data.total_consumption) * 100;
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-700 dark:text-gray-300">{source.source}</span>
                    {source.is_renewable && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                        Renewable
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {source.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} {source.unit} ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${source.is_renewable ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* 302-3: Energy intensity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            302-3: Energy Intensity
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Revenue</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_revenue.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MWh / €M</p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Area</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_area.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">kWh / m²</p>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Employee</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_fte.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">MWh / FTE</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Organization-specific metric:</span> Energy intensity is calculated
            using total energy consumption divided by revenue, floor area, and full-time equivalent employees.
          </p>
        </div>
      </motion.div>

      {/* 302-4: Reduction of energy consumption */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            302-4: Reduction of Energy Consumption
          </h3>
        </div>

        {data.reduction_from_previous_year !== undefined ? (
          <div className="space-y-4">
            <div className="p-5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Energy Reduction from Previous Year
              </p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-300">
                {data.reduction_from_previous_year > 0 ? '-' : '+'}{Math.abs(data.reduction_from_previous_year).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh
              </p>
              <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                {data.reduction_from_previous_year > 0 ? 'Decrease' : 'Increase'} in total consumption
              </p>
            </div>

            {data.base_year && data.base_year_consumption && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Base Year Comparison ({data.base_year})
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Base Year Consumption</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {data.base_year_consumption.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MWh
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Change</p>
                    <p className={`text-lg font-bold ${
                      data.total_consumption < data.base_year_consumption
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {((data.total_consumption - data.base_year_consumption) / data.base_year_consumption * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No comparison data available. Multi-year energy data needed to calculate reductions.
            </p>
          </div>
        )}
      </motion.div>

      {/* Methodology Note */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              GRI 302 Reporting Methodology
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Energy consumption data includes all energy consumed within the organizational boundary, including
              electricity, heating, cooling, and steam. Renewable energy is identified based on source characteristics
              and purchase agreements. Energy intensity metrics use organization-specific denominators relevant to
              the business model.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
