"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minimize2, Bot } from "lucide-react";
import { SimpleChatInterface } from "./SimpleChatInterface";

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

  // Debug logging
  useEffect(() => {
    console.log('🎯 FloatingChat mounted');
    console.log('  - organizationId:', organizationId);
    console.log('  - isOpen:', isOpen);
    console.log('  - isMinimized:', isMinimized);
    console.log('  - Should show button:', (!isOpen || isMinimized));
  }, [organizationId, isOpen, isMinimized]);

  // Check localStorage to see if we should restore chat state
  useEffect(() => {
    const savedState = localStorage.getItem('blipee-chat-state');
    console.log('💾 localStorage state:', savedState);
    if (savedState) {
      const state = JSON.parse(savedState);
      console.log('📖 Restoring state:', state);
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
      {(!isOpen || isMinimized) && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center text-white group"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
          }}
          data-testid="floating-chat-button"
        >
          <Bot className="w-6 h-6" />

          {/* Notification Badge */}
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            blipee
            {unreadCount > 0 && (
              <span className="ml-2 text-purple-300">
                {unreadCount} new insight{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </button>
      )}

      {/* Floating Chat Window */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[400px] h-[650px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700"
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">blipee</h3>
              </div>
              <div className="flex items-center gap-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={minimizeChat}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeChat}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="h-[calc(100%-56px)] overflow-hidden">
              <SimpleChatInterface
                organizationId={organizationId || ''}
                onNewInsights={handleNewInsights}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
