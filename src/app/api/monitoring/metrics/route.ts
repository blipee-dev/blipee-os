import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { monitoringService } from '@/lib/monitoring';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const timeRange = searchParams.get('range') || '1h';

    // Get monitoring dashboard data
    const dashboard = await monitoringService.getDashboard();
    
    // Get system metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };

    if (format === 'prometheus') {
      // Return Prometheus format
      let prometheusOutput = '';
      
      // System metrics
      prometheusOutput += `# HELP nodejs_memory_heap_used_bytes Node.js heap memory used\n`;
      prometheusOutput += `# TYPE nodejs_memory_heap_used_bytes gauge\n`;
      prometheusOutput += `nodejs_memory_heap_used_bytes ${systemMetrics.memory.heapUsed}\n`;
      
      prometheusOutput += `# HELP nodejs_memory_heap_total_bytes Node.js heap memory total\n`;
      prometheusOutput += `# TYPE nodejs_memory_heap_total_bytes gauge\n`;
      prometheusOutput += `nodejs_memory_heap_total_bytes ${systemMetrics.memory.heapTotal}\n`;
      
      prometheusOutput += `# HELP nodejs_process_uptime_seconds Node.js process uptime\n`;
      prometheusOutput += `# TYPE nodejs_process_uptime_seconds gauge\n`;
      prometheusOutput += `nodejs_process_uptime_seconds ${systemMetrics.uptime}\n`;
      
      // Application metrics
      prometheusOutput += `# HELP http_requests_total Total HTTP requests\n`;
      prometheusOutput += `# TYPE http_requests_total counter\n`;
      prometheusOutput += `http_requests_total ${dashboard.metrics.requests.total}\n`;
      
      prometheusOutput += `# HELP http_requests_success_total Successful HTTP requests\n`;
      prometheusOutput += `# TYPE http_requests_success_total counter\n`;
      prometheusOutput += `http_requests_success_total ${dashboard.metrics.requests.success}\n`;
      
      prometheusOutput += `# HELP http_response_time_avg_seconds Average HTTP response time\n`;
      prometheusOutput += `# TYPE http_response_time_avg_seconds gauge\n`;
      prometheusOutput += `http_response_time_avg_seconds ${dashboard.metrics.performance.avgResponseTime / 1000}\n`;
      
      return new Response(prometheusOutput, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Return JSON format with comprehensive metrics
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      timeRange,
      system: systemMetrics,
      application: dashboard,
      endpoints: {
        health: '/api/monitoring/health',
        alerts: '/api/monitoring/alerts',
        prometheus: '/api/monitoring/metrics?format=prometheus',
      },
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { metric, value, labels, type = 'gauge' } = body;

    if (!metric || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Record custom metric through monitoring service
    await monitoringService.recordMetric({
      name: metric,
      type: type as any,
      value,
      labels,
      timestamp: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Metric recorded successfully',
    });
  } catch (error) {
    console.error('Error recording metric:', error);
    return NextResponse.json(
      { error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

// Configure dynamic rendering
export const dynamic = 'force-dynamic';