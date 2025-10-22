"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

/**
 * Hook to check authentication status and redirect to signin if not authenticated
 * Uses session-based authentication instead of Supabase JWT cookies
 * @param redirectTo - Optional custom redirect path after signin
 */
export function useAuthRedirect(redirectTo?: string) {
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }

    // If no session after loading, redirect to signin
    if (!session) {
      // Build redirect URL with return path
      const signinUrl = redirectTo
        ? `/signin?redirect=${encodeURIComponent(redirectTo)}`
        : '/signin';

      // Single redirect using window.location for reliability
      window.location.href = signinUrl;
    }
  }, [session, loading, router, redirectTo]);
}