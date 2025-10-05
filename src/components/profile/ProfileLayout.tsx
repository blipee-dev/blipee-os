"use client";

import React from "react";
import { User, Bell, Shield, Palette, Globe } from "lucide-react";
import { BaseSidebarLayout } from "@/components/layout/BaseSidebarLayout";
import { useTranslations } from "@/providers/LanguageProvider";

const getProfileNavItems = (t: (key: string) => string) => [
  { id: "profile", label: t('navigation.profile'), icon: User, href: "/profile", view: null },
  { id: "notifications", label: t('navigation.notifications'), icon: Bell, href: "/profile/notifications", view: null },
  { id: "security", label: t('navigation.security'), icon: Shield, href: "/profile/security", view: null },
  { id: "appearance", label: t('navigation.appearance'), icon: Palette, href: "/profile/appearance", view: null },
  { id: "language", label: t('navigation.language'), icon: Globe, href: "/profile/language", view: null },
];

interface ProfileLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function ProfileLayout({ children, pageTitle }: ProfileLayoutProps) {
  const t = useTranslations('profile.sidebar');
  const profileNavItems = getProfileNavItems(t);
  const defaultPageTitle = pageTitle || t('title');

  return (
    <BaseSidebarLayout
      navItems={profileNavItems}
      pageTitle={defaultPageTitle}
      sectionTitle={t('title')}
    >
      {children}
    </BaseSidebarLayout>
  );
}