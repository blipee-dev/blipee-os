/**
 * GET /api/conversations/[id]
 * Get conversation details by ID
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

    // 2. Fetch conversation with selective fields
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, type, status, message_count, last_message_at, is_archived, is_pinned, summary, tags, context_type, context_entities, building_id, created_at, updated_at')
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns it
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // 3. Return conversation
    return NextResponse.json({ conversation: data })
  } catch (error: any) {
    console.error('[GET /api/conversations/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/conversations/[id]
 * Update conversation (title, archived status, etc.)
 */
export async function PATCH(
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

    // 2. Parse request body
    const body = await request.json()
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    // Allow updating specific fields
    if (body.title !== undefined) updates.title = body.title
    if (body.is_archived !== undefined) updates.is_archived = body.is_archived
    if (body.is_pinned !== undefined) updates.is_pinned = body.is_pinned
    if (body.summary !== undefined) updates.summary = body.summary
    if (body.tags !== undefined) updates.tags = body.tags

    // 3. Update conversation
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns it
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // 4. Return updated conversation
    return NextResponse.json({ conversation: data })
  } catch (error: any) {
    console.error('[PATCH /api/conversations/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/conversations/[id]
 * Delete a conversation (soft delete by setting status)
 */
export async function DELETE(
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

    // 2. Soft delete (update status to 'deleted')
    const { data, error } = await supabase
      .from('conversations')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('user_id', user.id) // Ensure user owns it
      .select()
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // 3. Return success
    return NextResponse.json({ success: true, conversation: data })
  } catch (error: any) {
    console.error('[DELETE /api/conversations/[id]] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
