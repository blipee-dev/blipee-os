import { NextRequest, NextResponse } from 'next/server';
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { recordHttpMetrics, updateActiveRequests } from '@/lib/monitoring/otel-metrics';
import { logger } from '@/lib/logger';

const tracer = trace.getTracer('blipee-os-middleware', '1.0.0');

/**
 * OpenTelemetry middleware for Next.js
 */
export async function telemetryMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = performance.now();
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  
  // Skip telemetry for static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/static/')) {
    return next();
  }
  
  // Start span
  const span = tracer.startSpan(`${method} ${pathname}`, {
    attributes: {
      'http.method': method,
      'http.url': request.url,
      'http.target': pathname,
      'http.host': request.headers.get('host') || 'unknown',
      'http.scheme': 'https',
      'http.user_agent': request.headers.get('user-agent') || 'unknown',
      'net.peer.ip': request.headers.get('x-forwarded-for') || request.ip || 'unknown'
    }
  });
  
  // Update active requests
  updateActiveRequests(1);
  
  try {
    // Execute request in span context
    const response = await context.with(
      trace.setSpan(context.active(), span),
      next
    );
    
    // Set response attributes
    span.setAttributes({
      'http.status_code': response.status,
      'http.response.size': response.headers.get('content-length') || 0
    });
    
    // Set span status
    if (response.status >= 400) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: `HTTP ${response.status}`
      });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }
    
    // Record metrics
    const duration = performance.now() - startTime;
    recordHttpMetrics(method, pathname, response.status, duration);
    
    return response;
    
  } catch (error) {
    // Record error
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: (error as Error).message
    });
    
    // Record metrics
    const duration = performance.now() - startTime;
    recordHttpMetrics(method, pathname, 500, duration);
    
    logger.error('Request failed', {
      method,
      pathname,
      error: (error as Error).message
    });
    
    throw error;
    
  } finally {
    // Update active requests
    updateActiveRequests(-1);
    
    // End span
    span.end();
  }
}