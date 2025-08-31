import { NextRequest, NextResponse } from 'next/server';
import { recordHttpRequest, recordError } from './collector';

/**
 * Monitoring middleware for Next.js
 */
export async function withMonitoring(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const method = _request.method;
  const path = _request.nextUrl.pathname;
  
  try {
    // Execute the handler
    const response = await handler(_request);
    
    // Record metrics
    const responseTime = Date.now() - startTime;
    const statusCode = response.status;
    
    // Get user ID from session if available
    const userId = response.headers.get('x-user-id') || undefined;
    
    await recordHttpRequest(
      method,
      path,
      statusCode,
      responseTime,
      userId
    );
    
    // Add performance headers
    response.headers.set('x-response-time', responseTime.toString());
    
    return response;
  } catch (error) {
    // Record error
    const responseTime = Date.now() - startTime;
    
    await recordError(
      'http_request_error',
      error instanceof Error ? error.message : 'Unknown error',
      {
        method,
        path,
        responseTime: responseTime.toString(),
      }
    );
    
    // Record failed request
    await recordHttpRequest(
      method,
      path,
      500,
      responseTime
    );
    
    // Re-throw the error
    throw error;
  }
}

/**
 * Create monitored API route handler
 */
export function createMonitoredHandler<T extends any[]>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T) => {
    return withMonitoring(req, async (_request) => handler(_request, ...args));
  };
}

/**
 * Express-style middleware for monitoring
 */
export function monitoringMiddleware() {
  return async (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const method = req.method;
    const path = req.path || req.url;
    
    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = async function(...args: any[]) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Record metrics
      await recordHttpRequest(
        method,
        path,
        statusCode,
        responseTime,
        req.userId || undefined
      );
      
      // Call original end
      originalEnd.apply(res, args);
    };
    
    // Handle errors
    res.on('error', async (error: Error) => {
      await recordError(
        'http_response_error',
        error.message,
        {
          method,
          path,
        }
      );
    });
    
    next();
  };
}