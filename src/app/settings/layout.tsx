"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MapPin,
  Cpu,
  User,
  Settings,
  MessageSquare,
  LogOut,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNavigation } from "@/components/blipee-os/MobileNavigation";
import { useAuth } from "@/lib/auth/context";
import { getUserInitials, getUserDisplayName } from "@/lib/utils/user";
import { useAppearance } from "@/providers/AppearanceProvider";
import { useTranslations } from "@/providers/LanguageProvider";

const getSettingsNavItems = (t: (key: string) => string) => [
  { id: "organizations", label: t('navigation.organizations'), icon: Building2, href: "/settings/organizations" },
  { id: "sites", label: t('navigation.sites'), icon: MapPin, href: "/settings/sites" },
  { id: "devices", label: t('navigation.devices'), icon: Cpu, href: "/settings/devices" },
  { id: "users", label: t('navigation.users'), icon: Users, href: "/settings/users" },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const { settings, updateSetting } = useAppearance();
  const [isCollapsed, setIsCollapsed] = useState(settings.sidebarAutoCollapse);
  const { user, signOut } = useAuth();
  const t = useTranslations('settings.sidebar');
  const settingsNavItems = getSettingsNavItems(t);
  
  // Initialize collapsed state on mount and when setting changes
  useEffect(() => {
    setIsCollapsed(settings.sidebarAutoCollapse);
  }, [settings.sidebarAutoCollapse]);
  
  // Handle manual toggle - update both local state and global setting
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    updateSetting('sidebarAutoCollapse', newCollapsedState);
  };
  
  const userDisplayName = user ? getUserDisplayName(user) : t('defaultUser');
  const userInitials = user ? getUserInitials(
    user?.full_name || (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name) || null,
    user?.email
  ) : 'U';

  // Get current page title
  const currentPage = settingsNavItems.find(item => item.href === pathname);

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {/* Settings Sidebar - Hidden on mobile, shown on md+ */}
      <div className={`hidden md:block ${isCollapsed ? 'w-20' : 'w-80'} bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] flex-shrink-0 transition-all duration-300`}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 p-0.5 rounded-xl accent-gradient">
                    <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                      <svg className="w-6 h-6 accent-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                  <span className="text-xl font-normal" style={{
                    background: 'linear-gradient(to right, rgb(var(--accent-primary-rgb)), rgb(var(--accent-secondary-rgb)))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    blipee
                  </span>
                </div>
              )}
              {isCollapsed && (
                <div className="w-10 h-10 p-0.5 rounded-xl mx-auto accent-gradient">
                  <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
                    <svg className="w-6 h-6 accent-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className={`p-2 ${isCollapsed ? 'space-y-1' : ''} border-b border-gray-200 dark:border-white/[0.05]`}>
            {settingsNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className={`w-full ${isCollapsed ? 'p-2 flex items-center justify-center' : 'px-3 py-2 flex items-center gap-3 text-left'} rounded-lg transition-all ${
                      isActive
                        ? "bg-gray-100 dark:bg-[#757575]"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${
                      isActive
                        ? "text-gray-900 dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`} />
                    {!isCollapsed && <span className={`text-sm ${
                      isActive
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>{item.label}</span>}
                  </button>;
              })}
          </div>

          {/* Empty space for consistency */}
          <div className="flex-1 overflow-y-auto"></div>

          {/* Bottom Section */}
          <div className="p-3 border-t border-gray-200 dark:border-white/[0.05] space-y-2">
            {!isCollapsed ? (
              <>
                {/* User Profile */}
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-3"
                >
                  <div className="w-8 h-8 accent-gradient rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-medium">{userInitials}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{userDisplayName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || 'user@example.com'}</p>
                  </div>
                </button>

                {/* Chat Button */}
                <button
                  onClick={() => router.push('/blipee-ai')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('buttons.chat')}
                </button>
                
                {/* Profile Button */}
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <User className="w-4 h-4" />
                  {t('buttons.profile')}
                </button>
                

                {/* Logout Button */}
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push("/signin");
                    } catch (error) {
                      console.error("Error during logout:", error);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <LogOut className="w-4 h-4" />
                  {t('buttons.signOut')}
                </button>
                
                {/* Collapse Button */}
                <button
                  onClick={handleToggleCollapse}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('buttons.collapseSidebar')}
                </button>
              </>
            ) : (
              <div className="space-y-1">
                {/* User Avatar */}
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={userDisplayName}
                >
                  <div className="w-8 h-8 accent-gradient-lr rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{userInitials}</span>
                  </div>
                </button>

                {/* Chat Button */}
                <button
                  onClick={() => router.push('/blipee-ai')}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={t('buttons.chat')}
                >
                  <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                {/* Profile Button */}
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={t('buttons.profile')}
                >
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                

                {/* Logout Button */}
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      router.push("/signin");
                    } catch (error) {
                      console.error("Error during logout:", error);
                    }
                  }}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={t('buttons.signOut')}
                >
                  <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
                
                {/* Expand Button */}
                <button
                  onClick={handleToggleCollapse}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={t('buttons.expandSidebar')}
                >
                  <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            )}
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
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{t('title')}</span>
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
                  <div className="p-2">
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
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                            isActive
                              ? "bg-gray-100 dark:bg-[#757575]"
                              : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${
                            isActive
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400"
                          }`} />
                          <span className={`text-sm ${
                            isActive
                              ? "text-gray-900 dark:text-white font-medium"
                              : "text-gray-700 dark:text-gray-300"
                          }`}>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>

                {/* Bottom Section */}
                <div className="p-3 border-t border-gray-200 dark:border-white/[0.05] space-y-2">
                  {/* Back to Chat Button */}
                  <button
                    onClick={() => {
                      router.push('/blipee-ai');
                      setIsSettingsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {t('buttons.backToChat')}
                  </button>
                  
                  {/* Profile Button */}
                  <button
                    onClick={() => {
                      router.push('/profile');
                      setIsSettingsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <User className="w-4 h-4" />
                    {t('buttons.profile')}
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
              {currentPage?.label || t('title')}
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