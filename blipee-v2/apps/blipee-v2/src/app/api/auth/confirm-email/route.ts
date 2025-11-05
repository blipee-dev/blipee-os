/**
 * Email Confirmation API Route
 *
 * Safe-link proof email confirmation that allows multiple verification attempts.
 * Tokens are stored in user_metadata and remain valid until expiry (48 hours).
 *
 * Flow:
 * 1. User clicks email confirmation link (can be pre-fetched by security systems)
 * 2. Verify token from user_metadata
 * 3. Mark email as confirmed
 * 4. Generate session and redirect to dashboard
 *
 * Based on: retail-platform's confirm-email/verify endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/v2/server'
import { verifyToken, clearToken } from '@/lib/auth/tokens'

export async function GET(request: NextRequest) {
  console.log('[EMAIL CONFIRMATION] Processing confirmation request')

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  console.log('[EMAIL CONFIRMATION] Email:', email)
  console.log('[EMAIL CONFIRMATION] Token present:', !!token)

  if (!email || !token) {
    console.error('[EMAIL CONFIRMATION] Missing email or token')
    return NextResponse.redirect(
      new URL('/signin?error=invalid_confirmation_link', request.url)
    )
  }

  try {
    // Verify the token
    const verification = await verifyToken(email, token, 'email_confirmation')

    if (!verification.success || !verification.userId) {
      console.error('[EMAIL CONFIRMATION] Verification failed:', verification.error)
      return NextResponse.redirect(
        new URL(
          `/signin?error=${encodeURIComponent(verification.error || 'invalid_token')}`,
          request.url
        )
      )
    }

    console.log('[EMAIL CONFIRMATION] Token verified for user:', verification.userId)

    // Mark email as confirmed and clear the token
    const adminClient = createAdminClient()

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      verification.userId,
      {
        email_confirm: true, // Confirm the email
      }
    )

    if (updateError) {
      console.error('[EMAIL CONFIRMATION] Error confirming email:', updateError)
      return NextResponse.redirect(
        new URL('/signin?error=confirmation_failed', request.url)
      )
    }

    // Clear the token
    await clearToken(verification.userId, 'email_confirmation')

    console.log('[EMAIL CONFIRMATION] Email confirmed successfully for:', email)

    // Generate a session link for the user
    const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    })

    if (sessionError || !sessionData) {
      console.error('[EMAIL CONFIRMATION] Error generating session:', sessionError)
      return NextResponse.redirect(
        new URL('/signin?message=email_confirmed_please_signin', request.url)
      )
    }

    // Extract the access_token and refresh_token from the action_link
    // Format: http://localhost:3000/auth/callback#access_token=...&refresh_token=...
    const actionLink = sessionData.properties.action_link
    const hashPart = actionLink.split('#')[1]

    if (!hashPart) {
      console.error('[EMAIL CONFIRMATION] No hash in action link')
      return NextResponse.redirect(
        new URL('/signin?message=email_confirmed_please_signin', request.url)
      )
    }

    const params = new URLSearchParams(hashPart)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (!accessToken || !refreshToken) {
      console.error('[EMAIL CONFIRMATION] Missing tokens in action link')
      return NextResponse.redirect(
        new URL('/signin?message=email_confirmed_please_signin', request.url)
      )
    }

    // Set session cookies and redirect
    const response = NextResponse.redirect(new URL('/dashboard?message=welcome', request.url))

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

    console.log('[EMAIL CONFIRMATION] Session created, redirecting to dashboard')

    return response

  } catch (error: any) {
    console.error('[EMAIL CONFIRMATION] Exception:', error)
    return NextResponse.redirect(
      new URL('/signin?error=unexpected_error', request.url)
    )
  }
}
