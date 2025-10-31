/**
 * Message Votes API
 *
 * Handles upvote/downvote functionality for individual messages.
 * Part of FASE 2 - Conversation Intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message_id, vote_type, feedback_text, feedback_category } = body;

    if (!message_id || !vote_type) {
      return NextResponse.json(
        { error: 'Missing required fields: message_id, vote_type' },
        { status: 400 }
      );
    }

    if (vote_type !== 'up' && vote_type !== 'down') {
      return NextResponse.json(
        { error: 'vote_type must be "up" or "down"' },
        { status: 400 }
      );
    }

    // Check if vote already exists
    const { data: existingVote } = await supabase
      .from('message_votes')
      .select('*')
      .eq('message_id', message_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote) {
      // Update existing vote
      const { data: vote, error: updateError } = await supabase
        .from('message_votes')
        .update({
          vote_type,
          feedback_text,
          feedback_category,
        })
        .eq('id', existingVote.id)
        .select()
        .single();

      if (updateError) {
        console.error('Database error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update vote' },
          { status: 500 }
        );
      }

      return NextResponse.json(vote);
    }

    // Create new vote
    const { data: vote, error: dbError } = await supabase
      .from('message_votes')
      .insert({
        message_id,
        user_id: user.id,
        vote_type,
        feedback_text,
        feedback_category,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create vote' },
        { status: 500 }
      );
    }

    return NextResponse.json(vote, { status: 201 });
  } catch (error) {
    console.error('Vote creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('message_id');
    const conversationId = searchParams.get('conversation_id');

    if (messageId) {
      // Get all votes for a specific message
      const { data: votes, error } = await supabase
        .from('message_votes')
        .select('*')
        .eq('message_id', messageId);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch votes' },
          { status: 500 }
        );
      }

      // Calculate vote summary
      const upvotes = votes.filter(v => v.vote_type === 'up').length;
      const downvotes = votes.filter(v => v.vote_type === 'down').length;
      const userVote = votes.find(v => v.user_id === user.id);

      return NextResponse.json({
        votes,
        summary: {
          upvotes,
          downvotes,
          total: votes.length,
          userVote: userVote?.vote_type || null,
        },
      });
    }

    if (conversationId) {
      // Get all votes for messages in a conversation
      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('conversation_id', conversationId);

      if (!messages || messages.length === 0) {
        return NextResponse.json({ votes: [], summary: {} });
      }

      const messageIds = messages.map(m => m.id);

      const { data: votes, error } = await supabase
        .from('message_votes')
        .select('*')
        .in('message_id', messageIds);

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch votes' },
          { status: 500 }
        );
      }

      // Group votes by message
      const votesByMessage: Record<string, any> = {};
      messageIds.forEach(id => {
        const messageVotes = votes.filter(v => v.message_id === id);
        votesByMessage[id] = {
          upvotes: messageVotes.filter(v => v.vote_type === 'up').length,
          downvotes: messageVotes.filter(v => v.vote_type === 'down').length,
          userVote: messageVotes.find(v => v.user_id === user.id)?.vote_type || null,
        };
      });

      return NextResponse.json({
        votes,
        summary: votesByMessage,
      });
    }

    // Get all votes by user
    const { data: votes, error } = await supabase
      .from('message_votes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch votes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ votes });
  } catch (error) {
    console.error('Votes fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('message_id');

    if (!messageId) {
      return NextResponse.json(
        { error: 'Missing message_id' },
        { status: 400 }
      );
    }

    // Delete vote
    const { error: dbError } = await supabase
      .from('message_votes')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete vote' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Vote deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
