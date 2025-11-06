import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/v2/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recommendation_id, new_category, notes } = body

    if (!recommendation_id || !new_category) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = [
      'not_material',
      'not_priority',
      'already_tracking',
      'data_not_available',
      'cost_prohibitive',
      'other',
    ]

    if (!validCategories.includes(new_category)) {
      return NextResponse.json(
        { error: 'Invalid dismiss category' },
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
      .select('*, metrics_catalog(name)')
      .eq('id', recommendation_id)
      .single()

    if (fetchError || !rec) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      )
    }

    // Determine reactivatable and affects_materiality based on new category
    const categoryMeta = {
      not_material: { is_reactivatable: false, affects_materiality: true },
      not_priority: { is_reactivatable: true, affects_materiality: false },
      already_tracking: { is_reactivatable: false, affects_materiality: false },
      data_not_available: { is_reactivatable: true, affects_materiality: false },
      cost_prohibitive: { is_reactivatable: true, affects_materiality: false },
      other: { is_reactivatable: true, affects_materiality: false },
    }

    const meta = categoryMeta[new_category as keyof typeof categoryMeta]

    // Update recommendation with new category
    const { error: updateError } = await supabase
      .from('metric_recommendations')
      .update({
        dismissed_category: new_category,
        dismissed_notes: notes || null,
        is_reactivatable: meta.is_reactivatable,
        affects_materiality: meta.affects_materiality,
      })
      .eq('id', recommendation_id)

    if (updateError) {
      console.error('Error recategorizing metric:', updateError)
      return NextResponse.json(
        { error: 'Failed to recategorize metric' },
        { status: 500 }
      )
    }

    // Log the action
    await supabase.from('recommendation_actions').insert({
      recommendation_id,
      organization_id: rec.organization_id,
      action_type: 'recategorized',
      action_details: {
        old_category: rec.dismissed_category,
        new_category,
        notes,
      },
      performed_by: user.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Metric recategorized successfully',
      new_category,
      is_reactivatable: meta.is_reactivatable,
      affects_materiality: meta.affects_materiality,
    })
  } catch (error) {
    console.error('Error in recategorize API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
