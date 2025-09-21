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
      const securityResponse = await withSecurity(request, security);
      if (securityResponse) {
        return securityResponse;
      }

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

      if (validation.body && (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH')) {
        try {
          // Check if body is already consumed
          let body;
          try {
            body = await request.clone().json();
          } catch (cloneError) {
            // If cloning fails, the body might already be consumed
            // Skip validation in this case and let the handler deal with it
            console.warn('Middleware - Could not clone request, skipping body validation:', cloneError.message);
            // Continue to handler without validation
          }

          if (body) {
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
          }
        } catch (error) {
          console.error('Middleware - JSON parsing error:', error);
          return addSecurityHeaders(NextResponse.json(
            { error: 'Invalid JSON in request body' },
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