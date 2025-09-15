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
  ResponsiveContainer
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
  const [dateRange, setDateRange] = useState('all'); // Changed to show all data by default
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

    const getTrendColor = () => {
      // For emissions and waste, down is good
      const isEmissionsOrWaste = title === t('metrics.totalEmissions') || 
                                 title === t('metrics.wasteGenerated') ||
                                 title === t('metrics.carbonIntensity');
      
      if (isEmissionsOrWaste) {
        return trend === 'down' ? 'text-green-500' : trend === 'up' ? 'text-red-500' : 'text-gray-500';
      }
      // For other metrics, context matters
      return trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
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
              <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span className="text-sm font-medium">{Math.abs(change)}%</span>
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={scopeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {scopeBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
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
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                  <XAxis dataKey="month" stroke="#999" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="emissions"
                    stroke="var(--accent-primary)"
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={scopeBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopeBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
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
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="month" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="emissions"
                  stroke="var(--accent-primary)"
                  fill="url(#colorEmissions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Site Comparison */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('charts.siteComparison')}
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={siteComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.1)" />
                <XAxis dataKey="site" stroke="#999" style={{ fontSize: '12px' }} />
                <YAxis stroke="#999" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="emissions" fill="var(--accent-primary)" />
                <Bar dataKey="energy" fill="var(--accent-secondary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category Heatmap */}
          <div className="bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('charts.emissionsByCategory')}
            </h3>
            <div className="space-y-3">
              {categoryHeatmap.map((category: any, index: number) => {
                const total = (category.scope1 || 0) + (category.scope2 || 0) + (category.scope3 || 0);
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {category.category}
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {total.toFixed(1)} {t('units.tco2e')}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="h-2 rounded"
                        style={{
                          backgroundColor: 'var(--accent-primary)',
                          width: `${(category.scope1 / total) * 100}%`
                        }}
                        title={`Scope 1: ${category.scope1}`}
                      />
                      <div
                        className="h-2 rounded"
                        style={{
                          backgroundColor: 'var(--accent-secondary)',
                          width: `${(category.scope2 / total) * 100}%`
                        }}
                        title={`Scope 2: ${category.scope2}`}
                      />
                      <div
                        className="h-2 rounded"
                        style={{
                          backgroundColor: 'rgba(var(--accent-primary-rgb), 0.5)',
                          width: `${(category.scope3 / total) * 100}%`
                        }}
                        title={`Scope 3: ${category.scope3}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
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
              <option value="2024">{t('dateRanges.year2024')}</option>
              <option value="2023">{t('dateRanges.year2023')}</option>
              <option value="2022">{t('dateRanges.year2022')}</option>
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