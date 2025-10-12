'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Recycle,
  TrendingUp,
  BarChart3,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Info
} from 'lucide-react';

interface WasteData {
  total_waste: number;
  waste_diverted: number;
  waste_disposed: number;
  diversion_rate: number;
  by_disposal_method: {
    method: string;
    value: number;
    unit: string;
    is_diverted: boolean;
  }[];
  hazardous_waste: number;
  non_hazardous_waste: number;
  intensity_revenue: number;
  intensity_area: number;
  intensity_fte: number;
}

interface GRI306DisclosuresProps {
  organizationId: string;
  selectedYear: number;
  selectedSite?: any;
  selectedPeriod?: any;
}

export function GRI306Disclosures({
  organizationId,
  selectedYear,
  selectedSite,
  selectedPeriod
}: GRI306DisclosuresProps) {
  const [data, setData] = useState<WasteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWasteData() {
      try {
        const params = new URLSearchParams({
          year: selectedYear.toString(),
          organizationId: organizationId
        });

        if (selectedSite?.id) {
          params.append('siteId', selectedSite.id);
        }

        const response = await fetch(`/api/compliance/gri-306?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch GRI 306 data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchWasteData();
  }, [organizationId, selectedYear, selectedSite]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-12 shadow-sm">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading GRI 306 data...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center text-amber-600 dark:text-amber-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Unable to load GRI 306 data. Please ensure waste data is available for {selectedYear}.</span>
        </div>
      </div>
    );
  }

  const divertedMethods = data.by_disposal_method.filter(m => m.is_diverted);
  const disposedMethods = data.by_disposal_method.filter(m => !m.is_diverted);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            GRI 306: Waste 2020
          </h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 ml-11">
          Waste generation and significant waste-related impacts, management of waste-related impacts
        </p>
      </div>

      {/* Waste Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          306-3, 306-4, 306-5: Waste Generated
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2 p-5 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/10 dark:to-red-900/10 border border-orange-200 dark:border-orange-800 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Waste Generated</p>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {data.total_waste.toLocaleString()}
              <span className="text-lg font-normal text-gray-500 dark:text-gray-400 ml-2">metric tonnes</span>
            </p>
          </div>

          <div className="p-5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Recycle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Diverted</span>
            </div>
            <p className="text-2xl font-bold text-green-900 dark:text-green-300">
              {data.waste_diverted.toLocaleString()} t
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              {data.diversion_rate.toFixed(1)}%
            </p>
          </div>

          <div className="p-5 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">Disposed</span>
            </div>
            <p className="text-2xl font-bold text-red-900 dark:text-red-300">
              {data.waste_disposed.toLocaleString()} t
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {(100 - data.diversion_rate).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Diversion Rate Visualization */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Waste Diversion Rate</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.diversion_rate.toFixed(1)}%</p>
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
              style={{ width: `${data.diversion_rate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Higher diversion rates indicate better waste management practices
          </p>
        </div>

        {/* Hazardous vs Non-Hazardous */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">Hazardous Waste</p>
            <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
              {data.hazardous_waste.toLocaleString()} t
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              {data.total_waste > 0 ? ((data.hazardous_waste / data.total_waste) * 100).toFixed(1) : 0}% of total
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400 mb-2">Non-Hazardous Waste</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {data.non_hazardous_waste.toLocaleString()} t
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {data.total_waste > 0 ? ((data.non_hazardous_waste / data.total_waste) * 100).toFixed(1) : 0}% of total
            </p>
          </div>
        </div>
      </motion.div>

      {/* Waste Diverted from Disposal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Recycle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            306-4: Waste Diverted from Disposal
          </h3>
        </div>

        {divertedMethods.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Diversion Methods:
            </p>
            {divertedMethods.map((method, i) => {
              const percentage = data.waste_diverted > 0 ? (method.value / data.waste_diverted) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-gray-700 dark:text-gray-300">{method.method}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {method.value.toLocaleString()} {method.unit} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No waste diversion data recorded
          </p>
        )}
      </motion.div>

      {/* Waste Directed to Disposal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            306-5: Waste Directed to Disposal
          </h3>
        </div>

        {disposedMethods.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Disposal Methods:
            </p>
            {disposedMethods.map((method, i) => {
              const percentage = data.waste_disposed > 0 ? (method.value / data.waste_disposed) * 100 : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span className="text-gray-700 dark:text-gray-300">{method.method}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {method.value.toLocaleString()} {method.unit} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No waste disposal data recorded
          </p>
        )}
      </motion.div>

      {/* Waste Intensity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Waste Intensity
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Revenue</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_revenue.toFixed(3)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">tonnes / €M</p>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Area</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_area.toFixed(3)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">tonnes / m²</p>
          </div>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Per Employee</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {data.intensity_fte.toFixed(3)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">tonnes / FTE</p>
          </div>
        </div>
      </motion.div>

      {/* Methodology Note */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              GRI 306 Reporting Methodology
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-400">
              Waste data follows the GRI 306:2020 standard. Waste diverted from disposal includes recycling,
              reuse, composting, and recovery operations. Waste directed to disposal includes landfill, incineration
              without energy recovery, and other disposal operations. Hazardous waste is classified according to
              local regulations and international conventions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
