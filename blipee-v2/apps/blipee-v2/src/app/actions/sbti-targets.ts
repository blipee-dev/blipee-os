'use server'

import { createClient } from '@/lib/supabase/v2/server'
import { revalidatePath } from 'next/cache'
import type {
  SustainabilityTarget,
  CreateTargetInput,
  UpdateTargetInput,
  UpdateProgressInput,
  TargetSummary,
  TargetWithProgress,
} from '@/lib/types/sbti-targets'

// ============================================================================
// HELPER: Get user's organization
// ============================================================================
async function getUserOrganization() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!membership) {
    return { error: 'No organization found' }
  }

  return { user, organization_id: membership.organization_id, role: membership.role }
}

// ============================================================================
// GET TARGETS
// ============================================================================

export async function getTargets(): Promise<{
  data?: TargetWithProgress[]
  error?: string
}> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', auth.organization_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Enhance with progress calculations
    const targetsWithProgress = (data || []).map((target) => {
      const daysToTarget = target.target_year
        ? Math.floor(
            (new Date(target.target_year, 11, 31).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null

      const annualReductionNeeded =
        target.baseline_emissions &&
        target.target_emissions &&
        target.current_emissions &&
        target.target_year
          ? (target.current_emissions - target.target_emissions) /
            (target.target_year - new Date().getFullYear())
          : null

      const onTrackForTarget =
        target.progress_percent !== null ? target.progress_percent >= 90 : null

      return {
        ...target,
        days_to_target: daysToTarget,
        annual_reduction_needed: annualReductionNeeded,
        on_track_for_target: onTrackForTarget,
      }
    })

    return { data: targetsWithProgress }
  } catch (error) {
    console.error('Error fetching targets:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function getTarget(targetId: string): Promise<{
  data?: TargetWithProgress
  error?: string
}> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('sustainability_targets')
      .select('*')
      .eq('id', targetId)
      .eq('organization_id', auth.organization_id)
      .single()

    if (error) throw error

    // Get related reduction initiatives count
    const { count } = await supabase
      .from('reduction_initiatives')
      .select('*', { count: 'exact', head: true })
      .eq('sustainability_target_id', targetId)

    const daysToTarget = data.target_year
      ? Math.floor(
          (new Date(data.target_year, 11, 31).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : null

    return {
      data: {
        ...data,
        reduction_initiatives_count: count || 0,
        days_to_target: daysToTarget,
      },
    }
  } catch (error) {
    console.error('Error fetching target:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// CREATE TARGET
// ============================================================================

export async function createTarget(
  input: CreateTargetInput
): Promise<{ data?: SustainabilityTarget; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const allowedRoles = ['account_owner', 'admin', 'sustainability_manager', 'sustainability_lead']
  if (!allowedRoles.includes(auth.role)) {
    return { error: 'Insufficient permissions' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('sustainability_targets')
      .insert({
        organization_id: auth.organization_id,
        ...input,
        is_active: true,
        target_status: input.target_status || 'draft',
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/dashboard/sbti-targets')
    return { data }
  } catch (error) {
    console.error('Error creating target:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// UPDATE TARGET
// ============================================================================

export async function updateTarget(
  input: UpdateTargetInput
): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const allowedRoles = ['account_owner', 'admin', 'sustainability_manager', 'sustainability_lead']
  if (!allowedRoles.includes(auth.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const supabase = await createClient()

  try {
    const { id, ...updateData } = input

    const { error } = await supabase
      .from('sustainability_targets')
      .update(updateData)
      .eq('id', id)
      .eq('organization_id', auth.organization_id)

    if (error) throw error

    revalidatePath('/dashboard/sbti-targets')
    revalidatePath(`/dashboard/sbti-targets/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating target:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// DELETE TARGET
// ============================================================================

export async function deleteTarget(targetId: string): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const allowedRoles = ['account_owner', 'admin', 'sustainability_manager']
  if (!allowedRoles.includes(auth.role)) {
    return { success: false, error: 'Insufficient permissions' }
  }

  const supabase = await createClient()

  try {
    // Soft delete
    const { error } = await supabase
      .from('sustainability_targets')
      .update({ is_active: false })
      .eq('id', targetId)
      .eq('organization_id', auth.organization_id)

    if (error) throw error

    revalidatePath('/dashboard/sbti-targets')
    return { success: true }
  } catch (error) {
    console.error('Error deleting target:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// UPDATE PROGRESS
// ============================================================================

export async function updateProgress(
  input: UpdateProgressInput
): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const supabase = await createClient()

  try {
    // Get target to calculate progress
    const { data: target } = await supabase
      .from('sustainability_targets')
      .select('baseline_emissions, target_emissions')
      .eq('id', input.target_id)
      .single()

    if (!target) {
      return { success: false, error: 'Target not found' }
    }

    // Calculate progress percentage
    let progressPercent = null
    let progressStatus = null

    if (target.baseline_emissions && target.target_emissions) {
      const totalReduction = target.baseline_emissions - target.target_emissions
      const currentReduction = target.baseline_emissions - input.current_emissions
      progressPercent = (currentReduction / totalReduction) * 100

      // Determine status
      if (progressPercent >= 90) {
        progressStatus = 'on_track'
      } else if (progressPercent >= 70) {
        progressStatus = 'at_risk'
      } else {
        progressStatus = 'off_track'
      }
    }

    const { error } = await supabase
      .from('sustainability_targets')
      .update({
        current_emissions: input.current_emissions,
        current_emissions_date: input.current_emissions_date,
        current_value: input.current_value,
        progress_percent: progressPercent,
        progress_status: progressStatus,
        current_as_of: input.current_emissions_date,
      })
      .eq('id', input.target_id)
      .eq('organization_id', auth.organization_id)

    if (error) throw error

    revalidatePath('/dashboard/sbti-targets')
    revalidatePath(`/dashboard/sbti-targets/${input.target_id}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating progress:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// GET SUMMARY
// ============================================================================

export async function getTargetsSummary(): Promise<{
  data?: TargetSummary
  error?: string
}> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { data: targets, error } = await supabase
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', auth.organization_id)
      .eq('is_active', true)

    if (error) throw error

    const summary: TargetSummary = {
      total_targets: targets?.length || 0,
      validated_targets: targets?.filter((t) => t.sbti_validated).length || 0,
      submitted_targets: targets?.filter((t) => t.sbti_submission_date && !t.sbti_validated).length || 0,
      draft_targets: targets?.filter((t) => !t.sbti_submission_date).length || 0,
      active_targets: targets?.filter((t) => t.target_status === 'active').length || 0,
      scope_1_2_coverage: targets?.[0]?.scope_1_2_coverage_percent || null,
      scope_3_coverage: targets?.[0]?.scope_3_coverage_percent || null,
      on_track_count: targets?.filter((t) => t.progress_status === 'on_track').length || 0,
      at_risk_count: targets?.filter((t) => t.progress_status === 'at_risk').length || 0,
      off_track_count: targets?.filter((t) => t.progress_status === 'off_track').length || 0,
    }

    return { data: summary }
  } catch (error) {
    console.error('Error fetching summary:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
