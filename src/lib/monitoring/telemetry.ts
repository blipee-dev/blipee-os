import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { Resource } from '@opentelemetry/resources';
import { 
  SEMRESATTRS_SERVICE_NAME, 
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
// import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { logger } from '@/lib/logger';

// Telemetry configuration
export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  otlpEndpoint?: string | undefined;
  enabled: boolean;
}

const defaultConfig: TelemetryConfig = {
  serviceName: 'blipee-os',
  serviceVersion: process.env['npm_package_version'] || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  otlpEndpoint: process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] || undefined,
  enabled: process.env['OTEL_ENABLED'] === 'true'
};

let sdk: NodeSDK | null = null;

/**
 * Initialize OpenTelemetry
 */
export function initializeTelemetry(config: Partial<TelemetryConfig> = {}): void {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!finalConfig.enabled) {
    logger.info('OpenTelemetry is disabled');
    return;
  }
  
  if (!finalConfig.otlpEndpoint) {
    logger.warn('OTLP endpoint not configured, using console exporter');
  }
  
  try {
    // Create resource
    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: finalConfig.serviceName,
      [SEMRESATTRS_SERVICE_VERSION]: finalConfig.serviceVersion,
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: finalConfig.environment,
      'service.instance.id': process.env['DYNO'] || 'local',
      'host.name': process.env['HOSTNAME'] || 'localhost'
    });
    
    // Create trace exporter
    const traceExporter = finalConfig.otlpEndpoint
      ? new OTLPTraceExporter({
          url: `${finalConfig.otlpEndpoint}/v1/traces`,
          headers: {
            'api-key': process.env['OTEL_API_KEY'] || ''
          }
        })
      : undefined;
    
    // Create SDK
    sdk = new NodeSDK({
      resource,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': {
            requestHook: (span, request: any) => {
              span.setAttributes({
                'http.request.body.size': request.headers?.['content-length'] || 0
              });
            }
          },
          '@opentelemetry/instrumentation-express': {
            requestHook: (span, info) => {
              span.setAttributes({
                'express.route': info.route || 'unknown'
              });
            }
          },
          '@opentelemetry/instrumentation-pg': {
            enhancedDatabaseReporting: true
          }
        })
      ],
      spanProcessors: traceExporter ? [
        new BatchSpanProcessor(traceExporter, {
          maxQueueSize: 1000,
          maxExportBatchSize: 512,
          scheduledDelayMillis: 5000,
          exportTimeoutMillis: 30000
        })
      ] : []
    });
    
    // Initialize SDK
    sdk.start();
    
    logger.info('OpenTelemetry initialized', {
      serviceName: finalConfig.serviceName,
      environment: finalConfig.environment,
      endpoint: finalConfig.otlpEndpoint || 'console'
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk?.shutdown()
        .then(() => logger.info('OpenTelemetry terminated'))
        .catch((error) => logger.error('Error terminating OpenTelemetry', error))
        .finally(() => process.exit(0));
    });
    
  } catch (error) {
    logger.error('Failed to initialize OpenTelemetry', error);
  }
}

/**
 * Shutdown OpenTelemetry
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.info('OpenTelemetry shut down successfully');
    } catch (error) {
      logger.error('Error shutting down OpenTelemetry', error);
    }
  }
}

/**
 * Get the OpenTelemetry SDK instance
 */
export function getTelemetrySDK(): NodeSDK | null {
  return sdk;
}