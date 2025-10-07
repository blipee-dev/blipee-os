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
  MapPin,
  Info
} from 'lucide-react';

interface WaterDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: { start: string; end: string; label: string };
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

export function WaterDashboard({ organizationId, selectedSite, selectedPeriod }: WaterDashboardProps) {
  const [viewMode, setViewMode] = useState<'consumption' | 'discharge' | 'quality' | 'risk'>('consumption');
  const [loading, setLoading] = React.useState(true);
  const [waterSources, setWaterSources] = useState<WaterSource[]>([]);
  const [totalWithdrawal, setTotalWithdrawal] = useState(0);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalDischarge, setTotalDischarge] = useState(0);
  const [totalRecycled, setTotalRecycled] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [recyclingRate, setRecyclingRate] = useState(0);

  // Weighted allocation targets
  const [categoryTargets, setCategoryTargets] = useState<any[]>([]);
  const [overallTargetPercent, setOverallTargetPercent] = useState<number | null>(null);

  // Fetch water data
  React.useEffect(() => {
    const fetchWaterData = async () => {
      setLoading(true);
      try {
        // Build query parameters
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

        // Fetch weighted allocation targets for water categories
        const currentYear = new Date().getFullYear();
        const allocParams = new URLSearchParams({
          baseline_year: (currentYear - 1).toString(),
        });

        const allocRes = await fetch(`/api/sustainability/targets/weighted-allocation?${allocParams}`);
        const allocData = await allocRes.json();

        if (allocData.allocations) {
          // Filter for water-related categories
          const waterCategories = allocData.allocations.filter((alloc: any) =>
            alloc.category === 'Water'
          );
          setCategoryTargets(waterCategories);
          setOverallTargetPercent(allocData.overallTarget);
          console.log('📊 Water Category Targets:', waterCategories);
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
              GRI 303: Water and Effluents 2018 • Water withdrawal, consumption, discharge & stress
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
              Water Balance by Source
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              GRI 303-3 (Withdrawal) • GRI 303-4 (Discharge) • GRI 303-5 (Consumption)
            </p>

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

        </>
      )}



      {/* Science-Based Category Targets */}
      {categoryTargets.length > 0 && (
        <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Science-Based Target Allocation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Weighted by emission profile, abatement potential, and technology readiness
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {overallTargetPercent?.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Overall Target</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {categoryTargets.map((target: any) => (
              <div
                key={target.category}
                className={`border rounded-lg p-4 ${
                  target.feasibility === 'high'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : target.feasibility === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{target.category}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {target.currentEmissions.toFixed(1)} tCO2e ({target.emissionPercent.toFixed(1)}%)
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    target.feasibility === 'high'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : target.feasibility === 'medium'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {target.feasibility} feasibility
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {target.adjustedTargetPercent.toFixed(1)}%
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      → {target.absoluteTarget.toFixed(1)} tCO2e
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {target.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  How Weighted Allocation Works
                </h5>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Categories with high emissions AND high abatement potential receive higher reduction targets.
                  This ensures the overall {overallTargetPercent?.toFixed(1)}% target is achievable by focusing efforts where they matter most.
                  Categories are weighted by emission percentage × effort factor (based on technology readiness and cost-effectiveness).
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}