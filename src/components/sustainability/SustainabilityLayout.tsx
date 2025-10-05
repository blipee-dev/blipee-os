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