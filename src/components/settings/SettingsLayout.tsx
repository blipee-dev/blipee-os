<<<<<<< HEAD
"use client";

import React from "react";
import { AppLayout } from "@/components/blipee-os/AppLayout";
import { MobileSettingsSidebar } from "./MobileSettingsSidebar";
import { useSettings } from "@/contexts/SettingsContext";
import { useRouter } from "next/navigation";

interface SettingsLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function SettingsLayout({ children, pageTitle = "Settings" }: SettingsLayoutProps) {
  const router = useRouter();
  const { sidebarOpen, closeSidebar } = useSettings();

  return (
    <AppLayout
      conversations={[]}
      onNewConversation={() => router.push("/blipee-ai")}
      onSelectConversation={(id) => console.log("Select conversation", id)}
      onDeleteConversation={(id) => console.log("Delete conversation", id)}
      showSidebar={false}
      pageTitle={pageTitle}
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
  );
}
||||||| 2cca3736
=======
"use client";

import React from "react";
import { AppLayout } from "@/components/blipee-os/AppLayout";
import { MobileSettingsSidebar } from "./MobileSettingsSidebar";
import { useSettings } from "@/contexts/SettingsContext";
import { useRouter } from "next/navigation";

interface SettingsLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function SettingsLayout({ children, pageTitle = "Settings" }: SettingsLayoutProps) {
  const router = useRouter();
  const { sidebarOpen, closeSidebar } = useSettings();

  return (
    <AppLayout
      conversations={[]}
      onNewConversation={() => router.push("/blipee-ai")}
      onSelectConversation={(id) => console.log("Select conversation", id)}
      onDeleteConversation={(id) => console.log("Delete conversation", id)}
      showSidebar={false}
      pageTitle={pageTitle}
    >
      <div className="bg-white dark:bg-[#212121] min-h-screen">
        {/* Content */}
        <div className="relative">
          {children}
        </div>

        {/* Mobile Settings Sidebar */}
        <MobileSettingsSidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
        />
      </div>
    </AppLayout>
  );
}
>>>>>>> origin/main
