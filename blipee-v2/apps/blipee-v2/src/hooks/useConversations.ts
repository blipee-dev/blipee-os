/**
 * useConversations Hook
 *
 * Manage conversations list with pagination, filtering, and caching.
 * Uses React Query for efficient data fetching and caching.
 *
 * Features:
 * - List conversations with pagination
 * - Filter by agent type, archived status
 * - Search conversations
 * - Create new conversations
 * - Update conversation metadata
 * - Delete (soft delete) conversations
 * - Optimistic updates
 * - Automatic refetching
 *
 * @example
 * ```tsx
 * const { conversations, isLoading, createConversation } = useConversations({
 *   agentType: 'carbon_hunter',
 * })
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { AgentType, Conversation } from '@/types/chat'

// ============================================
// TYPES
// ============================================

export interface UseConversationsOptions {
  limit?: number
  offset?: number
  archived?: boolean
  agentType?: AgentType
  search?: string
  enabled?: boolean // For conditional fetching
}

export interface ConversationsResponse {
  conversations: Conversation[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface CreateConversationInput {
  title?: string
  agentType?: AgentType
  contextType?: string
  contextEntities?: string[]
  buildingId?: string
}

export interface UpdateConversationInput {
  title?: string
  is_archived?: boolean
  is_pinned?: boolean
  summary?: string
  tags?: string[]
}

// ============================================
// API FUNCTIONS
// ============================================

async function fetchConversations(
  options: UseConversationsOptions
): Promise<ConversationsResponse> {
  const params = new URLSearchParams()

  if (options.limit) params.set('limit', options.limit.toString())
  if (options.offset) params.set('offset', options.offset.toString())
  if (options.archived !== undefined) params.set('archived', options.archived.toString())
  if (options.agentType) params.set('agentType', options.agentType)
  if (options.search) params.set('search', options.search)

  const response = await fetch(`/api/conversations?${params.toString()}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch conversations')
  }

  return response.json()
}

async function createConversation(input: CreateConversationInput): Promise<Conversation> {
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create conversation')
  }

  const data = await response.json()
  return data.conversation
}

async function updateConversation(
  id: string,
  input: UpdateConversationInput
): Promise<Conversation> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update conversation')
  }

  const data = await response.json()
  return data.conversation
}

async function deleteConversation(id: string): Promise<void> {
  const response = await fetch(`/api/conversations/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete conversation')
  }
}

// ============================================
// HOOK
// ============================================

export function useConversations(options: UseConversationsOptions = {}) {
  const queryClient = useQueryClient()

  const {
    limit = 50,
    offset = 0,
    archived = false,
    agentType,
    search,
    enabled = true,
  } = options

  // Query key for caching
  const queryKey = ['conversations', { limit, offset, archived, agentType, search }]

  // Fetch conversations
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: () => fetchConversations({ limit, offset, archived, agentType, search }),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  })

  // Create conversation mutation
  const createMutation = useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      // Invalidate conversations list to refetch
      queryClient.invalidateQueries({ queryKey: ['conversations'] })

      // Optionally add to cache optimistically
      queryClient.setQueryData<ConversationsResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          conversations: [newConversation, ...old.conversations],
          pagination: {
            ...old.pagination,
            total: old.pagination.total + 1,
          },
        }
      })
    },
  })

  // Update conversation mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConversationInput }) =>
      updateConversation(id, data),
    onSuccess: (updatedConversation) => {
      // Update in cache
      queryClient.setQueryData<ConversationsResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          conversations: old.conversations.map((conv) =>
            conv.id === updatedConversation.id ? updatedConversation : conv
          ),
        }
      })

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // Delete conversation mutation
  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onMutate: async (conversationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousConversations = queryClient.getQueryData<ConversationsResponse>(queryKey)

      // Optimistically remove from cache
      queryClient.setQueryData<ConversationsResponse>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          conversations: old.conversations.filter((conv) => conv.id !== conversationId),
          pagination: {
            ...old.pagination,
            total: old.pagination.total - 1,
          },
        }
      })

      return { previousConversations }
    },
    onError: (err, conversationId, context) => {
      // Rollback on error
      if (context?.previousConversations) {
        queryClient.setQueryData(queryKey, context.previousConversations)
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })

  // Wrapper functions
  const create = useCallback(
    (input: CreateConversationInput) => createMutation.mutateAsync(input),
    [createMutation]
  )

  const update = useCallback(
    (id: string, input: UpdateConversationInput) =>
      updateMutation.mutateAsync({ id, data: input }),
    [updateMutation]
  )

  const remove = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation]
  )

  return {
    // Data
    conversations: data?.conversations ?? [],
    pagination: data?.pagination,

    // Loading states
    isLoading,
    isFetching,
    isError,
    error,

    // Actions
    refetch,
    createConversation: create,
    updateConversation: update,
    deleteConversation: remove,

    // Mutation states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
