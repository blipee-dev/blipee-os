'use client';

import React from 'react';
import { DynamicChart, ChartConfig } from '../charts/DynamicChart';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  Award, Battery, Cloud, Droplet, Flame, Leaf,
  MapPin, Shield, Target, Zap, Wind, Sun
} from 'lucide-react';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  subtitle?: string;
  data: any;
  options?: any;
  size?: 'small' | 'medium' | 'large' | 'full';
  refreshInterval?: number;
  interactive?: boolean;
  exportable?: boolean;
}

export type WidgetType =
  // Charts (15 types)
  | 'line-chart' | 'bar-chart' | 'area-chart' | 'pie-chart' | 'donut-chart'
  | 'radar-chart' | 'scatter-chart' | 'bubble-chart' | 'heatmap' | 'treemap'
  | 'sankey' | 'gauge' | 'waterfall' | 'funnel' | 'candlestick'
  // Metrics (10 types)
  | 'metric-card' | 'trend-card' | 'comparison-card' | 'progress-card' | 'kpi-card'
  | 'score-card' | 'status-card' | 'alert-card' | 'achievement-card' | 'target-card'
  // Sustainability (10 types)
  | 'emissions-tracker' | 'energy-monitor' | 'water-usage' | 'waste-tracker'
  | 'sdg-progress' | 'carbon-intensity' | 'renewable-mix' | 'efficiency-score'
  | 'compliance-status' | 'sustainability-score'
  // Advanced (10 types)
  | '3d-globe' | '3d-building' | 'flow-diagram' | 'network-graph' | 'timeline'
  | 'calendar-heatmap' | 'word-cloud' | 'parallel-coordinates' | 'chord-diagram' | 'sunburst';

// Size configurations
const WIDGET_SIZES = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-1',
  large: 'col-span-2 row-span-2',
  full: 'col-span-4 row-span-2'
};

// Glass morphism base styles
const glassStyle = {
  background: 'rgba(255, 255, 255, 0.03)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  borderRadius: '16px'
};

// Metric Card Component
export const MetricCard: React.FC<{
  title: string;
  value: number | string;
  unit?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  color?: string;
}> = ({ title, value, unit, change, trend, icon, color = 'rgba(147, 51, 234, 0.7)' }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div
      className="p-6 rounded-xl relative overflow-hidden"
      style={glassStyle}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-white/60 text-sm mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            {unit && <span className="text-white/50 text-lg">{unit}</span>}
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 ${trendColor}`}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-lg" style={{ backgroundColor: color }}>
            {icon}
          </div>
        )}
      </div>
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${color}, transparent)`
        }}
      />
    </div>
  );
};

