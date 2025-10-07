'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Recycle,
  TrendingUp,
  TrendingDown,
  Leaf,
  Package,
  Factory,
  Activity,
  AlertTriangle,
  Info,
  Cloud
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface WasteDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: { start: string; end: string; label: string };
}

interface WasteStream {
  type: string;
  disposal_method: string;
  quantity: number;
  unit: string;
  diverted: boolean;
  emissions: number;
}

export function WasteDashboard({ organizationId, selectedSite, selectedPeriod }: WasteDashboardProps) {
  const [loading, setLoading] = React.useState(true);
  const [wasteStreams, setWasteStreams] = useState<WasteStream[]>([]);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [totalDiverted, setTotalDiverted] = useState(0);
  const [totalLandfill, setTotalLandfill] = useState(0);
  const [diversionRate, setDiversionRate] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);

  // Fetch waste data
  React.useEffect(() => {
    const fetchWasteData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedPeriod) {
          params.append('start_date', selectedPeriod.start);
          params.append('end_date', selectedPeriod.end);
        }
        if (selectedSite) {
          params.append('site_id', selectedSite.id);
        }

        const res = await fetch(`/api/waste/streams?${params}`);
        const data = await res.json();

        if (data.streams) {
          setWasteStreams(data.streams);
          setTotalGenerated(data.total_generated || 0);
          setTotalDiverted(data.total_diverted || 0);
          setTotalLandfill(data.total_landfill || 0);
          setDiversionRate(data.diversion_rate || 0);
          setRecyclingRate(data.recycling_rate || 0);
          setTotalEmissions(data.total_emissions || 0);
          setMonthlyTrends(data.monthly_trends || []);
          setPrevYearMonthlyTrends(data.prev_year_monthly_trends || []);
        }
      } catch (error) {
        console.error('Error fetching waste data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWasteData();
  }, [selectedSite, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  const getDisposalColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'recycling': '#10b981',
      'composting': '#22c55e',
      'incineration': '#f97316',
      'landfill': '#ef4444',
      'hazardous_treatment': '#dc2626',
      'other': '#6b7280'
    };
    return colors[method] || colors['other'];
  };

  // Prepare disposal method breakdown
  const disposalBreakdown = wasteStreams.reduce((acc: any[], stream) => {
    const existing = acc.find(s => s.method === stream.disposal_method);
    if (existing) {
      existing.quantity += stream.quantity;
      existing.emissions += stream.emissions;
    } else {
      acc.push({
        method: stream.disposal_method,
        quantity: stream.quantity,
        emissions: stream.emissions,
        diverted: stream.diverted
      });
    }
    return acc;
  }, []);

  const totalQuantity = disposalBreakdown.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Recycle className="w-7 h-7 text-green-500" />
              Waste & Circular Economy
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GRI 306: Waste 2020 • Waste generated, diverted from disposal & directed to disposal
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Generated</span>
              <Trash2 className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totalGenerated / 1000).toFixed(1)}t
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">GRI 306-3</div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Diverted</span>
              <Recycle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {diversionRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">GRI 306-4</div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">To Disposal</span>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {(totalLandfill / 1000).toFixed(1)}t
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">GRI 306-5</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Recycling</span>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {recyclingRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">ESRS E5</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Emissions</span>
              <Cloud className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalEmissions.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO2e • Scope 3</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Intensity</span>
              <Activity className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalGenerated > 0 ? (totalEmissions / (totalGenerated / 1000)).toFixed(2) : '0.00'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">tCO2e/t waste</div>
          </div>
        </div>
      </div>

      {/* Disposal Method Distribution and Monthly Trends */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        {/* Disposal Method Pie Chart */}
        {disposalBreakdown.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Disposal Method Distribution</h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 306-4
                </span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                  GRI 306-5
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={disposalBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.method} ${((entry.quantity / totalQuantity) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantity"
                >
                  {disposalBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getDisposalColor(entry.method)} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const color = getDisposalColor(data.method);

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2 capitalize">{data.method}</p>
                          <p className="text-sm" style={{ color }}>
                            Quantity: {(data.quantity / 1000).toFixed(2)} tons
                          </p>
                          <p className="text-sm" style={{ color }}>
                            Share: {((data.quantity / totalQuantity) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Emissions: {data.emissions.toFixed(2)} tCO2e
                          </p>
                          {data.diverted && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              Diverted from Disposal
                            </span>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Waste Trends */}
        {monthlyTrends.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Waste Trends</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Generated, diverted, and disposal
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E5
                </span>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                  GHG Protocol
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'tons', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [(value / 1000).toFixed(2) + ' tons', '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="generated"
                  stroke="#6b7280"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Generated"
                />
                <Line
                  type="monotone"
                  dataKey="diverted"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Diverted"
                />
                <Line
                  type="monotone"
                  dataKey="emissions"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Emissions (tCO2e)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Waste Hierarchy Stacked Bar Chart */}
      {monthlyTrends.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Waste by Disposal Method</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Waste hierarchy: Reduce → Reuse → Recycle → Recovery → Disposal
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 306-4
                </span>
                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                  GRI 306-5
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E5
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'tons', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [(value / 1000).toFixed(2) + ' tons', '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="recycled" stackId="waste" fill="#10b981" name="Recycled" />
                <Bar dataKey="composted" stackId="waste" fill="#22c55e" name="Composted" />
                <Bar dataKey="incinerated" stackId="waste" fill="#f97316" name="Incinerated" />
                <Bar dataKey="landfill" stackId="waste" fill="#ef4444" name="Landfill" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Year-over-Year Comparison and Diversion Rate */}
      {prevYearMonthlyTrends.length > 0 && (
        <div className="px-6 pb-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex flex-col" style={{ height: '430px' }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Year-over-Year Comparison</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Monthly change vs previous year
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 306-3
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E5
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={prevYearMonthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'tons', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const changePercent = data.previous > 0
                        ? ((data.change / data.previous) * 100).toFixed(1)
                        : '0.0';
                      const isIncrease = data.change > 0;

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.month}</p>
                          <p className="text-sm text-gray-400">
                            Current: {(data.current / 1000).toFixed(2)} tons
                          </p>
                          <p className="text-sm text-gray-400">
                            Previous: {(data.previous / 1000).toFixed(2)} tons
                          </p>
                          <p className={`text-sm font-bold mt-1 ${isIncrease ? 'text-red-400' : 'text-green-400'}`}>
                            Change: {isIncrease ? '+' : ''}{(data.change / 1000).toFixed(2)} tons ({isIncrease ? '+' : ''}{changePercent}%)
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="change"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Circular Economy Metrics */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex flex-col" style={{ height: '430px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Circular Economy Metrics</h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E5
                </span>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                  GHG Protocol
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                {/* Diversion Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Recycle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Diversion Rate</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {diversionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${diversionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(totalDiverted / 1000).toFixed(1)} tons diverted from disposal
                  </p>
                </div>

                {/* Recycling Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Recycling Rate</span>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {recyclingRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${recyclingRate}%` }}
                    />
                  </div>
                </div>

                {/* Landfill Rate */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">To Landfill</span>
                    </div>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {((totalLandfill / totalGenerated) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${(totalLandfill / totalGenerated) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {(totalLandfill / 1000).toFixed(1)} tons to landfill
                  </p>
                </div>

                {/* Emissions from Waste */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Scope 3 Emissions</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {totalEmissions.toFixed(1)} tCO2e
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gray-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Category 5: Waste generated in operations
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Waste Hierarchy:</strong> Prevention → Reuse → Recycling → Recovery → Disposal.
                    Diversion rate measures waste diverted from disposal through recycling and composting.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
