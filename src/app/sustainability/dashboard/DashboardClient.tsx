'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  BarChart3,
  Leaf,
  Zap,
  Droplets,
  Trash2,
  Truck,
  Brain,
  Calendar,
  FileCheck,
  TrendingUp,
  Target,
  AlertCircle,
  ChevronRight,
  Sparkles,
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
import { useAppearance, useAccentGradient } from '@/providers/AppearanceProvider';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

// Import all our new dashboard components
import { OverviewDashboard } from '@/components/dashboard/OverviewDashboard';
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { EmissionsDashboard } from '@/components/dashboard/EmissionsDashboard';
import { EnergyDashboard } from '@/components/dashboard/EnergyDashboard';
import { WaterDashboard } from '@/components/dashboard/WaterDashboard';
import { WasteDashboard } from '@/components/dashboard/WasteDashboard';
import { TransportationDashboard } from '@/components/dashboard/TransportationDashboard';
import { MonthlyIntelligentDashboard } from '@/components/dashboard/MonthlyIntelligentDashboard';
import { TargetsDashboard } from '@/components/dashboard/TargetsDashboard';
import { DataManagementDashboard } from '@/components/dashboard/DataManagementDashboard';

// Import AI components
import { ConversationInterface } from '@/components/blipee-os/ConversationInterface';
import { ProactiveAICoach } from '@/components/ai/ProactiveAICoach';

