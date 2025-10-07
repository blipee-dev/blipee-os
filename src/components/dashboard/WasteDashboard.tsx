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
  Activity,
  Info
} from 'lucide-react';

interface WasteDashboardProps {
  organizationId: string;
  selectedSite?: { id: string; name: string } | null;
  selectedPeriod?: { start: string; end: string; label: string };
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

export function WasteDashboard({ organizationId, selectedSite, selectedPeriod }: WasteDashboardProps) {
  const [viewMode, setViewMode] = useState<'generation' | 'diversion' | 'disposal'>('generation');
  const [loading, setLoading] = React.useState(true);
  const [wasteStreams, setWasteStreams] = useState<WasteStream[]>([]);
  const [totalGenerated, setTotalGenerated] = useState(0);
  const [totalDiverted, setTotalDiverted] = useState(0);
  const [totalLandfill, setTotalLandfill] = useState(0);
  const [diversionRate, setDiversionRate] = useState(0);

  // Weighted allocation targets
  const [categoryTargets, setCategoryTargets] = useState<any[]>([]);
  const [overallTargetPercent, setOverallTargetPercent] = useState<number | null>(null);

  // Fetch waste data
  React.useEffect(() => {
    const fetchWasteData = async () => {
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

        const res = await fetch(`/api/waste/streams?${params}`);
        const data = await res.json();

        if (data.streams) {
          const getIcon = (type: string) => {
            if (type.toLowerCase().includes('recycl')) return <Recycle className="w-5 h-5" />;
            if (type.toLowerCase().includes('organic') || type.toLowerCase().includes('food')) return <Leaf className="w-5 h-5" />;
            if (type.toLowerCase().includes('e-waste') || type.toLowerCase().includes('electronic')) return <Factory className="w-5 h-5" />;
            if (type.toLowerCase().includes('packaging')) return <Package className="w-5 h-5" />;
            return <Trash2 className="w-5 h-5" />;
          };

          // Map API data to dashboard format
          setWasteStreams(data.streams.map((s: any) => ({
            name: `${s.type} (${s.disposal_method})`,
            generated: s.quantity,
            recycled: s.disposal_method === 'recycling' ? s.quantity : 0,
            composted: s.disposal_method === 'composting' ? s.quantity : 0,
            landfill: s.disposal_method === 'landfill' ? s.quantity : 0,
            incinerated: s.disposal_method === 'incineration' ? s.quantity : 0,
            hazardous: s.type.toLowerCase().includes('hazardous'),
            cost: 0, // TODO: Add cost tracking
            revenue: 0, // TODO: Add revenue tracking
            emissions: 0, // TODO: Calculate from disposal method
            trend: 0, // TODO: Calculate from historical data
            icon: getIcon(s.type)
          })));

          setTotalGenerated(data.total_generated || 0);
          setTotalDiverted(data.total_diverted || 0);
          setTotalLandfill(data.total_landfill || 0);
          setDiversionRate(data.diversion_rate || 0);
        }

        // Fetch weighted allocation targets for waste categories
        const currentYear = new Date().getFullYear();
        const allocParams = new URLSearchParams({
          baseline_year: (currentYear - 1).toString(),
        });

        const allocRes = await fetch(`/api/sustainability/targets/weighted-allocation?${allocParams}`);
        const allocData = await allocRes.json();

        if (allocData.allocations) {
          // Filter for waste-related categories
          const wasteCategories = allocData.allocations.filter((alloc: any) =>
            alloc.category === 'Waste'
          );
          setCategoryTargets(wasteCategories);
          setOverallTargetPercent(allocData.overallTarget);
          console.log('📊 Waste Category Targets:', wasteCategories);
        }
      } catch (error) {
        console.error('Error fetching waste data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWasteData();
  }, [selectedSite, selectedPeriod]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  // Calculate additional totals from streams
  const totalRecycled = wasteStreams.reduce((sum, stream) => sum + stream.recycled, 0);
  const totalComposted = wasteStreams.reduce((sum, stream) => sum + stream.composted, 0);
  const totalIncinerated = wasteStreams.reduce((sum, stream) => sum + stream.incinerated, 0);
  const totalCost = wasteStreams.reduce((sum, stream) => sum + stream.cost, 0);
  const totalRevenue = wasteStreams.reduce((sum, stream) => sum + stream.revenue, 0);
  const totalEmissions = wasteStreams.reduce((sum, stream) => sum + stream.emissions, 0);
  const recyclingRate = ((totalRecycled / totalGenerated) * 100).toFixed(1);
  const landfillRate = ((totalLandfill / totalGenerated) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900/50 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Recycle className="w-7 h-7 text-green-500" />
              Waste & Circular Economy
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GRI 306: Waste 2020 • Waste diverted from disposal & directed to disposal
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2">
            {(['generation', 'diversion', 'disposal'] as const).map(mode => (
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

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Diverted from Disposal</span>
              <Recycle className="w-4 h-4 text-green-600" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">GRI 306-4</div>
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {diversionRate.toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-sm mt-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">+3.1%</span>
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

          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">Directed to Disposal</span>
              <AlertTriangle className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">GRI 306-5</div>
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {landfillRate}%
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Landfill + Incineration
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