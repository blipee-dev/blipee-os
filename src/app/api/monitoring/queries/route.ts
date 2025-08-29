import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

/**
 * @swagger
 * /api/monitoring/queries:
 *   get:
 *     summary: Get query monitoring data
 *     description: Retrieve slow queries, insights, patterns, and database statistics
 *     tags:
 *       - Monitoring
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [slow_queries, insights, patterns, health, stats, report]
 *         description: Type of monitoring data to retrieve
 *       - in: query
 *         name: threshold_ms
 *         schema:
 *           type: number
 *         description: Threshold for slow queries in milliseconds (default 100)
 *       - in: query
 *         name: hours
 *         schema:
 *           type: number
 *         description: Hours to look back for insights (default 24, max 168)
 *       - in: query
 *         name: days
 *         schema:
 *           type: number
 *         description: Days to analyze for patterns (default 7, max 30)
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *         description: Report format (only for type=report)
 *     responses:
 *       200:
 *         description: Query monitoring data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 */
export async function GET((_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!member || member.role !== 'account_owner') {
      return NextResponse.json(
        { _error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    
    switch (type) {
      case 'slow_queries': {
        const params = slowQueriesSchema.parse({
          threshold_ms: Number(searchParams.get('threshold_ms') || 100)
        });
        
        const data = await queryMonitor.getSlowQueries(params.threshold_ms);
        return NextResponse.json({ data });
      }
      
      case 'insights': {
        const params = insightsSchema.parse({
          hours: Number(searchParams.get('hours') || 24)
        });
        
        const data = await queryMonitor.getQueryInsights(params.hours);
        return NextResponse.json({ data });
      }
      
      case 'patterns': {
        const params = patternsSchema.parse({
          days: Number(searchParams.get('days') || 7)
        });
        
        const data = await queryMonitor.analyzeQueryPatterns(params.days);
        return NextResponse.json({ data });
      }
      
      case 'health': {
        const data = await queryMonitor.checkDatabaseHealth();
        return NextResponse.json({ data });
      }
      
      case 'stats': {
        const data = await queryMonitor.getDatabaseStats();
        return NextResponse.json({ data });
      }
      
      case 'report': {
        const format = (searchParams.get('format') || 'json') as 'json' | 'csv';
        const report = await queryMonitor.exportReport(format);
        
        if (format === 'csv') {
          return new NextResponse(report, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="query-report-${new Date().toISOString().split('T')[0]}.csv"`
            }
          });
        }
        
        return NextResponse.json(JSON.parse(report));
      }
      
      default:
        return NextResponse.json(
          { _error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error in query monitoring API', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { _error: 'Invalid parameters', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { _error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/monitoring/queries:
 *   post:
 *     summary: Control query monitoring
 *     description: Start or stop automatic query monitoring
 *     tags:
 *       - Monitoring
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [start, stop]
 *                 description: Monitoring action
 *               interval_minutes:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 60
 *                 default: 5
 *                 description: Monitoring interval in minutes (only for start action)
 *     responses:
 *       200:
 *         description: Monitoring action completed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - requires admin role
 */
export async function POST((_request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { _error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (!member || member.role !== 'account_owner') {
      return NextResponse.json(
        { _error: 'Forbidden - admin access required' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { action, interval_minutes = 5 } = body;
    
    switch (action) {
      case 'start':
        await queryMonitor.startMonitoring(interval_minutes);
        return NextResponse.json({
          message: `Query monitoring started with ${interval_minutes} minute interval`
        });
      
      case 'stop':
        queryMonitor.stopMonitoring();
        return NextResponse.json({
          message: 'Query monitoring stopped'
        });
      
      default:
        return NextResponse.json(
          { _error: 'Invalid action. Use "start" or "stop"' },
          { status: 400 }
        );
    }
  } catch (error) {
    logger.error('Error controlling query monitoring', error);
    return NextResponse.json(
      { _error: 'Internal server error' },
      { status: 500 }
    );
  }
}