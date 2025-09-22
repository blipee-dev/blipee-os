/**
 * useBlipeeAssistant Hook
 * React hook for interacting with the Blipee Assistant
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { AssistantResponse, Visualization, Action } from '@/lib/ai/blipee-assistant/types';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';

interface UseBlipeeAssistantOptions {
  conversationId?: string;
  autoInitialize?: boolean;
  onResponse?: (response: AssistantResponse) => void;
  onError?: (error: Error) => void;
}

interface UseBlipeeAssistantReturn {
  // State
  loading: boolean;
  response: AssistantResponse | null;
  error: Error | null;
  conversationId: string | null;
  messages: Message[];

  // Actions
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => Promise<void>;
  exportConversation: () => Promise<any>;
  sendFeedback: (satisfaction: number, feedback?: string) => Promise<void>;

  // UI Helpers
  isTyping: boolean;
  suggestions: string[];
  visualizations: Visualization[];
  actions: Action[];
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export function useBlipeeAssistant(
  options: UseBlipeeAssistantOptions = {}
): UseBlipeeAssistantReturn {
  const { conversationId: initialConversationId, autoInitialize = true, onResponse, onError } = options;

  // State
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [response, setResponse] = useState<AssistantResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // Hooks
  const pathname = usePathname();
  const { session } = useAuth();

  // Initialize conversation on mount if needed
  useEffect(() => {
    if (autoInitialize && !conversationId && session) {
      initializeConversation();
    }
  }, [autoInitialize, session]);

  /**
   * Initialize conversation
   */
  const initializeConversation = async () => {
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Hello',
          action: 'chat'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize conversation');
      }

      const data = await response.json();
      if (data.data?.metadata?.conversationId) {
        setConversationId(data.data.metadata.conversationId);
      }
    } catch (err) {
      console.error('Failed to initialize conversation:', err);
    }
  };

  /**
   * Send message to assistant
   */
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Add user message to history
    const userMessage: Message = {
      id: generateMessageId(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Set loading states
    setLoading(true);
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          pathname,
          action: 'chat'
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const assistantResponse = data.data as AssistantResponse;

        // Add assistant message to history
        const assistantMessage: Message = {
          id: generateMessageId(),
          type: 'assistant',
          content: assistantResponse.message,
          timestamp: new Date(),
          metadata: assistantResponse.metadata
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Update state
        setResponse(assistantResponse);

        // Store conversation ID if not set
        if (!conversationId && assistantResponse.metadata?.conversationId) {
          setConversationId(assistantResponse.metadata.conversationId);
        }

        // Call callback if provided
        if (onResponse) {
          onResponse(assistantResponse);
        }
      }
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') return;

      const error = new Error(err.message || 'Failed to send message');
      setError(error);

      // Call error callback if provided
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  }, [conversationId, pathname, onResponse, onError]);

  /**
   * Clear conversation
   */
  const clearConversation = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'clear'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to clear conversation');
      }

      // Reset state
      setMessages([]);
      setResponse(null);
      setConversationId(null);
      setError(null);

      // Re-initialize if auto-initialize is enabled
      if (autoInitialize) {
        await initializeConversation();
      }
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to clear conversation');
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [conversationId, autoInitialize, onError]);

  /**
   * Export conversation
   */
  const exportConversation = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'export'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to export conversation');
      }

      const data = await response.json();
      return data.data;
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to export conversation');
      setError(error);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }, [conversationId, onError]);

  /**
   * Send feedback
   */
  const sendFeedback = useCallback(async (satisfaction: number, feedback?: string) => {
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          action: 'feedback',
          satisfaction,
          feedback
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }
    } catch (err: any) {
      const error = new Error(err.message || 'Failed to send feedback');
      setError(error);
      if (onError) {
        onError(error);
      }
    }
  }, [conversationId, onError]);

  // Extract UI helpers from response
  const suggestions = response?.suggestions || [];
  const visualizations = response?.visualizations || [];
  const actions = response?.actions || [];

  return {
    // State
    loading,
    response,
    error,
    conversationId,
    messages,

    // Actions
    sendMessage,
    clearConversation,
    exportConversation,
    sendFeedback,

    // UI Helpers
    isTyping,
    suggestions,
    visualizations,
    actions
  };
}

/**
 * Generate unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}