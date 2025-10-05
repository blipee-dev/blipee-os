"use client";

import React from "react";
import {
  Building2,
  Users,
  MapPin,
  Cpu,
  FileText,
  Leaf,
} from "lucide-react";
import { BaseSidebarLayout } from "@/components/layout/BaseSidebarLayout";
import { useTranslations } from "@/providers/LanguageProvider";

const getSettingsNavItems = (t: (key: string) => string) => [
  { id: "organizations", label: t('navigation.organizations'), icon: Building2, href: "/settings/organizations", view: null },
  { id: "sites", label: t('navigation.sites'), icon: MapPin, href: "/settings/sites", view: null },
  { id: "devices", label: t('navigation.devices'), icon: Cpu, href: "/settings/devices", view: null },
  { id: "sustainability", label: t('navigation.sustainability'), icon: Leaf, href: "/settings/sustainability", view: null },
  { id: "users", label: t('navigation.users'), icon: Users, href: "/settings/users", view: null },
  { id: "logs", label: t('navigation.logs'), icon: FileText, href: "/settings/logs", view: null },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('settings.sidebar');
  const settingsNavItems = getSettingsNavItems(t);

  return (
    <BaseSidebarLayout
      navItems={settingsNavItems}
      sectionTitle={t('title')}
    >
      {children}
    </BaseSidebarLayout>
  );
}