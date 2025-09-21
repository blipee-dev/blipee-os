import { NextRequest, NextResponse } from 'next/server';

interface SecurityHeaders {
  [key: string]: string;
}

// Security headers configuration
const defaultSecurityHeaders: SecurityHeaders = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',

  // Prevent information leakage
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',

  // Content Security Policy - restrictive for APIs
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",

  // Strict Transport Security (HTTPS enforcement)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // Prevent MIME type sniffing
  'X-Permitted-Cross-Domain-Policies': 'none',

  // Remove server information
  'Server': '',

  // Cache control for sensitive API responses
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(defaultSecurityHeaders).forEach(([key, value]) => {
    if (value) {
      response.headers.set(key, value);
    } else {
      response.headers.delete(key);
    }
  });

  return response;
}

// CORS configuration
export interface CorsConfig {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultCorsConfig: CorsConfig = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.NEXT_PUBLIC_BASE_URL || ''].filter(Boolean)
    : true, // Allow all origins in development
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

export function handleCors(request: NextRequest, config: CorsConfig = {}): NextResponse | null {
  const corsConfig = { ...defaultCorsConfig, ...config };
  const origin = request.headers.get('origin');
  const method = request.method;

  // Handle preflight requests
  if (method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });

    // Set CORS headers
    if (corsConfig.origin === true) {
      response.headers.set('Access-Control-Allow-Origin', '*');
    } else if (typeof corsConfig.origin === 'string') {
      response.headers.set('Access-Control-Allow-Origin', corsConfig.origin);
    } else if (Array.isArray(corsConfig.origin) && origin) {
      if (corsConfig.origin.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
      }
    }

    if (corsConfig.methods) {
      response.headers.set('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
    }

    if (corsConfig.allowedHeaders) {
      response.headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
    }

    if (corsConfig.credentials) {
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (corsConfig.maxAge) {
      response.headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
    }

    return addSecurityHeaders(response);
  }

  return null; // Continue to next middleware/handler
}

// Input sanitization
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

// SQL injection prevention (basic)
const sqlInjectionPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  /(;|--|\/\*|\*\/)/,
  /(\bOR\b.*=.*\b|\bAND\b.*=.*\b)/i,
];

export function detectSqlInjection(input: string): boolean {
  return sqlInjectionPatterns.some(pattern => pattern.test(input));
}

// XSS detection
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
];

export function detectXss(input: string): boolean {
  return xssPatterns.some(pattern => pattern.test(input));
}

// Request body sanitization middleware
export async function sanitizeRequestBody(request: NextRequest): Promise<NextRequest | NextResponse> {
  try {
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
      const contentType = request.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const body = await request.json();

        // Check for malicious content in JSON values
        const jsonString = JSON.stringify(body);

        if (detectSqlInjection(jsonString) || detectXss(jsonString)) {
          return NextResponse.json(
            { error: 'Malicious content detected in request' },
            { status: 400 }
          );
        }
      }
    }

    return request; // Continue processing
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}

// IP-based blocking (basic implementation)
const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, { count: number; lastSeen: number }>();

export function checkIPReputation(request: NextRequest): NextResponse | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.ip || 'unknown';

  // Check if IP is blocked
  if (blockedIPs.has(ip)) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  // Track suspicious activity
  const now = Date.now();
  const suspicious = suspiciousIPs.get(ip);

  if (suspicious) {
    // If more than 50 requests in last hour, consider blocking
    if (suspicious.count > 50 && (now - suspicious.lastSeen) < 3600000) {
      blockedIPs.add(ip);
      return NextResponse.json(
        { error: 'Too many suspicious requests' },
        { status: 429 }
      );
    }

    suspicious.count++;
    suspicious.lastSeen = now;
  } else {
    suspiciousIPs.set(ip, { count: 1, lastSeen: now });
  }

  // Cleanup old entries
  if (Math.random() < 0.01) { // 1% chance to cleanup
    for (const [suspiciousIP, data] of suspiciousIPs.entries()) {
      if ((now - data.lastSeen) > 86400000) { // 24 hours
        suspiciousIPs.delete(suspiciousIP);
      }
    }
  }

  return null; // Continue processing
}

// Comprehensive security middleware
export interface SecurityConfig {
  rateLimit?: boolean;
  cors?: boolean | CorsConfig;
  inputSanitization?: boolean;
  ipReputation?: boolean;
  securityHeaders?: boolean;
}

export async function withSecurity(
  request: NextRequest,
  config: SecurityConfig = {}
): Promise<NextResponse | null> {
  const {
    cors = true,
    inputSanitization = true,
    ipReputation = true,
    securityHeaders = true,
  } = config;

  // Check IP reputation
  if (ipReputation) {
    const ipCheck = checkIPReputation(request);
    if (ipCheck) return ipCheck;
  }

  // Handle CORS
  if (cors) {
    const corsConfig = typeof cors === 'object' ? cors : {};
    const corsResponse = handleCors(request, corsConfig);
    if (corsResponse) return corsResponse;
  }

  // Sanitize request body
  if (inputSanitization) {
    const sanitizedRequest = await sanitizeRequestBody(request);
    if (sanitizedRequest instanceof NextResponse) {
      return sanitizedRequest;
    }
  }

  return null; // Continue to next middleware/handler
}