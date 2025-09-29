'use client';

import React, { useState, useEffect } from 'react';
import { AdaptiveHomeGrid } from './AdaptiveHomeGrid';
import { NavigationMatrix } from './NavigationMatrix';
import { QueryCardGrid } from './QueryCardGrid';
import { PredictionPills } from './PredictionPills';
import { OneTouchWorkflows } from './OneTouchWorkflows';
import { SmartWidgets } from './SmartWidgets';
import { ZeroTypingSidebar } from './ZeroTypingSidebar';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAppearance } from '@/providers/AppearanceProvider';
import { useAuth } from '@/lib/auth/context';

export const ZeroTypingInterface: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState<'home' | 'navigate' | 'query'>('home');
  const [context, setContext] = useState<any>({
    timeOfDay: 'morning',
    recentActions: [],
    currentMetrics: {},
  });
  const { settings } = useAppearance();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(settings?.sidebarAutoCollapse || false);

  useEffect(() => {
    // Update context based on time of day
    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else if (hour >= 21 || hour < 6) timeOfDay = 'night';

    setContext(prev => ({ ...prev, timeOfDay }));
  }, []);

  const handleActionClick = (action: string, params?: any) => {
    // Track action for learning
    setContext(prev => ({
      ...prev,
      recentActions: [...prev.recentActions.slice(-9), { action, timestamp: Date.now() }]
    }));

    // Route based on action
    switch (action) {
      case 'emissions':
        router.push('/sustainability/dashboard');
        break;
      case 'energy':
        router.push('/monitoring');
        break;
      case 'reports':
        router.push('/reports');
        break;
      case 'optimize':
        router.push('/optimization');
        break;
      default:
        // Handle dynamic actions
        if (params?.route) {
          router.push(params.route);
        }
    }
  };

  const handleToggleCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-black">
      {/* Sidebar */}
      <ZeroTypingSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onAction={handleActionClick}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header bar with gradient */}
        <div className="backdrop-blur-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/[0.05] dark:to-emerald-500/[0.05] border-b border-green-200/50 dark:border-white/[0.05]">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Zero-Typing Navigation
                </h1>
                <p className="text-xs text-gray-600 dark:text-white/60">
                  Navigate the entire platform without typing
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/50">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>AI-Powered Suggestions Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-[#212121]">
          <div className="container mx-auto px-6 py-6">
            {/* AI Prediction Pills - Always visible */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <PredictionPills
                context={context}
                onAction={handleActionClick}
              />
            </motion.div>

            {/* View-specific content */}
            {activeView === 'home' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AdaptiveHomeGrid
                  timeOfDay={context.timeOfDay}
                  onAction={handleActionClick}
                  user={user}
                />
                <div className="mt-8">
                  <OneTouchWorkflows onAction={handleActionClick} />
                </div>
                <div className="mt-8">
                  <SmartWidgets context={context} onAction={handleActionClick} />
                </div>
              </motion.div>
            )}

            {activeView === 'navigate' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <NavigationMatrix
                  onAction={handleActionClick}
                  context={context}
                />
              </motion.div>
            )}

            {activeView === 'query' && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <QueryCardGrid
                  onAction={handleActionClick}
                  context={context}
                />
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};