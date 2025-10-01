"use client";

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Hook to check authentication status and redirect to signin if not authenticated
 * @param redirectTo - Optional custom redirect path after signin
 */
export function useAuthRedirect(redirectTo?: string) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!session) {
          // Build redirect URL with return path
          const signinUrl = redirectTo
            ? `/signin?redirect=${encodeURIComponent(redirectTo)}`
            : '/signin';

          // Use both methods to ensure redirect happens
          router.push(signinUrl);
          router.replace(signinUrl);

          // Fallback to window.location if router doesn't work
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = signinUrl;
            }
          }, 100);
        }
      } catch (error) {
        // On error, redirect to signin for safety
        const signinUrl = '/signin';
        router.push(signinUrl);
        window.location.href = signinUrl;
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        const signinUrl = redirectTo
          ? `/signin?redirect=${encodeURIComponent(redirectTo)}`
          : '/signin';

        router.push(signinUrl);
        router.replace(signinUrl);

        // Fallback
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = signinUrl;
          }
        }, 100);
      }
    });

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, redirectTo]);
}