/**
 * Password Reset Verification API Route
 *
 * Safe-link proof password reset that allows multiple verification attempts.
 * Tokens are stored in user_metadata and remain valid until expiry (24 hours).
 *
 * Flow:
 * 1. User clicks password reset link (can be pre-fetched by security systems)
 * 2. Verify token from user_metadata
 * 3. Generate session for password update
 * 4. Redirect to /reset-password page where user sets new password
 *
 * Based on: retail-platform's password reset flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/v2/server'
import { verifyToken } from '@/lib/auth/tokens'

export async function GET(request: NextRequest) {
  console.log('[PASSWORD RESET] Processing reset verification request')

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  console.log('[PASSWORD RESET] Email:', email)
  console.log('[PASSWORD RESET] Token present:', !!token)

  if (!email || !token) {
    console.error('[PASSWORD RESET] Missing email or token')
    return NextResponse.redirect(
      new URL('/forgot-password?error=invalid_reset_link', request.url)
    )
  }

  try {
    // Verify the token
    const verification = await verifyToken(email, token, 'password_reset')

    if (!verification.success || !verification.userId) {
      console.error('[PASSWORD RESET] Verification failed:', verification.error)
      return NextResponse.redirect(
        new URL(
          `/forgot-password?error=${encodeURIComponent(verification.error || 'invalid_token')}`,
          request.url
        )
      )
    }

    console.log('[PASSWORD RESET] Token verified for user:', verification.userId)

    // Generate a temporary session for password update
    const adminClient = createAdminClient()

    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
    })

    if (sessionError || !sessionData) {
      console.error('[PASSWORD RESET] Error generating session:', sessionError)
      return NextResponse.redirect(
        new URL('/forgot-password?error=session_generation_failed', request.url)
      )
    }

    // Extract the access_token and refresh_token from the action_link
    // Format: http://localhost:3000/auth/callback#access_token=...&refresh_token=...&type=recovery
    const actionLink = sessionData.properties.action_link
    const hashPart = actionLink.split('#')[1]

    if (!hashPart) {
      console.error('[PASSWORD RESET] No hash in action link')
      return NextResponse.redirect(
        new URL('/forgot-password?error=invalid_session_link', request.url)
      )
    }

    const params = new URLSearchParams(hashPart)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      console.error('[PASSWORD RESET] Missing tokens in action link')
      return NextResponse.redirect(
        new URL('/forgot-password?error=missing_session_tokens', request.url)
      )
    }

    // Set session cookies and redirect to password reset page
    const response = NextResponse.redirect(
      new URL('/reset-password?verified=true', request.url)
    )

    // Set auth cookies (Supabase format)
    response.cookies.set('sb-access-token', accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour - short lived for security
    })

    response.cookies.set('sb-refresh-token', refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60, // 1 hour - short lived for security
    })

    console.log('[PASSWORD RESET] Session created, redirecting to reset-password page')

    return response

  } catch (error: any) {
    console.error('[PASSWORD RESET] Exception:', error)
    return NextResponse.redirect(
      new URL('/forgot-password?error=unexpected_error', request.url)
    )
  }
}
