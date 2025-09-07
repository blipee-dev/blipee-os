/**
 * OpenTelemetry Tracer Configuration
 * Phase 4, Task 4.2: Distributed Tracing Implementation
 */

import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import type { Span, SpanOptions, Context, Tracer } from '@opentelemetry/api';
import { logger } from '@/lib/logging';

export interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  samplingRate: number;
}

/**
 * Custom span attributes for blipee-os
 */
export interface BlipeeSpanAttributes {
  userId?: string;
  organizationId?: string;
  buildingId?: string;
  aiProvider?: string;
  aiModel?: string;
  operationType?: string;
  cacheHit?: boolean;
  queuePosition?: number;
  tokenCount?: number;
  cost?: number;
}

/**
 * Tracer wrapper for blipee-os
 */
export class BlipeeTracer {
  private tracer: Tracer;
  private config: TracingConfig;

  constructor(config: TracingConfig) {
    this.config = config;
    this.tracer = trace.getTracer(
      config.serviceName,
      config.serviceVersion
    );
  }

  /**
   * Start a new span
   */
  startSpan(
    name: string,
    options?: SpanOptions & { attributes?: BlipeeSpanAttributes }
  ): Span {
    const span = this.tracer.startSpan(name, {
      ...options,
      attributes: {
        'service.name': this.config.serviceName,
        'service.version': this.config.serviceVersion,
        'deployment.environment': this.config.environment,
        ...this.flattenAttributes(options?.attributes || {})
      }
    });

    // Log span creation in debug mode
    logger.debug('Span started', {
      spanId: span.spanContext().spanId,
      traceId: span.spanContext().traceId,
      name
    });

    return span;
  }

  /**
   * Start an active span that automatically manages context
   */
  async startActiveSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: SpanOptions & { attributes?: BlipeeSpanAttributes }
  ): Promise<T> {
    return this.tracer.startActiveSpan(name, options || {}, async (span) => {
      try {
        // Set initial attributes
        if (options?.attributes) {
          this.setSpanAttributes(span, options.attributes);
        }

        const result = await fn(span);
        span.setStatus({ code: SpanStatusCode.OK });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });
        throw error;
      } finally {
        span.end();
      }
    });
  }

  /**
   * Get the current active span
   */
  getActiveSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  /**
   * Set attributes on a span
   */
  setSpanAttributes(span: Span, attributes: BlipeeSpanAttributes): void {
    const flattened = this.flattenAttributes(attributes);
    Object.entries(flattened).forEach(([key, value]) => {
      if (value !== undefined) {
        span.setAttribute(key, value);
      }
    });
  }

  /**
   * Record an event on the current span
   */
  recordEvent(name: string, attributes?: Record<string, any>): void {
    const span = this.getActiveSpan();
    if (span) {
      span.addEvent(name, this.flattenAttributes(attributes || {}));
    }
  }

  /**
   * Create a child span context
   */
  createChildContext(parentContext?: Context): Context {
    return parentContext || context.active();
  }

  /**
   * Run a function with a specific context
   */
  async runWithContext<T>(
    ctx: Context,
    fn: () => Promise<T>
  ): Promise<T> {
    return context.with(ctx, fn);
  }

  /**
   * Flatten nested attributes for OpenTelemetry
   */
  private flattenAttributes(
    obj: Record<string, any>,
    prefix = ''
  ): Record<string, string | number | boolean> {
    const flattened: Record<string, string | number | boolean> = {};

    Object.entries(obj).forEach(([key, value]) => {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value === null || value === undefined) {
        return;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenAttributes(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = JSON.stringify(value);
      } else if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        flattened[newKey] = value;
      } else {
        flattened[newKey] = String(value);
      }
    });

    return flattened;
  }
}

/**
 * Create tracer instance
 */
export function createTracer(config?: Partial<TracingConfig>): BlipeeTracer {
  const defaultConfig: TracingConfig = {
    serviceName: process.env.OTEL_SERVICE_NAME || 'blipee-os',
    serviceVersion: process.env.OTEL_SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    samplingRate: parseFloat(process.env.OTEL_SAMPLING_RATE || '1.0')
  };

  return new BlipeeTracer({ ...defaultConfig, ...config });
}

/**
 * Global tracer instance
 */
export const tracer = createTracer();

/**
 * Decorator for tracing methods
 */
export function Trace(
  spanName?: string,
  options?: SpanOptions & { attributes?: BlipeeSpanAttributes }
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return tracer.startActiveSpan(
        name,
        async (span) => {
          // Add method metadata
          span.setAttribute('code.function', propertyKey);
          span.setAttribute('code.namespace', target.constructor.name);

          return originalMethod.apply(this, args);
        },
        options
      );
    };

    return descriptor;
  };
}

/**
 * Trace async operations
 */
export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: BlipeeSpanAttributes
): Promise<T> {
  return tracer.startActiveSpan(name, fn, {
    kind: SpanKind.INTERNAL,
    attributes
  });
}

/**
 * Trace HTTP requests
 */
export async function traceHttpRequest<T>(
  method: string,
  url: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `HTTP ${method}`,
    fn,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': method,
        'http.url': url,
        'http.scheme': new URL(url).protocol.replace(':', ''),
        'http.host': new URL(url).host,
        'http.target': new URL(url).pathname
      }
    }
  );
}

/**
 * Trace database operations
 */
export async function traceDatabaseQuery<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `DB ${operation}`,
    fn,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': operation,
        'db.sql.table': table
      }
    }
  );
}