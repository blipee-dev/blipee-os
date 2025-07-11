import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple metrics collection for Edge Runtime
const recordMetric = (name: string, value: number, labels?: Record<string, string>) => {
  // In Edge Runtime, we'll just log the metrics
  // The actual metrics collection will happen in the API routes
  console.log(`[METRIC] ${name}:`, value, labels);
};

// Routes that require authentication
const protectedRoutes = [
  '/dashboard',
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
  '/api/auth/signin',
  '/api/auth/signup',
  '/api/auth/reset-password',
  '/api/health',
  '/about',
  '/features',
  '/industries',
  '/ai-technology',
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

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  // Apply DDoS protection
  const ddosCheck = ddosProtection.check(ip);
  if (ddosCheck.blocked) {
    // Record rate limit exceeded
    recordMetric('http_requests_total', 1, { method, path, status: '429' });
    recordMetric('rate_limit_exceeded_total', 1, { method, path, ip });
    
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
  } else {
    // Check if route requires authentication
    const requiresAuth = protectedRoutes.some(route => path.startsWith(route));
    if (!requiresAuth) {
      response = NextResponse.next();
    } else {
      // Simple cookie check for Edge runtime
      const sessionCookie = request.cookies.get('blipee-session');
      
      if (!sessionCookie) {
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
        // Session exists, continue with rate limit headers
        response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', '100');
        response.headers.set('X-RateLimit-Remaining', ddosCheck.remaining.toString());
      }
    }
  }

  // Record metrics for this request
  const duration = Date.now() - startTime;
  recordMetric('http_requests_total', 1, { method, path, status: statusCode.toString() });
  recordMetric('http_request_duration_ms', duration, { method, path });

  // Record authentication events
  if (path.startsWith('/api/auth/')) {
    const authEvent = path.split('/').pop() || 'unknown';
    recordMetric('auth_events_total', 1, { 
      event: authEvent, 
      method: 'session', 
      success: (statusCode < 400).toString() 
    });
  }

  return response;
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