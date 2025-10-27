/**
 * Message Voting API Endpoint
 * Allows users to provide feedback on AI responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAPIUser } from '@/lib/auth/server-auth';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate user
    const user = await getAPIUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, voteType, feedbackText, feedbackCategory } = await req.json();

    if (!messageId || !voteType) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, voteType' },
        { status: 400 }
      );
    }

    if (!['up', 'down'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote type. Must be "up" or "down"' },
        { status: 400 }
      );
    }

    // Upsert vote (replace existing vote if present)
    const { error } = await supabase
      .from('message_votes')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        vote_type: voteType,
        feedback_text: feedbackText || null,
        feedback_category: feedbackCategory || null
      }, {
        onConflict: 'message_id,user_id'
      });

    if (error) {
      console.error('Error saving vote:', error);
      return NextResponse.json(
        { error: 'Failed to save vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
