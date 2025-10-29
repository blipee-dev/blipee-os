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
import { type UIMessage, validateUIMessages, generateText, streamText, convertToCoreMessages, stepCountIs } from 'ai';
import { createAdminClient } from '@/lib/supabase/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import {
  createSustainabilityAgent,
  createSystemPrompt,
  validateFileType,
  SUPPORTED_FILE_TYPES
} from '@/lib/ai/agents/sustainability-agent';
import {
  createContentSafetyTransform,
  defaultSustainabilityContentSafety
} from '@/lib/ai/safety/content-safety';
import { createDatabaseViolationLogger } from '@/lib/ai/safety/violation-logger';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { sustainabilityTools } from '@/lib/ai/chat-tools';
import { getOrCreatePromptVersion } from '@/lib/ai/prompt-version-tracker';

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

    // Parse request body - now receiving only the last message
    const {
      message,
      conversationId,
      organizationId,
      buildingId,
      model = 'gpt-4o', // Default to GPT-4o if not specified
      language = 'en' // Default to English if not specified
    }: {
      message: UIMessage;
      conversationId: string;
      organizationId: string;
      buildingId?: string;
      model?: string;
      language?: string;
    } = await req.json();

    if (!message) {
      return new Response('Invalid message format', { status: 400 });
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

    // Load previous messages from database with metadata
    console.log('[Chat API] Loading previous messages for conversation:', conversationId);
    const { data: dbMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, content, model, created_at, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    // Convert database messages to UIMessage format
    // If metadata.parts exists, use it (preserves tool calls, attachments, etc.)
    // Otherwise, fall back to simple text-only message (backwards compatibility)
    // Transform 'agent' role to 'assistant' for AI SDK compatibility
    const previousMessages: UIMessage[] = (dbMessages || []).map((msg) => {
      const hasParts = msg.metadata && Array.isArray(msg.metadata.parts);

      return {
        id: msg.id,
        role: msg.role === 'agent' ? 'assistant' : msg.role as 'user' | 'assistant',
        parts: hasParts
          ? msg.metadata.parts // Use full parts if available (includes tool calls, etc.)
          : [{ type: 'text' as const, text: msg.content }], // Fallback to text-only
        createdAt: new Date(msg.created_at),
      };
    });

    console.log('[Chat API] Loaded', previousMessages.length, 'previous messages');

    // Append the new message to previous messages
    const messages = [...previousMessages, message];

    // Validate file attachments in messages
    for (const msg of messages) {
      if (msg.parts) {
        for (const part of msg.parts) {
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

    // Ensure conversation exists
    console.log('[Chat API] Looking for conversation:', conversationId);
    const { data: existingConversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, title, message_count')
      .eq('id', conversationId)
      .single();

    console.log('[Chat API] Conversation query result:', {
      found: !!existingConversation,
      error: conversationError,
      data: existingConversation
    });

    if (!existingConversation) {
      // Create new conversation
      console.log('[Chat API] Creating new conversation:', { conversationId, userId: user.id, organizationId, buildingId });
      const { error: insertError } = await supabase.from('conversations').insert({
        id: conversationId,
        user_id: user.id,
        organization_id: organizationId,
        building_id: buildingId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      if (insertError) {
        console.error('[Chat API] Error creating conversation:', insertError);
      } else {
        console.log('[Chat API] Conversation created successfully');
      }
    }

    // Save user message (only if it's a new message, not already in database)
    // Check if this message is already saved by comparing with last message in previousMessages
    const isNewMessage = previousMessages.length === 0 ||
      previousMessages[previousMessages.length - 1].id !== message.id;

    if (isNewMessage && message.role === 'user') {
      try {
        const userContent = message.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join('\n');

        console.log('[Chat] Saving user message with full parts...');
        const { data: savedUserMessage, error: userSaveError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          role: 'user',
          content: userContent, // Text-only for backwards compatibility
          metadata: {
            parts: message.parts // Store full message parts structure (includes attachments, etc.)
          },
          created_at: new Date().toISOString()
        }).select();

        if (userSaveError) {
          console.error('[Chat] ❌ Failed to save user message:', userSaveError);
          throw userSaveError;
        }

        console.log('[Chat] ✅ User message saved successfully');

        // Title will be generated after first AI response (in onFinish)
      } catch (error) {
        console.error('[Chat] Failed to save user message:', error);
      }
    }

    // Get the appropriate model based on model ID
    const getModel = (modelId: string) => {
      if (modelId.startsWith('claude')) {
        return anthropic(modelId);
      }
      return openai(modelId);
    };

    // Create contextualized system prompt with org, building context, and language preference
    const systemPrompt = createSystemPrompt(organizationId, buildingId, language);

    // Track prompt version for feedback and A/B testing
    const promptVersionId = await getOrCreatePromptVersion(
      systemPrompt,
      organizationId,
      { model, buildingId }
    );

    // Use streamText with proper message persistence pattern
    const result = streamText({
      model: getModel(model),
      system: systemPrompt,
      messages: convertToCoreMessages(validatedMessages),
      tools: sustainabilityTools,
      maxSteps: 5,
      // CRITICAL: Enable multi-step calls so model continues after tool execution
      stopWhen: stepCountIs(5),
      // Ensure model responds after tool execution
      onStepFinish: async ({ text, toolCalls, toolResults, finishReason, usage, isContinued }) => {
        console.log('[Chat] 📊 Step finished:', {
          hasText: !!text && text.length > 0,
          textLength: text?.length || 0,
          toolCallsCount: toolCalls?.length || 0,
          toolResultsCount: toolResults?.length || 0,
          finishReason,
          isContinued: isContinued || false,
        });

        // If we have tool results but no text, the model stopped prematurely
        if (toolResults && toolResults.length > 0 && (!text || text.length === 0)) {
          console.warn('[Chat] ⚠️ WARNING: Tool executed but no text response generated!');
          console.warn('[Chat] This means the model stopped after calling the tool without explaining results');
        }
      },
    });

    // Return streaming response with originalMessages for persistence
    return result.toUIMessageStreamResponse({
      originalMessages: validatedMessages,
      onFinish: async ({ messages: finalMessages }) => {
        console.log('[Chat] ⚠️ onFinish callback triggered!');
        console.log('[Chat] Final messages count:', finalMessages.length);
        console.log('[Chat] ConversationId:', conversationId);

        // Get the last assistant message from finalMessages
        const lastAssistantMessage = finalMessages
          .filter(m => m.role === 'assistant')
          .pop();

        if (!lastAssistantMessage) {
          console.error('[Chat] No assistant message found in final messages');
          return;
        }

        // Extract text content for the content field (for backwards compatibility and search)
        const textParts = lastAssistantMessage.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text);

        const assistantText = textParts.join('\n\n');

        // Save assistant message with full parts structure in metadata
        try {
          console.log('[Chat] Saving assistant message with full parts...');
          const { data: savedMessage, error: saveError } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: assistantText, // Text-only for backwards compatibility
            model: model,
            metadata: {
              parts: lastAssistantMessage.parts, // Store full message parts structure
              prompt_version_id: promptVersionId // Track which prompt version was used
            },
            created_at: new Date().toISOString()
          }).select();

          if (saveError) {
            console.error('[Chat] ❌ Failed to save assistant message:', saveError);
            throw saveError;
          }

          console.log('[Chat] ✅ Assistant message saved successfully');

          // Generate conversation title if this is the first response
          console.log('[Chat] Checking if title needs generation...');
          const { data: conversation } = await supabase
            .from('conversations')
            .select('title, message_count')
            .eq('id', conversationId)
            .single();

          console.log('[Chat] Conversation title check:', { title: conversation?.title, shouldGenerate: !conversation?.title || conversation.title === 'New Chat' });

          if (!conversation?.title || conversation.title === 'New Chat') {
            console.log('[Chat] Starting title generation...');
            // Get the user's first message for context
            const { data: messages } = await supabase
              .from('messages')
              .select('content, role')
              .eq('conversation_id', conversationId)
              .order('created_at', { ascending: true })
              .limit(2);

            const userMessage = messages?.find(m => m.role === 'user')?.content || '';

            // Generate a concise title using AI
            try {
              const { text: generatedTitle } = await generateText({
                model: openai('gpt-4o-mini'), // Use fast, cheap model for title generation
                prompt: `Based on this conversation, generate a short, descriptive title (3-6 words maximum, no quotes or punctuation at the end):

User: ${userMessage}
Assistant: ${assistantText.slice(0, 200)}...

Title:`,
                maxTokens: 20,
                temperature: 0.7
              });

              const title = generatedTitle.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present

              console.log('[Chat] Generated title:', title);

              await supabase.from('conversations')
                .update({ title })
                .eq('id', conversationId);
            } catch (error) {
              console.error('[Chat] Failed to generate title:', error);
              // Fallback to simple title
              const fallbackTitle = userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '');
              await supabase.from('conversations')
                .update({ title: fallbackTitle })
                .eq('id', conversationId);
            }
          }

          // Update or create conversation memory
          const { data: existingMemory } = await supabase
            .from('conversation_memories')
            .select('id')
            .eq('conversation_id', conversationId)
            .single();

          const summary = `Recent conversation about: ${assistantText.slice(0, 200)}...`;

          if (existingMemory) {
            // Update existing memory
            await supabase.from('conversation_memories')
              .update({
                summary,
                updated_at: new Date().toISOString()
              })
              .eq('conversation_id', conversationId);
          } else {
            // Get the updated conversation title
            const { data: updatedConversation } = await supabase
              .from('conversations')
              .select('title')
              .eq('id', conversationId)
              .single();

            await supabase.from('conversation_memories').insert({
              conversation_id: conversationId,
              user_id: user.id,
              organization_id: organizationId,
              title: updatedConversation?.title || 'Untitled conversation',
              summary,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
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
