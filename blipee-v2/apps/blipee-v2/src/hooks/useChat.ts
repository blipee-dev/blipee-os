/**
 * useChat Hook - Powered by Vercel AI SDK
 *
 * Main chat interface hook that connects UI to backend API.
 * Uses Vercel AI SDK's native useChat with custom configuration.
 *
 * Features:
 * - Send messages and receive AI responses
 * - Optimistic UI updates
 * - Automatic message history
 * - Error handling and retry
 * - Loading states
 * - Agent type selection
 * - Context awareness (building, organization)
 *
 * @example
 * ```tsx
 * const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
 *   conversationId: 'uuid',
 *   agentType: 'carbon_hunter',
 * })
 * ```
 */

import { useChat as useVercelChat } from 'ai/react'
import { useState, useCallback } from 'react'
import type { AgentType } from '@/types/chat'

// ============================================
// TYPES
// ============================================

export interface UseChatOptions {
  conversationId?: string
  agentType?: AgentType
  contextType?: string
  contextEntities?: string[]
  buildingId?: string
  initialMessages?: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
  }>
  onSuccess?: (response: any) => void
  onError?: (error: Error) => void
}

export interface UseChatReturn {
  // Messages
  messages: Array<{
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    createdAt?: Date
  }>

  // Input state
  input: string
  setInput: (input: string) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void

  // Submit
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  append: (message: { role: 'user' | 'assistant'; content: string }) => void

  // Loading states
  isLoading: boolean

  // Error handling
  error: Error | undefined
  reload: () => void
  stop: () => void

  // Conversation metadata
  conversationId: string | undefined
  setConversationId: (id: string) => void

  // Agent configuration
  agentType: AgentType
  setAgentType: (type: AgentType) => void
}

// ============================================
// HOOK
// ============================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    conversationId: initialConversationId,
    agentType: initialAgentType = 'chief_of_staff',
    contextType,
    contextEntities,
    buildingId,
    initialMessages = [],
    onSuccess,
    onError,
  } = options

  // Local state
  const [conversationId, setConversationId] = useState<string | undefined>(
    initialConversationId
  )
  const [agentType, setAgentType] = useState<AgentType>(initialAgentType)

  // Use Vercel AI SDK's native useChat hook
  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit: originalHandleSubmit,
    append,
    isLoading,
    error,
    reload,
    stop,
  } = useVercelChat({
    api: '/api/chat/completions',
    id: conversationId, // Maps to conversationId in our backend
    initialMessages,
    body: {
      // These will be sent with every request
      agentType,
      contextType,
      contextEntities,
      buildingId,
    },
    onResponse: (response) => {
      // Extract conversationId from response headers if it's a new conversation
      const newConversationId = response.headers.get('X-Conversation-Id')
      if (newConversationId && !conversationId) {
        setConversationId(newConversationId)
      }
    },
    onFinish: (message) => {
      if (onSuccess) {
        onSuccess({
          message,
          conversationId,
        })
      }
    },
    onError: (error) => {
      console.error('[useChat] Error:', error)
      if (onError) {
        onError(error)
      }
    },
  })

  // Wrap handleSubmit to ensure conversationId is included
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      // Add conversationId to the request if it exists
      if (conversationId) {
        // Vercel AI SDK will automatically include it via the `id` prop
      }

      originalHandleSubmit(e)
    },
    [originalHandleSubmit, conversationId]
  )

  return {
    // Messages
    messages,

    // Input
    input,
    setInput,
    handleInputChange,

    // Submit
    handleSubmit,
    append,

    // Loading
    isLoading,

    // Error handling
    error,
    reload,
    stop,

    // Metadata
    conversationId,
    setConversationId,

    // Agent config
    agentType,
    setAgentType,
  }
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook for getting the last message
 */
export function useLastMessage(messages: UseChatReturn['messages']) {
  return messages[messages.length - 1]
}

/**
 * Hook for checking if assistant is typing
 */
export function useIsAssistantTyping(messages: UseChatReturn['messages'], isLoading: boolean) {
  const lastMessage = useLastMessage(messages)
  return isLoading && lastMessage?.role !== 'assistant'
}

/**
 * Hook for getting message count
 */
export function useMessageCount(messages: UseChatReturn['messages']) {
  return {
    total: messages.length,
    user: messages.filter((m) => m.role === 'user').length,
    assistant: messages.filter((m) => m.role === 'assistant').length,
  }
}
