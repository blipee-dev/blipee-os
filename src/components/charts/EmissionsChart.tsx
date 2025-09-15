'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface ChartProps {
  data: any[];
  height?: number;
  interactive?: boolean;
  onDataClick?: (data: any) => void;
}

// Custom tooltip that works in both dashboard and chat
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1a1a1a] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.1]">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value} {entry.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const EmissionsPieChart: React.FC<ChartProps> = ({
  data,
  height = 300,
  interactive = true,
  onDataClick
}) => {
  const COLORS = [
    'var(--accent-primary)',
    'var(--accent-secondary)',
    'rgba(var(--accent-primary-rgb), 0.5)',
    'rgba(var(--accent-secondary-rgb), 0.5)'
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={(entry) => `${entry.name}: ${entry.percentage}%`}
          outerRadius={height / 3}
          fill="#8884d8"
          dataKey="value"
          onClick={interactive ? onDataClick : undefined}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || COLORS[index % COLORS.length]}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const EmissionsTrendChart: React.FC<ChartProps & { showTarget?: boolean }> = ({
  data,
  height = 300,
  interactive = true,
  showTarget = true,
  onDataClick
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        onClick={interactive ? onDataClick : undefined}
      >
        <defs>
          <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
        <XAxis
          dataKey="month"
          stroke="#999"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#999"
          style={{ fontSize: '12px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="emissions"
          stroke="var(--accent-primary)"
          fill="url(#colorEmissions)"
          strokeWidth={2}
        />
        {showTarget && (
          <Line
            type="monotone"
            dataKey="target"
            stroke="#ef4444"
            strokeDasharray="5 5"
            dot={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const SiteComparisonChart: React.FC<ChartProps> = ({
  data,
  height = 300,
  interactive = true,
  onDataClick
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        onClick={interactive ? onDataClick : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
        <XAxis
          dataKey="site"
          stroke="#999"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#999"
          style={{ fontSize: '12px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="emissions" fill="var(--accent-primary)" />
        <Bar dataKey="energy" fill="var(--accent-secondary)" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const MetricTrendLine: React.FC<ChartProps & { metrics: string[] }> = ({
  data,
  metrics = ['emissions'],
  height = 200,
  interactive = true,
  onDataClick
}) => {
  const METRIC_COLORS: any = {
    emissions: 'var(--accent-primary)',
    energy: 'var(--accent-secondary)',
    water: '#3b82f6',
    waste: '#ef4444'
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        onClick={interactive ? onDataClick : undefined}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
        <XAxis
          dataKey="period"
          stroke="#999"
          style={{ fontSize: '11px' }}
        />
        <YAxis
          stroke="#999"
          style={{ fontSize: '11px' }}
        />
        <Tooltip content={<CustomTooltip />} />
        {metrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={METRIC_COLORS[metric] || 'var(--accent-primary)'}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

// Compact chart for AI chat responses
export const MiniMetricChart: React.FC<{
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  sparklineData?: number[];
}> = ({ value, change, trend, sparklineData }) => {
  const trendColor = trend === 'down' ? '#10b981' : trend === 'up' ? '#ef4444' : '#6b7280';

  const data = sparklineData?.map((val, idx) => ({ value: val, index: idx })) || [];

  return (
    <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-white/[0.02] rounded-lg">
      <div className="flex-1">
        <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm" style={{ color: trendColor }}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {Math.abs(change)}%
          </span>
        </div>
      </div>
      {sparklineData && (
        <div className="w-24 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={trendColor}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};