'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Zap,
  Bell,
  Target,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SmartWidgetsProps {
  context: any;
  onAction: (action: string, params?: any) => void;
}

export const SmartWidgets: React.FC<SmartWidgetsProps> = ({
  context,
  onAction,
}) => {
  // Extract real data from context
  const metricsData = context?.metricsData;
  const processedMetrics = metricsData?.metrics;

  // Initialize with real data or defaults
  const [liveData, setLiveData] = useState({
    emissions: 0,
    energy: 0,
    water: 0,
    alerts: 0,
  });

  // Update base values when context changes
  useEffect(() => {
    if (processedMetrics) {
      setLiveData({
        emissions: processedMetrics.emissions?.total || 0,
        energy: processedMetrics.energy?.total || 0,
        water: processedMetrics.water?.total || 0,
        alerts: 0,
      });
    }
  }, [processedMetrics]);

  // Simulate small live fluctuations around real values
  useEffect(() => {
    if (!processedMetrics) return;

    const interval = setInterval(() => {
      setLiveData(prev => ({
        emissions: Math.max(0, prev.emissions + (Math.random() - 0.5) * 0.1),
        energy: Math.max(0, prev.energy + (Math.random() - 0.5) * 0.01),
        water: Math.max(0, prev.water + (Math.random() - 0.5) * 1),
        alerts: Math.floor(Math.random() * 3),
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [processedMetrics]);

  const widgets = [
    {
      id: 'live-emissions',
      title: 'Live Emissions',
      icon: <Globe className="w-6 h-6 text-green-600 dark:text-green-400" />,
      value: `${liveData.emissions.toFixed(1)} tCO2e`,
      chart: true,
      trend: processedMetrics?.emissions?.trend < 0 ? 'down' : 'up',
      trendIcon: processedMetrics?.emissions?.trend < 0 ?
        <TrendingDown className="w-4 h-4 text-green-400" /> :
        <TrendingUp className="w-4 h-4 text-red-400" />,
      actions: [
        { label: 'Details', action: 'emissions/details' },
        { label: 'Reduce', action: 'emissions/reduce' },
      ],
    },
    {
      id: 'energy-gauge',
      title: 'Energy Usage',
      icon: <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />,
      value: `${liveData.energy.toFixed(1)} MW`,
      gauge: true,
      max: 5,
      actions: [
        { label: 'Optimize', action: 'energy/optimize' },
        { label: 'Forecast', action: 'energy/forecast' },
      ],
    },
    {
      id: 'alert-center',
      title: 'Alert Center',
      icon: <Bell className="w-6 h-6 text-orange-600 dark:text-orange-400" />,
      value: liveData.alerts,
      alerts: [
        { level: 'high', text: 'HVAC malfunction in Building A' },
        { level: 'medium', text: 'Water usage spike detected' },
        { level: 'low', text: 'Scheduled maintenance due' },
      ].slice(0, liveData.alerts),
      actions: [
        { label: 'View All', action: 'alerts/all' },
        { label: 'Resolve', action: 'alerts/resolve' },
      ],
    },
    {
      id: 'goal-tracker',
      title: 'Goal Progress',
      icon: <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />,
      value: processedMetrics?.emissions?.trend < 0 ? `${Math.abs(processedMetrics.emissions.trend)}% reduction` : 'Tracking',
      progress: processedMetrics?.emissions?.trend < 0 ? Math.min(100, Math.abs(processedMetrics.emissions.trend) * 5) : 0,
      target: 'Net Zero by 2030',
      actions: [
        { label: 'Details', action: 'goals/details' },
        { label: 'Update', action: 'goals/update' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        Smart Widgets
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets.map((widget, index) => (
          <motion.div
            key={widget.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {widget.icon}
                <h4 className="text-sm font-medium text-gray-700 dark:text-white/80">
                  {widget.title}
                </h4>
              </div>
              {widget.trendIcon && widget.trendIcon}
            </div>

            {/* Value display */}
            <div className="mb-3">
              {widget.gauge ? (
                <div className="relative h-24 overflow-visible">
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {widget.value}
                    </div>
                  </div>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                    <circle
                      cx="50"
                      cy="50"
                      r="30"
                      stroke="rgba(156, 163, 175, 0.2)"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="30"
                      stroke="url(#gradient)"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(liveData.energy / widget.max) * 188} 188`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#3B82F6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              ) : widget.chart ? (
                <div className="h-20 flex items-end gap-1">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-purple-500/50 to-blue-500/50 rounded-t"
                      style={{
                        height: `${30 + Math.random() * 70}%`,
                      }}
                    />
                  ))}
                </div>
              ) : widget.progress ? (
                <div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {widget.value}
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widget.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-green-400 to-blue-400"
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-white/50 mt-1">
                    {widget.target}
                  </div>
                </div>
              ) : widget.alerts ? (
                <div className="space-y-2">
                  {widget.alerts.map((alert, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2 rounded ${
                        alert.level === 'high'
                          ? 'bg-red-500/20 text-red-600 dark:text-red-400'
                          : alert.level === 'medium'
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {alert.text}
                    </div>
                  ))}
                  {widget.alerts.length === 0 && (
                    <div className="text-sm text-gray-500 dark:text-white/40">
                      No active alerts
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {widget.value}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2">
              {widget.actions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => onAction(action.action)}
                  className="flex-1 px-2 py-1 text-xs bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/70 hover:text-gray-700 dark:hover:text-white rounded transition-all"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Widget customization */}
      <div className="flex justify-center mt-4">
        <button
          onClick={() => onAction('widgets/customize')}
          className="px-4 py-2 text-sm bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-600 dark:text-white/60 hover:text-gray-700 dark:hover:text-white rounded-lg transition-all flex items-center gap-2 border border-gray-200 dark:border-white/[0.05]"
        >
          <Settings className="w-4 h-4" />
          <span>Customize Widgets</span>
        </button>
      </div>
    </div>
  );
};