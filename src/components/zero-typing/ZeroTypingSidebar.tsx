'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home,
  Navigation,
  Search,
  ChevronLeft,
  ChevronRight,
  Leaf,
  MessageSquare,
  User,
  LogOut,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getUserInitials, getUserDisplayName } from '@/lib/utils/user';
import { useAuth } from '@/lib/auth/context';

interface ZeroTypingSidebarProps {
  activeView: 'home' | 'navigate' | 'query';
  onViewChange: (view: 'home' | 'navigate' | 'query') => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAction: (action: string, params?: any) => void;
}

export function ZeroTypingSidebar({
  activeView,
  onViewChange,
  isCollapsed,
  onToggleCollapse,
  onAction,
}: ZeroTypingSidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const userDisplayName = user ? getUserDisplayName(user) : 'User';
  const userInitials = user ? getUserInitials(
    user?.full_name || (user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : null),
    user?.email
  ) : 'U';

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

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      view: 'home' as const,
    },
    {
      id: 'navigate',
      label: 'Navigate',
      icon: Navigation,
      view: 'navigate' as const,
    },
    {
      id: 'query',
      label: 'Visual Query',
      icon: Search,
      view: 'query' as const,
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-20 h-full bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] flex flex-col">
        {/* Logo Icon */}
        <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
          <div className="w-10 h-10 p-0.5 rounded-xl mx-auto accent-gradient">
            <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
              <svg className="w-6 h-6 accent-text" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation Icons */}
        <div className="p-2 space-y-1 border-b border-gray-200 dark:border-white/[0.05]">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.view;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.view)}
                className={`w-full p-2 flex items-center justify-center rounded-lg transition-all ${
                  isActive
                    ? 'bg-gray-100 dark:bg-[#757575]'
                    : 'hover:bg-gray-50 dark:hover:bg-white/[0.05]'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 ${
                  isActive
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`} />
              </button>
            );
          })}
        </div>

        {/* Empty space */}
        <div className="flex-1 overflow-y-auto"></div>

        {/* Bottom buttons */}
        <div className="p-3 border-t border-gray-200 dark:border-white/[0.05] space-y-1">
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
          {isSuperAdmin && (
            <button
              onClick={() => router.push('/blipee-ai')}
              className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
              title="Chat"
            >
              <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}

          {/* Sustainability Dashboard Button */}
          <button
            onClick={() => router.push('/sustainability')}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
            title="Sustainability Dashboard"
          >
            <Leaf className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Profile Button */}
          <button
            onClick={() => router.push('/profile')}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
            title="Profile"
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
            title="Sign Out"
          >
            <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Expand Button */}
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] flex flex-col">
      {/* Logo Header */}
      <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
        <div className="flex items-center justify-between">
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
        </div>
      </div>

      {/* Navigation */}
      <div className="p-2 border-b border-gray-200 dark:border-white/[0.05]">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.view;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.view)}
              className={`w-full px-3 py-2 flex items-center gap-3 text-left rounded-lg transition-all ${
                isActive
                  ? 'bg-gray-100 dark:bg-[#757575]'
                  : 'hover:bg-gray-50 dark:hover:bg-white/[0.05]'
              }`}
            >
              <Icon className={`w-4 h-4 ${
                isActive
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400'
              }`} />
              <span className={`text-sm ${
                isActive
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty space for consistency */}
      <div className="flex-1 overflow-y-auto"></div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-gray-200 dark:border-white/[0.05] space-y-2">
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
        {isSuperAdmin && (
          <button
            onClick={() => router.push('/blipee-ai')}
            className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </button>
        )}

        {/* Sustainability Dashboard Button */}
        <button
          onClick={() => router.push('/sustainability')}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <Leaf className="w-4 h-4" />
          Sustainability Dashboard
        </button>

        {/* Profile Button */}
        <button
          onClick={() => router.push('/profile')}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <User className="w-4 h-4" />
          Profile
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
          Sign Out
        </button>

        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="w-4 h-4" />
          Collapse Sidebar
        </button>
      </div>
    </div>
  );
}