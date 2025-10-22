import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import type { DashboardIntelligence } from '@/lib/ai/sustainability-intelligence';

// Query keys for organized cache management
export const intelligenceKeys = {
  all: ['sustainability', 'intelligence'] as const,
  dashboard: (dashboardType: string) =>
    [...intelligenceKeys.all, dashboardType] as const,
  cacheStats: () =>
    [...intelligenceKeys.all, 'cache-stats'] as const,
};

/**
 * Dashboard type options for intelligence
 */
export type DashboardType = 'emissions' | 'energy' | 'compliance' | 'targets' | 'overview';

/**
 * Hook to fetch AI intelligence for a specific dashboard
 *
 * This hook orchestrates multiple autonomous agents in parallel to provide:
 * - Insights (trends, anomalies, opportunities, risks, compliance)
 * - Recommendations (actionable improvements with impact estimates)
 * - Alerts (critical items requiring immediate attention)
 *
 * Features:
 * - Automatic 5-minute caching (matches backend TTL)
 * - Error handling with detailed messages
 * - Loading states
 * - Automatic refetch on window focus
 * - Manual refresh capability
 *
 * @param dashboardType - The type of dashboard to enrich
 * @param rawData - Optional raw dashboard data for context
 * @param enabled - Whether to auto-fetch (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useSustainabilityIntelligence('emissions');
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     <h2>AI Insights ({data.insights.length})</h2>
 *     {data.insights.map(insight => (
 *       <InsightCard key={insight.title} insight={insight} />
 *     ))}
 *     <button onClick={() => refetch()}>Refresh Intelligence</button>
 *   </div>
 * );
 * ```
 */
export function useSustainabilityIntelligence(
  dashboardType: DashboardType,
  rawData?: any,
  enabled: boolean = true
) {
  return useQuery<DashboardIntelligence>({
    queryKey: intelligenceKeys.dashboard(dashboardType),
    queryFn: async () => {
      const response = await fetch('/api/sustainability/intelligence', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dashboardType,
          rawData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch intelligence');
      }

      const intelligence = await response.json();

      // Log cache performance for monitoring
      const cacheHit = response.headers.get('X-Cache-Hit') === 'true';
      const executionTime = response.headers.get('X-Execution-Time-Ms');

      console.log(
        `[Intelligence Hook] ${dashboardType} dashboard - Cache: ${cacheHit ? 'HIT' : 'MISS'}, ` +
        `Execution: ${executionTime}ms, Insights: ${intelligence.insights.length}, ` +
        `Recommendations: ${intelligence.recommendations.length}`
      );

      return intelligence;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches backend cache TTL)
    gcTime: 10 * 60 * 1000,   // 10 minutes (keep in memory longer)
    enabled,
    refetchOnWindowFocus: true,
    retry: 2, // Retry failed requests twice
  });
}

/**
 * Hook to get cache statistics
 *
 * Useful for monitoring and debugging the intelligence layer caching behavior.
 *
 * @example
 * ```tsx
 * const { data: stats } = useIntelligenceCacheStats();
 * console.log(`Cache contains ${stats.cacheSize} entries`);
 * ```
 */
export function useIntelligenceCacheStats() {
  return useQuery({
    queryKey: intelligenceKeys.cacheStats(),
    queryFn: async () => {
      const response = await fetch('/api/sustainability/intelligence');
      if (!response.ok) {
        throw new Error('Failed to fetch cache stats');
      }
      return response.json();
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: process.env.NODE_ENV === 'development', // Only in dev mode
  });
}

/**
 * Hook to manually clear intelligence cache
 *
 * Useful for testing or when users want to force a refresh.
 *
 * @example
 * ```tsx
 * const clearCache = useClearIntelligenceCache();
 *
 * <button onClick={() => clearCache.mutate({ dashboardType: 'emissions' })}>
 *   Clear Cache
 * </button>
 * ```
 */
export function useClearIntelligenceCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params?: { organizationId?: string; dashboardType?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.organizationId) searchParams.append('organizationId', params.organizationId);
      if (params?.dashboardType) searchParams.append('dashboardType', params.dashboardType);

      const response = await fetch(
        `/api/sustainability/intelligence?${searchParams}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to clear cache');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate React Query cache to trigger refetch
      if (variables?.dashboardType) {
        queryClient.invalidateQueries({
          queryKey: intelligenceKeys.dashboard(variables.dashboardType),
        });
      } else {
        queryClient.invalidateQueries({
          queryKey: intelligenceKeys.all,
        });
      }
    },
  });
}

/**
 * Hook to prefetch intelligence for a dashboard type
 *
 * Useful for preloading intelligence when hovering over dashboard tabs
 * or navigating between dashboards to improve perceived performance.
 *
 * @example
 * ```tsx
 * const prefetchIntelligence = usePrefetchIntelligence();
 *
 * <Tab
 *   onMouseEnter={() => prefetchIntelligence('energy')}
 * >
 *   Energy Dashboard
 * </Tab>
 * ```
 */
export function usePrefetchIntelligence() {
  const queryClient = useQueryClient();

  return (dashboardType: DashboardType, rawData?: any) => {
    queryClient.prefetchQuery({
      queryKey: intelligenceKeys.dashboard(dashboardType),
      queryFn: async () => {
        const response = await fetch('/api/sustainability/intelligence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dashboardType,
            rawData,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to prefetch intelligence');
        }

        return response.json();
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}

/**
 * Utility type guards for working with intelligence data
 */
export const IntelligenceUtils = {
  /**
   * Filter insights by priority
   */
  getHighPriorityInsights: (intelligence: DashboardIntelligence) =>
    intelligence.insights.filter(i => i.priority === 'critical' || i.priority === 'high'),

  /**
   * Filter actionable insights
   */
  getActionableInsights: (intelligence: DashboardIntelligence) =>
    intelligence.insights.filter(i => i.actionable),

  /**
   * Get critical alerts
   */
  getCriticalAlerts: (intelligence: DashboardIntelligence) =>
    intelligence.alerts.filter(a => a.severity === 'critical'),

  /**
   * Sort recommendations by estimated impact
   */
  sortByImpact: (intelligence: DashboardIntelligence) =>
    [...intelligence.recommendations].sort((a, b) =>
      (b.estimatedImpact || 0) - (a.estimatedImpact || 0)
    ),

  /**
   * Check if intelligence is fresh (< 2 minutes old)
   */
  isFresh: (intelligence: DashboardIntelligence) => {
    const age = Date.now() - new Date(intelligence.generatedAt).getTime();
    return age < 2 * 60 * 1000;
  },
};
