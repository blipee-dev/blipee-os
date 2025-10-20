'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Droplets,
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';
import { useGRIDisclosures } from '@/hooks/useDashboardData';

interface WaterData {
  total_withdrawal: number;
  total_discharge: number;
  total_consumption: number;
  withdrawal_by_source: {
    source: string;
    value: number;
    unit: string;
  }[];
  discharge_by_destination: {
    destination: string;
    value: number;
    unit: string;
  }[];
  consumption_by_use: {
    use: string;
    value: number;
    unit: string;
  }[];
  stress_areas_percentage?: number;
  intensity_revenue: number;
  intensity_area: number;
  intensity_fte: number;
}

interface GRI303DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function GRI303Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI303DisclosuresProps) {
  // Fetch data using React Query hook
  const { data, isLoading, error: queryError } = useGRIDisclosures('303', selectedYear, selectedSite);

  const loading = isLoading;
  const error = queryError?.message || null;

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-12 shadow-sm">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading GRI 303 data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load GRI 303 data. Please ensure water data is available for {selectedYear}.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            GRI 303: Water and Effluents 2018
            <div className="group relative">
              <Info className="w-5 h-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
              <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto absolute z-[9999] w-96 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-2xl left-0 top-7 border border-gray-700 transition-opacity duration-200">
                <strong>GRI 303 Reporting Methodology:</strong> Water data is reported in megaliters (ML). Water consumption is calculated as total water withdrawal minus total water discharge. All water sources and destinations are categorized according to GRI 303 requirements. Water stress assessment follows the WRI Aqueduct methodology.
                <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 border-l border-t border-gray-700 rotate-45"></div>
              </div>
            </div>
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          Interactions with water as a shared resource, water withdrawal, discharge, and consumption
        </p>
      </div>

      {/* Water Balance Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Water Balance Overview
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Withdrawal</span>
            </div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-300">
              {data.total_withdrawal.toLocaleString()}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">megaliters (ML)</p>
          </div>

          <div className="p-5 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Droplets className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Total Consumption</span>
            </div>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">
              {data.total_consumption.toLocaleString()}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">megaliters (ML)</p>
          </div>

          <div className="p-5 bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <ArrowUpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span className="text-sm font-medium text-teal-700 dark:text-teal-400">Total Discharge</span>
            </div>
            <p className="text-3xl font-bold text-teal-900 dark:text-teal-300">
              {data.total_discharge.toLocaleString()}
            </p>
            <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">megaliters (ML)</p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold">Water balance:</span> Consumption = Withdrawal - Discharge
            ({data.total_withdrawal.toLocaleString()} - {data.total_discharge.toLocaleString()} = {data.total_consumption.toLocaleString()} ML)
          </p>
        </div>
      </motion.div>

      {/* 303-3: Water withdrawal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <ArrowDownCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            303-3: Water Withdrawal
          </h3>
        </div>

        {data.withdrawal_by_source.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Withdrawal by Source:
            </p>
            {data.withdrawal_by_source.map((source, i) => {
              const percentage = data.total_withdrawal > 0 ? (source.value / data.total_withdrawal) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{source.source}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {source.value.toLocaleString()} {source.unit} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No water withdrawal data recorded by source
          </p>
        )}

        {data.stress_areas_percentage !== undefined && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-1">
              Water Stress Areas
            </p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
              {data.stress_areas_percentage.toFixed(0)}%
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              of total withdrawal from water-stressed areas
            </p>
          </div>
        )}
      </motion.div>

      {/* 303-4: Water discharge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <ArrowUpCircle className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            303-4: Water Discharge
          </h3>
        </div>

        {data.discharge_by_destination.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Discharge by Destination:
            </p>
            {data.discharge_by_destination.map((dest, i) => {
              const percentage = data.total_discharge > 0 ? (dest.value / data.total_discharge) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{dest.destination}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {dest.value.toLocaleString()} {dest.unit} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No water discharge data recorded by destination
          </p>
        )}
      </motion.div>

      {/* 303-5: Water consumption */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Droplets className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            303-5: Water Consumption
          </h3>
        </div>

        {data.consumption_by_use.length > 0 ? (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Consumption by Use:
            </p>
            {data.consumption_by_use.map((use, i) => {
              const percentage = data.total_consumption > 0 ? (use.value / data.total_consumption) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{use.use}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {use.value.toLocaleString()} {use.unit} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic mb-6">
            Water consumption calculated as total withdrawal minus total discharge
          </p>
        )}

        {/* Water Intensity */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Water Consumption Intensity:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Revenue</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.intensity_revenue.toFixed(3)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ML / €M</p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Area</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.intensity_area.toFixed(3)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ML / m²</p>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Employee</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {data.intensity_fte.toFixed(3)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ML / FTE</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
