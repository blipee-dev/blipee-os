import { createClient } from '@/lib/supabase/v2/server'

export interface DismissedMetric {
  id: string
  metric_id: string
  metric_name: string
  metric_code: string
  category: string
  recommendation_reason: string
  dismissed_at: string
  dismissed_by: string
  dismissed_category:
    | 'not_material'
    | 'not_priority'
    | 'already_tracking'
    | 'data_not_available'
    | 'cost_prohibitive'
    | 'other'
  dismissed_notes: string | null
  is_reactivatable: boolean
  affects_materiality: boolean
  peer_adoption_percent: number | null
  gri_disclosure: string | null
  required_for_frameworks: string[] | null
}

export interface DismissedBreakdown {
  category: string
  category_label: string
  metric_count: number
  is_reactivatable: boolean
  affects_materiality: boolean
}

export interface GRIMateriality {
  gri_standard: string
  standard_name: string
  is_material: boolean
  total_metrics: number
  material_metrics: number
  not_material_metrics: number
  pending_assessment: number
  materiality_percentage: number
  material_disclosures: string[] | null
  peer_adoption_avg: number | null
}

/**
 * Get all dismissed metrics for an organization
 */
export async function getDismissedMetrics(
  organizationId: string
): Promise<{
  not_material: DismissedMetric[]
  can_reactivate: DismissedMetric[]
  all: DismissedMetric[]
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metric_recommendations')
    .select(
      `
      id,
      metric_catalog_id,
      recommendation_reason,
      dismissed_at,
      dismissed_category,
      dismissed_notes,
      is_reactivatable,
      affects_materiality,
      peer_adoption_percent,
      gri_disclosure,
      required_for_frameworks,
      metric:metrics_catalog(
        id,
        name,
        code,
        category
      ),
      dismissed_by_user:auth.users!dismissed_by(
        id,
        email
      )
    `
    )
    .eq('organization_id', organizationId)
    .eq('status', 'dismissed')
    .order('dismissed_at', { ascending: false })

  if (error) {
    console.error('Error fetching dismissed metrics:', error)
    throw error
  }

  const dismissed: DismissedMetric[] = (data || []).map((rec: any) => ({
    id: rec.id,
    metric_id: rec.metric_catalog_id,
    metric_name: rec.metric?.name || 'Unknown',
    metric_code: rec.metric?.code || '',
    category: rec.metric?.category || '',
    recommendation_reason: rec.recommendation_reason,
    dismissed_at: rec.dismissed_at,
    dismissed_by: rec.dismissed_by_user?.email || 'Unknown',
    dismissed_category: rec.dismissed_category,
    dismissed_notes: rec.dismissed_notes,
    is_reactivatable: rec.is_reactivatable,
    affects_materiality: rec.affects_materiality,
    peer_adoption_percent: rec.peer_adoption_percent,
    gri_disclosure: rec.gri_disclosure,
    required_for_frameworks: rec.required_for_frameworks,
  }))

  return {
    not_material: dismissed.filter((m) => !m.is_reactivatable),
    can_reactivate: dismissed.filter((m) => m.is_reactivatable),
    all: dismissed,
  }
}

/**
 * Get breakdown of dismissed metrics by category
 */
export async function getDismissedBreakdown(
  organizationId: string
): Promise<DismissedBreakdown[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('get_dismissed_metrics_breakdown', {
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('Error fetching dismissed breakdown:', error)
    return []
  }

  return data || []
}

/**
 * Calculate GRI materiality assessment from dismissals
 */
export async function getGRIMateriality(organizationId: string): Promise<GRIMateriality[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('calculate_gri_materiality', {
    p_organization_id: organizationId,
  })

  if (error) {
    console.error('Error calculating GRI materiality:', error)
    return []
  }

  return data || []
}

/**
 * Reactivate a dismissed metric
 */
export async function reactivateMetric(
  recommendationId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current recommendation
  const { data: rec, error: fetchError } = await supabase
    .from('metric_recommendations')
    .select('*')
    .eq('id', recommendationId)
    .single()

  if (fetchError || !rec) {
    return { success: false, error: 'Recommendation not found' }
  }

  // Check if reactivatable
  if (!rec.is_reactivatable) {
    return { success: false, error: 'This metric cannot be reactivated' }
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  // Create reactivation record
  const { error: reactivationError } = await supabase.from('metric_reactivations').insert({
    recommendation_id: recommendationId,
    organization_id: rec.organization_id,
    reactivated_by: user.id,
    reactivation_reason: reason,
    original_dismiss_category: rec.dismissed_category,
    original_dismiss_reason: rec.dismissed_reason,
    original_dismiss_date: rec.dismissed_at,
  })

  if (reactivationError) {
    console.error('Error creating reactivation record:', reactivationError)
    return { success: false, error: 'Failed to create reactivation record' }
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
    .eq('id', recommendationId)

  if (updateError) {
    console.error('Error reactivating metric:', updateError)
    return { success: false, error: 'Failed to reactivate metric' }
  }

  return { success: true }
}

/**
 * Get summary stats for initiatives dashboard
 */
export async function getInitiativesStats(organizationId: string): Promise<{
  total_dismissed: number
  can_reactivate: number
  permanently_dismissed: number
  affects_materiality: number
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metric_recommendations')
    .select('is_reactivatable, affects_materiality')
    .eq('organization_id', organizationId)
    .eq('status', 'dismissed')

  if (error) {
    console.error('Error fetching initiatives stats:', error)
    return {
      total_dismissed: 0,
      can_reactivate: 0,
      permanently_dismissed: 0,
      affects_materiality: 0,
    }
  }

  const metrics = data || []

  return {
    total_dismissed: metrics.length,
    can_reactivate: metrics.filter((m) => m.is_reactivatable).length,
    permanently_dismissed: metrics.filter((m) => !m.is_reactivatable).length,
    affects_materiality: metrics.filter((m) => m.affects_materiality).length,
  }
}
