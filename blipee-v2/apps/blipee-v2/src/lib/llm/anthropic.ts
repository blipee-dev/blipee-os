/**
 * Anthropic Claude SDK Client
 * Handles all communication with Claude API
 *
 * Features:
 * - Singleton pattern for client reuse
 * - Streaming support
 * - Token counting
 * - Cost calculation
 * - Error handling
 */

import Anthropic from '@anthropic-ai/sdk'
import type {
  Message,
  MessageCreateParams,
  MessageStreamEvent,
} from '@anthropic-ai/sdk/resources/messages'
import { LLMError } from '@/types/chat'

// ============================================
// CONFIGURATION
// ============================================

const ANTHROPIC_CONFIG = {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
  maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
  temperature: Number(process.env.ANTHROPIC_TEMPERATURE) || 0.7,
} as const

// Pricing per 1M tokens (as of Jan 2025)
const PRICING = {
  'claude-sonnet-4-5': {
    input: 3.0, // $3 per 1M input tokens
    output: 15.0, // $15 per 1M output tokens
  },
  'claude-sonnet-4-5-20250929': {
    input: 3.0,
    output: 15.0,
  },
  'claude-haiku-4-5': {
    input: 0.8,
    output: 4.0,
  },
  'claude-opus-4-1': {
    input: 15.0,
    output: 75.0,
  },
} as const

// ============================================
// SINGLETON CLIENT
// ============================================

let anthropicClient: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    if (!ANTHROPIC_CONFIG.apiKey) {
      throw new LLMError(
        'ANTHROPIC_API_KEY is not configured. Please add it to your .env.local file.',
        { code: 'MISSING_API_KEY' }
      )
    }

    anthropicClient = new Anthropic({
      apiKey: ANTHROPIC_CONFIG.apiKey,
    })
  }

  return anthropicClient
}

// ============================================
// TYPES
// ============================================

export interface ChatCompletionOptions {
  model?: string
  max_tokens?: number
  temperature?: number
  system?: string
  messages: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
  stream?: boolean
}

export interface ChatCompletionResult {
  content: string
  model: string
  usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
  }
  stop_reason: string
  latency_ms: number
  cost_usd: number
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate cost in USD based on token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model as keyof typeof PRICING] || PRICING['claude-sonnet-4-5']

  const inputCost = (inputTokens / 1_000_000) * pricing.input
  const outputCost = (outputTokens / 1_000_000) * pricing.output

  return inputCost + outputCost
}

/**
 * Rough token estimation (for pre-request validation)
 * For accurate counting, use @anthropic-ai/tokenizer
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English
  // This is conservative; actual count may be lower
  return Math.ceil(text.length / 4)
}

/**
 * Validate messages array
 */
function validateMessages(messages: ChatCompletionOptions['messages']): void {
  if (!messages || messages.length === 0) {
    throw new LLMError('Messages array cannot be empty', { code: 'INVALID_MESSAGES' })
  }

  // Claude requires alternating user/assistant messages
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]
    if (!msg.role || !msg.content) {
      throw new LLMError(`Message at index ${i} is missing role or content`, {
        code: 'INVALID_MESSAGE_FORMAT',
      })
    }
  }

  // First message must be from user
  if (messages[0].role !== 'user') {
    throw new LLMError('First message must be from user', { code: 'INVALID_MESSAGE_ORDER' })
  }
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Create a chat completion (non-streaming)
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const client = getAnthropicClient()
  const startTime = Date.now()

  // Validate
  validateMessages(options.messages)

  // Build request params
  const params: MessageCreateParams = {
    model: options.model || ANTHROPIC_CONFIG.model,
    max_tokens: options.max_tokens || ANTHROPIC_CONFIG.maxTokens,
    temperature: options.temperature ?? ANTHROPIC_CONFIG.temperature,
    messages: options.messages,
  }

  if (options.system) {
    params.system = options.system
  }

  try {
    // Call Anthropic API
    const response = await client.messages.create(params)

    const latencyMs = Date.now() - startTime

    // Extract text content
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')

    // Calculate cost
    const costUsd = calculateCost(
      response.model,
      response.usage.input_tokens,
      response.usage.output_tokens
    )

    return {
      content,
      model: response.model,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens,
      },
      stop_reason: response.stop_reason || 'unknown',
      latency_ms: latencyMs,
      cost_usd: costUsd,
    }
  } catch (error: any) {
    console.error('[Anthropic] Error creating completion:', error)

    // Handle specific Anthropic errors
    if (error.status === 429) {
      throw new LLMError('Rate limit exceeded. Please try again later.', {
        code: 'RATE_LIMIT',
        originalError: error,
      })
    }

    if (error.status === 401) {
      throw new LLMError('Invalid API key', {
        code: 'INVALID_API_KEY',
        originalError: error,
      })
    }

    if (error.status === 400) {
      throw new LLMError('Invalid request parameters', {
        code: 'INVALID_REQUEST',
        details: error.message,
        originalError: error,
      })
    }

    throw new LLMError('Failed to create chat completion', {
      code: 'COMPLETION_FAILED',
      originalError: error,
    })
  }
}

/**
 * Create a streaming chat completion
 * Yields text chunks as they arrive
 */
export async function* createStreamingChatCompletion(
  options: ChatCompletionOptions
): AsyncGenerator<string, ChatCompletionResult, unknown> {
  const client = getAnthropicClient()
  const startTime = Date.now()

  // Validate
  validateMessages(options.messages)

  // Build request params
  const params: MessageCreateParams = {
    model: options.model || ANTHROPIC_CONFIG.model,
    max_tokens: options.max_tokens || ANTHROPIC_CONFIG.maxTokens,
    temperature: options.temperature ?? ANTHROPIC_CONFIG.temperature,
    messages: options.messages,
    stream: true,
  }

  if (options.system) {
    params.system = options.system
  }

  let fullContent = ''
  let modelName = params.model
  let inputTokens = 0
  let outputTokens = 0
  let stopReason = 'unknown'

  try {
    const stream = await client.messages.create(params)

    for await (const event of stream) {
      // Handle different event types
      if (event.type === 'message_start') {
        // Extract usage from message start
        if ('message' in event && event.message.usage) {
          inputTokens = event.message.usage.input_tokens
        }
      } else if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const textChunk = event.delta.text
          fullContent += textChunk
          yield textChunk
        }
      } else if (event.type === 'message_delta') {
        // Extract final usage and stop reason
        if ('usage' in event && event.usage) {
          outputTokens = event.usage.output_tokens
        }
        if ('delta' in event && event.delta.stop_reason) {
          stopReason = event.delta.stop_reason
        }
      }
    }

    const latencyMs = Date.now() - startTime
    const costUsd = calculateCost(modelName, inputTokens, outputTokens)

    return {
      content: fullContent,
      model: modelName,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
      },
      stop_reason: stopReason,
      latency_ms: latencyMs,
      cost_usd: costUsd,
    }
  } catch (error: any) {
    console.error('[Anthropic] Error creating streaming completion:', error)

    if (error.status === 429) {
      throw new LLMError('Rate limit exceeded. Please try again later.', {
        code: 'RATE_LIMIT',
      })
    }

    throw new LLMError('Failed to create streaming chat completion', {
      code: 'STREAMING_FAILED',
      originalError: error,
    })
  }
}

/**
 * Test connection to Anthropic API
 */
export async function testAnthropicConnection(): Promise<boolean> {
  try {
    await createChatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10,
    })
    return true
  } catch (error) {
    console.error('[Anthropic] Connection test failed:', error)
    return false
  }
}
