/**
 * Chat Type Definitions
 * Extends Supabase types with additional chat-specific types
 */

import { Database } from './supabase'

// ============================================
// DATABASE TYPES (from Supabase)
// ============================================

export type Conversation = Database['public']['Tables']['conversations']['Row']
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert']
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update']

export type Message = Database['public']['Tables']['messages']['Row']
export type MessageInsert = Database['public']['Tables']['messages']['Insert']
export type MessageUpdate = Database['public']['Tables']['messages']['Update']

export type MessageRole = Database['public']['Enums']['message_role']
export type ConversationStatus = Database['public']['Enums']['conversation_status']

// ============================================
// EXTENDED TYPES
// ============================================

export interface ConversationWithMessages extends Conversation {
  messages: Message[]
}

export interface MessageWithMetadata extends Message {
  conversation?: Conversation
}

// ============================================
// AGENT TYPES
// ============================================

export type AgentType =
  | 'chief_of_staff'
  | 'compliance_guardian'
  | 'carbon_hunter'
  | 'supply_chain_investigator'
  | 'cost_saving_finder'
  | 'energy_optimizer'
  | 'esg_analyst'
  | 'data_insights_specialist'

export interface AgentConfig {
  id: AgentType
  name: string
  description: string
  color: string
  icon: string
  capabilities: string[]
}

// ============================================
// CHAT MESSAGE TYPES
// ============================================

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
  metadata?: Record<string, any>
  agentType?: AgentType
}

export interface StreamingChunk {
  type: 'text' | 'tool_use' | 'error' | 'done'
  content: string
  metadata?: Record<string, any>
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface SendMessageParams {
  conversationId?: string
  content: string
  agentType?: AgentType
  parentMessageId?: string
  contextType?: string
  contextEntities?: string[]
}

export interface SendMessageResponse {
  conversationId: string
  message: {
    id: string
    role: MessageRole
    content: string
    createdAt: string
  }
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  latencyMs?: number
}

export interface CreateConversationParams {
  title?: string
  agentType?: AgentType
  contextType?: string
  contextEntities?: string[]
  buildingId?: string
}

export interface CreateConversationResponse {
  conversation: Conversation
}

// ============================================
// LLM CONFIG TYPES
// ============================================

export interface LLMConfig {
  model: string
  temperature: number
  maxTokens: number
  topP?: number
  topK?: number
  stopSequences?: string[]
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMCompletionRequest {
  messages: LLMMessage[]
  system?: string
  config?: Partial<LLMConfig>
  stream?: boolean
}

export interface LLMUsage {
  inputTokens: number
  outputTokens: number
  totalTokens: number
  costUsd?: number
}

export interface LLMCompletionResponse {
  content: string
  model: string
  usage: LLMUsage
  finishReason: string
  latencyMs: number
}

// ============================================
// ERROR TYPES
// ============================================

export class ChatError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message)
    this.name = 'ChatError'
  }
}

export class RateLimitError extends ChatError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429)
    this.name = 'RateLimitError'
  }
}

export class AuthenticationError extends ChatError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_REQUIRED', 401)
    this.name = 'AuthenticationError'
  }
}

export class ValidationError extends ChatError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class LLMError extends ChatError {
  constructor(message: string, details?: any) {
    super(message, 'LLM_ERROR', 500, details)
    this.name = 'LLMError'
  }
}
