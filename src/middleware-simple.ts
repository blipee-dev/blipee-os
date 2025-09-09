import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Simple cookie check for Edge runtime
  const sessionCookie = request.cookies.get('blipee-session');
  
  if (!sessionCookie) {
    // For API routes, return 401
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For web routes, redirect to signin
    const url = new URL('/signin', request.url);
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  // Session exists, continue
  return NextResponse.next();
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