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
  '/api/v1',
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
  '/api/auth',
  '/api/health',
  '/api/metrics',
  '/about',
  '/features',
  '/industries',
  '/ai-technology',
];

// API Key protected routes (alternative auth)
const apiKeyRoutes = [
  '/api/v1/orchestrator',
  '/api/v1/agents',
  '/api/v1/ml',
  '/api/v1/network',
];

// Simple rate limiting for Edge Runtime
class EdgeRateLimiter {
  private connections = new Map<string, { count: number; resetTime: number }>();
  private rules = new Map<string, { maxRequests: number; windowMs: number }>();

  constructor() {
    // Configure rate limit rules
    this.rules.set('default', { maxRequests: 100, windowMs: 60000 }); // 100 req/min
    this.rules.set('/api/v1/orchestrator', { maxRequests: 60, windowMs: 60000 }); // 60 req/min
    this.rules.set('/api/v1/ml', { maxRequests: 100, windowMs: 60000 }); // 100 req/min
    this.rules.set('/api/auth', { maxRequests: 5, windowMs: 900000 }); // 5 req/15min
  }

  check(ip: string, path: string): { blocked: boolean; remaining: number; rule: string } {
    const now = Date.now();
    
    // Find applicable rule
    let rule = 'default';
    let config = this.rules.get('default')!;
    
    for (const [rulePath, ruleConfig] of this.rules) {
      if (path.startsWith(rulePath)) {
        rule = rulePath;
        config = ruleConfig;
        break;
      }
    }

    const key = `${ip}:${rule}`;
    const connection = this.connections.get(key);

    if (!connection || connection.resetTime < now) {
      this.connections.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return { blocked: false, remaining: config.maxRequests - 1, rule };
    }

    connection.count++;
    
    if (connection.count > config.maxRequests) {
      return { blocked: true, remaining: 0, rule };
    }

    return { blocked: false, remaining: config.maxRequests - connection.count, rule };
  }

  cleanup() {
    const now = Date.now();
    const entries = Array.from(this.connections.entries());
    for (const [key, conn] of entries) {
      if (conn.resetTime < now) {
        this.connections.delete(key);
      }
    }
  }
}

// Global instance for Edge Runtime
const rateLimiter = new EdgeRateLimiter();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const path = request.nextUrl.pathname;
  const method = request.method;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             '127.0.0.1';

  // Apply rate limiting
  const rateCheck = rateLimiter.check(ip, path);
  if (rateCheck.blocked) {
    // Record rate limit exceeded
    recordMetric('http_requests_total', 1, { method, path, status: '429' });
    recordMetric('rate_limit_exceeded_total', 1, { method, path, rule: rateCheck.rule });
    
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

  // Apply security headers
  const securityHeaders = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Request-ID': crypto.randomUUID(),
  };

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    path === route || path.startsWith(route + '/') || path.startsWith(route)
  );
  
  if (isPublicRoute) {
    response = NextResponse.next();
  } else {
    // Check if route requires authentication
    const requiresAuth = protectedRoutes.some(route => path.startsWith(route));
    
    if (!requiresAuth) {
      response = NextResponse.next();
    } else {
      // Check for API key authentication first (for API routes)
      const apiKey = request.headers.get('X-API-Key');
      const isApiKeyRoute = apiKeyRoutes.some(route => path.startsWith(route));
      
      if (isApiKeyRoute && apiKey) {
        // Validate API key (in production, check against database)
        if (apiKey.length >= 32) {
          response = NextResponse.next();
          response.headers.set('X-Auth-Method', 'api-key');
        } else {
          statusCode = 401;
          response = NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
          );
        }
      } else {
        // Check session/cookie authentication
        const sessionCookie = request.cookies.get('sb-access-token') || 
                            request.cookies.get('blipee-session');
        const authHeader = request.headers.get('Authorization');
        
        if (!sessionCookie && !authHeader) {
          statusCode = 401;
          
          // For API routes, return 401
          if (path.startsWith('/api/')) {
            response = NextResponse.json(
              { error: 'Authentication required' },
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
          // Session exists, continue
          response = NextResponse.next();
          response.headers.set('X-Auth-Method', authHeader ? 'bearer' : 'session');
        }
      }
    }
  }

  // Apply security headers to response
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', '100');
  response.headers.set('X-RateLimit-Remaining', rateCheck.remaining.toString());

  // CORS headers for API routes
  if (path.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'http://localhost:3000',
      'https://app.blipee.com',
      'https://blipee.com'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }

  // Handle preflight requests
  if (method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
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
      method: response.headers.get('X-Auth-Method') || 'unknown', 
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