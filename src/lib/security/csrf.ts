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
 * Generate random bytes using Web Crypto API (Edge Runtime compatible)
 */
function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert bytes to hex string
 */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate HMAC signature using Web Crypto API (Edge Runtime compatible)
 */
async function generateHmacSignature(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return bytesToHex(new Uint8Array(signature));
}

/**
 * Generate a new CSRF token
 */
export async function generateCSRFToken(): Promise<CSRFToken> {
  const randomBytes = generateRandomBytes(CSRF_TOKEN_LENGTH);
  const token = bytesToHex(randomBytes);
  const timestamp = Date.now();

  // Create a signed token with timestamp
  const payload = `${token}.${timestamp}`;
  const signature = await generateHmacSignature(payload, CSRF_SECRET_KEY);

  return {
    token: `${payload}.${signature}`,
    timestamp
  };
}

/**
 * Verify a CSRF token
 */
export async function verifyCSRFToken(token: string): Promise<boolean> {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [tokenValue, timestamp, signature] = parts;

  // Verify signature
  const expectedSignature = await generateHmacSignature(
    `${tokenValue}.${timestamp}`,
    CSRF_SECRET_KEY
  );

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
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  // Verify tokens match and are valid
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return NextResponse.json(
      { error: 'CSRF token validation failed' },
      { status: 403 }
    );
  }

  const isValid = await verifyCSRFToken(headerToken);
  if (!isValid) {
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
export async function setCSRFCookie(response: NextResponse): Promise<void> {
  const { token } = await generateCSRFToken();

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
  const cookieStore = await cookies();
  const token = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (token && await verifyCSRFToken(token)) {
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
 * Enhanced fetch with CSRF token (server-side)
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {},
  csrfToken?: string
): Promise<Response> {
  const token = csrfToken || (await getCSRFToken());
  
  const enhancedOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { [CSRF_HEADER_NAME]: token } : {}),
    },
    credentials: 'include', // Include cookies
  };
  
  return fetch(url, enhancedOptions);
}