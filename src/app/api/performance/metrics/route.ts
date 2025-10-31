/**
 * Performance Metrics API
 *
 * Provides real-time performance metrics and diagnostics
 * Part of FASE 3 - Week 2: Performance & Optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { apiCache } from '@/lib/performance/api-cache';
import { queryOptimizer } from '@/lib/performance/query-optimizer';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication (optional - can be service role only)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'summary';

    switch (type) {
      case 'summary': {
        const report = performanceMonitor.getPerformanceReport();
        const cacheStats = apiCache.getCacheStats();
        const rateLimitStats = apiCache.getRateLimitStats();
        const queryStats = queryOptimizer.getCacheStats();

        return NextResponse.json({
          performance: report.summary,
          cache: cacheStats,
          rateLimit: rateLimitStats,
          queryCache: queryStats,
          timestamp: new Date().toISOString(),
        });
      }

      case 'detailed': {
        const report = performanceMonitor.getPerformanceReport();
        return NextResponse.json(report);
      }

      case 'slow': {
        const threshold = parseInt(searchParams.get('threshold') || '200');
        const slowOps = performanceMonitor.getSlowOperations(threshold);
        return NextResponse.json(slowOps);
      }

      case 'cache': {
        const cacheStats = apiCache.getCacheStats();
        const queryStats = queryOptimizer.getCacheStats();
        return NextResponse.json({
          apiCache: cacheStats,
          queryCache: queryStats,
        });
      }

      case 'database': {
        // Get database performance metrics
        const { data: dbStats } = await supabase.rpc('analyze_table_performance');
        return NextResponse.json({
          tables: dbStats || [],
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Clear performance metrics (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, target } = body;

    switch (action) {
      case 'clear_metrics':
        performanceMonitor.clearMetrics(target);
        return NextResponse.json({ success: true, message: 'Metrics cleared' });

      case 'clear_cache':
        apiCache.clearCache(target);
        queryOptimizer.clearCache(target);
        return NextResponse.json({ success: true, message: 'Cache cleared' });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Performance metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
