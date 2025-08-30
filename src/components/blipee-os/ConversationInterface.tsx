"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { InputArea } from "./InputArea";
import { SuggestedQueries } from "./SuggestedQueries";
import { MessageSuggestions } from "./MessageSuggestions";
import { DynamicUIRenderer } from "./DynamicUIRenderer";
import { ConversationalOnboarding } from "@/components/onboarding/ConversationalOnboarding";
import { AmbientBackground } from "@/components/effects/AmbientBackground";
import { NavRail } from "@/components/navigation/NavRail";
import { Message, UIComponent } from "@/types/conversation";
import { conversationService } from "@/lib/conversations/service";
import { jsonToMessages } from "@/lib/conversations/utils";
import { proactiveInsightEngine } from "@/lib/ai/proactive-insights";
import { useAPIClient } from "@/lib/api/client";
import { useCSRF } from "@/hooks/use-csrf";

interface BuildingContext {
  id: string;
  name: string;
  organizationId: string;
  metadata?: {
    size_sqft?: number;
    floors?: number;
    occupancy_types?: string[];
    age_category?: string;
    systems_baseline?: any;
  };
}

interface ConversationInterfaceProps {
  buildingContext?: BuildingContext;
}

export function ConversationInterface({
  buildingContext,
}: ConversationInterfaceProps = {}) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId] = useState("demo-user"); // TODO: Get from auth context
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiClient = useAPIClient();
  const { headers: csrfHeaders } = useCSRF();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation with proactive AI insights
  useEffect(() => {
    const initConversation = async () => {
      setIsInitializing(true);

      const id = await conversationService.getOrCreateDemoConversation();
      if (id) {
        setConversationId(id);

        // Load existing messages if any
        const conversation = await conversationService.getConversation(id);
        if (conversation && (conversation as any).messages) {
          const existingMessages = jsonToMessages((conversation as any).messages);
          if (existingMessages.length > 0) {
            setMessages(existingMessages);
            setIsInitializing(false);
            return;
          }
        }

        // No existing messages - generate proactive welcome
        console.log("🧠 Generating proactive AI insights...");
        const welcomeInsights =
          await proactiveInsightEngine.generateWelcomeInsights();

        const welcomeMessage: Message = {
          id: "1",
          role: "assistant",
          content: welcomeInsights.message,
          components: welcomeInsights.components,
          suggestions: welcomeInsights.suggestions,
          timestamp: new Date(),
        };

        setMessages([welcomeMessage]);

        // Save the intelligent welcome message
        await conversationService.addMessages(id, [welcomeMessage]);
      }

      setIsInitializing(false);
    };

    initConversation();
  }, []);

  const handleSend = async (message: string, files?: any[]) => {
    if ((!message.trim() && !files?.length) || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
      ...(files && files.length > 0 ? {
        attachments: files.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          size: f.size,
        }))
      } : {}),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Save user message to Supabase
    if (conversationId) {
      await conversationService.addMessages(conversationId, [userMessage]);
    }

    try {
      // If there are files, upload them first
      let uploadedFiles = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file.file);
          formData.append("conversationId", conversationId || "demo");

          const uploadResponse = await fetch("/api/files/upload", {
            method: "POST",
            headers: csrfHeaders,
            body: formData,
            credentials: "include",
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            uploadedFiles.push({
              ...uploadResult,
              name: file.name,
              originalName: file.name,
              type: file.type,
              fileType: file.type,
              publicUrl: uploadResult.publicUrl,
              extractedData: uploadResult.extractedData,
            });
          }
        }
      }

      // Include building context if available
      const data = await apiClient.post("/api/ai/chat", {
        message,
        conversationId: conversationId || "demo",
        buildingId: buildingContext?.id || "demo-building",
        buildingContext: buildingContext || null,
        attachments: uploadedFiles,
        context: {
          buildingName: buildingContext?.name,
          organizationId: buildingContext?.organizationId,
          metadata: buildingContext?.metadata,
        },
      });
      
      if (!data) throw new Error("Failed to get response");

      // Add assistant response
      const aiResponse = data as any;
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponseerror.message || "I'm processing your request...",
        components: aiResponse.components,
        suggestions: aiResponse.suggestions,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Save assistant message to Supabase
      if (conversationId) {
        await conversationService.addMessages(conversationId, [
          assistantMessage,
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm currently in demo mode. In the full version, I'll be able to connect to your building systems and provide real-time insights!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQueries = [
    "Show me current energy usage",
    "What's the temperature in the main office?",
    "Generate last month's sustainability report",
    "Find energy saving opportunities",
  ];

  return (
    <>
      <AmbientBackground />
      <NavRail />
      {showOnboarding && (
        <ConversationalOnboarding
          userId={userId}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <div className="flex flex-col h-screen relative ml-20 overflow-hidden">
        {/* Premium Header with Glass Effect */}
        <div className="relative border-b border-white/[0.05] backdrop-blur-xl bg-white/[0.02]">
          {/* Gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {buildingContext ? buildingContext.name : "Blipee OS"}
                </h1>
                <p className="text-sm text-white/50 font-light">
                  {buildingContext
                    ? `AI Assistant for ${buildingContext.name}`
                    : "Your building&apos;s conversational AI"}
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl bg-white/[0.02] border border-white/[0.05]">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-white/60">Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container with subtle glass effect */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
          {/* Subtle background pattern */}
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(14, 165, 233, 0.1) 0%, transparent 50%)`,
            }}
          />
          {messages.map((message) => (
            <div key={message.id}>
              <MessageBubble message={message} />
              {message.components && (
                <div className="mt-4">
                  <DynamicUIRenderer components={message.components} />
                </div>
              )}
              {message.role === "assistant" &&
                message.suggestions &&
                message.suggestions.length > 0 && (
                  <div className="mt-2 ml-14">
                    <MessageSuggestions
                      suggestions={message.suggestions}
                      onSelect={handleSend}
                    />
                  </div>
                )}
            </div>
          ))}
          {(isLoading || isInitializing) && (
            <div className="flex items-center gap-3 px-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-400 opacity-75 animate-[pulse_1.4s_ease-in-out_infinite]" />
                <div className="w-2 h-2 rounded-full bg-purple-400 opacity-75 animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
                <div className="w-2 h-2 rounded-full bg-purple-400 opacity-75 animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
              <span className="text-xs text-white/40 font-light">
                {isInitializing
                  ? "Blipee is analyzing your building..."
                  : "Blipee is thinking..."}
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Queries */}
        {messages.length === 1 && (
          <div className="px-4 pb-2">
            <SuggestedQueries
              queries={suggestedQueries}
              onSelect={handleSend}
            />
          </div>
        )}

        {/* Input Area */}
        <InputArea
          value={input}
          onChange={setInput}
          onSend={handleSend}
          disabled={isLoading}
          placeholder={
            isLoading
              ? "Blipee is thinking..."
              : "Ask me anything about your building..."
          }
        />
      </div>
    </>
  );
}
