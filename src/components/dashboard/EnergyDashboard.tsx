'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Battery,
  Sun,
  Wind,
  Flame,
  AlertTriangle,
  DollarSign,
  Gauge,
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Bot,
  Lightbulb
} from 'lucide-react';

interface EnergyDashboardProps {
  organizationId: string;
}

interface EnergySource {
  name: string;
  consumption: number;
  unit: string;
  emissions: number;
  cost: number;
  renewable: boolean;
  trend: number;
  icon: React.ReactNode;
}

export function EnergyDashboard({ organizationId }: EnergyDashboardProps) {
  const [viewMode, setViewMode] = useState<'consumption' | 'emissions' | 'cost' | 'intensity'>('consumption');
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [energySources, setEnergySources] = useState<EnergySource[]>([]);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [renewablePercentage, setRenewablePercentage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [intensityMetrics, setIntensityMetrics] = useState({
    perEmployee: { value: 0, unit: 'kWh/FTE', trend: 0 },
    perSquareMeter: { value: 0, unit: 'kWh/m²', trend: 0 },
    perRevenue: { value: 0, unit: 'MWh/$M', trend: 0 },
    perProduction: { value: 0, unit: 'kWh/unit', trend: 0 }
  });

  const [peakMetrics, setPeakMetrics] = useState({
    peakDemand: { value: 0, unit: 'kW', time: 'N/A' },
    offPeakUsage: { percentage: 0, savings: 0 },
    loadFactor: { value: 0, target: 0.85 },
    powerFactor: { value: 0, target: 0.95 }
  });

  const [aiInsights] = useState([
    { type: 'saving', message: 'Shift 30% usage to off-peak hours → Save $2,000/month' },
    { type: 'anomaly', message: 'Weekend consumption 40% higher than expected' },
    { type: 'optimization', message: 'Solar expansion could offset 25% of grid usage' },
    { type: 'alert', message: 'Power factor below optimal - consider capacitor bank' }
  ]);

  // Fetch energy data
  useEffect(() => {
    const fetchEnergyData = async () => {
      setLoading(true);
      try {
        // Fetch sources and consumption
        const sourcesRes = await fetch(`/api/energy/sources?range=${timeRange}`);
        const sourcesData = await sourcesRes.json();

        if (sourcesData.sources) {
          // Map sources to include icons
          const getIcon = (type: string) => {
            switch (type) {
              case 'grid_electricity': return <Zap className="w-5 h-5" />;
              case 'natural_gas': return <Flame className="w-5 h-5" />;
              case 'solar': return <Sun className="w-5 h-5" />;
              case 'wind': return <Wind className="w-5 h-5" />;
              case 'ev_charging': return <Battery className="w-5 h-5" />;
              case 'diesel': return <Flame className="w-5 h-5" />;
              default: return <Zap className="w-5 h-5" />;
            }
          };

          setEnergySources(sourcesData.sources.map((s: any) => ({
            ...s,
            icon: getIcon(s.type)
          })));
          setTotalConsumption(sourcesData.total_consumption || 0);
          setTotalEmissions(sourcesData.total_emissions || 0);
          setTotalCost(sourcesData.total_cost || 0);
          setRenewablePercentage(sourcesData.renewable_percentage || 0);
        }

        // Fetch intensity metrics
        const intensityRes = await fetch('/api/energy/intensity');
        const intensityData = await intensityRes.json();
        if (intensityData) {
          setIntensityMetrics(intensityData);
        }

        // Fetch peak demand metrics
        const peaksRes = await fetch('/api/energy/peaks');
        const peaksData = await peaksRes.json();
        if (peaksData) {
          setPeakMetrics(peaksData);
        }

      } catch (error) {
        console.error('Error fetching energy data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnergyData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Zap className="w-7 h-7 text-yellow-500" />
              Energy Management Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Consumption, emissions, costs, and optimization opportunities
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {(['consumption', 'emissions', 'cost', 'intensity'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Consumption</span>
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {(totalConsumption / 1000).toFixed(1)} MWh
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingUp className="w-3 h-3 text-red-500" />
              <span className="text-red-500">+5.2%</span>
              <span className="text-gray-500 dark:text-gray-400">vs last month</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Energy Emissions</span>
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalEmissions.toFixed(1)} tCO2e
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingDown className="w-3 h-3 text-green-500" />
              <span className="text-green-500">-3.1%</span>
              <span className="text-gray-500 dark:text-gray-400">improving</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Energy Costs</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(totalCost / 1000).toFixed(1)}k
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingUp className="w-3 h-3 text-red-500" />
              <span className="text-red-500">+8.5%</span>
              <span className="text-gray-500 dark:text-gray-400">rate increase</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Renewable %</span>
              <Sun className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {renewablePercentage.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+2.3%</span>
              <span className="text-gray-500 dark:text-gray-400">growing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main View based on selected mode */}
      {viewMode === 'consumption' && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Energy Consumption by Source
          </h3>

          <div className="space-y-3">
            {energySources.map((source, idx) => (
              <motion.div
                key={source.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    source.renewable ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    {source.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {source.name}
                      {source.renewable && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                          Renewable
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {source.consumption.toLocaleString()} {source.unit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Emissions</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {source.emissions} tCO2e
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Cost</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ${source.cost.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {source.trend > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    )}
                    <span className={`text-sm ${source.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {source.trend > 0 ? '+' : ''}{source.trend}%
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Consumption Breakdown Chart */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Consumption Distribution
              </span>
              <PieChart className="w-4 h-4 text-gray-400" />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {energySources.map(source => {
                const percentage = (source.consumption / totalConsumption * 100).toFixed(1);
                return (
                  <div key={source.name} className="text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {percentage}%
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {source.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'intensity' && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Energy Intensity Metrics
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {Object.entries(intensityMetrics).map(([key, metric]) => (
              <div key={key} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Gauge className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{metric.unit}</div>
                <div className="flex items-center gap-1 mt-2">
                  {metric.trend < 0 ? (
                    <TrendingDown className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingUp className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-sm ${metric.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Peak Demand & Load Management */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Demand & Load Management
        </h3>

        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Peak Demand</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {peakMetrics.peakDemand.value} {peakMetrics.peakDemand.unit}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              at {peakMetrics.peakDemand.time}
            </div>
          </div>

          <div className="text-center">
            <Battery className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Off-Peak Usage</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {peakMetrics.offPeakUsage.percentage}%
            </div>
            <div className="text-xs text-green-500 mt-1">
              Saves ${peakMetrics.offPeakUsage.savings}/mo
            </div>
          </div>

          <div className="text-center">
            <Activity className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Load Factor</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {peakMetrics.loadFactor.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Target: {peakMetrics.loadFactor.target}
            </div>
          </div>

          <div className="text-center">
            <Gauge className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Power Factor</div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {peakMetrics.powerFactor.value}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Target: {peakMetrics.powerFactor.target}
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 backdrop-blur-xl border border-yellow-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Energy Optimization AI Insights</h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {aiInsights.map((insight, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-800/70 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-2">
                {insight.type === 'saving' && <DollarSign className="w-4 h-4 text-green-400 mt-0.5" />}
                {insight.type === 'anomaly' && <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />}
                {insight.type === 'optimization' && <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5" />}
                {insight.type === 'alert' && <Activity className="w-4 h-4 text-red-400 mt-0.5" />}
                <p className="text-sm text-gray-300">{insight.message}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="mt-4 px-4 py-2 bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition-all">
          Ask AI for Optimization Plan
        </button>
      </div>
    </div>
  );
}