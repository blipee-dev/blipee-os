import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { csrfMiddleware, setCSRFCookie } from './lib/security/csrf';
import { applySecurityHeaders } from './lib/security/headers';
import { secureSessionManager } from './lib/session/secure-manager';
import { securityAuditLogger, SecurityEventType } from './lib/security/audit-logger';
import { loggingMiddleware } from './middleware/logging';
import { tracingMiddleware } from './middleware/tracing';
// Locale middleware removed - using i18n directly
import { logger } from './lib/logging';

// Simple metrics collection for Edge Runtime
const recordMetric = (name: string, value: number, labels?: Record<string, string>) => {
  // In Edge Runtime, we'll just log the metrics in development
  // The actual metrics collection will happen in the API routes
  if (process.env.NODE_ENV === 'development') {
    console.log(`[METRIC] ${name}:`, value, labels);
  }
};

// Routes that require authentication
const protectedRoutes = [
  '/blipee-ai',
  '/settings',
  '/api/ai',
  '/api/organizations',
  '/api/documents',
  '/api/files',
  '/api/import',
];

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/forgot-password',
  '/auth/callback',
  '/clear-auth',  // Allow clearing auth without authentication
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/signout',
  '/api/auth/session',  // Session check should be allowed without auth
  '/api/auth/reset-password',
  '/api/auth/oauth',
  '/api/health',
  '/api/version',
  '/about',
  '/features',
  '/industries',
  '/ai-technology',
  '/features-light',
  '/industries-light',
  '/ai-technology-light',
  '/privacy-policy',
  '/terms-of-use',
  '/cookie-policy',
  '/security-policy',
  '/data-processing-agreement',
];

// Simple DDoS protection for Edge Runtime
class EdgeDDoSProtection {
  private connections = new Map<string, { count: number; resetTime: number }>();
  private readonly maxRequests = 100;
  private readonly windowMs = 60000; // 1 minute

  check(ip: string): { blocked: boolean; remaining: number } {
    const now = Date.now();
    const connection = this.connections.get(ip);

    if (!connection || connection.resetTime < now) {
      this.connections.set(ip, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { blocked: false, remaining: this.maxRequests - 1 };
    }

    connection.count++;
    
    if (connection.count > this.maxRequests) {
      return { blocked: true, remaining: 0 };
    }

    return { blocked: false, remaining: this.maxRequests - connection.count };
  }

  cleanup() {
    const now = Date.now();
    const entries = Array.from(this.connections.entries());
    for (const [ip, conn] of entries) {
      if (conn.resetTime < now) {
        this.connections.delete(ip);
      }
    }
  }
}

// Global instance for Edge Runtime
const ddosProtection = new EdgeDDoSProtection();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => ddosProtection.cleanup(), 5 * 60 * 1000);
}

/**
 * Clean corrupted cookies from the request
 * Note: "base64-" prefix is valid for Supabase SSR cookies
 */
function cleanCorruptedCookies(request: NextRequest): void {
  // Currently disabled - "base64-" prefix is valid for Supabase cookies
  // Keeping function for future use if needed
  return;
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             '127.0.0.1';

  // Clean corrupted cookies from the request
  cleanCorruptedCookies(request);

  // Handle Supabase auth redirects with tokens in query params
  // This is for when Supabase redirects to root with auth tokens
  if (path === '/' && request.nextUrl.searchParams.has('access_token')) {
    const callbackUrl = new URL('/auth/callback', request.url);
    callbackUrl.search = request.nextUrl.search;
    return NextResponse.redirect(callbackUrl);
  }

  // Apply tracing first (wraps everything in a trace context)
  try {
    return await tracingMiddleware(request).then(async (tracingResponse) => {
      // If tracing returned early, return that response
      if (tracingResponse !== NextResponse.next()) {
        return tracingResponse;
      }

      // Apply structured logging
      try {
        const loggingResponse = await loggingMiddleware(request);
        if (loggingResponse.status !== 200 && loggingResponse !== NextResponse.next()) {
          return loggingResponse;
        }
      } catch (error) {
        logger.error('Logging middleware error', error as Error, {
          path,
          method
        });
        // Continue even if logging fails
      }

      // Locale routing removed - using i18n directly in components

      // Continue with the rest of the middleware logic
      return executeMiddleware(request, path, method, ip, startTime);
    });
  } catch (error) {
    logger.error('Tracing middleware error', error as Error, {
      path,
      method
    });
    // Continue without tracing
    return executeMiddleware(request, path, method, ip, startTime);
  }
}