// Import filter components
import { SiteSelector } from '@/components/zero-typing/SiteSelector';
import { TimePeriodSelector, TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import type { Building } from '@/types/auth';

type DashboardView = 'overview' | 'compliance' | 'emissions' | 'energy' | 'water' | 'waste' | 'transportation' | 'targets' | 'data' | 'monthly' | 'ai';

export default function DashboardClient() {
  const { user } = useAuth();
  const { settings } = useAppearance();
  const accentGradientConfig = useAccentGradient();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize currentView from URL or default to 'overview'
  const [currentView, setCurrentView] = useState<DashboardView>(() => {
    const tabFromUrl = searchParams.get('tab');
    return (tabFromUrl as DashboardView) || 'overview';
  });

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [showProactiveCoach, setShowProactiveCoach] = useState(true);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // GRI sector-specific dashboards
  const [sectorTopics, setSectorTopics] = useState<any>(null);
  const [dynamicDashboards, setDynamicDashboards] = useState<any[]>([]);

  // Global filters for all dashboards
  const [selectedSite, setSelectedSite] = useState<Building | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>({
    id: 'current-year',
    label: new Date().getFullYear().toString(),
    start: `${new Date().getFullYear()}-01-01`,
    end: `${new Date().getFullYear()}-12-31`,
    type: 'year'
  });

  // Sync URL when tab changes
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== currentView) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', currentView);
      router.push(`?${params.toString()}`, { scroll: false });
    }
  }, [currentView, router, searchParams]);

  // Sync currentView when URL changes (browser back/forward)
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && tabFromUrl !== currentView) {
      setCurrentView(tabFromUrl as DashboardView);
    }
  }, [searchParams]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setCurrentView(value as DashboardView);
  };

  useEffect(() => {
    // Fetch organization data for context
    const fetchOrgData = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);

        const response = await fetch('/api/organization/context');
        const data = await response.json();


        if (response.ok) {
          // API returns { organization: {...}, sites: [...], ... }
          if (data.organization) {
            setOrganizationData(data.organization);
          } else {
            console.error('No organization in response:', data);
            setError('No organization found for user');
          }
        } else {
          console.error('Failed to fetch organization context:', response.status, data);
          setError(data.error || 'Failed to load organization');
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchOrgData();
  }, [user]);

  // Fetch GRI sector-specific material topics
  useEffect(() => {
    const fetchSectorTopics = async () => {
      if (!organizationData) return;

      try {
        const response = await fetch('/api/sustainability/gri-sector-topics');
        const data = await response.json();

        setSectorTopics(data);

        // Use recommended dashboards whether sector-specific or generic
        if (data.recommended_dashboards && data.recommended_dashboards.length > 0) {
          setDynamicDashboards(data.recommended_dashboards);
        } else {
          // Fallback to standard GRI 300 series
          setDynamicDashboards([
            { type: 'energy', name: 'Energy', gri: 'GRI 302' },
            { type: 'water_management', name: 'Water & Effluents', gri: 'GRI 303' },
            { type: 'waste_management', name: 'Waste', gri: 'GRI 306' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching GRI sector topics:', error);
        // Fallback to standard GRI 300 series dashboards
        setDynamicDashboards([
          { type: 'energy', name: 'Energy', gri: 'GRI 302' },
          { type: 'water_management', name: 'Water & Effluents', gri: 'GRI 303' },
          { type: 'waste_management', name: 'Waste', gri: 'GRI 306' }
        ]);
      }
    };

    fetchSectorTopics();
  }, [organizationData]);

  // Dashboard navigation items (using user's accent color from appearance settings)
  const accentGradient = accentGradientConfig.gradient;
  const accentColorHex = accentGradientConfig.from; // Use hex for dynamic styles

  // Icon mapping for dashboard types
  const iconMap: Record<string, any> = {
    'ghg_emissions': Leaf,
    'energy': Zap,
    'water_management': Droplets,
    'waste_management': Trash2,
    'biodiversity': Trees,
    'air_quality': Wind,
    'climate_resilience': Shield,
    'decommissioning': HardHat,
    'asset_integrity': ShieldCheck,
    'tailings_management': AlertTriangle,
    'mine_closure': Landmark,
    'artisanal_mining': Users,
    'soil_health': Layers,
    'land_conversion': MapPin,
    'pesticides_use': Sprout,
    'antibiotics_use': Pill,
    'food_waste': Apple
  };

  // Color mapping for dashboard types
  const colorMap: Record<string, string> = {
    'ghg_emissions': '#10b981',
    'energy': '#f59e0b',
    'water_management': '#3b82f6',
    'waste_management': '#92400e',
    'biodiversity': '#059669',
    'air_quality': '#0ea5e9',
    'climate_resilience': '#8b5cf6',
    'decommissioning': '#f97316',
    'asset_integrity': '#ef4444',
    'tailings_management': '#dc2626',
    'mine_closure': '#92400e',
    'artisanal_mining': '#f59e0b',
    'soil_health': '#78350f',
    'land_conversion': '#15803d',
    'pesticides_use': '#facc15',
    'antibiotics_use': '#3b82f6',
    'food_waste': '#dc2626'
  };

  // Build dashboard tabs: fixed tabs + sector-specific dashboards
  const fixedTabs = [
    {
      id: 'overview' as DashboardView,
      label: 'Overview',
      icon: BarChart3,
      description: 'Compliance & metrics overview',
      color: '#64748b'
    },
    {
      id: 'compliance' as DashboardView,
      label: 'Compliance',
      icon: FileCheck,
      description: sectorTopics?.sector ? `GHG Protocol • ${sectorTopics.sector.name}` : 'GHG Protocol & GRI Standards',
      color: '#475569',
      badge: sectorTopics?.sector ? `GRI ${sectorTopics.sector.code.split('_')[1]}` : undefined
    },
    {
      id: 'emissions' as DashboardView,
      label: 'Emissions',
      icon: Cloud,
      description: 'GHG Protocol • GRI 305 • ESRS E1 • TCFD',
      color: '#10b981'
    }
  ];

  const sectorDashboardTabs = (dynamicDashboards || []).map((dashboard: any) => ({
    id: dashboard.type as DashboardView,
    label: dashboard.name,
    icon: iconMap[dashboard.type] || BarChart3,
    description: dashboard.gri ? `${dashboard.gri}` : 'Sector-specific',
    color: colorMap[dashboard.type] || '#64748b',
    badge: dashboard.priority === 1 ? '⚠️' : undefined
  }));

  const targetsTabs = [
    {
      id: 'targets' as DashboardView,
      label: 'Targets',
      icon: Target,
      description: 'SBTi • GHG Protocol • Target tracking',
      badge: 'SBTi',
      color: '#10b981'
    }
  ];

  const dataTabs = [
    {
      id: 'data' as DashboardView,
      label: 'Data',
      icon: Database,
      description: 'Metrics data management & historical tracking',
      color: '#6366f1'
    }
  ];

  const aiTabs = [
    {
      id: 'monthly' as DashboardView,
      label: 'Intelligence',
      icon: Calendar,
      description: 'AI-powered monthly insights',
      badge: 'AI',
      color: '#8b5cf6'
    },
    {
      id: 'ai' as DashboardView,
      label: 'AI Assistant',
      icon: Brain,
      description: 'Chat with your AI team',
      badge: 'NEW',
      color: '#8b5cf6'
    }
  ];

  const dashboardTabs = [...fixedTabs, ...sectorDashboardTabs, ...targetsTabs, ...dataTabs, ...aiTabs];

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

    // Map dashboard types to components
    const dashboardComponents: Record<string, any> = {
      'compliance': ComplianceDashboard,
      'emissions': EmissionsDashboard,
      'ghg_emissions': ComplianceDashboard, // GHG uses Compliance dashboard
      'energy': EnergyDashboard,
      'water_management': WaterDashboard,
      'waste_management': WasteDashboard,
      'transportation': TransportationDashboard,
      'targets': TargetsDashboard,
      'monthly': MonthlyIntelligentDashboard
    };

    const DashboardComponent = dashboardComponents[currentView as string];

    if (currentView === 'ai') {
      return (
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <Brain className="w-16 h-16 mx-auto" style={{ color: accentColorHex }} />
            <h3 className="text-2xl font-bold">AI Assistant</h3>
            <p className="text-gray-400 max-w-md">
              Click the AI button in the bottom right to chat with your sustainability AI team
            </p>
            <button
              onClick={() => setIsAIOpen(true)}
              className={`px-6 py-3 bg-gradient-to-r ${accentGradient} rounded-xl hover:opacity-90 transition-opacity text-white`}
            >
              Open AI Assistant
            </button>
          </div>
        </div>
      );
    }

    if (currentView === 'monthly') {
      return <MonthlyIntelligentDashboard organizationId={orgId} userId={userId} selectedSite={selectedSite} selectedPeriod={selectedPeriod} />;
    }

    if (currentView === 'overview') {
      return <OverviewDashboard organizationId={orgId} selectedSite={selectedSite} selectedPeriod={selectedPeriod} />;
    }

    if (currentView === 'data') {
      return <DataManagementDashboard organizationId={orgId} selectedSite={selectedSite} selectedPeriod={selectedPeriod} />;
    }

    // If dashboard component exists, render it
    if (DashboardComponent) {
      return <DashboardComponent organizationId={orgId} selectedSite={selectedSite} selectedPeriod={selectedPeriod} />;
    }

    // Placeholder for not-yet-implemented dashboards
    const currentTab = dashboardTabs.find(tab => tab.id === currentView);
    const Icon = currentTab?.icon || BarChart3;

    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center space-y-4 max-w-2xl p-8">
          <Icon className="w-20 h-20 mx-auto" style={{ color: currentTab?.color || accentColorHex }} />
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{currentTab?.label}</h3>
          {sectorTopics?.material_topics && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Material Topic for {sectorTopics.sector?.name}
              </div>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                {currentTab?.description}
              </p>
              {sectorTopics.material_topics.find((topic: any) => topic.dashboard_type === currentView)?.description && (
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-3">
                  {sectorTopics.material_topics.find((topic: any) => topic.dashboard_type === currentView).description}
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

  // Show loading state
  if (loading) {
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

  // Show error state
  if (error) {
    return (
      <SustainabilityLayout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
            <h3 className="text-xl font-semibold">Error Loading Dashboard</h3>
            <p className="text-gray-400">{error}</p>
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Sustainability Dashboard
              </h1>
              <p className="text-[#616161] dark:text-[#757575]">
                Powered by 8 AI Agents working 24/7 • Real-time monitoring active
              </p>
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
                    setSelectedPeriod({
                      id: 'current-year',
                      label: new Date().getFullYear().toString(),
                      start: `${new Date().getFullYear()}-01-01`,
                      end: `${new Date().getFullYear()}-12-31`,
                      type: 'year'
                    });
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

        {/* AI Assistant Floating Interface */}
        <AnimatePresence>
          {isAIOpen && (
            <ConversationInterface />
          )}
        </AnimatePresence>

        {/* Proactive AI Coach (for new users) */}
        {showProactiveCoach && user && organizationData && (
          <ProactiveAICoach
            userId={user.id}
            organizationId={organizationData.id}
            userExperience={'new'}
            onInteraction={(action) => {
              if (action === 'dismiss') {
                setShowProactiveCoach(false);
              } else if (action === 'open_ai') {
                setIsAIOpen(true);
              }
            }}
          />
        )}

        {/* AI Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAIOpen(true)}
          className={`fixed bottom-8 right-8 p-4 bg-gradient-to-r ${accentGradient} rounded-full shadow-2xl z-40`}
        >
          <Brain className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </motion.button>
      </div>
    </SustainabilityLayout>
  );
}