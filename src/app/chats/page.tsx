"use client";

import React from "react";
import { AppLayout } from "@/components/blipee-os/AppLayout";
import { ChatsView } from "@/components/blipee-os/ChatsView";
import { useRouter } from "next/navigation";

export default function ChatsPage() {
  const router = useRouter();
  // Mock conversations
  const mockConversations = [
    {
      id: "1",
      title: "Sustainability Analysis",
      lastMessage: "Let me analyze your carbon footprint data from last quarter...",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      messageCount: 5,
    },
    {
      id: "2",
      title: "Energy Optimization Strategy",
      lastMessage: "Based on your usage patterns, I recommend implementing...",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      messageCount: 3,
    },
    {
      id: "3",
      title: "Q3 ESG Report Review",
      lastMessage: "The report shows significant improvements in Scope 2 emissions...",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      messageCount: 8,
    },
  ];

  return (
    <AppLayout
      conversations={mockConversations}
      onNewConversation={() => router.push("/blipee-ai")}
      onSelectConversation={(id) => console.log("Select conversation", id)}
      onDeleteConversation={(id) => console.log("Delete conversation", id)}
      showSidebar={false}
      pageTitle="Chat History"
    >
      <ChatsView conversations={mockConversations} />
    </AppLayout>
  );
}