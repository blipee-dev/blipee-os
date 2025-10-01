"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  User,
  Settings,
  MessageSquare,
  LogOut,
  BarChart3,
  TrendingUp,
  Factory,
  Zap,
  Globe,
  FileText,
  Building2,
  Target,
  Activity,
  Leaf,
  Database,
  FileSpreadsheet,
  Wrench,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileNavigation } from "@/components/blipee-os/MobileNavigation";
import { useAuth } from "@/lib/auth/context";
import { getUserInitials, getUserDisplayName } from "@/lib/utils/user";
import { useAppearance } from "@/providers/AppearanceProvider";
import { useTranslations } from "@/providers/LanguageProvider";

const getSustainabilityNavItems = (tDashboard: (key: string) => string) => [
  { id: "overview", label: tDashboard('navigation.overview'), icon: BarChart3, href: "/sustainability/dashboard", view: "overview" },
  { id: "emissions", label: tDashboard('navigation.emissions'), icon: Factory, href: "/sustainability/dashboard", view: "emissions" },
  { id: "data-management", label: "Data Management", icon: Database, href: "/sustainability/data-management", view: null },
  { id: "energy", label: tDashboard('navigation.energy'), icon: Zap, href: "/sustainability/dashboard", view: "energy" },
  { id: "scopes", label: tDashboard('navigation.scopeAnalysis'), icon: Globe, href: "/sustainability/dashboard", view: "scopes" },
  { id: "sites", label: tDashboard('navigation.siteComparison'), icon: Building2, href: "/sustainability/dashboard", view: "sites" },
  { id: "trends", label: tDashboard('navigation.trends'), icon: TrendingUp, href: "/sustainability/dashboard", view: "trends" },
  { id: "targets", label: "Targets", icon: Target, href: "/sustainability/targets", view: null },
  { id: "data-entry", label: tDashboard('navigation.dataEntry'), icon: Database, href: "/sustainability/data-entry", view: null },
  { id: "data-investigation", label: tDashboard('navigation.dataInvestigation'), icon: FileSpreadsheet, href: "/sustainability/data-investigation", view: null },
  { id: "data-comparison", label: tDashboard('navigation.dataComparison'), icon: Activity, href: "/sustainability/data-comparison", view: null },
  { id: "data-migration", label: tDashboard('navigation.dataMigration'), icon: Wrench, href: "/sustainability/data-migration", view: null },
  { id: "reports", label: tDashboard('navigation.reports'), icon: FileText, href: "/sustainability/dashboard", view: "reports" },
];

interface SustainabilityLayoutProps {
  children: React.ReactNode;
  selectedView?: string;
  onSelectView?: (view: string) => void;
}

export function SustainabilityLayout({ children, selectedView = 'overview', onSelectView }: SustainabilityLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { settings, updateSetting } = useAppearance();
  const [isCollapsed, setIsCollapsed] = useState(settings.sidebarAutoCollapse);
  const { user, signOut } = useAuth();
  const t = useTranslations('settings.sustainability.sidebar');
  const tDashboard = useTranslations('settings.sustainability.dashboard');
  const sustainabilityNavItems = getSustainabilityNavItems(tDashboard);
  
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

  const handleNavItemClick = (item: any) => {
    if (item.href !== pathname) {
      router.push(item.href);
    }
    if (item.view && onSelectView) {
      onSelectView(item.view);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black relative">
      {/* Sustainability Sidebar - Hidden on mobile, shown on md+ */}
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
            {sustainabilityNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.view ? selectedView === item.view : pathname === item.href;

                return <button
                    key={item.id}
                    onClick={() => handleNavItemClick(item)}
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email || t('userEmail')}</p>
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
                
                {/* Settings Button */}
                <button
                  onClick={() => router.push('/settings/sustainability')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
                >
                  <Settings className="w-4 h-4" />
                  {t('buttons.settings')}
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
              <div className="space-y-2">
                {/* Collapsed User Button */}
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={userDisplayName}
                >
                  <div className="w-8 h-8 accent-gradient rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{userInitials}</span>
                  </div>
                </button>

                {/* Collapsed Chat Button */}
                <button
                  onClick={() => router.push('/blipee-ai')}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={t('buttons.chat')}
                >
                  <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Collapsed Settings Button */}
                <button
                  onClick={() => router.push('/settings/sustainability')}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={t('buttons.settings')}
                >
                  <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Collapsed Logout Button */}
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
                  <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>

                {/* Collapsed Expand Button */}
                <button
                  onClick={handleToggleCollapse}
                  className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
                  title={t('buttons.expandSidebar')}
                >
                  <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Button */}
      <button
        onClick={() => setIsMenuOpen(true)}
        className="fixed top-4 left-4 md:hidden z-50 p-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/[0.05] rounded-lg shadow-sm"
      >
        <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Mobile Navigation */}
      <MobileNavigation
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        items={sustainabilityNavItems.map(item => ({
          ...item,
          onClick: () => {
            handleNavItemClick(item);
            setIsMenuOpen(false);
          },
          isActive: item.view ? selectedView === item.view : pathname === item.href
        }))}
        user={user}
        onSignOut={async () => {
          try {
            await signOut();
            router.push("/signin");
          } catch (error) {
            console.error("Error during logout:", error);
          }
        }}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}