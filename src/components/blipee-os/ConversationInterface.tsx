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
import { ConversationClient } from "@/lib/conversations/client";
import { useAPIClient } from "@/lib/api/client";
import { useCSRF } from "@/hooks/use-csrf";
import { useAuth } from "@/lib/auth/context";
import { useAppearance } from "@/providers/AppearanceProvider";
import { useTranslations } from "@/providers/LanguageProvider";
import { Menu, Plus, PanelRightOpen, PanelRightClose, Bot } from "lucide-react";
import { generateRoleSuggestions, generateFollowUpSuggestions, type DynamicSuggestion } from "@/lib/ai/client-suggestions";

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
  const { settings, updateSetting } = useAppearance();
  const t = useTranslations('conversation');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(settings.sidebarAutoCollapse);

  // Initialize collapsed state on mount and when setting changes
  useEffect(() => {
    setIsSidebarCollapsed(settings.sidebarAutoCollapse);
  }, [settings.sidebarAutoCollapse]);

  // Handle manual toggle - update both local state and global setting
  const handleToggleCollapse = () => {
    const newCollapsedState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newCollapsedState);
    updateSetting('sidebarAutoCollapse', newCollapsedState);
  };
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [currentArtifactId, setCurrentArtifactId] = useState<string | undefined>();
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [isArtifactsExpanded, setIsArtifactsExpanded] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showChats, setShowChats] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<DynamicSuggestion[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiClient = useAPIClient();
  const { headers: csrfHeaders } = useCSRF();
  const { session } = useAuth();
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load dynamic suggestions based on user role and context
  useEffect(() => {
    const loadSuggestions = async () => {
      // Always load suggestions, even without a session
      // Determine user role from session or default
      let userRole = 'MEMBER'; // Default role

      if (session?.user) {
        try {
          // Get user role from the server API (uses admin client to bypass RLS)
          const response = await fetch('/api/auth/user-role');

          if (response.ok) {
            const data = await response.json();

            if (data.isSuperAdmin) {
              userRole = 'SUPER_ADMIN';
              console.log('👑 Super Admin detected!');
            } else if (data.role) {
              // Map database roles to suggestion engine roles
              switch(data.role) {
                case 'account_owner':
                case 'OWNER':
                  userRole = 'OWNER';
                  break;
                case 'sustainability_manager':
                case 'MANAGER':
                  userRole = 'MANAGER';
                  break;
                case 'facility_manager':
                  userRole = 'facility_manager';
                  break;
                case 'analyst':
                case 'MEMBER':
                  userRole = 'MEMBER';
                  break;
                case 'viewer':
                case 'VIEWER':
                  userRole = 'VIEWER';
                  break;
                default:
                  userRole = 'MEMBER';
              }
            }

            console.log('🤖 Blipee Assistant - User detected:', {
              email: session.user.email,
              role: userRole,
              isSuperAdmin: data.isSuperAdmin,
              authUserId: data.authUserId,
              dbRole: data.role
            });
          } else {
            console.error('Failed to get user role from API');
          }
        } catch (error) {
          console.error('Error detecting user role:', error);
          // Fallback to session-based detection
          if (session.permissions && session.permissions.length > 0) {
            const permission = session.permissions[0];
            userRole = permission.role || 'MEMBER';
          }
        }
      }

      const suggestions = await generateRoleSuggestions(userRole, pathname);
      console.log('📋 Generated suggestions for role', userRole, ':', suggestions);
      setDynamicSuggestions(suggestions);
    };
    loadSuggestions();
  }, [session, pathname, messages.length]);

  // Load conversations from database on mount
  useEffect(() => {
    const loadConversations = async () => {
      if (!session?.user?.id) return;

      try {
        const dbConversations = await ConversationClient.getUserConversations();
        const convs = dbConversations.map((c: any) => ({
          id: c.id,
          title: c.messages?.[0]?.content?.slice(0, 50) || 'New Conversation',
          lastMessage: c.messages?.[c.messages.length - 1]?.content?.slice(0, 100) || '',
          timestamp: new Date(c.updated_at),
          messageCount: c.messages?.length || 0,
          messages: c.messages || []
        }));
        setConversations(convs);
      } catch (error) {
        console.error('Error loading conversations:', error);
        // Fallback to localStorage if database fails
        const stored = localStorage.getItem("blipee_conversations");
        if (stored) {
          const parsed = JSON.parse(stored);
          const convs = parsed.map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp),
          }));
          setConversations(convs);
        }
      }
    };
    loadConversations();
  }, [session]);

  const createNewConversation = async (): Promise<string | null> => {
    if (!session?.user?.id) {
      console.error('User not authenticated');
      return null;
    }

    console.log('Creating new conversation with buildingContext:', buildingContext?.id);
    try {
      const dbConversation = await ConversationClient.createConversation(
        buildingContext?.id
      );
      console.log('Database conversation created:', dbConversation);

      const newConversation: StoredConversation = {
        id: dbConversation.id,
        title: t('newConversation'),
        lastMessage: "",
        timestamp: new Date(dbConversation.created_at),
        messageCount: 0,
        messages: [],
      };

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(dbConversation.id);
      setMessages([]);
      return dbConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to local-only conversation
      const newId = `local_${Date.now()}`;
      console.log('Using local fallback conversation ID:', newId);
      const newConversation: StoredConversation = {
        id: newId,
        title: t('newConversation'),
        lastMessage: "",
        timestamp: new Date(),
        messageCount: 0,
        messages: [],
      };

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversationId(newId);
      setMessages([]);
      return newId;
    }
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

  const updateCurrentConversation = async (newMessages: Message[]) => {
    if (!currentConversationId) return;

    // Update local state immediately
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

    // Persist to database if not a local conversation
    if (!currentConversationId.startsWith('local_')) {
      try {
        await ConversationClient.updateMessages(currentConversationId, newMessages);
      } catch (error) {
        console.error('Error updating conversation in database:', error);
      }
    }
  };

  const handleSend = async (message: string, files?: any[]) => {
    if ((!message.trim() && !files?.length) || isLoading) return;

    // Show which agent is responding if one was selected
    if (currentAgent) {
      console.log(`🤖 Routing to ${currentAgent} agent...`);
    }

    // Create new conversation if needed
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation();
      if (!conversationId) {
        console.error('Failed to create conversation');
        return;
      }
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
          formData.append("conversationId", conversationId);

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
      console.log('Sending to AI API:', {
        message: message.substring(0, 50) + '...',
        conversationId: conversationId,
        buildingId: buildingContext?.id,
        buildingContext: buildingContext,
        attachments: uploadedFiles,
      });

      const data = await apiClient.post("/api/ai/chat", {
        message,
        conversationId: conversationId,
        buildingId: buildingContext?.id,
        buildingContext: buildingContext,
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
        content: aiResponse.content || t('defaultResponse'),
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
          title: aiResponse.artifactTitle || t('generatedCode'),
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
        content: t('errorMessage'),
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
          onToggleCollapse={handleToggleCollapse}
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
            onNewConversation={async () => {
              await createNewConversation();
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
                  <h1 className="text-4xl font-bold mb-4">
                    <span style={{
                      background: 'linear-gradient(to right, rgb(var(--accent-primary-rgb)), rgb(var(--accent-secondary-rgb)))',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      {t('welcomeMessage')}
                    </span>
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    {t('welcomeSubtitle')}
                  </p>
                  
                  {/* Dynamic role-based suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                    {dynamicSuggestions.slice(0, 4).map((suggestion, index) => (
                      <motion.button
                        key={suggestion.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          setCurrentAgent(suggestion.agent);
                          handleSend(suggestion.text);
                        }}
                        className="px-4 py-3 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.05] border border-gray-200 dark:border-white/[0.05] rounded-lg transition-all text-left group"
                        title={`Powered by ${suggestion.agent}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg flex-shrink-0">{suggestion.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-700 dark:text-gray-300 truncate">
                              {suggestion.text}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              {suggestion.agent}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Show which AI employees are available */}
                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🤖 Your AI team: ESG Chief • Compliance Guardian • Carbon Hunter • Cost Finder
                    </p>
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

        {/* Dynamic follow-up suggestions */}
        {messages.length > 0 && dynamicSuggestions.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-white/[0.05] bg-gray-50 dark:bg-white/[0.01]">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {dynamicSuggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => {
                    setCurrentAgent(suggestion.agent);
                    handleSuggestionClick(suggestion.text);
                  }}
                  className="flex-shrink-0 px-3 py-1.5 bg-white dark:bg-white/[0.05] text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-purple-50 dark:hover:bg-purple-500/[0.1] hover:text-purple-700 dark:hover:text-purple-300 transition-colors border border-gray-200 dark:border-white/[0.1] group"
                >
                  <span className="mr-1.5">{suggestion.icon}</span>
                  <span>{suggestion.text}</span>
                  <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    ({suggestion.agent})
                  </span>
                </button>
              ))}
            </div>
            {currentAgent && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Bot className="w-3 h-3 animate-pulse" />
                <span>{currentAgent} is thinking...</span>
              </div>
            )}
          </div>
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