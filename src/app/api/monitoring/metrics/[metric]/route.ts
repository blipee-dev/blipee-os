import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '@/lib/monitoring/service';
import os from 'os';

export async function GET(
  request: NextRequest,
  { params }: { params: { metric: string } }
) {
  try {
    const { metric } = params;
    let value: number = 0;

    switch (metric) {
      case 'cpu': {
        const cpus = os.cpus();
        const totalIdle = cpus.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalTick = cpus.reduce((acc, cpu) => {
          return acc + cpu.times.user + cpu.times.nice + cpu.times.sys + cpu.times.idle + cpu.times.irq;
        }, 0);
        value = 100 - ~~(100 * totalIdle / totalTick);

        // Record metric
        await monitoringService.recordMetric({
          name: 'system_cpu_usage_percent',
          value,
          type: 'gauge' as any,
          timestamp: new Date(),
        });
        break;
      }

      case 'memory': {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        value = ((totalMem - freeMem) / totalMem) * 100;

        await monitoringService.recordMetric({
          name: 'system_memory_usage_percent',
          value,
          type: 'gauge' as any,
          timestamp: new Date(),
        });
        break;
      }

      case 'requests': {
        // Get request rate from monitoring service
        const metrics = monitoringService.getMetrics(
          'http_requests_total',
          undefined,
          new Date(Date.now() - 60000)
        );
        value = metrics.length / 60; // requests per second
        break;
      }

      case 'response-time': {
        // Get average response time
        const metrics = monitoringService.getMetrics(
          'http_response_time_ms',
          undefined,
          new Date(Date.now() - 60000)
        );
        if (metrics.length > 0) {
          value = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        }
        break;
      }

      case 'errors': {
        // Get error rate
        const totalMetrics = monitoringService.getMetrics(
          'http_requests_total',
          undefined,
          new Date(Date.now() - 60000)
        );
        const errorMetrics = monitoringService.getMetrics(
          'http_errors_total',
          undefined,
          new Date(Date.now() - 60000)
        );

        const total = totalMetrics.reduce((sum, m) => sum + m.value, 0);
        const errors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
        value = total > 0 ? (errors / total) * 100 : 0;
        break;
      }

      case 'cache-hits': {
        // Get cache hit rate
        const hitMetrics = monitoringService.getMetrics(
          'cache_hits_total',
          undefined,
          new Date(Date.now() - 60000)
        );
        const missMetrics = monitoringService.getMetrics(
          'cache_misses_total',
          undefined,
          new Date(Date.now() - 60000)
        );

        const hits = hitMetrics.reduce((sum, m) => sum + m.value, 0);
        const misses = missMetrics.reduce((sum, m) => sum + m.value, 0);
        const total = hits + misses;
        value = total > 0 ? (hits / total) * 100 : 0;
        break;
      }

      case 'disk': {
        // Get disk usage (simplified - would need more complex logic for real usage)
        value = Math.random() * 100; // Placeholder for actual disk usage

        await monitoringService.recordMetric({
          name: 'system_disk_usage_percent',
          value,
          type: 'gauge' as any,
          timestamp: new Date(),
        });
        break;
      }

      case 'connections': {
        // Get active connections (simplified)
        value = Math.floor(Math.random() * 100) + 50; // Placeholder

        await monitoringService.recordMetric({
          name: 'active_connections',
          value,
          type: 'gauge' as any,
          timestamp: new Date(),
        });
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown metric: ${metric}` },
          { status: 404 }
        );
    }

    return NextResponse.json({
      metric,
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Metric fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metric' },
      { status: 500 }
    );
  }
}