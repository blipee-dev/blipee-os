/**
 * Firecrawl-Inspired Dashboard Mockup
 *
 * This is a visual example showing the new light-mode-first design
 * DO NOT use in production yet - this is for design review only
 */

'use client';

import React from 'react';
import {
  Cloud,
  Zap,
  Target,
  TrendingDown,
  TrendingUp,
  Leaf,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  ChevronRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

// Sample data
const monthlyData = [
  { month: 'Jan', total: 142.3 },
  { month: 'Feb', total: 138.5 },
  { month: 'Mar', total: 145.2 },
  { month: 'Apr', total: 132.8 },
  { month: 'May', total: 128.4 },
  { month: 'Jun', total: 125.9 },
];

const topSources = [
  { name: 'Electricity', value: 456.8, percentage: 37, change: -8.5, icon: Zap, color: 'blue' },
  { name: 'Natural Gas', value: 234.5, percentage: 19, change: -4.2, icon: Cloud, color: 'orange' },
  { name: 'Business Travel', value: 123.4, percentage: 10, change: 12.3, icon: Target, color: 'purple' },
];

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  change?: number;
  trend?: 'up' | 'down';
}

function MetricCard({ icon: Icon, label, value, unit, subtitle, change, trend }: MetricCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer">
      {/* Icon + Label */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-green-600" />
        </div>
        <span className="text-xs uppercase tracking-wide text-gray-500 font-medium">
          {label}
        </span>
      </div>

      {/* Value - BIG */}
      <div className="mb-1">
        <span className="text-4xl font-medium text-gray-900">{value}</span>
      </div>

      {/* Unit + Change or Subtitle */}
      <div className="flex items-center justify-between">
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
        {subtitle && <span className="text-sm text-gray-500">{subtitle}</span>}

        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'down' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ScopeItem({ scope, value, percentage, color, description }: any) {
  const colorClasses = {
    red: 'bg-red-100 text-red-600',
    blue: 'bg-blue-100 text-blue-600',
    gray: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${colorClasses[color]?.split(' ')[0]}`} />
          <div>
            <div className="text-sm font-medium text-gray-900">{scope}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">{value} tCO2e</div>
          <div className="text-xs text-gray-500">{percentage}%</div>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]?.split(' ')[0].replace('bg-', 'bg-')}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function FirecrawlInspiredDashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Clean Light Mode */}
      <div className="w-60 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-normal text-gray-900">blipee</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {/* Active Item */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-100 text-gray-900 transition-colors">
            <LayoutDashboard className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">Overview</span>
          </button>

          {/* Regular Items */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
            <Leaf className="w-5 h-5" />
            <span className="text-sm">Sustainability</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
            <Target className="w-5 h-5" />
            <span className="text-sm">Targets</span>
          </button>

          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Settings</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-medium">PM</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">Pedro M.</p>
              <p className="text-xs text-gray-500">pedro@blipee.io</p>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 py-6">
            <h1 className="text-2xl font-medium text-gray-900">
              Sustainability Overview
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Track your environmental impact in real-time
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-4 gap-6">
            <MetricCard
              icon={Cloud}
              label="Total Emissions"
              value="1,234.5"
              unit="tCO2e YTD"
              change={12.5}
              trend="down"
            />
            <MetricCard
              icon={Zap}
              label="Energy Intensity"
              value="42.3"
              unit="kWh/m²"
              change={8.2}
              trend="down"
            />
            <MetricCard
              icon={Target}
              label="Target Progress"
              value="67%"
              subtitle="On track for 2030"
            />
            <MetricCard
              icon={TrendingUp}
              label="Data Quality"
              value="94%"
              subtitle="Primary data"
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Monthly Trend */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Emissions Trend
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Last 6 months
                  </p>
                </div>
                <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E7EB"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={12}
                      tickLine={false}
                      label={{
                        value: 'tCO2e',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fill: '#6B7280', fontSize: 12 }
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E5E7EB',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: '#10B981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scope Breakdown */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-6">
                Emissions by Scope
              </h3>

              <div className="space-y-6">
                <ScopeItem
                  scope="Scope 1"
                  value={234.5}
                  percentage={19}
                  color="red"
                  description="Direct emissions"
                />
                <ScopeItem
                  scope="Scope 2"
                  value={456.8}
                  percentage={37}
                  color="blue"
                  description="Purchased electricity"
                />
                <ScopeItem
                  scope="Scope 3"
                  value={543.2}
                  percentage={44}
                  color="gray"
                  description="Value chain"
                />
              </div>
            </div>
          </div>

          {/* Top Emitters Table */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">
              Top Emission Sources
            </h3>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                    Source
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                    Emissions
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                    % of Total
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide pb-3">
                    Change
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topSources.map((source, idx) => {
                  const Icon = source.icon;
                  const bgColor = source.color === 'blue' ? 'bg-blue-100' :
                                  source.color === 'orange' ? 'bg-orange-100' :
                                  'bg-purple-100';
                  const iconColor = source.color === 'blue' ? 'text-blue-600' :
                                    source.color === 'orange' ? 'text-orange-600' :
                                    'text-purple-600';

                  return (
                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 ${bgColor} rounded-lg flex items-center justify-center`}>
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {source.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-right text-sm text-gray-900">
                        {source.value} tCO2e
                      </td>
                      <td className="text-right text-sm text-gray-600">
                        {source.percentage}%
                      </td>
                      <td className="text-right">
                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${
                          source.change < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {source.change < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          {Math.abs(source.change)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Design System Reference */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-green-900 mb-1">
                  Firecrawl-Inspired Design System
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  This mockup demonstrates the new light-mode-first design with generous spacing,
                  single accent color (green), and minimal borders instead of glass morphism.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 bg-white rounded-md text-green-700 border border-green-200">
                    ✓ Light mode primary
                  </span>
                  <span className="px-2 py-1 bg-white rounded-md text-green-700 border border-green-200">
                    ✓ Single accent color
                  </span>
                  <span className="px-2 py-1 bg-white rounded-md text-green-700 border border-green-200">
                    ✓ 24px spacing
                  </span>
                  <span className="px-2 py-1 bg-white rounded-md text-green-700 border border-green-200">
                    ✓ Subtle borders
                  </span>
                  <span className="px-2 py-1 bg-white rounded-md text-green-700 border border-green-200">
                    ✓ Clear hierarchy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
