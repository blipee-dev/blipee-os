import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const organizationId = searchParams.get('organizationId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch conversations from the database
    let query = supabase
      .from('conversations')
      .select('id, title, summary, created_at, updated_at, last_message_at')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .limit(50);

    // Filter by organization if provided and valid
    if (organizationId && organizationId !== 'undefined' && organizationId !== 'null') {
      query = query.eq('organization_id', organizationId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[API Conversations] Error fetching conversations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversations: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId, title, summary, keyTopics, metadata } = body;

    if (!userId || !organizationId || !summary) {
      return NextResponse.json(
        { error: 'userId, organizationId, and summary are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Create a new conversation memory
    const { data, error } = await supabase
      .from('conversation_memories')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        title: title || null,
        summary,
        key_topics: keyTopics || [],
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      conversation: data,
      success: true
    });
  } catch (error) {
    console.error('Error in conversations POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
