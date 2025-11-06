/**
 * Invitation Acceptance API Route
 *
 * Safe-link proof invitation acceptance that allows multiple verification attempts.
 * Tokens are stored in user_metadata and remain valid until expiry (7 days).
 *
 * Flow:
 * 1. User clicks invitation link (can be pre-fetched by security systems)
 * 2. Verify token from user_metadata
 * 3. Check if user has set password (first time) or already registered
 * 4. If first time: redirect to set-password page
 * 5. If registered: generate session and redirect to dashboard
 *
 * Based on: retail-platform's invitation flow
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/v2/server'
import { verifyToken, clearToken } from '@/lib/auth/tokens'

export async function GET(request: NextRequest) {
  console.log('[INVITATION] Processing invitation acceptance')

  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  console.log('[INVITATION] Email:', email)
  console.log('[INVITATION] Token present:', !!token)

  if (!email || !token) {
    console.error('[INVITATION] Missing email or token')
    return NextResponse.redirect(
      new URL('/signin?error=invalid_invitation_link', request.url)
    )
  }

  try {
    // Verify the token
    const verification = await verifyToken(email, token, 'invitation')

    if (!verification.success || !verification.userId) {
      console.error('[INVITATION] Verification failed:', verification.error)
      return NextResponse.redirect(
        new URL(
          `/signin?error=${encodeURIComponent(verification.error || 'invalid_token')}`,
          request.url
        )
      )
    }

    console.log('[INVITATION] Token verified for user:', verification.userId)
    console.log('[INVITATION] Metadata:', verification.metadata)

    // Get user details to check if they've set a password
    const adminClient = createAdminClient()

    const { data: { user }, error: getUserError } = await adminClient.auth.admin.getUserById(
      verification.userId
    )

    if (getUserError || !user) {
      console.error('[INVITATION] Error getting user:', getUserError)
      return NextResponse.redirect(
        new URL('/signin?error=user_not_found', request.url)
      )
    }

    // Check if user has confirmed email (indicates they've set password)
    const hasSetPassword = !!user.email_confirmed_at || !!user.confirmed_at

    console.log('[INVITATION] User has set password:', hasSetPassword)

    if (!hasSetPassword) {
      // First time - need to set password
      // Generate recovery session for password setup
      const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: email,
      })

      if (sessionError || !sessionData) {
        console.error('[INVITATION] Error generating recovery session:', sessionError)
        return NextResponse.redirect(
          new URL('/signin?error=session_generation_failed', request.url)
        )
      }

      // Extract tokens
      const actionLink = sessionData.properties.action_link
      const hashPart = actionLink.split('#')[1]

      if (!hashPart) {
        console.error('[INVITATION] No hash in action link')
        return NextResponse.redirect(
          new URL('/signin?error=invalid_session_link', request.url)
        )
      }

      const params = new URLSearchParams(hashPart)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        console.error('[INVITATION] Missing tokens in action link')
        return NextResponse.redirect(
          new URL('/signin?error=missing_session_tokens', request.url)
        )
      }

      // Set session cookies and redirect to password setup
      const response = NextResponse.redirect(
        new URL('/reset-password?invitation=true', request.url)
      )

      response.cookies.set('sb-access-token', accessToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
      })

      response.cookies.set('sb-refresh-token', refreshToken, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
      })

      console.log('[INVITATION] First time user, redirecting to password setup')

      return response

    } else {
      // Already registered - mark invitation as accepted and create session
      await clearToken(verification.userId, 'invitation')

      // Update organization_members invitation_status to 'accepted'
      if (verification.metadata?.organization_id) {
        const { error: updateError } = await adminClient
          .from('organization_members')
          .update({
            invitation_status: 'accepted',
            joined_at: new Date().toISOString(),
          } as any)
          .eq('user_id', verification.userId)
          .eq('organization_id', verification.metadata.organization_id)

        if (updateError) {
          console.error('[INVITATION] Error updating membership:', updateError)
        } else {
          console.log('[INVITATION] Updated membership status to accepted')
        }
      }

      // Generate session
      const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
      })

      if (sessionError || !sessionData) {
        console.error('[INVITATION] Error generating session:', sessionError)
        return NextResponse.redirect(
          new URL('/signin?error=session_generation_failed', request.url)
        )
      }

      // Extract tokens
      const actionLink = sessionData.properties.action_link
      const hashPart = actionLink.split('#')[1]

      if (!hashPart) {
        console.error('[INVITATION] No hash in action link')
        return NextResponse.redirect(
          new URL('/signin?error=invalid_session_link', request.url)
        )
      }

      const params = new URLSearchParams(hashPart)
      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!accessToken || !refreshToken) {
        console.error('[INVITATION] Missing tokens in action link')
        return NextResponse.redirect(
          new URL('/signin?error=missing_session_tokens', request.url)
        )
      }

      // Set session cookies and redirect to dashboard
      const response = NextResponse.redirect(
        new URL('/dashboard?message=invitation_accepted', request.url)
      )

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

      console.log('[INVITATION] Returning user, redirecting to dashboard')

      return response
    }

  } catch (error: any) {
    console.error('[INVITATION] Exception:', error)
    return NextResponse.redirect(
      new URL('/signin?error=unexpected_error', request.url)
    )
  }
}
