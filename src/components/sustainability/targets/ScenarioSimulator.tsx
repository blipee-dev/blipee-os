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
  Sparkles
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
  ReferenceArea
} from 'recharts';

interface ScenarioSimulatorProps {
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

interface Scenario {
  id: string;
  name: string;
  targetYear: number;
  reductionPercent: number;
  scope1Reduction: number;
  scope2Reduction: number;
  scope3Reduction: number;
  renewable: number;
  carbonOffsets: number;
  sbtiAligned: boolean;
  pathway: 'linear' | 'exponential' | 'stepped';
  investments: number;
  initiatives: string[];
}

const SBTi_TARGETS = {
  '1.5C': {
    nearTerm: 42, // 42% by 2030
    netZero: 90, // 90% by 2050
    minRate: 4.2 // Minimum 4.2% annual reduction
  },
  'WellBelow2C': {
    nearTerm: 25,
    netZero: 90,
    minRate: 2.5
  },
  '2C': {
    nearTerm: 18,
    netZero: 90,
    minRate: 1.8
  }
};

export function ScenarioSimulator({
  currentEmissions,
  baselineYear,
  sites = [],
  organizationId
}: ScenarioSimulatorProps) {
  const [activeScenario, setActiveScenario] = useState<Scenario>({
    id: 'current',
    name: 'Current Trajectory',
    targetYear: 2030,
    reductionPercent: 42,
    scope1Reduction: 42,
    scope2Reduction: 42,
    scope3Reduction: 42,
    renewable: 50,
    carbonOffsets: 5,
    sbtiAligned: true,
    pathway: 'linear',
    investments: 0,
    initiatives: []
  });

  const [compareScenarios, setCompareScenarios] = useState<Scenario[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [simulationResults, setSimulationResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Calculate projection data based on scenario
  const projectionData = useMemo(() => {
    const years = [];
    const currentYear = new Date().getFullYear();
    const yearsToTarget = activeScenario.targetYear - currentYear;

    for (let i = 0; i <= yearsToTarget; i++) {
      const year = currentYear + i;
      let reduction = 0;

      // Calculate reduction based on pathway type
      if (activeScenario.pathway === 'linear') {
        reduction = (activeScenario.reductionPercent / yearsToTarget) * i;
      } else if (activeScenario.pathway === 'exponential') {
        reduction = activeScenario.reductionPercent * Math.pow(i / yearsToTarget, 2);
      } else if (activeScenario.pathway === 'stepped') {
        reduction = Math.floor(i / (yearsToTarget / 4)) * (activeScenario.reductionPercent / 4);
      }

      const baseEmissions = currentEmissions.total;
      const projectedEmissions = baseEmissions * (1 - reduction / 100);

      // Apply scope-specific reductions
      const scope1 = currentEmissions.scope1 * (1 - (activeScenario.scope1Reduction * reduction / activeScenario.reductionPercent) / 100);
      const scope2 = currentEmissions.scope2 * (1 - (activeScenario.scope2Reduction * reduction / activeScenario.reductionPercent) / 100);
      const scope3 = currentEmissions.scope3 * (1 - (activeScenario.scope3Reduction * reduction / activeScenario.reductionPercent) / 100);

      // Apply renewable energy impact on Scope 2
      const renewableImpact = (activeScenario.renewable / 100) * scope2 * 0.8; // 80% reduction from renewable
      const adjustedScope2 = Math.max(scope2 - renewableImpact, scope2 * 0.2);

      // Apply carbon offsets
      const offsetAmount = projectedEmissions * (activeScenario.carbonOffsets / 100);
      const netEmissions = Math.max(projectedEmissions - offsetAmount, 0);

      years.push({
        year,
        total: projectedEmissions,
        net: netEmissions,
        scope1,
        scope2: adjustedScope2,
        scope3,
        reduction: reduction.toFixed(1),
        sbtiTarget: year === 2030 ? currentEmissions.total * (1 - SBTi_TARGETS['1.5C'].nearTerm / 100) : null,
        sbtiNetZero: year === 2050 ? currentEmissions.total * (1 - SBTi_TARGETS['1.5C'].netZero / 100) : null
      });
    }

    return years;
  }, [activeScenario, currentEmissions]);

  // Check SBTi alignment
  const sbtiValidation = useMemo(() => {
    const annualRate = activeScenario.reductionPercent / (activeScenario.targetYear - new Date().getFullYear());
    const is15CAligned = activeScenario.targetYear === 2030 &&
                         activeScenario.reductionPercent >= SBTi_TARGETS['1.5C'].nearTerm &&
                         annualRate >= SBTi_TARGETS['1.5C'].minRate;

    const isWB2CAligned = activeScenario.targetYear === 2030 &&
                          activeScenario.reductionPercent >= SBTi_TARGETS['WellBelow2C'].nearTerm &&
                          annualRate >= SBTi_TARGETS['WellBelow2C'].minRate;

    return {
      is15C: is15CAligned,
      isWB2C: isWB2CAligned,
      is2C: activeScenario.reductionPercent >= SBTi_TARGETS['2C'].nearTerm,
      annualRate,
      recommendation: is15CAligned ? '1.5°C aligned' : isWB2CAligned ? 'Well Below 2°C aligned' : '2°C aligned',
      gap: is15CAligned ? 0 : SBTi_TARGETS['1.5C'].nearTerm - activeScenario.reductionPercent
    };
  }, [activeScenario]);

  // Run simulation
  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('/api/sustainability/scenarios/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: activeScenario,
          currentEmissions,
          siteId: selectedSite !== 'all' ? selectedSite : null
        })
      });

