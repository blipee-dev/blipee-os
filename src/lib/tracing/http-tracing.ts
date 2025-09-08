/**
 * HTTP-specific Tracing
 * Phase 4, Task 4.2: Specialized tracing for HTTP operations
 */

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { tracer } from './tracer';
import { injectTraceContext, extractTraceContext } from './propagation';
import type { NextRequest, NextResponse } from 'next/server';

/**
 * Trace incoming HTTP request
 */
export async function traceIncomingRequest<T>(
  request: NextRequest,
  handler: () => Promise<T>
): Promise<T> {
  const method = request.method;
  const path = request.nextUrl.pathname;
  const url = request.url;

  // Extract trace context from headers
  const parentContext = extractTraceContext(request);

  return tracer.startActiveSpan(
    `${method} ${path}`,
    async (span) => {
      // Set standard HTTP attributes
      span.setAttribute('http.method', method);
      span.setAttribute('http.url', url);
      span.setAttribute('http.target', path);
      span.setAttribute('http.host', request.headers.get('host') || 'unknown');
      span.setAttribute('http.scheme', request.nextUrl.protocol.replace(':', ''));
      span.setAttribute('http.user_agent', request.headers.get('user-agent') || 'unknown');

      // Set client IP
      const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      span.setAttribute('http.client_ip', clientIp);

      // Set request size if available
      const contentLength = request.headers.get('content-length');
      if (contentLength) {
        span.setAttribute('http.request.size', parseInt(contentLength, 10));
      }

      // Add custom attributes for API routes
      if (path.startsWith('/api/')) {
        span.setAttribute('http.route.type', 'api');
        
        // Extract API version if present
        const versionMatch = path.match(/\/api\/v(\d+)\//);
        if (versionMatch) {
          span.setAttribute('http.api.version', versionMatch[1]);
        }
      }

      const startTime = Date.now();

      try {
        const response = await handler();
        
        // Set response attributes
        if (response && typeof response === 'object' && 'status' in response) {
          const status = (response as NextResponse).status;
          span.setAttribute('http.status_code', status);
          
          // Set status based on HTTP status code
          if (status >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${status}`
            });
          }

          // Set response size if available
          const responseHeaders = (response as NextResponse).headers;
          const responseSize = responseHeaders.get('content-length');
          if (responseSize) {
            span.setAttribute('http.response.size', parseInt(responseSize, 10));
          }
        }

        const duration = Date.now() - startTime;
        span.setAttribute('http.duration_ms', duration);

        // Flag slow requests
        if (duration > 3000) {
          span.addEvent('slow_request_detected', {
            duration,
            threshold: 3000,
            path
          });
        }

        return response;
      } catch (error) {
        recordHttpError(span, error as Error, method, path);
        throw error;
      }
    },
    { 
      kind: SpanKind.SERVER,
      attributes: parentContext ? { 'http.parent_span': true } : undefined
    }
  );
}

/**
 * Trace outgoing HTTP request
 */
export async function traceOutgoingRequest<T>(
  method: string,
  url: string,
  fn: () => Promise<T>,
  options?: {
    headers?: HeadersInit;
    body?: any;
    timeout?: number;
  }
): Promise<T> {
  const parsedUrl = new URL(url);

  return tracer.startActiveSpan(
    `${method} ${parsedUrl.hostname}${parsedUrl.pathname}`,
    async (span) => {
      // Set standard HTTP attributes
      span.setAttribute('http.method', method);
      span.setAttribute('http.url', url);
      span.setAttribute('http.host', parsedUrl.hostname);
      span.setAttribute('http.scheme', parsedUrl.protocol.replace(':', ''));
      span.setAttribute('http.target', parsedUrl.pathname);

      // Set request body size if available
      if (options?.body) {
        const bodySize = typeof options.body === 'string' 
          ? options.body.length 
          : JSON.stringify(options.body).length;
        span.setAttribute('http.request.size', bodySize);
      }

      // Set timeout if specified
      if (options?.timeout) {
        span.setAttribute('http.timeout_ms', options.timeout);
      }

      // Create headers with trace context
      const headers = new Headers(options?.headers);
      injectTraceContext(headers);

      const startTime = Date.now();

      try {
        const response = await fn();
        
        // Set response attributes if it's a Response object
        if (response && typeof response === 'object' && 'status' in response) {
          const status = (response as Response).status;
          span.setAttribute('http.status_code', status);
          
          if (status >= 400) {
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: `HTTP ${status}`
            });
          }

          // Record response headers
          const responseHeaders = (response as Response).headers;
          const contentType = responseHeaders.get('content-type');
          if (contentType) {
            span.setAttribute('http.response.content_type', contentType);
          }
          
          const contentLength = responseHeaders.get('content-length');
          if (contentLength) {
            span.setAttribute('http.response.size', parseInt(contentLength, 10));
          }
        }

        const duration = Date.now() - startTime;
        span.setAttribute('http.duration_ms', duration);

        return response;
      } catch (error) {
        recordHttpError(span, error as Error, method, url);
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace fetch requests
 */
export async function traceFetch<T = Response>(
  url: string,
  init?: RequestInit
): Promise<T> {
  return traceOutgoingRequest(
    init?.method || 'GET',
    url,
    async () => {
      // Inject trace headers
      const headers = new Headers(init?.headers);
      injectTraceContext(headers);

      const response = await fetch(url, {
        ...init,
        headers
      });

      return response as T;
    },
    {
      headers: init?.headers,
      body: init?.body
    }
  );
}

/**
 * Trace API client requests
 */
export async function traceApiClient<T>(
  service: string,
  operation: string,
  fn: () => Promise<T>,
  options?: {
    method?: string;
    endpoint?: string;
    params?: Record<string, any>;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `api.${service}.${operation}`,
    async (span) => {
      span.setAttribute('api.service', service);
      span.setAttribute('api.operation', operation);
      
      if (options?.method) {
        span.setAttribute('http.method', options.method);
      }
      if (options?.endpoint) {
        span.setAttribute('api.endpoint', options.endpoint);
      }
      if (options?.params) {
        span.setAttribute('api.params', JSON.stringify(options.params));
      }

      try {
        const result = await fn();
        span.addEvent('api_call_completed', {
          service,
          operation
        });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `API call to ${service}.${operation} failed`
        });
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Create traced fetch function
 */
export function createTracedFetch() {
  return async function tracedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === 'string' ? input : input.toString();
    return traceFetch(url, init);
  };
}

/**
 * Record HTTP-specific errors
 */
function recordHttpError(span: any, error: Error, method: string, url: string): void {
  span.recordException(error);
  
  // Determine error type
  let errorType = 'unknown';
  let statusCode = 0;
  
  const errorMessage = error.message.toLowerCase();
  
  if (errorMessage.includes('timeout')) {
    errorType = 'timeout';
  } else if (errorMessage.includes('network')) {
    errorType = 'network_error';
  } else if (errorMessage.includes('aborted')) {
    errorType = 'request_aborted';
  } else if ('status' in error) {
    statusCode = (error as any).status;
    errorType = `http_${statusCode}`;
  }

  span.setAttribute('http.error.type', errorType);
  if (statusCode > 0) {
    span.setAttribute('http.status_code', statusCode);
  }
  
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  });

  span.addEvent('http_error', {
    error_type: errorType,
    method,
    url,
    message: error.message,
    status_code: statusCode
  });
}