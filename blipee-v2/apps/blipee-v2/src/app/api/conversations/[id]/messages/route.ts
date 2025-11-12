/**
 * GET /api/conversations/[id]/messages
 * Get messages for a specific conversation with pagination
 *
 * Query params:
 * - limit: number of messages to return (default: 50, max: 100)
 * - before: get messages before this message ID (for pagination)
 * - after: get messages after this message ID (for pagination)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/v2/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const conversationId = params.id

    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const before = searchParams.get('before')
    const after = searchParams.get('after')

    // 4. Build query
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit)

    // Apply pagination filters
    if (before) {
      // Get messages before a specific message (older messages)
      query = query.lt('id', before)
    } else if (after) {
      // Get messages after a specific message (newer messages)
      query = query.gt('id', after)
    }

    // 5. Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/conversations/[id]/messages] Error:', error)
      throw error
    }

    // 6. Return response
    return NextResponse.json({
      messages: data || [],
      pagination: {
        total: count || 0,
        limit,
        hasMore: (data?.length || 0) >= limit,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/conversations/[id]/messages] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
