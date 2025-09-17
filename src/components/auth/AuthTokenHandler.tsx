"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Enterprise-grade auth token handler for Supabase invitation flows
 * Handles auth tokens in URL hash fragments and redirects appropriately
 */
export function AuthTokenHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only handle on root path to avoid infinite loops
    if (pathname !== '/') return;

    // Check for auth tokens in hash fragment
    const hash = window.location.hash;

    if (!hash) return;

    // Parse hash parameters
    const hashParams = new URLSearchParams(hash.substring(1));

    // Check if this is an auth callback (has access_token)
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (accessToken) {
      // Log for monitoring (in production, send to monitoring service)
      console.log('[AuthTokenHandler] Detected auth tokens, type:', type);

      // Construct proper callback URL
      // In enterprise apps, we handle tokens server-side when possible
      // But Supabase uses hash fragments which require client-side handling
      const callbackUrl = `/auth/callback${hash}`;

      // Redirect to auth callback handler
      router.replace(callbackUrl);
    }
  }, [pathname, router]);

  return null; // This component doesn't render anything
}