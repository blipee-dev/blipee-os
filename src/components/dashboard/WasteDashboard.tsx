'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trash2,
  Recycle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  Leaf,
  Package,
  Factory,
  DollarSign,
  Bot,
  PieChart,
  BarChart3,
  Activity
} from 'lucide-react';

interface WasteDashboardProps {
  organizationId: string;
}

interface WasteStream {
  name: string;
  generated: number;
  recycled: number;
  composted: number;
  landfill: number;
  incinerated: number;
  hazardous: boolean;
  cost: number;
  revenue: number;
  emissions: number;
  trend: number;
  icon: React.ReactNode;
}

export function WasteDashboard({ organizationId }: WasteDashboardProps) {
  const [viewMode, setViewMode] = useState<'generation' | 'diversion' | 'disposal' | 'circular'>('generation');

  const [wasteStreams] = useState<WasteStream[]>([
    {
      name: 'General Waste',
      generated: 8000,
      recycled: 0,
      composted: 0,
      landfill: 7500,
      incinerated: 500,
      hazardous: false,
      cost: 2400,
      revenue: 0,
      emissions: 12.0,
      trend: -3.2,
      icon: <Trash2 className="w-5 h-5" />
    },
    {
      name: 'Mixed Recyclables',
      generated: 5000,
      recycled: 4500,
      composted: 0,
      landfill: 500,
      incinerated: 0,
      hazardous: false,
      cost: 800,
      revenue: 1200,
      emissions: -3.0, // Avoided emissions
      trend: 8.5,
      icon: <Recycle className="w-5 h-5" />
    },
    {
      name: 'Organic/Food Waste',
      generated: 1500,
      recycled: 0,
      composted: 1200,
      landfill: 300,
      incinerated: 0,
      hazardous: false,
      cost: 400,
      revenue: 200,
      emissions: 0.5,
      trend: -12.3,
      icon: <Leaf className="w-5 h-5" />
    },
    {
      name: 'E-Waste',
      generated: 300,
      recycled: 280,
      composted: 0,
      landfill: 0,
      incinerated: 20,
      hazardous: true,
      cost: 500,
      revenue: 350,
      emissions: 0.1,
      trend: 15.2,
      icon: <Factory className="w-5 h-5" />
    },
    {
      name: 'Packaging',
      generated: 1200,
      recycled: 1000,
      composted: 0,
      landfill: 200,
      incinerated: 0,
      hazardous: false,
      cost: 300,
      revenue: 450,
      emissions: -1.5,
      trend: -5.8,
      icon: <Package className="w-5 h-5" />
    }
  ]);

  const [circularMetrics] = useState({
    materialsRecovered: 5780,
    materialsReintroduced: 3200,
    virginMaterialsAvoided: 2800,
    circularityRate: 35.8
  });

  const [targets] = useState({
    zeroWaste: { current: 47, target: 90, deadline: '2030' },
    recyclingRate: { current: 35, target: 65, deadline: '2025' },
    landfillDiversion: { current: 53, target: 95, deadline: '2030' }
  });

  const [aiInsights] = useState([
    { type: 'contamination', message: 'Recycling contamination at 18% - training needed' },
    { type: 'opportunity', message: 'Composting program could divert 3 tonnes/month' },
    { type: 'cost', message: 'Waste-to-energy option would save $500/month' },
    { type: 'compliance', message: 'New e-waste regulations effective next quarter' }
  ]);

  // Calculate totals
  const totalGenerated = wasteStreams.reduce((sum, stream) => sum + stream.generated, 0);
  const totalRecycled = wasteStreams.reduce((sum, stream) => sum + stream.recycled, 0);
  const totalComposted = wasteStreams.reduce((sum, stream) => sum + stream.composted, 0);
  const totalLandfill = wasteStreams.reduce((sum, stream) => sum + stream.landfill, 0);
  const totalIncinerated = wasteStreams.reduce((sum, stream) => sum + stream.incinerated, 0);
  const totalCost = wasteStreams.reduce((sum, stream) => sum + stream.cost, 0);
  const totalRevenue = wasteStreams.reduce((sum, stream) => sum + stream.revenue, 0);
  const totalEmissions = wasteStreams.reduce((sum, stream) => sum + stream.emissions, 0);

  const diversionRate = (((totalRecycled + totalComposted) / totalGenerated) * 100).toFixed(1);
  const recyclingRate = ((totalRecycled / totalGenerated) * 100).toFixed(1);
  const landfillRate = ((totalLandfill / totalGenerated) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Trash2 className="w-7 h-7 text-green-500" />
              Waste Management Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GRI 306 compliant waste generation, diversion, and disposal tracking
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {(['generation', 'diversion', 'disposal', 'circular'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-6 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Generated</span>
              <Trash2 className="w-4 h-4 text-gray-500" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {(totalGenerated / 1000).toFixed(1)}t
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingDown className="w-3 h-3 text-green-500" />
              <span className="text-green-500">-4.2%</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Diversion</span>
              <Recycle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {diversionRate}%
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+3.1%</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Recycling</span>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {recyclingRate}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Target: 65%
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Landfill</span>
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {landfillRate}%
            </div>
            <div className="text-xs text-red-500 mt-1">
              Above target
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Net Cost</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              ${((totalCost - totalRevenue) / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Rev: ${(totalRevenue / 1000).toFixed(1)}k
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Emissions</span>
              <Activity className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {totalEmissions.toFixed(1)} tCO2e
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Net impact
            </div>
          </div>
        </div>
      </div>

      {/* Generation View */}
      {viewMode === 'generation' && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Waste Generation by Stream (GRI 306-3)
          </h3>

          <div className="space-y-3">
            {wasteStreams.map((stream, idx) => (
              <motion.div
                key={stream.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stream.hazardous ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-200 dark:bg-gray-700'
                    }`}>
                      {stream.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        {stream.name}
                        {stream.hazardous && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full">
                            Hazardous
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {stream.generated} kg • ${stream.cost - stream.revenue} net cost
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {stream.trend < 0 ? (
                      <TrendingDown className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingUp className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm ${stream.trend < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stream.trend > 0 ? '+' : ''}{stream.trend}%
                    </span>
                  </div>
                </div>

                {/* Disposal Breakdown */}
                <div className="flex gap-2">
                  {stream.recycled > 0 && (
                    <div className="flex-1">
                      <div className="h-2 bg-blue-500 rounded" style={{ width: `${(stream.recycled / stream.generated) * 100}%` }} />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Recycled: {((stream.recycled / stream.generated) * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                  {stream.composted > 0 && (
                    <div className="flex-1">
                      <div className="h-2 bg-green-500 rounded" style={{ width: `${(stream.composted / stream.generated) * 100}%` }} />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Composted: {((stream.composted / stream.generated) * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                  {stream.landfill > 0 && (
                    <div className="flex-1">
                      <div className="h-2 bg-orange-500 rounded" style={{ width: `${(stream.landfill / stream.generated) * 100}%` }} />
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Landfill: {((stream.landfill / stream.generated) * 100).toFixed(0)}%
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Circular Economy View */}
      {viewMode === 'circular' && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Circular Economy Metrics
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <Recycle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(circularMetrics.materialsRecovered / 1000).toFixed(1)}t
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Materials Recovered</div>
            </div>
            <div className="text-center">
              <Package className="w-12 h-12 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(circularMetrics.materialsReintroduced / 1000).toFixed(1)}t
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Reintroduced</div>
            </div>
            <div className="text-center">
              <Leaf className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(circularMetrics.virginMaterialsAvoided / 1000).toFixed(1)}t
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Virgin Materials Avoided</div>
            </div>
            <div className="text-center">
              <Target className="w-12 h-12 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {circularMetrics.circularityRate}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Circularity Rate</div>
            </div>
          </div>

          {/* Zero Waste Progress */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Zero Waste Progress</h4>
            {Object.entries(targets).map(([key, target]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {target.current}% / {target.target}% by {target.deadline}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      target.current >= target.target
                        ? 'bg-green-500'
                        : target.current >= target.target * 0.7
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${(target.current / target.target) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 backdrop-blur-xl border border-green-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Waste Reduction AI Insights</h3>
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
                {insight.type === 'contamination' && <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" />}
                {insight.type === 'opportunity' && <Recycle className="w-4 h-4 text-green-400 mt-0.5" />}
                {insight.type === 'cost' && <DollarSign className="w-4 h-4 text-yellow-400 mt-0.5" />}
                {insight.type === 'compliance' && <Factory className="w-4 h-4 text-purple-400 mt-0.5" />}
                <p className="text-sm text-gray-300">{insight.message}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="mt-4 px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-300 rounded-lg hover:bg-green-500/30 transition-all">
          Ask AI for Zero Waste Strategy
        </button>
      </div>
    </div>
  );
}