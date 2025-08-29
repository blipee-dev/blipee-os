import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';
const CSRF_SECRET_KEY = process.env.CSRF_SECRET_KEY || 'default-csrf-secret-key';

// Methods that require CSRF protection
const PROTECTED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Paths that are exempt from CSRF protection
const EXEMPT_PATHS = new Set([
  '/api/auth/callback',  // OAuth callbacks
  '/api/webhooks',       // External webhooks
  '/api/health',         // Health checks
]);

export interface CSRFToken {
  token: string;
  timestamp: number;
}

/**
 * Generate a new CSRF token
 */
export function generateCSRFToken(): CSRFToken {
  const randomBytes = crypto.randomBytes(CSRF_TOKEN_LENGTH);
  const token = randomBytes.toString('hex');
  const timestamp = Date.now();
  
  // Create a signed token with timestamp
  const payload = `${token}.${timestamp}`;
  const signature = crypto
    .createHmac('sha256', CSRF_SECRET_KEY)
    .update(payload)
    .digest('hex');
  
  return {
    token: `${payload}.${signature}`,
    timestamp
  };
}

/**
 * Verify a CSRF token
 */
export function verifyCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [tokenValue, timestamp, signature] = parts;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', CSRF_SECRET_KEY)
    .update(`${tokenValue}.${timestamp}`)
    .digest('hex');
  
  if (signature !== expectedSignature) {
    return false;
  }
  
  // Check token age (24 hours)
  const tokenAge = Date.now() - parseInt(timestamp);
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  return tokenAge <= maxAge;
}

/**
 * CSRF middleware for API routes
 */
export async function csrfMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const method = request.method;

  // Skip CSRF for exempt paths
  if (EXEMPT_PATHS.has(pathname)) {
    return null;
  }

  // Skip CSRF for safe methods
  if (!PROTECTED_METHODS.has(method)) {
    return null;
  }

  // Get CSRF token from header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  
  // Get CSRF token from cookie
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  // Verify tokens match and are valid
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return NextResponse.json(
      { error: 'CSRF token validation failed' },
      { status: 403 }
    );
  }

  if (!verifyCSRFToken(headerToken)) {
    return NextResponse.json(
      { error: 'CSRF token expired or invalid' },
      { status: 403 }
    );
  }

  return null; // Continue to next middleware
}

/**
 * Set CSRF token in response cookies
 */
export function setCSRFCookie(response: NextResponse): void {
  const { token } = generateCSRFToken();
  
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be accessible by JavaScript
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  });
}

/**
 * Get CSRF token for the current session
 */
export async function getCSRFToken(): Promise<string | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME)?.value;
  
  if (token && verifyCSRFToken(token)) {
    return token;
  }
  
  return null;
}

/**
 * Hook to use CSRF token in client components
 */
export function useCSRFHeaders(): Record<string, string> {
  if (typeof window === 'undefined') {
    return {};
  }

  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith(CSRF_COOKIE_NAME + '='))
    ?.split('=')[1];

  if (!token) {
    console.warn('CSRF token not found in cookies');
    return {};
  }

  return {
    [CSRF_HEADER_NAME]: token
  };
}

/**
 * Enhanced fetch with CSRF token
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfHeaders = useCSRFHeaders();
  
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      ...csrfHeaders,
    },
    credentials: 'include', // Include cookies
  };
  
  return fetch(url, enhancedOptions);
}