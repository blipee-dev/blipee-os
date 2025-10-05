'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Droplet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Cloud,
  Waves,
  Home,
  Factory,
  Trees,
  Recycle,
  Bot,
  DollarSign,
  Activity,
  MapPin
} from 'lucide-react';

interface WaterDashboardProps {
  organizationId: string;
}

interface WaterSource {
  name: string;
  withdrawal: number;
  consumption: number;
  discharge: number;
  recycled: number;
  cost: number;
  trend: number;
  icon: React.ReactNode;
}

export function WaterDashboard({ organizationId }: WaterDashboardProps) {
  const [viewMode, setViewMode] = useState<'consumption' | 'discharge' | 'quality' | 'risk'>('consumption');
  const [loading, setLoading] = React.useState(true);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [totalWithdrawal, setTotalWithdrawal] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalDischarge, setTotalDischarge] = useState(0);
  const [totalRecycled, setTotalRecycled] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);

  const [waterUse] = useState([
    { category: 'Sanitary', volume: 600, percentage: 48 },
    { category: 'Cooling Systems', volume: 400, percentage: 32 },
    { category: 'Irrigation', volume: 150, percentage: 12 },
    { category: 'Process Water', volume: 100, percentage: 8 }
  ]);

  const [waterRisk] = useState({
    stressLevel: 'High',
    score: 3.8,
    maxScore: 5,
    risks: [
      'Located in water-stressed region',
      'Increasing drought frequency',
      'Rising water costs projected',
      'Regulatory restrictions possible'
    ]
  });

  const [emissions] = useState({
    treatment: 2.5,
    pumping: 1.2,
    wastewater: 1.8,
    total: 5.5
  });

  const [aiInsights] = useState([
    { type: 'alert', message: 'Leak detected: 15% water loss in Building A' },
    { type: 'saving', message: 'Greywater recycling could save 300 m³/month' },
    { type: 'optimization', message: 'Smart irrigation would reduce usage by 40%' },
    { type: 'compliance', message: 'Water stress area - reduction targets recommended' }
  ]);

  // Fetch water data
  React.useEffect(() => {
    const fetchWaterData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/water/sources');
        const data = await res.json();

        if (data.sources) {
          const getIcon = (name: string) => {
            if (name.toLowerCase().includes('municipal')) return <Home className="w-5 h-5" />;
            if (name.toLowerCase().includes('ground')) return <Waves className="w-5 h-5" />;
            if (name.toLowerCase().includes('rain')) return <Cloud className="w-5 h-5" />;
            if (name.toLowerCase().includes('recycled')) return <Recycle className="w-5 h-5" />;
            return <Droplet className="w-5 h-5" />;
          };

          setWaterSources(data.sources.map((s: any) => ({
            ...s,
            trend: 0, // TODO: Calculate trend from historical data
            icon: getIcon(s.name)
          })));
          setTotalWithdrawal(data.total_withdrawal || 0);
          setTotalConsumption(data.total_consumption || 0);
          setTotalDischarge(data.total_discharge || 0);
          setTotalRecycled(data.total_recycled || 0);
          setTotalCost(data.total_cost || 0);
          setRecyclingRate(data.recycling_rate || 0);
        }
      } catch (error) {
        console.error('Error fetching water data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWaterData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
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
              <Droplet className="w-7 h-7 text-blue-500" />
              Water Management Dashboard
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GRI 303 compliant water withdrawal, consumption, and discharge tracking
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {(['consumption', 'discharge', 'quality', 'risk'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Withdrawal</span>
              <Droplet className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalWithdrawal} m³
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingUp className="w-3 h-3 text-red-500" />
              <span className="text-red-500">+3.2%</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Consumption</span>
              <Activity className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalConsumption} m³
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {((totalConsumption / totalWithdrawal) * 100).toFixed(0)}% of withdrawal
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Discharge</span>
              <Waves className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalDischarge} m³
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Treated & released
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Recycling</span>
              <Recycle className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {recyclingRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-500">+5.2%</span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Cost</span>
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(totalCost / 1000).toFixed(1)}k
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ${(totalCost / totalConsumption).toFixed(2)}/m³
            </div>
          </div>
        </div>
      </div>

      {/* Consumption View */}
      {viewMode === 'consumption' && (
        <>
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Water Balance (GRI 303-3, 303-4, 303-5)
            </h3>

            <div className="space-y-3">
              {waterSources.map((source, idx) => (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        source.recycled > 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
                      }`}>
                        {source.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ${source.cost.toLocaleString()} • ${(source.cost / source.consumption).toFixed(2)}/m³
                        </div>
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

                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Withdrawal</span>
                      <div className="font-semibold text-gray-900 dark:text-white">{source.withdrawal} m³</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Consumption</span>
                      <div className="font-semibold text-gray-900 dark:text-white">{source.consumption} m³</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Discharge</span>
                      <div className="font-semibold text-gray-900 dark:text-white">{source.discharge} m³</div>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Recycled</span>
                      <div className="font-semibold text-green-600 dark:text-green-400">{source.recycled} m³</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Water Use by Category */}
          <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Water Use by Category
            </h3>

            <div className="grid grid-cols-4 gap-4">
              {waterUse.map((use, idx) => (
                <div key={use.category} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                    {use.percentage}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{use.category}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">{use.volume} m³</div>
                  <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                      style={{ width: `${use.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Risk View */}
      {viewMode === 'risk' && (
        <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Water Risk Assessment
          </h3>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-red-500" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Water Stress Level: <span className="text-red-500">{waterRisk.stressLevel}</span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    WRI Aqueduct Score: {waterRisk.score}/{waterRisk.maxScore}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {waterRisk.risks.map((risk, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{risk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Water-Related Emissions
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Water treatment</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{emissions.treatment} tCO2e</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Pumping energy</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{emissions.pumping} tCO2e</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Wastewater treatment</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{emissions.wastewater} tCO2e</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-white">Total Emissions</span>
                  <span className="font-bold text-gray-900 dark:text-white">{emissions.total} tCO2e</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 backdrop-blur-xl border border-blue-500/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Water Conservation AI Insights</h3>
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
                {insight.type === 'alert' && <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />}
                {insight.type === 'saving' && <DollarSign className="w-4 h-4 text-green-400 mt-0.5" />}
                {insight.type === 'optimization' && <Droplet className="w-4 h-4 text-blue-400 mt-0.5" />}
                {insight.type === 'compliance' && <MapPin className="w-4 h-4 text-yellow-400 mt-0.5" />}
                <p className="text-sm text-gray-300">{insight.message}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <button className="mt-4 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition-all">
          Ask AI for Water Conservation Plan
        </button>
      </div>
    </div>
  );
}