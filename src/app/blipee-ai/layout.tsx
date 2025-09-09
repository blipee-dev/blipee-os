"use client";

import React from "react";
import { useRequireAuth } from "@/lib/auth/context";
import { BuildingProvider } from "@/contexts/BuildingContext";
import { Loader2 } from "lucide-react";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { session, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BuildingProvider>
      <DashboardContent>{children}</DashboardContent>
    </BuildingProvider>
  );
}