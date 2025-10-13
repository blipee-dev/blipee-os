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
} from "lucide-react";
import { BaseSidebarLayout } from "@/components/layout/BaseSidebarLayout";
import { useTranslations } from "@/providers/LanguageProvider";
import { useAuth } from "@/lib/hooks/useAuth";

const getSustainabilityNavItems = (tDashboard: (key: string) => string, isSuperAdmin: boolean) => {
  const allItems = [
    // Main Dashboards
    { id: "overview", label: tDashboard('navigation.overview'), icon: BarChart3, href: "/sustainability", view: null, adminOnly: false },
    { id: "compliance", label: "Compliance", icon: FileCheck, href: "/sustainability/compliance", view: null, adminOnly: false },
    { id: "emissions", label: tDashboard('navigation.emissions'), icon: Cloud, href: "/sustainability/ghg-emissions", view: null, adminOnly: false },
    { id: "energy", label: "Energy", icon: Zap, href: "/sustainability/energy", view: null, adminOnly: false },
    { id: "water", label: "Water & Effluents", icon: Droplets, href: "/sustainability/water", view: null, adminOnly: false },
    { id: "waste", label: "Waste", icon: Trash2, href: "/sustainability/waste", view: null, adminOnly: false },
    { id: "targets", label: "Targets", icon: Target, href: "/sustainability/targets", view: null, adminOnly: true },
    { id: "data", label: "Data Management", icon: Database, href: "/sustainability/data", view: null, adminOnly: true },
    { id: "intelligence", label: "Intelligence", icon: Activity, href: "/sustainability/intelligence", view: null, adminOnly: true },
    { id: "ai-assistant", label: "AI Assistant", icon: Brain, href: "/sustainability/ai-assistant", view: null, adminOnly: true },
  ];

  // Filter out admin-only items if user is not a super admin
  return allItems.filter(item => !item.adminOnly || isSuperAdmin);
};

interface SustainabilityLayoutProps {
  children: React.ReactNode;
}

export function SustainabilityLayout({ children }: SustainabilityLayoutProps) {
  const tDashboard = useTranslations('settings.sustainability.dashboard');
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/user-role');
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Error checking super admin status:', error);
        setIsSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    }

    checkSuperAdmin();
  }, [user]);

  const sustainabilityNavItems = getSustainabilityNavItems(tDashboard, isSuperAdmin);

  return (
    <BaseSidebarLayout
      navItems={sustainabilityNavItems}
      sectionTitle="Sustainability"
    >
      {children}
    </BaseSidebarLayout>
  );
}