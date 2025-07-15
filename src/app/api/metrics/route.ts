import { NextResponse } from 'next/server';
import { telemetry } from '@/lib/monitoring/telemetry';

export async function GET() {
  try {
    // Initialize telemetry if needed
    await telemetry.initialize();
    
    // Get metrics snapshot
    const metrics = await telemetry.getMetricsSnapshot();
    
    // Return Prometheus-style metrics
    return new Response(formatPrometheusMetrics(metrics), {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4'
      }
    });
  } catch (error) {
    console.error('Metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

function formatPrometheusMetrics(metrics: any): string {
  let output = '';
  
  // Add metadata
  output += '# HELP blipee_os_info Application information\n';
  output += '# TYPE blipee_os_info gauge\n';
  output += `blipee_os_info{version="${process.env.npm_package_version || '1.0.0'}",environment="${process.env.NODE_ENV || 'development'}"} 1\n\n`;
  
  // Format each metric
  for (const [name, value] of Object.entries(metrics)) {
    if (typeof value === 'number') {
      output += `# HELP ${name} Auto-generated metric\n`;
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${value}\n\n`;
    }
  }
  
  return output;
}