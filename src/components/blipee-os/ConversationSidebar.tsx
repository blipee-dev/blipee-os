"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MessageSquare,
  Search,
  MoreHorizontal,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Library,
  Check,
  Pin,
  Edit3,
  Sun,
  Moon,
  Settings,
  User,
} from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { useTheme } from "@/providers/ThemeProvider";
import { useRouter } from "next/navigation";

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ConversationSidebarProps {
  currentConversationId?: string;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  conversations: Conversation[];
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onToggleArtifacts?: () => void;
  showArtifacts?: boolean;
  onToggleChats?: () => void;
  showChats?: boolean;
}

export function ConversationSidebar({
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  conversations,
  isCollapsed = false,
  onToggleCollapse,
  onToggleArtifacts,
  showArtifacts = false,
  onToggleChats,
  showChats = false,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      
      if (target.closest('[data-menu-button]')) {
        return;
      }
      
      setMenuOpenId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group conversations by date
  const groupedConversations = React.useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      Today: [],
      Yesterday: [],
      "This Week": [],
      "This Month": [],
      Older: [],
    };

    const filtered = conversations.filter((conv) =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    filtered.forEach((conv) => {
      const date = new Date(conv.timestamp);
      if (isToday(date)) {
        groups["Today"].push(conv);
      } else if (isYesterday(date)) {
        groups["Yesterday"].push(conv);
      } else if (isThisWeek(date)) {
        groups["This Week"].push(conv);
      } else if (isThisMonth(date)) {
        groups["This Month"].push(conv);
      } else {
        groups["Older"].push(conv);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) delete groups[key];
    });

    return groups;
  }, [conversations, searchQuery]);

  const formatTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else if (isThisWeek(date)) {
      return format(date, "EEEE");
    } else {
      return format(date, "MMM d");
    }
  };

  if (isCollapsed) {
    return (
      <>
        <div className="w-16 h-full bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] flex flex-col">
        {/* Logo Icon */}
        <div className="p-3 border-b border-gray-200 dark:border-white/[0.05]">
          <div className="w-10 h-10 p-0.5 rounded-xl mx-auto" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
            <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="homeGradientCollapsed" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                  </linearGradient>
                </defs>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="url(#homeGradientCollapsed)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="url(#homeGradientCollapsed)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Collapsed Navigation Icons */}
        <div className="p-2 space-y-1 border-b border-gray-200 dark:border-white/[0.05]">
          {/* New Chat */}
          <button
            onClick={onNewConversation}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-600/10 transition-all"
            title="New chat"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="newChatGradientCollapsed" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                  <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                </linearGradient>
              </defs>
              <path d="M12 5v14M5 12h14" stroke="url(#newChatGradientCollapsed)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Chats */}
          {onToggleChats && (
            <button
              onClick={onToggleChats}
              className={`w-full p-2 flex items-center justify-center rounded-lg transition-all ${
                showChats
                  ? "bg-gray-100 dark:bg-[#757575] text-gray-900 dark:text-white"
                  : "hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-600 dark:text-gray-400"
              }`}
              title="Chats"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          )}

          {/* Library */}
          {onToggleArtifacts && (
            <button
              onClick={onToggleArtifacts}
              className={`w-full p-2 flex items-center justify-center rounded-lg transition-all ${
                showArtifacts
                  ? "bg-gray-100 dark:bg-[#757575] text-gray-900 dark:text-white"
                  : "hover:bg-gray-100 dark:hover:bg-white/[0.05] text-gray-600 dark:text-gray-400"
              }`}
              title="Library"
            >
              <Library className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Empty space when collapsed - no conversation icons */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* No conversation icons shown when collapsed */}
        </div>

        {/* Bottom buttons for collapsed sidebar */}
        <div className="p-3 border-t border-gray-200 dark:border-white/[0.05] space-y-1">
          {/* Profile Button */}
          <button
            onClick={() => router.push('/profile')}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
            title="Profile"
          >
            <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => router.push('/settings/organizations')}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Expand Button */}
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all"
            title="Expand sidebar"
          >
            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>
      
      {/* Search Modal for Collapsed Sidebar */}
      <AnimatePresence>
        {showSearchModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSearchModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
            >
              <div className="w-full max-w-3xl bg-white dark:bg-[#212121] rounded-2xl shadow-2xl max-h-[70vh] overflow-hidden pointer-events-auto mx-4">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200 dark:border-white/[0.05]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Chats
                    </h2>
                    <button
                      onClick={() => setShowSearchModal(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                    >
                      <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by title or content..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#616161] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Search Results */}
                <div className="overflow-y-auto max-h-[50vh]">
                  {Object.keys(groupedConversations).length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No conversations found</p>
                    </div>
                  ) : (
                    <div className="p-4">
                      {Object.entries(groupedConversations).map(([group, convs]) => (
                        <div key={group} className="mb-4">
                          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                            {group}
                          </div>
                          {convs.map((conv) => (
                            <button
                              key={conv.id}
                              onClick={() => {
                                onSelectConversation(conv.id);
                                setShowSearchModal(false);
                              }}
                              className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                                currentConversationId === conv.id
                                  ? "bg-gray-100 dark:bg-[#757575]"
                                  : "hover:bg-gray-50 dark:hover:bg-[#757575]/50"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <MessageSquare
                                  className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                    currentConversationId === conv.id
                                      ? "text-gray-900 dark:text-white"
                                      : "text-gray-400"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p
                                      className={`text-sm font-medium truncate ${
                                        currentConversationId === conv.id
                                          ? "text-gray-900 dark:text-white"
                                          : "text-gray-900 dark:text-white"
                                      }`}
                                    >
                                      {conv.title}
                                    </p>
                                    <span className="text-xs text-gray-400 ml-2">
                                      {formatTime(conv.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {conv.lastMessage}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </>
    );
  }

  return (
    <>
      <div className="w-80 h-full bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/[0.05] flex flex-col">
      {/* Header with Logo and New Chat Button */}
      <div className="p-4 border-b border-gray-200 dark:border-white/[0.05] space-y-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 p-0.5 rounded-xl" style={{background: 'linear-gradient(to bottom right, rgb(236, 72, 153), rgb(147, 51, 234))'}}>
            <div className="w-full h-full bg-white/95 dark:bg-[#111111]/95 rounded-[10px] flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="homeGradientExpanded" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                    <stop offset="100%" stopColor="rgb(147, 51, 234)" />
                  </linearGradient>
                </defs>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="url(#homeGradientExpanded)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="9 22 9 12 15 12 15 22" stroke="url(#homeGradientExpanded)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
          <span className="text-xl font-normal bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            blipee
          </span>
        </div>
        
      </div>

      {/* Navigation Links */}
      <div className="p-2 border-b border-gray-200 dark:border-white/[0.05]">
        {/* New Chat Link */}
        <button
          onClick={onNewConversation}
          className="w-full px-3 py-2 rounded-lg hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-600/10 transition-all flex items-center gap-3 text-left group"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="newChatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(236, 72, 153)" />
                <stop offset="100%" stopColor="rgb(147, 51, 234)" />
              </linearGradient>
            </defs>
            <path d="M12 5v14M5 12h14" stroke="url(#newChatGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent font-medium">New chat</span>
        </button>

        {/* Chats Link */}
        {onToggleChats && (
          <button
            onClick={onToggleChats}
            className={`w-full px-3 py-2 rounded-lg transition-all flex items-center gap-3 text-left ${
              showChats
                ? "bg-gray-100 dark:bg-[#757575]"
                : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className={`text-sm ${
              showChats 
                ? "text-gray-900 dark:text-white font-medium" 
                : "text-gray-700 dark:text-gray-300"
            }`}>Chats</span>
          </button>
        )}
        
        {/* Library Link */}
        {onToggleArtifacts && (
          <button
            onClick={onToggleArtifacts}
            className={`w-full px-3 py-2 rounded-lg transition-all flex items-center gap-3 text-left ${
              showArtifacts
                ? "bg-gray-100 dark:bg-[#757575]"
                : "hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            }`}
          >
            <Library className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className={`text-sm ${
              showArtifacts 
                ? "text-gray-900 dark:text-white font-medium" 
                : "text-gray-700 dark:text-gray-300"
            }`}>Library</span>
          </button>
        )}
      </div>

      {/* Recents Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {/* Recents Header */}
          <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            Recents
          </div>
          
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new conversation to begin</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.slice(0, 20).map((conv) => (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative group"
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <button
                    onClick={() => onSelectConversation(conv.id)}
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all ${
                      currentConversationId === conv.id
                        ? "bg-gray-100 dark:bg-[#2a2a2a]"
                        : "hover:bg-gray-50 dark:hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <p className={`text-sm truncate ${
                      currentConversationId === conv.id
                        ? "text-gray-900 dark:text-white font-medium"
                        : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {conv.title}
                    </p>
                  </button>

                  {/* Three dots menu button */}
                  {hoveredId === conv.id && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        data-menu-button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (menuOpenId === conv.id) {
                            setMenuOpenId(null);
                          } else {
                            setMenuOpenId(conv.id);
                          }
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] rounded transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                  )}
                  
                  {/* Dropdown menu */}
                  {menuOpenId === conv.id && (
                    <div 
                      ref={menuRef}
                      className="absolute right-2 top-8 w-40 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.1] py-1 z-50"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle star/pin
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] flex items-center gap-2"
                      >
                        <Pin className="w-4 h-4" />
                        Pin
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle rename
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Rename
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conv.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom buttons for expanded sidebar */}
      <div className="p-3 border-t border-gray-200 dark:border-white/[0.05] space-y-2">
        {/* Profile Button */}
        <button
          onClick={() => router.push('/profile')}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <User className="w-4 h-4" />
          Profile
        </button>

        {/* Settings Button */}
        <button
          onClick={() => router.push('/settings/organizations')}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="w-4 h-4" />
              Dark mode
            </>
          )}
        </button>

        {/* Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.05] transition-all flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="w-4 h-4" />
          Collapse sidebar
        </button>
      </div>
    </div>

    {/* Search Modal */}
    <AnimatePresence>
      {showSearchModal && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSearchModal(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="w-full max-w-3xl bg-white dark:bg-[#212121] rounded-2xl shadow-2xl max-h-[70vh] overflow-hidden pointer-events-auto mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/[0.05]">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Chats
                </h2>
                <button
                  onClick={() => setShowSearchModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/[0.05] rounded-lg transition-all"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by title or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-[#616161] rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Search Results */}
            <div className="overflow-y-auto max-h-[50vh]">
              {Object.keys(groupedConversations).length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations found</p>
                </div>
              ) : (
                <div className="p-4">
                  {Object.entries(groupedConversations).map(([group, convs]) => (
                    <div key={group} className="mb-4">
                      <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {group}
                      </div>
                      {convs.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => {
                            onSelectConversation(conv.id);
                            setShowSearchModal(false);
                          }}
                          className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                            currentConversationId === conv.id
                              ? "bg-gray-100 dark:bg-[#757575]"
                              : "hover:bg-gray-50 dark:hover:bg-[#757575]/50"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <MessageSquare
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                                currentConversationId === conv.id
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-400"
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p
                                  className={`text-sm font-medium truncate ${
                                    currentConversationId === conv.id
                                      ? "text-gray-900 dark:text-white"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {conv.title}
                                </p>
                                <span className="text-xs text-gray-400 ml-2">
                                  {formatTime(conv.timestamp)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {conv.lastMessage}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}