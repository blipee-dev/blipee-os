"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { ConversationalOnboarding } from "@/components/onboarding/ConversationalOnboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to signin if not authenticated
  if (!loading && !user) {
    router.push("/signin");
    return null;
  }

  // Show loading state
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const handleComplete = async (config: any) => {
    // Save onboarding configuration

    // Navigate to blipee-ai
    router.push("/blipee-ai");
  };

  return (
    <ConversationalOnboarding onComplete={handleComplete} userId={user.id} />
  );
}
