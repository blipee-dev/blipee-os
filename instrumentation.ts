export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    // Only initialize telemetry on the server
    const { initializeTelemetry } = await import('@/lib/monitoring/telemetry');
    
    initializeTelemetry({
      enabled: process.env['OTEL_ENABLED'] === 'true',
      serviceName: 'blipee-os',
      environment: process.env.NODE_ENV || 'development',
      otlpEndpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT']
    });
  }
}