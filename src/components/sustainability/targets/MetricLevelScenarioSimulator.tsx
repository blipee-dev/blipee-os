'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  BarChart3,
  Zap,
  Building2,
  Leaf,
  Globe,
  Info,
  Download,
  Share2,
  Save,
  Play,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Sliders,
  Activity,
  Factory,
  Truck,
  Plane,
  Car,
  Home,
  ShoppingBag,
  Users,
  Trash2,
  Droplet,
  Wind
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

interface MetricLevelScenarioSimulatorProps {
  currentEmissions: {
    total: number;
    scope1: number;
    scope2: number;
    scope3: number;
  };
  baselineYear: number;
  sites?: any[];
  organizationId: string;
}

interface MetricReduction {
  metricId: string;
  metricName: string;
  category: string;
  scope: number;
  currentEmissions: number;
  targetReduction: number;
  initiatives: string[];
  feasibility: 'easy' | 'medium' | 'hard';
  cost: 'low' | 'medium' | 'high';
}

interface DetailedScenario {
  id: string;
  name: string;
  targetYear: number;
  overallReduction: number;
  metricReductions: MetricReduction[];
  pathway: 'linear' | 'exponential' | 'stepped' | 'custom';
  renewable: number;
  carbonOffsets: number;
  sbtiAligned: boolean;
  investments: number;
}

// Common emission source metrics by scope
const EMISSION_METRICS = {
  scope1: [
    { id: 'natural-gas', name: 'Natural Gas', icon: <Zap className="w-4 h-4" />, category: 'Stationary Combustion' },
    { id: 'fleet-diesel', name: 'Fleet Diesel', icon: <Truck className="w-4 h-4" />, category: 'Mobile Combustion' },
    { id: 'fleet-gasoline', name: 'Fleet Gasoline', icon: <Car className="w-4 h-4" />, category: 'Mobile Combustion' },
    { id: 'refrigerants', name: 'Refrigerants', icon: <Wind className="w-4 h-4" />, category: 'Fugitive Emissions' },
    { id: 'process-emissions', name: 'Process Emissions', icon: <Factory className="w-4 h-4" />, category: 'Process' }
  ],
  scope2: [
    { id: 'electricity-location', name: 'Electricity (Location)', icon: <Zap className="w-4 h-4" />, category: 'Purchased Electricity' },
    { id: 'electricity-market', name: 'Electricity (Market)', icon: <Zap className="w-4 h-4" />, category: 'Purchased Electricity' },
    { id: 'district-heating', name: 'District Heating', icon: <Home className="w-4 h-4" />, category: 'Purchased Energy' },
    { id: 'district-cooling', name: 'District Cooling', icon: <Wind className="w-4 h-4" />, category: 'Purchased Energy' }
  ],
  scope3: [
    { id: 'purchased-goods', name: 'Purchased Goods', icon: <ShoppingBag className="w-4 h-4" />, category: 'Cat 1' },
    { id: 'capital-goods', name: 'Capital Goods', icon: <Building2 className="w-4 h-4" />, category: 'Cat 2' },
    { id: 'fuel-energy', name: 'Fuel & Energy', icon: <Zap className="w-4 h-4" />, category: 'Cat 3' },
    { id: 'upstream-transport', name: 'Upstream Transport', icon: <Truck className="w-4 h-4" />, category: 'Cat 4' },
    { id: 'waste', name: 'Waste', icon: <Trash2 className="w-4 h-4" />, category: 'Cat 5' },
    { id: 'business-travel', name: 'Business Travel', icon: <Plane className="w-4 h-4" />, category: 'Cat 6' },
    { id: 'employee-commuting', name: 'Employee Commuting', icon: <Users className="w-4 h-4" />, category: 'Cat 7' },
    { id: 'downstream-transport', name: 'Downstream Transport', icon: <Truck className="w-4 h-4" />, category: 'Cat 9' },
    { id: 'use-of-products', name: 'Use of Products', icon: <Activity className="w-4 h-4" />, category: 'Cat 11' },
    { id: 'end-of-life', name: 'End of Life', icon: <Trash2 className="w-4 h-4" />, category: 'Cat 12' }
  ]
};

