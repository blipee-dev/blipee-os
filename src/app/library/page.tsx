"use client";

import React from "react";
import { AppLayout } from "@/components/blipee-os/AppLayout";
import { ArtifactsLibrary } from "@/components/blipee-os/ArtifactsLibrary";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const router = useRouter();
  const mockConversations = [
    {
      id: "1",
      title: "Sustainability Analysis",
      lastMessage: "Let me analyze your carbon footprint...",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      messageCount: 5,
    },
  ];

  return (
    <AppLayout
      conversations={mockConversations}
      onNewConversation={() => router.push("/blipee-ai")}
      onSelectConversation={(id) => {}}
      onDeleteConversation={(id) => {}}
      showSidebar={false}
      pageTitle="Library"
    >
      <ArtifactsLibrary />
    </AppLayout>
  );
}