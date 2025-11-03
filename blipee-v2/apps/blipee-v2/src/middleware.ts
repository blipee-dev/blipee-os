/**
 * Next.js Middleware (V2)
 *
 * This is the V2 middleware that includes Supabase auth token refresh.
 *
 * IMPORTANT: When migrating to V2, rename this file to middleware.ts
 *
 * Key Features:
 * - Refreshes Supabase auth tokens on every request
 * - Maintains security headers
 * - Handles telemetry
 * - Optionally redirects unauthenticated users
 *
 * Based on: https://supabase.com/docs/guides/auth/server-side/creating-a-client
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/v2/middleware'
import { telemetryMiddleware } from '@/middleware/telemetry'
import { securityHeaders } from '@/lib/security/headers'

/**
 * Check if the request is from a mobile device
 */
function isMobileDevice(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

/**
 * Check if path is public (doesn't require auth)
 */
function isPublicPath(pathname: string): boolean {
  const publicPaths = [
    '/',
    '/about',
    '/careers',
    '/company',
    '/contact',
    '/pricing',
    '/privacy',
    '/terms',
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/auth/callback',
    '/documentation',
    '/api',
    '/faq',
    '/status',
    '/support',
    '/updates',
  ]
  return publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))
}

export async function middleware(request: NextRequest) {
  // Apply telemetry middleware
  return telemetryMiddleware(request, async () => {
    const { pathname } = request.nextUrl
    const userAgent = request.headers.get('user-agent') || ''

    // Mobile redirect logic: redirect root to /mobile for mobile devices
    if (pathname === '/' && isMobileDevice(userAgent)) {
      const url = request.nextUrl.clone()
      url.pathname = '/mobile'
      return NextResponse.redirect(url)
    }

    // CRITICAL: Update Supabase session (refreshes auth tokens)
    // This must run BEFORE any auth checks
    const supabaseResponse = await updateSession(request)

    // Check if user is authenticated (for protected routes)
    if (!isPublicPath(pathname)) {
      // Get user from cookies (session was just refreshed above)
      const { createServerClient } = await import('@supabase/ssr')
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // No-op, cookies already set by updateSession
            },
          },
        }
      )

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to signin
        const url = request.nextUrl.clone()
        url.pathname = '/signin'
        url.searchParams.set('redirect', pathname)
        return NextResponse.redirect(url)
      }
    }

    // Add security headers to response
    const headers = securityHeaders
    Object.entries(headers).forEach(([key, value]) => {
      supabaseResponse.headers.set(key, value as string)
    })

    return supabaseResponse
  })
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - site.webmanifest (PWA manifest)
     * - Images and media files
     */
    '/((?!_next/static|_next/image|favicon.ico|site\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