      if (response.ok) {
        const results = await response.json();
        setSimulationResults(results);
      }
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Add scenario to comparison
  const addToComparison = () => {
    if (compareScenarios.length < 3) {
      setCompareScenarios([
        ...compareScenarios,
        {
          ...activeScenario,
          id: `scenario-${Date.now()}`,
          name: `Scenario ${compareScenarios.length + 1}`
        }
      ]);
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
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500
                          flex items-center justify-center">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Scenario Simulator</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Model different emission reduction pathways</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
            >
              <Settings2 className="w-4 h-4" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </button>
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500
                       text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200
                       flex items-center gap-2 disabled:opacity-50"
            >
              {isSimulating ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Run Simulation
            </button>
          </div>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Basic Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Target Year</label>
              <input
                type="range"
                min="2025"
                max="2050"
                value={activeScenario.targetYear}
                onChange={(e) => setActiveScenario({
                  ...activeScenario,
                  targetYear: parseInt(e.target.value)
                })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span>2025</span>
                <span className="text-gray-900 dark:text-white font-medium">{activeScenario.targetYear}</span>
                <span>2050</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Overall Reduction Target
              </label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={activeScenario.reductionPercent}
                  onChange={(e) => setActiveScenario({
                    ...activeScenario,
                    reductionPercent: parseInt(e.target.value)
                  })}
                  className="flex-1"
                />
                <div className="w-20 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800
                              border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center">
                  {activeScenario.reductionPercent}%
                </div>
              </div>
              {/* SBTi Alignment Indicator */}
              <div className="flex items-center gap-2 mt-2">
                {sbtiValidation.is15C ? (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>1.5°C aligned</span>
                  </div>
                ) : sbtiValidation.isWB2C ? (
                  <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Well Below 2°C aligned</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-orange-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Need {sbtiValidation.gap.toFixed(0)}% more for 1.5°C</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Reduction Pathway</label>
              <div className="flex gap-2 mt-2">
                {['linear', 'exponential', 'stepped'].map((pathway) => (
                  <button
                    key={pathway}
                    onClick={() => setActiveScenario({ ...activeScenario, pathway: pathway as any })}
                    className={`flex-1 px-3 py-2 rounded-lg border transition-all duration-200
                              ${activeScenario.pathway === pathway
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                              }`}
                  >
                    {pathway.charAt(0).toUpperCase() + pathway.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Scope-Specific Controls */}
          {showAdvanced && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scope 1 Reduction
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeScenario.scope1Reduction}
                    onChange={(e) => setActiveScenario({
                      ...activeScenario,
                      scope1Reduction: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-900 dark:text-white w-12 text-right">
                    {activeScenario.scope1Reduction}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scope 2 Reduction
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeScenario.scope2Reduction}
                    onChange={(e) => setActiveScenario({
                      ...activeScenario,
                      scope2Reduction: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-900 dark:text-white w-12 text-right">
                    {activeScenario.scope2Reduction}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scope 3 Reduction
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeScenario.scope3Reduction}
                    onChange={(e) => setActiveScenario({
                      ...activeScenario,
                      scope3Reduction: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-900 dark:text-white w-12 text-right">
                    {activeScenario.scope3Reduction}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mitigation Measures */}
          {showAdvanced && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Renewable Energy %
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={activeScenario.renewable}
                    onChange={(e) => setActiveScenario({
                      ...activeScenario,
                      renewable: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-900 dark:text-white w-12 text-right">
                    {activeScenario.renewable}%
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Carbon Offsets %
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={activeScenario.carbonOffsets}
                    onChange={(e) => setActiveScenario({
                      ...activeScenario,
                      carbonOffsets: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-900 dark:text-white w-12 text-right">
                    {activeScenario.carbonOffsets}%
                  </span>
                </div>
                {activeScenario.carbonOffsets > 10 && (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    SBTi recommends limiting offsets to 5-10% of total reductions
                  </p>
                )}
              </div>

              {sites.length > 0 && (
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Apply to Site
                  </label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    className="w-full mt-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Sites</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Emission Pathway Projection</h3>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="year"
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#666"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px'
              }}
              formatter={(value: any) => `${(value / 1000).toFixed(1)}k tCO₂e`}
            />
            <Legend />

            {/* Emission areas */}
            <Area
              type="monotone"
              dataKey="scope3"
              stackId="1"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              fillOpacity={0.3}
              name="Scope 3"
            />
            <Area
              type="monotone"
              dataKey="scope2"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Scope 2"
            />
            <Area
              type="monotone"
              dataKey="scope1"
              stackId="1"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              name="Scope 1"
            />

            {/* Net emissions line */}
            <Line
              type="monotone"
              dataKey="net"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              name="Net Emissions"
            />

            {/* SBTi target lines */}
            <ReferenceLine
              y={currentEmissions.total * (1 - SBTi_TARGETS['1.5C'].nearTerm / 100)}
              stroke="#10b981"
              strokeDasharray="5 5"
              label={{ value: "SBTi 1.5°C (2030)", position: "left", fill: "#10b981" }}
            />
            {activeScenario.targetYear >= 2050 && (
              <ReferenceLine
                y={currentEmissions.total * (1 - SBTi_TARGETS['1.5C'].netZero / 100)}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: "Net Zero (2050)", position: "left", fill: "#ef4444" }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SBTi Validation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">SBTi Validation</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Temperature Alignment</span>
              <span className={`text-sm font-medium ${
                sbtiValidation.is15C ? 'text-green-400' :
                sbtiValidation.isWB2C ? 'text-yellow-400' : 'text-orange-400'
              }`}>
                {sbtiValidation.recommendation}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Annual Reduction Rate</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {sbtiValidation.annualRate.toFixed(1)}% per year
              </span>
            </div>
            {sbtiValidation.gap > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Increase target by {sbtiValidation.gap.toFixed(0)}% to align with 1.5°C pathway
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Impact Summary</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Reduction</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {((currentEmissions.total * activeScenario.reductionPercent / 100) / 1000).toFixed(1)}k tCO₂e
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Final Emissions</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {((currentEmissions.total * (1 - activeScenario.reductionPercent / 100)) / 1000).toFixed(1)}k tCO₂e
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Offset Amount</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {((currentEmissions.total * activeScenario.carbonOffsets / 100) / 1000).toFixed(1)}k tCO₂e
              </span>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Actions</h3>
          </div>

          <div className="space-y-2">
            <button
              onClick={addToComparison}
              disabled={compareScenarios.length >= 3}
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4" />
              Add to Comparison
            </button>

            <button
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                       text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Scenario
            </button>

            <button
              className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500
                       text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200
                       flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </motion.div>
      </div>

      {/* Scenario Comparison */}
      {compareScenarios.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scenario Comparison</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.05]">
                  <th className="text-left py-2 px-3 text-xs text-gray-400 uppercase">Scenario</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 uppercase">Target</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 uppercase">Reduction</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 uppercase">SBTi</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 uppercase">Renewable</th>
                  <th className="text-center py-2 px-3 text-xs text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {compareScenarios.map((scenario) => (
                  <tr key={scenario.id} className="border-b border-white/[0.05]">
                    <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">{scenario.name}</td>
                    <td className="py-3 px-3 text-sm text-center text-gray-300">{scenario.targetYear}</td>
                    <td className="py-3 px-3 text-sm text-center text-gray-300">{scenario.reductionPercent}%</td>
                    <td className="py-3 px-3 text-center">
                      {scenario.sbtiAligned ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400 mx-auto" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-3 text-sm text-center text-gray-300">{scenario.renewable}%</td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => setCompareScenarios(compareScenarios.filter(s => s.id !== scenario.id))}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}