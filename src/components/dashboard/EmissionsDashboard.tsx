'use client';

import React, { useState, useEffect } from 'react';
import {
  Cloud,
  TrendingUp,
  TrendingDown,
  Leaf,
  Target,
  Info,
  Factory,
  AlertTriangle,
  MapPin,
  Gauge,
  Flame,
  Zap,
  Wind,
  Recycle,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import type { Building } from '@/types/auth';
import type { TimePeriod } from '@/components/zero-typing/TimePeriodSelector';

interface EmissionsDashboardProps {
  organizationId: string;
  selectedSite: Building | null;
  selectedPeriod: TimePeriod;
}

export function EmissionsDashboard({ organizationId, selectedSite, selectedPeriod }: EmissionsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [emissionsData, setEmissionsData] = useState<any>(null);

  // Summary metrics (will be populated from API)
  const [totalEmissions, setTotalEmissions] = useState(0);
  const [totalEmissionsYoY, setTotalEmissionsYoY] = useState(0);
  const [scope1Total, setScope1Total] = useState(0);
  const [scope1YoY, setScope1YoY] = useState(0);
  const [scope2Total, setScope2Total] = useState(0);
  const [scope2YoY, setScope2YoY] = useState(0);
  const [scope3Total, setScope3Total] = useState(0);
  const [scope3YoY, setScope3YoY] = useState(0);

  // Scope 1 breakdown by gas type (GRI 305-1) - use real data when available
  const gasTypeBreakdown = emissionsData?.scope1?.byGasType ? [
    { name: 'CO₂', value: emissionsData.scope1.byGasType.co2 || 0, percentage: 0, color: '#6B7280' },
    { name: 'CH₄', value: emissionsData.scope1.byGasType.ch4 || 0, percentage: 0, color: '#F97316' },
    { name: 'N₂O', value: emissionsData.scope1.byGasType.n2o || 0, percentage: 0, color: '#EF4444' },
    { name: 'HFCs', value: emissionsData.scope1.byGasType.hfcs || 0, percentage: 0, color: '#8B5CF6' },
    { name: 'PFCs', value: emissionsData.scope1.byGasType.pfcs || 0, percentage: 0, color: '#8B5CF6' },
    { name: 'SF₆', value: emissionsData.scope1.byGasType.sf6 || 0, percentage: 0, color: '#EF4444' },
    { name: 'NF₃', value: emissionsData.scope1.byGasType.nf3 || 0, percentage: 0, color: '#F97316' }
  ].map(item => {
    const total = scope1Total || 1;
    return { ...item, percentage: Math.round((item.value / total) * 100) };
  }).filter(item => item.value > 0) : [
    { name: 'CO₂', value: 68.5, percentage: 91, color: '#6B7280' },
    { name: 'CH₄', value: 4.2, percentage: 6, color: '#F97316' },
    { name: 'N₂O', value: 1.8, percentage: 2, color: '#EF4444' },
    { name: 'HFCs', value: 0.6, percentage: 1, color: '#8B5CF6' }
  ];

  // Scope 1 by source - use real data when available
  const scope1Sources = emissionsData?.scope1?.sources ? [
    { name: 'Stationary Combustion', value: emissionsData.scope1.sources.stationaryCombustion || 0, icon: Flame, color: '#F97316' },
    { name: 'Mobile Combustion', value: emissionsData.scope1.sources.mobileCombustion || 0, icon: Factory, color: '#3B82F6' },
    { name: 'Fugitive Emissions', value: emissionsData.scope1.sources.fugitiveEmissions || 0, icon: Wind, color: '#06B6D4' },
    { name: 'Process Emissions', value: emissionsData.scope1.sources.processEmissions || 0, icon: Factory, color: '#8B5CF6' }
  ].filter(item => item.value > 0) : [
    { name: 'Stationary Combustion', value: 45.2, icon: Flame, color: '#F97316' },
    { name: 'Mobile Combustion', value: 22.8, icon: Factory, color: '#3B82F6' },
    { name: 'Fugitive Emissions', value: 7.1, icon: Wind, color: '#06B6D4' }
  ];

  // Scope 2 dual reporting (GRI 305-2) - use real data when available
  const scope2Data = emissionsData?.scope2 ? {
    locationBased: emissionsData.scope2.locationBased || scope2Total,
    marketBased: emissionsData.scope2.marketBased || scope2Total,
    renewableImpact: (emissionsData.scope2.locationBased || 0) - (emissionsData.scope2.marketBased || 0),
    renewablePercentage: emissionsData.scope2.renewableImpact ? Math.abs(Math.round((emissionsData.scope2.renewableImpact / (emissionsData.scope2.locationBased || 1)) * 100)) : 0,
    eacs: 0, // MWh - would come from separate tracking
    gridEmissionFactor: emissionsData.scope2.gridEmissionFactor || 0.385 // kgCO2e/kWh
  } : {
    locationBased: 310.2,
    marketBased: 288.8,
    renewableImpact: -21.4,
    renewablePercentage: 35,
    eacs: 1250, // MWh
    gridEmissionFactor: 0.385 // kgCO2e/kWh
  };

  // Scope 3 categories (GRI 305-3) - use real data when available
  const scope3CategoriesRaw = emissionsData?.scope3?.categories || {};
  const scope3Categories = Object.entries(scope3CategoriesRaw).map(([catNum, catData]: [string, any]) => ({
    category: `Cat ${catNum}: ${catData.name}`,
    value: catData.emissions || 0,
    tracked: catData.tracked || false,
    upstream: parseInt(catNum) <= 8
  }));

  // If no data, use mock data
  const scope3CategoriesFinal = scope3Categories.length > 0 ? scope3Categories : [
    { category: 'Cat 1: Purchased Goods & Services', value: 85.2, tracked: true, upstream: true },
    { category: 'Cat 2: Capital Goods', value: 12.5, tracked: true, upstream: true },
    { category: 'Cat 3: Fuel & Energy Activities', value: 0, tracked: false, upstream: true },
    { category: 'Cat 4: Upstream Transportation', value: 0, tracked: false, upstream: true },
    { category: 'Cat 5: Waste Generated', value: 0, tracked: false, upstream: true },
    { category: 'Cat 6: Business Travel', value: 81.3, tracked: true, upstream: true },
    { category: 'Cat 7: Employee Commuting', value: 0, tracked: false, upstream: true },
    { category: 'Cat 8: Upstream Leased Assets', value: 0, tracked: false, upstream: true },
    { category: 'Cat 9: Downstream Transportation', value: 0, tracked: false, upstream: false },
    { category: 'Cat 10: Processing of Sold Products', value: 0, tracked: false, upstream: false },
    { category: 'Cat 11: Use of Sold Products', value: 0, tracked: false, upstream: false },
    { category: 'Cat 12: End-of-Life Treatment', value: 0, tracked: false, upstream: false },
    { category: 'Cat 13: Downstream Leased Assets', value: 0, tracked: false, upstream: false },
    { category: 'Cat 14: Franchises', value: 0, tracked: false, upstream: false },
    { category: 'Cat 15: Investments', value: 0, tracked: false, upstream: false }
  ];

  const scope3Coverage = emissionsData?.scope3?.coverage ? {
    tracked: Math.round((emissionsData.scope3.coverage / 100) * 15),
    total: 15,
    percentage: emissionsData.scope3.coverage
  } : {
    tracked: scope3CategoriesFinal.filter(c => c.tracked).length,
    total: 15,
    percentage: (scope3CategoriesFinal.filter(c => c.tracked).length / 15) * 100
  };

  // Intensity metrics (GRI 305-4) - use real data when available
  const intensityMetrics = emissionsData?.intensityMetrics ? [
    {
      name: 'Per Employee',
      value: emissionsData.intensityMetrics.perEmployee || 0,
      unit: 'tCO2e/FTE',
      yoyChange: 0,
      icon: Leaf
    },
    {
      name: 'Per Revenue',
      value: emissionsData.intensityMetrics.perRevenue || 0,
      unit: 'tCO2e/M€',
      yoyChange: 0,
      icon: Target
    },
    {
      name: 'Per Square Meter',
      value: emissionsData.intensityMetrics.perSqm || 0,
      unit: 'kgCO2e/m²',
      yoyChange: 0,
      icon: Factory
    }
  ] : [
    { name: 'Per Employee', value: 2.85, unit: 'tCO2e/FTE', yoyChange: -15, icon: Leaf },
    { name: 'Per Revenue', value: 0.12, unit: 'tCO2e/€', yoyChange: -18, icon: Target },
    { name: 'Per Square Meter', value: 0.024, unit: 'tCO2e/m²', yoyChange: -10, icon: Factory }
  ];

  // Geographic breakdown - use real data when available
  const geographicBreakdownRaw = emissionsData?.geographic || [];
  const geographicBreakdown = geographicBreakdownRaw.length > 0 ? geographicBreakdownRaw.map((item: any, idx: number) => {
    const colors = ['#3B82F6', '#8B5CF6', '#F97316', '#10B981', '#6B7280'];
    return {
      location: item.location,
      value: item.emissions || 0,
      percentage: Math.round(((item.emissions || 0) / (totalEmissions || 1)) * 100),
      color: colors[idx % colors.length]
    };
  }) : [
    { location: 'Portugal', value: 465.2, percentage: 86, color: '#3B82F6' },
    { location: 'Spain', value: 52.1, percentage: 10, color: '#8B5CF6' },
    { location: 'Other', value: 25.6, percentage: 4, color: '#6B7280' }
  ];

  // Facility breakdown - mock for now as not in API
  const facilityBreakdown = [
    { name: 'HQ Lisbon', value: 380.5 },
    { name: 'Office Porto', value: 84.7 },
    { name: 'Remote Work', value: 77.7 }
  ];

  // Multi-year trend data (TCFD, ESRS E1) - use real data when available
  const multiYearTrendsRaw = emissionsData?.multiYearTrends || {};
  const multiYearTrends = Object.keys(multiYearTrendsRaw).length > 0
    ? Object.entries(multiYearTrendsRaw)
        .map(([year, data]: [string, any]) => ({
          year,
          scope1: data.scope1 || 0,
          scope2: data.scope2 || 0,
          scope3: data.scope3 || 0,
          total: data.total || 0,
          projected: parseInt(year) === new Date().getFullYear()
        }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year))
    : [
      { year: '2020', scope1: 85.2, scope2: 380.5, scope3: 210.3, total: 676.0 },
      { year: '2021', scope1: 82.1, scope2: 365.2, scope3: 198.5, total: 645.8 },
      { year: '2022', scope1: 78.5, scope2: 340.1, scope3: 185.2, total: 603.8 },
      { year: '2023', scope1: 76.2, scope2: 325.4, scope3: 213.7, total: 615.3 },
      { year: '2024', scope1: 74.8, scope2: 305.2, scope3: 195.5, total: 575.5 },
      { year: '2025', scope1: 75.1, scope2: 288.8, scope3: 179.0, total: 542.9, projected: true }
    ];

  // Reductions breakdown (GRI 305-5)
  const reductionsData = [
    { initiative: 'Energy Efficiency', reduction: 35.2, color: '#10B981' },
    { initiative: 'Renewable Energy', reduction: 28.6, color: '#3B82F6' },
    { initiative: 'Process Improvements', reduction: 8.6, color: '#8B5CF6' }
  ];

  const totalReductions = reductionsData.reduce((sum, r) => sum + r.reduction, 0);

  // Data quality metrics - use real data when available
  const dataQuality = emissionsData?.dataQuality ? {
    primaryData: Math.round((emissionsData.dataQuality.measured / (emissionsData.dataQuality.totalRecords || 1)) * 100),
    secondaryData: Math.round((emissionsData.dataQuality.estimated / (emissionsData.dataQuality.totalRecords || 1)) * 100),
    verified: Math.round((emissionsData.dataQuality.verified / (emissionsData.dataQuality.totalRecords || 1)) * 100),
    estimated: Math.round((emissionsData.dataQuality.estimated / (emissionsData.dataQuality.totalRecords || 1)) * 100),
    uncertainty: Math.max(0, 100 - emissionsData.dataQuality.qualityScore).toFixed(1)
  } : {
    primaryData: 85,
    secondaryData: 15,
    verified: 92,
    estimated: 8,
    uncertainty: 5.2
  };

  // Other emissions (GRI 305-6, 305-7)
  const otherEmissions = {
    biogenicCO2: 0,
    odsKg: 0.02,
    noxTonnes: 0.15,
    soxTonnes: 0.02
  };

  // Fetch emissions data from API
  useEffect(() => {
    const fetchEmissionsData = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams({
          start_date: selectedPeriod.start,
          end_date: selectedPeriod.end
        });

        if (selectedSite?.id) {
          params.append('site_id', selectedSite.id);
        }

        const response = await fetch(`/api/sustainability/emissions-detailed?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch emissions data');
        }

        const data = await response.json();
        console.log('📊 Emissions detailed data:', data);

        setEmissionsData(data);

        // Update summary metrics
        if (data.summary) {
          setTotalEmissions(data.summary.total || 0);
          setScope1Total(data.summary.scope1 || 0);
          setScope2Total(data.summary.scope2 || 0);
          setScope3Total(data.summary.scope3 || 0);
          setTotalEmissionsYoY(data.summary.trend || 0);
          // YoY for individual scopes would come from comparison logic
          setScope1YoY(0);
          setScope2YoY(0);
          setScope3YoY(0);
        }

      } catch (error) {
        console.error('Error fetching emissions data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) {
      fetchEmissionsData();
    }
  }, [organizationId, selectedSite, selectedPeriod]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto" />
          <p className="text-gray-400">Loading emissions data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cloud className="w-6 h-6 text-blue-500" />
            GHG Emissions Reporting
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            GHG Protocol • GRI 305 • ESRS E1 • TCFD • SBTi • Comprehensive emissions disclosure
          </p>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="p-6 grid grid-cols-4 gap-4">
        {/* Total Emissions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Emissions</span>
            <Cloud className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalEmissions.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            <div className="flex items-center gap-1">
              {totalEmissionsYoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${totalEmissionsYoY < 0 ? 'text-green-500' : totalEmissionsYoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {totalEmissionsYoY > 0 ? '+' : ''}{totalEmissionsYoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </div>

        {/* Scope 1 */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Scope 1 Direct</span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {scope1Total.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            <div className="flex items-center gap-1">
              {scope1YoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${scope1YoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${scope1YoY < 0 ? 'text-green-500' : scope1YoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {scope1YoY > 0 ? '+' : ''}{scope1YoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </div>

        {/* Scope 2 */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Scope 2 Indirect</span>
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {scope2Total.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            <div className="flex items-center gap-1">
              {scope2YoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${scope2YoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${scope2YoY < 0 ? 'text-green-500' : scope2YoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {scope2YoY > 0 ? '+' : ''}{scope2YoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </div>

        {/* Scope 3 */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Scope 3 Value Chain</span>
            <Recycle className="w-4 h-4 text-gray-500" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {scope3Total.toFixed(1)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">tCO2e</div>
            </div>
            <div className="flex items-center gap-1">
              {scope3YoY < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingUp className={`w-3 h-3 ${scope3YoY > 0 ? 'text-red-500' : 'text-gray-400'}`} />
              )}
              <span className={`text-xs ${scope3YoY < 0 ? 'text-green-500' : scope3YoY > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {scope3YoY > 0 ? '+' : ''}{scope3YoY.toFixed(1)}% YoY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scope 1 Breakdown & Scope 2 Dual Reporting */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Scope 1 Breakdown by Gas Type (GRI 305-1) */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scope 1: By Gas Type</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-1
              </span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center mb-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={gasTypeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={true}
                >
                  {gasTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)} tCO2e`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">By Source:</div>
            {scope1Sources.map((source, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <source.icon className="w-4 h-4" style={{ color: source.color }} />
                  <span className="text-sm text-gray-900 dark:text-white">{source.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {source.value.toFixed(1)} tCO2e
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scope 2 Dual Reporting (GRI 305-2) */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scope 2: Dual Reporting</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-2
              </span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Location-Based */}
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Location-Based Method</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {scope2Data.locationBased.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Using regional grid average emission factors
              </div>
            </div>

            {/* Market-Based */}
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Market-Based Method</span>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {scope2Data.marketBased.toFixed(1)} tCO2e
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Reflecting contractual instruments (EACs)
              </div>
            </div>

            {/* Renewable Impact */}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Renewable Impact</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {scope2Data.renewableImpact.toFixed(1)} tCO2e
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Renewable %</div>
                  <div className="font-semibold text-green-600 dark:text-green-400">
                    {scope2Data.renewablePercentage}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">EACs/RECs</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {scope2Data.eacs.toLocaleString()} MWh
                  </div>
                </div>
                <div>
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Grid Factor</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {scope2Data.gridEmissionFactor} kg/kWh
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scope 3 Category Coverage */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Scope 3: Category Coverage</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {scope3Coverage.tracked}/15 categories tracked ({scope3Coverage.percentage.toFixed(0)}% coverage)
              </p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-3
              </span>
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Upstream */}
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                Upstream Categories
                <span className="text-xs text-gray-500">(8 categories)</span>
              </div>
              <div className="space-y-2">
                {scope3CategoriesFinal.filter(c => c.upstream).map((cat, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {cat.tracked ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-orange-400" />
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">{cat.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {cat.tracked ? `${cat.value.toFixed(1)} tCO2e` : 'Not tracked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Downstream */}
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                Downstream Categories
                <span className="text-xs text-gray-500">(7 categories)</span>
              </div>
              <div className="space-y-2">
                {scope3CategoriesFinal.filter(c => !c.upstream).map((cat, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {cat.tracked ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-orange-400" />
                      )}
                      <span className="text-sm text-gray-900 dark:text-white">{cat.category}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {cat.tracked ? `${cat.value.toFixed(1)} tCO2e` : 'Not tracked'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {scope3Coverage.percentage < 80 && (
            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Scope 3 Materiality Assessment Recommended</span>
              </div>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                GRI 305-3 requires reporting on all material categories. Consider conducting a materiality assessment for untracted categories.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Intensity Metrics & Geographic Breakdown */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Intensity Metrics (GRI 305-4) */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Intensity Metrics</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-4
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {intensityMetrics.map((metric, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <metric.icon className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {metric.yoyChange < 0 ? (
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingUp className="w-3 h-3 text-red-500" />
                    )}
                    <span className={`text-xs ${metric.yoyChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {metric.yoyChange > 0 ? '+' : ''}{metric.yoyChange}% YoY
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {metric.value.toFixed(metric.name.includes('Revenue') ? 2 : 3)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {metric.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic & Facility Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[420px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Geographic Distribution</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">By Geography</div>
            <div className="space-y-2">
              {geographicBreakdown.map((geo, index) => (
                <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{geo.location}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {geo.value.toFixed(1)} tCO2e
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${geo.percentage}%`, backgroundColor: geo.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {geo.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white mb-3">By Facility</div>
            <div className="space-y-2">
              {facilityBreakdown.map((facility, index) => (
                <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-purple-500" />
                    <span className="text-sm text-gray-900 dark:text-white">{facility.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {facility.value.toFixed(1)} tCO2e
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Year Trends (TCFD, ESRS E1) */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Multi-Year Emissions Trends</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Base Year: 2023 (615.3 tCO2e) • Current: 2025 (542.9 tCO2e) • Change: -72.4 tCO2e (-12%)
              </p>
            </div>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded">
                TCFD
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={multiYearTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis
                dataKey="year"
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
              />
              <YAxis
                stroke="#9CA3AF"
                style={{ fontSize: '10px' }}
                label={{ value: 'tCO2e', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: '10px' } }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Line
                type="monotone"
                dataKey="scope1"
                stroke="#EF4444"
                strokeWidth={2}
                name="Scope 1"
                dot={{ r: 3 }}
                strokeDasharray={multiYearTrends[multiYearTrends.length - 1].projected ? "5 5" : "0"}
              />
              <Line
                type="monotone"
                dataKey="scope2"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Scope 2"
                dot={{ r: 3 }}
                strokeDasharray={multiYearTrends[multiYearTrends.length - 1].projected ? "5 5" : "0"}
              />
              <Line
                type="monotone"
                dataKey="scope3"
                stroke="#6B7280"
                strokeWidth={2}
                name="Scope 3"
                dot={{ r: 3 }}
                strokeDasharray={multiYearTrends[multiYearTrends.length - 1].projected ? "5 5" : "0"}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8B5CF6"
                strokeWidth={2.5}
                name="Total"
                dot={{ r: 4, fill: "#8B5CF6" }}
                strokeDasharray={multiYearTrends[multiYearTrends.length - 1].projected ? "5 5" : "0"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Reductions & Data Quality */}
      <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reductions & Removals (GRI 305-5) */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reductions & Removals</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-5
              </span>
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded">
                ESRS E1
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Reductions from Baseline</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalReductions.toFixed(1)} tCO2e
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {reductionsData.map((reduction, index) => (
              <div key={index} className="bg-white dark:bg-gray-800/50 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-900 dark:text-white">{reduction.initiative}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {reduction.reduction.toFixed(1)} tCO2e
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${(reduction.reduction / totalReductions) * 100}%`,
                      backgroundColor: reduction.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-2">
              <div className="text-gray-500 dark:text-gray-400 text-xs">Carbon Removals</div>
              <div className="font-semibold text-gray-900 dark:text-white">0 tCO2e</div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-2">
              <div className="text-gray-500 dark:text-gray-400 text-xs">Credits Retired</div>
              <div className="font-semibold text-gray-900 dark:text-white">0 tCO2e</div>
            </div>
          </div>
        </div>

        {/* Data Quality & Uncertainty */}
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4 h-[320px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Data Quality & Uncertainty</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded">
                GHG Protocol
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Primary Data</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {dataQuality.primaryData}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${dataQuality.primaryData}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Secondary Data</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {dataQuality.secondaryData}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${dataQuality.secondaryData}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Verified</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {dataQuality.verified}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${dataQuality.verified}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Estimated</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {dataQuality.estimated}%
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${dataQuality.estimated}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-300">Uncertainty Level</span>
              <span className="text-lg font-bold text-blue-900 dark:text-blue-300">
                ±{dataQuality.uncertainty}%
              </span>
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400">
              Calculation methodologies: Distance-based, Spend-based, Supplier-specific
            </div>
          </div>
        </div>
      </div>

      {/* Other Emissions (GRI 305-6, 305-7) */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Biogenic CO₂ & Other Emissions</h3>
            <div className="flex gap-1 flex-wrap justify-end">
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-6
              </span>
              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                GRI 305-7
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Biogenic CO₂</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {otherEmissions.biogenicCO2} tCO₂
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">ODS (CFC-11 eq)</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {otherEmissions.odsKg} kg
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">NOₓ</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {otherEmissions.noxTonnes} tonnes
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800/50 rounded-lg p-3">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">SOₓ</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white">
                {otherEmissions.soxTonnes} tonnes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="px-6 pb-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Export Reporting Templates</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Download pre-filled templates for major sustainability frameworks
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                GHG Protocol
              </button>
              <button className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                GRI Report
              </button>
              <button className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                ESRS Format
              </button>
              <button className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                TCFD Disclosure
              </button>
              <button className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                <Download className="w-4 h-4" />
                CDP Response
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
