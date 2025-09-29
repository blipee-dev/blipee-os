'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Zap,
  Droplets,
  Recycle,
  Building2,
  MapPin,
  Wrench,
  Users,
  Bot,
  TrendingUp,
  Target,
  DollarSign,
  ClipboardCheck,
  BarChart3,
  Settings,
  Calendar,
  Download,
  Share2,
  Search,
  Zap as Optimize
} from 'lucide-react';

interface NavigationMatrixProps {
  onAction: (action: string, params?: any) => void;
  context?: any;
}

export const NavigationMatrix: React.FC<NavigationMatrixProps> = ({
  onAction,
  context,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([]);

  // Extract real data from context
  const metricsData = context?.metricsData;
  const processedMetrics = metricsData?.metrics;
  const orgData = context?.organizationData;

  // Format values with units
  const formatValue = (value: number, unit: string) => {
    if (!value || isNaN(value)) return `0 ${unit}`;
    if (unit === 'tCO2e') return `${value.toFixed(1)} ${unit}`;
    if (unit === 'MWh') return `${value.toFixed(1)} ${unit}`;
    if (unit === 'm³') return `${Math.round(value)} ${unit}`;
    if (unit === 'tons') return `${value.toFixed(1)} ${unit}`;
    return `${value} ${unit}`;
  };

  const mainCategories = [
    {
      id: 'emissions',
      icon: <Globe className="w-8 h-8" />,
      label: 'Emissions',
      value: processedMetrics?.emissions ? formatValue(processedMetrics.emissions.total, 'tCO2e') : '0 tCO2e'
    },
    {
      id: 'energy',
      icon: <Zap className="w-8 h-8" />,
      label: 'Energy',
      value: processedMetrics?.energy ? formatValue(processedMetrics.energy.total, 'MWh') : '0 MWh'
    },
    {
      id: 'water',
      icon: <Droplets className="w-8 h-8" />,
      label: 'Water',
      value: processedMetrics?.water ? formatValue(processedMetrics.water.total, 'm³') : '0 m³'
    },
    {
      id: 'waste',
      icon: <Recycle className="w-8 h-8" />,
      label: 'Waste',
      value: processedMetrics?.waste ? formatValue(processedMetrics.waste.total, 'tons') : '0 tons'
    },
    {
      id: 'buildings',
      icon: <Building2 className="w-8 h-8" />,
      label: 'Sites',
      value: orgData?.sitesCount ? `${orgData.sitesCount} Sites` : '0 Sites'
    },
    {
      id: 'zones',
      icon: <MapPin className="w-8 h-8" />,
      label: 'Zones',
      value: orgData?.sitesCount ? `${orgData.sitesCount} Areas` : '0 Areas'
    },
    {
      id: 'devices',
      icon: <Wrench className="w-8 h-8" />,
      label: 'Devices',
      value: orgData?.devicesCount ? `${orgData.devicesCount}` : '0'
    },
    {
      id: 'team',
      icon: <Users className="w-8 h-8" />,
      label: 'Team',
      value: orgData?.teamCount ? `${orgData.teamCount} Members` : '0 Members'
    },
    {
      id: 'ai',
      icon: <Bot className="w-8 h-8" />,
      label: 'AI Insights',
      value: metricsData?.raw?.length > 0 ? `${metricsData.raw.length} insights` : 'No data'
    },
    {
      id: 'trends',
      icon: <TrendingUp className="w-8 h-8" />,
      label: 'Trends',
      value: processedMetrics?.emissions?.trend ? `${processedMetrics.emissions.trend > 0 ? '↑' : '↓'} ${Math.abs(processedMetrics.emissions.trend)}%` : '→ 0%'
    },
    {
      id: 'goals',
      icon: <Target className="w-8 h-8" />,
      label: 'Goals',
      value: processedMetrics?.emissions?.trend < 0 ? `${Math.abs(processedMetrics.emissions.trend)}% reduction` : 'Set targets'
    },
    {
      id: 'costs',
      icon: <DollarSign className="w-8 h-8" />,
      label: 'Costs',
      value: metricsData?.raw?.length > 0 ? 'Analysis ready' : 'No data'
    },
    {
      id: 'compliance',
      icon: <ClipboardCheck className="w-8 h-8" />,
      label: 'Compliance',
      value: orgData?.alertsCount === 0 ? '✅' : `${orgData?.alertsCount || 0} alerts`
    },
    {
      id: 'reports',
      icon: <BarChart3 className="w-8 h-8" />,
      label: 'Reports',
      value: metricsData?.raw?.length > 0 ? 'Available' : 'No data'
    },
    { id: 'settings', icon: <Settings className="w-8 h-8" />, label: 'Settings', value: '' },
  ];

  // Calculate scope breakdowns from real data (approximate distribution)
  const totalEmissions = processedMetrics?.emissions?.total || 0;
  const scope1 = totalEmissions * 0.3; // Approximate 30% scope 1
  const scope2 = totalEmissions * 0.25; // Approximate 25% scope 2
  const scope3 = totalEmissions * 0.45; // Approximate 45% scope 3

  const totalEnergy = processedMetrics?.energy?.total || 0;
  const totalWater = processedMetrics?.water?.total || 0;

  const subCategories: Record<string, any[]> = {
    emissions: [
      { label: 'Scope 1', value: scope1 > 0 ? formatValue(scope1, 'tCO2e') : 'No data', action: 'emissions/scope1' },
      { label: 'Scope 2', value: scope2 > 0 ? formatValue(scope2, 'tCO2e') : 'No data', action: 'emissions/scope2' },
      { label: 'Scope 3', value: scope3 > 0 ? formatValue(scope3, 'tCO2e') : 'No data', action: 'emissions/scope3' },
      { label: 'By Building', action: 'emissions/building' },
      { label: 'By Source', action: 'emissions/source' },
      { label: 'Trends', action: 'emissions/trends' },
      { label: 'Reduction Plan', action: 'emissions/reduction' },
      { label: 'Carbon Offsets', action: 'emissions/offsets' },
    ],
    energy: [
      { label: 'Real-time Usage', value: totalEnergy > 0 ? 'Monitoring' : 'No data', action: 'energy/realtime' },
      { label: 'Total Consumption', value: totalEnergy > 0 ? formatValue(totalEnergy, 'MWh') : 'No data', action: 'energy/total' },
      { label: 'Renewable %', value: totalEnergy > 0 ? 'Calculating' : 'No data', action: 'energy/renewable' },
      { label: 'Grid Mix', action: 'energy/grid' },
      { label: 'Optimization', action: 'energy/optimize' },
      { label: 'Forecast', action: 'energy/forecast' },
      { label: 'Benchmarks', action: 'energy/benchmarks' },
      { label: 'Analysis', action: 'energy/analysis' },
    ],
    water: [
      { label: 'Consumption', value: totalWater > 0 ? formatValue(totalWater, 'm³') : 'No data', action: 'water/consumption' },
      { label: 'Quality', value: totalWater > 0 ? 'Analyzing' : 'No data', action: 'water/quality' },
      { label: 'Efficiency', action: 'water/efficiency' },
      { label: 'Leaks', value: totalWater > 0 ? 'Checking' : 'No data', action: 'water/leaks' },
      { label: 'Rainwater', action: 'water/rainwater' },
      { label: 'Conservation', action: 'water/conservation' },
    ],
    buildings: orgData?.sites ? [
      ...orgData.sites.map((site: any) => ({
        label: site.name,
        value: site.city || 'Location',
        action: `buildings/${site.id}`
      })),
      { label: 'Compare All', action: 'buildings/compare' },
      { label: 'Rankings', action: 'buildings/rankings' },
      { label: 'Add New', action: 'buildings/add' },
    ] : [
      { label: 'No sites', value: 'Add sites', action: 'buildings/add' },
    ],
  };

  const timeFilters = [
    { label: 'Now', action: 'filter/now' },
    { label: 'Today', action: 'filter/today' },
    { label: 'Yesterday', action: 'filter/yesterday' },
    { label: 'This Week', action: 'filter/week' },
    { label: 'Last Week', action: 'filter/lastweek' },
    { label: 'This Month', action: 'filter/month' },
    { label: 'Last Month', action: 'filter/lastmonth' },
    { label: 'This Quarter', action: 'filter/quarter' },
    { label: 'This Year', action: 'filter/year' },
    { label: 'Custom Range', action: 'filter/custom' },
  ];

  const comparisons = [
    { label: 'vs Yesterday', action: 'compare/yesterday' },
    { label: 'vs Last Week', action: 'compare/week' },
    { label: 'vs Last Month', action: 'compare/month' },
    { label: 'vs Last Year', action: 'compare/year' },
    { label: 'vs Target', action: 'compare/target' },
    { label: 'vs Industry', action: 'compare/industry' },
    { label: 'vs Best Day', action: 'compare/best' },
    { label: 'Buildings', action: 'compare/buildings' },
  ];

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setBreadcrumbs([categoryId]);
  };

  const handleSubAction = (action: string) => {
    onAction(action);
    // Keep the navigation open for further exploration
  };

  const clearSelection = () => {
    setSelectedCategory(null);
    setBreadcrumbs([]);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
          <button
            onClick={clearSelection}
            className="hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Home
          </button>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <span>/</span>
              <span className="text-gray-900 dark:text-white capitalize">{crumb}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Main Navigation Grid */}
      {!selectedCategory ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Complete Navigation Matrix
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {mainCategories.map((cat, index) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleCategoryClick(cat.id)}
                className="p-4 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all group"
              >
                <div className="text-gray-600 dark:text-white/60 mb-2">{cat.icon}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {cat.label}
                </div>
                {cat.value && (
                  <div className="text-xs text-gray-600 dark:text-white/60 mt-1">
                    {cat.value}
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Time Filters */}
          <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Time Period
            </h3>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {timeFilters.map((filter) => (
                <button
                  key={filter.action}
                  onClick={() => onAction(filter.action)}
                  className="px-3 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all text-sm border border-gray-200 dark:border-transparent"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comparisons */}
          <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Compare
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {comparisons.map((comp) => (
                <button
                  key={comp.action}
                  onClick={() => onAction(comp.action)}
                  className="px-3 py-2 bg-white dark:bg-white/[0.05] hover:bg-gray-100 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white rounded-lg transition-all text-sm border border-gray-200 dark:border-transparent"
                >
                  {comp.label}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Sub-category view */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {selectedCategory} Details
            </h2>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-700 dark:text-white rounded-lg transition-all"
            >
              ← Back
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subCategories[selectedCategory]?.map((sub, index) => (
              <motion.button
                key={sub.action}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSubAction(sub.action)}
                className="p-4 bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all text-left"
              >
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {sub.label}
                </div>
                {sub.value && (
                  <div className="text-xl font-bold text-gray-800 dark:text-white/90">
                    {sub.value}
                  </div>
                )}
                <div className="text-xs text-gray-500 dark:text-white/40 mt-2">
                  Click to explore →
                </div>
              </motion.button>
            ))}
          </div>

          {/* Context-specific actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <button
              onClick={() => onAction(`${selectedCategory}/export`)}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => onAction(`${selectedCategory}/share`)}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => onAction(`${selectedCategory}/analyze`)}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Analyze
            </button>
            <button
              onClick={() => onAction(`${selectedCategory}/optimize`)}
              className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              <Optimize className="w-4 h-4" />
              Optimize
            </button>
          </div>
        </div>
      )}
    </div>
  );
};