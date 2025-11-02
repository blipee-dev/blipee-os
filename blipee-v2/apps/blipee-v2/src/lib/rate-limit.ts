/**
 * Rate Limiting Utilities
 * 
 * Provides rate limiting for Server Actions and API routes using Upstash Redis.
 * Prevents brute force attacks, DoS, and API abuse.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

/**
 * Rate limiter for authentication actions (signin, signup, password reset)
 * 5 attempts per 15 minutes per IP
 */
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'),
      analytics: true,
      prefix: 'ratelimit:auth',
    })
  : null

/**
 * Rate limiter for public API routes (newsletter, contact, support)
 * 10 requests per minute per IP
 */
export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'ratelimit:api',
    })
  : null

/**
 * Rate limiter for password reset requests
 * More restrictive: 3 attempts per 1 hour per IP
 */
export const passwordResetRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, '1 h'),
      analytics: true,
      prefix: 'ratelimit:password-reset',
    })
  : null

/**
 * Get client IP address from headers
 * Supports Vercel, Cloudflare, and standard proxies
 */
export function getClientIP(headers: Headers): string {
  // Try Vercel headers first
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Try Cloudflare
  const cfConnectingIp = headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  // Try standard X-Real-IP
  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Check rate limit and return result
 * Returns { success: boolean, limit: number, remaining: number, reset: number }
 */
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  if (!limiter) {
    // If rate limiting is not configured (e.g., in development without Upstash),
    // allow the request but log a warning
    console.warn('⚠️  Rate limiting not configured - requests are not being limited')
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    }
  }

  try {
    const result = await limiter.limit(identifier)
    return result
  } catch (error) {
    // If rate limiting fails (e.g., Redis is down), allow the request
    // but log the error for monitoring
    console.error('❌ Rate limiting error:', error)
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
    }
  }
}

/**
 * Format remaining time for user-friendly error messages
 */
export function formatResetTime(resetTimestamp: number): string {
  const now = Date.now()
  const resetDate = new Date(resetTimestamp)
  const diff = resetDate.getTime() - now

  if (diff <= 0) {
    return 'now'
  }

  const minutes = Math.ceil(diff / 1000 / 60)
  
  if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours > 1 ? 's' : ''}`
}
