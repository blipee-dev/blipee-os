import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import type { Span, Tracer, SpanOptions } from '@opentelemetry/api';
import { logger } from '@/lib/logger';

// Get tracer
const tracer: Tracer = trace.getTracer('blipee-os', '1.0.0');

/**
 * Trace a function execution
 */
export function traceFunction<T extends (...args: any[]) => any>(
  name: string,
  fn: T,
  options?: SpanOptions
): T {
  return ((...args: Parameters<T>) => {
    return tracer.startActiveSpan(name, options || {}, (span) => {
      try {
        const result = fn(...args);
        
        // Handle promises
        if (result instanceof Promise) {
          return result
            .then((value) => {
              span.setStatus({ code: SpanStatusCode.OK });
              return value;
            })
            .catch((error) => {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message
              });
              throw error;
            })
            .finally(() => {
              span.end();
            });
        }
        
        span.setStatus({ code: SpanStatusCode.OK });
        span.end();
        return result;
        
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: (error as Error).message
        });
        span.end();
        throw error;
      }
    });
  }) as T;
}

/**
 * Decorator for tracing class methods
 */
export function Trace(spanName?: string, options?: SpanOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = spanName || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = traceFunction(name, originalMethod, options);
    
    return descriptor;
  };
}

/**
 * Trace an async operation
 */
export async function traceAsync<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  const span = tracer.startSpan(name);
  
  if (attributes) {
    span.setAttributes(attributes);
  }
  
  try {
    const result = await fn();
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
}

/**
 * Trace a database query
 */
export async function traceDbQuery<T>(
  operation: string,
  table: string,
  query: () => Promise<T>
): Promise<T> {
  return traceAsync(
    `db.${operation}`,
    query,
    {
      'db.system': 'postgresql',
      'db.operation': operation,
      'db.table': table,
      kind: SpanKind.CLIENT
    }
  );
}

/**
 * Trace an API call
 */
export async function traceApiCall<T>(
  method: string,
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return traceAsync(
    `api.${method} ${endpoint}`,
    fn,
    {
      'http.method': method,
      'http.route': endpoint,
      'http.scheme': 'https',
      kind: SpanKind.SERVER
    }
  );
}

/**
 * Trace AI provider calls
 */
export async function traceAiCall<T>(
  provider: string,
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  return traceAsync(
    `ai.${provider}.${operation}`,
    fn,
    {
      'ai.provider': provider,
      'ai.operation': operation,
      ...metadata,
      kind: SpanKind.CLIENT
    }
  );
}

/**
 * Trace cache operations
 */
export async function traceCacheOperation<T>(
  operation: 'get' | 'set' | 'delete' | 'invalidate',
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const span = tracer.startSpan(`cache.${operation}`);
  span.setAttributes({
    'cache.operation': operation,
    'cache.key': key,
    kind: SpanKind.CLIENT
  });
  
  try {
    const result = await fn();
    
    // Set cache hit/miss for get operations
    if (operation === 'get') {
      span.setAttribute('cache.hit', result !== null && result !== undefined);
    }
    
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
}

/**
 * Create a custom span
 */
export function createSpan(name: string, options?: SpanOptions): Span {
  return tracer.startSpan(name, options);
}

/**
 * Get the active span
 */
export function getActiveSpan(): Span | undefined {
  return trace.getActiveSpan();
}

/**
 * Add attributes to the active span
 */
export function addSpanAttributes(attributes: Record<string, any>): void {
  const span = getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

/**
 * Record an event on the active span
 */
export function recordSpanEvent(name: string, attributes?: Record<string, any>): void {
  const span = getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

/**
 * Measure execution time
 */
export function measureTime<T>(
  name: string,
  fn: () => T
): T {
  const startTime = performance.now();
  const span = createSpan(name);
  
  try {
    const result = fn();
    const duration = performance.now() - startTime;
    
    span.setAttributes({
      'duration.ms': duration
    });
    span.setStatus({ code: SpanStatusCode.OK });
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    
    span.setAttributes({
      'duration.ms': duration
    });
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });
    
    throw error;
  } finally {
    span.end();
  }
}