import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitService, RateLimitRule } from '../rate-limit/service';
import { getDDoSProtection } from '../ddos/protection';

export interface ProtectionConfig {
  enableRateLimit?: boolean;
  enableDDoSProtection?: boolean;
  customRules?: Record<string, RateLimitRule>;
}

/**
 * Security middleware for rate limiting and DDoS protection
 */
export class SecurityMiddleware {
  private rateLimiter = getRateLimitService();
  private ddosProtection = getDDoSProtection();

  /**
   * Apply security checks to a request
   */
  async protect(
    request: NextRequest,
    options: {
      rateLimitKey?: string;
      rateLimitRule?: string | RateLimitRule;
      skipDDoS?: boolean;
    } = {}
  ): Promise<NextResponse | null> {
    try {
      // 1. DDoS Protection
      if (!options.skipDDoS) {
        const ddosResult = await this.ddosProtection.shouldBlock(request);
        if (ddosResult.blocked) {
          return this.createBlockedResponse(
            `Access denied: ${ddosResult.reason || 'Security violation'}`,
            403,
            {
              'X-Security-Score': ddosResult.score?.toString() || '1',
            }
          );
        }
      }

      // 2. Rate Limiting
      if (options.rateLimitKey && options.rateLimitRule) {
        const rateLimitResult = await this.rateLimiter.check(
          options.rateLimitKey,
          options.rateLimitRule
        );

        if (!rateLimitResult.allowed) {
          return this.createBlockedResponse(
            'Rate limit exceeded',
            429,
            this.rateLimiter.getHeaders(rateLimitResult)
          );
        }

        // Add rate limit headers to successful responses
        const response = NextResponse.next();
        const headers = this.rateLimiter.getHeaders(rateLimitResult);
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return null; // Continue to next middleware
    } catch (error) {
      console.error('Security middleware error:', error);
      // Fail open on errors to prevent blocking legitimate traffic
      return null;
    }
  }

  /**
   * Apply rate limiting for API routes
   */
  async protectAPI(
    request: NextRequest,
    endpoint: string,
    userId?: string
  ): Promise<NextResponse | null> {
    const ip = this.getClientIP(request);
    
    // Check multiple rate limits
    const checks = [
      // Global IP limit
      this.rateLimiter.check(ip, 'global:ip'),
      // Endpoint-specific limit
      this.rateLimiter.check(
        this.rateLimiter.createCompositeKey(ip, endpoint),
        `api:${endpoint}` in this.rateLimiter['config'].limits ? `api:${endpoint}` : 'api:general'
      ),
    ];

    // Add user-specific limit if authenticated
    if (userId) {
      checks.push(this.rateLimiter.check(userId, 'global:user'));
    }

    const results = await Promise.all(checks);
    const blocked = results.find(r => !r.allowed);

    if (blocked) {
      return this.createBlockedResponse(
        'Rate limit exceeded',
        429,
        this.rateLimiter.getHeaders(blocked)
      );
    }

    // Add rate limit headers from most restrictive limit
    const mostRestrictive = results.reduce((prev, curr) => 
      curr.remaining < prev.remaining ? curr : prev
    );

    const response = NextResponse.next();
    const headers = this.rateLimiter.getHeaders(mostRestrictive);
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return null;
  }

  /**
   * Apply rate limiting for authentication routes
   */
  async protectAuth(
    request: NextRequest,
    action: 'signin' | 'signup' | 'reset' | 'mfa'
  ): Promise<NextResponse | null> {
    const ip = this.getClientIP(request);
    const email = await this.extractEmail(request);
    
    // Create composite key for IP + email
    const key = email 
      ? this.rateLimiter.createCompositeKey(ip, email)
      : ip;

    const result = await this.rateLimiter.check(key, `auth:${action}`);

    if (!result.allowed) {
      return this.createBlockedResponse(
        'Too many attempts. Please try again later.',
        429,
        this.rateLimiter.getHeaders(result)
      );
    }

    return null;
  }

  /**
   * Reset rate limits for a user (e.g., after successful auth)
   */
  async resetLimits(identifier: string, rule?: string): Promise<void> {
    await this.rateLimiter.reset(identifier, rule);
  }

  /**
   * Create blocked response
   */
  private createBlockedResponse(
    message: string,
    status: number,
    headers: Record<string, string> = {}
  ): NextResponse {
    const response = NextResponse.json(
      { error: message },
      { status }
    );

    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  /**
   * Get client IP from request
   */
  private getClientIP(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    return request.ip || '127.0.0.1';
  }

  /**
   * Extract email from request body
   */
  private async extractEmail(request: NextRequest): Promise<string | null> {
    try {
      const contentType = request.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        return null;
      }

      const body = await request.clone().json();
      return body.email || null;
    } catch {
      return null;
    }
  }
}

// Singleton instance
let securityMiddleware: SecurityMiddleware | null = null;

export function getSecurityMiddleware(): SecurityMiddleware {
  if (!securityMiddleware) {
    securityMiddleware = new SecurityMiddleware();
  }
  return securityMiddleware;
}