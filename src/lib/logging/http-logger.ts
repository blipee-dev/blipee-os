/**
 * HTTP Request/Response Logger Middleware
 * Phase 4, Task 4.1: Structured logging for all HTTP requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { logger, LogContext } from './structured-logger';
import { v4 as uuidv4 } from 'uuid';

export interface HTTPLogContext extends LogContext {
  method?: string;
  path?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
  ip?: string;
  userAgent?: string;
  referer?: string;
  responseStatus?: number;
  responseTime?: number;
  contentLength?: number;
  errorMessage?: string;
}

/**
 * Sanitize headers to remove sensitive information
 */
function sanitizeHeaders(headers: Headers): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token',
    'x-csrf-token'
  ];

  headers.forEach((value, key) => {
    if (sensitiveHeaders.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Extract query parameters from URL
 */
function extractQueryParams(url: URL): Record<string, string> {
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    // Redact sensitive query parameters
    if (['token', 'apikey', 'secret'].includes(key.toLowerCase())) {
      params[key] = '[REDACTED]';
    } else {
      params[key] = value;
    }
  });
  return params;
}

/**
 * HTTP logging middleware for Next.js
 */
export async function httpLogger(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const requestId = request.headers.get('x-request-id') || uuidv4();
  const correlationId = request.headers.get('x-correlation-id') || uuidv4();
  const startTime = Date.now();

  // Extract request information
  const url = new URL(request.url);
  const httpContext: HTTPLogContext = {
    correlationId,
    requestId,
    method: request.method,
    path: url.pathname,
    query: extractQueryParams(url),
    headers: sanitizeHeaders(request.headers),
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    referer: request.headers.get('referer') || 'direct'
  };

  // Create child logger with HTTP context
  const httpLogger = logger.child(httpContext);

  // Log incoming request
  httpLogger.info(`Incoming ${request.method} ${url.pathname}`, {
    query: httpContext.query,
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length')
  });

  try {
    // Execute the handler with context
    const response = await logger.runWithContext(httpContext, () => handler(request));
    
    const responseTime = Date.now() - startTime;

    // Add response headers
    response.headers.set('x-request-id', requestId);
    response.headers.set('x-correlation-id', correlationId);
    response.headers.set('x-response-time', responseTime.toString());

    // Log response
    httpLogger.info(`Response ${response.status} for ${request.method} ${url.pathname}`, {
      responseStatus: response.status,
      responseTime,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });

    // Log slow requests as warnings
    if (responseTime > 1000) {
      httpLogger.warn(`Slow request detected: ${request.method} ${url.pathname}`, {
        responseTime,
        threshold: 1000
      });
    }

    return response;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error
    httpLogger.error(
      `Request failed: ${request.method} ${url.pathname}`,
      error as Error,
      {
        responseTime,
        errorType: (error as Error).name,
        errorMessage: (error as Error).message
      }
    );

    // Return error response
    const errorResponse = NextResponse.json(
      { 
        error: 'Internal Server Error',
        requestId,
        correlationId
      },
      { status: 500 }
    );

    errorResponse.headers.set('x-request-id', requestId);
    errorResponse.headers.set('x-correlation-id', correlationId);
    errorResponse.headers.set('x-response-time', responseTime.toString());

    return errorResponse;
  }
}

/**
 * Express-style middleware wrapper for API routes
 */
export function withLogging<T extends (...args: any[]) => any>(
  handler: T
): T {
  return (async (...args: Parameters<T>) => {
    const [request, ...rest] = args;
    
    if (request instanceof NextRequest) {
      return httpLogger(request, async (req) => {
        const result = await handler(req, ...rest);
        return result instanceof NextResponse ? result : NextResponse.json(result);
      });
    }
    
    // Fallback for non-NextRequest handlers
    return handler(...args);
  }) as T;
}

/**
 * Log API operation with structured context
 */
export function logAPIOperation(
  operation: string,
  metadata?: Record<string, any>
): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const childLogger = logger.child({ 
        operation: operation || String(propertyKey),
        class: target.constructor.name,
        method: String(propertyKey)
      });

      const timer = logger.startTimer();

      try {
        childLogger.debug(`Starting ${operation}`, metadata);
        const result = await originalMethod.apply(this, args);
        const duration = timer();
        
        childLogger.info(`Completed ${operation}`, {
          ...metadata,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = timer();
        
        childLogger.error(`Failed ${operation}`, error as Error, {
          ...metadata,
          duration,
          success: false
        });
        
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Create a logging context for a specific user session
 */
export function createUserContext(userId: string, organizationId?: string): LogContext {
  return {
    correlationId: uuidv4(),
    userId,
    organizationId,
    sessionId: uuidv4()
  };
}

/**
 * Create a logging context for system operations
 */
export function createSystemContext(operation: string, service?: string): LogContext {
  return {
    correlationId: uuidv4(),
    operation,
    service: service || 'system',
    isSystemOperation: true
  };
}