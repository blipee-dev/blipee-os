/**
 * CSRF Protection Utilities
 * 
 * Provides CSRF token generation and validation for public API routes.
 * Server Actions are automatically protected by Next.js.
 */

import { cookies } from 'next/headers'
import crypto from 'crypto'

const CSRF_TOKEN_NAME = 'csrf_token'
const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_MAX_AGE = 60 * 60 * 24 // 24 hours

/**
 * Generate a new CSRF token and set it as a cookie
 * Returns the token value that should be included in forms
 */
export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  const cookieStore = await cookies()
  
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: CSRF_TOKEN_MAX_AGE,
    path: '/',
  })
  
  return token
}

/**
 * Validate CSRF token from request
 * Compares token from request header/body with token in cookie
 */
export async function validateCSRFToken(requestToken: string | null): Promise<boolean> {
  if (!requestToken) {
    return false
  }

  const cookieStore = await cookies()
  const storedToken = cookieStore.get(CSRF_TOKEN_NAME)
  
  if (!storedToken?.value) {
    return false
  }
  
  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(requestToken),
    Buffer.from(storedToken.value)
  )
}

/**
 * Get the current CSRF token without generating a new one
 * Returns null if no token exists
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CSRF_TOKEN_NAME)
  return token?.value || null
}

/**
 * Delete the CSRF token cookie
 */
export async function deleteCSRFToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_TOKEN_NAME)
}

/**
 * Middleware helper to check CSRF for public API routes
 * Returns true if valid, false otherwise
 */
export async function checkCSRF(headers: Headers): Promise<{
  valid: boolean
  token?: string
}> {
  // Get token from header (preferred) or fall back to body
  const headerToken = headers.get('x-csrf-token')
  
  if (!headerToken) {
    return { valid: false }
  }
  
  const valid = await validateCSRFToken(headerToken)
  
  return { valid, token: headerToken }
}

/**
 * Helper to extract CSRF token from request body
 * Used when token is sent as part of form data
 */
export function extractCSRFFromBody(body: any): string | null {
  if (!body || typeof body !== 'object') {
    return null
  }
  
  return body.csrf_token || body.csrfToken || body._csrf || null
}
