"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/sustainability");
    }
  }, [loading, user, router]);

  return <div className="flex items-center justify-center min-h-screen">Preparing your workspace...</div>;
}
