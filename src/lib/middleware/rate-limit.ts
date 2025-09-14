import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Cleanup every minute

export function createRateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests',
    keyGenerator = (request: NextRequest) => {
      // Default: Use IP address or user ID if available
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';
      return ip;
    }
  } = config;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const key = keyGenerator(request);
    const now = Date.now();
    const resetTime = now + windowMs;

    let entry = rateLimitStore.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired entry
      entry = { count: 1, resetTime };
      rateLimitStore.set(key, entry);
    } else {
      // Increment existing entry
      entry.count++;
    }

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: message,
          retryAfter,
          limit: maxRequests,
          window: windowMs / 1000,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
            'Retry-After': retryAfter.toString(),
          },
        }
      );
    }

    // Add rate limit headers to successful requests
    const remaining = maxRequests - entry.count;
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', entry.resetTime.toString());

    return null; // Continue to next middleware/handler
  };
}

// Predefined rate limiters for common use cases
export const rateLimiters = {
  // General API endpoints - 100 requests per minute
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many API requests, please try again later',
  }),

  // AI endpoints - 20 requests per minute (more expensive)
  ai: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many AI requests, please try again later',
  }),

  // Authentication endpoints - 5 attempts per minute
  auth: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later',
  }),

  // File upload endpoints - 10 uploads per minute
  upload: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many file uploads, please try again later',
  }),

  // Strict rate limiting for sensitive endpoints - 3 per minute
  strict: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3,
    message: 'Rate limit exceeded for sensitive operation',
  }),
};

// Helper to apply rate limiting to API routes
export async function withRateLimit(
  request: NextRequest,
  rateLimiter: (request: NextRequest) => Promise<NextResponse | null>
): Promise<NextResponse | null> {
  return await rateLimiter(request);
}