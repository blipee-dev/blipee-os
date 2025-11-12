/**
 * useConversation Hook
 *
 * Fetch and manage a single conversation's details.
 * Uses React Query for efficient caching.
 *
 * Features:
 * - Fetch conversation metadata
 * - Real-time updates
 * - Caching
 * - Error handling
 *
 * @example
 * ```tsx
 * const { conversation, isLoading } = useConversation('conversation-id')
 * ```
 */

import { useQuery } from '@tanstack/react-query'
import type { Conversation } from '@/types/chat'

// ============================================
// TYPES
// ============================================

export interface UseConversationOptions {
  conversationId: string | undefined
  enabled?: boolean
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchConversation(conversationId: string): Promise<Conversation> {
  const response = await fetch(`/api/conversations/${conversationId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch conversation')
  }

  const data = await response.json()
  return data.conversation
}

// ============================================
// HOOK
// ============================================

export function useConversation(options: UseConversationOptions | string) {
  // Support both object and string arguments
  const { conversationId, enabled = true } =
    typeof options === 'string' ? { conversationId: options, enabled: true } : options

  const {
    data: conversation,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => fetchConversation(conversationId!),
    enabled: enabled && !!conversationId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    conversation,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  }
}
