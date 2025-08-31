import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Custom API Error class with status code and error code
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Standard error response format
 */
interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  requestId?: string;
}

/**
 * Generate a request ID for tracking
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize error messages to prevent information leakage
 */
function sanitizeErrorMessage(message: string): string {
  // Remove potential sensitive information patterns
  const sensitivePatterns = [
    /password[\s=:]+\S+/gi,
    /api[_-]?key[\s=:]+\S+/gi,
    /token[\s=:]+\S+/gi,
    /secret[\s=:]+\S+/gi,
    /\/users\/[a-f0-9-]+/gi, // User IDs
    /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, // UUIDs
  ];

  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }

  return sanitized;
}

/**
 * Log error with context (in production, this would go to a logging service)
 */
function logError(error: unknown, requestId: string, context?: any) {
  const errorDetails = {
    requestId,
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: process.env['NODE_ENV'] === 'development' ? error.stack : undefined,
    } : error,
    context,
  };

  // In production, send to logging service
  if (process.env['NODE_ENV'] === 'production') {
    // TODO: Send to Sentry, LogRocket, etc.
    console.error('Production error:', errorDetails);
  } else {
    console.error('Development error:', errorDetails);
  }
}

/**
 * Main error handler function
 */
export function handleAPIError(
  error: unknown,
  context?: any
): NextResponse<ErrorResponse> {
  const requestId = generateRequestId();
  
  // Log the error
  logError(error, requestId, context);

  // Handle known error types
  if (error instanceof APIError) {
    return NextResponse.json<ErrorResponse>(
      {
        error: {
          message: sanitizeErrorMessage(error.message),
          code: error.code,
        },
        requestId,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json<ErrorResponse>(
      {
        error: {
          message: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message,
          })),
        },
        requestId,
      },
      { status: 400 }
    );
  }

  // Database errors (Supabase)
  if (error && typeof error === 'object' && 'code' in error) {
    const dbError = error as any;
    
    // Handle common database errors
    if (dbError.code === '23505') {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            message: 'A record with this value already exists',
            code: 'DUPLICATE_ENTRY',
          },
          requestId,
        },
        { status: 409 }
      );
    }
    
    if (dbError.code === '23503') {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            message: 'Referenced record not found',
            code: 'FOREIGN_KEY_VIOLATION',
          },
          requestId,
        },
        { status: 400 }
      );
    }
  }

  // Rate limit errors
  if (error instanceof Error && _error.message.includes('rate limit')) {
    return NextResponse.json<ErrorResponse>(
      {
        error: {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        requestId,
      },
      { 
        status: 429,
        headers: {
          'Retry-After': '60', // 60 seconds
        },
      }
    );
  }

  // Generic error response (don't expose internals)
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  return NextResponse.json<ErrorResponse>(
    {
      error: {
        message: isDevelopment && error instanceof Error 
          ? sanitizeErrorMessage(error.message)
          : 'An error occurred processing your request',
        code: 'INTERNAL_ERROR',
      },
      requestId,
    },
    { status: 500 }
  );
}

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleAPIError(error, {
        handler: handler.name,
        timestamp: new Date().toISOString(),
      });
    }
  };
}

/**
 * User-friendly error messages
 */
export class UserFriendlyErrors {
  private static errorMap: Record<string, string> = {
    'rate_limit_exceeded': "I'm processing many requests right now. Please try again in a moment.",
    'context_length_exceeded': "Your message is too long. Let me summarize and try again.",
    'service_unavailable': "I'm having trouble connecting. Switching to backup AI provider...",
    'invalid_api_key': "There's a configuration issue. Please contact support.",
    'network_error': "I'm having trouble connecting. Please check your internet connection.",
    'timeout': "This is taking longer than expected. Please try again.",
  };

  static format(error: any): string {
    // Check for known error codes
    const errorCode = error?.code || error?.error?.code;
    if (errorCode && this.errorMap[errorCode]) {
      return this.errorMap[errorCode];
    }

    // Check for specific error messages
    if (error?.message) {
      const message = error.message.toLowerCase();
      
      if (message.includes('rate limit')) {
        return this.errorMap['rate_limit_exceeded'];
      }
      
      if (message.includes('timeout')) {
        return this.errorMap['timeout'];
      }
      
      if (message.includes('network')) {
        return this.errorMap['network_error'];
      }
    }

    // Generic fallback
    return "I encountered an issue processing your request. Please try again.";
  }
}