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
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Get agent proactive conversation for this user
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('organization_id', memberData.organization_id)
      .eq('type', 'agent_proactive')
      .maybeSingle();

    if (convError) {
      console.error('Error fetching conversation:', convError);
      return NextResponse.json({ notifications: [] });
    }

    // If no conversation exists yet, no notifications
    if (!conversation) {
      return NextResponse.json({ notifications: [] });
    }

    // Get recent agent messages (limit to 50 most recent)
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, content, created_at, read')
      .eq('conversation_id', conversation.id)
      .eq('role', 'agent')
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) {
      console.error('Error fetching notifications:', messagesError);
      return NextResponse.json({ notifications: [] });
    }

    // Format notifications
    const notifications = (messages || []).map(msg => ({
      id: msg.id,
      message: msg.content,
      timestamp: msg.created_at,
      read: msg.read,
      conversationId: conversation.id,
      conversationTitle: conversation.title || 'AI Agent Updates'
    }));

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
