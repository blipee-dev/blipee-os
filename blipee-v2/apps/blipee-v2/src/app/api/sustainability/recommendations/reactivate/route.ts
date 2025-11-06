import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/v2/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recommendation_id, reason } = body

    if (!recommendation_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current recommendation
    const { data: rec, error: fetchError } = await supabase
      .from('metric_recommendations')
      .select('*')
      .eq('id', recommendation_id)
      .single()

    if (fetchError || !rec) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    // Check if reactivatable
    if (!rec.is_reactivatable) {
      return NextResponse.json(
        { error: 'This metric cannot be reactivated (marked as not material)' },
        { status: 400 }
      )
    }

    // Create reactivation record
    const { error: reactivationError } = await supabase
      .from('metric_reactivations')
      .insert({
        recommendation_id,
        organization_id: rec.organization_id,
        reactivated_by: user.id,
        reactivation_reason: reason,
        original_dismiss_category: rec.dismissed_category,
        original_dismiss_reason: rec.dismissed_reason,
        original_dismiss_date: rec.dismissed_at,
      })

    if (reactivationError) {
      console.error('Error creating reactivation record:', reactivationError)
      return NextResponse.json(
        { error: 'Failed to create reactivation record' },
        { status: 500 }
      )
    }

    // Update recommendation status back to pending
    const { error: updateError } = await supabase
      .from('metric_recommendations')
      .update({
        status: 'pending',
        dismissed_at: null,
        dismissed_category: null,
        dismissed_notes: null,
      })
      .eq('id', recommendation_id)

    if (updateError) {
      console.error('Error reactivating metric:', updateError)
      return NextResponse.json(
        { error: 'Failed to reactivate metric' },
        { status: 500 }
      )
    }

    // Log the action
    await supabase.from('recommendation_actions').insert({
      recommendation_id,
      organization_id: rec.organization_id,
      action_type: 'reactivated',
      action_details: {
        reason,
        previous_dismiss_category: rec.dismissed_category,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Metric reactivated successfully',
    })
  } catch (error) {
    console.error('Error in reactivate API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
