/**
 * Next.js Middleware for Distributed Tracing
 * Phase 4, Task 4.2: Automatic request tracing
 */

import { NextRequest, NextResponse } from 'next/server';
import { traceIncomingRequest } from '@/lib/tracing/http-tracing';
import { logger } from '@/lib/logging';

// Paths to exclude from tracing
const EXCLUDED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/__nextjs'
];

// File extensions to exclude
const EXCLUDED_EXTENSIONS = [
  '.js',
  '.css',
  '.map',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.woff',
  '.woff2'
];

/**
 * Check if path should be traced
 */
function shouldTrace(pathname: string): boolean {
  // Check excluded paths
  if (EXCLUDED_PATHS.some(path => pathname.startsWith(path))) {
    return false;
  }

  // Check file extensions
  if (EXCLUDED_EXTENSIONS.some(ext => pathname.endsWith(ext))) {
    return false;
  }

  return true;
}

/**
 * Tracing middleware for Next.js
 */
export async function tracingMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Skip tracing for excluded paths
  if (!shouldTrace(pathname)) {
    return NextResponse.next();
  }

  // Skip if tracing is disabled
  if (process.env.OTEL_ENABLED === 'false') {
    return NextResponse.next();
  }

  try {
    // Trace the incoming request
    return await traceIncomingRequest(request, async () => {
      // Continue to the actual handler
      const response = NextResponse.next();

      // Add trace headers to response
      const traceId = response.headers.get('x-trace-id');
      if (!traceId) {
        // Get current trace info and add to response
        const { getCurrentTraceInfo } = await import('@/lib/tracing/propagation');
        const traceInfo = getCurrentTraceInfo();
        
        if (traceInfo.traceId) {
          response.headers.set('x-trace-id', traceInfo.traceId);
        }
        if (traceInfo.spanId) {
          response.headers.set('x-span-id', traceInfo.spanId);
        }
      }

      return response;
    });
  } catch (error) {
    // Log error but don't fail the request
    logger.error('Tracing middleware error', error as Error, {
      path: pathname,
      method: request.method
    });

    // Continue without tracing
    return NextResponse.next();
  }
}

/**
 * Create traced route handler
 */
export function withTracing<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest;
    
    if (!shouldTrace(request.nextUrl.pathname)) {
      return handler(...args);
    }

    try {
      return await traceIncomingRequest(request, async () => {
        return handler(...args);
      });
    } catch (error) {
      // If tracing fails, still execute the handler
      logger.error('Route tracing failed', error as Error);
      return handler(...args);
    }
  }) as T;
}