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
import { SBTiWasteTarget } from '@/components/sustainability/waste/SBTiWasteTarget';
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
  const [totalDisposal, setTotalDisposal] = useState(0);
  const [totalLandfill, setTotalLandfill] = useState(0);
  const [diversionRate, setDiversionRate] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [prevYearMonthlyTrends, setPrevYearMonthlyTrends] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any>(null);

  // YoY comparison state
  const [yoyGeneratedChange, setYoyGeneratedChange] = useState<number | null>(null);
  const [yoyDiversionChange, setYoyDiversionChange] = useState<number | null>(null);
  const [yoyRecyclingChange, setYoyRecyclingChange] = useState<number | null>(null);
  const [yoyEmissionsChange, setYoyEmissionsChange] = useState<number | null>(null);

  // Material breakdown state
  const [materialBreakdown, setMaterialBreakdown] = useState<any[]>([]);

  // SBTi waste target state
  const [wasteTargetData, setWasteTargetData] = useState<{
    baseline2023Emissions: number;
    baseline2023DiversionRate: number;
  } | null>(null);

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
          setTotalDisposal(data.total_disposal || 0);
          setTotalLandfill(data.total_landfill || 0);
          setDiversionRate(data.diversion_rate || 0);
          setRecyclingRate(data.recycling_rate || 0);
          setTotalEmissions(data.total_emissions || 0);

          // Filter monthly trends to only show selected period
          const filteredTrends = (data.monthly_trends || []).filter((trend: any) => {
            if (!selectedPeriod) return true;
            const trendYear = parseInt(trend.monthKey.split('-')[0]);
            const selectedYear = new Date(selectedPeriod.start).getFullYear();
            return trendYear === selectedYear;
          });
          setMonthlyTrends(filteredTrends);
          setMaterialBreakdown(data.material_breakdown || []);
        }

        // Fetch previous year data for YoY comparison (matching Water/Energy dashboard pattern)
        if (selectedPeriod && data.monthly_trends && data.monthly_trends.length > 0) {
          const startDate = new Date(selectedPeriod.start);
          const previousYearStart = new Date(startDate);
          previousYearStart.setFullYear(startDate.getFullYear() - 1);

          const endDate = new Date(selectedPeriod.end);
          const previousYearEnd = new Date(endDate);
          previousYearEnd.setFullYear(endDate.getFullYear() - 1);

          const prevParams = new URLSearchParams({
            start_date: previousYearStart.toISOString().split('T')[0],
            end_date: previousYearEnd.toISOString().split('T')[0]
          });
          if (selectedSite) {
            prevParams.append('site_id', selectedSite.id);
          }

          const prevRes = await fetch(`/api/waste/streams?${prevParams}`);
          const prevData = await prevRes.json();

          if (prevData.monthly_trends && prevData.monthly_trends.length > 0) {
            setPrevYearMonthlyTrends(prevData.monthly_trends);
          } else {
            setPrevYearMonthlyTrends([]);
          }
        }

        // Fetch previous year data for YoY comparison
        if (selectedPeriod && data.total_generated && data.total_generated > 0) {
          const startDate = new Date(selectedPeriod.start);
          const previousYearStart = new Date(startDate);
          previousYearStart.setFullYear(startDate.getFullYear() - 1);

          const endDate = new Date(selectedPeriod.end);
          const previousYearEnd = new Date(endDate);
          previousYearEnd.setFullYear(endDate.getFullYear() - 1);

          const prevParams = new URLSearchParams({
            start_date: previousYearStart.toISOString().split('T')[0],
            end_date: previousYearEnd.toISOString().split('T')[0],
          });
          if (selectedSite) {
            prevParams.append('site_id', selectedSite.id);
          }

          const prevRes = await fetch(`/api/waste/streams?${prevParams}`);
          const prevData = await prevRes.json();

          // Calculate YoY changes
          if (prevData.total_generated && prevData.total_generated > 0) {
            const generatedChange = ((data.total_generated - prevData.total_generated) / prevData.total_generated) * 100;
            const diversionChange = data.diversion_rate - prevData.diversion_rate;
            const recyclingChange = data.recycling_rate - prevData.recycling_rate;
            const emissionsChange = ((data.total_emissions - prevData.total_emissions) / prevData.total_emissions) * 100;

            setYoyGeneratedChange(generatedChange);
            setYoyDiversionChange(diversionChange);
            setYoyRecyclingChange(recyclingChange);
            setYoyEmissionsChange(emissionsChange);
          }
        }
      } catch (error) {
        console.error('Error fetching waste data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWasteData();
  }, [selectedSite, selectedPeriod]);

  // Fetch waste forecast data
  React.useEffect(() => {
    const fetchForecastData = async () => {
      if (!selectedPeriod) return;

      try {
        const forecastParams = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end,
        });
        if (selectedSite) {
          forecastParams.append('site_id', selectedSite.id);
        }

        const forecastRes = await fetch(`/api/waste/forecast?${forecastParams}`);
        const forecastData = await forecastRes.json();

        if (forecastData.forecast && forecastData.forecast.length > 0) {
          console.log(`🔮 Waste Forecast: ${forecastData.forecast.length} months, Method: ${forecastData.model}`);
          setForecastData(forecastData);
        } else {
          console.log('⚠️ No waste forecast data available');
          setForecastData(null);
        }
      } catch (error) {
        console.error('Error fetching waste forecast:', error);
        setForecastData(null);
      }
    };

    fetchForecastData();
  }, [selectedSite, selectedPeriod]);

  // Fetch SBTi baseline data (2023) - only for current year view
  React.useEffect(() => {
    const fetchBaselineData = async () => {
      const currentYear = new Date().getFullYear();
      const selectedYear = selectedPeriod ? new Date(selectedPeriod.start).getFullYear() : currentYear;

      // Only fetch baseline data when viewing current year
      if (selectedYear !== currentYear) {
        setWasteTargetData(null);
        return;
      }

      try {
        const baseline2023Params = new URLSearchParams({
          start_date: '2023-01-01',
          end_date: '2023-12-31',
        });
        if (selectedSite) {
          baseline2023Params.append('site_id', selectedSite.id);
        }

        const baseline2023Res = await fetch(`/api/waste/streams?${baseline2023Params}`);
        const baseline2023Data = await baseline2023Res.json();

        setWasteTargetData({
          baseline2023Emissions: baseline2023Data.total_emissions || 0,
          baseline2023DiversionRate: baseline2023Data.diversion_rate || 0,
        });
      } catch (error) {
        console.error('Error fetching baseline waste data:', error);
      }
    };

    fetchBaselineData();
  }, [selectedSite, selectedPeriod]);

  // Helper functions
  const getDisposalColor = (method: string) => {
    const colors: { [key: string]: string } = {
      'recycling': '#10b981',
      'composting': '#22c55e',
      'incineration': '#f97316',
      'incineration_no_recovery': '#f97316',
      'incineration_recovery': '#fb923c',
      'landfill': '#ef4444',
      'hazardous_treatment': '#dc2626',
      'other': '#6b7280'
    };
    return colors[method] || colors['other'];
  };

  const formatDisposalMethod = (method: string) => {
    const labels: { [key: string]: string } = {
      'recycling': 'Recycling',
      'composting': 'Composting',
      'incineration_no_recovery': 'Incineration',
      'incineration_recovery': 'Waste-to-Energy',
      'landfill': 'Landfill',
      'hazardous_treatment': 'Hazardous Treatment',
      'reuse': 'Reuse',
      'other': 'Other'
    };
    return labels[method] || method.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

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
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Recycle className="w-6 h-6 text-green-500" />
            Waste & Circular Economy
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GRI 306 • ESRS E5 • Waste generated, diverted from disposal & directed to disposal
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 pb-6 grid grid-cols-6 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Generated</span>
            <Trash2 className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalGenerated.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tons</div>
            </div>
            {yoyGeneratedChange !== null && (
              <div className="flex items-center gap-1">
                {yoyGeneratedChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyGeneratedChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyGeneratedChange > 0 ? 'text-red-500' : yoyGeneratedChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyGeneratedChange > 0 ? '+' : ''}{yoyGeneratedChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Diverted</span>
            <Recycle className="w-4 h-4 text-green-600" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {diversionRate.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">%</div>
            </div>
            {yoyDiversionChange !== null && (
              <div className="flex items-center gap-1">
                {yoyDiversionChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyDiversionChange > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${yoyDiversionChange > 0 ? 'text-green-500' : yoyDiversionChange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {yoyDiversionChange > 0 ? '+' : ''}{yoyDiversionChange.toFixed(1)}pp YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">To Disposal</span>
            <AlertTriangle className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {totalDisposal.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tons</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Recycling</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {recyclingRate.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">%</div>
            </div>
            {yoyRecyclingChange !== null && (
              <div className="flex items-center gap-1">
                {yoyRecyclingChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyRecyclingChange > 0 ? 'text-green-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={`text-xs ${yoyRecyclingChange > 0 ? 'text-green-500' : yoyRecyclingChange < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {yoyRecyclingChange > 0 ? '+' : ''}{yoyRecyclingChange.toFixed(1)}pp YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Emissions</span>
            <Cloud className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmissions.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            {yoyEmissionsChange !== null && (
              <div className="flex items-center gap-1">
                {yoyEmissionsChange >= 0 ? (
                  <TrendingUp className={`w-3 h-3 ${yoyEmissionsChange > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                )}
                <span className={`text-xs ${yoyEmissionsChange > 0 ? 'text-red-500' : yoyEmissionsChange < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                  {yoyEmissionsChange > 0 ? '+' : ''}{yoyEmissionsChange.toFixed(1)}% YoY
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Intensity</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalGenerated > 0 ? (totalEmissions / totalGenerated).toFixed(2) : '0.00'}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e/t</div>
            </div>
          </div>
        </div>
      </div>

      {/* Disposal Method Distribution and Monthly Trends */}
      <div className="px-6 pb-6 grid grid-cols-2 gap-4">
        {/* Disposal Method Pie Chart */}
        {disposalBreakdown.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
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

            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={disposalBreakdown}
                  dataKey="quantity"
                  nameKey="method"
                  cx="40%"
                  cy="50%"
                  outerRadius={110}
                  innerRadius={0}
                  label={({ cx, cy, midAngle, outerRadius, method, quantity }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 30;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    const percentage = ((quantity / totalQuantity) * 100).toFixed(1);
                    const color = getDisposalColor(method);
                    const formattedName = formatDisposalMethod(method);

                    // Determine text anchor - force right side labels to always be 'start'
                    const textAnchor = x > cx ? 'start' : 'end';

                    return (
                      <text
                        x={x}
                        y={y}
                        fill={color}
                        textAnchor={textAnchor}
                        dominantBaseline="central"
                        style={{ fontSize: '13px' }}
                      >
                        <tspan x={x} dy="0">{formattedName}</tspan>
                        <tspan x={x} dy="14" fontWeight="bold" style={{ fontSize: '14px' }}>{percentage}%</tspan>
                      </text>
                    );
                  }}
                  labelLine={false}
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
                          <p className="text-white font-semibold mb-2">{formatDisposalMethod(data.method)}</p>
                          <p className="text-sm" style={{ color }}>
                            Quantity: {data.quantity.toFixed(2)} tons
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
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
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
              <LineChart data={(() => {
                // Prepare chart data with separate keys for actual and forecast
                const actualData = monthlyTrends;

                if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
                  return actualData;
                }

                // Create forecast months with separate keys
                const forecastMonths = forecastData.forecast.map((f: any) => ({
                  month: f.month,
                  generatedForecast: f.generated || 0,
                  divertedForecast: f.diverted || 0,
                  emissionsForecast: f.emissions || 0,
                  forecast: true
                }));

                // Create bridge point to connect actual and forecast lines
                const lastActual = actualData[actualData.length - 1];
                const bridgePoint = {
                  month: lastActual.month,
                  // Actual data keys (for solid lines)
                  generated: lastActual.generated,
                  diverted: lastActual.diverted,
                  emissions: lastActual.emissions,
                  // Forecast data keys with same values (for dashed lines)
                  generatedForecast: lastActual.generated,
                  divertedForecast: lastActual.diverted,
                  emissionsForecast: lastActual.emissions,
                  bridge: true
                };

                return [...actualData, bridgePoint, ...forecastMonths];
              })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#888', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: '#888', fontSize: 12 }}
                  label={{ value: 'tons', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
                  tickFormatter={(value) => value.toFixed(0)}
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
                      const isForecast = data.forecast;

                      // Get values from either actual or forecast keys
                      const generated = data.generated ?? data.generatedForecast;
                      const diverted = data.diverted ?? data.divertedForecast;
                      const emissions = data.emissions ?? data.emissionsForecast;

                      // Skip if all values are null
                      if (!generated && !diverted && !emissions) {
                        return null;
                      }

                      return (
                        <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                          <p className="text-white font-semibold mb-2">
                            {data.month}
                            {isForecast && <span className="ml-2 text-xs text-blue-400">(Forecast)</span>}
                          </p>
                          <div className="space-y-1">
                            <p className="text-sm" style={{ color: "#6b7280" }}>
                              Generated: {(generated || 0).toFixed(2)} tons
                            </p>
                            <p className="text-sm" style={{ color: "#10b981" }}>
                              Diverted: {(diverted || 0).toFixed(2)} tons
                            </p>
                            <p className="text-sm" style={{ color: "#ef4444" }}>
                              Emissions: {(emissions || 0).toFixed(2)} tCO2e
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                {/* Actual data - solid lines */}
                <Line
                  type="monotone"
                  dataKey="generated"
                  stroke="#6b7280"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#6b7280" }}
                  name="Generated"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="diverted"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#10b981" }}
                  name="Diverted"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="emissions"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#ef4444" }}
                  name="Emissions (tCO2e)"
                  connectNulls
                />
                {/* Forecast data - dashed lines (hidden from legend) */}
                {forecastData && forecastData.forecast && forecastData.forecast.length > 0 && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="generatedForecast"
                      stroke="#6b7280"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#6b7280", strokeWidth: 2, r: 3 }}
                      name="Generated"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="divertedForecast"
                      stroke="#10b981"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#10b981", strokeWidth: 2, r: 3 }}
                      name="Diverted"
                      connectNulls
                      legendType="none"
                    />
                    <Line
                      type="monotone"
                      dataKey="emissionsForecast"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: 'transparent', stroke: "#ef4444", strokeWidth: 2, r: 3 }}
                      name="Emissions (tCO2e)"
                      connectNulls
                      legendType="none"
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Year-over-Year Comparison and Diversion Rate */}
      {monthlyTrends.length > 0 && yoyGeneratedChange !== null && prevYearMonthlyTrends.length > 0 && (
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

            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyTrends.map((trend: any) => {
                    // Find matching previous year data by month name
                    const prevTrend = prevYearMonthlyTrends.find((prev: any) =>
                      prev.month === trend.month
                    );

                    let change = 0;
                    let previous = 0;

                    if (prevTrend && prevTrend.generated > 0) {
                      previous = prevTrend.generated;
                      change = ((trend.generated - prevTrend.generated) / prevTrend.generated) * 100;
                    }

                    return {
                      month: trend.month,
                      monthKey: trend.monthKey,
                      change: change,
                      current: trend.generated,
                      previous: previous
                    };
                  })}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: '#888', fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: '#888', fontSize: 12 }}
                    tickFormatter={(value) => `${value > 0 ? '+' : ''}${value}%`}
                    label={{ value: 'Change (%)', angle: -90, position: 'insideLeft', style: { fill: '#888', fontSize: 12 } }}
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
                        const change = data.change;
                        const current = data.current;
                        const previous = data.previous;
                        return (
                          <div className="bg-gray-900/95 border border-gray-700 rounded-lg p-3">
                            <p className="text-white font-semibold mb-2">{data.month}</p>
                            <div className="space-y-1 text-xs mb-2">
                              <p className="text-gray-300">
                                Current: <span className="font-medium text-white">{current.toFixed(1)} tons</span>
                              </p>
                              <p className="text-gray-300">
                                Last Year: <span className="font-medium text-white">{previous.toFixed(1)} tons</span>
                              </p>
                            </div>
                            <p className={`text-sm font-bold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {change > 0 ? '+' : ''}{change.toFixed(1)}% YoY
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {change >= 0 ? 'Increase' : 'Decrease'} in waste generated
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
          </div>

          {/* Circular Economy Metrics */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">Circular Economy Metrics</h3>
                <div
                  className="group relative"
                  title="Waste Hierarchy: Prevention → Reuse → Recycling → Recovery → Disposal. Diversion rate measures waste diverted from disposal through recycling and composting."
                >
                  <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-help" />
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto absolute z-[9999] w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-2xl right-0 top-7 border border-gray-700 transition-opacity duration-200">
                    <strong>Waste Hierarchy:</strong> Prevention → Reuse → Recycling → Recovery → Disposal.
                    <br /><br />
                    Diversion rate measures waste diverted from disposal through recycling and composting.
                  </div>
                </div>
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

            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-6">
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
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${diversionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalDiverted.toFixed(1)} tons diverted from disposal
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
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full bg-orange-500"
                      style={{ width: `${(totalLandfill / totalGenerated) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {totalLandfill.toFixed(1)} tons to landfill
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
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full bg-gray-500"
                      style={{ width: '100%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Category 5: Waste generated in operations
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Waste Hierarchy Stacked Bar Chart */}
      {monthlyTrends.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
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
                  tickFormatter={(value) => value.toFixed(0)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: any) => [value.toFixed(2) + ' tons', '']}
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

      {/* SBTi Waste Target Progress - Only for current year */}
      {wasteTargetData && monthlyTrends.length > 0 && (
        <div className="px-6 pb-6">
          <SBTiWasteTarget
            baseline2023Emissions={wasteTargetData.baseline2023Emissions}
            currentEmissions={totalEmissions}
            projectedFullYearEmissions={monthlyTrends.length > 0 ? (totalEmissions / monthlyTrends.length) * 12 : totalEmissions}
            baseline2023DiversionRate={wasteTargetData.baseline2023DiversionRate}
            currentDiversionRate={diversionRate}
            projectedFullYearDiversionRate={monthlyTrends.length > 0 ? diversionRate : diversionRate}
            currentYear={new Date().getFullYear()}
          />
        </div>
      )}

      {/* Material Breakdown */}
      {materialBreakdown.length > 0 && (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-500" />
                  Material-Specific Breakdown
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Recycling and diversion rates by waste material type
                </p>
              </div>
              <div className="flex gap-1">
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded">
                  GRI 306-4
                </span>
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                  ESRS E5
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {materialBreakdown
                .filter((m: any) => m.total > 0)
                .sort((a: any, b: any) => b.total - a.total)
                .map((material: any) => {
                  const materialRecyclingRate = material.total > 0
                    ? (material.recycled / material.total) * 100
                    : 0;
                  const materialDiversionRate = material.total > 0
                    ? (material.diverted / material.total) * 100
                    : 0;

                  const getMaterialIcon = (materialType: string) => {
                    switch (materialType.toLowerCase()) {
                      case 'paper': return '📄';
                      case 'plastic': return '♻️';
                      case 'metal': return '🔩';
                      case 'glass': return '🍾';
                      case 'organic': return '🌱';
                      case 'food': return '🍎';
                      case 'garden': return '🌿';
                      case 'ewaste': return '💻';
                      case 'hazardous': return '⚠️';
                      default: return '📦';
                    }
                  };

                  return (
                    <div key={material.material} className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getMaterialIcon(material.material)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                              {material.material}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {material.total.toFixed(2)} tons total
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Recycling Rate */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Recycling Rate</span>
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            {materialRecyclingRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-blue-500"
                            style={{ width: `${Math.min(materialRecyclingRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {material.recycled.toFixed(2)} tons recycled
                        </p>
                      </div>

                      {/* Diversion Rate */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Diversion Rate</span>
                          <span className="text-xs font-bold text-green-600 dark:text-green-400">
                            {materialDiversionRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-green-500"
                            style={{ width: `${Math.min(materialDiversionRate, 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {material.diverted.toFixed(2)} tons diverted
                        </p>
                      </div>

                      {/* Disposal */}
                      {material.disposal > 0 && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">To Disposal</span>
                            <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                              {material.disposal.toFixed(2)} tons
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-purple-700 dark:text-purple-300">
                  <strong>Material Insights:</strong> Track recycling and diversion rates by specific material types.
                  Historical data (2022-2024) has been split using industry-standard composition ratios.
                  Future data can be entered at the material level for precise tracking.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
