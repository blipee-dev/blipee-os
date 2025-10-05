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
} from "lucide-react";
import { BaseSidebarLayout } from "@/components/layout/BaseSidebarLayout";
import { useTranslations } from "@/providers/LanguageProvider";

const getSustainabilityNavItems = (tDashboard: (key: string) => string) => [
  { id: "overview", label: tDashboard('navigation.overview'), icon: BarChart3, href: "/sustainability/dashboard", view: "overview" },
  { id: "compliance", label: "Compliance", icon: FileCheck, href: "/sustainability/compliance", view: null },
  { id: "emissions", label: tDashboard('navigation.emissions'), icon: Factory, href: "/sustainability/emissions", view: null },
  { id: "scope-analysis", label: tDashboard('navigation.scopeAnalysis'), icon: Globe, href: "/sustainability/scope-analysis", view: null },
  { id: "materiality", label: "Materiality", icon: Target, href: "/sustainability/materiality", view: null },
  { id: "targets", label: "Targets", icon: Target, href: "/sustainability/targets", view: null },
  { id: "data-management", label: "Data Management", icon: Database, href: "/sustainability/data-management", view: null },
  { id: "data-entry", label: tDashboard('navigation.dataEntry'), icon: Database, href: "/sustainability/data-entry", view: null },
  { id: "data-investigation", label: tDashboard('navigation.dataInvestigation'), icon: FileSpreadsheet, href: "/sustainability/data-investigation", view: null },
  { id: "data-comparison", label: tDashboard('navigation.dataComparison'), icon: Activity, href: "/sustainability/data-comparison", view: null },
  { id: "data-migration", label: tDashboard('navigation.dataMigration'), icon: Wrench, href: "/sustainability/data-migration", view: null },
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