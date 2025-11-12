/**
 * useMessages Hook
 *
 * Fetch conversation message history with pagination.
 * Uses React Query for efficient caching and infinite scroll support.
 *
 * Features:
 * - Fetch message history
 * - Pagination (before/after)
 * - Infinite scroll support
 * - Real-time updates
 * - Caching
 *
 * @example
 * ```tsx
 * const { messages, isLoading, loadMore } = useMessages('conversation-id')
 * ```
 */

import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { Message } from '@/types/chat'

// ============================================
// TYPES
// ============================================

export interface UseMessagesOptions {
  conversationId: string | undefined
  limit?: number
  enabled?: boolean
}

export interface MessagesResponse {
  messages: Message[]
  pagination: {
    total: number
    limit: number
    hasMore: boolean
  }
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchMessages(
  conversationId: string,
  limit: number = 50
): Promise<MessagesResponse> {
  const params = new URLSearchParams()
  params.set('limit', limit.toString())

  const response = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch messages')
  }

  return response.json()
}

async function fetchMessagesBefore(
  conversationId: string,
  beforeMessageId: string,
  limit: number = 50
): Promise<MessagesResponse> {
  const params = new URLSearchParams()
  params.set('limit', limit.toString())
  params.set('before', beforeMessageId)

  const response = await fetch(`/api/conversations/${conversationId}/messages?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch messages')
  }

  return response.json()
}

// ============================================
// HOOK - Simple Version
// ============================================

/**
 * Simple useMessages hook for fetching all messages
 * Good for conversations with < 100 messages
 */
export function useMessages(options: UseMessagesOptions | string) {
  // Support both object and string arguments
  const { conversationId, limit = 50, enabled = true } =
    typeof options === 'string' ? { conversationId: options, limit: 50, enabled: true } : options

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['messages', conversationId, limit],
    queryFn: () => fetchMessages(conversationId!, limit),
    enabled: enabled && !!conversationId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    messages: data?.messages ?? [],
    pagination: data?.pagination,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  }
}

// ============================================
// HOOK - Infinite Scroll Version
// ============================================

/**
 * Infinite scroll version for large conversations
 * Loads messages in chunks as user scrolls up
 */
export function useInfiniteMessages(options: UseMessagesOptions) {
  const { conversationId, limit = 50, enabled = true } = options

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId, 'infinite', limit],
    queryFn: async ({ pageParam }) => {
      if (pageParam) {
        return fetchMessagesBefore(conversationId!, pageParam, limit)
      }
      return fetchMessages(conversationId!, limit)
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Return the first message ID to fetch messages before it
      if (lastPage.pagination.hasMore && lastPage.messages.length > 0) {
        return lastPage.messages[0].id
      }
      return undefined
    },
    enabled: enabled && !!conversationId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Flatten all pages into single messages array
  const messages = data?.pages.flatMap((page) => page.messages) ?? []

  return {
    messages,
    loadMore: fetchNextPage,
    hasMore: hasNextPage,
    isLoadingMore: isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  }
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Get the latest N messages from a conversation
 */
export function useLatestMessages(conversationId: string | undefined, count: number = 10) {
  const { messages, ...rest } = useMessages({
    conversationId,
    limit: count,
    enabled: !!conversationId,
  })

  return {
    messages: messages.slice(-count),
    ...rest,
  }
}

/**
 * Get message statistics
 */
export function useMessageStats(conversationId: string | undefined) {
  const { messages, isLoading } = useMessages({
    conversationId,
    limit: 1000, // Get all for stats (consider backend aggregation for large conversations)
    enabled: !!conversationId,
  })

  const stats = {
    total: messages.length,
    user: messages.filter((m) => m.role === 'user').length,
    assistant: messages.filter((m) => m.role === 'assistant').length,
    avgLength: messages.reduce((acc, m) => acc + m.content.length, 0) / (messages.length || 1),
  }

  return {
    stats,
    isLoading,
  }
}
