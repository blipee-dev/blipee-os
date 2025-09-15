'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Factory,
  Zap,
  Globe,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Building2,
  Users,
  Target,
  Calendar,
  Activity
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface DashboardSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectedView: string;
  onSelectView: (view: string) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

export function DashboardSidebar({
  isCollapsed,
  onToggleCollapse,
  selectedView,
  onSelectView,
  dateRange,
  onDateRangeChange
}: DashboardSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'emissions', label: 'Emissions', icon: Factory },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'scopes', label: 'Scope Analysis', icon: Globe },
    { id: 'sites', label: 'Site Comparison', icon: Building2 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'targets', label: 'Targets', icon: Target },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  const dateRanges = [
    { value: 'month', label: 'This Month' },
    { value: 'quarter', label: 'This Quarter' },
    { value: 'year', label: 'This Year' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: 'all', label: 'All Time' }
  ];

  return (
    <div
      className={`${
        isCollapsed ? 'w-16' : 'w-64'
      } h-full bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] transition-all duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <Leaf className="w-5 h-5 accent-text" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Sustainability
              </span>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-white/[0.05]">
          <label className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
            Time Period
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 accent-ring"
          >
            {dateRanges.map(range => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = selectedView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'accent-bg text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-white/[0.05]">
        <button
          onClick={() => router.push('/settings/sustainability')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-white transition-all"
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Settings</span>
          )}
        </button>
      </div>
    </div>
  );
}