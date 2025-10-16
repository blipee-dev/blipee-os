/**
 * Performance Monitoring Hook for React Query Dashboard Caching
 *
 * Tracks load times, cache hit rates, and API call reduction
 * to measure the impact of React Query caching implementation
 */

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export interface PerformanceMetrics {
  // Load time tracking
  loadStartTime: number | null;
  loadEndTime: number | null;
  loadDuration: number | null;

  // Cache metrics
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;

  // API metrics
  apiCallsThisSession: number;
  apiCallsSaved: number;

  // Historical comparison
  averageLoadTime: number | null;
  averageCachedLoadTime: number | null;
}

export interface PerformanceStats {
  currentPage: string;
  metrics: PerformanceMetrics;
  isFromCache: boolean;
  timestamp: number;
}

const STORAGE_KEY = 'blipee_performance_metrics';
const MAX_HISTORY_SIZE = 100;

/**
 * Custom hook to monitor dashboard performance
 */
export function usePerformanceMonitoring(dashboardName: string) {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadStartTime: null,
    loadEndTime: null,
    loadDuration: null,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    apiCallsThisSession: 0,
    apiCallsSaved: 0,
    averageLoadTime: null,
    averageCachedLoadTime: null,
  });

  const loadStartRef = useRef<number | null>(null);
  const hasRecordedLoad = useRef(false);

  // Start timing on mount
  useEffect(() => {
    loadStartRef.current = performance.now();
    hasRecordedLoad.current = false;

    setMetrics(prev => ({
      ...prev,
      loadStartTime: loadStartRef.current,
    }));
  }, [dashboardName]);

  // Record load completion
  const recordLoadComplete = (isFromCache: boolean) => {
    if (hasRecordedLoad.current || !loadStartRef.current) return;

    const loadEnd = performance.now();
    const duration = loadEnd - loadStartRef.current;
    hasRecordedLoad.current = true;

    setMetrics(prev => {
      const newMetrics = {
        ...prev,
        loadEndTime: loadEnd,
        loadDuration: duration,
        cacheHits: isFromCache ? prev.cacheHits + 1 : prev.cacheHits,
        cacheMisses: !isFromCache ? prev.cacheMisses + 1 : prev.cacheMisses,
        cacheHitRate: calculateCacheHitRate(
          isFromCache ? prev.cacheHits + 1 : prev.cacheHits,
          !isFromCache ? prev.cacheMisses + 1 : prev.cacheMisses
        ),
        apiCallsThisSession: isFromCache ? prev.apiCallsThisSession : prev.apiCallsThisSession + 1,
        apiCallsSaved: isFromCache ? prev.apiCallsSaved + 1 : prev.apiCallsSaved,
      };

      // Save to localStorage for historical tracking
      savePerformanceData(dashboardName, duration, isFromCache);

      // Calculate averages
      const history = getPerformanceHistory();
      newMetrics.averageLoadTime = calculateAverageLoadTime(history);
      newMetrics.averageCachedLoadTime = calculateAverageCachedLoadTime(history);

      return newMetrics;
    });

    // Log performance data
    console.log(`📊 Performance [${dashboardName}]:`, {
      duration: `${duration.toFixed(2)}ms`,
      source: isFromCache ? 'cache' : 'network',
      cacheHitRate: `${calculateCacheHitRate(
        metrics.cacheHits + (isFromCache ? 1 : 0),
        metrics.cacheMisses + (!isFromCache ? 1 : 0)
      ).toFixed(1)}%`,
    });
  };

  // Get cache statistics from React Query
  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const totalQueries = queries.length;
    const staleQueries = queries.filter(q => q.isStale()).length;
    const fetchingQueries = queries.filter(q => q.state.fetchStatus === 'fetching').length;
    const cachedQueries = totalQueries - staleQueries - fetchingQueries;

    return {
      total: totalQueries,
      cached: cachedQueries,
      stale: staleQueries,
      fetching: fetchingQueries,
      cacheUtilization: totalQueries > 0 ? (cachedQueries / totalQueries) * 100 : 0,
    };
  };

  // Clear performance history
  const clearHistory = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    setMetrics({
      loadStartTime: null,
      loadEndTime: null,
      loadDuration: null,
      cacheHits: 0,
      cacheMisses: 0,
      cacheHitRate: 0,
      apiCallsThisSession: 0,
      apiCallsSaved: 0,
      averageLoadTime: null,
      averageCachedLoadTime: null,
    });
  };

  return {
    metrics,
    recordLoadComplete,
    getCacheStats,
    clearHistory,
  };
}

