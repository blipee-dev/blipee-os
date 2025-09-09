"use client";

import React, { useState } from "react";
import { ConversationSidebar } from "./ConversationSidebar";
import { MobileNavigation } from "./MobileNavigation";

interface AppLayoutProps {
  children: React.ReactNode;
  conversations?: any[];
  onNewConversation?: () => void;
  onSelectConversation?: (id: string) => void;
  onDeleteConversation?: (id: string) => void;
  showSidebar?: boolean;
  pageTitle?: string;
}

export function AppLayout({
  children,
  conversations = [],
  onNewConversation = () => {},
  onSelectConversation = () => {},
  onDeleteConversation = () => {},
  showSidebar = true,
  pageTitle,
}: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {/* Desktop Sidebar - Hidden on mobile, shown on lg+ */}
      {showSidebar && (
        <div className="hidden lg:block">
          <ConversationSidebar
            conversations={conversations}
            onNewConversation={onNewConversation}
            onSelectConversation={onSelectConversation}
            onDeleteConversation={onDeleteConversation}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>
      )}



      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content with padding for mobile navigation */}
        <div className="flex-1 overflow-auto pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation onNewChat={onNewConversation} />
    </div>
  );
}