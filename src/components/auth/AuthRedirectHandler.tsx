"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AuthRedirectHandler() {
  const router = useRouter();

  useEffect(() => {
    // Check if there are auth tokens in the URL hash
    const hash = window.location.hash;

    if (hash && hash.includes('access_token')) {
      // We have auth tokens, redirect to callback to handle them

      // Redirect to auth callback with the hash
      router.push(`/auth/callback${hash}`);
    }
  }, [router]);

  return null; // This component doesn't render anything
}