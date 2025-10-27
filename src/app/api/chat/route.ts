/**
 * Official AI SDK Chat API Route with Agent Class
 *
 * Clean, maintainable API route using the Agent class pattern.
 * Features:
 * - Reusable agent configuration
 * - Type-safe UIMessage handling
 * - Multi-provider support (OpenAI, Anthropic)
 * - Provider options (prompt caching, reasoning effort)
 * - File type validation
 * - Dynamic model selection
 *
 * https://sdk.vercel.ai/docs/ai-sdk-core/agents
 */

import { NextRequest } from 'next/server';
import { type UIMessage, validateUIMessages } from 'ai';
import { createAdminClient } from '@/lib/supabase/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import {
  createSustainabilityAgent,
  validateFileType,
  SUPPORTED_FILE_TYPES
} from '@/lib/ai/agents/sustainability-agent';
import {
  createContentSafetyTransform,
  defaultSustainabilityContentSafety
} from '@/lib/ai/safety/content-safety';
import { createDatabaseViolationLogger } from '@/lib/ai/safety/violation-logger';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * POST /api/chat
 * Agent-powered chat endpoint with UIMessage support
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // Authenticate user
    const user = await getAPIUser(req);
    console.log('[Chat API] User:', user ? user.id : 'null');
    if (!user) {
      console.log('[Chat API] No user found, returning 401');
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request body
    const {
      messages,
      conversationId,
      organizationId,
      buildingId,
      model = 'gpt-4o' // Default to GPT-4o if not specified
    }: {
      messages: UIMessage[];
      conversationId: string;
      organizationId: string;
      buildingId?: string;
      model?: string;
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    if (!conversationId || !organizationId) {
      console.log('[Chat API] Missing fields - conversationId:', conversationId, 'organizationId:', organizationId);
      return new Response('Missing required fields', { status: 400 });
    }

    console.log('[Chat API] Checking membership - userId:', user.id, 'orgId:', organizationId);

    // Verify user has access to organization
    const { data: member, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    console.log('[Chat API] Member query result:', { member, memberError });

    if (!member) {
      console.log('[Chat API] User not member of org, returning 403');
      return new Response('Access denied', { status: 403 });
    }

    console.log('[Chat API] Access granted - role:', member.role);

    // Validate file attachments in messages
    for (const message of messages) {
      if (message.parts) {
        for (const part of message.parts) {
          // Validate file parts
          if (part.type === 'file' && part.mediaType) {
            if (!validateFileType(part.mediaType, model)) {
              return new Response(
                JSON.stringify({
                  error: `File type ${part.mediaType} is not supported by model ${model}`,
                  supportedTypes: SUPPORTED_FILE_TYPES,
                }),
                {
                  status: 400,
                  headers: { 'Content-Type': 'application/json' },
                }
              );
            }
          }
        }
      }
    }

    // Validate UIMessages before passing to agent
    const validatedMessages = await validateUIMessages({ messages });

    // Create content safety config with database logging
    const contentSafetyConfig = {
      ...defaultSustainabilityContentSafety,
      onViolation: createDatabaseViolationLogger({
        conversationId,
        organizationId,
        userId: user.id,
        model,
        messageRole: 'assistant' // Violations are in assistant responses
      })
    };

    // Create agent for the specified model with custom safety config and org context
    const agent = createSustainabilityAgent(
      model,
      contentSafetyConfig,
      organizationId,
      buildingId
    );

    // Use agent to respond (handles loop, tools, and streaming automatically)
    return agent.respond({
      messages: validatedMessages,
      onFinish: async ({ text, toolCalls, usage }) => {
        // Log conversation to database
        if (process.env.NODE_ENV === 'development') {
          console.log('[Chat] Finished streaming');
          console.log('[Chat] Model:', model);
          console.log('[Chat] Tool calls:', toolCalls?.length || 0);
          console.log('[Chat] Usage:', usage);
        }

        // Save to conversation history
        try {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
            model: model,
            created_at: new Date().toISOString()
          });
        } catch (error) {
          console.error('[Chat] Failed to save message:', error);
        }
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
