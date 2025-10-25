"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Leaf,
  Zap,
  Droplets,
  Trash2,
  Truck,
  Calendar,
  FileCheck,
  Target,
  AlertCircle,
  Trees,
  Wind,
  Shield,
  HardHat,
  ShieldCheck,
  AlertTriangle,
  Landmark,
  Users,
  Layers,
  MapPin,
  Sprout,
  Pill,
  Apple,
  Cloud,
  Database
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';
import { useAccentGradient } from '@/providers/AppearanceProvider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewDashboardWithScore } from '@/components/dashboard/OverviewDashboardWithScore';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { EmissionsDashboard } from '@/components/dashboard/EmissionsDashboard';
import { EnergyDashboard } from '@/components/dashboard/EnergyDashboard';
import { WaterDashboard } from '@/components/dashboard/WaterDashboard';
import { WasteDashboard } from '@/components/dashboard/WasteDashboard';
import { TransportationDashboard } from '@/components/dashboard/TransportationDashboard';
import { MonthlyIntelligentDashboard } from '@/components/dashboard/MonthlyIntelligentDashboard';
import { TargetsDashboard } from '@/components/dashboard/TargetsDashboard';
import { DataManagementDashboard } from '@/components/dashboard/DataManagementDashboard';
import { SiteSelector } from '@/components/zero-typing/SiteSelector';
import { TimePeriodSelector, TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import type { Building } from '@/types/auth';
import { useOrganizationContext } from '@/hooks/useOrganizationContext';
import { useGRISectorTopics } from '@/hooks/useGRISectorTopics';

type DashboardView =
  | 'overview'
  | 'compliance'
  | 'emissions'
  | 'energy'
  | 'water'
  | 'waste'
  | 'transportation'
  | 'targets'
  | 'data'
  | 'monthly'
  | 'ghg_emissions'
  | 'water_management'
  | 'waste_management'
  | 'biodiversity'
  | 'air_quality'
  | 'climate_resilience'
  | 'decommissioning'
  | 'asset_integrity'
  | 'tailings_management'
  | 'mine_closure'
  | 'artisanal_mining'
  | 'soil_health'
  | 'land_conversion'
  | 'pesticides_use'
  | 'antibiotics_use'
  | 'food_waste';

type DashboardTab = {
  id: DashboardView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  badge?: string;
};

type MaterialTopic = {
  dashboard_type: string;
  description?: string;
};

type RecommendedDashboard = {
  type: DashboardView;
  name: string;
  gri?: string;
  priority?: number;
};

const getDefaultPeriod = (): TimePeriod => {
  const year = new Date().getFullYear();
  return {
    id: 'current-year',
    label: year.toString(),
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    type: 'year'
  };
};

const fallbackRecommendedDashboards: RecommendedDashboard[] = [
  { type: 'energy', name: 'Energy', gri: 'GRI 302' },
  { type: 'water_management', name: 'Water & Effluents', gri: 'GRI 303' },
  { type: 'waste_management', name: 'Waste', gri: 'GRI 306' }
];

const iconMap: Partial<Record<DashboardView, React.ComponentType<{ className?: string }>>> = {
  ghg_emissions: Leaf,
  energy: Zap,
  water: Droplets,
  water_management: Droplets,
  waste: Trash2,
  waste_management: Trash2,
  transportation: Truck,
  biodiversity: Trees,
  air_quality: Wind,
  climate_resilience: Shield,
  decommissioning: HardHat,
  asset_integrity: ShieldCheck,
  tailings_management: AlertTriangle,
  mine_closure: Landmark,
  artisanal_mining: Users,
  soil_health: Layers,
  land_conversion: MapPin,
  pesticides_use: Sprout,
  antibiotics_use: Pill,
  food_waste: Apple,
  targets: Target,
  data: Database,
  monthly: Calendar
};

const colorMap: Partial<Record<DashboardView, string>> = {
  overview: '#64748b',
  compliance: '#475569',
  emissions: '#10b981',
  ghg_emissions: '#10b981',
  energy: '#f59e0b',
  water: '#3b82f6',
  water_management: '#3b82f6',
  waste: '#92400e',
  waste_management: '#92400e',
  transportation: '#0ea5e9',
  biodiversity: '#059669',
  air_quality: '#0ea5e9',
  climate_resilience: '#8b5cf6',
  decommissioning: '#f97316',
  asset_integrity: '#ef4444',
  tailings_management: '#dc2626',
  mine_closure: '#92400e',
  artisanal_mining: '#f59e0b',
  soil_health: '#78350f',
  land_conversion: '#15803d',
  pesticides_use: '#facc15',
  antibiotics_use: '#3b82f6',
  food_waste: '#dc2626',
  targets: '#10b981',
  data: '#6366f1',
  monthly: '#8b5cf6'
};

export default function DashboardClient() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accentGradientConfig = useAccentGradient();

  const [currentView, setCurrentView] = useState<DashboardView>(() => {
    const tab = searchParams.get('tab');
    return (tab as DashboardView | null) ?? 'overview';
  });
  const [selectedSite, setSelectedSite] = useState<Building | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(getDefaultPeriod);

  const {
    data: organizationData,
    isLoading: loadingOrganization,
    error: organizationError
  } = useOrganizationContext(!!user);
  const { data: sectorTopicsData } = useGRISectorTopics(!!organizationData);

  const errorMessage = organizationError
    ? organizationError instanceof Error
      ? organizationError.message
      : 'Failed to connect to server'
    : null;

  const dynamicDashboards = useMemo<RecommendedDashboard[]>(() => {
    const dashboards = sectorTopicsData?.recommended_dashboards as RecommendedDashboard[] | undefined;
    return dashboards?.length ? dashboards : fallbackRecommendedDashboards;
  }, [sectorTopicsData]);

  const sectorInfo = sectorTopicsData?.sector;
  const materialTopics = (sectorTopicsData?.material_topics as MaterialTopic[] | undefined) ?? [];

  const fixedTabs: DashboardTab[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Compliance and metrics summary',
      color: colorMap.overview ?? '#64748b'
    },
    {
      id: 'compliance',
      label: 'Compliance',
      icon: FileCheck,
      description: sectorInfo?.name ? `GHG Protocol • ${sectorInfo.name}` : 'GHG Protocol & GRI Standards',
      color: colorMap.compliance ?? '#475569',
      badge: sectorInfo?.code ? `GRI ${sectorInfo.code.split('_').pop()}` : undefined
    },
    {
      id: 'emissions',
      label: 'Emissions',
      icon: Cloud,
      description: 'GHG Protocol • GRI 305 • ESRS E1 • TCFD',
      color: colorMap.emissions ?? '#10b981'
    }
  ];

  const sectorDashboardTabs: DashboardTab[] = dynamicDashboards.map((dashboard) => ({
    id: dashboard.type,
    label: dashboard.name,
    icon: iconMap[dashboard.type] ?? BarChart3,
    description: dashboard.gri ?? 'Sector-specific dashboard',
    color: colorMap[dashboard.type] ?? '#64748b',
    badge: dashboard.priority === 1 ? 'High' : undefined
  }));

  const targetsTabs: DashboardTab[] = [
    {
      id: 'targets',
      label: 'Targets',
      icon: Target,
      description: 'SBTi • GHG Protocol • Target tracking',
      color: colorMap.targets ?? '#10b981',
      badge: 'SBTi'
    }
  ];

  const dataTabs: DashboardTab[] = [
    {
      id: 'data',
      label: 'Data',
      icon: Database,
      description: 'Metrics data management and history',
      color: colorMap.data ?? '#6366f1'
    }
  ];

  const intelligenceTabs: DashboardTab[] = [
    {
      id: 'monthly',
      label: 'Intelligence',
      icon: Calendar,
      description: 'Automated monthly insights',
      color: colorMap.monthly ?? '#8b5cf6'
    }
  ];

  const dashboardTabs: DashboardTab[] = [
    ...fixedTabs,
    ...sectorDashboardTabs,
    ...targetsTabs,
    ...dataTabs,
    ...intelligenceTabs
  ];

  const availableViews = useMemo(() => {
    return new Set<DashboardView>(dashboardTabs.map((tab) => tab.id));
  }, [dashboardTabs]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && availableViews.has(tabFromUrl as DashboardView) && tabFromUrl !== currentView) {
      setCurrentView(tabFromUrl as DashboardView);
    }
  }, [searchParams, availableViews, currentView]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get('tab') !== currentView) {
      params.set('tab', currentView);
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [currentView, router, searchParams]);

  const handleTabChange = (value: string) => {
    if (availableViews.has(value as DashboardView)) {
      setCurrentView(value as DashboardView);
    }
  };

  const accentGradient = accentGradientConfig.gradient;
  const accentColorHex = accentGradientConfig.from;

  const renderDashboard = () => {
    const orgId = organizationData?.id;
    const userId = user?.id;

    if (!orgId || !userId) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-2">
            <div
              className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto"
              style={{ borderColor: accentColorHex }}
            />
            <p className="text-gray-400">Loading organization data...</p>
          </div>
        </div>
      );
    }

    const dashboardComponents: Partial<Record<DashboardView, React.ComponentType<any>>> = {
      compliance: ComplianceDashboard,
      emissions: EmissionsDashboard,
      ghg_emissions: ComplianceDashboard,
      energy: EnergyDashboard,
      water: WaterDashboard,
      water_management: WaterDashboard,
      waste: WasteDashboard,
      waste_management: WasteDashboard,
      transportation: TransportationDashboard,
      targets: TargetsDashboard
    };

    if (currentView === 'monthly') {
      return <MonthlyIntelligentDashboard organizationId={orgId} userId={userId} />;
    }

    if (currentView === 'overview') {
      return (
        <OverviewDashboardWithScore
          organizationId={orgId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      );
    }

    if (currentView === 'data') {
      return (
        <DataManagementDashboard
          organizationId={orgId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      );
    }

    const DashboardComponent = dashboardComponents[currentView];

    if (DashboardComponent) {
      return (
        <DashboardComponent
          organizationId={orgId}
          selectedSite={selectedSite}
          selectedPeriod={selectedPeriod}
        />
      );
    }

    const currentTab = dashboardTabs.find((tab) => tab.id === currentView);
    const Icon = currentTab?.icon ?? BarChart3;

    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4 max-w-2xl p-8">
          <Icon className="w-20 h-20 mx-auto" style={{ color: currentTab?.color ?? accentColorHex }} />
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentTab?.label}</h3>
          {materialTopics.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Material Topic for {sectorInfo?.name ?? 'your sector'}
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {currentTab?.description}
              </p>
              {materialTopics.find((topic) => topic.dashboard_type === currentView)?.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-3">
                  {materialTopics.find((topic) => topic.dashboard_type === currentView)?.description}
                </p>
              )}
            </div>
          )}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              This dashboard is part of your GRI sector-specific material topics and will be implemented soon.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              In the meantime, you can use the Compliance dashboard to track emissions data for this category.
            </p>
            <button
              onClick={() => setCurrentView('compliance')}
              className={`mt-4 px-6 py-3 bg-gradient-to-r ${accentGradient} rounded-xl hover:opacity-90 transition-opacity text-white`}
            >
              Go to Compliance Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loadingOrganization) {
    return (
      <SustainabilityLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-4">
            <div
              className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
              style={{ borderColor: accentColorHex }}
            />
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </SustainabilityLayout>
    );
  }

  if (errorMessage) {
    return (
      <SustainabilityLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-semibold">Error Loading Dashboard</h3>
            <p className="text-gray-400">{errorMessage}</p>
            <button
              onClick={() => window.location.reload()}
              className={`px-6 py-3 bg-gradient-to-r ${accentGradient} hover:opacity-90 rounded-xl transition-opacity text-white`}
            >
              Retry
            </button>
          </div>
        </div>
      </SustainabilityLayout>
    );
  }

  return (
    <SustainabilityLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header - Profile Style */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sustainability Dashboard</h1>
              <p className="text-[#616161] dark:text-[#757575]">Real-time monitoring active</p>
            </div>

            {/* Selectors in top right */}
            <div className="flex items-center gap-3">
              <SiteSelector
                currentSite={selectedSite}
                onSiteChange={setSelectedSite}
              />
              <TimePeriodSelector
                currentPeriod={selectedPeriod}
                onPeriodChange={setSelectedPeriod}
              />
              {(selectedSite || selectedPeriod.id !== 'current-year') && (
                <button
                  onClick={() => {
                    setSelectedSite(null);
                    setSelectedPeriod(getDefaultPeriod());
                  }}
                  className="text-sm transition-opacity hover:opacity-80"
                  style={{ color: accentColorHex }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Dashboard Tabs - Unified Tab Component */}
        <Tabs value={currentView} onValueChange={handleTabChange}>
          <TabsList variant="underline" className="w-full">
            {dashboardTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                variant="underline"
                icon={tab.icon}
                badge={tab.badge}
                color={tab.color}
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Main Dashboard Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              {renderDashboard()}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </SustainabilityLayout>
  );
}