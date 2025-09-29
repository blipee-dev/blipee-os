'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  ChevronRight,
  Factory,
  Zap,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';

interface EmissionSourcesProps {
  scopeData: any;
  selectedScope: 'all' | '1' | '2' | '3';
}

export function EmissionSources({ scopeData, selectedScope }: EmissionSourcesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'emissions' | 'name' | 'trend'>('emissions');

  // Derive sources from scopeData prop
  const sources = React.useMemo(() => {
    const derivedSources: any[] = [];

    // Extract Scope 1 sources
    if (scopeData?.scope_1?.sources) {
      scopeData.scope_1.sources.forEach((source: string, index: number) => {
        derivedSources.push({
          id: `s1-${index}`,
          name: source,
          scope: 1,
          category: 'Scope 1',
          emissions: scopeData.scope_1.total / Math.max(scopeData.scope_1.sources.length, 1),
          unit: 'tCO2e',
          trend: scopeData.scope_1.trend || 0,
          facility: 'Various',
          lastUpdated: new Date().toISOString()
        });
      });
    }

    // Extract Scope 2 sources
    if (scopeData?.scope_2?.sources) {
      scopeData.scope_2.sources.forEach((source: string, index: number) => {
        derivedSources.push({
          id: `s2-${index}`,
          name: source,
          scope: 2,
          category: 'Scope 2',
          emissions: scopeData.scope_2.total / Math.max(scopeData.scope_2.sources.length, 1),
          unit: 'tCO2e',
          trend: scopeData.scope_2.trend || 0,
          facility: 'Various',
          lastUpdated: new Date().toISOString()
        });
      });
    }

    return derivedSources;
  }, [scopeData]);

  // Filter sources based on selected scope and search
  const filteredSources = sources
    .filter(source => {
      if (selectedScope !== 'all' && source.scope !== parseInt(selectedScope)) {
        return false;
      }
      if (searchTerm && !source.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !source.category.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'emissions':
          return b.emissions - a.emissions;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'trend':
          return Math.abs(b.trend) - Math.abs(a.trend);
        default:
          return 0;
      }
    });

  const getScopeColor = (scope: number) => {
    switch (scope) {
      case 1: return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 2: return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 3: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400';
    }
  };

  const getScopeIcon = (scope: number) => {
    switch (scope) {
      case 1: return <Factory className="w-4 h-4" />;
      case 2: return <Zap className="w-4 h-4" />;
      case 3: return <Package className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Emission Sources
        </h3>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
            <Filter className="w-4 h-4 text-gray-500" />
          </button>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-colors">
            <Download className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Search and Sort */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sources..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 dark:border-white/[0.1] rounded-lg bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="emissions">Sort by Emissions</option>
          <option value="name">Sort by Name</option>
          <option value="trend">Sort by Trend</option>
        </select>
      </div>

      {/* Sources Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/[0.05]">
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Source
              </th>
              <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Scope
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Emissions
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Trend
              </th>
              <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredSources.map((source, index) => (
              <motion.tr
                key={source.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-200 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-4 px-4">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {source.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {source.category} • {source.facility}
                    </p>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getScopeColor(source.scope)}`}>
                    {getScopeIcon(source.scope)}
                    Scope {source.scope}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {source.emissions.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {source.unit}
                  </p>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    {source.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      source.trend > 0 ? 'text-red-500' : 'text-green-500'
                    }`}>
                      {source.trend > 0 ? '+' : ''}{source.trend}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end gap-1">
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded transition-colors">
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.05] grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Sources</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredSources.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total Emissions</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {filteredSources.reduce((sum, s) => sum + s.emissions, 0).toFixed(1)} tCO2e
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Avg Trend</p>
          <p className={`text-lg font-semibold ${
            filteredSources.reduce((sum, s) => sum + s.trend, 0) / filteredSources.length < 0
              ? 'text-green-500' : 'text-red-500'
          }`}>
            {(filteredSources.reduce((sum, s) => sum + s.trend, 0) / filteredSources.length).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Alert for missing sources */}
      {filteredSources.length === 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.02] rounded-lg text-center">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No emission sources found
          </p>
        </div>
      )}
    </div>
  );
}