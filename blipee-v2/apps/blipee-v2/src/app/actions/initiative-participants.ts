'use server'

import { createClient } from '@/lib/supabase/v2/server'
import { revalidatePath } from 'next/cache'
import type { InitiativeParticipant } from '@/lib/types/initiatives'

// ============================================================================
// PUBLIC ACCESS - Get initiative by access token
// ============================================================================

export async function getInitiativeByToken(
  accessToken: string
): Promise<{
  data?: {
    initiative: any
    participant: InitiativeParticipant
    organization: { name: string }
  }
  error?: string
}> {
  const supabase = await createClient()

  try {
    // Get participant by access token
    const { data: participant, error: participantError } = await supabase
      .from('initiative_participants')
      .select('*')
      .eq('access_token', accessToken)
      .single()

    if (participantError || !participant) {
      return { error: 'Invalid or expired access link' }
    }

    // Get initiative
    const { data: initiative, error: initiativeError } = await supabase
      .from('initiatives')
      .select('*')
      .eq('id', participant.initiative_id)
      .single()

    if (initiativeError || !initiative) {
      return { error: 'Initiative not found' }
    }

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', initiative.organization_id)
      .single()

    if (orgError || !organization) {
      return { error: 'Organization not found' }
    }

    // Update last accessed timestamp
    await supabase
      .from('initiative_participants')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('access_token', accessToken)

    return {
      data: {
        initiative,
        participant,
        organization,
      },
    }
  } catch (error) {
    console.error('Error fetching initiative by token:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// ACCEPT/REJECT INVITATION
// ============================================================================

export async function acceptInvitation(accessToken: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('initiative_participants')
      .update({
        invitation_status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('access_token', accessToken)

    if (error) throw error

    // Log activity
    const { data: participant } = await supabase
      .from('initiative_participants')
      .select('initiative_id, email, name')
      .eq('access_token', accessToken)
      .single()

    if (participant) {
      await supabase.from('initiative_activity_log').insert({
        initiative_id: participant.initiative_id,
        activity_type: 'participant_accepted',
        description: `${participant.name || participant.email} accepted the invitation`,
        metadata: { email: participant.email },
      })
    }

    revalidatePath(`/initiatives/view/${accessToken}`)
    return { success: true }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function rejectInvitation(accessToken: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { error } = await supabase
      .from('initiative_participants')
      .update({
        invitation_status: 'rejected',
        responded_at: new Date().toISOString(),
      })
      .eq('access_token', accessToken)

    if (error) throw error

    // Log activity
    const { data: participant } = await supabase
      .from('initiative_participants')
      .select('initiative_id, email, name')
      .eq('access_token', accessToken)
      .single()

    if (participant) {
      await supabase.from('initiative_activity_log').insert({
        initiative_id: participant.initiative_id,
        activity_type: 'participant_rejected',
        description: `${participant.name || participant.email} declined the invitation`,
        metadata: { email: participant.email },
      })
    }

    revalidatePath(`/initiatives/view/${accessToken}`)
    return { success: true }
  } catch (error) {
    console.error('Error rejecting invitation:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// GET INITIATIVE PARTICIPANTS
// ============================================================================

export async function getInitiativeParticipants(
  initiativeId: string
): Promise<{ data?: InitiativeParticipant[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('initiative_participants')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return { data: data || [] }
  } catch (error) {
    console.error('Error fetching participants:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// COMMENTS (Phase 3 - Simple version)
// ============================================================================

export async function addInitiativeComment(
  accessToken: string,
  comment: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    // Get participant to verify permissions
    const { data: participant, error: participantError } = await supabase
      .from('initiative_participants')
      .select('initiative_id, email, name, can_add_comments, invitation_status')
      .eq('access_token', accessToken)
      .single()

    if (participantError || !participant) {
      return { success: false, error: 'Invalid access token' }
    }

    if (participant.invitation_status !== 'accepted') {
      return { success: false, error: 'You must accept the invitation first' }
    }

    if (!participant.can_add_comments) {
      return { success: false, error: 'You do not have permission to add comments' }
    }

    // Add comment to activity log
    await supabase.from('initiative_activity_log').insert({
      initiative_id: participant.initiative_id,
      activity_type: 'comment',
      description: comment,
      metadata: {
        author: participant.name || participant.email,
        email: participant.email,
      },
    })

    revalidatePath(`/initiatives/view/${accessToken}`)
    return { success: true }
  } catch (error) {
    console.error('Error adding comment:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ============================================================================
// GET INITIATIVE ACTIVITY LOG
// ============================================================================

export async function getInitiativeActivity(
  initiativeId: string
): Promise<{ data?: any[]; error?: string }> {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('initiative_activity_log')
      .select('*')
      .eq('initiative_id', initiativeId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return { data: data || [] }
  } catch (error) {
    console.error('Error fetching activity:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
