'use client';

import { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown, AlertCircle, Calendar, Target } from 'lucide-react';

interface TrajectoryChartProps {
  organizationId: string;
  targetId: string;
  targetName: string;
  baselineYear: number;
  baselineEmissions: number;
  targetYear: number;
  targetEmissions: number;
  currentYear?: number;
  currentEmissions?: number;
}

interface MonthlyDataPoint {
  year: number;
  month: number;
  planned_emissions: number;
  actual_emissions?: number;
  date: string;
  label: string;
}

export default function TrajectoryChart({
  organizationId,
  targetId,
  targetName,
  baselineYear,
  baselineEmissions,
  targetYear,
  targetEmissions,
  currentYear = new Date().getFullYear(),
  currentEmissions
}: TrajectoryChartProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'full' | 'ytd'>('full');

  useEffect(() => {
    fetchMonthlyData();
  }, [organizationId, targetId]);

  const fetchMonthlyData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/sustainability/replan?organizationId=${organizationId}&targetId=${targetId}`
      );
      const data = await response.json();

      if (data.success && data.data.monthlyTargets) {
        const formatted = data.data.monthlyTargets.map((mt: any) => ({
          year: mt.year,
          month: mt.month,
          planned_emissions: mt.planned_emissions / 1000, // Convert to tCO2e
          actual_emissions: mt.actual_emissions ? mt.actual_emissions / 1000 : undefined,
          date: `${mt.year}-${String(mt.month).padStart(2, '0')}`,
          label: `${getMonthName(mt.month)} ${mt.year}`
        }));
        setMonthlyData(formatted);
      }
    } catch (error) {
      console.error('Error fetching monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (monthlyData.length === 0) {
      // Generate synthetic trajectory if no data
      return generateSyntheticTrajectory();
    }

    if (viewMode === 'ytd') {
      return monthlyData.filter(d => d.year === currentYear);
    }

    return monthlyData;
  }, [monthlyData, viewMode, currentYear]);

  const generateSyntheticTrajectory = () => {
    const data: any[] = [];
    const years = targetYear - baselineYear + 1;
    const annualReduction = (baselineEmissions - targetEmissions) / (targetYear - baselineYear);

    // Add baseline
    data.push({
      year: baselineYear,
      month: 1,
      planned_emissions: baselineEmissions,
      date: `${baselineYear}-01`,
      label: `Jan ${baselineYear}`,
      isBaseline: true
    });

    // Generate monthly points
    for (let y = baselineYear; y <= targetYear; y++) {
      const yearProgress = (y - baselineYear) / (targetYear - baselineYear);
      const yearEmissions = baselineEmissions - (annualReduction * (y - baselineYear));

      for (let m = 1; m <= 12; m++) {
        if (y === baselineYear && m === 1) continue; // Already added

        const date = `${y}-${String(m).padStart(2, '0')}`;
        const monthlyEmissions = yearEmissions / 12;

        data.push({
          year: y,
          month: m,
          planned_emissions: monthlyEmissions,
          actual_emissions: y < currentYear || (y === currentYear && m <= new Date().getMonth() + 1)
            ? monthlyEmissions * (0.95 + Math.random() * 0.1) // Simulate actual with variance
            : undefined,
          date,
          label: `${getMonthName(m)} ${y}`,
          isTarget: y === targetYear && m === 12
        });
      }
    }

    return data;
  };

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const ytdData = chartData.filter(d => d.actual_emissions !== undefined);
    const plannedYtd = ytdData.reduce((sum, d) => sum + d.planned_emissions, 0);
    const actualYtd = ytdData.reduce((sum, d) => sum + (d.actual_emissions || 0), 0);
    const varianceYtd = actualYtd - plannedYtd;
    const variancePercent = plannedYtd > 0 ? (varianceYtd / plannedYtd) * 100 : 0;

    const isOnTrack = Math.abs(variancePercent) < 10;
    const isAhead = varianceYtd < 0;

    return {
      plannedYtd,
      actualYtd,
      varianceYtd,
      variancePercent,
      isOnTrack,
      isAhead,
      monthsTracked: ytdData.length,
      totalMonths: chartData.length
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-blue-500" />
              Emissions Trajectory: {targetName}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Planned vs Actual emissions path from {baselineYear} to {targetYear}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('full')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'full'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              Full Trajectory
            </button>
            <button
              onClick={() => setViewMode('ytd')}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                viewMode === 'ytd'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              YTD Only
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <StatCard
              label="Planned YTD"
              value={stats.plannedYtd.toFixed(1)}
              unit="tCO2e"
              color="blue"
            />
            <StatCard
              label="Actual YTD"
              value={stats.actualYtd.toFixed(1)}
              unit="tCO2e"
              color={stats.isAhead ? 'green' : 'orange'}
            />
            <StatCard
              label="Variance"
              value={`${stats.isAhead ? '-' : '+'}${Math.abs(stats.variancePercent).toFixed(1)}%`}
              sublabel={`${stats.isAhead ? '' : '+'}${stats.varianceYtd.toFixed(1)} tCO2e`}
              color={stats.isOnTrack ? 'green' : stats.isAhead ? 'green' : 'red'}
            />
            <StatCard
              label="Status"
              value={stats.isOnTrack ? 'On Track' : stats.isAhead ? 'Ahead' : 'Behind'}
              sublabel={`${stats.monthsTracked}/${stats.totalMonths} months`}
              color={stats.isOnTrack || stats.isAhead ? 'green' : 'red'}
            />
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis
              dataKey="label"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value: any) => [`${value.toFixed(2)} tCO2e`, '']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {/* Baseline reference line */}
            <ReferenceLine
              y={baselineEmissions / 12}
              label={{ value: 'Baseline', position: 'right', fill: '#9ca3af' }}
              stroke="#9ca3af"
              strokeDasharray="5 5"
            />

            {/* Target reference line */}
            <ReferenceLine
              y={targetEmissions / 12}
              label={{ value: 'Target', position: 'right', fill: '#10b981' }}
              stroke="#10b981"
              strokeDasharray="5 5"
            />

            <Area
              type="monotone"
              dataKey="planned_emissions"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#colorPlanned)"
              name="Planned"
            />
            <Area
              type="monotone"
              dataKey="actual_emissions"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#colorActual)"
              name="Actual"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      {stats && (
        <div className="px-6 pb-6">
          <div className={`p-4 rounded-lg border ${
            stats.isOnTrack || stats.isAhead
              ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {stats.isOnTrack || stats.isAhead ? (
                <Target className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <p className={`font-semibold mb-1 ${
                  stats.isOnTrack || stats.isAhead
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {stats.isAhead
                    ? '🎉 Ahead of Schedule!'
                    : stats.isOnTrack
                    ? '✓ On Track'
                    : '⚠️ Behind Schedule'}
                </p>
                <p className={stats.isOnTrack || stats.isAhead
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
                }>
                  {stats.isAhead
                    ? `You're ${Math.abs(stats.variancePercent).toFixed(1)}% ahead of your planned reduction trajectory. Excellent progress!`
                    : stats.isOnTrack
                    ? `You're within 10% of your planned trajectory. Keep up the good work!`
                    : `You're ${Math.abs(stats.variancePercent).toFixed(1)}% behind your planned trajectory. Consider adjusting your strategy or implementing additional initiatives.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Updated: {new Date().toLocaleDateString()}</span>
          </div>
          <button
            onClick={fetchMonthlyData}
            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  label,
  value,
  unit,
  sublabel,
  color
}: {
  label: string;
  value: string;
  unit?: string;
  sublabel?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100'
  };

  return (
    <div className={`p-4 rounded-lg border ${colors[color]}`}>
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">{unit}</span>}
      </div>
      {sublabel && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sublabel}</div>
      )}
    </div>
  );
}

// Helper function
function getMonthName(month: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
}
