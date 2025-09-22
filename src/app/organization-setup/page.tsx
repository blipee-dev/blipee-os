"use client";

import { OrganizationSetup } from "@/components/auth/OrganizationSetup";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function OrganizationSetupPage() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If user already has an organization, redirect to main app
    if (session?.current_organization || session?.organizations?.length > 0) {
      router.push("/blipee-ai");
    }
  }, [session, router]);

  return <OrganizationSetup />;
}