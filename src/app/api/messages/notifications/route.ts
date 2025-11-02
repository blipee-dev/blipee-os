import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Get agent notification messages for current user
 *
 * Returns recent proactive messages from AI agents
 * Used for notifications panel
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get ALL agent proactive conversations for this user
    const { data: conversations, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, metadata')
      .eq('user_id', user.id)
      .eq('organization_id', memberData.organization_id)
      .eq('type', 'agent_proactive')
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return NextResponse.json({ notifications: [] });
    }

    // If no conversations exist yet, no notifications
    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Get conversation IDs
    const conversationIds = conversations.map(c => c.id);

    // Get recent agent messages from all conversations (limit to 50 most recent across all agents)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, content, created_at, read, conversation_id, agent_id')
      .in('conversation_id', conversationIds)
      .eq('role', 'agent')
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) {
      console.error('Error fetching notifications:', messagesError);
      return NextResponse.json({ notifications: [] });
    }

    // Create a map of conversation ID to conversation data
    const conversationMap = new Map(
      conversations.map(c => [c.id, c])
    );

    // Group messages by conversation and count unread
    const groupedNotifications = new Map<string, {
      conversationId: string;
      conversationTitle: string;
      agentId: string;
      agentName: string;
      unreadCount: number;
      totalCount: number;
      lastMessage: string;
      lastMessageTimestamp: string;
      lastMessageId: string;
    }>();

    // Process messages to group by conversation
    (messages || []).forEach(msg => {
      const conversation = conversationMap.get(msg.conversation_id);
      const conversationId = msg.conversation_id;

      if (!groupedNotifications.has(conversationId)) {
        // First message for this conversation - initialize
        groupedNotifications.set(conversationId, {
          conversationId,
          conversationTitle: conversation?.title || 'AI Agent Updates',
          agentId: msg.agent_id || (conversation?.metadata as any)?.agent_id,
          agentName: (conversation?.metadata as any)?.agent_name,
          unreadCount: msg.read ? 0 : 1,
          totalCount: 1,
          lastMessage: msg.content,
          lastMessageTimestamp: msg.created_at,
          lastMessageId: msg.id
        });
      } else {
        // Update counts for existing conversation
        const existing = groupedNotifications.get(conversationId)!;
        existing.totalCount++;
        if (!msg.read) {
          existing.unreadCount++;
        }
        // Keep the most recent message info (messages are ordered by created_at DESC)
        // So first message we see is the most recent
      }
    });

    // Convert to array, filter out fully read conversations, and sort by last message timestamp (most recent first)
    const notifications = Array.from(groupedNotifications.values())
      .filter(notification => notification.unreadCount > 0) // Only show notifications with unread messages
      .sort((a, b) => new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime());

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
