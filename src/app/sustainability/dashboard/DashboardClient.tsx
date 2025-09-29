'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Droplets,
  Trash2,
  Download,
  Loader2,
  ArrowUp,
  ArrowDown,
  Minus,
  Zap,
  Factory
} from 'lucide-react';
import {
  RESOURCE_COLORS,
  TREND_COLORS,
  getTrendColor,
  SCOPE_COLORS,
  CHART_PALETTES,
  PERFORMANCE_COLORS
} from '@/lib/constants/sustainability-colors';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useTranslations } from '@/providers/LanguageProvider';

// Metric Card Component - moved inside main component to access translations

export default function SustainabilityDashboard() {
  // Check authentication
  useAuthRedirect('/sustainability/dashboard');
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('settings.sustainability.dashboard');

  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('2025'); // Default to current year
  const [selectedSite, setSelectedSite] = useState('all');
  const [selectedView, setSelectedView] = useState('overview');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (user && sites.length > 0) {
      fetchDashboardData();
    }
  }, [dateRange, selectedSite, user]);

  const fetchInitialData = async () => {
    console.log('📊 Dashboard: Starting initial data fetch');
    try {
      // Fetch sites
      console.log('📊 Dashboard: Fetching sites...');
      const sitesRes = await fetch('/api/sites');
      const sitesData = await sitesRes.json();
      console.log('📊 Dashboard: Sites received:', sitesData);
      setSites(sitesData.sites || []);

      // Then fetch dashboard data
      await fetchDashboardData();
    } catch (error) {
      console.error('📊 Dashboard: Error fetching initial data:', error);
      toast.error(t('messages.failedToLoadData'));
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    console.log('📊 Dashboard: Fetching dashboard data with params:', { dateRange, selectedSite });

    try {
      const url = `/api/sustainability/dashboard?range=${dateRange}&site=${selectedSite}`;
      console.log('📊 Dashboard: Calling API:', url);

      const res = await fetch(url);
      console.log('📊 Dashboard: API response status:', res.status);

      if (!res.ok) {
        const errorText = await res.text();
        console.error('📊 Dashboard: API error response:', errorText);
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await res.json();
      console.log('📊 Dashboard: Received data:', data);
      console.log('📊 Dashboard: Site comparison data:', data.siteComparison);
      console.log('📊 Dashboard: Year-over-Year data:', data.yearOverYearComparison);

      // Ensure data has the expected structure
      if (data && data.metrics) {
        setDashboardData(data);
      } else {
        // Set default empty data structure if no data
        setDashboardData({
          metrics: {
            totalEmissions: { value: 0, unit: t('units.tco2e'), change: 0, trend: 'stable' },
            energyConsumption: { value: 0, unit: t('units.mwh'), change: 0, trend: 'stable' },
            waterUsage: { value: 0, unit: t('units.m3'), change: 0, trend: 'stable' },
            wasteGenerated: { value: 0, unit: t('units.tons'), change: 0, trend: 'stable' },
            carbonIntensity: { value: 0, unit: t('units.kgCO2ePerM2'), change: 0, trend: 'stable' }
          },
          scopeBreakdown: [],
          trendData: [],
          siteComparison: [],
          categoryHeatmap: []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty state on error
      setDashboardData({
        metrics: {
          totalEmissions: { value: 0, unit: 'tCO2e', change: 0, trend: 'stable' },
          energyConsumption: { value: 0, unit: 'MWh', change: 0, trend: 'stable' },
          waterUsage: { value: 0, unit: 'm³', change: 0, trend: 'stable' },
          wasteGenerated: { value: 0, unit: 'tons', change: 0, trend: 'stable' },
          carbonIntensity: { value: 0, unit: 'kgCO2e/m²', change: 0, trend: 'stable' }
        },
        scopeBreakdown: [],
        trendData: [],
        siteComparison: [],
        categoryHeatmap: []
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = (format: 'pdf' | 'csv') => {
    toast.success(t('messages.exportingData').replace('{format}', format.toUpperCase()));
    // Implement export functionality
  };

  // Metric Card Component
  const MetricCard = ({
    title,
    value,
    unit,
    change,
    icon: Icon,
    trend,
    onClick
  }: any) => {
    const getTrendIcon = () => {
      if (trend === 'up') return <ArrowUp className="w-4 h-4" />;
      if (trend === 'down') return <ArrowDown className="w-4 h-4" />;
      return <Minus className="w-4 h-4" />;
    };

    const getMetricType = () => {
      if (title === t('metrics.totalEmissions') || title === t('metrics.carbonIntensity')) return 'emissions';
      if (title === t('metrics.energyConsumption')) return 'energy';
      if (title === t('metrics.waterUsage')) return 'water';
      if (title === t('metrics.wasteGenerated')) return 'waste';
      return 'emissions';
    };

    const getTrendColorClass = () => {
      const color = getTrendColor(trend, getMetricType());
      // Convert hex to Tailwind class
      if (color === TREND_COLORS.decreasing || color === TREND_COLORS.improving) return 'text-green-500';
      if (color === TREND_COLORS.increasing || color === TREND_COLORS.declining) return 'text-red-500';
      return 'text-gray-500';
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6 cursor-pointer hover:shadow-lg transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {value}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">{unit}</span>
            </div>
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 ${getTrendColorClass()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">
                  {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{t('vsLastPeriod')}</span>
              </div>
            )}
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-[rgba(var(--accent-primary-rgb),0.1)] to-[rgba(var(--accent-secondary-rgb),0.1)]">
            <Icon className="w-6 h-6 accent-text" />
          </div>
        </div>
      </motion.div>
    );
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#212121] p-3 rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.1]">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value} {entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const siteOptions = [
    { value: 'all', label: t('buttons.allSites') },
    ...sites.map(site => ({ value: site.id, label: site.name }))
  ];

  if (loading) {
    return (
      <SustainabilityLayout selectedView={selectedView} onSelectView={setSelectedView}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin accent-text" />
        </div>
      </SustainabilityLayout>
    );
  }

  const renderContent = () => {
    if (!dashboardData) return null;

    // Debug year-over-year data
    console.log('📊 Dashboard rendering with YoY data:', {
      hasData: !!dashboardData?.yearOverYearComparison,
      currentYear: dashboardData?.yearOverYearComparison?.currentYear,
      dataLength: dashboardData?.yearOverYearComparison?.data?.length
    });

    const { metrics, scopeBreakdown, trendData, siteComparison, categoryHeatmap } = dashboardData;

    // Different views based on selectedView
    if (selectedView === 'emissions') {
      return (
        <>
          {/* Emissions Focus View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Total Emissions Card - Larger */}
            <div className="lg:col-span-2">
              <MetricCard
                title="Total CO₂ Emissions"
                value={metrics.totalEmissions.value}
                unit={metrics.totalEmissions.unit}
                change={metrics.totalEmissions.change}
                icon={Factory}
                trend={metrics.totalEmissions.trend}
              />
            </div>
          </div>

          {/* Emissions by Scope */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('charts.emissionsByScope')}
              </h3>
              <div style={{ pointerEvents: 'none' }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scopeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.percentage > 0 ? `${entry.name}: ${entry.percentage}%` : ''}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {scopeBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Emissions Trend */}
            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('charts.emissionsTrend')}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RESOURCE_COLORS.carbon} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={RESOURCE_COLORS.carbon} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                  <XAxis dataKey="month" stroke="#999" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    stroke={RESOURCE_COLORS.carbon}
                    fill="url(#colorEmissions)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      );
    }

    // Default Overview
    return (
      <>
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <MetricCard
            title={t('metrics.totalEmissions')}
            value={metrics.totalEmissions.value}
            unit={metrics.totalEmissions.unit}
            change={metrics.totalEmissions.change}
            icon={Factory}
            trend={metrics.totalEmissions.trend}
          />
          <MetricCard
            title={t('metrics.energyConsumption')}
            value={metrics.energyConsumption.value}
            unit={metrics.energyConsumption.unit}
            change={metrics.energyConsumption.change}
            icon={Zap}
            trend={metrics.energyConsumption.trend}
          />
          <MetricCard
            title={t('metrics.waterUsage')}
            value={metrics.waterUsage.value}
            unit={metrics.waterUsage.unit}
            change={metrics.waterUsage.change}
            icon={Droplets}
            trend={metrics.waterUsage.trend}
          />
          <MetricCard
            title={t('metrics.wasteGenerated')}
            value={metrics.wasteGenerated.value}
            unit={metrics.wasteGenerated.unit}
            change={metrics.wasteGenerated.change}
            icon={Trash2}
            trend={metrics.wasteGenerated.trend}
          />
          <MetricCard
            title={t('metrics.carbonIntensity')}
            value={metrics.carbonIntensity.value}
            unit={metrics.carbonIntensity.unit}
            change={metrics.carbonIntensity.change}
            icon={Activity}
            trend={metrics.carbonIntensity.trend}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emissions by Scope */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('charts.emissionsByScope')}
            </h3>
            <div style={{ pointerEvents: 'none' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scopeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.percentage > 0 ? `${entry.name}: ${entry.percentage}%` : ''}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopeBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Emissions Trend */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('charts.emissionsTrend')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={RESOURCE_COLORS.carbon} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={RESOURCE_COLORS.carbon} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="month" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="emissions"
                  stroke={RESOURCE_COLORS.carbon}
                  fill="url(#colorEmissions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Site Emissions Intensity */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Site Emissions Intensity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={(() => {
                  // Use the actual siteComparison data from the API
                  if (!siteComparison || siteComparison.length === 0) {
                    return [];
                  }

                  // If a specific site is selected, filter the data
                  if (selectedSite !== 'all') {
                    const site = sites.find(s => s.id === selectedSite);
                    if (!site) return [];

                    // Find matching data from siteComparison
                    const siteData = siteComparison.find((sc: any) =>
                      sc.site === site.name || sc.site.includes(site.name)
                    );

                    return siteData ? [{
                      site: siteData.site,
                      intensity: siteData.intensity || 0,
                      total: siteData.total || siteData.totalEmissions || 0,
                      performance: siteData.performance || 'warning'
                    }] : [];
                  }

                  // Show all sites from the API response
                  return siteComparison.map((site: any) => ({
                    site: site.site,
                    intensity: site.intensity || 0,
                    total: site.total || site.totalEmissions || 0,
                    performance: site.performance || 'warning'
                  }));
                })()}
                margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis
                  dataKey="site"
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'kgCO2e/m²', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const performanceColor =
                        data.performance === 'excellent' ? PERFORMANCE_COLORS.excellent :
                        data.performance === 'good' ? PERFORMANCE_COLORS.good :
                        data.performance === 'warning' ? PERFORMANCE_COLORS.warning :
                        PERFORMANCE_COLORS.poor;

                      return (
                        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
                          <p className="text-sm font-medium text-white mb-2">{label}</p>

                          <div className="inline-flex items-center px-2 py-1 rounded text-xs font-medium mb-2"
                            style={{ backgroundColor: `${performanceColor}20`, color: performanceColor }}>
                            Performance: {data.performance}
                          </div>

                          <div className="space-y-1">
                            <p className="text-xs flex justify-between">
                              <span className="text-gray-400">Intensity:</span>
                              <span className="text-white font-medium">{data.intensity} kgCO2e/m²</span>
                            </p>
                            <p className="text-xs flex justify-between">
                              <span className="text-gray-400">Total Emissions:</span>
                              <span className="text-white font-medium">{data.total?.toFixed(1)} tCO2e</span>
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="intensity"
                  radius={[8, 8, 0, 0]}
                  name="Emissions Intensity"
                  fill={RESOURCE_COLORS.carbon}
                  shape={(props: any) => {
                    // Custom bar shape with performance-based colors
                    const { x, y, width, height, payload } = props;
                    const perf = payload.performance || 'warning';
                    const fillColor = perf === 'excellent' ? PERFORMANCE_COLORS.excellent :
                                     perf === 'good' ? PERFORMANCE_COLORS.good :
                                     perf === 'warning' ? PERFORMANCE_COLORS.warning :
                                     PERFORMANCE_COLORS.poor;

                    return (
                      <path
                        d={`M${x},${y + 8}
                           Q${x},${y} ${x + 8},${y}
                           L${x + width - 8},${y}
                           Q${x + width},${y} ${x + width},${y + 8}
                           L${x + width},${y + height}
                           L${x},${y + height} Z`}
                        fill={fillColor}
                      />
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Carbon intensity per square meter (kgCO2e/m²) - {dateRange === 'all' ? 'All Time' : dateRange}
            </p>
          </div>

          {/* Emissions by Category */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('charts.emissionsByCategory')}
            </h3>
            <div className="space-y-3">
              {(() => {
                // Calculate max emissions to scale bars
                const maxEmissions = Math.max(...categoryHeatmap.map((cat: any) =>
                  (cat.scope1 || 0) + (cat.scope2 || 0) + (cat.scope3 || 0)
                ));

                // Sort categories by total emissions
                const sortedCategories = [...categoryHeatmap].sort((a: any, b: any) => {
                  const totalA = (a.scope1 || 0) + (a.scope2 || 0) + (a.scope3 || 0);
                  const totalB = (b.scope1 || 0) + (b.scope2 || 0) + (b.scope3 || 0);
                  return totalB - totalA;
                });

                return sortedCategories.map((category: any, index: number) => {
                  const total = (category.scope1 || 0) + (category.scope2 || 0) + (category.scope3 || 0);
                  const percentage = maxEmissions > 0 ? (total / maxEmissions) * 100 : 0;

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {category.category}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {total.toFixed(1)} {t('units.tco2e')}
                        </span>
                      </div>
                      <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                        <div
                          className="flex h-full"
                          style={{ width: `${percentage}%` }}
                        >
                          {category.scope1 > 0 && (
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                backgroundColor: SCOPE_COLORS.scope1,
                                width: `${(category.scope1 / total) * 100}%`
                              }}
                              title={`Scope 1: ${category.scope1.toFixed(1)} tCO2e`}
                            />
                          )}
                          {category.scope2 > 0 && (
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                backgroundColor: SCOPE_COLORS.scope2,
                                width: `${(category.scope2 / total) * 100}%`
                              }}
                              title={`Scope 2: ${category.scope2.toFixed(1)} tCO2e`}
                            />
                          )}
                          {category.scope3 > 0 && (
                            <div
                              className="h-full transition-all duration-500"
                              style={{
                                backgroundColor: SCOPE_COLORS.scope3,
                                width: `${(category.scope3 / total) * 100}%`
                              }}
                              title={`Scope 3: ${category.scope3.toFixed(1)} tCO2e`}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        {/* Monthly Breakdown and Year-over-Year Comparison - Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Monthly Emissions Breakdown */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Monthly Emissions - {dateRange === 'all' ? 'All Time' : dateRange}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={(() => {
                  // Create monthly data from trendData
                  if (!trendData || trendData.length === 0) return [];

                  // For 2025, show actual monthly data
                  if (dateRange === '2025') {
                    const monthlyData = [
                      { month: 'Jan', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Feb', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Mar', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Apr', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'May', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Jun', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Jul', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Aug', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Sep', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Oct', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Nov', emissions: 0, scope1: 0, scope2: 0, scope3: 0 },
                      { month: 'Dec', emissions: 0, scope1: 0, scope2: 0, scope3: 0 }
                    ];

                    // Use trend data to populate monthly values
                    trendData.forEach((data: any) => {
                      const monthIndex = monthlyData.findIndex(m => m.month === data.month);
                      if (monthIndex !== -1) {
                        monthlyData[monthIndex].emissions = data.emissions || 0;
                        // Add scope breakdown if available
                        monthlyData[monthIndex].scope2 = data.emissions * 0.55; // Estimate based on typical breakdown
                        monthlyData[monthIndex].scope3 = data.emissions * 0.45;
                      }
                    });

                    // Only return months with data
                    return monthlyData.filter(m => m.emissions > 0);
                  }

                  // For other ranges, use trendData directly
                  return trendData.map((data: any) => ({
                    month: data.month,
                    emissions: data.emissions || 0
                  }));
                })()}
                margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis
                  dataKey="month"
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#999"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'tCO2e', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
                          <p className="text-sm font-medium text-white mb-2">{label}</p>
                          <p className="text-xs text-white">
                            Total: {payload[0].value.toFixed(1)} tCO2e
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="emissions"
                  shape={(props: any) => {
                    const { x, y, width, height } = props;

                    return (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={RESOURCE_COLORS.carbon}
                          rx={4}
                          ry={4}
                        />
                      </g>
                    );
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Monthly breakdown showing total emissions per month. Data available through August 2025.
            </p>
          </div>

          {/* Year-over-Year Comparison Chart */}
          {dashboardData?.yearOverYearComparison && (
            <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                YoY Comparison ({dashboardData.yearOverYearComparison.currentYear} vs {dashboardData.yearOverYearComparison.previousYear})
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.yearOverYearComparison.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                  <XAxis
                    dataKey="month"
                    stroke="#999"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#999"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${value}%`}
                    domain={['dataMin - 10', 'dataMax + 10']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'change') {
                        const percent = value > 0 ? `+${value}%` : `${value}%`;
                        const color = value < 0 ? '#10b981' : value > 0 ? '#ef4444' : '#6b7280';
                        return <span style={{ color }}>{percent}</span>;
                      }
                      return value;
                    }}
                    content={(props) => {
                      const { active, payload } = props;
                      if (active && payload && payload[0]) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-[#1a1a1a] p-3 rounded-lg border border-white/[0.1]">
                            <p className="text-white font-semibold">{data.month}</p>
                            {data.hasData ? (
                              <>
                                <p className="text-sm text-gray-300 mt-1">
                                  {dashboardData.yearOverYearComparison.currentYear}: {data.currentEmissions.toFixed(1)} tCO2e
                                </p>
                                <p className="text-sm text-gray-300">
                                  {dashboardData.yearOverYearComparison.previousYear}: {data.previousEmissions.toFixed(1)} tCO2e
                                </p>
                                <p className="text-sm font-semibold mt-1" style={{
                                  color: data.change < 0 ? '#10b981' : data.change > 0 ? '#ef4444' : '#6b7280'
                                }}>
                                  {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}% YoY
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-gray-400 mt-1">No data</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={0} stroke="#999" strokeDasharray="3 3" />
                  <Bar
                    dataKey="change"
                    radius={[4, 4, 0, 0]}
                  >
                    {dashboardData.yearOverYearComparison.data.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.hasData ? (entry.change < 0 ? '#10b981' : entry.change > 0 ? '#ef4444' : '#6b7280') : 'transparent'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                Percentage change compared to the same month in the previous year. Green indicates reduction, red indicates increase.
              </p>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <SustainabilityLayout selectedView={selectedView} onSelectView={setSelectedView}>
      {/* Header */}
      <header className="bg-white dark:bg-[#212121] border-b border-gray-200 dark:border-white/[0.05] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t('subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 accent-ring cursor-pointer"
            >
              <option value="month">{t('dateRanges.thisMonth')}</option>
              <option value="quarter">{t('dateRanges.thisQuarter')}</option>
              <option value="year">{t('dateRanges.thisYear')}</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="all">{t('dateRanges.allTime')}</option>
            </select>

            {/* Site Selector */}
            <CustomDropdown
              value={selectedSite}
              onChange={setSelectedSite}
              options={siteOptions}
              placeholder={t('buttons.selectSite')}
            />

            {/* Export Button */}
            <button
              onClick={() => exportData('pdf')}
              className="px-4 py-2 flex items-center gap-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/[0.05] transition-all"
            >
              <Download className="w-4 h-4" />
              {t('buttons.export')}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-[#0a0a0a]">
        {renderContent()}
      </main>
    </SustainabilityLayout>
  );
}