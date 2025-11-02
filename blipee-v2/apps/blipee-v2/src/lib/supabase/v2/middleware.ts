/**
 * Supabase Middleware Client (V2)
 *
 * This client is for Next.js middleware to refresh auth tokens.
 * Runs on every request to ensure valid sessions.
 *
 * IMPORTANT:
 * - Call this in middleware.ts
 * - Returns updated response with refreshed cookies
 * - User sessions are automatically refreshed
 *
 * Based on: https://supabase.com/docs/guides/auth/server-side/creating-a-client
 *
 * @example middleware.ts
 * ```tsx
 * import { updateSession } from '@/lib/supabase/v2/middleware'
 *
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request)
 * }
 *
 * export const config = {
 *   matcher: [
 *     '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
 *   ],
 * }
 * ```
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Get user - this triggers token refresh if needed
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Optional: Add custom middleware logic here
  // For example, redirect to signin if not authenticated:
  // if (!user && !request.nextUrl.pathname.startsWith('/signin')) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/signin'
  //   return NextResponse.redirect(url)
  // }

  return supabaseResponse
}
