"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ChevronLeft,
  Menu,
  X,
  MapPin,
  Cpu,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNavigation } from "@/components/blipee-os/MobileNavigation";

const settingsNavItems = [
  { id: "organizations", label: "Organizations", icon: Building2, href: "/settings/organizations" },
  { id: "sites", label: "Sites", icon: MapPin, href: "/settings/sites" },
  { id: "devices", label: "Devices", icon: Cpu, href: "/settings/devices" },
  { id: "users", label: "Users", icon: Users, href: "/settings/users" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

  // Get current page title
  const currentPage = settingsNavItems.find(item => item.href === pathname);

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {/* Settings Sidebar - Hidden on mobile, shown on md+ */}
      <div className="hidden md:block w-64 bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] flex-shrink-0">
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                  <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="blipeeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style={{stopColor:'rgb(236, 72, 153)', stopOpacity:1}} />
                          <stop offset="100%" style={{stopColor:'rgb(147, 51, 234)', stopOpacity:1}} />
                        </linearGradient>
                      </defs>
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#blipeeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="url(#blipeeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="url(#blipeeGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">Settings</span>
              </div>
              <button
                onClick={() => router.push('/blipee-ai')}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                title="Back to chat"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-0.5">
              {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-gray-100 dark:bg-white/[0.05] text-gray-900 dark:text-white"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="p-3 border-t border-gray-200 dark:border-white/[0.05]">
            <button
              onClick={() => router.push('/blipee-ai')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back to Chat</span>
            </button>
          </div>
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
                <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
                        <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <defs>
                              <linearGradient id="blipeeGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" style={{stopColor:'rgb(236, 72, 153)', stopOpacity:1}} />
                                <stop offset="100%" style={{stopColor:'rgb(147, 51, 234)', stopOpacity:1}} />
                              </linearGradient>
                            </defs>
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="url(#blipeeGradientMobile)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 17L12 22L22 17" stroke="url(#blipeeGradientMobile)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M2 12L12 17L22 12" stroke="url(#blipeeGradientMobile)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">Settings</span>
                    </div>
                    <button
                      onClick={() => setIsSettingsMenuOpen(false)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto">
                  <div className="p-2 space-y-0.5">
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
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                            isActive
                              ? "bg-gray-100 dark:bg-white/[0.05] text-gray-900 dark:text-white"
                              : "hover:bg-gray-50 dark:hover:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-t border-gray-200 dark:border-white/[0.05]">
                  <button
                    onClick={() => {
                      router.push('/blipee-ai');
                      setIsSettingsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Chat</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/[0.05] bg-white dark:bg-[#111111]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/blipee-ai')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentPage?.label || 'Settings'}
            </h1>
          </div>
          <button
            onClick={() => setIsSettingsMenuOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
          >
            <Menu className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
          </button>
        </div>
        
        <div className="h-full overflow-y-auto bg-white dark:bg-[#212121] pb-20 md:pb-0">
          {children}
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation onNewChat={() => router.push("/blipee-ai")} />
    </div>
  );
}