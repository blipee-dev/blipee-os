import { NextRequest, NextResponse } from 'next/server';
import { telemetryMiddleware } from '@/middleware/telemetry';
import { securityHeaders } from '@/lib/security/headers';

/**
 * Check if the request is from a mobile device
 */
function isMobileDevice(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
}

export async function middleware(request: NextRequest) {
  // Apply telemetry middleware
  return telemetryMiddleware(request, async () => {
    const { pathname } = request.nextUrl;
    const userAgent = request.headers.get('user-agent') || '';

    // Mobile redirect logic: redirect root to /mobile for mobile devices
    if (pathname === '/' && isMobileDevice(userAgent)) {
      const url = request.nextUrl.clone();
      url.pathname = '/mobile';
      return NextResponse.redirect(url);
    }

    // Apply security headers
    const response = NextResponse.next();

    // Add security headers
    const headers = securityHeaders;
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value as string);
    });

    return response;
  });
}

// Configure which routes to apply middleware to
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