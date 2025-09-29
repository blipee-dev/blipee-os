'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Zap,
  Droplets,
  Recycle,
  Sun,
  TrendingUp,
  Sunset,
  AlertCircle,
  BarChart3,
  Calendar,
  CalendarDays,
  CalendarRange,
  Target,
  Bell,
  RefreshCw,
  Loader2
} from 'lucide-react';

interface AdaptiveCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  value?: string | number;
  trend?: string;
  priority: number;
  action: string;
  quickActions?: Array<{
    label: string;
    action: string;
  }>;
}

interface AdaptiveHomeGridProps {
  timeOfDay: string;
  onAction: (action: string, params?: any) => void;
  user?: any;
  metricsData?: any;
  loading?: boolean;
}

export const AdaptiveHomeGrid: React.FC<AdaptiveHomeGridProps> = ({
  timeOfDay,
  onAction,
  user,
  metricsData,
  loading,
}) => {
  // Format value with appropriate units
  const formatValue = (value: number | undefined | null, unit: string): string => {
    // Handle null or undefined values
    if (value === null || value === undefined || isNaN(value)) {
      return `0 ${unit}`;
    }

    if (unit === 'tCO2e') {
      return `${value.toFixed(1)} ${unit}`;
    } else if (unit === 'MWh') {
      // Convert to MW for display if large enough
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)} GWh`;
      }
      return `${value.toFixed(1)} ${unit}`;
    } else if (unit === 'm³') {
      return `${Math.round(value)} ${unit}`;
    } else if (unit === 'tons') {
      return `${value.toFixed(1)} ${unit}`;
    }
    return `${value} ${unit}`;
  };

  // Format trend for display
  const formatTrend = (trend: number): string => {
    if (trend === 0) return '→ 0%';
    const arrow = trend > 0 ? '↑' : '↓';
    const color = trend > 0 ? 'text-red-500' : 'text-green-500';
    return `${arrow} ${Math.abs(trend).toFixed(0)}%`;
  };

  // Time-based card configurations with real data
  const getTimeBasedCards = (): AdaptiveCard[] => {
    // Use real data if available, otherwise use defaults
    const emissions = metricsData?.metrics?.emissions || null;
    const energy = metricsData?.metrics?.energy || null;
    const water = metricsData?.metrics?.water || null;
    const waste = metricsData?.metrics?.waste || null;

    const baseCards: AdaptiveCard[] = [
      {
        id: 'emissions',
        icon: <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />,
        title: 'Emissions',
        value: emissions?.total ? formatValue(emissions.total, emissions.unit || 'tCO2e') : '0 tCO2e',
        trend: emissions?.trend ? formatTrend(emissions.trend) : '→ 0%',
        priority: 1,
        action: 'emissions',
        quickActions: [
          { label: 'By Scope', action: 'emissions/scope' },
          { label: 'By Building', action: 'emissions/building' },
          { label: 'Trends', action: 'emissions/trends' },
        ],
      },
      {
        id: 'energy',
        icon: <Zap className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />,
        title: 'Energy',
        value: energy?.total ? formatValue(energy.total, energy.unit || 'MWh') : '0 MWh',
        trend: energy?.trend ? formatTrend(energy.trend) : '→ 0%',
        priority: 2,
        action: 'energy',
        quickActions: [
          { label: 'Real-time', action: 'energy/realtime' },
          { label: 'Optimize', action: 'energy/optimize' },
          { label: 'Forecast', action: 'energy/forecast' },
        ],
      },
      {
        id: 'water',
        icon: <Droplets className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
        title: 'Water',
        value: water?.total ? formatValue(water.total, water.unit || 'm³') : '0 m³',
        trend: water?.trend ? formatTrend(water.trend) : '→ 0%',
        priority: 3,
        action: 'water',
        quickActions: [
          { label: 'Usage', action: 'water/usage' },
          { label: 'Quality', action: 'water/quality' },
          { label: 'Savings', action: 'water/savings' },
        ],
      },
      {
        id: 'waste',
        icon: <Recycle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
        title: 'Waste',
        value: waste?.total ? formatValue(waste.total, waste.unit || 'tons') : '0 tons',
        trend: waste?.trend ? formatTrend(waste.trend) : '→ 0%',
        priority: 4,
        action: 'waste',
        quickActions: [
          { label: 'Recycling', action: 'waste/recycling' },
          { label: 'Diversion', action: 'waste/diversion' },
          { label: 'Reduce', action: 'waste/reduce' },
        ],
      },
    ];

    // Calculate real statistics
    const dataPointsCount = metricsData?.raw?.length || 0;
    const totalEmissions = emissions?.total || 0;
    const emissionsTrend = emissions?.trend || 0;

    // Time-specific cards with real data
    if (timeOfDay === 'morning') {
      baseCards.unshift({
        id: 'morning-brief',
        icon: <Sun className="w-8 h-8 text-orange-600 dark:text-orange-400" />,
        title: `Good Morning${user?.firstName ? `, ${user.firstName}` : ''}!`,
        value: `${dataPointsCount} data points tracked`,
        priority: 0,
        action: 'alerts',
        quickActions: [
          { label: 'View Metrics', action: 'metrics/view' },
          { label: 'Daily Goals', action: 'goals/daily' },
          { label: 'Schedule', action: 'schedule/today' },
        ],
      });
    } else if (timeOfDay === 'afternoon') {
      baseCards.unshift({
        id: 'midday-check',
        icon: <TrendingUp className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
        title: 'Midday Check-in',
        value: dataPointsCount > 0 ? `${dataPointsCount} metrics tracked today` : 'No data yet',
        priority: 0,
        action: 'performance',
        quickActions: [
          { label: 'Quick Wins', action: 'optimize/quick' },
          { label: 'Adjust', action: 'settings/adjust' },
          { label: 'Compare', action: 'compare/yesterday' },
        ],
      });
    } else if (timeOfDay === 'evening') {
      baseCards.unshift({
        id: 'evening-summary',
        icon: <Sunset className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />,
        title: "Today's Impact",
        value: emissionsTrend < 0 ? `${Math.abs(emissionsTrend).toFixed(0)}% reduction` : `${dataPointsCount} metrics analyzed`,
        priority: 0,
        action: 'summary',
        quickActions: [
          { label: 'Full Report', action: 'reports/daily' },
          { label: 'Tomorrow', action: 'schedule/tomorrow' },
          { label: 'Week View', action: 'reports/weekly' },
        ],
      });
    }

    return baseCards.sort((a, b) => a.priority - b.priority);
  };

  const cards = getTimeBasedCards();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Zero-Typing Dashboard
      </h2>

      {/* Main cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl p-6 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all cursor-pointer group h-full flex flex-col"
            onClick={() => onAction(card.action)}
          >
            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {card.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {card.title}
                  </h3>
                  {card.value && (
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                      {card.value}
                    </p>
                  )}
                </div>
              </div>
              {card.trend && (
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  card.trend.includes('↓') ? 'bg-green-500/20 text-green-600 dark:text-green-400' :
                  card.trend.includes('↑') ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                  'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  {card.trend}
                </span>
              )}
            </div>

            {/* Quick actions - always visible */}
            {card.quickActions && (
              <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-gray-100 dark:border-white/[0.05]">
                {card.quickActions.map((qa) => (
                  <button
                    key={qa.action}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAction(qa.action);
                    }}
                    className="flex-1 px-2 py-1.5 text-xs bg-gray-50 dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all border border-gray-200 dark:border-white/[0.05]"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick access strip */}
      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 dark:bg-[#212121] rounded-xl border border-gray-200 dark:border-white/[0.05]">
        <button
          onClick={() => onAction('refresh')}
          className="px-4 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white border border-gray-200 dark:border-white/[0.05] rounded-lg transition-all flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
        <button
          onClick={() => onAction('filter/today')}
          className="px-4 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white border border-gray-200 dark:border-white/[0.05] rounded-lg transition-all flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          Today
        </button>
        <button
          onClick={() => onAction('filter/week')}
          className="px-4 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white border border-gray-200 dark:border-white/[0.05] rounded-lg transition-all flex items-center gap-2"
        >
          <CalendarDays className="w-4 h-4" />
          This Week
        </button>
        <button
          onClick={() => onAction('filter/month')}
          className="px-4 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white border border-gray-200 dark:border-white/[0.05] rounded-lg transition-all flex items-center gap-2"
        >
          <CalendarRange className="w-4 h-4" />
          This Month
        </button>
        <button
          onClick={() => onAction('goals')}
          className="px-4 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white border border-gray-200 dark:border-white/[0.05] rounded-lg transition-all flex items-center gap-2"
        >
          <Target className="w-4 h-4" />
          Goals
        </button>
        <button
          onClick={() => onAction('alerts')}
          className="px-4 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white border border-gray-200 dark:border-white/[0.05] rounded-lg transition-all flex items-center gap-2 relative"
        >
          <Bell className="w-4 h-4" />
          Alerts
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </button>
      </div>
    </div>
  );
};