// Initiative templates for each metric
const METRIC_INITIATIVES = {
  'natural-gas': [
    'Switch to electric heat pumps',
    'Improve building insulation',
    'Install smart thermostats',
    'Transition to biomethane'
  ],
  'fleet-diesel': [
    'Electrify vehicle fleet',
    'Use biodiesel blends',
    'Optimize route planning',
    'Implement driver training'
  ],
  'electricity-location': [
    'Install solar panels',
    'Purchase renewable energy',
    'Implement energy management system',
    'Upgrade to efficient equipment'
  ],
  'business-travel': [
    'Virtual meeting policy',
    'Sustainable travel booking',
    'Carbon offset program',
    'Travel reduction targets'
  ],
  'purchased-goods': [
    'Supplier engagement program',
    'Sustainable procurement policy',
    'Local sourcing strategy',
    'Circular economy initiatives'
  ],
  'waste': [
    'Zero waste to landfill',
    'Composting program',
    'Recycling optimization',
    'Waste reduction targets'
  ]
};

export function MetricLevelScenarioSimulator({
  currentEmissions,
  baselineYear,
  sites = [],
  organizationId
}: MetricLevelScenarioSimulatorProps) {
  const [activeScenario, setActiveScenario] = useState<DetailedScenario>({
    id: 'current',
    name: 'Custom Scenario',
    targetYear: 2030,
    overallReduction: 42,
    metricReductions: [],
    pathway: 'custom',
    renewable: 50,
    carbonOffsets: 5,
    sbtiAligned: false,
    investments: 0
  });

  const [selectedScope, setSelectedScope] = useState<'scope1' | 'scope2' | 'scope3'>('scope1');
  const [expandedMetrics, setExpandedMetrics] = useState<Set<string>>(new Set());
  const [metricData, setMetricData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);

  // Fetch actual metrics data from the API
  useEffect(() => {
    fetchMetricsData();
  }, [organizationId]);

  const fetchMetricsData = async () => {
    try {
      const response = await fetch('/api/metrics/by-category');
      if (response.ok) {
        const data = await response.json();

        // Initialize metric reductions based on actual data
        const reductions: MetricReduction[] = data.metrics.map((metric: any) => ({
          metricId: metric.id,
          metricName: metric.name,
          category: metric.category,
          scope: metric.scope,
          currentEmissions: metric.emissions || 0,
          targetReduction: 0,
          initiatives: [],
          feasibility: 'medium',
          cost: 'medium'
        }));

        setMetricData(data.metrics);
        setActiveScenario(prev => ({
          ...prev,
          metricReductions: reductions
        }));
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall reduction based on metric-level reductions
  const calculateOverallReduction = () => {
    const totalCurrent = activeScenario.metricReductions.reduce(
      (sum, m) => sum + m.currentEmissions, 0
    );

    const totalReduction = activeScenario.metricReductions.reduce(
      (sum, m) => sum + (m.currentEmissions * m.targetReduction / 100), 0
    );

    return totalCurrent > 0 ? (totalReduction / totalCurrent) * 100 : 0;
  };

  // Update metric reduction
  const updateMetricReduction = (metricId: string, reduction: number) => {
    setActiveScenario(prev => ({
      ...prev,
      metricReductions: prev.metricReductions.map(m =>
        m.metricId === metricId ? { ...m, targetReduction: reduction } : m
      ),
      overallReduction: calculateOverallReduction()
    }));
  };

  // Toggle metric expansion
  const toggleMetricExpansion = (metricId: string) => {
    setExpandedMetrics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(metricId)) {
        newSet.delete(metricId);
      } else {
        newSet.add(metricId);
      }
      return newSet;
    });
  };

  // Group metrics by scope
  const metricsByScope = useMemo(() => {
    return activeScenario.metricReductions.reduce((acc, metric) => {
      const scope = `scope${metric.scope}`;
      if (!acc[scope]) acc[scope] = [];
      acc[scope].push(metric);
      return acc;
    }, {} as Record<string, MetricReduction[]>);
  }, [activeScenario.metricReductions]);

  // Calculate projections with metric-level detail
  const projectionData = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    const yearsToTarget = activeScenario.targetYear - currentYear;

    for (let i = 0; i <= yearsToTarget; i++) {
      const year = currentYear + i;
      const progress = i / yearsToTarget;

      // Calculate emissions for each metric
      const metricEmissions = activeScenario.metricReductions.map(metric => {
        let reductionFactor = 0;

        if (activeScenario.pathway === 'linear') {
          reductionFactor = progress;
        } else if (activeScenario.pathway === 'exponential') {
          reductionFactor = Math.pow(progress, 2);
        } else if (activeScenario.pathway === 'stepped') {
          reductionFactor = Math.floor(progress * 4) / 4;
        } else {
          // Custom pathway based on individual metric targets
          reductionFactor = progress;
        }

        const emissions = metric.currentEmissions * (1 - (metric.targetReduction * reductionFactor / 100));

        return {
          metricId: metric.metricId,
          metricName: metric.metricName,
          emissions
        };
      });

      // Aggregate by scope
      const scope1Total = metricEmissions
        .filter(m => metricsByScope.scope1?.some(s => s.metricId === m.metricId))
        .reduce((sum, m) => sum + m.emissions, 0);

      const scope2Total = metricEmissions
        .filter(m => metricsByScope.scope2?.some(s => s.metricId === m.metricId))
        .reduce((sum, m) => sum + m.emissions, 0);

      const scope3Total = metricEmissions
        .filter(m => metricsByScope.scope3?.some(s => s.metricId === m.metricId))
        .reduce((sum, m) => sum + m.emissions, 0);

      const total = scope1Total + scope2Total + scope3Total;
      const offsets = total * (activeScenario.carbonOffsets / 100);

      years.push({
        year,
        total,
        net: total - offsets,
        scope1: scope1Total,
        scope2: scope2Total,
        scope3: scope3Total,
        metrics: metricEmissions,
        reduction: ((currentEmissions.total - total) / currentEmissions.total * 100).toFixed(1)
      });
    }

    return years;
  }, [activeScenario, currentEmissions, metricsByScope]);

  // Run detailed simulation
  const runSimulation = async () => {
    try {
      const response = await fetch('/api/sustainability/scenarios/simulate-metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeScenario,
          currentEmissions,
          siteId: sites[0]?.id
        })
      });

      if (response.ok) {
        const results = await response.json();
        setSimulationResults(results);
      }
    } catch (error) {
      console.error('Simulation error:', error);
    }
  };

  // Apply preset reduction strategies
  const applyPreset = (preset: string) => {
    const presets: Record<string, Record<string, number>> = {
      'aggressive': {
        'natural-gas': 80,
        'fleet-diesel': 90,
        'electricity-location': 100,
        'business-travel': 70,
        'purchased-goods': 50,
        'waste': 90
      },
      'moderate': {
        'natural-gas': 40,
        'fleet-diesel': 50,
        'electricity-location': 70,
        'business-travel': 40,
        'purchased-goods': 25,
        'waste': 60
      },
      'conservative': {
        'natural-gas': 20,
        'fleet-diesel': 25,
        'electricity-location': 40,
        'business-travel': 20,
        'purchased-goods': 15,
        'waste': 40
      }
    };

    if (presets[preset]) {
      setActiveScenario(prev => ({
        ...prev,
        metricReductions: prev.metricReductions.map(m => ({
          ...m,
          targetReduction: presets[preset][m.metricId] || 0
        }))
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500
                          flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Metric-Level Scenario Simulator</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Set reduction targets for individual emission sources</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Preset Strategies */}
            <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <button
                onClick={() => applyPreset('conservative')}
                className="px-3 py-1 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Conservative
              </button>
              <button
                onClick={() => applyPreset('moderate')}
                className="px-3 py-1 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Moderate
              </button>
              <button
                onClick={() => applyPreset('aggressive')}
                className="px-3 py-1 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Aggressive
              </button>
            </div>
            <button
              onClick={runSimulation}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500
                       text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                       flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Run Simulation
            </button>
          </div>
        </div>

        {/* Scope Selector */}
        <div className="flex gap-2 mb-4">
          {['scope1', 'scope2', 'scope3'].map((scope) => (
            <button
              key={scope}
              onClick={() => setSelectedScope(scope as any)}
              className={`px-4 py-2 rounded-lg border transition-all duration-200
                        ${selectedScope === scope
                          ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
            >
              {scope === 'scope1' && <Factory className="w-4 h-4 inline mr-2" />}
              {scope === 'scope2' && <Zap className="w-4 h-4 inline mr-2" />}
              {scope === 'scope3' && <Globe className="w-4 h-4 inline mr-2" />}
              {scope.charAt(0).toUpperCase() + scope.slice(1, 5) + ' ' + scope.slice(5)}
            </button>
          ))}
        </div>

        {/* Metric Controls */}
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {(metricsByScope[selectedScope] || []).map((metric) => (
            <motion.div
              key={metric.metricId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMetricExpansion(metric.metricId)}
                    className="p-1 hover:bg-white/[0.05] rounded transition-all"
                  >
                    {expandedMetrics.has(metric.metricId) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500/20 to-blue-500/20
                                flex items-center justify-center">
                    {EMISSION_METRICS[selectedScope]?.find(m => m.id === metric.metricId)?.icon ||
                     <Activity className="w-4 h-4 text-purple-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">{metric.metricName}</h4>
                    <p className="text-xs text-gray-400">
                      {metric.category} • {(metric.currentEmissions / 1000).toFixed(1)}k tCO₂e
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={metric.targetReduction}
                    onChange={(e) => updateMetricReduction(metric.metricId, parseInt(e.target.value))}
                    className="w-32"
                  />
                  <div className="w-16 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800
                                border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center text-sm">
                    {metric.targetReduction}%
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedMetrics.has(metric.metricId) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-4 space-y-3 overflow-hidden"
                  >
                    {/* Reduction Impact */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02]">
                      <span className="text-xs text-gray-400">Reduction Impact</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        -{((metric.currentEmissions * metric.targetReduction / 100) / 1000).toFixed(1)}k tCO₂e
                      </span>
                    </div>

                    {/* Suggested Initiatives */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Suggested Initiatives</p>
                      <div className="space-y-1">
                        {(METRIC_INITIATIVES[metric.metricId] || []).slice(0, 3).map((initiative, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-gray-300">{initiative}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feasibility & Cost */}
                    <div className="flex gap-3">
                      <div className="flex-1 p-2 rounded-lg bg-white/[0.02]">
                        <p className="text-xs text-gray-400">Feasibility</p>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">{metric.feasibility}</p>
                      </div>
                      <div className="flex-1 p-2 rounded-lg bg-white/[0.02]">
                        <p className="text-xs text-gray-400">Cost</p>
                        <p className="text-sm text-gray-900 dark:text-white capitalize">{metric.cost}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Visualization Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projection Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emission Pathway</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="year" stroke="#666" style={{ fontSize: '12px' }} />
              <YAxis stroke="#666" style={{ fontSize: '12px' }}
                     tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px'
                }}
              />
              <Area type="monotone" dataKey="scope3" stackId="1" stroke="#8b5cf6"
                    fill="#8b5cf6" fillOpacity={0.3} name="Scope 3" />
              <Area type="monotone" dataKey="scope2" stackId="1" stroke="#3b82f6"
                    fill="#3b82f6" fillOpacity={0.3} name="Scope 2" />
              <Area type="monotone" dataKey="scope1" stackId="1" stroke="#10b981"
                    fill="#10b981" fillOpacity={0.3} name="Scope 1" />
              <Line type="monotone" dataKey="net" stroke="#fbbf24" strokeWidth={2}
                    dot={false} name="Net Emissions" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Metric Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Reduction by Metric</h3>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {activeScenario.metricReductions
              .filter(m => m.targetReduction > 0)
              .sort((a, b) => (b.currentEmissions * b.targetReduction) - (a.currentEmissions * a.targetReduction))
              .slice(0, 10)
              .map((metric) => {
                const reduction = (metric.currentEmissions * metric.targetReduction / 100) / 1000;
                const maxReduction = Math.max(...activeScenario.metricReductions.map(
                  m => (m.currentEmissions * m.targetReduction / 100) / 1000
                ));

                return (
                  <div key={metric.metricId} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-300">{metric.metricName}</span>
                        <span className="text-xs text-white">{reduction.toFixed(1)}k tCO₂e</span>
                      </div>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(reduction / maxReduction) * 100}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Total Reduction</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {calculateOverallReduction().toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 mt-1">
            By {activeScenario.targetYear}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Metrics Targeted</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeScenario.metricReductions.filter(m => m.targetReduction > 0).length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Of {activeScenario.metricReductions.length} total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Emissions Avoided</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {(activeScenario.metricReductions.reduce(
              (sum, m) => sum + (m.currentEmissions * m.targetReduction / 100), 0
            ) / 1000).toFixed(1)}k
          </p>
          <p className="text-xs text-gray-400 mt-1">
            tCO₂e total
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">SBTi Status</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {calculateOverallReduction() >= 42 ? '1.5°C' :
             calculateOverallReduction() >= 25 ? 'WB2C' : 'Review'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Alignment level
          </p>
        </motion.div>
      </div>
    </div>
  );
}