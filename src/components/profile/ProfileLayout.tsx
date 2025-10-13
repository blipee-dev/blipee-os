"use client";

import React, { useState, useEffect } from "react";
import { User, Bell, Shield, Palette, Globe } from "lucide-react";
import { BaseSidebarLayout } from "@/components/layout/BaseSidebarLayout";
import { useTranslations } from "@/providers/LanguageProvider";
import { useAuth } from "@/lib/auth/context";

const getProfileNavItems = (t: (key: string) => string, isSuperAdmin: boolean) => {
  const items = [
    { id: "profile", label: t('navigation.profile'), icon: User, href: "/profile", view: null },
  ];

  // Only show notifications for super admin users
  if (isSuperAdmin) {
    items.push({ id: "notifications", label: t('navigation.notifications'), icon: Bell, href: "/profile/notifications", view: null });
  }

  items.push(
    { id: "security", label: t('navigation.security'), icon: Shield, href: "/profile/security", view: null },
    { id: "appearance", label: t('navigation.appearance'), icon: Palette, href: "/profile/appearance", view: null },
    { id: "language", label: t('navigation.language'), icon: Globe, href: "/profile/language", view: null }
  );

  return items;
};

interface ProfileLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function ProfileLayout({ children, pageTitle }: ProfileLayoutProps) {
  const t = useTranslations('profile.sidebar');
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Check super admin status
  useEffect(() => {
    async function checkSuperAdmin() {
      if (!user) return;
      try {
        const response = await fetch('/api/auth/user-role');
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Error checking super admin status:', error);
      }
    }
    checkSuperAdmin();
  }, [user]);

  const profileNavItems = getProfileNavItems(t, isSuperAdmin);
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