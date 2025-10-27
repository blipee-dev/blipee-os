"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/context";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { useOrganizationContext } from "@/hooks/useOrganizationContext";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string>('');
  const { data: organizationData } = useOrganizationContext(!!user);

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
              title: 'Profile Chat',
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

  return (
    <>
      {children}

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
