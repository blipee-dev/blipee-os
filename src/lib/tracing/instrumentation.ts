/**
 * OpenTelemetry Instrumentation Setup
 * Phase 4, Task 4.2: Auto-instrumentation configuration
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { DiagConsoleLogger, DiagLogLevel, diag } from '@opentelemetry/api';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { logger } from '@/lib/logging';

/**
 * Initialize OpenTelemetry instrumentation
 */
export function initializeInstrumentation() {
  // Enable OpenTelemetry diagnostics in development
  if (process.env.NODE_ENV === 'development') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  // Configure resource
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'blipee-os',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.OTEL_SERVICE_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      [SemanticResourceAttributes.SERVICE_INSTANCE_ID]: process.env.HOSTNAME || 'local',
      // Custom attributes
      'service.component': 'backend',
      'service.platform': 'vercel',
      'service.runtime': 'nodejs'
    })
  );

  // Configure trace exporter
  const traceExporter = new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? 
      JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : undefined,
    timeoutMillis: 5000
  });

  // Configure metric exporter
  const metricExporter = new OTLPMetricExporter({
    url: process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
    headers: process.env.OTEL_EXPORTER_OTLP_HEADERS ? 
      JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS) : undefined,
    timeoutMillis: 5000
  });

  // Configure instrumentations
  const instrumentations = [
    ...getNodeAutoInstrumentations({
      // Disable some instrumentations that might be too verbose
      '@opentelemetry/instrumentation-fs': {
        enabled: false
      },
      '@opentelemetry/instrumentation-dns': {
        enabled: false
      },
      '@opentelemetry/instrumentation-net': {
        enabled: false
      },
      // Configure HTTP instrumentation
      '@opentelemetry/instrumentation-http': {
        requestHook: (span, request) => {
          // Add custom attributes to HTTP spans
          const url = request.url || '';
          if (url.includes('/api/')) {
            span.setAttribute('http.route.type', 'api');
          }
          if (url.includes('/ai/')) {
            span.setAttribute('http.route.category', 'ai');
          }
        },
        responseHook: (span, response) => {
          // Add response size if available
          const contentLength = response.headers?.['content-length'];
          if (contentLength) {
            span.setAttribute('http.response.size', parseInt(contentLength as string, 10));
          }
        },
        ignoreIncomingPaths: [
          /^\/_next/,
          /^\/favicon.ico/,
          /^\/health/,
          /^\/api\/health/
        ],
        ignoreOutgoingUrls: [
          /^https?:\/\/localhost:4318/ // Ignore OTLP exporter
        ]
      },
      // Configure Fetch instrumentation
      '@opentelemetry/instrumentation-fetch': {
        ignoreUrls: [
          /^https?:\/\/localhost:4318/,
          /^https?:\/\/.*\.vercel\.app\/_next/
        ],
        propagateTraceHeaderCorsUrls: [
          /.*/  // Propagate trace headers to all URLs
        ]
      }
    }),
    // Add Prisma instrumentation
    new PrismaInstrumentation({
      middleware: true
    }),
    // Add custom Next.js instrumentation
    createNextJsInstrumentation()
  ];

  // Create SDK
  const sdk = new NodeSDK({
    resource,
    spanProcessor: new BatchSpanProcessor(traceExporter, {
      maxQueueSize: 100,
      maxExportBatchSize: 10,
      scheduledDelayMillis: 500,
      exportTimeoutMillis: 5000
    }),
    metricReader: new PeriodicExportingMetricReader({
      exporter: metricExporter,
      exportIntervalMillis: 60000 // Export metrics every minute
    }),
    instrumentations
  });

  // Initialize SDK
  sdk.start()
    .then(() => {
      logger.info('OpenTelemetry instrumentation initialized', {
        serviceName: process.env.OTEL_SERVICE_NAME || 'blipee-os',
        environment: process.env.NODE_ENV,
        exporterEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318'
      });
    })
    .catch((error) => {
      logger.error('Failed to initialize OpenTelemetry', error as Error);
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk.shutdown()
      .then(() => logger.info('OpenTelemetry SDK shut down successfully'))
      .catch((error) => logger.error('Error shutting down OpenTelemetry SDK', error as Error))
      .finally(() => process.exit(0));
  });

  return sdk;
}

/**
 * Custom Next.js instrumentation
 */
function createNextJsInstrumentation() {
  // This is a placeholder for custom Next.js instrumentation
  // In a real implementation, this would hook into Next.js internals
  return {
    enable() {
      logger.debug('Next.js instrumentation enabled');
    },
    disable() {
      logger.debug('Next.js instrumentation disabled');
    }
  };
}

/**
 * Check if instrumentation should be enabled
 */
export function shouldEnableInstrumentation(): boolean {
  // Disable in test environment by default
  if (process.env.NODE_ENV === 'test' && process.env.OTEL_ENABLED !== 'true') {
    return false;
  }

  // Check if explicitly disabled
  if (process.env.OTEL_ENABLED === 'false') {
    return false;
  }

  // Check if endpoint is configured
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT && process.env.NODE_ENV === 'production') {
    logger.warn('OpenTelemetry endpoint not configured, disabling instrumentation');
    return false;
  }

  return true;
}

/**
 * Initialize instrumentation if enabled
 */
if (shouldEnableInstrumentation()) {
  initializeInstrumentation();
}