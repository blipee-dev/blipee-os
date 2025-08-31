/**
 * Next.js Middleware for Structured Logging
 * Phase 4, Task 4.1: Automatic request/response logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { httpLogger } from '@/lib/logging/http-logger';
import { logger } from '@/lib/logging/structured-logger';

// Paths to exclude from logging
const EXCLUDED_PATHS = [
  '/_next',
  '/favicon.ico',
  '/health',
  '/__nextjs',
  '/api/health'
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
 * Check if path should be logged
 */
function shouldLog(pathname: string): boolean {
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
 * Logging middleware for Next.js
 */
export async function loggingMiddleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  // Skip logging for excluded paths
  if (!shouldLog(pathname)) {
    return NextResponse.next();
  }

  // Use HTTP logger for API routes
  if (pathname.startsWith('/api/')) {
    return httpLogger(request, async (req) => {
      // Continue to the actual API handler
      return NextResponse.next();
    });
  }

  // For non-API routes, just log the request
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID();

  logger.info(`Page request: ${request.method} ${pathname}`, {
    method: request.method,
    path: pathname,
    query: Object.fromEntries(request.nextUrl.searchParams),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
    requestId,
    correlationId
  });

  const response = NextResponse.next();

  // Add tracking headers
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-correlation-id', correlationId);
  response.headers.set('x-response-time', String(Date.now() - startTime));

  return response;
}

/**
 * Error boundary for logging middleware
 */
export function withLoggingErrorBoundary(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await handler(request);
    } catch (error) {
      // Log the error
      logger.error('Middleware error', error as Error, {
        path: request.nextUrl.pathname,
        method: request.method,
        middleware: 'logging'
      });

      // Return error response
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  };
}