// Helper functions

function calculateCacheHitRate(hits: number, misses: number): number {
  const total = hits + misses;
  return total > 0 ? (hits / total) * 100 : 0;
}

function savePerformanceData(page: string, duration: number, isFromCache: boolean) {
  if (typeof window === 'undefined') return;

  try {
    const history = getPerformanceHistory();
    history.push({
      page,
      duration,
      isFromCache,
      timestamp: Date.now(),
    });

    // Keep only last MAX_HISTORY_SIZE entries
    const trimmedHistory = history.slice(-MAX_HISTORY_SIZE);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.warn('Failed to save performance data:', error);
  }
}

function getPerformanceHistory(): Array<{ page: string; duration: number; isFromCache: boolean; timestamp: number }> {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to load performance history:', error);
    return [];
  }
}

function calculateAverageLoadTime(history: Array<{ duration: number }>): number | null {
  if (history.length === 0) return null;
  const sum = history.reduce((acc, entry) => acc + entry.duration, 0);
  return sum / history.length;
}

function calculateAverageCachedLoadTime(history: Array<{ duration: number; isFromCache: boolean }>): number | null {
  const cachedLoads = history.filter(entry => entry.isFromCache);
  if (cachedLoads.length === 0) return null;
  const sum = cachedLoads.reduce((acc, entry) => acc + entry.duration, 0);
  return sum / cachedLoads.length;
}

/**
 * Hook to get global performance statistics across all dashboards
 */
export function useGlobalPerformanceStats() {
  const [stats, setStats] = useState({
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    cacheHitRate: 0,
    averageLoadTime: 0,
    averageCachedLoadTime: 0,
    totalApiCallsSaved: 0,
    bandwidthSaved: 0, // Estimated in MB
  });

  useEffect(() => {
    const history = getPerformanceHistory();
    if (history.length === 0) return;

    const cacheHits = history.filter(e => e.isFromCache).length;
    const cacheMisses = history.filter(e => !e.isFromCache).length;
    const totalLoads = history.length;

    const avgLoad = calculateAverageLoadTime(history);
    const avgCached = calculateAverageCachedLoadTime(history);

    // Estimate bandwidth saved (assuming ~600KB per API call)
    const estimatedBandwidth = (cacheHits * 600) / 1024; // MB

    setStats({
      totalLoads,
      cacheHits,
      cacheMisses,
      cacheHitRate: calculateCacheHitRate(cacheHits, cacheMisses),
      averageLoadTime: avgLoad || 0,
      averageCachedLoadTime: avgCached || 0,
      totalApiCallsSaved: cacheHits,
      bandwidthSaved: estimatedBandwidth,
    });
  }, []);

  return stats;
}

/**
 * Component to display performance metrics in development
 */
export function PerformanceMonitor({ dashboardName }: { dashboardName: string }) {
  const { metrics, getCacheStats } = usePerformanceMonitoring(dashboardName);
  const cacheStats = getCacheStats();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-black/90 text-white text-xs rounded-lg shadow-xl max-w-sm z-50">
      <div className="font-bold mb-2">⚡ Performance Monitor</div>
      <div className="space-y-1">
        <div>Dashboard: {dashboardName}</div>
        {metrics.loadDuration && (
          <div>Load Time: {metrics.loadDuration.toFixed(2)}ms</div>
        )}
        <div>Cache Hit Rate: {metrics.cacheHitRate.toFixed(1)}%</div>
        <div>API Calls Saved: {metrics.apiCallsSaved}</div>
        <div>Cache Utilization: {cacheStats.cacheUtilization.toFixed(1)}%</div>
        <div>Cached Queries: {cacheStats.cached}/{cacheStats.total}</div>
        {metrics.averageCachedLoadTime && (
          <div>Avg Cached: {metrics.averageCachedLoadTime.toFixed(2)}ms</div>
        )}
      </div>
    </div>
  );
}
