/**
 * Trace Context Propagation
 * Phase 4, Task 4.2: W3C Trace Context propagation
 */

import { 
  context, 
  propagation, 
  trace,
  SpanContext,
  TraceFlags
} from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import type { NextRequest } from 'next/server';

// Set up W3C Trace Context propagator
propagation.setGlobalPropagator(new W3CTraceContextPropagator());

/**
 * Extract trace context from incoming request
 */
export function extractTraceContext(request: NextRequest): SpanContext | undefined {
  const traceparent = request.headers.get('traceparent');
  const tracestate = request.headers.get('tracestate');

  if (!traceparent) {
    return undefined;
  }

  // Parse W3C traceparent header
  // Format: version-trace-id-parent-id-trace-flags
  const parts = traceparent.split('-');
  if (parts.length !== 4) {
    return undefined;
  }

  const [version, traceId, spanId, flags] = parts;

  // Validate version
  if (version !== '00') {
    return undefined;
  }

  // Validate trace ID (32 hex chars)
  if (!/^[0-9a-f]{32}$/.test(traceId)) {
    return undefined;
  }

  // Validate span ID (16 hex chars)
  if (!/^[0-9a-f]{16}$/.test(spanId)) {
    return undefined;
  }

  // Parse trace flags
  const traceFlags = parseInt(flags, 16);

  return {
    traceId,
    spanId,
    traceFlags: traceFlags as TraceFlags,
    traceState: tracestate ? trace.createTraceState(tracestate) : undefined,
    isRemote: true
  };
}

/**
 * Inject trace context into outgoing headers
 */
export function injectTraceContext(headers: Headers): void {
  const activeContext = context.active();
  const carrier: Record<string, string> = {};

  // Inject trace context into carrier
  propagation.inject(activeContext, carrier);

  // Copy injected headers
  Object.entries(carrier).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

/**
 * Create headers with trace context
 */
export function createTracedHeaders(additionalHeaders?: HeadersInit): Headers {
  const headers = new Headers(additionalHeaders);
  injectTraceContext(headers);
  return headers;
}

/**
 * Extract trace and span IDs from current context
 */
export function getCurrentTraceInfo(): {
  traceId?: string;
  spanId?: string;
  traceFlags?: number;
} {
  const span = trace.getActiveSpan();
  if (!span) {
    return {};
  }

  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags: spanContext.traceFlags
  };
}

/**
 * Create child context from parent trace info
 */
export function createChildContext(parentTraceId: string, parentSpanId: string) {
  const spanContext: SpanContext = {
    traceId: parentTraceId,
    spanId: parentSpanId,
    traceFlags: TraceFlags.SAMPLED,
    isRemote: true
  };

  return trace.setSpanContext(context.active(), spanContext);
}

/**
 * Baggage propagation utilities
 */
export const baggage = {
  /**
   * Set baggage value
   */
  set(key: string, value: string): void {
    const activeBaggage = propagation.getBaggage(context.active()) || propagation.createBaggage();
    const newBaggage = activeBaggage.setEntry(key, { value });
    const newContext = propagation.setBaggage(context.active(), newBaggage);
    context.setGlobalContextManager().active = () => newContext;
  },

  /**
   * Get baggage value
   */
  get(key: string): string | undefined {
    const activeBaggage = propagation.getBaggage(context.active());
    return activeBaggage?.getEntry(key)?.value;
  },

  /**
   * Get all baggage entries
   */
  getAll(): Record<string, string> {
    const activeBaggage = propagation.getBaggage(context.active());
    const entries: Record<string, string> = {};
    
    if (activeBaggage) {
      activeBaggage.getAllEntries().forEach(([key, entry]) => {
        entries[key] = entry.value;
      });
    }
    
    return entries;
  },

  /**
   * Clear baggage
   */
  clear(): void {
    const newContext = propagation.deleteBaggage(context.active());
    context.setGlobalContextManager().active = () => newContext;
  }
};

/**
 * Middleware helper for trace propagation
 */
export function withTracePropagation<T>(
  request: NextRequest,
  fn: () => T | Promise<T>
): T | Promise<T> {
  // Extract trace context from request
  const traceContext = extractTraceContext(request);
  
  if (!traceContext) {
    // No trace context, execute normally
    return fn();
  }

  // Create context with trace information
  const ctx = trace.setSpanContext(context.active(), traceContext);
  
  // Execute function with trace context
  return context.with(ctx, fn);
}

/**
 * Format trace parent header
 */
export function formatTraceParent(spanContext: SpanContext): string {
  const version = '00';
  const traceFlags = (spanContext.traceFlags || 0).toString(16).padStart(2, '0');
  return `${version}-${spanContext.traceId}-${spanContext.spanId}-${traceFlags}`;
}

/**
 * Parse trace state header
 */
export function parseTraceState(traceStateHeader: string): Map<string, string> {
  const entries = new Map<string, string>();
  
  traceStateHeader.split(',').forEach(entry => {
    const [key, value] = entry.trim().split('=');
    if (key && value) {
      entries.set(key, value);
    }
  });
  
  return entries;
}

/**
 * Format trace state header
 */
export function formatTraceState(entries: Map<string, string>): string {
  return Array.from(entries.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}