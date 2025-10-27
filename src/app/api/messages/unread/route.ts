import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';

/**
 * Get unread agent message count for current user
 *
 * Returns count of unread proactive messages from AI agents
 * Used for notification badges on chat button
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
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', memberData.organization_id)
      .eq('type', 'agent_proactive')
      .maybeSingle();

    if (convError) {
      console.error('Error fetching conversation:', convError);
      return NextResponse.json({ count: 0 });
    }

    // If no conversation exists yet, no unread messages
    if (!conversation) {
      return NextResponse.json({ count: 0 });
    }

    // Count unread agent messages in this conversation
    const { count, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversation.id)
      .eq('role', 'agent')
      .eq('read', false);

    if (countError) {
      console.error('Error counting unread messages:', countError);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
