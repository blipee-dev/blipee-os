"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, Mic, MicOff, Image as ImageIcon } from "lucide-react";
import { Message } from "@/types/conversation";
import { useAPIClient } from "@/lib/api/client";
import { useCSRF } from "@/hooks/use-csrf";
import { useAuth } from "@/lib/auth/context";

interface SimpleChatInterfaceProps {
  organizationId?: string;
  onNewInsights?: (count: number, isHighPriority: boolean) => void;
}

/**
 * Simple Chat Interface - ChatGPT-like mobile experience
 * Clean, minimal, focused on conversation
 */
export function SimpleChatInterface({ organizationId, onNewInsights }: SimpleChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [conversationId] = useState(() => `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const apiClient = useAPIClient();
  const { headers: csrfHeaders } = useCSRF();
  const { session } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hey! What would you like to know about your sustainability performance?",
          timestamp: new Date(),
        }
      ]);
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingStatus("⏳ Connecting to blipee...");

    try {
      // TODO: Convert to image base64 if image is selected
      let imageData = null;
      if (selectedImage) {
        const reader = new FileReader();
        imageData = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(selectedImage);
        });
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId,
          buildingContext: organizationId ? {
            id: organizationId,
            organizationId: organizationId,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.content || errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      // ✅ REVOLUTIONARY: Replay streaming updates if available
      if (data.blipee?.streamingUpdates && data.blipee.streamingUpdates.length > 0) {
        // Replay each streaming update with realistic delays
        for (const update of data.blipee.streamingUpdates) {
          setStreamingStatus(update.message);
          // Wait a bit between updates to show progression
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Sorry, I could not process that.',
        timestamp: new Date(),
        // Include charts and insights from blipee brain
        charts: data.blipee?.charts || [],
        insights: data.blipee?.insights || [],
        recommendations: data.blipee?.recommendations || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamingStatus("");
      setSelectedImage(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1a1a1a]">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">blipee</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>

                {/* Render charts generated by LLM */}
                {message.charts && message.charts.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {message.charts.map((chart, i) => (
                      <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                        <h5 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">{chart.title}</h5>
                        <div className="h-40 flex items-center justify-center text-xs text-gray-500">
                          {chart.type === 'line' && '📈 Line Chart'}
                          {chart.type === 'bar' && '📊 Bar Chart'}
                          {chart.type === 'pie' && '🥧 Pie Chart'}
                          {chart.type === 'area' && '📉 Area Chart'}
                          <span className="ml-2">[Rendering {chart.type}]</span>
                        </div>
                        {chart.insights && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                            💡 {chart.insights}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Render insights */}
                {message.insights && message.insights.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {message.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                        <span className="text-purple-500">•</span>
                        <span>{insight}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Recommendations:</p>
                    <div className="space-y-1">
                      {message.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <span className="text-green-500">✓</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading indicator with streaming status */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 max-w-[80%]">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {streamingStatus || "Thinking..."}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        {/* Image preview */}
        {selectedImage && (
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <ImageIcon className="w-4 h-4" />
            <span>{selectedImage.name}</span>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-red-500 hover:text-red-600 ml-auto"
            >
              Remove
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Voice input button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleVoiceInput}
            disabled={isLoading}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </motion.button>

          {/* Image upload button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-colors bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
            title="Upload image"
          >
            <ImageIcon className="w-5 h-5" />
          </motion.button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message blipee..."
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              style={{
                minHeight: '44px',
                maxHeight: '120px',
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              input.trim() && !isLoading
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
