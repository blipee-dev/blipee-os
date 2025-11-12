/**
 * GET /api/conversations
 * List user's conversations with pagination and filtering
 *
 * Query params:
 * - limit: number of conversations to return (default: 50, max: 100)
 * - offset: pagination offset (default: 0)
 * - archived: include archived conversations (default: false)
 * - agentType: filter by agent type
 * - search: search in title/summary
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/v2/server'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
    const offset = Number(searchParams.get('offset')) || 0
    const archived = searchParams.get('archived') === 'true'
    const agentType = searchParams.get('agentType')
    const search = searchParams.get('search')

    // 3. Build query
    let query = supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (!archived) {
      query = query.or('is_archived.is.null,is_archived.eq.false')
    }

    if (agentType) {
      query = query.eq('type', agentType)
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,summary.ilike.%${search}%`)
    }

    // 4. Execute query
    const { data, error, count } = await query

    if (error) {
      console.error('[GET /api/conversations] Error:', error)
      throw error
    }

    // 5. Return response
    return NextResponse.json({
      conversations: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error: any) {
    console.error('[GET /api/conversations] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/conversations
 * Create a new conversation
 *
 * Body:
 * - title: string (optional)
 * - agentType: AgentType (optional, default: 'chief_of_staff')
 * - contextType: string (optional)
 * - contextEntities: string[] (optional)
 * - buildingId: string (optional)
 */
export async function POST(request: NextRequest) {
  try {
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
    const { title, agentType, contextType, contextEntities, buildingId } = body

    // 3. Get user's active organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('active_organization_id')
      .eq('id', user.id)
      .single()

    const organizationId = userProfile?.active_organization_id

    if (!organizationId) {
      return NextResponse.json(
        { error: 'No active organization found' },
        { status: 400 }
      )
    }

    // 4. Create conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        organization_id: organizationId,
        title: title || 'New Conversation',
        type: agentType || 'chief_of_staff',
        status: 'active',
        context_type: contextType,
        context_entities: contextEntities,
        building_id: buildingId,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[POST /api/conversations] Error:', error)
      throw error
    }

    // 5. Return created conversation
    return NextResponse.json({ conversation: data }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/conversations] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
