'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Minimize2, Maximize2, MessageCircle, Sparkles } from 'lucide-react';
import { AssistantChat } from './AssistantChat';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

interface FloatingAssistantProps {
  defaultOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left';
}

export function FloatingAssistant({
  defaultOpen = false,
  position = 'bottom-right'
}: FloatingAssistantProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const { session } = useAuth();

  // Don't render if not authenticated
  if (!session) return null;

  // Position classes
  const positionClasses = position === 'bottom-right'
    ? 'bottom-4 right-4 sm:bottom-6 sm:right-6'
    : 'bottom-4 left-4 sm:bottom-6 sm:left-6';

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={cn("fixed z-50", positionClasses)}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsOpen(true)}
              className="relative group"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />

              {/* Button */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl">
                <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-white" />

                {/* Pulse animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />

                {/* Unread indicator */}
                {hasUnread && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-gray-900"
                  >
                    <motion.div
                      className="w-full h-full bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                )}
              </div>

              {/* Tooltip */}
              <motion.div
                initial={{ opacity: 0, x: position === 'bottom-right' ? 10 : -10 }}
                whileHover={{ opacity: 1, x: 0 }}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 whitespace-nowrap",
                  position === 'bottom-right' ? 'right-full mr-3' : 'left-full ml-3'
                )}
              >
                <div className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg shadow-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Ask Blipee Assistant</span>
                  </div>
                </div>
              </motion.div>
            </motion.button>

            {/* Quick actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-3 space-y-2"
            >
              {/* Keyboard shortcut hint */}
              <div className="text-center">
                <kbd className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded border border-gray-700">
                  Cmd+K
                </kbd>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed z-50",
              positionClasses,
              isMinimized ? "w-80" : "w-full sm:w-[420px] lg:w-[480px]",
              "h-[600px] max-h-[80vh]"
            )}
          >
            <div className="h-full bg-gray-900 rounded-2xl shadow-2xl border border-white/[0.05] overflow-hidden flex flex-col">
              {/* Window controls */}
              <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                  title={isMinimized ? "Maximize" : "Minimize"}
                >
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4 text-white/60" />
                  ) : (
                    <Minimize2 className="w-4 h-4 text-white/60" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              {/* Chat interface */}
              {!isMinimized && (
                <AssistantChat
                  className="flex-1"
                  onClose={() => setIsOpen(false)}
                />
              )}

              {/* Minimized view */}
              {isMinimized && (
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">Blipee Assistant</h3>
                      <p className="text-xs text-white/60">Click to expand</p>
                    </div>
                    <MessageCircle className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keyboard shortcut handler */}
      <KeyboardShortcut onTrigger={() => setIsOpen(!isOpen)} />
    </>
  );
}

/**
 * Keyboard shortcut component
 */
function KeyboardShortcut({ onTrigger }: { onTrigger: () => void }) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onTrigger();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTrigger]);

  return null;
}