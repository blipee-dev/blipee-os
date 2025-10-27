"use client";

import React, { useState, useEffect } from "react";
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
import { useAuth } from "@/lib/auth/context";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";

const getSettingsNavItems = (t: (key: string) => string, isSuperAdmin: boolean) => {
  const items = [
    { id: "organizations", label: t('navigation.organizations'), icon: Building2, href: "/settings/organizations", view: null },
    { id: "sites", label: t('navigation.sites'), icon: MapPin, href: "/settings/sites", view: null },
  ];

  // Only show devices and sustainability for super admin users
  if (isSuperAdmin) {
    items.push(
      { id: "devices", label: t('navigation.devices'), icon: Cpu, href: "/settings/devices", view: null },
      { id: "sustainability", label: t('navigation.sustainability'), icon: Leaf, href: "/settings/sustainability", view: null }
    );
  }

  items.push(
    { id: "users", label: t('navigation.users'), icon: Users, href: "/settings/users", view: null },
    { id: "logs", label: t('navigation.logs'), icon: FileText, href: "/settings/logs", view: null }
  );

  return items;
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('settings.sidebar');
  const { user } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const { data: organizationData } = useOrganizationContext(!!user);

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

  // Get or create conversation for floating chat
  useEffect(() => {
    async function setupConversation() {
      if (!user || !organizationData?.id) return;

      try {
        // Check for existing conversation
        const response = await fetch(`/api/conversations?userId=${user.id}&organizationId=${organizationData.id}`);
        const conversations = await response.json();

        if (conversations && conversations.length > 0) {
          setConversationId(conversations[0].id);
        } else {
          // Create new conversation
          const createResponse = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              organizationId: organizationData.id,
              title: 'Settings Chat',
              model: 'gpt-4o',
              temperature: 0.7,
              max_tokens: 2000
            })
          });
          const newConversation = await createResponse.json();
          setConversationId(newConversation.id);
        }
      } catch (error) {
        console.error('Error setting up conversation:', error);
      }
    }
    setupConversation();
  }, [user, organizationData]);

  const settingsNavItems = getSettingsNavItems(t, isSuperAdmin);

  return (
    <>
      <BaseSidebarLayout
        navItems={settingsNavItems}
        sectionTitle={t('title')}
      >
        {children}
      </BaseSidebarLayout>

      {/* Floating AI Chat */}
      {conversationId && organizationData && (
        <FloatingChat
          conversationId={conversationId}
          organizationId={organizationData.id}
        />
      )}
    </>
  );
}