"use client";

import React from "react";
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

const getSustainabilityNavItems = (tDashboard: (key: string) => string) => [
  // Main Dashboards
  { id: "overview", label: tDashboard('navigation.overview'), icon: BarChart3, href: "/sustainability", view: "overview" },
  { id: "compliance", label: "Compliance", icon: FileCheck, href: "/sustainability/compliance", view: null },
  { id: "emissions", label: tDashboard('navigation.emissions'), icon: Cloud, href: "/sustainability/ghg-emissions", view: null },
  { id: "energy", label: "Energy", icon: Zap, href: "/sustainability/energy", view: null },
  { id: "water", label: "Water & Effluents", icon: Droplets, href: "/sustainability/water", view: null },
  { id: "waste", label: "Waste", icon: Trash2, href: "/sustainability/waste", view: null },
  { id: "targets", label: "Targets", icon: Target, href: "/sustainability/targets", view: null },
  { id: "data", label: "Data Management", icon: Database, href: "/sustainability/data", view: null },
  { id: "intelligence", label: "Intelligence", icon: Activity, href: "/sustainability/intelligence", view: null },
  { id: "ai-assistant", label: "AI Assistant", icon: Brain, href: "/sustainability/ai-assistant", view: null },
];

interface SustainabilityLayoutProps {
  children: React.ReactNode;
  selectedView?: string;
  onSelectView?: (view: string) => void;
}

export function SustainabilityLayout({ children, selectedView = 'overview', onSelectView }: SustainabilityLayoutProps) {
  const tDashboard = useTranslations('settings.sustainability.dashboard');
  const sustainabilityNavItems = getSustainabilityNavItems(tDashboard);

  return (
    <BaseSidebarLayout
      navItems={sustainabilityNavItems}
      sectionTitle="Sustainability"
      selectedView={selectedView}
      onSelectView={onSelectView}
    >
      {children}
    </BaseSidebarLayout>
  );
}