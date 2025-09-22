'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ThumbsUp,
  ThumbsDown,
  Download,
  RefreshCw,
  Loader2,
  ChevronDown,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  BarChart3,
  FileText,
  Zap
} from 'lucide-react';
import { useBlipeeAssistant } from '@/hooks/useBlipeeAssistant';
import { cn } from '@/lib/utils';

interface AssistantChatProps {
  className?: string;
  conversationId?: string;
  onClose?: () => void;
}

export function AssistantChat({ className, conversationId, onClose }: AssistantChatProps) {
  const [input, setInput] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    loading,
    messages,
    isTyping,
    suggestions,
    visualizations,
    actions,
    sendMessage,
    clearConversation,
    exportConversation,
    sendFeedback,
    error
  } = useBlipeeAssistant({ conversationId });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const message = input;
    setInput('');
    await sendMessage(message);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  // Handle feedback
  const handleFeedback = async (satisfaction: number) => {
    await sendFeedback(satisfaction);
    setShowFeedback(false);
  };

  // Handle export
  const handleExport = async () => {
    const data = await exportConversation();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${Date.now()}.json`;
      a.click();
    }
  };

  // Get icon for intent
  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'analysis': return <BarChart3 className="w-4 h-4" />;
      case 'compliance_check': return <CheckCircle className="w-4 h-4" />;
      case 'optimization': return <Zap className="w-4 h-4" />;
      case 'reporting': return <FileText className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-gradient-to-b from-gray-900 via-gray-900 to-black",
      className
    )}>
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/[0.02] border-b border-white/[0.05] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Blipee Assistant</h2>
              <p className="text-xs text-white/60">Your AI Sustainability Advisor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              title="Export conversation"
            >
              <Download className="w-4 h-4 text-white/60" />
            </button>
            <button
              onClick={clearConversation}
              className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              title="Clear conversation"
            >
              <RefreshCw className="w-4 h-4 text-white/60" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        <AnimatePresence>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                How can I help you today?
              </h3>
              <p className="text-sm text-white/60 max-w-sm mx-auto">
                Ask me about emissions, compliance, reports, or any sustainability topic.
              </p>
            </motion.div>
          )}

          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "flex gap-3",
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-3",
                  message.type === 'user'
                    ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30"
                    : "backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]"
                )}
              >
                <p className="text-sm text-white whitespace-pre-wrap">
                  {message.content}
                </p>

                {/* Metadata for assistant messages */}
                {message.type === 'assistant' && message.metadata && (
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center gap-4 text-xs text-white/40">
                    <div className="flex items-center gap-1">
                      {getIntentIcon(message.metadata.intent?.primary)}
                      <span>{message.metadata.intent?.primary}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>Confidence: {Math.round((message.metadata.confidence || 0) * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{message.metadata.responseTime}ms</span>
                    </div>
                  </div>
                )}
              </div>

              {message.type === 'user' && (
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-purple-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-purple-400 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-purple-400 rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          >
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-400">{error.message}</p>
          </motion.div>
        )}

        {/* Actions */}
        {actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-2"
          >
            {actions.map(action => (
              <button
                key={action.id}
                onClick={() => {/* Handle action */}}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  action.type === 'primary'
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:opacity-90"
                    : action.type === 'danger'
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                    : "bg-white/[0.05] text-white/80 border border-white/[0.1] hover:bg-white/[0.08]"
                )}
              >
                {action.label}
              </button>
            ))}
          </motion.div>
        )}

        {/* Visualizations placeholder */}
        {visualizations.length > 0 && (
          <div className="space-y-3">
            {visualizations.map((viz, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.05] rounded-xl p-4"
              >
                <p className="text-xs text-white/60 mb-2">
                  {viz.type === 'chart' ? '📊 Chart' : viz.type === 'table' ? '📋 Table' : '📈 Metric'}
                </p>
                <div className="h-32 bg-white/[0.02] rounded-lg flex items-center justify-center">
                  <span className="text-white/40 text-sm">
                    Visualization: {viz.config?.title || viz.type}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-6 py-3 border-t border-white/[0.05]">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] rounded-full text-xs text-white/70 whitespace-nowrap transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/[0.05]">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask me anything about sustainability..."
              className="w-full px-4 py-3 pr-12 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-purple-500/50 transition-colors"
              rows={1}
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 bottom-2.5 p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}