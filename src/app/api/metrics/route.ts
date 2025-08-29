import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { metrics } from '@/lib/monitoring/metrics';
import { logger } from '@/lib/logger';

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Get application metrics
 *     description: Retrieve application performance metrics in JSON or Prometheus format
 *     tags:
 *       - Monitoring
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, prometheus]
 *           default: json
 *         description: Output format for metrics
 *     responses:
 *       200:
 *         description: Application metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 counters:
 *                   type: object
 *                   description: Counter metrics
 *                 gauges:
 *                   type: object
 *                   description: Gauge metrics
 *                 histograms:
 *                   type: object
 *                   description: Histogram metrics with statistics
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *           text/plain:
 *             schema:
 *               type: string
 *               description: Prometheus-formatted metrics
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
    
    // Get format parameter
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    
    // Clear old histogram data to prevent memory issues
    metrics.clearOldHistogramData();
    
    if (format === 'prometheus') {
      // Return Prometheus-formatted metrics
      const prometheusMetrics = metrics.getPrometheusMetrics();
      
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; version=0.0.4',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    } else {
      // Return JSON metrics
      const jsonMetrics = metrics.getAllMetrics();
      
      return NextResponse.json(jsonMetrics, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }
    
  } catch (error) {
    logger.error('Error fetching metrics', error);
    return NextResponse.json(
      { _error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/metrics/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Simple health check for monitoring services
 *     tags:
 *       - Monitoring
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Uptime in seconds
 *                 version:
 *                   type: string
 */
export async function healthCheck() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}