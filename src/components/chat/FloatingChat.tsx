'use client';

/**
 * Floating Chat Widget
 *
 * A floating chat button that opens a modal with the AI chat interface
 * Similar to Intercom, Drift, etc.
 */

import { useState, useEffect } from 'react';
import { X, MessageCircle, Minimize2 } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import type { SustainabilityAgentMessage } from '@/lib/ai/agents';

interface FloatingChatProps {
  conversationId: string;
  organizationId: string;
  buildingId?: string;
  initialMessages?: SustainabilityAgentMessage[];
}

export function FloatingChat({
  conversationId,
  organizationId,
  buildingId,
  initialMessages
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-pink-500 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
            Ask Blipee AI
          </span>
        </button>
      )}

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden transition-all duration-300"
          style={{
            width: isMinimized ? '400px' : '450px',
            height: isMinimized ? '60px' : '750px',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Blipee AI</h3>
                <p className="text-xs text-white/80">Your sustainability assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label={isMinimized ? 'Maximize' : 'Minimize'}
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <div className="flex-1 overflow-hidden">
              <ChatInterface
                conversationId={conversationId}
                organizationId={organizationId}
                buildingId={buildingId}
                initialMessages={initialMessages}
                className="h-full"
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
