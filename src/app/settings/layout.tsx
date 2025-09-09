"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  User,
  Shield,
  Key,
  BarChart3,
  Link2,
  Webhook,
  Database,
  Building2,
  Users,
  CreditCard,
  Puzzle,
  Bell,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConversationSidebar } from "@/components/blipee-os/ConversationSidebar";
import { MobileNavigation } from "@/components/blipee-os/MobileNavigation";

const settingsNavItems = [
  { id: "profile", label: "Profile", icon: User, href: "/settings/profile" },
  { id: "security", label: "Security", icon: Shield, href: "/settings/security" },
  { id: "api-keys", label: "API Keys", icon: Key, href: "/settings/api-keys" },
  { id: "api-usage", label: "API Usage", icon: BarChart3, href: "/settings/api-usage" },
  { id: "sso", label: "SSO Configuration", icon: Link2, href: "/settings/sso" },
  { id: "webhooks", label: "Webhooks", icon: Webhook, href: "/settings/webhooks" },
  { id: "graphql", label: "GraphQL Playground", icon: Database, href: "/settings/graphql" },
  { id: "organization", label: "Organization", icon: Building2, href: "/settings/organization" },
  { id: "team", label: "Team", icon: Users, href: "/settings/team" },
  { id: "billing", label: "Billing", icon: CreditCard, href: "/settings/billing" },
  { id: "integrations", label: "Integrations", icon: Puzzle, href: "/settings/integrations" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/settings/notifications" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // Mock conversations for the sidebar
  const mockConversations = [
    {
      id: "1",
      title: "Sustainability Analysis",
      lastMessage: "Let me analyze your carbon footprint...",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      messageCount: 5,
    },
    {
      id: "2",
      title: "Energy Optimization",
      lastMessage: "Based on your usage patterns...",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      messageCount: 3,
    },
  ];

  // Get current page title
  const currentPage = settingsNavItems.find(item => item.href === pathname);

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {/* Chat Sidebar - Hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block">
        <ConversationSidebar
          conversations={mockConversations}
          onNewConversation={() => router.push('/blipee-ai')}
          onSelectConversation={(id) => router.push('/blipee-ai')}
          onDeleteConversation={() => {}}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Settings Sidebar - Hidden on mobile, shown on md+ */}
      <div className="hidden md:block w-64 lg:w-80 bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] flex-shrink-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/[0.05]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/blipee-ai')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                title="Back to chat"
              >
                <ChevronLeft className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
              </button>
              <h1 className="text-lg lg:text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 lg:p-4">
            <div className="space-y-1">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        : "hover:bg-gray-100 dark:hover:bg-white/[0.05] text-[#616161] dark:text-[#757575]"
                    }`}
                  >
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>



      {/* Mobile Settings Menu Overlay */}
      <AnimatePresence>
        {isSettingsMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsMenuOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="md:hidden fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-[#111111] z-50"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-white/[0.05] flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings Menu</h2>
                  <button
                    onClick={() => setIsSettingsMenuOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                  >
                    <X className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
                  </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-1">
                    {settingsNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            router.push(item.href);
                            setIsSettingsMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                              : "hover:bg-gray-100 dark:hover:bg-white/[0.05] text-[#616161] dark:text-[#757575]"
                          }`}
                        >
                          <Icon className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto bg-white dark:bg-[#212121] pb-20 md:pb-0">
          {children}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation onNewChat={() => router.push("/blipee-ai")} />
    </div>
  );
}