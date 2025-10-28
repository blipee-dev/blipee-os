"use client";

import React from "react";
import { AppLayout } from "@/components/blipee-os/AppLayout";
import { MobileSettingsSidebar } from "./MobileSettingsSidebar";
import { useSettings } from "@/contexts/SettingsContext";
import { useRouter } from "next/navigation";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { useAuth } from "@/lib/auth/context";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";

interface SettingsLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function SettingsLayout({ children, pageTitle = "Settings" }: SettingsLayoutProps) {
  const router = useRouter();
  const { sidebarOpen, closeSidebar } = useSettings();
  const { user } = useAuth();
  const { data: organizationData } = useOrganizationContext(!!user);

  return (
    <>
      <AppLayout
        conversations={[]}
        onNewConversation={() => router.push("/blipee-ai")}
        onSelectConversation={(id) => {}}
        onDeleteConversation={(id) => {}}
        showSidebar={false}
        pageTitle={pageTitle}
        hideFloatingButton={true}
      >
        <div className="bg-white dark:bg-[#212121] min-h-screen">
          {/* Content */}
          <div className="relative h-full">
            {children}
          </div>

          {/* Mobile Settings Sidebar */}
          <MobileSettingsSidebar
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
        </div>
      </AppLayout>

      {/* Floating AI Chat */}
      {organizationData?.id && (
        <FloatingChat organizationId={organizationData.id} />
      )}
    </>
  );
}
