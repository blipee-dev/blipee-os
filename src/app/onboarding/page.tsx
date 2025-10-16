"use client";

import { useRouter } from "next/navigation";
import { ConversationalOnboarding } from "@/components/onboarding/ConversationalOnboarding";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/signin");
        return;
      }
      setUserId(user.id);
    };
    checkUser();
  }, [router]);

  const handleComplete = async (config: any) => {
    // Save onboarding configuration

    // Navigate to blipee-ai
    router.push("/blipee-ai");
  };

  if (!userId) return null;

  return (
    <ConversationalOnboarding onComplete={handleComplete} userId={userId} />
  );
}
