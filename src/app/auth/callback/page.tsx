"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Get parameters from URL
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Check for code (OAuth flow)
      const code = searchParams.get("code");

      // Check for access_token (magic link/invite flow)
      const accessToken = hashParams.get("access_token") || searchParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token") || searchParams.get("refresh_token");

      // Check for type
      const type = hashParams.get("type") || searchParams.get("type");

      // Check for errors
      const error = hashParams.get("error") || searchParams.get("error");
      const errorCode = hashParams.get("error_code") || searchParams.get("error_code");
      const errorDescription = hashParams.get("error_description") || searchParams.get("error_description");

      console.log("Auth callback - type:", type, "code:", !!code, "token:", !!accessToken, "error:", error);

      // Handle errors
      if (error) {
        console.error("Auth error:", error, errorCode, errorDescription);

        // Handle specific error cases
        if (errorCode === "otp_expired") {
          router.push("/signin?error=link_expired&message=" + encodeURIComponent("Your invitation link has expired. Please request a new one."));
        } else if (error === "access_denied") {
          router.push("/signin?error=access_denied&message=" + encodeURIComponent(errorDescription || "Access was denied."));
        } else {
          router.push("/signin?error=auth_failed&message=" + encodeURIComponent(errorDescription || "Authentication failed."));
        }
        return;
      }

      if (code) {
        // OAuth/code flow (PKCE)
        console.log("Exchanging code for session...");
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Error exchanging code for session:", error.message, error);
          // Show more specific error
          router.push(`/signin?error=auth_failed&message=${encodeURIComponent(error.message)}`);
          return;
        }

        console.log("Code exchange successful, session:", !!data.session);
      } else if (accessToken && refreshToken) {
        // Magic link/invite flow with tokens
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("Error setting session from tokens:", error);
          router.push("/signin?error=auth_failed");
          return;
        }
      }

      // Wait for session to be established using auth state change listener
      const { data: { session } } = await new Promise<{ data: { session: any } }>((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session) {
            subscription.unsubscribe();
            resolve({ data: { session } });
          }
        });

        // Fallback: check immediately in case session is already available
        supabase.auth.getSession().then((result) => {
          if (result.data.session) {
            subscription.unsubscribe();
            resolve(result);
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          subscription.unsubscribe();
          supabase.auth.getSession().then(resolve);
        }, 10000);
      });

      if (session) {
        // Check the type of authentication flow
        const isPasswordRecovery = type === "recovery";
        const isInvitation = type === "invite";

        console.log("Session found - type:", type, "isPasswordRecovery:", isPasswordRecovery, "isInvitation:", isInvitation);

        // If it's a password recovery, redirect to reset password page
        if (isPasswordRecovery) {
          router.push("/auth/reset-password");
        } else if (isInvitation) {
          // If it's an invitation, check if password has been set
          const passwordSet = session.user.user_metadata?.password_set;
          if (!passwordSet) {
            router.push("/auth/accept-invitation");
          } else {
            router.push("/sustainability");
          }
        } else {
          // Regular login, redirect to sustainability overview
          router.push("/sustainability");
        }
      } else {
        console.log("No session found, redirecting to signin");
        router.push("/signin");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Completing sign in...
        </p>
      </div>
    </div>
  );
}
