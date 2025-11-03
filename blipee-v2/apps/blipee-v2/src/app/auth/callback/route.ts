/**
 * Auth Callback Route
 *
 * Handles OAuth callbacks and email confirmation links from Supabase.
 * This route exchanges the code from the URL for a user session.
 *
 * Based on: https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
 */

import { createClient } from '@/lib/supabase/v2/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('[AUTH CALLBACK] Processing callback')

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('[AUTH CALLBACK] Code:', code)
  console.log('[AUTH CALLBACK] Next:', next)

  if (code) {
    const supabase = await createClient()

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('[AUTH CALLBACK] Exchange result:', {
      user: data?.user?.id,
      error: error?.message
    })

    if (error) {
      console.error('[AUTH CALLBACK] Error exchanging code:', error)
      // Redirect to error page or signin
      return NextResponse.redirect(new URL('/signin?error=auth_callback_error', request.url))
    }

    // Session is now set in cookies
    console.log('[AUTH CALLBACK] Session established, redirecting to:', next)
    return NextResponse.redirect(new URL(next, request.url))
  }

  console.log('[AUTH CALLBACK] No code found, redirecting to signin')
  // No code found, redirect to signin
  return NextResponse.redirect(new URL('/signin', request.url))
}
