"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Settings,
  MessageSquare,
  LogOut,
  LucideIcon,
  Leaf,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNavigation } from "@/components/blipee-os/MobileNavigation";
import { useAuth } from "@/lib/auth/context";
import { getUserInitials, getUserDisplayName } from "@/lib/utils/user";
import { useAppearance } from "@/providers/AppearanceProvider";
import { useTranslations } from "@/providers/LanguageProvider";
import { Tooltip } from "@/components/ui/Tooltip";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  view?: string | null;
}

interface BaseSidebarLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  pageTitle?: string;
  sectionTitle?: string;
  selectedView?: string;
  onSelectView?: (view: string) => void;
}

export function BaseSidebarLayout({
  children,
  navItems,
  pageTitle,
  sectionTitle = "blipee",
  selectedView,
  onSelectView,
}: BaseSidebarLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { settings, updateSetting } = useAppearance();
  const [isCollapsed, setIsCollapsed] = useState(settings.sidebarAutoCollapse);
  const { user, signOut } = useAuth();
  const t = useTranslations('profile.sidebar');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check super admin status
  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user) return;
      try {
        const response = await fetch('/api/auth/user-role');
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Error checking super admin status:', error);
      }
    }
    checkSuperAdmin();
  }, [user]);

  // Initialize collapsed state
  useEffect(() => {
    setIsCollapsed(settings.sidebarAutoCollapse);
  }, [settings.sidebarAutoCollapse]);

  // Handle manual toggle
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    updateSetting('sidebarAutoCollapse', newCollapsedState);
  };

  const userDisplayName = user ? getUserDisplayName(user) : t('defaultUser');
  const userInitials = user ? getUserInitials(
    user?.full_name || (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : null),
    user?.email
  ) : 'U';

  // Get current page
  const currentPage = navItems.find(item => item.href === pathname);
  const defaultPageTitle = pageTitle || currentPage?.label || sectionTitle;

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {/* Sidebar - Hidden on mobile, shown on md+ */}
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
          <div className={`p-2 ${isCollapsed ? 'space-y-2' : 'space-y-2'} border-b border-gray-200 dark:border-white/[0.05]`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = selectedView ? (item.view === selectedView) : (pathname === item.href);

              const button = (
                <button
                  onClick={() => {
                    if (item.view && onSelectView) {
                      onSelectView(item.view);
                    } else {
                      router.push(item.href);
                    }
                  }}
                  className={`w-full ${isCollapsed ? 'p-2 flex items-center justify-center' : 'px-3 py-2 flex items-center gap-3 text-left'} rounded-lg transition-all ${
                    isActive
                      ? "bg-gray-100 dark:bg-[#757575]"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-4 h-4'} ${
                    isActive
                      ? "text-gray-900 dark:text-white"
                      : "text-gray-500 dark:text-gray-400"
                  }`} />
                  {!isCollapsed && (
                    <span className={`text-sm ${
                      isActive
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>{item.label}</span>
                  )}
                </button>
              );

              return isCollapsed ? (
                <Tooltip key={item.id} content={item.label} side="right">
                  {button}
                </Tooltip>
              ) : (
                <React.Fragment key={item.id}>{button}</React.Fragment>
              );
            })}
          </div>

          {/* Empty space */}
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

                {/* Chat Button - Only for super admins */}
                {isSuperAdmin && (
                  <button
                    onClick={() => router.push('/blipee-ai')}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </button>
                )}

                {/* Sustainability Button */}
                <button
                  onClick={() => router.push('/sustainability')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <Leaf className="w-4 h-4" />
                  Sustainability
                </button>

                {/* Settings Button */}
                <button
                  onClick={() => router.push('/settings/organizations')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <Settings className="w-4 h-4" />
                  Settings
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
                <Tooltip content={userDisplayName} side="right">
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  >
                    <div className="w-8 h-8 accent-gradient-lr rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-medium">{userInitials}</span>
                    </div>
                  </button>
                </Tooltip>

                {/* Chat Button - Only for super admins */}
                {isSuperAdmin && (
                  <Tooltip content={t('buttons.chat') || 'Chat'} side="right">
                    <button
                      onClick={() => router.push('/blipee-ai')}
                      className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                    >
                      <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </Tooltip>
                )}

                {/* Sustainability Button */}
                <Tooltip content="Sustainability" side="right">
                  <button
                    onClick={() => router.push('/sustainability')}
                    className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  >
                    <Leaf className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Tooltip>

                {/* Settings Button */}
                <Tooltip content={t('buttons.settings') || 'Settings'} side="right">
                  <button
                    onClick={() => router.push('/settings/organizations')}
                    className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  >
                    <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Tooltip>

                {/* Sign Out Button */}
                <Tooltip content={t('buttons.signOut')} side="right">
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
                  >
                    <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Tooltip>

                {/* Expand Button */}
                <Tooltip content={t('buttons.expandSidebar')} side="right">
                  <button
                    onClick={handleToggleCollapse}
                    className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
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
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">blipee</span>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                    >
                      <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto">
                  <div className="p-2 space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = selectedView ? (item.view === selectedView) : (pathname === item.href);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item.view && onSelectView) {
                              onSelectView(item.view);
                            } else {
                              router.push(item.href);
                            }
                            setIsMenuOpen(false);
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
                  {isSuperAdmin && (
                    <button
                      onClick={() => {
                        router.push('/blipee-ai');
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      {t('buttons.backToChat')}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      router.push('/settings/organizations');
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <Settings className="w-4 h-4" />
                    {t('buttons.settings')}
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
            {isSuperAdmin && (
              <button
                onClick={() => router.push('/blipee-ai')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
              </button>
            )}
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {defaultPageTitle}
            </h1>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
          >
            <Menu className="w-5 h-5 text-[#616161] dark:text-[#757575]" />
          </button>
        </div>

        {/* Content with consistent background */}
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#1a1a1a] pb-20 md:pb-0">
          {children}
        </div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation onNewChat={() => router.push("/blipee-ai")} />
    </div>
  );
}
