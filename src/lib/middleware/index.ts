import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimiters } from './rate-limit';
import { withSecurity, SecurityConfig, addSecurityHeaders } from './security';
import { validateAndSanitize } from '../validation/schemas';
import { z } from 'zod';

export interface MiddlewareConfig {
  rateLimitType?: 'api' | 'ai' | 'auth' | 'upload' | 'strict' | 'none';
  security?: SecurityConfig;
  validation?: {
    body?: z.ZodSchema<any>;
    query?: z.ZodSchema<any>;
  };
}

export interface APIHandler {
  (
    request: NextRequest,
    context?: any
  ): Promise<NextResponse> | NextResponse;
}

/**
 * Comprehensive API middleware wrapper that handles:
 * - Rate limiting
 * - Security (CORS, sanitization, IP blocking)
 * - Input validation
 * - Error handling
 * - Security headers
 */
export function withMiddleware(
  handler: APIHandler,
  config: MiddlewareConfig = {}
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      const {
        rateLimitType = 'api',
        security = {},
        validation = {},
      } = config;

      // Apply rate limiting
      if (rateLimitType !== 'none') {
        const rateLimiter = rateLimiters[rateLimitType];
        if (rateLimiter) {
          const rateLimitResponse = await withRateLimit(request, rateLimiter);
          if (rateLimitResponse) {
            return addSecurityHeaders(rateLimitResponse);
          }
        }
      }

      // Apply security middleware
      const securityResult = await withSecurity(request, security);
      if (securityResult.response) {
        return securityResult.response;
      }

      // Get sanitized body and body text from security middleware if available
      const sanitizedBody = securityResult.sanitizedBody;
      const securityBodyText = securityResult.bodyText;

      // Apply input validation
      if (validation.query) {
        const { searchParams } = new URL(request.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        const queryValidation = validateAndSanitize(validation.query, queryParams);
        if (!queryValidation.success) {
          const errors = queryValidation.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          }));
          return addSecurityHeaders(NextResponse.json(
            { error: 'Invalid query parameters', details: errors },
            { status: 400 }
          ));
        }
      }

      // Handle body validation with proper Next.js request handling
      if (validation.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        try {
          let body: any;
          let bodyText: string;

          // Use sanitized body from security middleware if available
          if (sanitizedBody !== undefined) {
            body = sanitizedBody;
            bodyText = securityBodyText || JSON.stringify(sanitizedBody);
            console.log('Middleware - Using sanitized body from security middleware');
          } else {
            // Read body if not already processed by security middleware
            try {
              // Check if request body was already read (bodyUsed property)
              if ((request as any).bodyUsed) {
                console.error('Middleware - Request body was already consumed');
                return addSecurityHeaders(NextResponse.json(
                  { error: 'Request body already consumed' },
                  { status: 400 }
                ));
              }

              bodyText = await request.text();
              body = JSON.parse(bodyText);
              console.log('Middleware - Reading fresh body from request');
            } catch (error) {
              console.error('Middleware - Failed to read/parse request body:', error);
              return addSecurityHeaders(NextResponse.json(
                { error: 'Invalid request body' },
                { status: 400 }
              ));
            }
          }

          console.log('Middleware - Validating body:', JSON.stringify(body, null, 2));

          const bodyValidation = validateAndSanitize(validation.body, body);
          if (!bodyValidation.success) {
            const errors = bodyValidation.error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message,
            }));
            console.log('Middleware - Validation failed:', errors);
            return addSecurityHeaders(NextResponse.json(
              { error: 'Invalid request body', details: errors },
              { status: 400 }
            ));
          }

          console.log('Middleware - Validation passed');

          // Attach the parsed body to the original request object for the handler to use
          // This avoids the issue of recreating a NextRequest with a consumed body stream
          (request as any).parsedBody = body;

          // Execute handler with the original request (which now has parsedBody attached)
          const response = await handler(request, context);
          return addSecurityHeaders(response);

        } catch (error) {
          console.error('Middleware - Body validation error:', error);
          return addSecurityHeaders(NextResponse.json(
            { error: 'Request processing failed' },
            { status: 400 }
          ));
        }
      }

      // Execute the main handler
      const response = await handler(request, context);

      // Add security headers to the response
      return addSecurityHeaders(response);

    } catch (error) {
      console.error('Middleware error:', error);

      // Return secure error response
      const errorResponse = NextResponse.json(
        {
          error: 'Internal server error',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );

      return addSecurityHeaders(errorResponse);
    }
  };
}

// Predefined middleware configurations for common use cases
export const middlewareConfigs = {
  // Standard API endpoint
  api: {
    rateLimitType: 'api' as const,
    security: {
      cors: true,
      inputSanitization: true,
      ipReputation: true,
      securityHeaders: true,
    },
  },

  // AI/ML endpoints (stricter rate limiting)
  ai: {
    rateLimitType: 'ai' as const,
    security: {
      cors: true,
      inputSanitization: true,
      ipReputation: true,
      securityHeaders: true,
    },
  },

  // Authentication endpoints (very strict)
  auth: {
    rateLimitType: 'auth' as const,
    security: {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? [process.env.NEXT_PUBLIC_BASE_URL || ''].filter(Boolean)
          : true,
        credentials: true,
      },
      inputSanitization: true,
      ipReputation: true,
      securityHeaders: true,
    },
  },

  // File upload endpoints
  upload: {
    rateLimitType: 'upload' as const,
    security: {
      cors: true,
      inputSanitization: false, // Files don't need text sanitization
      ipReputation: true,
      securityHeaders: true,
    },
  },

  // Admin/sensitive endpoints
  admin: {
    rateLimitType: 'strict' as const,
    security: {
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? [process.env.NEXT_PUBLIC_BASE_URL || ''].filter(Boolean)
          : true,
        credentials: true,
      },
      inputSanitization: true,
      ipReputation: true,
      securityHeaders: true,
    },
  },

  // Public endpoints (minimal security)
  public: {
    rateLimitType: 'api' as const,
    security: {
      cors: true,
      inputSanitization: true,
      ipReputation: false,
      securityHeaders: true,
    },
  },
};

// Export all middleware components
export {
  withRateLimit,
  rateLimiters,
} from './rate-limit';
export {
  withSecurity,
  addSecurityHeaders,
  handleCors,
  sanitizeInput,
  detectSqlInjection,
  detectXss,
} from './security';