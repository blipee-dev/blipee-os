'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ZeroTypingSidebar } from '@/components/zero-typing/ZeroTypingSidebar';
import { AdaptiveHomeGrid } from '@/components/zero-typing/AdaptiveHomeGrid';
import { SmartWidgets } from '@/components/zero-typing/SmartWidgets';
import { OneTouchWorkflows } from '@/components/zero-typing/OneTouchWorkflows';
import { NavigationMatrix } from '@/components/zero-typing/NavigationMatrix';
import { QueryCardGrid } from '@/components/zero-typing/QueryCardGrid';
import { PredictionPills } from '@/components/zero-typing/PredictionPills';
import { TimePeriodSelector, TimePeriod } from '@/components/zero-typing/TimePeriodSelector';
import { EmissionFactorDashboard } from '@/components/zero-typing/EmissionFactorDashboard';
import { createClient } from '@/lib/supabase/client';

interface ZeroTypingClientProps {
  session: any;
  initialMetricsData: any;
  processedMetrics?: any;
  organizationData?: any;
}

export default function ZeroTypingClient({
  session,
  initialMetricsData,
  processedMetrics: initialProcessedMetrics,
  organizationData
}: ZeroTypingClientProps) {
  const router = useRouter();
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [metricsData, setMetricsData] = useState(initialMetricsData);
  const [processedMetrics, setProcessedMetrics] = useState(initialProcessedMetrics);

  // Time period state
  const currentYear = new Date().getFullYear();
  const [currentPeriod, setCurrentPeriod] = useState<TimePeriod>({
    id: 'current-year',
    label: `${currentYear}`,
    start: `${currentYear}-01-01`,
    end: `${currentYear}-12-31`,
    type: 'year'
  });
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Handle period change
  const handlePeriodChange = async (newPeriod: TimePeriod) => {
    setCurrentPeriod(newPeriod);
    setLoading(true);

    try {
      // Fetch new metrics data for the selected period
      const response = await fetch('/api/zero-typing/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          start: newPeriod.start,
          end: newPeriod.end,
          organizationId: session.current_organization?.id
        })
      });

      if (response.ok) {
        const newData = await response.json();
        setMetricsData(newData.metrics);
        setProcessedMetrics(newData.processed);
      }
    } catch (error) {
      console.error('Failed to fetch period data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Determine time of day
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');

    // Set up real-time subscription for metrics if organization exists
    if (session.current_organization?.id) {
      const supabase = createClient();

      const subscription = supabase
        .channel('metrics-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'metrics_data',
            filter: `organization_id=eq.${session.current_organization.id}`
          },
          (payload) => {
            // Refresh metrics data
            refreshMetrics();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [session.current_organization]);

  const refreshMetrics = async () => {
    if (!session.current_organization?.id) return;

    const supabase = createClient();
    const { data: metrics } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name,
          unit,
          scope,
          category
        )
      `)
      .eq('organization_id', session.current_organization.id)
      .order('created_at', { ascending: false })
      .limit(100);

    setMetricsData(metrics);
  };

  const handleAction = (action: string, params?: any) => {

    // Track recent actions for context
    setRecentActions(prev => [...prev, { action, params, timestamp: new Date() }].slice(-10));

    // Handle different action types
    if (action.startsWith('navigate')) {
      router.push(params?.path || '/');
    } else if (action.startsWith('emissions')) {
      // Navigate to emissions pages
      if (action === 'emissions/overnight') {
        router.push('/sustainability/data-investigation?period=overnight');
      } else if (action === 'emissions/sources') {
        router.push('/sustainability/data-comparison?view=sources');
      } else if (action === 'emissions/reduce') {
        router.push('/sustainability?tab=optimization');
      }
    } else if (action.startsWith('alerts')) {
      router.push('/monitoring?view=alerts');
    } else if (action.startsWith('energy')) {
      router.push('/sustainability/energy');
    } else if (action.startsWith('summary')) {
      router.push('/sustainability');
    } else if (action.startsWith('reports')) {
      router.push('/sustainability?tab=reports');
    } else if (action.startsWith('optimize')) {
      router.push('/sustainability?tab=optimization');
    } else if (action.startsWith('compare')) {
      router.push('/sustainability/data-comparison');
    } else if (action.startsWith('analyze')) {
      router.push('/sustainability/data-investigation');
    }
  };

  // Enhanced context with auth session info
  const enhancedContext = {
    timeOfDay,
    user: session.user,
    organization: session.current_organization,
    organizationData: organizationData,
    role: session.user?.role,
    metricsData: {
      raw: metricsData,
      metrics: processedMetrics
    },
    recentActions,
    permissions: session.permissions || [],
  };

  // Dynamic stats based on real data
  const stats = [
    {
      label: 'Sites',
      value: organizationData?.sitesCount?.toString() || '0',
      subtext: 'monitored'
    },
    {
      label: 'Data Points',
      value: organizationData?.metricsCount ? organizationData.metricsCount.toLocaleString() : '0',
      subtext: 'tracked'
    },
    {
      label: 'Team',
      value: organizationData?.teamCount?.toString() || '0',
      subtext: 'members'
    },
    {
      label: 'Alerts',
      value: organizationData?.alertsCount?.toString() || '0',
      subtext: 'active'
    },
  ];

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <ZeroTypingSidebar
        onNavigate={(path) => handleAction('navigate', { path })}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bg-white dark:bg-[#212121] pb-20 md:pb-0">
          {/* Header with stats */}
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-gray-200 dark:border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Zero-Typing Dashboard
                  </h1>
                  <p className="text-gray-600 dark:text-white/60">
                    {session.user?.name ? `Welcome back, ${session.user.name}` : 'Intelligent, adaptive interface that learns and predicts your needs'}
                  </p>
                </div>
                <TimePeriodSelector
                  currentPeriod={currentPeriod}
                  onPeriodChange={handlePeriodChange}
                />
              </div>

              {/* Stats Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/[0.05] rounded-xl p-4"
                  >
                    <div className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-white/60">
                      {stat.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-white/40 mt-1">
                      {stat.subtext}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Permission-based alert */}
              {session.user?.role === 'viewer' && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                    You have view-only permissions. Contact your administrator for edit access.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Content Sections */}
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
            {/* Prediction Pills */}
            <PredictionPills
              context={enhancedContext}
              onAction={handleAction}
            />

            {/* Adaptive Home Grid */}
            <AdaptiveHomeGrid
              timeOfDay={timeOfDay}
              onAction={handleAction}
              user={session.user}
              metricsData={{ metrics: processedMetrics, raw: metricsData }}
              loading={loading}
            />

            {/* Emission Factor Dashboard */}
            {session.current_organization?.id && metricsData && (
              <EmissionFactorDashboard
                organizationId={session.current_organization.id}
                period={currentPeriod}
                metricsData={{ raw: metricsData, metrics: processedMetrics }}
              />
            )}

            {/* Smart Widgets */}
            <SmartWidgets
              context={enhancedContext}
              onAction={handleAction}
            />

            {/* One-Touch Workflows - only for editors */}
            {session.user?.role !== 'viewer' && (
              <OneTouchWorkflows onAction={handleAction} />
            )}

            {/* Navigation Matrix */}
            <NavigationMatrix
              onAction={handleAction}
              context={enhancedContext}
            />

            {/* Query Card Grid */}
            <QueryCardGrid
              onAction={handleAction}
              context={enhancedContext}
            />
          </div>
        </div>
      </main>
    </div>
  );
}