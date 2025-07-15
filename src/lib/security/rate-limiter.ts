import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { telemetry } from '../monitoring/telemetry';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  skipPaths?: string[];
  skipAuth?: boolean;
}

export interface RateLimitRule {
  path: string;
  method?: string;
  windowMs: number;
  maxRequests: number;
}

export class RateLimiter {
  private supabase: any;
  private rules: Map<string, RateLimitRule> = new Map();
  private memoryStore: Map<string, { count: number; resetAt: number }> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );

    // Initialize default rules
    this.initializeDefaultRules();

    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, 60000);
  }

  /**
   * Initialize default rate limit rules
   */
  private initializeDefaultRules(): void {
    // API endpoints
    this.addRule({
      path: '/api/v1/orchestrator',
      windowMs: 60000, // 1 minute
      maxRequests: 60  // 60 requests per minute
    });

    this.addRule({
      path: '/api/v1/agents',
      windowMs: 60000,
      maxRequests: 30
    });

    this.addRule({
      path: '/api/v1/ml',
      windowMs: 60000,
      maxRequests: 100
    });

    // Strict limits for expensive operations
    this.addRule({
      path: '/api/v1/ml/train',
      method: 'POST',
      windowMs: 3600000, // 1 hour
      maxRequests: 5
    });

    this.addRule({
      path: '/api/v1/network/benchmark',
      windowMs: 300000, // 5 minutes
      maxRequests: 10
    });

    // Auth endpoints
    this.addRule({
      path: '/api/auth/login',
      windowMs: 900000, // 15 minutes
      maxRequests: 5
    });

    this.addRule({
      path: '/api/auth/register',
      windowMs: 3600000, // 1 hour
      maxRequests: 3
    });
  }

  /**
   * Check rate limit
   */
  async checkLimit(request: NextRequest): Promise<NextResponse | null> {
    const pathname = request.nextUrl.pathname;
    const method = request.method;

    // Find applicable rule
    const rule = this.findRule(pathname, method);
    if (!rule) {
      return null; // No rate limit for this path
    }

    // Generate rate limit key
    const key = this.generateKey(request, rule);

    // Check distributed rate limit (Redis/Supabase)
    const limitExceeded = await this.checkDistributedLimit(key, rule);
    
    if (limitExceeded) {
      // Record metric
      telemetry.recordAPIRequest(
        pathname,
        method,
        0,
        429
      );

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please retry after ${Math.ceil(rule.windowMs / 1000)} seconds.`,
          retryAfter: Math.ceil(rule.windowMs / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rule.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + rule.windowMs).toISOString(),
            'Retry-After': Math.ceil(rule.windowMs / 1000).toString()
          }
        }
      );
    }

    return null; // Allow request
  }

  /**
   * Check distributed rate limit
   */
  private async checkDistributedLimit(key: string, rule: RateLimitRule): Promise<boolean> {
    try {
      // Try distributed store first (Supabase)
      const { data, error } = await this.supabase
        .rpc('increment_rate_limit', {
          p_key: key,
          p_window_ms: rule.windowMs,
          p_max_requests: rule.maxRequests
        });

      if (!error && data) {
        return data.exceeded;
      }

      // Fallback to memory store
      return this.checkMemoryLimit(key, rule);

    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request on error
      return false;
    }
  }

  /**
   * Check rate limit in memory (fallback)
   */
  private checkMemoryLimit(key: string, rule: RateLimitRule): boolean {
    const now = Date.now();
    const record = this.memoryStore.get(key);

    if (!record || now > record.resetAt) {
      // Create new window
      this.memoryStore.set(key, {
        count: 1,
        resetAt: now + rule.windowMs
      });
      return false;
    }

    // Increment count
    record.count++;
    
    // Check if exceeded
    return record.count > rule.maxRequests;
  }

  /**
   * Generate rate limit key
   */
  private generateKey(request: NextRequest, rule: RateLimitRule): string {
    const parts: string[] = ['rl'];

    // Add path
    parts.push(rule.path.replace(/\//g, ':'));

    // Add identifier (API key, user ID, or IP)
    const apiKey = request.headers.get('X-API-Key');
    const userId = request.headers.get('X-User-Id');
    const ip = request.headers.get('X-Forwarded-For') || 
               request.headers.get('X-Real-IP') || 
               'unknown';

    if (apiKey) {
      parts.push('api', apiKey.substring(0, 8));
    } else if (userId) {
      parts.push('user', userId);
    } else {
      parts.push('ip', ip);
    }

    return parts.join(':');
  }

  /**
   * Find applicable rate limit rule
   */
  private findRule(pathname: string, method: string): RateLimitRule | null {
    // Check exact match with method
    const exactKey = `${method}:${pathname}`;
    if (this.rules.has(exactKey)) {
      return this.rules.get(exactKey)!;
    }

    // Check exact match without method
    if (this.rules.has(pathname)) {
      return this.rules.get(pathname)!;
    }

    // Check prefix match
    for (const [key, rule] of this.rules) {
      const path = key.includes(':') ? key.split(':')[1] : key;
      if (pathname.startsWith(path)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Add rate limit rule
   */
  addRule(rule: RateLimitRule): void {
    const key = rule.method ? `${rule.method}:${rule.path}` : rule.path;
    this.rules.set(key, rule);
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.memoryStore) {
      if (now > record.resetAt) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * Shutdown rate limiter
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Create rate limiter instance
 */
export const rateLimiter = new RateLimiter();

/**
 * Rate limit middleware for specific endpoints
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: Partial<RateLimitConfig>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const limited = await rateLimiter.checkLimit(req);
    if (limited) {
      return limited;
    }
    return handler(req);
  };
}