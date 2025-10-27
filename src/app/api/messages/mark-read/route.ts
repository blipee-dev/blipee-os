import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Mark agent messages as read
 *
 * Marks all unread agent messages in a conversation as read
 * Called when user opens the agent proactive conversation
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Verify user has access to this conversation
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('user_id')
      .eq('id', conversationId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Mark all unread agent messages in this conversation as read
    const { error: updateError } = await supabaseAdmin
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('role', 'agent')
      .eq('read', false);

    if (updateError) {
      console.error('Error marking messages as read:', updateError);
      return NextResponse.json(
        { error: 'Failed to mark messages as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in mark-read endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  }
}
