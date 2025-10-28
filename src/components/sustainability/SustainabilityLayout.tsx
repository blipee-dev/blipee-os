"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  TrendingUp,
  Factory,
  Zap,
  Globe,
  FileText,
  Building2,
  Target,
  Activity,
  Database,
  FileSpreadsheet,
  Wrench,
  FileCheck,
  Droplets,
  Trash2,
  Brain,
  Cloud,
  BookOpen,
} from "lucide-react";
import { BaseSidebarLayout } from "@/components/layout/BaseSidebarLayout";
import { useTranslations, useLanguage } from "@/providers/LanguageProvider";
import { useAuth } from "@/lib/hooks/useAuth";
import { EducationalModal } from "@/components/education/EducationalModal";
import { FloatingChat } from "@/components/chat/FloatingChat";

const getSustainabilityNavItems = (tDashboard: (key: string) => string, isSuperAdmin: boolean, onHelpClick?: () => void) => {
  const allItems = [
    // Main Dashboards
    { id: "overview", label: tDashboard('navigation.overview'), icon: BarChart3, href: "/sustainability", view: null, adminOnly: false },
    { id: "emissions", label: tDashboard('navigation.emissions'), icon: Cloud, href: "/sustainability/ghg-emissions", view: null, adminOnly: false },
    { id: "energy", label: "Energy", icon: Zap, href: "/sustainability/energy", view: null, adminOnly: false },
    { id: "water", label: "Water & Effluents", icon: Droplets, href: "/sustainability/water", view: null, adminOnly: false },
    { id: "waste", label: "Waste", icon: Trash2, href: "/sustainability/waste", view: null, adminOnly: false },
    { id: "compliance", label: "Compliance", icon: FileCheck, href: "/sustainability/compliance", view: null, adminOnly: false },
    { id: "targets", label: "Targets", icon: Target, href: "/sustainability/targets", view: null, adminOnly: true },
    { id: "data", label: "Data Management", icon: Database, href: "/sustainability/data", view: null, adminOnly: true },
    { id: "intelligence", label: "Intelligence", icon: Activity, href: "/sustainability/intelligence", view: null, adminOnly: true },
    { id: "ai-assistant", label: "AI Assistant", icon: Brain, href: "/sustainability/ai-assistant", view: null, adminOnly: true },
    { id: "help", label: "Help & Learning", icon: BookOpen, href: "#", view: "help", adminOnly: false, onClick: onHelpClick },
  ];

  // Filter out admin-only items if user is not a super admin
  return allItems.filter(item => !item.adminOnly || isSuperAdmin);
};

interface SustainabilityLayoutProps {
  children: React.ReactNode;
  organizationId: string;
}

const educationalTopics = [
  { id: 'carbon-basics', icon: '🌍', titleKey: 'education.topics.carbonBasics.title' },
  { id: 'scopes-explained', icon: '📊', titleKey: 'education.topics.scopesExplained.title' },
  { id: 'why-it-matters', icon: '🔥', titleKey: 'education.topics.whyItMatters.title' },
  { id: 'reduction-strategies', icon: '💡', titleKey: 'education.topics.reductionStrategies.title' },
  { id: 'sbti-targets', icon: '🎯', titleKey: 'education.topics.sbtiTargets.title' }
];

export function SustainabilityLayout({ children, organizationId }: SustainabilityLayoutProps) {
  const tDashboard = useTranslations('settings.sustainability.dashboard');
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [activeEducationalModal, setActiveEducationalModal] = useState<string | null>(null);

  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user) return;

      try {
        const response = await fetch('/api/auth/user-role');
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      }
    }

    checkSuperAdmin();
  }, [user]);

  const handleHelpClick = () => {
    setShowHelpMenu(!showHelpMenu);
  };

  const handleTopicSelect = (topicId: string) => {
    setActiveEducationalModal(topicId);
    setShowHelpMenu(false);
  };

  const sustainabilityNavItems = getSustainabilityNavItems(tDashboard, isSuperAdmin, handleHelpClick);

  return (
    <>
      <BaseSidebarLayout
        navItems={sustainabilityNavItems}
        sectionTitle="Sustainability"
        hideFloatingButton={true}
      >
        {children}
      </BaseSidebarLayout>

      {/* Help Topics Menu */}
      {showHelpMenu && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-sm"
            onClick={() => setShowHelpMenu(false)}
          />
          <div className="fixed left-20 md:left-80 bottom-20 z-[9999] w-80 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="accent-gradient p-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Help & Learning
              </h3>
            </div>
            <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
              {educationalTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {topic.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t(topic.titleKey)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Educational Modal */}
      <EducationalModal
        activeModal={activeEducationalModal}
        onClose={() => setActiveEducationalModal(null)}
        organizationContext={{
          country: 'Portugal',
          sector: 'professional_services'
        }}
      />

      {/* Floating AI Chat */}
      <FloatingChat organizationId={organizationId} />
    </>
  );
}