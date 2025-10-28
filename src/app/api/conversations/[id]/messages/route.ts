import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getAPIUser } from '@/lib/auth/server-auth';

/**
 * GET /api/conversations/[id]/messages
 * Load all messages for a conversation
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = createAdminClient();

    // Authenticate user
    const user = await getAPIUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[API Messages] Loading messages for conversation:', conversationId);

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, user_id, organization_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      // 404 is expected for new conversations that haven't been created yet
      console.log('[API Messages] Conversation not found (likely a new conversation):', conversationId);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Verify user owns this conversation
    if (conversation.user_id !== user.id) {
      console.error('[API Messages] Access denied - user does not own conversation');
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Load messages with metadata (contains full parts structure)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, role, content, model, created_at, metadata')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('[API Messages] Error loading messages:', messagesError);
      return NextResponse.json(
        { error: 'Failed to load messages' },
        { status: 500 }
      );
    }

    console.log('[API Messages] Loaded', messages?.length || 0, 'messages');

    // Convert database messages to UIMessage format for AI SDK
    // If metadata.parts exists, use it (preserves tool calls, attachments, etc.)
    // Otherwise, fall back to simple text-only message (backwards compatibility)
    const uiMessages = (messages || []).map((msg) => {
      const hasParts = msg.metadata && Array.isArray(msg.metadata.parts);

      if (hasParts) {
        console.log(`[API Messages] Message ${msg.id}: Using full parts (${msg.metadata.parts.length} parts)`);
      } else {
        console.log(`[API Messages] Message ${msg.id}: Using text fallback`);
      }

      return {
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        parts: hasParts
          ? msg.metadata.parts // Use full parts if available (includes tool calls, etc.)
          : [{ type: 'text' as const, text: msg.content }], // Fallback to text-only
        createdAt: new Date(msg.created_at),
      };
    });

    return NextResponse.json({
      messages: uiMessages,
      count: uiMessages.length,
    });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
