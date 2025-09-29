'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Factory, Zap, Package } from 'lucide-react';
import { GHG_PROTOCOL_COLORS, getAllScopeColors } from '@/lib/constants/ghg-colors';

interface ScopeBreakdownProps {
  scopeData: any;
  selectedScope: 'all' | '1' | '2' | '3';
  onScopeSelect: (scope: 'all' | '1' | '2' | '3') => void;
}

export function ScopeBreakdown({ scopeData, selectedScope, onScopeSelect }: ScopeBreakdownProps) {
  // Prepare pie chart data with GHG Protocol colors
  const pieData = [
    { name: 'Scope 1', value: scopeData.scope_1.total, color: GHG_PROTOCOL_COLORS.scope1.primary },
    { name: 'Scope 2', value: scopeData.scope_2.total, color: GHG_PROTOCOL_COLORS.scope2.primary },
    { name: 'Scope 3', value: scopeData.scope_3.total, color: GHG_PROTOCOL_COLORS.scope3.primary }
  ];

  // Prepare radar chart data for scope comparison
  const radarData = [
    {
      category: 'Direct',
      current: (scopeData.scope_1.total / 1500) * 100,
      target: 60,
      baseline: 80
    },
    {
      category: 'Energy',
      current: (scopeData.scope_2.total / 1000) * 100,
      target: 50,
      baseline: 90
    },
    {
      category: 'Supply Chain',
      current: (scopeData.scope_3.total / 4000) * 100,
      target: 70,
      baseline: 95
    },
    {
      category: 'Coverage',
      current: scopeData.scope_3.coverage || 67,
      target: 95,
      baseline: 50
    },
    {
      category: 'Data Quality',
      current: 75,
      target: 90,
      baseline: 60
    }
  ];

  const totalEmissions = scopeData.scope_1.total + scopeData.scope_2.total + scopeData.scope_3.total;

  const scopeButtons = [
    { id: 'all', label: 'All Scopes', icon: null },
    { id: '1', label: 'Scope 1', icon: <Factory className="w-4 h-4" />, color: 'text-purple-500' },
    { id: '2', label: 'Scope 2', icon: <Zap className="w-4 h-4" />, color: 'text-yellow-500' },
    { id: '3', label: 'Scope 3', icon: <Package className="w-4 h-4" />, color: 'text-blue-500' }
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
          <p className="text-white font-semibold">{payload[0].name}</p>
          <p className="text-sm text-gray-300">
            {payload[0].value.toFixed(1)} tCO2e
          </p>
          <p className="text-sm text-gray-400">
            {((payload[0].value / totalEmissions) * 100).toFixed(1)}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Emissions by Scope
        </h3>
        <div className="flex gap-2">
          {scopeButtons.map(button => (
            <button
              key={button.id}
              onClick={() => onScopeSelect(button.id as any)}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-sm transition-colors ${
                selectedScope === button.id
                  ? 'bg-gradient-to-r from-green-500 to-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/[0.08]'
              }`}
            >
              {button.icon && <span className={button.color}>{button.icon}</span>}
              {button.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pie Chart */}
      <div className="mb-6">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Scope Details */}
      <div className="space-y-3">
        {pieData.map((scope, index) => (
          <motion.div
            key={scope.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: scope.color }} />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{scope.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((scope.value / totalEmissions) * 100).toFixed(1)}% of total
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-white">
                {scope.value.toFixed(1)} tCO2e
              </p>
              <p className="text-xs text-gray-500">
                {scope.name === 'Scope 1' && scopeData.scope_1.trend !== 0 && (
                  <span className={scopeData.scope_1.trend < 0 ? 'text-green-500' : 'text-red-500'}>
                    {scopeData.scope_1.trend > 0 ? '+' : ''}{scopeData.scope_1.trend}%
                  </span>
                )}
                {scope.name === 'Scope 2' && scopeData.scope_2.trend !== 0 && (
                  <span className={scopeData.scope_2.trend < 0 ? 'text-green-500' : 'text-red-500'}>
                    {scopeData.scope_2.trend > 0 ? '+' : ''}{scopeData.scope_2.trend}%
                  </span>
                )}
                {scope.name === 'Scope 3' && scopeData.scope_3.trend !== 0 && (
                  <span className={scopeData.scope_3.trend < 0 ? 'text-green-500' : 'text-red-500'}>
                    {scopeData.scope_3.trend > 0 ? '+' : ''}{scopeData.scope_3.trend}%
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Radar Chart for Performance */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/[0.05]">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
          Performance Overview
        </h4>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData}>
            <PolarGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.2)" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fontSize: 11 }}
              className="text-gray-500"
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fontSize: 10 }}
              className="text-gray-400"
            />
            <Radar
              name="Current"
              dataKey="current"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.3}
            />
            <Radar
              name="Target"
              dataKey="target"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.2}
            />
            <Radar
              name="Baseline"
              dataKey="baseline"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.1}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}