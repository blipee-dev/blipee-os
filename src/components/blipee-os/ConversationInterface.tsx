"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageBubble } from "./MessageBubble";
import { InputArea } from "./InputArea";
import { MessageSuggestions } from "./MessageSuggestions";
import { DynamicUIRenderer } from "./DynamicUIRenderer";
import { ConversationSidebar } from "./ConversationSidebar";
import { ArtifactsPanel, Artifact } from "./ArtifactsPanel";
import { ArtifactsLibrary } from "./ArtifactsLibrary";
import { ChatsView } from "./ChatsView";
import { MobileNavigation } from "./MobileNavigation";
import { Message, UIComponent } from "@/types/conversation";
import { conversationService } from "@/lib/conversations/service";
import { jsonToMessages } from "@/lib/conversations/utils";
import { useAPIClient } from "@/lib/api/client";
import { useCSRF } from "@/hooks/use-csrf";
import { useAuth } from "@/lib/auth/context";
import { Menu, Plus, PanelRightOpen, PanelRightClose } from "lucide-react";

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

interface StoredConversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  messages: Message[];
}

export function ConversationInterface({
  buildingContext,
}: ConversationInterfaceProps = {}) {
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([
    {
      id: "sample1",
      type: "document",
      title: "Sustainability Report",
      content: "<h2>Monthly Sustainability Report</h2><p>Carbon emissions reduced by 15% this month.</p>",
      timestamp: new Date(),
    },
    {
      id: "sample2",
      type: "chart",
      title: "Energy Usage Trends",
      content: "Chart showing energy consumption patterns over the last quarter",
      timestamp: new Date(),
    },
  ]);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | undefined>("sample1");
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [isArtifactsExpanded, setIsArtifactsExpanded] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiClient = useAPIClient();
  const { headers: csrfHeaders } = useCSRF();
  const { session } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations from localStorage on mount
  useEffect(() => {
    const loadConversations = () => {
      const stored = localStorage.getItem("blipee_conversations");
      if (stored) {
        const parsed = JSON.parse(stored);
        const convs = parsed.map((c: any) => ({
          ...c,
          timestamp: new Date(c.timestamp),
        }));
        setConversations(convs);
      }
    };
    loadConversations();
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      localStorage.setItem("blipee_conversations", JSON.stringify(conversations));
    }
  }, [conversations]);

  const createNewConversation = () => {
    const newId = `conv_${Date.now()}`;
    const newConversation: StoredConversation = {
      id: newId,
      title: "New conversation",
      lastMessage: "",
      timestamp: new Date(),
      messageCount: 0,
      messages: [],
    };
    
    setConversations((prev) => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([]);
  };

  const selectConversation = (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      setMessages(conv.messages);
    }
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
      setMessages([]);
    }
  };

  const updateCurrentConversation = (newMessages: Message[]) => {
    if (!currentConversationId) return;

    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id === currentConversationId) {
          const lastMsg = newMessages[newMessages.length - 1];
          const title = conv.messageCount === 0 && newMessages.length > 0
            ? newMessages[0].content.slice(0, 50) + (newMessages[0].content.length > 50 ? "..." : "")
            : conv.title;
          
          return {
            ...conv,
            title,
            lastMessage: lastMsg?.content.slice(0, 100) || "",
            timestamp: new Date(),
            messageCount: newMessages.length,
            messages: newMessages,
          };
        }
        return conv;
      })
    );
  };

  const handleSend = async (message: string, files?: any[]) => {
    if ((!message.trim() && !files?.length) || isLoading) return;

    // Create new conversation if needed
    if (!currentConversationId) {
      createNewConversation();
      // Wait for state update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

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
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    updateCurrentConversation(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Upload files if any and create artifacts for them
      let uploadedFiles = [];
      if (files && files.length > 0) {
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file.file);
          formData.append("conversationId", currentConversationId || "demo");

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
            
            // Create artifact for uploaded file
            const artifactType = file.type.startsWith("image/") ? "image" : "file";
            const newArtifact: Artifact = {
              id: `artifact_${Date.now()}_${file.id}`,
              type: artifactType,
              title: file.name,
              content: uploadResult.extractedData || `File: ${file.name}`,
              fileUrl: uploadResult.publicUrl || uploadResult.url,
              mimeType: file.type,
              size: file.size,
              timestamp: new Date(),
            };
            setArtifacts(prev => [...prev, newArtifact]);
          }
        }
      }

      // Get AI response
      const data = await apiClient.post("/api/ai/chat", {
        message,
        conversationId: currentConversationId || "demo",
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

      // Check if response contains code or structured content that should be shown as an artifact
      if (aiResponse.artifact || (aiResponse.content && aiResponse.content.includes("```"))) {
        const artifactId = `artifact_${Date.now()}`;
        const newArtifact: Artifact = {
          id: artifactId,
          type: aiResponse.artifactType || "code",
          title: aiResponse.artifactTitle || "Generated Code",
          language: aiResponse.artifactLanguage || "typescript",
          content: aiResponse.artifact || extractCodeFromMessage(aiResponse.content),
          timestamp: new Date(),
        };
        
        setArtifacts(prev => [...prev, newArtifact]);
        setCurrentArtifactId(artifactId);
        setShowArtifacts(true);
      }

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      updateCurrentConversation(finalMessages);
    } catch (error) {
      console.error("Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
      updateCurrentConversation(finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSend(suggestion);
  };

  const extractCodeFromMessage = (content: string): string => {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
    const matches = content.match(codeBlockRegex);
    if (matches) {
      return matches[0].replace(/```[\w]*\n/, '').replace(/```$/, '');
    }
    return content;
  };

  const lastAssistantMessage = messages
    .filter((m) => m.role === "assistant")
    .pop();

  return (
    <div className="flex h-screen bg-white dark:bg-[#212121] pb-16 md:pb-0">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <ConversationSidebar
          currentConversationId={currentConversationId}
          onNewConversation={createNewConversation}
          onSelectConversation={selectConversation}
          onDeleteConversation={deleteConversation}
          conversations={conversations}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onToggleArtifacts={() => {
            setShowLibrary(!showLibrary);
            setShowChats(false);
          }}
          showArtifacts={showLibrary}
          onToggleChats={() => {
            setShowChats(!showChats);
            setShowLibrary(false);
          }}
          showChats={showChats}
        />
      </div>


      {/* Main content */}
      <div className="flex-1 flex">
        {showChats ? (
          /* Chats View */
          <ChatsView
            conversations={conversations}
            currentConversationId={undefined}
            onSelectConversation={(id) => {
              selectConversation(id);
              setShowChats(false);
            }}
            onDeleteConversation={deleteConversation}
            onBack={() => setShowChats(false)}
            onNewConversation={() => {
              createNewConversation();
              setShowChats(false);
            }}
          />
        ) : showLibrary ? (
          /* Artifacts Library View */
          <ArtifactsLibrary
            artifacts={artifacts}
            onBack={() => setShowLibrary(false)}
            onSelectArtifact={(artifact) => {
              // Handle artifact selection
              setCurrentArtifactId(artifact.id);
              setShowLibrary(false);
              setShowArtifacts(true);
            }}
            onDeleteArtifact={(id) => {
              setArtifacts(prev => prev.filter(a => a.id !== id));
              if (currentArtifactId === id) {
                setCurrentArtifactId(undefined);
              }
            }}
          />
        ) : (
          /* Conversation View */
          <div className="flex-1 flex flex-col">


          {/* Messages area */}
          <div className="flex-1 overflow-y-auto">
          <div className="pb-32 md:pb-32 mb-16 md:mb-0">
            {messages.length === 0 && (
              <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
                    How can I help you today?
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Start a conversation about sustainability, energy management, or building operations
                  </p>
                  
                  {/* Quick start suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    {[
                      "Show energy usage trends",
                      "Generate Python code for data analysis",
                      "Building performance report",
                      "Create a sustainability dashboard",
                    ].map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSend(suggestion)}
                        className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] border border-gray-200 dark:border-white/[0.05] rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-all"
                      >
                        {suggestion}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}

            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MessageBubble message={message} />
                {message.components && (
                  <DynamicUIRenderer components={message.components} />
                )}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Suggestions */}
        {lastAssistantMessage?.suggestions && (
          <MessageSuggestions
            suggestions={lastAssistantMessage.suggestions}
            onSelect={handleSuggestionClick}
          />
        )}

          {/* Input area */}
          <InputArea
            value={input}
            onChange={setInput}
            disabled={isLoading}
            onSend={handleSend}
          />
          </div>
        )}

        {/* Artifacts Panel - only show in conversation view */}
        {!showLibrary && showArtifacts && (
          <ArtifactsPanel
            artifacts={artifacts}
            currentArtifactId={currentArtifactId}
            onSelectArtifact={setCurrentArtifactId}
            onClose={() => setShowArtifacts(false)}
            isExpanded={isArtifactsExpanded}
            onToggleExpand={() => setIsArtifactsExpanded(!isArtifactsExpanded)}
          />
        )}
      </div>
      
      {/* Mobile Navigation */}
      <MobileNavigation onNewChat={createNewConversation} />
    </div>
  );
}