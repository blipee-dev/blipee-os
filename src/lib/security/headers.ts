import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security headers configuration
 */
export const securityHeaders = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Control referrer information
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Restrict browser features
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // Enable XSS protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',
  
  // Control DNS prefetching
  'X-DNS-Prefetch-Control': 'on',
  
  // Strict Transport Security (HSTS) - only in production
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  }),
};

/**
 * Content Security Policy configuration
 */
export function getCSPHeader(nonce?: string): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-eval'", // Required for Next.js
      "'unsafe-inline'", // Required for inline scripts (TODO: implement nonces)
      nonce ? `'nonce-${nonce}'` : '',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      'https://vercel.live',
      'https://cdn.vercel-insights.com',
      'https://va.vercel-scripts.com',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind and inline styles
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'https://*.supabase.co',
      'https://*.supabase.in',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://*.supabase.in',
      'https://api.openai.com',
      'https://api.anthropic.com',
      'https://api.deepseek.com',
      'wss://*.supabase.co',
      'wss://*.supabase.in',
      process.env.NODE_ENV === 'development' ? 'ws://localhost:*' : '',
    ].filter(Boolean),
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'block-all-mixed-content': [],
    'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : undefined,
  };

  // Build CSP string
  return Object.entries(directives)
    .filter(([_, values]) => values !== undefined && values.length > 0)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(
  response: NextResponse,
  request?: NextRequest
): NextResponse {
  // Apply standard security headers
  Object.entries(securityHeaders).forEach(([header, value]) => {
    if (value) {
      response.headers.set(header, value);
    }
  });

  // Apply CSP header
  const csp = getCSPHeader();
  response.headers.set('Content-Security-Policy', csp);

  // Additional security headers for API routes
  if (request?.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  return applySecurityHeaders(response, request);
}