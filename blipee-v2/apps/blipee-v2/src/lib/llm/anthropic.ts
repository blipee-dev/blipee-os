/**
 * Anthropic Claude Client - Powered by Vercel AI SDK
 * Handles all communication with Claude API using Vercel AI SDK
 *
 * Features:
 * - Unified provider interface
 * - Native streaming support
 * - Token counting
 * - Cost calculation
 * - Error handling
 * - Easy provider switching
 */

import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText, streamText } from 'ai'
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
// PROVIDER SETUP
// ============================================

let anthropicProvider: ReturnType<typeof createAnthropic> | null = null

export function getAnthropicProvider() {
  if (!anthropicProvider) {
    if (!ANTHROPIC_CONFIG.apiKey) {
      throw new LLMError(
        'ANTHROPIC_API_KEY is not configured. Please add it to your .env.local file.',
        { code: 'MISSING_API_KEY' }
      )
    }

    anthropicProvider = createAnthropic({
      apiKey: ANTHROPIC_CONFIG.apiKey,
    })
  }

  return anthropicProvider
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
 */
export function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token for English
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
 * Uses Vercel AI SDK's generateText()
 */
export async function createChatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult> {
  const startTime = Date.now()

  // Validate
  validateMessages(options.messages)

  const provider = getAnthropicProvider()
  const modelName = options.model || ANTHROPIC_CONFIG.model

  try {
    // Call Vercel AI SDK generateText
    const result = await generateText({
      model: provider(modelName),
      maxTokens: options.max_tokens || ANTHROPIC_CONFIG.maxTokens,
      temperature: options.temperature ?? ANTHROPIC_CONFIG.temperature,
      system: options.system,
      messages: options.messages,
    })

    const latencyMs = Date.now() - startTime

    // Calculate cost
    const costUsd = calculateCost(
      modelName,
      result.usage.promptTokens,
      result.usage.completionTokens
    )

    return {
      content: result.text,
      model: modelName,
      usage: {
        input_tokens: result.usage.promptTokens,
        output_tokens: result.usage.completionTokens,
        total_tokens: result.usage.totalTokens,
      },
      stop_reason: result.finishReason || 'unknown',
      latency_ms: latencyMs,
      cost_usd: costUsd,
    }
  } catch (error: any) {
    console.error('[Anthropic/Vercel AI SDK] Error creating completion:', error)

    // Handle specific errors
    if (error.message?.includes('429') || error.statusCode === 429) {
      throw new LLMError('Rate limit exceeded. Please try again later.', {
        code: 'RATE_LIMIT',
        originalError: error,
      })
    }

    if (error.message?.includes('401') || error.statusCode === 401) {
      throw new LLMError('Invalid API key', {
        code: 'INVALID_API_KEY',
        originalError: error,
      })
    }

    if (error.message?.includes('400') || error.statusCode === 400) {
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
 * Uses Vercel AI SDK's streamText()
 * Yields text chunks as they arrive
 */
export async function* createStreamingChatCompletion(
  options: ChatCompletionOptions
): AsyncGenerator<string, ChatCompletionResult, unknown> {
  const startTime = Date.now()

  // Validate
  validateMessages(options.messages)

  const provider = getAnthropicProvider()
  const modelName = options.model || ANTHROPIC_CONFIG.model

  let fullContent = ''
  let inputTokens = 0
  let outputTokens = 0
  let stopReason = 'unknown'

  try {
    // Call Vercel AI SDK streamText
    const result = await streamText({
      model: provider(modelName),
      maxTokens: options.max_tokens || ANTHROPIC_CONFIG.maxTokens,
      temperature: options.temperature ?? ANTHROPIC_CONFIG.temperature,
      system: options.system,
      messages: options.messages,
    })

    // Stream text chunks
    for await (const textPart of result.textStream) {
      fullContent += textPart
      yield textPart
    }

    // Get final usage stats
    const usage = await result.usage
    const finishReason = await result.finishReason

    inputTokens = usage.promptTokens
    outputTokens = usage.completionTokens
    stopReason = finishReason || 'unknown'

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
    console.error('[Anthropic/Vercel AI SDK] Error creating streaming completion:', error)

    if (error.message?.includes('429') || error.statusCode === 429) {
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
 * Test connection to Anthropic API via Vercel AI SDK
 */
export async function testAnthropicConnection(): Promise<boolean> {
  try {
    await createChatCompletion({
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 10,
    })
    return true
  } catch (error) {
    console.error('[Anthropic/Vercel AI SDK] Connection test failed:', error)
    return false
  }
}
