import { NextRequest, NextResponse } from 'next/server';
import { getSecurityMiddleware } from '../middleware/protection';

export interface APIHandlerOptions {
  rateLimit?: {
    key?: string;
    rule?: string;
  };
  requireAuth?: boolean;
  requirePermissions?: string[];
}

/**
 * Wrap API route handlers with security middleware
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: APIHandlerOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const security = getSecurityMiddleware();
      
      // Apply DDoS protection
      const ddosResult = await security.protect(req);
      if (ddosResult) {
        return ddosResult;
      }

      // Apply rate limiting if configured
      if (options.rateLimit) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 
                   '127.0.0.1';
        
        const key = options.rateLimit.key || ip;
        const rule = options.rateLimit.rule || 'api:general';
        
        const rateLimitResult = await security.protect(req, {
          rateLimitKey: key,
          rateLimitRule: rule,
          skipDDoS: true, // Already checked
        });
        
        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // Check authentication if required
      if (options.requireAuth) {
        const sessionCookie = req.cookies.get('blipee-session');
        if (!sessionCookie) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }

        // TODO: Validate session and check permissions
        // This would integrate with the session service
      }

      // Call the actual handler
      return await handler(req);
    } catch (error) {
      console.error('API handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Wrap authentication endpoints with specialized rate limiting
 */
export function withAuthSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  action: 'signin' | 'signup' | 'reset' | 'mfa'
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const security = getSecurityMiddleware();
      
      // Apply auth-specific rate limiting
      const result = await security.protectAuth(req, action);
      if (result) {
        return result;
      }

      // Call the actual handler
      const response = await handler(req);

      // Reset rate limits on successful auth
      if (response.status === 200 && action === 'signin') {
        const body = await response.clone().json();
        if (body.userId) {
          await security.resetLimits(body.userId, 'auth:signin');
        }
      }

      return response;
    } catch (error) {
      console.error('Auth handler error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}