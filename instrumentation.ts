export async function register() {
  if (process.env['NEXT_RUNTIME'] === 'nodejs') {
    // Only initialize on the server (not in Edge runtime)
    
    // Check if instrumentation should be enabled
    const shouldEnable = 
      process.env['OTEL_ENABLED'] !== 'false' &&
      process.env.NODE_ENV !== 'test';

    if (shouldEnable) {
      try {
        // Initialize OpenTelemetry instrumentation for distributed tracing
        const { initializeInstrumentation } = await import('@/lib/tracing/instrumentation');
        initializeInstrumentation();
        
        console.log('[OpenTelemetry] Distributed tracing initialized:', {
          service: process.env['OTEL_SERVICE_NAME'] || 'blipee-os',
          version: process.env['OTEL_SERVICE_VERSION'] || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          endpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || 'http://localhost:4318'
        });
      } catch (error) {
        console.error('[OpenTelemetry] Failed to initialize tracing:', error);
      }

      try {
        // Initialize legacy telemetry if it exists
        const { initializeTelemetry } = await import('@/lib/monitoring/telemetry');
        
        initializeTelemetry({
          enabled: true,
          serviceName: 'blipee-os',
          environment: process.env.NODE_ENV || 'development',
          otlpEndpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT']
        });
      } catch (error) {
        // Legacy telemetry might not exist, which is fine
        console.debug('[Telemetry] Legacy telemetry not found, using OpenTelemetry only');
      }
    } else {
      console.log('[OpenTelemetry] Instrumentation disabled:', {
        otelEnabled: process.env['OTEL_ENABLED'],
        nodeEnv: process.env.NODE_ENV
      });
    }
  }
}