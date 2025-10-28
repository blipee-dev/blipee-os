'use client';

/**
 * Floating Chat Widget
 *
 * Clean, minimal ChatGPT-style interface
 * Mobile-first, light mode design
 */

import { useState, useEffect } from 'react';
import { X, MessageCircle, Bot, PencilLine, Search, Maximize2, Minimize2, ChevronLeft, ChevronRight, MoreVertical, Share, Edit, Archive, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInterface } from './ChatInterface';
import type { SustainabilityAgentMessage } from '@/lib/ai/agents';
import { useAuth } from '@/lib/auth/context';
import { Input } from '@/components/ui/input';
import { NotificationBadge } from '@/components/ui/notification-badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FloatingChatProps {
  conversationId?: string;
  organizationId: string;
  buildingId?: string;
  initialMessages?: SustainabilityAgentMessage[];
}

interface ConversationMemory {
  id: string;
  title: string | null;
  summary: string;
  created_at: string;
  updated_at: string;
}

export function FloatingChat({
  conversationId: initialConversationId,
  organizationId,
  buildingId,
  initialMessages
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  // If no initial conversation provided, start with a new one
  const [selectedConversationId, setSelectedConversationId] = useState(
    initialConversationId || crypto.randomUUID()
  );
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [loadedMessages, setLoadedMessages] = useState<SustainabilityAgentMessage[]>(initialMessages || []);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [loadedMessagesFor, setLoadedMessagesFor] = useState<string | null>(initialConversationId || null);
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchConversations = async () => {
    if (!user) {
      return;
    }

    setIsLoadingConversations(true);
    try {
      const url = `/api/conversations?userId=${user.id}&organizationId=${organizationId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      } else {
        console.error('[FloatingChat] Response not OK:', response.status, await response.text());
      }
    } catch (error) {
      console.error('[FloatingChat] Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
      setConversationsLoaded(true);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    setLoadedMessagesFor(null); // Clear tracking while loading
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setLoadedMessages(data.messages || []);
        setLoadedMessagesFor(conversationId);
      } else if (response.status === 404) {
        // 404 is expected for new conversations that haven't been created yet
        setLoadedMessages([]);
        setLoadedMessagesFor(conversationId);
      } else {
        console.error('[FloatingChat] ❌ Failed to load messages:', response.status);
        setLoadedMessages([]);
        setLoadedMessagesFor(null);
      }
    } catch (error) {
      console.error('[FloatingChat] ❌ Error loading messages:', error);
      setLoadedMessages([]);
      setLoadedMessagesFor(null);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Reset to small size when opening chat
  useEffect(() => {
    if (isOpen) {
      setIsExpanded(false);
      if (user) {
        fetchConversations();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  // When conversations load, keep the new chat (don't auto-switch to most recent)
  // Users expect to start with a blank chat when opening the modal
  useEffect(() => {
    if (!initialConversationId && conversations.length > 0 && isOpen && conversationsLoaded) {
      // Keep the current new conversation - don't auto-switch
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations, isOpen, conversationsLoaded]);

  // Load messages when conversation changes (but only for valid conversations)
  useEffect(() => {
    if (!selectedConversationId) return;

    // If we have an initial conversation ID (from props), fetch immediately
    if (initialConversationId) {
      fetchMessages(selectedConversationId);
      return;
    }

    // Otherwise, only fetch if:
    // 1. Conversations have been loaded, AND
    // 2. The selected conversation exists in the list OR there are no conversations (new chat)
    if (conversationsLoaded) {
      const conversationExists = conversations.some(c => c.id === selectedConversationId);
      console.log('[FloatingChat] Checking if should fetch:', {
        conversationExists,
        conversationsLength: conversations.length
      });
      if (conversationExists || conversations.length === 0) {
        fetchMessages(selectedConversationId);
      } else {
        // New conversation (doesn't exist in list yet) - mark as loaded with empty messages
        console.log('[FloatingChat] New conversation - marking as loaded with empty messages');
        setLoadedMessages([]);
        setLoadedMessagesFor(selectedConversationId);
        setIsLoadingMessages(false);
      }
    } else {
      console.log('[FloatingChat] Skipping fetch - conversations not loaded yet');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversationId, conversationsLoaded]);

  const handleNewChat = () => {
    // Generate a new conversation ID (UUID format to match database schema)
    const newConversationId = crypto.randomUUID();
    console.log('[FloatingChat] 🆕 handleNewChat - Creating new conversation:', newConversationId);
    setSelectedConversationId(newConversationId);
    setLoadedMessages([]); // Clear messages for new chat
    setLoadedMessagesFor(null); // Clear loaded message tracking
    setSearchQuery('');
    setIsSearchModalOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    console.log('[FloatingChat] 👆 handleSelectConversation - Selecting conversation:', conversationId);
    setIsLoadingMessages(true); // Set loading state immediately
    setLoadedMessages([]); // Clear messages immediately when switching
    setLoadedMessagesFor(null); // Clear loaded message tracking
    setSelectedConversationId(conversationId);
    setIsSearchModalOpen(false);
    console.log('[FloatingChat] Set states for conversation switch - loading=true, messages=[], loadedFor=null');

    // Mark messages as read for existing conversations
    const existingConv = conversations.find(c => c.id === conversationId);
    if (existingConv) {
      markMessagesAsRead(conversationId);
    }
    // Messages will be loaded by useEffect
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      });

      if (response.ok) {
        // Refresh conversation list
        await fetchConversations();
        setRenamingConversationId(null);
        setRenameValue('');
      } else {
        console.error('[FloatingChat] Failed to rename conversation');
      }
    } catch (error) {
      console.error('[FloatingChat] Error renaming conversation:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // If we're deleting the current conversation, switch to a new one
        if (conversationId === selectedConversationId) {
          handleNewChat();
        }
        // Refresh conversation list
        await fetchConversations();
        setDeletingConversationId(null);
      } else {
        console.error('[FloatingChat] Failed to delete conversation');
      }
    } catch (error) {
      console.error('[FloatingChat] Error deleting conversation:', error);
    }
  };

  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true })
      });

      if (response.ok) {
        // If we're archiving the current conversation, switch to a new one
        if (conversationId === selectedConversationId) {
          handleNewChat();
        }
        // Refresh conversation list
        await fetchConversations();
      } else {
        console.error('[FloatingChat] Failed to archive conversation');
      }
    } catch (error) {
      console.error('[FloatingChat] Error archiving conversation:', error);
    }
  };

  const handleShareConversation = async (conversationId: string) => {
    // For now, just copy the conversation URL to clipboard
    const url = `${window.location.origin}/chat/${conversationId}`;
    try {
      await navigator.clipboard.writeText(url);
      // TODO: Show toast notification
      console.log('[FloatingChat] Conversation URL copied to clipboard');
    } catch (error) {
      console.error('[FloatingChat] Error copying to clipboard:', error);
    }
  };

  // Helper function to get time period label
  const getTimePeriod = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return '7 days ago';
    if (diffDays <= 30) return '30 days ago';
    return 'Older';
  };

  // Group conversations by time period
  const groupedConversations = conversations.reduce((acc, conv) => {
    const period = getTimePeriod(conv.updated_at);
    if (!acc[period]) acc[period] = [];
    acc[period].push(conv);
    return acc;
  }, {} as Record<string, ConversationMemory[]>);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.title?.toLowerCase().includes(query) ||
      conv.summary.toLowerCase().includes(query)
    );
  });

  // Group filtered conversations for search modal
  const groupedFilteredConversations = filteredConversations.reduce((acc, conv) => {
    const period = getTimePeriod(conv.updated_at);
    if (!acc[period]) acc[period] = [];
    acc[period].push(conv);
    return acc;
  }, {} as Record<string, ConversationMemory[]>);

  // Get recent conversations for sidebar (limit to 10)
  const recentConversations = conversations.slice(0, 10);

  // Fetch unread agent message count
  const fetchUnreadCount = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/messages/unread');
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark messages as read when opening agent conversation
  const markMessagesAsRead = async (conversationId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      });
      // Refresh unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Poll for unread count every 30 seconds
  useEffect(() => {
    if (!user) return;

    fetchUnreadCount(); // Initial fetch

    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);


  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchModalOpen) {
          setIsSearchModalOpen(false);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSearchModalOpen]);

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[60] bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 group"
          aria-label="Open Chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Ask blipee
          </span>
          <NotificationBadge count={unreadCount} />
        </button>
      )}

      {/* Chat Modal with Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Blurred Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55]"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`fixed z-[60] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col ${
                isExpanded
                  ? 'inset-0 m-auto w-[90vw] h-[90vh]'
                  : 'bottom-6 right-6 w-[450px] h-[650px]'
              }`}
            >
              {/* Top Bar with Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-[2px] rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                    <div className="p-1.5 rounded-md bg-white/90 dark:bg-zinc-900/90">
                      <Bot className="w-5 h-5 text-green-500" />
                    </div>
                  </div>
                  <span className="font-medium text-sm bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">blipee</span>
                </div>
                <div className="flex items-center gap-1">
                  {!isExpanded ? (
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      aria-label="Maximize"
                    >
                      <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      aria-label="Minimize"
                    >
                      <Minimize2 className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-gray-500 dark:text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Main Content: Sidebar + Chat */}
              <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Only shown when expanded */}
                {isExpanded && (
                  <div className={`bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 flex-col transition-all duration-300 ${
                    isSidebarCollapsed ? 'w-16' : 'w-64'
                  } flex`}>

                    {/* New Chat Button */}
                    <div className="px-2 pt-2">
                      <button
                        onClick={handleNewChat}
                        className={`group w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm text-gray-500 dark:text-gray-500 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-colors`}
                        title={isSidebarCollapsed ? 'New chat' : undefined}
                      >
                        <PencilLine className="w-4 h-4 group-hover:text-green-500" />
                        {!isSidebarCollapsed && <span className="group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">New chat</span>}
                      </button>
                    </div>

                    {/* Search Chats Button */}
                    <div className="px-2">
                      <button
                        onClick={() => setIsSearchModalOpen(true)}
                        className={`group w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm text-gray-500 dark:text-gray-500 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-colors`}
                        title={isSidebarCollapsed ? 'Search chats' : undefined}
                      >
                        <Search className="w-4 h-4 group-hover:text-green-500" />
                        {!isSidebarCollapsed && <span className="group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">Search chats</span>}
                      </button>
                    </div>

                    {/* Chats Section */}
                    <div className={`flex-1 overflow-y-auto mt-4 ${isSidebarCollapsed ? '' : ''}`}>
                      {!isSidebarCollapsed && (
                        <>
                          <div className="px-3 mb-2">
                            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">
                              Chats
                            </h3>
                          </div>

                          {isLoadingConversations ? (
                            <div className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-500">
                              Loading...
                            </div>
                          ) : recentConversations.length === 0 ? (
                            <div className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-500">
                              No conversations yet
                            </div>
                          ) : (
                            <div className="space-y-0.5 px-2">
                              {recentConversations.map((conv) => (
                                <div key={conv.id} className="relative group/conv">
                                  {selectedConversationId === conv.id ? (
                                    <div className="p-[2px] rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                                      <div className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-md bg-white/90 dark:bg-zinc-900/90 text-gray-500 dark:text-gray-500">
                                        {renamingConversationId === conv.id ? (
                                          <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onBlur={() => {
                                              handleRenameConversation(conv.id, renameValue);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                handleRenameConversation(conv.id, renameValue);
                                              } else if (e.key === 'Escape') {
                                                setRenamingConversationId(null);
                                                setRenameValue('');
                                              }
                                            }}
                                            autoFocus
                                            className="flex-1 bg-transparent border-none outline-none focus:ring-0"
                                          />
                                        ) : (
                                          <>
                                            <button
                                              onClick={() => handleSelectConversation(conv.id)}
                                              className="flex-1 text-left truncate"
                                            >
                                              {conv.title || 'Untitled conversation'}
                                            </button>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger
                                                className="opacity-100 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded p-1 transition-opacity"
                                                onClick={(e) => e.stopPropagation()}
                                              >
                                                <MoreVertical className="w-3.5 h-3.5" />
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => handleShareConversation(conv.id)}>
                                                  <Share className="w-4 h-4 mr-2" />
                                                  Share
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => {
                                                  setRenamingConversationId(conv.id);
                                                  setRenameValue(conv.title || '');
                                                }}>
                                                  <Edit className="w-4 h-4 mr-2" />
                                                  Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleArchiveConversation(conv.id)}>
                                                  <Archive className="w-4 h-4 mr-2" />
                                                  Archive
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                  className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                  onClick={() => setDeletingConversationId(conv.id)}
                                                >
                                                  <Trash2 className="w-4 h-4 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg text-gray-500 dark:text-gray-500 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 transition-colors">
                                      {renamingConversationId === conv.id ? (
                                        <input
                                          type="text"
                                          value={renameValue}
                                          onChange={(e) => setRenameValue(e.target.value)}
                                          onBlur={() => {
                                            handleRenameConversation(conv.id, renameValue);
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              handleRenameConversation(conv.id, renameValue);
                                            } else if (e.key === 'Escape') {
                                              setRenamingConversationId(null);
                                              setRenameValue('');
                                            }
                                          }}
                                          autoFocus
                                          className="flex-1 bg-transparent border-none outline-none focus:ring-0"
                                        />
                                      ) : (
                                        <>
                                          <button
                                            onClick={() => handleSelectConversation(conv.id)}
                                            className="flex-1 text-left truncate group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent"
                                          >
                                            {conv.title || 'Untitled conversation'}
                                          </button>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger
                                              className="opacity-0 group-hover/conv:opacity-100 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded p-1 transition-opacity"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <MoreVertical className="w-3.5 h-3.5" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                              <DropdownMenuItem onClick={() => handleShareConversation(conv.id)}>
                                                <Share className="w-4 h-4 mr-2" />
                                                Share
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => {
                                                setRenamingConversationId(conv.id);
                                                setRenameValue(conv.title || '');
                                              }}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Rename
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleArchiveConversation(conv.id)}>
                                                <Archive className="w-4 h-4 mr-2" />
                                                Archive
                                              </DropdownMenuItem>
                                              <DropdownMenuSeparator />
                                              <DropdownMenuItem
                                                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                                                onClick={() => setDeletingConversationId(conv.id)}
                                              >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                              </DropdownMenuItem>
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Collapse/Expand Sidebar Button */}
                    <div className="p-3 border-t border-gray-200 dark:border-zinc-800">
                      <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="group w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 dark:text-gray-500 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-colors"
                        title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                      >
                        {isSidebarCollapsed ? (
                          <ChevronRight className="w-4 h-4 group-hover:text-green-500" />
                        ) : (
                          <ChevronLeft className="w-4 h-4 group-hover:text-green-500" />
                        )}
                        {!isSidebarCollapsed && <span className="group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">Collapse sidebar</span>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Chat Content */}
                <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-900">
                  {(() => {
                    const shouldShowLoading = !conversationsLoaded || isLoadingMessages || loadedMessagesFor !== selectedConversationId;

                    return shouldShowLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-sm text-gray-500 dark:text-gray-500">
                          {!conversationsLoaded ? 'Loading conversations...' : 'Loading messages...'}
                        </div>
                      </div>
                    ) : (
                      <ChatInterface
                        key={selectedConversationId}
                        conversationId={selectedConversationId}
                        organizationId={organizationId}
                        buildingId={buildingId}
                        initialMessages={loadedMessages}
                        className="h-full"
                        onConversationUpdate={fetchConversations}
                      />
                    );
                  })()}
                </div>
              </div>
            </motion.div>

            {/* Search Modal */}
            <AnimatePresence>
              {isSearchModalOpen && (
                <>
                  {/* Modal Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsSearchModalOpen(false)}
                    className="fixed inset-0 bg-black/20 z-[60]"
                  />

                  {/* Search Modal Content */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 m-auto w-full max-w-2xl h-fit max-h-[80vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-[70] flex flex-col"
                  >
                    {/* Search Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-10 text-base border-0 shadow-none focus-visible:ring-0 bg-transparent"
                          autoFocus
                        />
                        <button
                          onClick={() => setIsSearchModalOpen(false)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Search Results */}
                    <div className="flex-1 overflow-y-auto p-2">
                      {/* New Chat Option */}
                      <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mb-2"
                      >
                        <PencilLine className="w-4 h-4" />
                        <span>New chat</span>
                      </button>

                      {isLoadingConversations ? (
                        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-500">
                          Loading...
                        </div>
                      ) : filteredConversations.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-500">
                          {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </div>
                      ) : (
                        <>
                          {Object.entries(groupedFilteredConversations).map(([period, convs]) => (
                            <div key={period} className="mb-4">
                              {/* Time Period Header */}
                              <div className="px-3 py-2">
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-500">
                                  {period}
                                </h4>
                              </div>

                              {/* Conversations in this period */}
                              <div className="space-y-0.5">
                                {convs.map((conv) => (
                                  <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4 flex-shrink-0 text-gray-500" />
                                    <span className="flex-1 text-left truncate">
                                      {conv.title || 'Untitled conversation'}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
              {deletingConversationId && (
                <>
                  {/* Modal Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setDeletingConversationId(null)}
                    className="fixed inset-0 bg-black/60 z-[60]"
                  />

                  {/* Confirmation Modal */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="fixed inset-0 m-auto w-full max-w-md h-fit bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl z-[70] p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Delete conversation?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      This will permanently delete this conversation and all its messages. This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setDeletingConversationId(null)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(deletingConversationId)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
