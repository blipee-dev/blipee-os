'use server'

import { createClient } from '@/lib/supabase/v2/server'
import { revalidatePath } from 'next/cache'
import type {
  CreateInitiativeInput,
  UpdateInitiativeInput,
  CreateInitiativeMetricInput,
  UpdateInitiativeMetricInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  Initiative,
  InitiativeWithDetails,
  InitiativesSummary,
} from '@/lib/types/initiatives'

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
// INITIATIVES CRUD
// ============================================================================

/**
 * Get all initiatives for user's organization
 */
export async function getInitiatives(): Promise<{
  data?: InitiativeWithDetails[]
  error?: string
}> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('initiatives')
      .select('*')
      .eq('organization_id', auth.organization_id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate overall progress for each initiative
    const initiativesWithProgress = await Promise.all(
      (data || []).map(async (initiative: any) => {
        // Get metrics count
        const { count: metricsCount } = await supabase
          .from('initiative_metrics')
          .select('*', { count: 'exact', head: true })
          .eq('initiative_id', initiative.id)

        // Get milestones count
        const { count: milestonesCount } = await supabase
          .from('initiative_milestones')
          .select('*', { count: 'exact', head: true })
          .eq('initiative_id', initiative.id)

        // Get completed milestones count
        const { count: completedMilestonesCount } = await supabase
          .from('initiative_milestones')
          .select('*', { count: 'exact', head: true })
          .eq('initiative_id', initiative.id)
          .eq('completed', true)

        // Calculate progress
        const { data: progressData } = await supabase.rpc('calculate_initiative_progress', {
          p_initiative_id: initiative.id,
        })

        return {
          ...initiative,
          owner_name: null,
          owner_email: null,
          metrics_count: metricsCount || 0,
          milestones_count: milestonesCount || 0,
          completed_milestones_count: completedMilestonesCount || 0,
          overall_progress: progressData || 0,
        }
      })
    )

    return { data: initiativesWithProgress }
  } catch (error) {
    console.error('Error fetching initiatives:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get single initiative with full details
 */
export async function getInitiative(
  initiativeId: string
): Promise<{ data?: InitiativeWithDetails; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const supabase = await createClient()

  try {
    // Get initiative
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', initiativeId)
      .eq('organization_id', auth.organization_id)
      .single()

    if (initiativeError) throw initiativeError

    // Get metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('initiative_metrics')
      .select('*')
      .eq('initiative_id', initiativeId)

    if (metricsError) throw metricsError

    // Get milestones
    const { data: milestones, error: milestonesError } = await supabase
      .from('initiative_milestones')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('display_order', { ascending: true })

    if (milestonesError) throw milestonesError

    // Calculate progress
    const { data: progress } = await supabase.rpc('calculate_initiative_progress', {
      p_initiative_id: initiativeId,
    })

    return {
      data: {
        ...initiative,
        owner_name: null,
        owner_email: null,
        overall_progress: progress || 0,
        metrics_count: metrics?.length || 0,
        milestones_count: milestones?.length || 0,
        completed_milestones_count: milestones?.filter((m) => m.completed).length || 0,
        metrics,
        milestones,
      },
    }
  } catch (error) {
    console.error('Error fetching initiative:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Create new initiative
 */
export async function createInitiative(
  input: CreateInitiativeInput
): Promise<{ data?: Initiative; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  // Check permissions
  const allowedRoles = ['account_owner', 'admin', 'sustainability_manager', 'sustainability_lead']
  if (!allowedRoles.includes(auth.role)) {
    return { error: 'Insufficient permissions' }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('initiatives')
      .insert({
        organization_id: auth.organization_id,
        name: input.name,
        description: input.description || null,
        status: input.status || 'planning',
        priority: input.priority || 'medium',
        start_date: input.start_date || null,
        target_date: input.target_date || null,
        budget: input.budget || null,
        budget_currency: input.budget_currency || 'EUR',
        owner_id: input.owner_id || auth.user.id,
        team_members: input.team_members || [],
        created_by: auth.user.id,
        updated_by: auth.user.id,
      })
      .select()
      .single()

    if (error) throw error

    // Add owner as participant if they're not already in the list
    const ownerId = input.owner_id || auth.user.id
    const ownerEmail = auth.user.email

    // Get owner info
    const { data: ownerProfile } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('id', ownerId)
      .single()

    const participants = input.participants || []
    const ownerAlreadyAdded = participants.some((p) => p.email === (ownerProfile?.email || ownerEmail))

    if (!ownerAlreadyAdded && ownerProfile) {
      // Add owner as participant
      await supabase.from('initiative_participants').insert({
        initiative_id: data.id,
        user_id: ownerId,
        email: ownerProfile.email,
        name: ownerProfile.full_name,
        role: 'owner',
        can_edit: true,
        can_view_metrics: true,
        can_add_comments: true,
        invitation_status: 'accepted', // Owner auto-accepts
        invited_by: auth.user.id,
        responded_at: new Date().toISOString(),
      })
    }

    // Add other participants
    if (participants.length > 0) {
      // Check which emails belong to registered users
      const participantEmails = participants.map((p) => p.email)
      const { data: registeredUsers } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('email', participantEmails)

      const userEmailMap = new Map(registeredUsers?.map((u) => [u.email, u]) || [])

      const participantsToInsert = participants.map((p) => {
        const registeredUser = userEmailMap.get(p.email)

        return {
          initiative_id: data.id,
          user_id: registeredUser?.id || null,
          email: p.email,
          name: p.name || registeredUser?.full_name || null,
          role: p.role,
          can_edit: p.can_edit ?? false,
          can_view_metrics: p.can_view_metrics ?? true,
          can_add_comments: p.can_add_comments ?? true,
          invitation_status: 'pending',
          invited_by: auth.user.id,
        }
      })

      const { data: insertedParticipants, error: participantsError } = await supabase
        .from('initiative_participants')
        .insert(participantsToInsert)
        .select('email, name, role, can_edit, access_token')

      if (participantsError) {
        console.error('Error adding participants:', participantsError)
        // Don't fail the entire operation, just log the error
      } else if (insertedParticipants && insertedParticipants.length > 0) {
        // Send email invitations to all participants
        try {
          // Get organization name
          const { data: organization } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', auth.organization_id)
            .single()

          // Get inviter's name
          const { data: inviterProfile } = await supabase
            .from('user_profiles')
            .select('full_name, email')
            .eq('id', auth.user.id)
            .single()

          const inviterName = inviterProfile?.full_name || inviterProfile?.email || 'A team member'
          const organizationName = organization?.name || 'Your organization'

          // Import email service
          const { sendInitiativeInvitations } = await import('@/lib/email/services/initiativeInvitations')

          // Prepare email data for all participants
          const emailInvitations = insertedParticipants.map((participant) => ({
            participantEmail: participant.email,
            participantName: participant.name,
            initiativeName: input.name,
            initiativeDescription: input.description,
            organizationName,
            invitedByName: inviterName,
            role: participant.role,
            canEdit: participant.can_edit,
            accessToken: participant.access_token,
          }))

          // Send all invitations
          const emailResults = await sendInitiativeInvitations(emailInvitations)

          if (emailResults.failed > 0) {
            console.error(
              `Failed to send ${emailResults.failed} invitation emails:`,
              emailResults.errors
            )
          }

          console.log(
            `Successfully sent ${emailResults.sent} invitation emails for initiative "${input.name}"`
          )
        } catch (emailError) {
          console.error('Error sending invitation emails:', emailError)
          // Don't fail the initiative creation if emails fail
        }
      }
    }

    // Log activity
    await supabase.from('initiative_activity_log').insert({
      initiative_id: data.id,
      activity_type: 'created',
      description: `Initiative "${input.name}" created`,
      user_id: auth.user.id,
    })

    revalidatePath('/dashboard/initiatives')
    return { data }
  } catch (error) {
    console.error('Error creating initiative:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update initiative
 */
export async function updateInitiative(
  initiativeId: string,
  input: UpdateInitiativeInput
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
    const { error } = await supabase
      .from('initiatives')
      .update({
        ...input,
        updated_by: auth.user.id,
      })
      .eq('id', initiativeId)
      .eq('organization_id', auth.organization_id)

    if (error) throw error

    // Log activity
    const changes = Object.keys(input).join(', ')
    await supabase.from('initiative_activity_log').insert({
      initiative_id: initiativeId,
      activity_type: 'updated',
      description: `Initiative updated: ${changes}`,
      user_id: auth.user.id,
      metadata: input,
    })

    revalidatePath('/dashboard/initiatives')
    revalidatePath(`/dashboard/initiatives/${initiativeId}`)
    return { success: true }
  } catch (error) {
    console.error('Error updating initiative:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete initiative
 */
export async function deleteInitiative(initiativeId: string): Promise<{ success: boolean; error?: string }> {
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
    const { error } = await supabase
      .from('initiatives')
      .delete()
      .eq('id', initiativeId)
      .eq('organization_id', auth.organization_id)

    if (error) throw error

    revalidatePath('/dashboard/initiatives')
    return { success: true }
  } catch (error) {
    console.error('Error deleting initiative:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// METRICS MANAGEMENT
// ============================================================================

/**
 * Add metric to initiative
 */
export async function addMetricToInitiative(
  initiativeId: string,
  input: CreateInitiativeMetricInput
): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.from('initiative_metrics').insert({
      initiative_id: initiativeId,
      metric_code: input.metric_code,
      target_value: input.target_value || null,
      target_unit: input.target_unit || null,
      baseline_value: input.baseline_value || null,
      baseline_date: input.baseline_date || null,
      notes: input.notes || null,
    })

    if (error) throw error

    // Log activity
    await supabase.from('initiative_activity_log').insert({
      initiative_id: initiativeId,
      activity_type: 'metric_added',
      description: `Metric ${input.metric_code} added to initiative`,
      user_id: auth.user.id,
    })

    revalidatePath(`/dashboard/initiatives/${initiativeId}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding metric:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update metric progress
 */
export async function updateMetricProgress(
  metricId: string,
  input: UpdateInitiativeMetricInput
): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.from('initiative_metrics').update(input).eq('id', metricId)

    if (error) throw error

    revalidatePath('/dashboard/initiatives')
    return { success: true }
  } catch (error) {
    console.error('Error updating metric:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Remove metric from initiative
 */
export async function removeMetricFromInitiative(metricId: string): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.from('initiative_metrics').delete().eq('id', metricId)

    if (error) throw error

    revalidatePath('/dashboard/initiatives')
    return { success: true }
  } catch (error) {
    console.error('Error removing metric:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// MILESTONES MANAGEMENT
// ============================================================================

/**
 * Create milestone
 */
export async function createMilestone(
  initiativeId: string,
  input: CreateMilestoneInput
): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { error } = await supabase.from('initiative_milestones').insert({
      initiative_id: initiativeId,
      title: input.title,
      description: input.description || null,
      due_date: input.due_date || null,
      display_order: input.display_order || 0,
    })

    if (error) throw error

    revalidatePath(`/dashboard/initiatives/${initiativeId}`)
    return { success: true }
  } catch (error) {
    console.error('Error creating milestone:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Toggle milestone completion
 */
export async function toggleMilestone(milestoneId: string): Promise<{ success: boolean; error?: string }> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { success: false, error: auth.error }
  }

  const supabase = await createClient()

  try {
    // Get current state
    const { data: milestone } = await supabase
      .from('initiative_milestones')
      .select('completed')
      .eq('id', milestoneId)
      .single()

    const newCompleted = !milestone?.completed

    const { error } = await supabase
      .from('initiative_milestones')
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        completed_by: newCompleted ? auth.user.id : null,
      })
      .eq('id', milestoneId)

    if (error) throw error

    revalidatePath('/dashboard/initiatives')
    return { success: true }
  } catch (error) {
    console.error('Error toggling milestone:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// SUMMARY & STATS
// ============================================================================

/**
 * Get initiatives summary
 */
export async function getInitiativesSummary(): Promise<{
  data?: InitiativesSummary
  error?: string
}> {
  const auth = await getUserOrganization()
  if ('error' in auth) {
    return { error: auth.error }
  }

  const supabase = await createClient()

  try {
    const { data, error } = await supabase.rpc('get_initiatives_summary', {
      p_organization_id: auth.organization_id,
    })

    if (error) throw error

    return { data: data?.[0] || null }
  } catch (error) {
    console.error('Error fetching summary:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
