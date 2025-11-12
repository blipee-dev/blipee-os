/**
 * Blipee Chat Hooks
 *
 * React hooks for building chat interfaces with the Blipee AI agents.
 * All hooks use React Query for efficient caching and state management.
 *
 * @example
 * ```tsx
 * import { useChat, useConversations } from '@/hooks'
 *
 * function ChatInterface() {
 *   const { messages, input, handleSubmit } = useChat({ agentType: 'carbon_hunter' })
 *   const { conversations } = useConversations()
 *
 *   return <ChatUI messages={messages} />
 * }
 * ```
 */

// ============================================
// MAIN CHAT HOOKS
// ============================================

/**
 * Main chat interface hook
 * Powers the chat UI with message sending, receiving, and state management
 */
export {
  useChat,
  useLastMessage,
  useIsAssistantTyping,
  useMessageCount,
  type UseChatOptions,
  type UseChatReturn,
} from './useChat'

/**
 * Conversations list management
 * List, filter, create, update, and delete conversations
 */
export {
  useConversations,
  type UseConversationsOptions,
  type ConversationsResponse,
  type CreateConversationInput,
  type UpdateConversationInput,
} from './useConversations'

/**
 * Single conversation details
 * Fetch metadata for a specific conversation
 */
export {
  useConversation,
  type UseConversationOptions,
} from './useConversation'

/**
 * Message history management
 * Fetch and paginate through conversation messages
 */
export {
  useMessages,
  useInfiniteMessages,
  useLatestMessages,
  useMessageStats,
  type UseMessagesOptions,
  type MessagesResponse,
} from './useMessages'

// ============================================
// USAGE GUIDE
// ============================================

/**
 * Quick Start Guide
 * ==================
 *
 * 1. Basic Chat Interface
 * ```tsx
 * import { useChat } from '@/hooks'
 *
 * function ChatPage() {
 *   const { messages, input, handleSubmit, isLoading } = useChat({
 *     agentType: 'carbon_hunter'
 *   })
 *
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <MessageList messages={messages} />
 *       <input value={input} onChange={handleInputChange} />
 *       <button disabled={isLoading}>Send</button>
 *     </form>
 *   )
 * }
 * ```
 *
 * 2. Conversations Sidebar
 * ```tsx
 * import { useConversations } from '@/hooks'
 *
 * function ConversationsSidebar() {
 *   const { conversations, isLoading, createConversation } = useConversations({
 *     agentType: 'carbon_hunter'
 *   })
 *
 *   return (
 *     <div>
 *       <button onClick={() => createConversation({ title: 'New Chat' })}>
 *         New Conversation
 *       </button>
 *       {conversations.map(conv => (
 *         <ConversationItem key={conv.id} conversation={conv} />
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 *
 * 3. Message History with Infinite Scroll
 * ```tsx
 * import { useInfiniteMessages } from '@/hooks'
 *
 * function MessageHistory({ conversationId }) {
 *   const { messages, loadMore, hasMore, isLoadingMore } = useInfiniteMessages({
 *     conversationId
 *   })
 *
 *   return (
 *     <div>
 *       {hasMore && (
 *         <button onClick={() => loadMore()}>
 *           {isLoadingMore ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *       <MessageList messages={messages} />
 *     </div>
 *   )
 * }
 * ```
 *
 * 4. Complete Chat App
 * ```tsx
 * import { useChat, useConversations } from '@/hooks'
 *
 * function ChatApp() {
 *   const [selectedId, setSelectedId] = useState<string>()
 *   const { conversations } = useConversations()
 *
 *   const { messages, input, handleSubmit, setConversationId } = useChat({
 *     conversationId: selectedId,
 *     agentType: 'chief_of_staff'
 *   })
 *
 *   useEffect(() => {
 *     if (selectedId) setConversationId(selectedId)
 *   }, [selectedId])
 *
 *   return (
 *     <div className="flex">
 *       <ConversationsSidebar
 *         conversations={conversations}
 *         onSelect={setSelectedId}
 *       />
 *       <ChatInterface
 *         messages={messages}
 *         input={input}
 *         onSubmit={handleSubmit}
 *       />
 *     </div>
 *   )
 * }
 * ```
 */
