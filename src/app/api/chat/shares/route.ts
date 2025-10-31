/**
 * Chat Shares API
 *
 * Handles conversation sharing with public/private access control.
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
    const {
      conversation_id,
      is_public = false,
      allowed_user_ids = [],
      allowed_organization_ids = [],
      share_title,
      share_description,
      expires_at,
    } = body;

    if (!conversation_id) {
      return NextResponse.json(
        { error: 'Missing required field: conversation_id' },
        { status: 400 }
      );
    }

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from('conversations')
      .select('user_id')
      .eq('id', conversation_id)
      .single();

    if (!conversation || conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Create share
    const { data: share, error: dbError } = await supabase
      .from('chat_shares')
      .insert({
        conversation_id,
        shared_by_user_id: user.id,
        is_public,
        allowed_user_ids,
        allowed_organization_ids,
        share_title,
        share_description,
        expires_at,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to create share' },
        { status: 500 }
      );
    }

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error('Share creation error:', error);
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
    const conversationId = searchParams.get('conversation_id');
    const shareToken = searchParams.get('share_token');

    if (shareToken) {
      // Get share by token and update access tracking
      const { data: share, error } = await supabase
        .from('chat_shares')
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error || !share) {
        return NextResponse.json({ error: 'Share not found' }, { status: 404 });
      }

      // Check if expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Share has expired' }, { status: 410 });
      }

      // Check access permissions
      const hasAccess =
        share.is_public ||
        share.shared_by_user_id === user.id ||
        (share.allowed_user_ids && share.allowed_user_ids.includes(user.id));

      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      // Update view count and last accessed
      await supabase
        .from('chat_shares')
        .update({
          view_count: (share.view_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', share.id);

      return NextResponse.json(share);
    }

    if (conversationId) {
      // Get all shares for a conversation
      const { data: shares, error } = await supabase
        .from('chat_shares')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('shared_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        return NextResponse.json(
          { error: 'Failed to fetch shares' },
          { status: 500 }
        );
      }

      return NextResponse.json(shares);
    }

    // Get all shares created by user
    const { data: shares, error } = await supabase
      .from('chat_shares')
      .select('*')
      .eq('shared_by_user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch shares' },
        { status: 500 }
      );
    }

    return NextResponse.json(shares);
  } catch (error) {
    console.error('Shares fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { share_id, ...updates } = body;

    if (!share_id) {
      return NextResponse.json(
        { error: 'Missing required field: share_id' },
        { status: 400 }
      );
    }

    // Update share
    const { data: share, error: dbError } = await supabase
      .from('chat_shares')
      .update(updates)
      .eq('id', share_id)
      .eq('shared_by_user_id', user.id)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to update share' },
        { status: 500 }
      );
    }

    return NextResponse.json(share);
  } catch (error) {
    console.error('Share update error:', error);
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
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json(
        { error: 'Missing share ID' },
        { status: 400 }
      );
    }

    // Delete share
    const { error: dbError } = await supabase
      .from('chat_shares')
      .delete()
      .eq('id', shareId)
      .eq('shared_by_user_id', user.id);

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete share' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Share deletion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
