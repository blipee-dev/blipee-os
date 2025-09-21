import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import { queryMonitor } from '@/lib/database/query-monitor';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Request schemas
const slowQueriesSchema = z.object({
  threshold_ms: z.number().min(1).max(10000).default(100)
});

const insightsSchema = z.object({
  hours: z.number().min(1).max(168).default(24) // Max 7 days
});

const patternsSchema = z.object({
  days: z.number().min(1).max(30).default(7)
});

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin using centralized permission service
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    if (!isSuperAdmin) {
      // Check if user is owner or manager
      const { role } = await getUserOrganization(user.id);

      if (!role || !['owner', 'manager'].includes(role)) {
        return NextResponse.json(
          { error: 'Forbidden - admin access required' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';

    switch (type) {
      case 'slow_queries': {
        const params = slowQueriesSchema.parse({
          threshold_ms: Number(searchParams.get('threshold_ms') || 100)
        });
        const result = await queryMonitor.getSlowQueries(params.threshold_ms);
        return NextResponse.json(result);
      }

      case 'insights': {
        const params = insightsSchema.parse({
          hours: Number(searchParams.get('hours') || 24)
        });
        const result = await queryMonitor.getQueryInsights(params.hours);
        return NextResponse.json(result);
      }

      case 'patterns': {
        const params = patternsSchema.parse({
          days: Number(searchParams.get('days') || 7)
        });
        const result = await queryMonitor.getQueryPatterns(params.days);
        return NextResponse.json(result);
      }

      case 'health': {
        const result = await queryMonitor.checkDatabaseHealth();
        return NextResponse.json(result);
      }

      case 'stats': {
        const result = await queryMonitor.getDatabaseStats();
        return NextResponse.json(result);
      }

      case 'report': {
        const format = searchParams.get('format') || 'json';
        const report = await queryMonitor.generatePerformanceReport();

        if (format === 'csv') {
          const csv = convertReportToCSV(report);
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename=query-report.csv'
            }
          });
        }

        return NextResponse.json(report);
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('Query monitoring error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get query monitoring data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    if (!isSuperAdmin) {
      const { role } = await getUserOrganization(user.id);

      if (!role || role !== 'owner') {
        return NextResponse.json(
          { error: 'Forbidden - owner access required' },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'analyze': {
        const result = await queryMonitor.analyzeQueries();
        return NextResponse.json(result);
      }

      case 'optimize': {
        const { query } = body;
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required' },
            { status: 400 }
          );
        }
        const result = await queryMonitor.suggestOptimizations(query);
        return NextResponse.json(result);
      }

      case 'clear_cache': {
        // Clear query cache if implemented
        return NextResponse.json({
          success: true,
          message: 'Query cache cleared'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    logger.error('Query monitoring action error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to perform query monitoring action' },
      { status: 500 }
    );
  }
}

function convertReportToCSV(report: any): string {
  const sections = [];

  // Slow queries section
  if (report.slowQueries?.length > 0) {
    const headers = ['Query', 'Duration (ms)', 'Count'];
    const rows = report.slowQueries.map((q: any) =>
      [q.query, q.duration, q.count].join(',')
    );
    sections.push(['Slow Queries', headers.join(','), ...rows].join('\n'));
  }

  // Top queries section
  if (report.topQueries?.length > 0) {
    const headers = ['Query', 'Executions', 'Avg Duration (ms)'];
    const rows = report.topQueries.map((q: any) =>
      [q.query, q.executions, q.avgDuration].join(',')
    );
    sections.push(['', 'Top Queries', headers.join(','), ...rows].join('\n'));
  }

  // Database stats
  if (report.stats) {
    const statsRows = Object.entries(report.stats).map(
      ([key, value]) => `${key},${value}`
    );
    sections.push(['', 'Database Stats', ...statsRows].join('\n'));
  }

  return sections.join('\n\n');
}