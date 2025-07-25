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

      // Get the code from the URL
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        // Exchange code for session
        const { error: _error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          console.error("Error exchanging code for session:");
          router.push("/signin?error=auth_failed");
          return;
        }
      }

      // Check if we have a session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Check if this is a new user
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single();

        if (profile?.onboarding_completed) {
          router.push("/dashboard");
        } else {
          router.push("/onboarding");
        }
      } else {
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
