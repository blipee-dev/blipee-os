import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PeriodicExportingMetricReader, ConsoleMetricExporter } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

export class TelemetryService {
  private static instance: TelemetryService;
  private sdk: NodeSDK | null = null;
  private customMetrics: Map<string, any> = new Map();
  private isInitialized = false;

  private constructor() {}

  static getInstance(): TelemetryService {
    if (!TelemetryService.instance) {
      TelemetryService.instance = new TelemetryService();
    }
    return TelemetryService.instance;
  }

  /**
   * Initialize OpenTelemetry SDK
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('⚡ Telemetry already initialized');
      return;
    }

    try {
      console.log('📊 Initializing OpenTelemetry...');

      // Configure resource
      const resource = Resource.default().merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: 'blipee-os',
          [SemanticResourceAttributes.SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          deployment: process.env.VERCEL_ENV || 'local'
        })
      );

      // Configure trace exporter
      const traceExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPTraceExporter({
            url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
            headers: {
              'api-key': process.env.OTEL_API_KEY || ''
            }
          })
        : undefined;

      // Configure metric exporters
      const metricExporter = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPMetricExporter({
            url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
            headers: {
              'api-key': process.env.OTEL_API_KEY || ''
            }
          })
        : new ConsoleMetricExporter();

      // Prometheus exporter for local metrics
      const prometheusExporter = new PrometheusExporter(
        {
          port: 9464,
          endpoint: '/metrics',
        },
        () => {
          console.log('✅ Prometheus metrics available at http://localhost:9464/metrics');
        }
      );

      // Initialize SDK
      this.sdk = new NodeSDK({
        resource,
        traceExporter: traceExporter ? new BatchSpanProcessor(traceExporter) : undefined,
        metricReader: new PeriodicExportingMetricReader({
          exporter: metricExporter,
          exportIntervalMillis: 30000, // 30 seconds
        }),
        instrumentations: [
          getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': {
              enabled: false, // Disable fs instrumentation to reduce noise
            },
          }),
        ],
      });

      // Start SDK
      await this.sdk.start();
      this.isInitialized = true;

      // Register custom metrics
      this.registerCustomMetrics();

      console.log('✅ OpenTelemetry initialized successfully');

      // Graceful shutdown
      process.on('SIGTERM', () => {
        this.shutdown();
      });

    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error);
      // Don't throw - monitoring should not break the app
    }
  }

  /**
   * Register custom application metrics
   */
  private registerCustomMetrics(): void {
    const { metrics } = require('@opentelemetry/api');
    const meter = metrics.getMeter('blipee-os', '1.0.0');

    // Agent metrics
    this.customMetrics.set('agent_executions', meter.createCounter('agent_executions_total', {
      description: 'Total number of agent executions',
    }));

    this.customMetrics.set('agent_errors', meter.createCounter('agent_errors_total', {
      description: 'Total number of agent errors',
    }));

    this.customMetrics.set('agent_duration', meter.createHistogram('agent_execution_duration_seconds', {
      description: 'Agent execution duration in seconds',
    }));

    // ML metrics
    this.customMetrics.set('ml_predictions', meter.createCounter('ml_predictions_total', {
      description: 'Total number of ML predictions',
    }));

    this.customMetrics.set('ml_latency', meter.createHistogram('ml_prediction_latency_ms', {
      description: 'ML prediction latency in milliseconds',
    }));

    this.customMetrics.set('ml_accuracy', meter.createGauge('ml_model_accuracy', {
      description: 'Current ML model accuracy',
    }));

    // API metrics
    this.customMetrics.set('api_requests', meter.createCounter('api_requests_total', {
      description: 'Total number of API requests',
    }));

    this.customMetrics.set('api_errors', meter.createCounter('api_errors_total', {
      description: 'Total number of API errors',
    }));

    this.customMetrics.set('api_latency', meter.createHistogram('api_request_duration_ms', {
      description: 'API request duration in milliseconds',
    }));

    // Network metrics
    this.customMetrics.set('network_connections', meter.createGauge('network_connections_active', {
      description: 'Number of active network connections',
    }));

    this.customMetrics.set('benchmarks_performed', meter.createCounter('benchmarks_performed_total', {
      description: 'Total number of benchmarks performed',
    }));

    // Business metrics
    this.customMetrics.set('user_messages', meter.createCounter('user_messages_total', {
      description: 'Total number of user messages processed',
    }));

    this.customMetrics.set('emissions_tracked', meter.createCounter('emissions_tracked_kg', {
      description: 'Total emissions tracked in kg CO2e',
    }));

    this.customMetrics.set('active_organizations', meter.createGauge('organizations_active', {
      description: 'Number of active organizations',
    }));
  }

