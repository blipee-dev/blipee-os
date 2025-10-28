/**
 * Client-side CSRF utilities
 *
 * These functions can be used in client components to include CSRF tokens in requests.
 */

const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Hook to use CSRF token in client components
 *
 * Reads the CSRF token from the cookie and returns headers to include in fetch requests.
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
 * Get the CSRF token from cookies (client-side)
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith(CSRF_COOKIE_NAME + '='))
    ?.split('=')[1];

  return token || null;
}
