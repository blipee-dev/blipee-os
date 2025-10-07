'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Droplet,
  TrendingUp,
  TrendingDown,
  Cloud,
  Waves,
  Home,
  Recycle,
  DollarSign,
  Activity,
  Gauge,
  Info
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

interface WaterDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: { start: string; end: string; label: string };
}

interface WaterSource {
  name: string;
  type: string;
  withdrawal: number;
  discharge: number;
  cost: number;
  isRecycled: boolean;
}

export function WaterDashboard({ organizationId, selectedSite, selectedPeriod }: WaterDashboardProps) {
  const [loading, setLoading] = React.useState(true);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [totalWithdrawal, setTotalWithdrawal] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalDischarge, setTotalDischarge] = useState(0);
  const [totalRecycled, setTotalRecycled] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [waterIntensity, setWaterIntensity] = useState(0);

  // Fetch water data
  React.useEffect(() => {
    const fetchWaterData = async () => {
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

        const res = await fetch(`/api/water/sources?${params}`);
        const data = await res.json();

        if (data.sources) {
          setWaterSources(data.sources);
          setTotalWithdrawal(data.total_withdrawal || 0);
          setTotalConsumption(data.total_consumption || 0);
          setTotalDischarge(data.total_discharge || 0);
          setTotalRecycled(data.total_recycled || 0);
          setTotalCost(data.total_cost || 0);
          setRecyclingRate(data.recycling_rate || 0);
          setMonthlyTrends(data.monthly_trends || []);
          setPrevYearMonthlyTrends(data.prev_year_monthly_trends || []);
          setWaterIntensity(data.water_intensity || 0);
        }
      } catch (error) {
        console.error('Error fetching water data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaterData();
  }, [selectedSite, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  const getSourceColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'municipal': '#3b82f6',
      'groundwater': '#06b6d4',
      'surface_water': '#0ea5e9',
      'rainwater': '#60a5fa',
      'recycled': '#10b981',
      'seawater': '#0284c7',
      'wastewater': '#6b7280',
      'other': '#94a3b8'
    };
    return colors[type] || colors['other'];
  };

  // Prepare data for source breakdown pie chart
  const sourceBreakdown = waterSources.map(source => ({
    name: source.name,
    value: source.withdrawal,
    type: source.type,
    discharge: source.discharge,
    isRecycled: source.isRecycled
  }));

  const totalWithdrawalForPie = sourceBreakdown.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Droplet className="w-7 h-7 text-blue-500" />
              Water & Effluents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GRI 303: Water and Effluents 2018 • Water withdrawal, consumption, discharge & recycling
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Withdrawal</span>
              <Droplet className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totalWithdrawal / 1000).toFixed(1)} ML
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">GRI 303-3</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Consumption</span>
              <Activity className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totalConsumption / 1000).toFixed(1)} ML
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">GRI 303-5</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Discharge</span>
              <Waves className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totalDischarge / 1000).toFixed(1)} ML
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">GRI 303-4</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Recycling Rate</span>
              <Recycle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {recyclingRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {(totalRecycled / 1000).toFixed(1)} ML recycled
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Intensity</span>
              <Gauge className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(waterIntensity / 1000).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">ML consumed</div>
          </div>
        </div>
      </div>

      {/* Water Sources Distribution and Monthly Trends */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        {/* Water Sources Distribution Pie Chart */}
        {sourceBreakdown.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Water Sources Distribution</h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 303-3
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E3
                </span>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={(entry) => `${entry.name} ${((entry.value / totalWithdrawalForPie) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSourceColor(entry.type)} />
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
                      const color = getSourceColor(data.type);

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">{data.name}</p>
                          <p className="text-sm" style={{ color }}>
                            Withdrawal: {(data.value / 1000).toFixed(2)} ML
                          </p>
                          <p className="text-sm" style={{ color }}>
                            Share: {((data.value / totalWithdrawalForPie) * 100).toFixed(1)}%
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            Discharge: {(data.discharge / 1000).toFixed(2)} ML
                          </p>
                          {data.isRecycled && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded">
                              Recycled
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

        {/* Monthly Water Balance Trend */}
        {monthlyTrends.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Monthly Water Balance</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Withdrawal, discharge, and consumption
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E3
                </span>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                  TCFD
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
                  label={{ value: 'ML', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => (value / 1000).toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [(value / 1000).toFixed(2) + ' ML', '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="withdrawal"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Withdrawal"
                />
                <Line
                  type="monotone"
                  dataKey="discharge"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Discharge"
                />
                <Line
                  type="monotone"
                  dataKey="consumption"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Consumption (Total)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Year-over-Year Comparison */}
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
                  GRI 303-3
                </span>
                <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                  TCFD
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
                  label={{ value: 'ML', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
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
                          <p className="text-sm text-blue-400">
                            Current: {(data.current / 1000).toFixed(2)} ML
                          </p>
                          <p className="text-sm text-gray-400">
                            Previous: {(data.previous / 1000).toFixed(2)} ML
                          </p>
                          <p className={`text-sm font-bold mt-1 ${isIncrease ? 'text-red-400' : 'text-green-400'}`}>
                            Change: {isIncrease ? '+' : ''}{(data.change / 1000).toFixed(2)} ML ({isIncrease ? '+' : ''}{changePercent}%)
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

          {/* Water Balance Summary */}
          <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 flex flex-col" style={{ height: '430px' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Water Balance Summary</h3>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 303-5
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E3
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-6">
              <div className="space-y-4">
                {/* Withdrawal */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Total Withdrawal</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(totalWithdrawal / 1000).toFixed(1)} ML
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>

                {/* Discharge */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Waves className="w-4 h-4 text-cyan-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Total Discharge</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(totalDischarge / 1000).toFixed(1)} ML
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-cyan-500"
                      style={{ width: `${(totalDischarge / totalWithdrawal) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Consumption */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Consumption (W - D)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(totalConsumption / 1000).toFixed(1)} ML
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${(totalConsumption / totalWithdrawal) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Recycled */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Recycle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">Recycled Water</span>
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                      {(totalRecycled / 1000).toFixed(1)} ML ({recyclingRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${recyclingRate}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>GRI 303-5:</strong> Water consumption is calculated as total withdrawal minus total discharge.
                    This represents water that is not returned to local ecosystems or communities.
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
