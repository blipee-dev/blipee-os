'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Treemap,
  Cell
} from 'recharts';
import {
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Info
} from 'lucide-react';

interface CategoryDrilldownProps {
  scopeData: any;
  selectedScope: 'all' | '1' | '2' | '3';
}

export function CategoryDrilldown({ scopeData, selectedScope }: CategoryDrilldownProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'treemap'>('bar');

  // Prepare data based on selected scope
  const getCategoryData = () => {
    if (selectedScope === '1' || selectedScope === 'all') {
      return Object.entries(scopeData.scope_1.categories).map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value as number,
        scope: 'Scope 1',
        color: '#8B5CF6'
      }));
    }
    if (selectedScope === '2') {
      return Object.entries(scopeData.scope_2.categories).map(([key, value]) => ({
        name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: value as number,
        scope: 'Scope 2',
        color: '#EAB308'
      }));
    }
    if (selectedScope === '3') {
      return Object.entries(scopeData.scope_3.categories)
        .filter(([_, data]: any) => data.included && data.value > 0)
        .map(([key, data]: any) => ({
          name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          value: data.value,
          scope: 'Scope 3',
          color: '#3B82F6',
          dataQuality: data.data_quality
        }));
    }

    // All scopes combined
    const allData = [
      ...Object.entries(scopeData.scope_1.categories).map(([key, value]) => ({
        name: `S1: ${key.replace(/_/g, ' ')}`,
        value: value as number,
        scope: 'Scope 1',
        color: '#8B5CF6'
      })),
      ...Object.entries(scopeData.scope_2.categories).map(([key, value]) => ({
        name: `S2: ${key.replace(/_/g, ' ')}`,
        value: value as number,
        scope: 'Scope 2',
        color: '#EAB308'
      })),
      ...Object.entries(scopeData.scope_3.categories)
        .filter(([_, data]: any) => data.included && data.value > 0)
        .map(([key, data]: any) => ({
          name: `S3: ${key.replace(/_/g, ' ')}`,
          value: data.value,
          scope: 'Scope 3',
          color: '#3B82F6'
        }))
    ];

    return allData.sort((a, b) => b.value - a.value).slice(0, 10);
  };

  const categoryData = getCategoryData();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
          <p className="text-white font-semibold">{data.name}</p>
          <p className="text-sm text-gray-300">
            {data.value.toFixed(1)} tCO2e
          </p>
          {data.dataQuality && (
            <p className="text-xs text-gray-400 mt-1">
              Data Quality: {(data.dataQuality * 100).toFixed(0)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#8B5CF6', '#EAB308', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#06B6D4'];

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Category Breakdown
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('bar')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'bar'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300'
            }`}
          >
            Bar Chart
          </button>
          <button
            onClick={() => setViewMode('treemap')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              viewMode === 'treemap'
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300'
            }`}
          >
            Treemap
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        {viewMode === 'bar' ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                style={{ fontSize: '11px' }}
                stroke="#999"
              />
              <YAxis
                style={{ fontSize: '12px' }}
                stroke="#999"
                tickFormatter={(value) => `${(value / 100).toFixed(0)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <Treemap
              data={categoryData}
              dataKey="value"
              aspectRatio={4 / 3}
              stroke="#fff"
              fill="#8B5CF6"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
        )}
      </div>

      {/* Category List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {categoryData.map((category, index) => {
          const trend = Math.random() > 0.5 ? Math.random() * 10 - 5 : 0; // Mock trend
          return (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color || COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {category.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.scope}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {category.value.toFixed(1)} tCO2e
                  </p>
                  <div className="flex items-center justify-end gap-1">
                    {trend > 0 ? (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    ) : trend < 0 ? (
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    ) : (
                      <Minus className="w-3 h-3 text-gray-400" />
                    )}
                    <span className={`text-xs ${
                      trend > 0 ? 'text-red-500' : trend < 0 ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {trend !== 0 ? `${trend > 0 ? '+' : ''}${trend.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Info Box */}
      {selectedScope === '3' && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Scope 3 categories shown are those with available data.
                Coverage: {scopeData.scope_3.coverage}% of estimated total Scope 3 emissions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}