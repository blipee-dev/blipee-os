"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { InputArea } from "./InputArea";
import { MessageSuggestions } from "./MessageSuggestions";
import { DynamicUIRenderer } from "./DynamicUIRenderer";
import { ConversationalOnboarding } from "@/components/onboarding/ConversationalOnboarding";
import { Message, UIComponent } from "@/types/conversation";
import { conversationService } from "@/lib/conversations/service";
import { jsonToMessages } from "@/lib/conversations/utils";
import { proactiveInsightEngine } from "@/lib/ai/proactive-insights";
import { useAPIClient } from "@/lib/api/client";
import { useCSRF } from "@/hooks/use-csrf";
import { Menu, Plus, X } from "lucide-react";

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
  const [userId] = useState("demo-user");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiClient = useAPIClient();
  const { headers: csrfHeaders } = useCSRF();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation
  useEffect(() => {
    const initConversation = async () => {
      setIsInitializing(true);

      const id = await conversationService.getOrCreateDemoConversation();
      if (id) {
        setConversationId(id);

        const conversation = await conversationService.getConversation(id);
        if (conversation && (conversation as any).messages) {
          const existingMessages = jsonToMessages((conversation as any).messages);
          if (existingMessages.length > 0) {
            setMessages(existingMessages);
            setIsInitializing(false);
            return;
          }
        }

        // No existing messages - generate welcome
        console.log("🧠 Generating proactive AI insights...");
        try {
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
          await conversationService.addMessages(id, [welcomeMessage]);
        } catch (error) {
          console.error("Failed to generate welcome insights:", error);
          const fallbackMessage: Message = {
            id: "1",
            role: "assistant",
            content: "How can I help you with your building's sustainability and operations today?",
            suggestions: [
              "Show energy usage trends",
              "Analyze carbon emissions",
              "Building performance report",
              "Sustainability recommendations",
              "Cost saving opportunities"
            ],
            timestamp: new Date(),
          };
          setMessages([fallbackMessage]);
        }
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

    if (conversationId) {
      await conversationService.addMessages(conversationId, [userMessage]);
    }

    try {
      // Upload files if any
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

      // Get AI response
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

      const aiResponse = data as any;
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: aiResponse.content || "I'll help you with that.",
        components: aiResponse.components,
        suggestions: aiResponse.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      if (conversationId) {
        await conversationService.addMessages(conversationId, [assistantMessage]);
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([{
      id: "1",
      role: "assistant",
      content: "How can I help you today?",
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-gray-100 dark:bg-gray-950 
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <button
              onClick={startNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 
                bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 
                border border-gray-300 dark:border-gray-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New chat</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Today
              </div>
              <div className="space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 
                  hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors truncate">
                  Current conversation
                </button>
              </div>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {buildingContext?.name || "Blipee"}
            </h1>
          </div>
          <button
            onClick={startNewChat}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors lg:hidden"
          >
            <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="pb-32">
            {messages.length === 0 && !isInitializing && (
              <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                  How can I help you today?
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {[
                    "Show energy usage trends",
                    "Analyze carbon emissions",
                    "Building performance report",
                    "Cost saving opportunities"
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="p-3 text-sm text-left text-gray-700 dark:text-gray-300 
                        bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 
                        border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div key={message.id}>
                <MessageBubble message={message} />
                {message.components && (
                  <div className="max-w-3xl mx-auto px-4 mt-4">
                    <DynamicUIRenderer components={message.components} />
                  </div>
                )}
                {message.role === "assistant" &&
                  message.suggestions &&
                  message.suggestions.length > 0 && (
                    <div className="max-w-3xl mx-auto px-4 mt-2">
                      <MessageSuggestions
                        suggestions={message.suggestions}
                        onSelect={handleSend}
                      />
                    </div>
                  )}
              </div>
            ))}
            
            {isLoading && (
              <div className="max-w-3xl mx-auto px-4 py-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="w-5 h-5 text-white animate-pulse">✨</div>
                  </div>
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64">
          <InputArea
            value={input}
            onChange={setInput}
            onSend={handleSend}
            disabled={isLoading}
            placeholder="Message Blipee..."
          />
        </div>
      </div>

      {showOnboarding && (
        <ConversationalOnboarding
          userId={userId}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </div>
  );
}