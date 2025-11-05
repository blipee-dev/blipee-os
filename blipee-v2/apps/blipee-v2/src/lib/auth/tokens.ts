/**
 * Safe-Link Proof Token Management
 *
 * This module handles reusable authentication tokens that resist email security
 * systems (Microsoft Safe Links, Gmail protection, etc.) that pre-fetch links.
 *
 * Key Features:
 * - Tokens stored in user_metadata, not consumed on first use
 * - Configurable expiry times (default 24-48 hours)
 * - Multiple verification attempts allowed within expiry window
 * - Automatic cleanup after successful verification
 *
 * Inspired by: retail-platform's auth-middleware approach
 */

import { createAdminClient } from '@/lib/supabase/v2/server'
import { randomBytes } from 'crypto'

export type TokenType = 'email_confirmation' | 'password_reset' | 'magic_link' | 'invitation'

export interface TokenData {
  token: string
  type: TokenType
  expires_at: string
  metadata?: Record<string, any>
}

export interface TokenVerification {
  success: boolean
  userId?: string
  email?: string
  error?: string
  metadata?: Record<string, any>
}

/**
 * Generate a cryptographically secure random token
 */
export function generateToken(): string {
  return randomBytes(32).toString('base64url')
}

/**
 * Get expiry time based on token type
 * - email_confirmation: 48 hours
 * - password_reset: 24 hours
 * - magic_link: 1 hour
 * - invitation: 7 days
 */
export function getTokenExpiry(type: TokenType): Date {
  const now = new Date()

  switch (type) {
    case 'email_confirmation':
      return new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours
    case 'password_reset':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
    case 'magic_link':
      return new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
    case 'invitation':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000) // Default 24 hours
  }
}

/**
 * Store a token in user_metadata
 *
 * @param email - User email
 * @param type - Token type
 * @param metadata - Additional metadata to store with token
 * @returns The generated token
 */
export async function storeToken(
  email: string,
  type: TokenType,
  metadata?: Record<string, any>
): Promise<{ token: string; userId?: string; error?: string }> {
  try {
    const adminClient = createAdminClient()

    // Generate token and expiry
    const token = generateToken()
    const expiresAt = getTokenExpiry(type)

    // Get user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error('[TOKEN] Error listing users:', listError)
      return { token: '', error: 'Failed to store token' }
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      console.error('[TOKEN] User not found:', email)
      return { token: '', error: 'User not found' }
    }

    // Store token in user_metadata
    const metadataKey = `${type}_token`
    const expiryKey = `${type}_expires`
    const metadataDataKey = `${type}_metadata`

    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        [metadataKey]: token,
        [expiryKey]: expiresAt.toISOString(),
        ...(metadata ? { [metadataDataKey]: metadata } : {}),
      }
    })

    if (updateError) {
      console.error('[TOKEN] Error storing token:', updateError)
      return { token: '', error: 'Failed to store token' }
    }

    console.log(`[TOKEN] Stored ${type} token for ${email}, expires at ${expiresAt.toISOString()}`)
    return { token, userId: user.id }

  } catch (error) {
    console.error('[TOKEN] Exception storing token:', error)
    return { token: '', error: 'Internal error' }
  }
}

/**
 * Verify a token and return user information
 *
 * @param email - User email
 * @param token - Token to verify
 * @param type - Token type
 * @returns Verification result with user info
 */
export async function verifyToken(
  email: string,
  token: string,
  type: TokenType
): Promise<TokenVerification> {
  try {
    const adminClient = createAdminClient()

    // Get user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers()

    if (listError) {
      console.error('[TOKEN] Error listing users:', listError)
      return { success: false, error: 'Verification failed' }
    }

    const user = users.find(u => u.email === email)

    if (!user) {
      console.error('[TOKEN] User not found:', email)
      return { success: false, error: 'Invalid token' }
    }

    // Check token in user_metadata
    const metadataKey = `${type}_token`
    const expiryKey = `${type}_expires`
    const metadataDataKey = `${type}_metadata`

    const storedToken = user.user_metadata?.[metadataKey]
    const expiresAt = user.user_metadata?.[expiryKey]
    const metadata = user.user_metadata?.[metadataDataKey]

    // Verify token exists
    if (!storedToken) {
      console.error('[TOKEN] No token found in metadata')
      return { success: false, error: 'Invalid or expired token' }
    }

    // Verify expiry
    if (!expiresAt || new Date(expiresAt) < new Date()) {
      console.error('[TOKEN] Token expired')
      return { success: false, error: 'Token has expired. Please request a new one.' }
    }

    // Verify token matches
    if (storedToken !== token) {
      console.error('[TOKEN] Token mismatch')
      return { success: false, error: 'Invalid token' }
    }

    console.log(`[TOKEN] Successfully verified ${type} token for ${email}`)

    return {
      success: true,
      userId: user.id,
      email: user.email!,
      metadata
    }

  } catch (error) {
    console.error('[TOKEN] Exception verifying token:', error)
    return { success: false, error: 'Verification failed' }
  }
}

/**
 * Clear a token from user_metadata after successful use
 *
 * @param userId - User ID
 * @param type - Token type to clear
 */
export async function clearToken(userId: string, type: TokenType): Promise<void> {
  try {
    const adminClient = createAdminClient()

    // Get current user metadata
    const { data: { user }, error: getUserError } = await adminClient.auth.admin.getUserById(userId)

    if (getUserError || !user) {
      console.error('[TOKEN] Error getting user:', getUserError)
      return
    }

    // Clear token fields
    const metadataKey = `${type}_token`
    const expiryKey = `${type}_expires`
    const metadataDataKey = `${type}_metadata`

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...user.user_metadata,
        [metadataKey]: null,
        [expiryKey]: null,
        [metadataDataKey]: null,
      }
    })

    if (updateError) {
      console.error('[TOKEN] Error clearing token:', updateError)
      return
    }

    console.log(`[TOKEN] Cleared ${type} token for user ${userId}`)

  } catch (error) {
    console.error('[TOKEN] Exception clearing token:', error)
  }
}

/**
 * Generate a session URL with token (for emails)
 *
 * @param baseUrl - Base URL of the application
 * @param type - Token type
 * @param email - User email
 * @param token - Generated token
 * @returns Full URL to include in email
 */
export function generateTokenUrl(
  baseUrl: string,
  type: TokenType,
  email: string,
  token: string
): string {
  const encodedEmail = encodeURIComponent(email)
  const encodedToken = encodeURIComponent(token)

  switch (type) {
    case 'email_confirmation':
      return `${baseUrl}/api/auth/confirm-email?email=${encodedEmail}&token=${encodedToken}`
    case 'password_reset':
      return `${baseUrl}/api/auth/reset-password/verify?email=${encodedEmail}&token=${encodedToken}`
    case 'magic_link':
      return `${baseUrl}/api/auth/magic-link/verify?email=${encodedEmail}&token=${encodedToken}`
    case 'invitation':
      return `${baseUrl}/api/auth/invitation/accept?email=${encodedEmail}&token=${encodedToken}`
    default:
      return `${baseUrl}/auth/callback`
  }
}
