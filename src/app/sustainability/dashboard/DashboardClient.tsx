'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Leaf,
  Zap,
  Droplets,
  Trash2,
  Truck,
  Brain,
  Calendar,
  FileCheck,
  TrendingUp,
  Target,
  AlertCircle,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { SustainabilityLayout } from '@/components/sustainability/SustainabilityLayout';

// Import all our new dashboard components
import { ComplianceDashboard } from '@/components/dashboard/ComplianceDashboard';
import { EnergyDashboard } from '@/components/dashboard/EnergyDashboard';
import { WaterDashboard } from '@/components/dashboard/WaterDashboard';
import { WasteDashboard } from '@/components/dashboard/WasteDashboard';
import { TransportationDashboard } from '@/components/dashboard/TransportationDashboard';
import { MonthlyIntelligentDashboard } from '@/components/dashboard/MonthlyIntelligentDashboard';

// Import AI components
import { ConversationInterface } from '@/components/blipee-os/ConversationInterface';
import { ProactiveAICoach } from '@/components/ai/ProactiveAICoach';

type DashboardView = 'overview' | 'compliance' | 'energy' | 'water' | 'waste' | 'transportation' | 'monthly' | 'ai';

export default function DashboardClient() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<DashboardView>('overview');
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [showProactiveCoach, setShowProactiveCoach] = useState(true);
  const [organizationData, setOrganizationData] = useState<any>(null);

  useEffect(() => {
    // Fetch organization data for context
    const fetchOrgData = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/organization/context');
        if (response.ok) {
          const data = await response.json();
          setOrganizationData(data);
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      }
    };

    fetchOrgData();
  }, [user]);

  // Dashboard navigation items
  const dashboardTabs = [
    {
      id: 'overview' as DashboardView,
      label: 'Overview',
      icon: BarChart3,
      description: 'Compliance & metrics overview',
      color: 'from-blue-500 to-purple-500'
    },
    {
      id: 'compliance' as DashboardView,
      label: 'Compliance',
      icon: FileCheck,
      description: 'GHG Protocol & GRI Standards',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'energy' as DashboardView,
      label: 'Energy',
      icon: Zap,
      description: 'Consumption & emissions tracking',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'water' as DashboardView,
      label: 'Water',
      icon: Droplets,
      description: 'Usage & efficiency metrics',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'waste' as DashboardView,
      label: 'Waste',
      icon: Trash2,
      description: 'Disposal & recycling data',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'transportation' as DashboardView,
      label: 'Transportation',
      icon: Truck,
      description: 'Fleet & travel emissions',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      id: 'monthly' as DashboardView,
      label: 'Monthly Intelligence',
      icon: Calendar,
      description: 'AI-powered monthly insights',
      color: 'from-teal-500 to-green-500',
      badge: 'AI'
    },
    {
      id: 'ai' as DashboardView,
      label: 'AI Assistant',
      icon: Brain,
      description: 'Chat with your AI team',
      color: 'from-purple-600 to-indigo-600',
      badge: 'NEW'
    }
  ];

  const renderDashboard = () => {
    const orgId = organizationData?.id;
    const userId = user?.id;

    if (!orgId || !userId) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto" />
            <p className="text-gray-400">Loading organization data...</p>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'compliance':
        return <ComplianceDashboard organizationId={orgId} />;
      case 'energy':
        return <EnergyDashboard organizationId={orgId} />;
      case 'water':
        return <WaterDashboard organizationId={orgId} />;
      case 'waste':
        return <WasteDashboard organizationId={orgId} />;
      case 'transportation':
        return <TransportationDashboard organizationId={orgId} />;
      case 'monthly':
        return <MonthlyIntelligentDashboard organizationId={orgId} userId={userId} />;
      case 'ai':
        return (
          <div className="flex items-center justify-center h-[600px]">
            <div className="text-center space-y-4">
              <Brain className="w-16 h-16 mx-auto text-purple-500" />
              <h3 className="text-2xl font-bold">AI Assistant</h3>
              <p className="text-gray-400 max-w-md">
                Click the AI button in the bottom right to chat with your sustainability AI team
              </p>
              <button
                onClick={() => setIsAIOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl hover:opacity-90 transition-opacity"
              >
                Open AI Assistant
              </button>
            </div>
          </div>
        );
      case 'overview':
      default:
        return <ComplianceDashboard organizationId={orgId} />; // Default to compliance dashboard for overview
    }
  };

  return (
    <SustainabilityLayout>
      <div className="space-y-6">
        {/* Header with AI Integration Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Sustainability Command Center</h1>
                <p className="text-gray-400 mt-1">
                  Powered by 8 AI Agents working 24/7 • Real-time monitoring active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-400">AI Systems Online</span>
              </div>
              <button
                onClick={() => setIsAIOpen(true)}
                className="p-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-colors"
                title="Open AI Assistant"
              >
                <Sparkles className="w-5 h-5 text-purple-400" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-2xl font-bold text-green-400">92%</div>
              <div className="text-xs text-gray-400 mt-1">Compliance Score</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-2xl font-bold text-blue-400">-12%</div>
              <div className="text-xs text-gray-400 mt-1">Emissions YoY</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-2xl font-bold text-yellow-400">78%</div>
              <div className="text-xs text-gray-400 mt-1">Coverage</div>
            </div>
            <div className="bg-white/[0.03] rounded-xl p-3">
              <div className="text-2xl font-bold text-purple-400">24/7</div>
              <div className="text-xs text-gray-400 mt-1">AI Monitoring</div>
            </div>
          </div>
        </motion.div>

        {/* Dashboard Tabs */}
        <div className="grid grid-cols-4 gap-3">
          {dashboardTabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative p-4 rounded-xl border transition-all
                ${currentView === tab.id
                  ? 'bg-gradient-to-r ' + tab.color + ' border-transparent'
                  : 'bg-white/[0.03] border-white/[0.05] hover:bg-white/[0.05]'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <tab.icon className={`w-5 h-5 ${currentView === tab.id ? 'text-white' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className={`font-semibold ${currentView === tab.id ? 'text-white' : 'text-gray-200'}`}>
                      {tab.label}
                    </div>
                    <div className={`text-xs mt-0.5 ${currentView === tab.id ? 'text-white/70' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                </div>
                {tab.badge && (
                  <span className="px-2 py-0.5 text-xs font-bold bg-white/20 rounded-full">
                    {tab.badge}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderDashboard()}
          </motion.div>
        </AnimatePresence>

        {/* AI Assistant Floating Interface */}
        <AnimatePresence>
          {isAIOpen && (
            <ConversationInterface />
          )}
        </AnimatePresence>

        {/* Proactive AI Coach (for new users) */}
        {showProactiveCoach && user && organizationData && (
          <ProactiveAICoach
            userId={user.id}
            organizationId={organizationData.id}
            userExperience={'new'}
            onInteraction={(action) => {
              if (action === 'dismiss') {
                setShowProactiveCoach(false);
              } else if (action === 'open_ai') {
                setIsAIOpen(true);
              }
            }}
          />
        )}

        {/* AI Floating Action Button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAIOpen(true)}
          className="fixed bottom-8 right-8 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full shadow-2xl z-40"
        >
          <Brain className="w-6 h-6 text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        </motion.button>
      </div>
    </SustainabilityLayout>
  );
}