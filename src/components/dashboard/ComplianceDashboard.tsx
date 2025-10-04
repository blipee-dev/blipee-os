'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Info,
  FileCheck,
  Target,
  Leaf,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ComplianceDashboardProps {
  organizationId: string;
}

interface ScopeData {
  scope: string;
  value: number;
  previousYear: number;
  baseYear: number;
  baseYearValue: number;
  trend: number;
  categories: {
    name: string;
    value: number;
    measured: boolean;
  }[];
}

export function ComplianceDashboard({ organizationId }: ComplianceDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'ghg' | 'gri'>('ghg');
  const [scopeData, setScopeData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch scope analysis data
        const scopeResponse = await fetch('/api/sustainability/scope-analysis?period=year');
        const scopeResult = await scopeResponse.json();

        // Fetch dashboard data for additional metrics
        const dashboardResponse = await fetch('/api/sustainability/dashboard?range=2024');
        const dashboardResult = await dashboardResponse.json();

        console.log('Scope analysis response:', scopeResult);
        console.log('Dashboard response:', dashboardResult);

        // Extract scopeData from nested structure
        const extractedScopeData = scopeResult.scopeData || scopeResult;

        // Transform API data structure to match component expectations
        const transformedData = {
          totalEmissions: (extractedScopeData.scope_1?.total || 0) +
                         (extractedScopeData.scope_2?.total || 0) +
                         (extractedScopeData.scope_3?.total || 0),
          scope1: {
            totalEmissions: extractedScopeData.scope_1?.total || 0,
            categoryBreakdown: Object.entries(extractedScopeData.scope_1?.categories || {}).map(([key, value]) => ({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: value as number,
              measured: true
            })).filter(cat => cat.value > 0)
          },
          scope2: {
            totalEmissions: extractedScopeData.scope_2?.total || 0,
            categoryBreakdown: Object.entries(extractedScopeData.scope_2?.categories || {}).map(([key, value]) => ({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: value as number,
              measured: true
            })).filter(cat => cat.value > 0)
          },
          scope3: {
            totalEmissions: extractedScopeData.scope_3?.total || 0,
            categoryBreakdown: Object.entries(extractedScopeData.scope_3?.categories || {}).map(([key, value]: [string, any]) => ({
              name: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              value: value.value || 0,
              measured: value.included || false
            })).filter(cat => cat.value > 0)
          }
        };

        setScopeData(transformedData);
        setDashboardData(dashboardResult);
      } catch (error) {
        console.error('Error fetching compliance data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto" />
          <p className="text-gray-400">Loading compliance data...</p>
        </div>
      </div>
    );
  }

  if (!scopeData || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
          <p className="text-gray-400">No compliance data available</p>
        </div>
      </div>
    );
  }

  const { totalEmissions, scope1, scope2, scope3 } = scopeData;

  // Calculate safe percentages
  const safeTotal = totalEmissions || 1; // Avoid division by zero
  const scope1Emissions = scope1?.totalEmissions || 0;
  const scope2Emissions = scope2?.totalEmissions || 0;
  const scope3Emissions = scope3?.totalEmissions || 0;

  const scope1Percentage = Math.round((scope1Emissions / safeTotal) * 100) || 0;
  const scope2Percentage = Math.round((scope2Emissions / safeTotal) * 100) || 0;
  const scope3Percentage = Math.round((scope3Emissions / safeTotal) * 100) || 0;

  // Prepare scope breakdown for charts
  const scopeBreakdown = [
    {
      name: 'Scope 1',
      value: scope1Emissions,
      percentage: scope1Percentage,
      color: '#8B5CF6'
    },
    {
      name: 'Scope 2',
      value: scope2Emissions,
      percentage: scope2Percentage,
      color: '#3B82F6'
    },
    {
      name: 'Scope 3',
      value: scope3Emissions,
      percentage: scope3Percentage,
      color: '#10B981'
    }
  ].filter(scope => scope.value > 0);

  // Prepare category data
  const categoryData = [
    ...(scope1?.categoryBreakdown || []).map((cat: any) => ({
      category: cat.name,
      scope: 'Scope 1',
      value: cat.value,
      measured: cat.measured
    })),
    ...(scope2?.categoryBreakdown || []).map((cat: any) => ({
      category: cat.name,
      scope: 'Scope 2',
      value: cat.value,
      measured: cat.measured
    })),
    ...(scope3?.categoryBreakdown || []).map((cat: any) => ({
      category: cat.name.replace(/^\d+\.\s*/, ''),
      scope: 'Scope 3',
      value: cat.value,
      measured: cat.measured
    }))
  ].filter(cat => cat.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-green-500" />
            Compliance Dashboard
          </h2>
          <p className="text-gray-400 mt-1">GHG Protocol & GRI Standards</p>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 bg-white/[0.03] p-1 rounded-xl">
          <button
            onClick={() => setSelectedView('ghg')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedView === 'ghg'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            GHG Protocol
          </button>
          <button
            onClick={() => setSelectedView('gri')}
            className={`px-4 py-2 rounded-lg transition-all ${
              selectedView === 'gri'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            GRI Standards
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total Emissions</span>
            <Leaf className="w-4 h-4 text-green-500" />
          </div>
          <div className="text-2xl font-bold">{Math.round(totalEmissions * 10) / 10}</div>
          <div className="text-xs text-gray-500">tCO2e</div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Scope 1</span>
            <div className="w-3 h-3 bg-purple-500 rounded" />
          </div>
          <div className="text-2xl font-bold">{Math.round(scope1Emissions * 10) / 10}</div>
          <div className="text-xs text-gray-500">tCO2e • {scope1Percentage}%</div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Scope 2</span>
            <div className="w-3 h-3 bg-blue-500 rounded" />
          </div>
          <div className="text-2xl font-bold">{Math.round(scope2Emissions * 10) / 10}</div>
          <div className="text-xs text-gray-500">tCO2e • {scope2Percentage}%</div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Scope 3</span>
            <div className="w-3 h-3 bg-green-500 rounded" />
          </div>
          <div className="text-2xl font-bold">{Math.round(scope3Emissions * 10) / 10}</div>
          <div className="text-xs text-gray-500">tCO2e • {scope3Percentage}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Scope Breakdown */}
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Scope Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scopeBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {scopeBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => `${Math.round(value * 10) / 10} tCO2e`}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Top Emission Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="category"
                tick={{ fill: '#888', fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fill: '#888' }} />
              <Tooltip
                formatter={(value: any) => `${Math.round(value * 10) / 10} tCO2e`}
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="value" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Details */}
      <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Emission Categories Detail</h3>
        <div className="space-y-2">
          {categoryData.map((cat, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.05] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  cat.measured ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <div className="font-medium">{cat.category}</div>
                  <div className="text-xs text-gray-500">{cat.scope}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{Math.round(cat.value * 10) / 10} tCO2e</div>
                <div className="text-xs text-gray-500">
                  {cat.measured ? 'Measured' : 'Estimated'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance Status */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            GHG Protocol Compliance
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Scope 1 Reporting</span>
              <span className="text-green-500 font-semibold">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Scope 2 Reporting</span>
              <span className="text-green-500 font-semibold">Complete</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Scope 3 Reporting</span>
              <span className="text-yellow-500 font-semibold">Partial</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Base Year Set</span>
              <span className="text-green-500 font-semibold">2024</span>
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Data Quality Score
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Measured Data</span>
              <span className="text-green-500 font-semibold">
                {Math.round((categoryData.filter(c => c.measured).length / categoryData.length) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Estimated Data</span>
              <span className="text-yellow-500 font-semibold">
                {Math.round((categoryData.filter(c => !c.measured).length / categoryData.length) * 100)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Coverage</span>
              <span className="text-green-500 font-semibold">
                {Math.round((categoryData.filter(c => c.value > 0).length / 15) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
