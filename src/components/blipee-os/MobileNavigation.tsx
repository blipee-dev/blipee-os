"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  MessageSquare,
  User,
  Settings,
  Plus,
} from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface MobileNavigationProps {
  onNewChat?: () => void;
}

export function MobileNavigation({ onNewChat }: MobileNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { openSidebar } = useSettings();

  const handleSettingsClick = () => {
    // If we're on a settings page, open sidebar
    if (pathname?.startsWith('/settings')) {
      openSidebar();
    } else {
      // Otherwise navigate to settings
      router.push('/settings/organizations');
    }
  };

  const navItems = [
    {
      id: "home",
      icon: Home,
      label: "Home",
      href: "/blipee-ai",
    },
    {
      id: "chats",
      icon: MessageSquare,
      label: "Chats",
      href: "/chats",
    },
    {
      id: "new",
      icon: Plus,
      label: "New",
      action: onNewChat,
      isSpecial: true,
    },
    {
      id: "profile",
      icon: User,
      label: "Profile",
      href: "/profile",
    },
    {
      id: "settings",
      icon: Settings,
      label: "Settings",
      action: handleSettingsClick,
    },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white dark:bg-[#111111] border-t border-gray-200 dark:border-white/[0.05] shadow-xl">
        {/* Navigation Items */}
        <nav className="flex items-center justify-around px-2 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === "settings" 
              ? pathname?.startsWith('/settings')
              : pathname === item.href || pathname?.startsWith(item.href + "/");

            if (item.isSpecial) {
              // Special treatment for the "New Chat" button
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={item.action}
                  className="relative"
                >
                  <div className="w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (item.action) {
                    item.action();
                  } else if (item.href) {
                    router.push(item.href);
                  }
                }}
                className="flex flex-col items-center justify-center p-2 min-w-[60px]"
              >
                <div className={`relative ${isActive ? "text-purple-500" : "text-gray-500 dark:text-gray-400"}`}>
                  <Icon className="w-6 h-6" />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full"
                    />
                  )}
                </div>
                <span className={`text-[10px] mt-1 ${
                  isActive ? "text-purple-500 font-medium" : "text-gray-500 dark:text-gray-400"
                }`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </nav>
      </div>

      {/* Floating Action Button - Tablet/Desktop */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onNewChat}
        className="hidden md:flex fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full items-center justify-center shadow-lg hover:shadow-xl transition-shadow"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>
    </>
  );
}