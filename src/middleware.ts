import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { sessionManager } from '@/lib/session/manager';

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

// Routes that require specific permissions
const permissionRoutes: Record<string, string[]> = {
  '/api/organizations': ['organizations:edit'],
  '/settings/security': ['settings:edit'],
  '/api/import': ['data:import'],
};

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

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => path === route || path.startsWith(route + '/'));
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some(route => path.startsWith(route));
  if (!requiresAuth) {
    return NextResponse.next();
  }

  try {
    // Validate session
    const requiredPermissions = permissionRoutes[path];
    const validation = await sessionManager.validateSession(request, requiredPermissions);

    if (!validation.valid) {
      // For API routes, return 401
      if (path.startsWith('/api/')) {
        return NextResponse.json(
          { 
            error: validation.reason || 'Unauthorized',
            code: validation.reason === 'MFA verification required' ? 'MFA_REQUIRED' : 'UNAUTHORIZED'
          },
          { status: 401 }
        );
      }

      // For web routes, redirect to signin
      const url = new URL('/signin', request.url);
      url.searchParams.set('redirect', path);
      if (validation.reason) {
        url.searchParams.set('reason', validation.reason);
      }
      return NextResponse.redirect(url);
    }

    // Add session data to request headers for downstream use
    if (validation.session) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', validation.session.userId);
      if (validation.session.organizationId) {
        requestHeaders.set('x-organization-id', validation.session.organizationId);
      }
      requestHeaders.set('x-permissions', validation.session.permissions.join(','));

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, fail open for public routes, fail closed for protected
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
    
    const url = new URL('/signin', request.url);
    url.searchParams.set('redirect', path);
    url.searchParams.set('reason', 'session_error');
    return NextResponse.redirect(url);
  }
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