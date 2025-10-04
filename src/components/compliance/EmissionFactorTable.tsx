'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Calendar,
  MapPin,
  FileText,
  ExternalLink,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { complianceColors } from '@/styles/compliance-design-tokens';

interface EmissionFactor {
  id: string;
  metric_code: string;
  metric_name: string;
  region: string;
  year: number;
  factor: number;
  unit: string;
  source: string;
  version?: string;
  published_date?: string;
  methodology?: string;
  uncertainty_range?: number;
  geographic_scope?: string;
  notes?: string;
}

interface EmissionFactorTableProps {
  factors: EmissionFactor[];
  title?: string;
}

export function EmissionFactorTable({ factors, title }: EmissionFactorTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  // Get unique sources and years for filters
  const uniqueSources = ['all', ...Array.from(new Set(factors.map(f => f.source)))];
  const uniqueYears = ['all', ...Array.from(new Set(factors.map(f => f.year))).sort((a, b) => b - a)];

  // Filter factors
  const filteredFactors = factors.filter(factor => {
    const matchesSearch =
      searchTerm === '' ||
      factor.metric_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factor.metric_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factor.region.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSource = selectedSource === 'all' || factor.source === selectedSource;
    const matchesYear = selectedYear === 'all' || factor.year === selectedYear;

    return matchesSearch && matchesSource && matchesYear;
  });

  const handleExport = () => {
    // Create CSV content
    const headers = [
      'Metric Code',
      'Metric Name',
      'Region',
      'Year',
      'Factor',
      'Unit',
      'Source',
      'Version',
      'Published Date',
      'Methodology',
      'Uncertainty',
      'Geographic Scope'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredFactors.map(f =>
        [
          f.metric_code,
          `"${f.metric_name}"`,
          f.region,
          f.year,
          f.factor,
          f.unit,
          f.source,
          f.version || '',
          f.published_date || '',
          `"${f.methodology || ''}"`,
          f.uncertainty_range || '',
          f.geographic_scope || ''
        ].join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `emission-factors-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title || 'Emission Factor Registry'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete audit trail of emission factors used in calculations
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Metric, region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Source
            </label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {uniqueSources.map(source => (
                  <option key={source} value={source}>
                    {source === 'all' ? 'All Sources' : source}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {uniqueYears.map(year => (
                  <option key={year} value={year}>
                    {year === 'all' ? 'All Years' : year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredFactors.length} of {factors.length} emission factors
          </span>
          {(searchTerm || selectedSource !== 'all' || selectedYear !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedSource('all');
                setSelectedYear('all');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Metric
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Region
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Year
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Factor
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFactors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No emission factors found matching your filters
                  </td>
                </tr>
              ) : (
                filteredFactors.map((factor, index) => (
                  <motion.tr
                    key={factor.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    {/* Metric */}
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {factor.metric_name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {factor.metric_code}
                        </p>
                      </div>
                    </td>

                    {/* Region */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {factor.region}
                        </span>
                      </div>
                      {factor.geographic_scope && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                          {factor.geographic_scope}
                        </p>
                      )}
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {factor.year}
                      </span>
                    </td>

                    {/* Factor */}
                    <td className="px-4 py-3 text-right">
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white font-mono">
                          {factor.factor.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {factor.unit}
                        </p>
                      </div>
                      {factor.uncertainty_range && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          ±{factor.uncertainty_range}%
                        </p>
                      )}
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Database className="w-3 h-3 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {factor.source}
                          </p>
                          {factor.version && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              v{factor.version}
                            </p>
                          )}
                        </div>
                      </div>
                      {factor.published_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                          {new Date(factor.published_date).toLocaleDateString()}
                        </p>
                      )}
                    </td>

                    {/* Details */}
                    <td className="px-4 py-3">
                      {factor.methodology && (
                        <div className="group relative">
                          <button className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                            <FileText className="w-3 h-3" />
                            Methodology
                          </button>
                          <div className="hidden group-hover:block absolute z-10 right-0 top-full mt-1 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                            <p className="font-semibold mb-1">Calculation Method:</p>
                            <p>{factor.methodology}</p>
                          </div>
                        </div>
                      )}
                      {factor.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {factor.notes}
                        </p>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Factors</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{factors.length}</p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data Sources</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {uniqueSources.length - 1}
          </p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Regions Covered</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {new Set(factors.map(f => f.region)).size}
          </p>
        </div>
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-lg p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Latest Year</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Math.max(...factors.map(f => f.year))}
          </p>
        </div>
      </div>
    </div>
  );
}
