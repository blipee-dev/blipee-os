/**
 * POST /api/chat/completions
 * Main endpoint for sending messages and receiving AI responses
 *
 * Flow:
 * 1. Validate request & authenticate user
 * 2. Get or create conversation
 * 3. Save user message
 * 4. Fetch conversation history
 * 5. Build system prompt (agent + preferences)
 * 6. Call Anthropic API
 * 7. Save assistant response
 * 8. Update conversation metadata
 * 9. Return response
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/v2/server'
import { createChatCompletion } from '@/lib/llm/anthropic'
import { buildSystemPrompt } from '@/lib/llm/prompt-builder'
import { rateLimit } from '@/lib/rate-limit'
import type { AgentType, SendMessageResponse } from '@/types/chat'

// ============================================
// REQUEST VALIDATION
// ============================================

const requestSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  agentType: z
    .enum([
      'chief_of_staff',
      'compliance_guardian',
      'carbon_hunter',
      'supply_chain_investigator',
      'cost_saving_finder',
      'energy_optimizer',
      'esg_analyst',
      'data_insights_specialist',
    ])
    .optional()
    .default('chief_of_staff'),
  contextType: z.string().optional(),
  contextEntities: z.array(z.string()).optional(),
  buildingId: z.string().uuid().optional(),
})

type RequestBody = z.infer<typeof requestSchema>

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getUserPreferences(userId: string, supabase: any) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('ai_personality, ai_preferences, preferred_locale')
    .eq('id', userId)
    .single()

  return {
    personality: profile?.ai_personality || {
      tone: 'professional',
      proactivity: 'medium',
      detail_level: 'balanced',
    },
    preferences: profile?.ai_preferences || {
      response_format: 'mixed',
      include_examples: true,
      show_technical_details: false,
      suggest_improvements: true,
    },
    locale: profile?.preferred_locale || 'en-US',
  }
}

async function getOrCreateConversation(
  params: {
    conversationId?: string
    userId: string
    organizationId: string
    agentType: string
    title: string
    contextType?: string
    contextEntities?: string[]
    buildingId?: string
  },
  supabase: any
) {
  // If conversationId provided, fetch it
  if (params.conversationId) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', params.conversationId)
      .eq('user_id', params.userId) // Ensure user owns it
      .single()

    if (error || !data) {
      throw new Error('Conversation not found or access denied')
    }

    return data
  }

  // Create new conversation
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: params.userId,
      organization_id: params.organizationId,
      type: params.agentType,
      title: params.title,
      status: 'active',
      context_type: params.contextType,
      context_entities: params.contextEntities,
      building_id: params.buildingId,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[Chat API] Failed to create conversation:', error)
    throw new Error('Failed to create conversation')
  }

  return data
}

async function saveUserMessage(
  conversationId: string,
  content: string,
  supabase: any
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[Chat API] Failed to save user message:', error)
    throw new Error('Failed to save message')
  }

  return data
}

async function getConversationHistory(
  conversationId: string,
  maxMessages: number,
  supabase: any
) {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(maxMessages)

  if (error) {
    console.error('[Chat API] Failed to fetch history:', error)
    return []
  }

  return data || []
}

async function saveAssistantMessage(
  params: {
    conversationId: string
    content: string
    model: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    latencyMs: number
    costUsd: number
    finishReason: string
  },
  supabase: any
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: params.conversationId,
      role: 'assistant',
      content: params.content,
      model: params.model,
      prompt_tokens: params.promptTokens,
      completion_tokens: params.completionTokens,
      total_tokens: params.totalTokens,
      latency_ms: params.latencyMs,
      cost_usd: params.costUsd,
      finish_reason: params.finishReason,
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[Chat API] Failed to save assistant message:', error)
    throw new Error('Failed to save assistant message')
  }

  return data
}

async function updateConversationMetadata(
  conversationId: string,
  messageCount: number,
  supabase: any
) {
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      message_count: messageCount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId)
}

// ============================================
// MAIN HANDLER
// ============================================

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Rate limiting
    const identifier = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous'
    const { success: rateLimitOk } = await rateLimit(identifier)

    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // 2. Parse and validate request
    const body = await request.json()
    const validated = requestSchema.parse(body)

    // 3. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 4. Get user's active organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('active_organization_id')
      .eq('id', user.id)
      .single()

    const organizationId = userProfile?.active_organization_id

    if (!organizationId) {
      return NextResponse.json(
        { error: 'No active organization found' },
        { status: 400 }
      )
    }

    // 5. Get user preferences
    const { personality, preferences, locale } = await getUserPreferences(user.id, supabase)

    // 6. Get or create conversation
    const conversation = await getOrCreateConversation(
      {
        conversationId: validated.conversationId,
        userId: user.id,
        organizationId,
        agentType: validated.agentType,
        title: validated.message.slice(0, 100), // First 100 chars as title
        contextType: validated.contextType,
        contextEntities: validated.contextEntities,
        buildingId: validated.buildingId,
      },
      supabase
    )

    // 7. Save user message
    await saveUserMessage(conversation.id, validated.message, supabase)

    // 8. Fetch conversation history
    const maxHistory = Number(process.env.CHAT_MAX_HISTORY) || 50
    const history = await getConversationHistory(conversation.id, maxHistory, supabase)

    // 9. Build system prompt
    const systemPrompt = buildSystemPrompt({
      agentType: validated.agentType as AgentType,
      personality,
      preferences,
      locale,
    })

    // 10. Call Anthropic API
    const llmStartTime = Date.now()

    const completion = await createChatCompletion({
      system: systemPrompt,
      messages: history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    })

    const llmLatency = Date.now() - llmStartTime

    console.log('[Chat API] LLM Response:', {
      conversationId: conversation.id,
      model: completion.model,
      inputTokens: completion.usage.input_tokens,
      outputTokens: completion.usage.output_tokens,
      latency: llmLatency,
      cost: completion.cost_usd,
    })

    // 11. Save assistant message
    const assistantMessage = await saveAssistantMessage(
      {
        conversationId: conversation.id,
        content: completion.content,
        model: completion.model,
        promptTokens: completion.usage.input_tokens,
        completionTokens: completion.usage.output_tokens,
        totalTokens: completion.usage.total_tokens,
        latencyMs: llmLatency,
        costUsd: completion.cost_usd,
        finishReason: completion.stop_reason,
      },
      supabase
    )

    // 12. Update conversation metadata
    const updatedMessageCount = history.length + 2 // +2 for user and assistant messages just added
    await updateConversationMetadata(conversation.id, updatedMessageCount, supabase)

    // 13. Build response
    const totalLatency = Date.now() - startTime

    const response: SendMessageResponse = {
      conversationId: conversation.id,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: completion.content,
        createdAt: assistantMessage.created_at,
      },
      usage: {
        promptTokens: completion.usage.input_tokens,
        completionTokens: completion.usage.output_tokens,
        totalTokens: completion.usage.total_tokens,
      },
      latencyMs: totalLatency,
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('[POST /api/chat/completions] Error:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      )
    }

    // Handle known errors
    if (error.message === 'Conversation not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error.message === 'No active organization found') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Generic error
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
