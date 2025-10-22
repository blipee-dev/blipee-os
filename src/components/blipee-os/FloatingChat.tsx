"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Minimize2, Brain } from "lucide-react";
import { ConversationInterface } from "./ConversationInterface";

interface FloatingChatProps {
  organizationId?: string;
  onNewInsights?: (count: number) => void;
}

/**
 * Floating Chat Component
 *
 * A minimizable chat interface that:
 * - Floats in bottom-right corner
 * - Shows notification badge for unread agent insights
 * - Auto-opens when agents find important insights
 * - Beautiful glass-morphism design
 *
 * ✅ PHASE 4.1: Proactive AI that alerts users
 */
export function FloatingChat({ organizationId, onNewInsights }: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  // Check localStorage to see if we should restore chat state
  useEffect(() => {
    const savedState = localStorage.getItem('blipee-chat-state');
    if (savedState) {
      const state = JSON.parse(savedState);
      setIsOpen(state.isOpen || false);
      setIsMinimized(state.isMinimized || false);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('blipee-chat-state', JSON.stringify({ isOpen, isMinimized }));
  }, [isOpen, isMinimized]);

  // Handle new agent insights (called from parent or polling)
  const handleNewInsights = (count: number, isHighPriority: boolean) => {
    setUnreadCount(prev => prev + count);
    onNewInsights?.(count);

    // Auto-open chat for high-priority insights (only once per session)
    if (isHighPriority && !hasAutoOpened && !isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
      setHasAutoOpened(true);

      // Clear unread count when auto-opening
      setTimeout(() => setUnreadCount(0), 500);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);

    // Clear unread count when opening
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  const closeChat = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {(!isOpen || isMinimized) && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleChat}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center text-white group"
          >
            <MessageSquare className="w-6 h-6" />

            {/* Notification Badge */}
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.div>
              </motion.div>
            )}

            {/* Pulse Effect for New Insights */}
            {unreadCount > 0 && (
              <motion.div
                className="absolute inset-0 rounded-full bg-purple-500"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
              AI Assistant
              {unreadCount > 0 && (
                <span className="ml-2 text-purple-300">
                  {unreadCount} new insight{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[420px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-white">AI Assistant</h3>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={minimizeChat}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4 text-gray-400 hover:text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeChat}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-white" />
                </motion.button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="h-[calc(100%-56px)] overflow-hidden">
              <ConversationInterface
                buildingId={organizationId || ''}
                onNewAgentInsights={handleNewInsights}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
