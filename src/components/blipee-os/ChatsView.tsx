"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  Search,
  Calendar,
  Trash2,
  Edit2,
  ArrowLeft,
  Clock,
  X,
  Check,
  MoreHorizontal,
  Pin,
  Edit3,
} from "lucide-react";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";

interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatsViewProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onBack: () => void;
  onNewConversation: () => void;
  currentConversationId?: string;
}

export function ChatsView({
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onBack,
  onNewConversation,
  currentConversationId,
}: ChatsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Get the target element
      const target = event.target as HTMLElement;
      
      // Check if the click is on the menu itself
      if (menuRef.current && menuRef.current.contains(target)) {
        return;
      }
      
      // Check if the click is on a three dots button
      if (target.closest('[data-menu-button]')) {
        return;
      }
      
      // Otherwise close the menu
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

  return (
    <div className="flex h-full w-full bg-white dark:bg-[#212121]">
      <div className="flex-1 flex flex-col w-full">
        {/* Content Container */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-normal text-gray-900 dark:text-gray-100">
                  Your chat history
                </h1>
                <button
                  onClick={onNewConversation}
                  className="px-4 py-2 bg-white dark:bg-[#2a2a2a] hover:bg-gray-50 dark:hover:bg-[#3a3a3a] border border-gray-300 dark:border-white/[0.2] rounded-lg transition-all text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New chat
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#2a2a2a] dark:bg-[#2a2a2a] rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/[0.1]"
                />
              </div>

              {/* Selection mode indicator */}
              {isSelectionMode && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm">
                      <div className="w-4 h-4 bg-white/20 rounded flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="font-medium">{selectedIds.size} selected</span>
                    </div>
                    <button
                      onClick={() => {
                        selectedIds.forEach(id => onDeleteConversation(id));
                        setSelectedIds(new Set());
                        setIsSelectionMode(false);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded-lg transition-colors"
                      title="Delete selected"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedIds(new Set());
                      setIsSelectionMode(false);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] rounded-lg transition-colors"
                    title="Cancel selection"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Conversations List */}
            {Object.keys(groupedConversations).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <MessageSquare className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg">No conversations found</p>
                <p className="text-sm mt-2">Start a new conversation to begin</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(groupedConversations).map(([group, convs]) => (
                  <div key={group}>
                    {convs.map((conv) => (
                      <motion.div
                        key={conv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative group flex items-center gap-3"
                        onMouseEnter={() => setHoveredId(conv.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        {/* Checkbox that appears only in selection mode */}
                        {isSelectionMode && (
                          <div className="flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const newSelected = new Set(selectedIds);
                                if (newSelected.has(conv.id)) {
                                  newSelected.delete(conv.id);
                                  if (newSelected.size === 0) {
                                    setIsSelectionMode(false);
                                  }
                                } else {
                                  newSelected.add(conv.id);
                                }
                                setSelectedIds(newSelected);
                              }}
                              className="p-1"
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                  selectedIds.has(conv.id)
                                    ? "bg-blue-500 border-blue-500"
                                    : "border-gray-400 dark:border-gray-500 bg-transparent hover:border-gray-500 dark:hover:border-gray-400"
                                }`}
                              >
                                {selectedIds.has(conv.id) && (
                                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                )}
                              </div>
                            </button>
                          </div>
                        )}

                        {/* Conversation card */}
                        <div
                          onClick={() => {
                            if (isSelectionMode) {
                              // In selection mode, toggle selection
                              const newSelected = new Set(selectedIds);
                              if (newSelected.has(conv.id)) {
                                newSelected.delete(conv.id);
                                if (newSelected.size === 0) {
                                  setIsSelectionMode(false);
                                }
                              } else {
                                newSelected.add(conv.id);
                              }
                              setSelectedIds(newSelected);
                            } else {
                              // Normal mode - open conversation
                              onSelectConversation(conv.id);
                            }
                          }}
                          onContextMenu={(e) => {
                            // Right-click also enters selection mode
                            e.preventDefault();
                            if (!isSelectionMode) {
                              setIsSelectionMode(true);
                              setSelectedIds(new Set([conv.id]));
                            }
                          }}
                          className={`flex-1 p-4 rounded-xl text-left transition-all border cursor-pointer flex items-start gap-3 ${
                            selectedIds.has(conv.id)
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700/50"
                              : currentConversationId === conv.id
                              ? "bg-gray-100 dark:bg-[#2a2a2a] border-gray-200 dark:border-white/[0.15]"
                              : "bg-transparent hover:bg-gray-50 dark:hover:bg-[#2a2a2a] border-gray-200 dark:border-white/[0.1] hover:border-gray-300 dark:hover:border-white/[0.2]"
                          }`}
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1 truncate">
                              {conv.title}
                            </h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last message {formatTime(conv.timestamp)}
                            </p>
                          </div>

                          {/* Three dots menu button */}
                          {hoveredId === conv.id && !isSelectionMode && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <button
                                data-menu-button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Toggle menu - close if already open, open if closed
                                  if (menuOpenId === conv.id) {
                                    setMenuOpenId(null);
                                  } else {
                                    setMenuOpenId(conv.id);
                                  }
                                }}
                                className="p-1.5 hover:bg-gray-200 dark:hover:bg-[#3a3a3a] rounded-lg transition-colors"
                              >
                                <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              </button>
                            </div>
                          )}
                          
                          {/* Dropdown menu - positioned outside */}
                          {menuOpenId === conv.id && (
                            <div 
                              ref={menuRef}
                              className="absolute right-3 top-12 w-48 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-lg border border-gray-200 dark:border-white/[0.1] py-1 z-50"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsSelectionMode(true);
                                  setSelectedIds(new Set([conv.id]));
                                  setMenuOpenId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] flex items-center gap-3"
                              >
                                <Check className="w-4 h-4" />
                                Select
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Handle pin/unpin
                                  setMenuOpenId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] flex items-center gap-3"
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
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] flex items-center gap-3"
                              >
                                <Edit3 className="w-4 h-4" />
                                Rename
                              </button>
                              <div className="border-t border-gray-200 dark:border-white/[0.1] my-1" />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteConversation(conv.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-[#3a3a3a] flex items-center gap-3"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}