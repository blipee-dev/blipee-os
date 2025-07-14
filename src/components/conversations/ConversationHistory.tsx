"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Plus, Clock, ChevronRight } from "lucide-react";
import {
  conversationService,
  type ConversationRow,
} from "@/lib/conversations/service";
import { formatDistanceToNow } from "date-fns";

interface ConversationHistoryProps {
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationHistory({
  currentConversationId,
  onSelectConversation,
  onNewConversation,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoading(true);
    const data = await conversationService.getUserConversations();
    setConversations(data);
    setIsLoading(false);
  };

  const getConversationTitle = (conversation: ConversationRow) => {
    const messages = conversation.messages as any[];
    if (!messages || messages.length === 0) return "New conversation";

    // Find first user message
    const firstUserMessage = messages.find((m) => m.role === "user");
    if (firstUserMessage) {
      return (
        firstUserMessage.content.substring(0, 30) +
        (firstUserMessage.content.length > 30 ? "..." : "")
      );
    }

    return "New conversation";
  };

  return (
    <div className="w-80 h-full bg-black/20 backdrop-blur-xl border-r border-white/[0.05] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.05]">
        <button
          onClick={onNewConversation}
          className="w-full px-4 py-3 rounded-xl
                   bg-gradient-to-r from-purple-500/20 to-blue-500/20
                   border border-white/[0.1] backdrop-blur-xl
                   hover:from-purple-500/30 hover:to-blue-500/30
                   hover:border-white/[0.2]
                   transition-all duration-300
                   flex items-center justify-center gap-2
                   group"
        >
          <Plus className="w-4 h-4 text-white/80 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-white/90 font-medium">New Conversation</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            No conversations yet
          </div>
        ) : (
          <AnimatePresence>
            {conversations.map((conversation, index) => (
              <motion.button
                key={conversation.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onSelectConversation(conversation.id)}
                className={`
                  w-full px-3 py-3 rounded-lg text-left
                  transition-all duration-200
                  group relative overflow-hidden
                  ${
                    currentConversationId === conversation.id
                      ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-white/[0.1]"
                      : "hover:bg-white/[0.02] hover:border hover:border-white/[0.05]"
                  }
                `}
              >
                {/* Glow effect for active conversation */}
                {currentConversationId === conversation.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 blur-xl" />
                )}

                <div className="relative z-10 flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 truncate">
                      {getConversationTitle(conversation)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-white/30" />
                      <p className="text-xs text-white/40">
                        {formatDistanceToNow(
                          new Date(conversation.updated_at),
                          { addSuffix: true },
                        )}
                      </p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`
                    w-4 h-4 text-white/30 
                    transform transition-all duration-200
                    ${currentConversationId === conversation.id ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"}
                  `}
                  />
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.05] text-center">
        <p className="text-xs text-white/30">
          Conversations are saved automatically
        </p>
      </div>
    </div>
  );
}
