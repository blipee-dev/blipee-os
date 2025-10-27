/**
 * Test Chat API Route (No Auth Required)
 *
 * This endpoint bypasses authentication for testing purposes.
 * DO NOT use in production.
 */

import { NextRequest } from 'next/server';
import { type UIMessage, validateUIMessages } from 'ai';
import {
  createSustainabilityAgent,
  validateFileType,
  SUPPORTED_FILE_TYPES
} from '@/lib/ai/agents/sustainability-agent';
import {
  createContentSafetyTransform,
  defaultSustainabilityContentSafety
} from '@/lib/ai/safety/content-safety';

export const maxDuration = 30;

/**
 * POST /api/chat/test
 * Test endpoint with no authentication
 */
export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const {
      messages,
      model = 'gpt-4o'
    }: {
      messages: UIMessage[];
      model?: string;
    } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

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

    // Create agent for the specified model
    const agent = createSustainabilityAgent(model, defaultSustainabilityContentSafety);

    // Use agent to respond
    return agent.respond({
      messages: validatedMessages,
      onFinish: async ({ text, toolCalls, usage }) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Chat Test] Finished streaming');
          console.log('[Chat Test] Model:', model);
          console.log('[Chat Test] Tool calls:', toolCalls?.length || 0);
          console.log('[Chat Test] Usage:', usage);
        }
      }
    });

  } catch (error) {
    console.error('Chat Test API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
