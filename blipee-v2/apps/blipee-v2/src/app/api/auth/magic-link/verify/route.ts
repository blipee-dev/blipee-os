/**
 * Magic Link Verification API Route
 *
 * Safe-link proof magic link authentication that allows multiple verification attempts.
 * Tokens are stored in user_metadata and remain valid until expiry (1 hour).
 *
 * Flow:
 * 1. User clicks magic link (can be pre-fetched by security systems)
 * 2. Verify token from user_metadata
 * 3. Generate session
 * 4. Redirect to dashboard
 *
 * Based on: retail-platform's magic link flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/v2/server'
import { verifyToken, clearToken } from '@/lib/auth/tokens'

export async function GET(request: NextRequest) {
  console.log('[MAGIC LINK] Processing magic link verification')

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  console.log('[MAGIC LINK] Email:', email)
  console.log('[MAGIC LINK] Token present:', !!token)

  if (!email || !token) {
    console.error('[MAGIC LINK] Missing email or token')
    return NextResponse.redirect(
      new URL('/signin?error=invalid_magic_link', request.url)
    )
  }

  try {
    // Verify the token
    const verification = await verifyToken(email, token, 'magic_link')

    if (!verification.success || !verification.userId) {
      console.error('[MAGIC LINK] Verification failed:', verification.error)
      return NextResponse.redirect(
        new URL(
          `/signin?error=${encodeURIComponent(verification.error || 'invalid_token')}`,
          request.url
        )
      )
    }

    console.log('[MAGIC LINK] Token verified for user:', verification.userId)

    // Clear the token
    await clearToken(verification.userId, 'magic_link')

    // Generate a session link for the user
    const adminClient = createAdminClient()

    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError || !sessionData) {
      console.error('[MAGIC LINK] Error generating session:', sessionError)
      return NextResponse.redirect(
        new URL('/signin?error=session_generation_failed', request.url)
      )
    }

    // Extract the access_token and refresh_token from the action_link
    const actionLink = sessionData.properties.action_link
    const hashPart = actionLink.split('#')[1]

    if (!hashPart) {
      console.error('[MAGIC LINK] No hash in action link')
      return NextResponse.redirect(
        new URL('/signin?error=invalid_session_link', request.url)
      )
    }

    const params = new URLSearchParams(hashPart)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      console.error('[MAGIC LINK] Missing tokens in action link')
      return NextResponse.redirect(
        new URL('/signin?error=missing_session_tokens', request.url)
      )
    }

    // Set session cookies and redirect
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    // Set auth cookies (Supabase format)
    response.cookies.set('sb-access-token', accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set('sb-refresh-token', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    console.log('[MAGIC LINK] Session created, redirecting to dashboard')

    return response

  } catch (error: any) {
    console.error('[MAGIC LINK] Exception:', error)
    return NextResponse.redirect(
      new URL('/signin?error=unexpected_error', request.url)
    )
  }
}