async function executeMiddleware(
  request: NextRequest,
  path: string,
  method: string,
  ip: string,
  startTime: number
): Promise<NextResponse> {

  // Apply CSRF protection for API routes (except auth endpoints)
  // Auth endpoints need to work without CSRF tokens for initial authentication
  const csrfExemptPaths = [
    '/api/auth/signin',
    '/api/auth/signup',
    '/api/auth/signout',
    '/api/auth/session',
    '/api/auth/reset-password',
    '/api/auth/oauth',
    '/api/health',
    '/api/version'
  ];
  
  if (path.startsWith('/api/') && !csrfExemptPaths.some(exempt => path.startsWith(exempt))) {
    const csrfResponse = await csrfMiddleware(request);
    if (csrfResponse) {
      // Log CSRF violation
      await securityAuditLogger.log({
        eventType: SecurityEventType.CSRF_VIOLATION,
        ipAddress: ip,
        ...(request.headers.get('user-agent') && { userAgent: request.headers.get('user-agent')! }),
        resource: path,
        action: method,
        result: 'failure',
        details: {
          reason: 'CSRF token validation failed',
        },
      });
      return csrfResponse;
    }
  }

  // Apply DDoS protection
  const ddosCheck = ddosProtection.check(ip);
  if (ddosCheck.blocked) {
    // Record rate limit exceeded
    recordMetric('httprequests_total', 1, { method, path, status: '429' });
    recordMetric('rate_limit_exceeded_total', 1, { method, path, ip });
    
    // Log security event
    await securityAuditLogger.log({
      eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
      ipAddress: ip,
      userAgent: request.headers.get('user-agent') || undefined,
      resource: path,
      action: method,
      result: 'failure',
      details: {
        requestCount: 100,
        windowMs: 60000,
      },
    });
    
    return NextResponse.json(
      { error: 'Too many requests' },
      { 
        status: 429,
        headers: {
          'Retry-After': '60',
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
        }
      }
    );
  }

  let response: NextResponse;
  let statusCode = 200;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route + '/'));
  if (isPublicRoute) {
    response = NextResponse.next();
    
    // Set CSRF token for forms on public pages (signin, signup)
    if (path === '/signin' || path === '/signup' || path === '/forgot-password') {
      setCSRFCookie(response);
    }
  } else {
    // Check if route requires authentication
    const requiresAuth = protectedRoutes.some(route => path.startsWith(route));
    if (!requiresAuth) {
      response = NextResponse.next();
    } else {
      // Check for Supabase auth cookies
      const authToken = request.cookies.get('sb-auth-token') || 
                       request.cookies.get('sb-access-token') ||
                       request.cookies.get('supabase-auth-token');
      const hasSupabaseCookies = Array.from(request.cookies.getAll()).some(
        cookie => cookie.name.includes('supabase') || cookie.name.includes('sb-')
      );
      
      if (!authToken && !hasSupabaseCookies) {
        statusCode = 401;
        
        // For API routes, return 401
        if (path.startsWith('/api/')) {
          response = NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        } else {
          // For web routes, redirect to signin
          const url = new URL('/signin', request.url);
          url.searchParams.set('redirect', path);
          response = NextResponse.redirect(url);
          statusCode = 302;
        }
      } else {
        // Validate session security
        const sessionValidation = await secureSessionManager.validateSession(request);
        
        if (!sessionValidation.session) {
          // Invalid session, redirect to signin
          statusCode = 401;
          if (path.startsWith('/api/')) {
            response = NextResponse.json(
              { error: 'Session expired or invalid' },
              { status: 401 }
            );
          } else {
            const url = new URL('/signin', request.url);
            url.searchParams.set('redirect', path);
            url.searchParams.set('reason', 'session_invalid');
            response = NextResponse.redirect(url);
            statusCode = 302;
          }
        } else {
          // Valid session, use rotated response if needed
          response = sessionValidation.response || NextResponse.next();
          response.headers.set('X-RateLimit-Limit', '100');
          response.headers.set('X-RateLimit-Remaining', ddosCheck.remaining.toString());
          
          // Set session info headers for debugging (dev only)
          if (process.env.NODE_ENV === 'development') {
            response.headers.set('X-Session-ID', sessionValidation.session.id.substring(0, 8));
            response.headers.set('X-Session-Rotated', sessionValidation.response ? 'true' : 'false');
          }
          
          // Set CSRF token for authenticated sessions
          setCSRFCookie(response);
        }
      }
    }
  }

  // Record metrics for this request
  const duration = Date.now() - startTime;
  recordMetric('httprequests_total', 1, { method, path, status: statusCode.toString() });
  recordMetric('httprequest_duration_ms', duration, { method, path });

  // Record authentication events
  if (path.startsWith('/api/auth/')) {
    const authEvent = path.split('/').pop() || 'unknown';
    recordMetric('auth_events_total', 1, { 
      event: authEvent, 
      method: 'session', 
      success: (statusCode < 400).toString() 
    });
  }

  // Apply security headers to all responses
  return applySecurityHeaders(response, request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};