// Progress Card Component
export const ProgressCard: React.FC<{
  title: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}> = ({ title, current, target, unit, color = 'rgba(59, 130, 246, 0.7)' }) => {
  const percentage = Math.min((current / target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6"
      style={glassStyle}
    >
      <h4 className="text-white/80 text-sm mb-4">{title}</h4>
      <div className="space-y-3">
        <div className="flex justify-between text-white">
          <span className="text-2xl font-bold">
            {current}{unit && <span className="text-lg text-white/50 ml-1">{unit}</span>}
          </span>
          <span className="text-white/50">
            / {target}{unit}
          </span>
        </div>
        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
        <p className="text-right text-white/60 text-sm">{percentage.toFixed(1)}% Complete</p>
      </div>
    </motion.div>
  );
};

// Score Card Component
export const ScoreCard: React.FC<{
  title: string;
  score: number;
  maxScore?: number;
  grade?: string;
  breakdown?: { label: string; value: number }[];
  color?: string;
}> = ({ title, score, maxScore = 100, grade, breakdown, color = 'rgba(34, 197, 94, 0.7)' }) => {
  const percentage = (score / maxScore) * 100;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, rotate: -10 }}
      animate={{ opacity: 1, rotate: 0 }}
      className="p-6"
      style={glassStyle}
    >
      <h4 className="text-white/80 text-sm mb-4">{title}</h4>
      <div className="flex items-center justify-between">
        <div className="relative">
          <svg width="140" height="140" className="-rotate-90">
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              stroke={color}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{score}</div>
              {grade && <div className="text-lg text-white/60">{grade}</div>}
            </div>
          </div>
        </div>
        {breakdown && (
          <div className="space-y-2 flex-1 ml-6">
            {breakdown.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-white/60">{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Emissions Tracker Component
export const EmissionsTracker: React.FC<{
  scope1: number;
  scope2: number;
  scope3: number;
  total: number;
  unit?: string;
  target?: number;
}> = ({ scope1, scope2, scope3, total, unit = 'tCO2e', target }) => {
  const data = [
    { name: 'Scope 1', value: scope1, fill: 'rgba(239, 68, 68, 0.7)' },
    { name: 'Scope 2', value: scope2, fill: 'rgba(251, 146, 60, 0.7)' },
    { name: 'Scope 3', value: scope3, fill: 'rgba(59, 130, 246, 0.7)' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
      style={glassStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white text-lg font-semibold">GHG Emissions</h4>
        <Flame className="w-5 h-5 text-orange-500" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-white/60 text-sm">Total Emissions</p>
          <p className="text-2xl font-bold text-white">
            {total.toFixed(1)} <span className="text-sm text-white/50">{unit}</span>
          </p>
        </div>
        {target && (
          <div>
            <p className="text-white/60 text-sm">Target</p>
            <p className="text-2xl font-bold text-green-500">
              {target.toFixed(1)} <span className="text-sm text-green-500/50">{unit}</span>
            </p>
          </div>
        )}
      </div>

      <DynamicChart
        type="donut"
        data={data}
        height={200}
        options={{ showLabels: true }}
      />

      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
              <span className="text-white/60">{item.name}</span>
            </div>
            <span className="text-white">{item.value.toFixed(1)} {unit}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Energy Monitor Component
export const EnergyMonitor: React.FC<{
  consumption: number;
  renewable: number;
  efficiency: number;
  cost: number;
  trend: { time: string; value: number }[];
}> = ({ consumption, renewable, efficiency, cost, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-6"
      style={glassStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white text-lg font-semibold">Energy Monitor</h4>
        <Zap className="w-5 h-5 text-yellow-500" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <MetricCard
          title="Consumption"
          value={consumption}
          unit="MWh"
          icon={<Zap className="w-4 h-4 text-white" />}
          color="rgba(251, 146, 60, 0.7)"
        />
        <MetricCard
          title="Renewable"
          value={renewable}
          unit="%"
          icon={<Sun className="w-4 h-4 text-white" />}
          color="rgba(34, 197, 94, 0.7)"
        />
        <MetricCard
          title="Efficiency"
          value={efficiency}
          unit="%"
          icon={<Battery className="w-4 h-4 text-white" />}
          color="rgba(59, 130, 246, 0.7)"
        />
        <MetricCard
          title="Cost"
          value={`$${cost.toFixed(0)}`}
          icon={<Activity className="w-4 h-4 text-white" />}
          color="rgba(147, 51, 234, 0.7)"
        />
      </div>

      <DynamicChart
        type="area"
        data={trend}
        height={200}
        options={{ dataKeys: ['value'] }}
      />
    </motion.div>
  );
};

// SDG Progress Component
export const SDGProgress: React.FC<{
  goals: { number: number; name: string; progress: number; color: string }[];
}> = ({ goals }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6"
      style={glassStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white text-lg font-semibold">SDG Progress</h4>
        <Target className="w-5 h-5 text-blue-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {goals.map((goal) => (
          <div key={goal.number} className="p-3 rounded-lg bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: goal.color }}
                >
                  {goal.number}
                </div>
                <span className="text-white/80 text-xs">{goal.name}</span>
              </div>
            </div>
            <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 1, delay: goal.number * 0.05 }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: goal.color }}
              />
            </div>
            <p className="text-right text-white/50 text-xs mt-1">{goal.progress}%</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Compliance Status Component
export const ComplianceStatus: React.FC<{
  frameworks: { name: string; status: 'compliant' | 'partial' | 'non-compliant'; score?: number }[];
}> = ({ frameworks }) => {
  const statusColors = {
    compliant: 'rgba(34, 197, 94, 0.7)',
    partial: 'rgba(251, 146, 60, 0.7)',
    'non-compliant': 'rgba(239, 68, 68, 0.7)'
  };

  const statusIcons = {
    compliant: '✓',
    partial: '!',
    'non-compliant': '✗'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
      style={glassStyle}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white text-lg font-semibold">Compliance Status</h4>
        <Shield className="w-5 h-5 text-green-500" />
      </div>

      <div className="space-y-3">
        {frameworks.map((fw, i) => (
          <motion.div
            key={fw.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: statusColors[fw.status] }}
              >
                {statusIcons[fw.status]}
              </div>
              <div>
                <p className="text-white font-medium">{fw.name}</p>
                <p className="text-white/50 text-sm capitalize">{fw.status.replace('-', ' ')}</p>
              </div>
            </div>
            {fw.score !== undefined && (
              <div className="text-right">
                <p className="text-white text-xl font-bold">{fw.score}%</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Main Widget Renderer
export const Widget: React.FC<WidgetConfig> = ({ type, title, subtitle, data, options, size = 'medium' }) => {
  const sizeClass = WIDGET_SIZES[size];

  // Chart widgets
  if (type.includes('chart') || ['heatmap', 'treemap', 'sankey', 'gauge', 'waterfall', 'funnel', 'candlestick'].includes(type)) {
    const chartType = type.replace('-chart', '') as any;
    return (
      <div className={sizeClass}>
        <DynamicChart
          type={chartType}
          data={data}
          options={options}
          title={title}
          subtitle={subtitle}
        />
      </div>
    );
  }

  // Metric widgets
  switch (type) {
    case 'metric-card':
      return (
        <div className={sizeClass}>
          <MetricCard {...data} title={title} />
        </div>
      );

    case 'progress-card':
      return (
        <div className={sizeClass}>
          <ProgressCard {...data} title={title} />
        </div>
      );

    case 'score-card':
      return (
        <div className={sizeClass}>
          <ScoreCard {...data} title={title} />
        </div>
      );

    case 'emissions-tracker':
      return (
        <div className={sizeClass}>
          <EmissionsTracker {...data} />
        </div>
      );

    case 'energy-monitor':
      return (
        <div className={sizeClass}>
          <EnergyMonitor {...data} />
        </div>
      );

    case 'sdg-progress':
      return (
        <div className={sizeClass}>
          <SDGProgress {...data} />
        </div>
      );

    case 'compliance-status':
      return (
        <div className={sizeClass}>
          <ComplianceStatus {...data} />
        </div>
      );

    default:
      return (
        <div className={`${sizeClass} p-6`} style={glassStyle}>
          <h4 className="text-white">{title}</h4>
          <p className="text-white/60">Widget type: {type}</p>
        </div>
      );
  }
};

// Export all widget types
export const WIDGET_TYPES: WidgetType[] = [
  // Charts (15)
  'line-chart', 'bar-chart', 'area-chart', 'pie-chart', 'donut-chart',
  'radar-chart', 'scatter-chart', 'bubble-chart', 'heatmap', 'treemap',
  'sankey', 'gauge', 'waterfall', 'funnel', 'candlestick',
  // Metrics (10)
  'metric-card', 'trend-card', 'comparison-card', 'progress-card', 'kpi-card',
  'score-card', 'status-card', 'alert-card', 'achievement-card', 'target-card',
  // Sustainability (10)
  'emissions-tracker', 'energy-monitor', 'water-usage', 'waste-tracker',
  'sdg-progress', 'carbon-intensity', 'renewable-mix', 'efficiency-score',
  'compliance-status', 'sustainability-score',
  // Advanced (10)
  '3d-globe', '3d-building', 'flow-diagram', 'network-graph', 'timeline',
  'calendar-heatmap', 'word-cloud', 'parallel-coordinates', 'chord-diagram', 'sunburst'
];

export default Widget;