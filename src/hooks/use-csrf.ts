'use client';

import { useEffect, useState } from 'react';

const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

interface UseCSRFReturn {
  token: string | null;
  headers: Record<string, string>;
  secureFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

export function useCSRF(): UseCSRFReturn {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Get CSRF token from cookie
    const getTokenFromCookie = () => {
      if (typeof document === 'undefined') return null;
      
      const match = document.cookie
        .split('; ')
        .find(row => row.startsWith(CSRF_COOKIE_NAME + '='));
      
      return match ? match.split('=')[1] : null;
    };

    const currentToken = getTokenFromCookie();
    setToken(currentToken);

    // Watch for cookie changes
    const checkToken = () => {
      const newToken = getTokenFromCookie();
      if (newToken !== token) {
        setToken(newToken);
      }
    };

    const interval = setInterval(checkToken, 1000);
    return () => clearInterval(interval);
  }, [token]);

  const headers = token ? { [CSRF_HEADER_NAME]: token } : {};

  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        ...headers,
      },
      credentials: 'include',
    });

    // If CSRF token is invalid, try to refresh and retry once
    if (response.status === 403) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.includes('CSRF')) {
        // Refresh the page to get a new token
        window.location.reload();
      }
    }

    return response;
  };

  return { token, headers, secureFetch };
}

/**
 * Higher-order component to ensure CSRF token is available
 */
export function withCSRF<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithCSRFComponent(props: P) {
    const { token } = useCSRF();
    
    if (!token) {
      return <div>Loading security token...</div>;
    }
    
    return <Component {...props} />;
  };
}