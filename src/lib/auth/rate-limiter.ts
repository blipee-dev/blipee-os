/**
 * Rate Limiting Service
 * Provides rate limiting for API endpoints to prevent abuse
 */

import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix?: string; // Optional prefix for storage keys
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: Date;
  limit: number;
}

// In-memory store for rate limits (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limit check function
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = config.keyPrefix ? `${config.keyPrefix}:${identifier}` : identifier;
  const now = Date.now();

  // Get current rate limit data
  const current = rateLimitStore.get(key);

  // If no data or window expired, create new entry
  if (!current || now >= current.resetTime) {
    const resetTime = now + config.windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      reset: new Date(resetTime),
      limit: config.maxRequests
    };
  }

  // Increment counter
  const newCount = current.count + 1;

  // Check if limit exceeded
  if (newCount > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      reset: new Date(current.resetTime),
      limit: config.maxRequests
    };
  }

  // Update counter
  rateLimitStore.set(key, { count: newCount, resetTime: current.resetTime });

  return {
    allowed: true,
    remaining: config.maxRequests - newCount,
    reset: new Date(current.resetTime),
    limit: config.maxRequests
  };
}

/**
 * Extract identifier from request (user ID or IP address)
 * @param request - Next.js request object
 * @param userId - Optional user ID
 * @returns Identifier string
 */
export function getRequestIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }

  if (realIp) {
    return `ip:${realIp}`;
  }

  return `ip:unknown`;
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict limit for sensitive operations (user creation, password reset)
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'strict'
  },

  // Standard limit for general API operations
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    keyPrefix: 'standard'
  },

  // Lenient limit for read operations
  lenient: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'lenient'
  },

  // User invitation specific
  invitation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10,
    keyPrefix: 'invitation'
  },

  // Password reset specific
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyPrefix: 'password-reset'
  }
} as const;

/**
 * Cleanup expired entries from the store
 * Should be called periodically (e.g., via cron job)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((value, key) => {
    if (now >= value.resetTime) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitStore.delete(key));

  console.log(`Rate limit store cleaned up: removed ${keysToDelete.length} expired entries`);
}

// Set up periodic cleanup (every 10 minutes)
if (typeof window === 'undefined') {
  // Only run in server environment
  setInterval(cleanupRateLimitStore, 10 * 60 * 1000);
}
