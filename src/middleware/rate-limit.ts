/**
 * Rate limiting middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const identifier = request.ip || request.headers.get('x-forwarded-for') || 'anonymous';
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Clean up old entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    // Get current count for this identifier
    const current = rateLimitStore.get(identifier);
    
    if (!current || current.resetTime < windowStart) {
      // Reset window
      rateLimitStore.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return null; // Allow request
    }

    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        { error: config.message || 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Increment count
    current.count++;
    rateLimitStore.set(identifier, current);
    
    return null; // Allow request
  };
}

// Backward compatibility export
export const withRateLimit = rateLimit;