  /**
   * Record agent execution metrics
   */
  recordAgentExecution(agentId: string, duration: number, success: boolean): void {
    const labels = { agent: agentId, status: success ? 'success' : 'error' };
    
    this.customMetrics.get('agent_executions')?.add(1, labels);
    this.customMetrics.get('agent_duration')?.record(duration / 1000, labels);
    
    if (!success) {
      this.customMetrics.get('agent_errors')?.add(1, { agent: agentId });
    }
  }

  /**
   * Record ML prediction metrics
   */
  recordMLPrediction(modelType: string, latency: number, confidence: number): void {
    const labels = { model: modelType };
    
    this.customMetrics.get('ml_predictions')?.add(1, labels);
    this.customMetrics.get('ml_latency')?.record(latency, labels);
    this.customMetrics.get('ml_accuracy')?.record(confidence, labels);
  }

  /**
   * Record API request metrics
   */
  recordAPIRequest(endpoint: string, method: string, duration: number, status: number): void {
    const labels = { endpoint, method, status: status.toString() };
    
    this.customMetrics.get('api_requests')?.add(1, labels);
    this.customMetrics.get('api_latency')?.record(duration, labels);
    
    if (status >= 400) {
      this.customMetrics.get('api_errors')?.add(1, { endpoint, method });
    }
  }

  /**
   * Record network activity
   */
  recordNetworkActivity(type: 'connection' | 'benchmark' | 'insight', organizationId: string): void {
    switch (type) {
      case 'connection':
        this.customMetrics.get('network_connections')?.record(1, { organization: organizationId });
        break;
      case 'benchmark':
        this.customMetrics.get('benchmarks_performed')?.add(1, { organization: organizationId });
        break;
    }
  }

  /**
   * Record business metrics
   */
  recordBusinessMetric(type: 'message' | 'emissions' | 'organization', value: number, labels?: any): void {
    switch (type) {
      case 'message':
        this.customMetrics.get('user_messages')?.add(1, labels);
        break;
      case 'emissions':
        this.customMetrics.get('emissions_tracked')?.add(value, labels);
        break;
      case 'organization':
        this.customMetrics.get('active_organizations')?.record(value);
        break;
    }
  }

  /**
   * Create a custom span for tracing
   */
  createSpan(name: string, attributes?: any): any {
    const { trace } = require('@opentelemetry/api');
    const tracer = trace.getTracer('blipee-os');
    return tracer.startSpan(name, { attributes });
  }

  /**
   * Wrap async function with tracing
   */
  async traceAsync<T>(
    name: string,
    fn: () => Promise<T>,
    attributes?: any
  ): Promise<T> {
    const span = this.createSpan(name, attributes);
    
    try {
      const result = await fn();
      span.setStatus({ code: 1 }); // OK
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error.message }); // ERROR
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Get current metrics snapshot
   */
  async getMetricsSnapshot(): Promise<any> {
    // This would connect to Prometheus endpoint
    try {
      const response = await fetch('http://localhost:9464/metrics');
      const text = await response.text();
      
      // Parse Prometheus format
      const metrics: any = {};
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        
        const match = line.match(/^(\w+)(?:{(.+)})?\s+(.+)$/);
        if (match) {
          const [, name, labels, value] = match;
          metrics[name] = parseFloat(value);
        }
      }
      
      return metrics;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      return {};
    }
  }

  /**
   * Shutdown telemetry gracefully
   */
  async shutdown(): Promise<void> {
    console.log('📊 Shutting down telemetry...');
    
    if (this.sdk) {
      await this.sdk.shutdown();
      this.isInitialized = false;
    }
    
    console.log('✅ Telemetry shut down');
  }
}

// Export singleton instance
export const telemetry = TelemetryService.getInstance();