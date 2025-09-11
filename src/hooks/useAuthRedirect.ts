"use client";

import { useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

/**
 * Hook to check authentication status and redirect to signin if not authenticated
 * @param redirectTo - Optional custom redirect path after signin
 */
export function useAuthRedirect(redirectTo?: string) {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('useAuthRedirect: Checking auth for', redirectTo);
        console.log('useAuthRedirect: Session:', session);
        console.log('useAuthRedirect: Error:', error);
        
        if (!session) {
          // Build redirect URL with return path
          const signinUrl = redirectTo 
            ? `/signin?redirect=${encodeURIComponent(redirectTo)}`
            : '/signin';
          
          console.log('useAuthRedirect: No session, redirecting to:', signinUrl);
          
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
        console.error('useAuthRedirect: Error checking auth:', error);
        // On error, redirect to signin for safety
        const signinUrl = '/signin';
        router.push(signinUrl);
        window.location.href = signinUrl;
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('useAuthRedirect: Auth state changed:', event, session);
      
      if (event === 'SIGNED_OUT' || (!session && event !== 'INITIAL_SESSION')) {
        const signinUrl = redirectTo 
          ? `/signin?redirect=${encodeURIComponent(redirectTo)}`
          : '/signin';
        
        console.log('useAuthRedirect: Auth state change - redirecting to:', signinUrl);
        
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