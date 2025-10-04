'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitMerge,
  Check,
  Info,
  ExternalLink,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { complianceColors } from '@/styles/compliance-design-tokens';

interface FrameworkMapping {
  datapoint_code: string;
  description: string;
  unit?: string;
  gri_codes: string[];
  esrs_codes: string[];
  tcfd_references: string[];
  ifrs_s2_codes: string[];
  coverage_status: 'complete' | 'partial' | 'not_covered';
  data_available: boolean;
}

interface FrameworkInteroperabilityProps {
  mappings: FrameworkMapping[];
  organizationName: string;
}

export function FrameworkInteroperability({ mappings, organizationName }: FrameworkInteroperabilityProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [coverageFilter, setCoverageFilter] = useState<string>('all');

  const frameworks = [
    { id: 'gri', name: 'GRI', color: complianceColors.frameworks.gri.primary, count: 0 },
    { id: 'esrs', name: 'ESRS', color: complianceColors.frameworks.esrs.primary, count: 0 },
    { id: 'tcfd', name: 'TCFD', color: complianceColors.frameworks.tcfd.primary, count: 0 },
    { id: 'ifrs', name: 'IFRS S2', color: complianceColors.frameworks.ifrs.primary, count: 0 },
  ];

  // Calculate coverage statistics
  const stats = {
    total: mappings.length,
    complete: mappings.filter(m => m.coverage_status === 'complete').length,
    partial: mappings.filter(m => m.coverage_status === 'partial').length,
    not_covered: mappings.filter(m => m.coverage_status === 'not_covered').length,
    data_available: mappings.filter(m => m.data_available).length,
  };

  // Filter mappings
  const filteredMappings = mappings.filter(mapping => {
    const matchesSearch =
      searchTerm === '' ||
      mapping.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.datapoint_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.gri_codes.some(code => code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      mapping.esrs_codes.some(code => code.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFramework =
      selectedFramework === 'all' ||
      (selectedFramework === 'gri' && mapping.gri_codes.length > 0) ||
      (selectedFramework === 'esrs' && mapping.esrs_codes.length > 0) ||
      (selectedFramework === 'tcfd' && mapping.tcfd_references.length > 0) ||
      (selectedFramework === 'ifrs' && mapping.ifrs_s2_codes.length > 0);

    const matchesCoverage =
      coverageFilter === 'all' ||
      mapping.coverage_status === coverageFilter;

    return matchesSearch && matchesFramework && matchesCoverage;
  });

  const getCoverageColor = (status: string) => {
    switch (status) {
      case 'complete': return { bg: complianceColors.green[100], text: complianceColors.green[700], icon: complianceColors.green[600] };
      case 'partial': return { bg: complianceColors.amber[100], text: complianceColors.amber[700], icon: complianceColors.amber[600] };
      case 'not_covered': return { bg: complianceColors.red[100], text: complianceColors.red[700], icon: complianceColors.red[600] };
      default: return { bg: complianceColors.light.gray100, text: complianceColors.light.gray700, icon: complianceColors.light.gray500 };
    }
  };

  const handleExport = () => {
    const headers = [
      'Datapoint',
      'Description',
      'Unit',
      'GRI',
      'ESRS',
      'TCFD',
      'IFRS S2',
      'Coverage',
      'Data Available'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredMappings.map(m =>
        [
          m.datapoint_code,
          `"${m.description}"`,
          m.unit || '',
          `"${m.gri_codes.join('; ')}"`,
          `"${m.esrs_codes.join('; ')}"`,
          `"${m.tcfd_references.join('; ')}"`,
          `"${m.ifrs_s2_codes.join('; ')}"`,
          m.coverage_status,
          m.data_available ? 'Yes' : 'No'
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `framework-interoperability-${organizationName}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            Framework Interoperability Matrix
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Cross-reference: GRI ↔ ESRS ↔ TCFD ↔ IFRS S2
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Mapping
        </button>
      </div>

      {/* Coverage Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Datapoints</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-4">
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Complete Coverage</p>
          <p className="text-2xl font-bold text-green-900 dark:text-green-300">
            {stats.complete}
            <span className="text-sm ml-2">({((stats.complete / stats.total) * 100).toFixed(0)}%)</span>
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Partial Coverage</p>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-300">
            {stats.partial}
            <span className="text-sm ml-2">({((stats.partial / stats.total) * 100).toFixed(0)}%)</span>
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Data Available</p>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
            {stats.data_available}
            <span className="text-sm ml-2">({((stats.data_available / stats.total) * 100).toFixed(0)}%)</span>
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Datapoints
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Datapoint, GRI, ESRS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Framework Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Framework
            </label>
            <select
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Frameworks</option>
              <option value="gri">GRI Only</option>
              <option value="esrs">ESRS Only</option>
              <option value="tcfd">TCFD Only</option>
              <option value="ifrs">IFRS S2 Only</option>
            </select>
          </div>

          {/* Coverage Filter */}
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Coverage Status
            </label>
            <select
              value={coverageFilter}
              onChange={(e) => setCoverageFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="complete">Complete</option>
              <option value="partial">Partial</option>
              <option value="not_covered">Not Covered</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredMappings.length} of {stats.total} datapoints
          </span>
          {(searchTerm || selectedFramework !== 'all' || coverageFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedFramework('all');
                setCoverageFilter('all');
              }}
              className="text-purple-600 dark:text-purple-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Mapping Table */}
      <div className="bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/[0.05] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Datapoint
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Description
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300" style={{ color: frameworks[0].color }}>
                  GRI
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300" style={{ color: frameworks[1].color }}>
                  ESRS
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300" style={{ color: frameworks[2].color }}>
                  TCFD
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300" style={{ color: frameworks[3].color }}>
                  IFRS S2
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No datapoints found matching your filters
                  </td>
                </tr>
              ) : (
                filteredMappings.map((mapping, index) => {
                  const coverageStyle = getCoverageColor(mapping.coverage_status);
                  return (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      {/* Datapoint */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                          {mapping.datapoint_code}
                        </p>
                        {mapping.unit && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{mapping.unit}</p>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{mapping.description}</p>
                      </td>

                      {/* GRI */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {mapping.gri_codes.length > 0 ? (
                            mapping.gri_codes.map((code, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs font-mono rounded"
                                style={{
                                  backgroundColor: `${frameworks[0].color}20`,
                                  color: frameworks[0].color
                                }}
                              >
                                {code}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* ESRS */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {mapping.esrs_codes.length > 0 ? (
                            mapping.esrs_codes.map((code, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs font-mono rounded"
                                style={{
                                  backgroundColor: `${frameworks[1].color}20`,
                                  color: frameworks[1].color
                                }}
                              >
                                {code}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* TCFD */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {mapping.tcfd_references.length > 0 ? (
                            mapping.tcfd_references.map((ref, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs rounded"
                                style={{
                                  backgroundColor: `${frameworks[2].color}20`,
                                  color: frameworks[2].color
                                }}
                              >
                                {ref}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* IFRS S2 */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {mapping.ifrs_s2_codes.length > 0 ? (
                            mapping.ifrs_s2_codes.map((code, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 text-xs font-mono rounded"
                                style={{
                                  backgroundColor: `${frameworks[3].color}20`,
                                  color: frameworks[3].color
                                }}
                              >
                                {code}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className="px-2 py-1 text-xs font-semibold rounded"
                            style={{
                              backgroundColor: coverageStyle.bg,
                              color: coverageStyle.text
                            }}
                          >
                            {mapping.coverage_status.replace('_', ' ')}
                          </span>
                          {mapping.data_available && (
                            <Check className="w-3 h-3 text-green-500" title="Data available" />
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Framework Reference Links */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-2">
              Framework Interoperability Sources
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
              <li>• <span className="font-semibold">EFRAG/GRI:</span> GRI-ESRS Interoperability Index (2024)</li>
              <li>• <span className="font-semibold">EFRAG:</span> ESRS-ISSB Comparison (2024)</li>
              <li>• <span className="font-semibold">TCFD:</span> Aligned with IFRS S2 Climate-related Disclosures</li>
              <li>• <span className="font-semibold">Purpose:</span> Avoid duplication and enable integrated reporting across multiple frameworks</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
