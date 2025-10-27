'use client';

/**
 * Floating Chat Widget
 *
 * Clean, minimal ChatGPT-style interface
 * Mobile-first, light mode design
 */

import { useState, useEffect } from 'react';
import { X, MessageCircle, Bot, PencilLine, Search, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatInterface } from './ChatInterface';
import type { SustainabilityAgentMessage } from '@/lib/ai/agents';
import { useAuth } from '@/lib/auth/context';
import { Input } from '@/components/ui/input';

interface FloatingChatProps {
  conversationId: string;
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
  const [selectedConversationId, setSelectedConversationId] = useState(initialConversationId);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const { user } = useAuth();

  const fetchConversations = async () => {
    if (!user) return;

    setIsLoadingConversations(true);
    try {
      const response = await fetch(
        `/api/conversations?userId=${user.id}&organizationId=${organizationId}`
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  // Fetch conversations when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user]);

  const handleNewChat = () => {
    // Generate a new conversation ID
    const newConversationId = `conv_${Date.now()}`;
    setSelectedConversationId(newConversationId);
    setSearchQuery('');
    setIsSearchModalOpen(false);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversationId(conversationId);
    setIsSearchModalOpen(false);
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
          className="fixed bottom-6 right-6 z-50 bg-black text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 group"
          aria-label="Open Chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Ask blipee
          </span>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
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
              className={`fixed z-50 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden flex flex-col ${
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
                      <Maximize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsExpanded(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                      aria-label="Minimize"
                    >
                      <Minimize2 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-gray-700 dark:text-gray-300" />
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
                        className={`group w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-colors`}
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
                        className={`group w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-colors`}
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
                            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Chats
                            </h3>
                          </div>

                          {isLoadingConversations ? (
                            <div className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                              Loading...
                            </div>
                          ) : recentConversations.length === 0 ? (
                            <div className="px-2 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                              No conversations yet
                            </div>
                          ) : (
                            <div className="space-y-0.5 px-2">
                              {recentConversations.map((conv) => (
                                selectedConversationId === conv.id ? (
                                  <div key={conv.id} className="p-[2px] rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
                                    <button
                                      onClick={() => handleSelectConversation(conv.id)}
                                      className="w-full text-left px-3 py-2 text-sm rounded-md bg-white/90 dark:bg-zinc-900/90 text-gray-900 dark:text-gray-100"
                                    >
                                      <p className="truncate">{conv.title || 'Untitled conversation'}</p>
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv.id)}
                                    className="group w-full text-left px-3 py-2 text-sm rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 transition-colors"
                                  >
                                    <p className="truncate group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">{conv.title || 'Untitled conversation'}</p>
                                  </button>
                                )
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
                        className="group w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20 rounded-lg transition-colors"
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
                  <ChatInterface
                    conversationId={selectedConversationId}
                    organizationId={organizationId}
                    buildingId={buildingId}
                    initialMessages={initialMessages}
                    className="h-full"
                  />
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
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                          <X className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </div>

                    {/* Search Results */}
                    <div className="flex-1 overflow-y-auto p-2">
                      {/* New Chat Option */}
                      <button
                        onClick={handleNewChat}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mb-2"
                      >
                        <PencilLine className="w-4 h-4" />
                        <span>New chat</span>
                      </button>

                      {isLoadingConversations ? (
                        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                          Loading...
                        </div>
                      ) : filteredConversations.length === 0 ? (
                        <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                          {searchQuery ? 'No conversations found' : 'No conversations yet'}
                        </div>
                      ) : (
                        <>
                          {Object.entries(groupedFilteredConversations).map(([period, convs]) => (
                            <div key={period} className="mb-4">
                              {/* Time Period Header */}
                              <div className="px-3 py-2">
                                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                  {period}
                                </h4>
                              </div>

                              {/* Conversations in this period */}
                              <div className="space-y-0.5">
                                {convs.map((conv) => (
                                  <button
                                    key={conv.id}
                                    onClick={() => handleSelectConversation(conv.id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                  >
                                    <MessageCircle className="w-4 h-4 flex-shrink-0 text-gray-400" />
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
          </>
        )}
      </AnimatePresence>
    </>
  );
}
