'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface SSOAuthOptions {
  domain?: string;
  returnUrl?: string;
}

export function useSSOAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const initiateSSO = useCallback(async (options: SSOAuthOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (options.domain) {
        params.append('domain', options.domain);
      }
      if (options.returnUrl) {
        params.append('returnUrl', options.returnUrl);
      }

      const response = await fetch(`/api/auth/sso/initiate?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to initiate SSO');
      }

      const data = await response.json();

      // Redirect to the SSO provider
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL provided');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate SSO';
      setError(errorMessage);
      setLoading(false);
    }
  }, []);

  const checkSSO = useCallback(async (email: string): Promise<boolean> => {
    try {
      const domain = email.split('@')[1];
      if (!domain) return false;

      const response = await fetch(`/api/auth/sso/check?domain=${domain}`);
      if (!response.ok) return false;

      const data = await response.json();
      return data.ssoRequired;
    } catch {
      return false;
    }
  }, []);

  return {
    initiateSSO,
    checkSSO,
    loading,
    error,
  };
}