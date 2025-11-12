'use server'

import { createClient } from '@/lib/supabase/v2/server'
import { revalidatePath } from 'next/cache'

export type MetricStatus = 'not_applicable' | 'add_to_tracking' | 'not_priority'

/**
 * Update metric tracking status for an organization
 */
export async function updateMetricStatus(
  metricCode: string,
  status: MetricStatus | null,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!membership) {
    return { success: false, error: 'No organization found' }
  }

  // Check permissions - only certain roles can modify tracking status
  const allowedRoles = ['account_owner', 'admin', 'sustainability_manager', 'sustainability_lead']
  if (!allowedRoles.includes(membership.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    if (status === null) {
      // Remove the status (reset to unset)
      const { error } = await supabase
        .from('metric_tracking_status')
        .delete()
        .eq('organization_id', membership.organization_id)
        .eq('metric_code', metricCode)

      if (error) throw error
    } else {
      // Upsert (insert or update)
      const { error } = await supabase.from('metric_tracking_status').upsert(
        {
          organization_id: membership.organization_id,
          metric_code: metricCode,
          status,
          notes: notes || null,
          created_by: user.id,
          updated_by: user.id,
        },
        {
          onConflict: 'organization_id,metric_code',
        }
      )

      if (error) throw error
    }

    // Revalidate the gap analysis page
    revalidatePath('/dashboard/gri/materiality')

    return { success: true }
  } catch (error) {
    console.error('Error updating metric status:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Bulk update metric tracking statuses
 */
export async function bulkUpdateMetricStatus(
  metricCodes: string[],
  status: MetricStatus | null
): Promise<{ success: boolean; error?: string; updatedCount?: number }> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!membership) {
    return { success: false, error: 'No organization found' }
  }

  // Check permissions
  const allowedRoles = ['account_owner', 'admin', 'sustainability_manager', 'sustainability_lead']
  if (!allowedRoles.includes(membership.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  try {
    if (status === null) {
      // Delete all statuses for these metrics
      const { error } = await supabase
        .from('metric_tracking_status')
        .delete()
        .eq('organization_id', membership.organization_id)
        .in('metric_code', metricCodes)

      if (error) throw error
    } else {
      // Bulk upsert
      const records = metricCodes.map((code) => ({
        organization_id: membership.organization_id,
        metric_code: code,
        status,
        created_by: user.id,
        updated_by: user.id,
      }))

      const { error } = await supabase.from('metric_tracking_status').upsert(records, {
        onConflict: 'organization_id,metric_code',
      })

      if (error) throw error
    }

    // Revalidate the gap analysis page
    revalidatePath('/dashboard/gri/materiality')

    return { success: true, updatedCount: metricCodes.length }
  } catch (error) {
    console.error('Error bulk updating metric statuses:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get all metric tracking statuses for the current user's organization
 */
export async function getMetricTrackingStatuses(): Promise<
  Map<string, MetricStatus> | { error: string }
> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!membership) {
    return { error: 'No organization found' }
  }

  try {
    const { data, error } = await supabase
      .from('metric_tracking_status')
      .select('metric_code, status')
      .eq('organization_id', membership.organization_id)

    if (error) throw error

    // Convert to Map
    const statusMap = new Map<string, MetricStatus>()
    data?.forEach((record) => {
      statusMap.set(record.metric_code, record.status as MetricStatus)
    })

    return statusMap
  } catch (error) {
    console.error('Error fetching metric statuses:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get metrics marked as "add_to_tracking" with full details from metrics_catalog
 */
export async function getMetricsForTracking(): Promise<{
  data?: Array<{
    code: string
    name: string
    description: string | null
    unit: string | null
    category: string | null
    subcategory: string | null
    gri_disclosure: string | null
    gri_disclosure_title: string | null
  }>
  error?: string
}> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Get user's organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!membership) {
    return { error: 'No organization found' }
  }

  try {
    // Get metrics marked for tracking
    const { data: trackingStatuses, error: statusError } = await supabase
      .from('metric_tracking_status')
      .select('metric_code')
      .eq('organization_id', membership.organization_id)
      .eq('status', 'add_to_tracking')

    if (statusError) throw statusError

    if (!trackingStatuses || trackingStatuses.length === 0) {
      return { data: [] }
    }

    const metricCodes = trackingStatuses.map((s) => s.metric_code)

    // Get full metric details from metrics_catalog
    const { data: metrics, error: metricsError } = await supabase
      .from('metrics_catalog')
      .select('code, name, description, unit, category, subcategory, gri_disclosure, gri_disclosure_title')
      .in('code', metricCodes)
      .eq('is_active', true)
      .order('gri_disclosure', { ascending: true })
      .order('code', { ascending: true })

    if (metricsError) throw metricsError

    return { data: metrics || [] }
  } catch (error) {
    console.error('Error fetching metrics for tracking:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
