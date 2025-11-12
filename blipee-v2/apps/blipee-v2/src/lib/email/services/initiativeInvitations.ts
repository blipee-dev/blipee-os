/**
 * Service for sending initiative invitation emails
 */

import { sendEmail } from '../mailer'
import { generateInitiativeInvitationEmail } from '../templates/initiative-invitation'
import type { ParticipantRole } from '@/lib/types/initiatives'

interface SendInitiativeInvitationParams {
  participantEmail: string
  participantName?: string | null
  initiativeName: string
  initiativeDescription?: string | null
  organizationName: string
  invitedByName: string
  role: ParticipantRole
  canEdit: boolean
  accessToken: string
}

/**
 * Send initiative invitation email to a participant
 */
export async function sendInitiativeInvitation(
  params: SendInitiativeInvitationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Generate email content
    const { subject, html, text } = generateInitiativeInvitationEmail({
      participantName: params.participantName || null,
      participantEmail: params.participantEmail,
      initiativeName: params.initiativeName,
      initiativeDescription: params.initiativeDescription || null,
      organizationName: params.organizationName,
      invitedByName: params.invitedByName,
      role: params.role,
      canEdit: params.canEdit,
      accessToken: params.accessToken,
      appUrl,
    })

    // Send email
    const result = await sendEmail({
      to: params.participantEmail,
      subject,
      html,
      text,
    })

    if (!result.success) {
      console.error('Failed to send initiative invitation:', result.error)
      return { success: false, error: result.error }
    }

    console.log(`Initiative invitation sent to ${params.participantEmail}`)
    return { success: true }
  } catch (error) {
    console.error('Error sending initiative invitation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Send initiative invitations to multiple participants
 */
export async function sendInitiativeInvitations(
  participants: SendInitiativeInvitationParams[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.allSettled(participants.map((p) => sendInitiativeInvitation(p)))

  const sent = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
  const failed = results.length - sent
  const errors = results
    .filter((r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success))
    .map((r) => {
      if (r.status === 'rejected') {
        return r.reason?.message || 'Unknown error'
      } else if (r.status === 'fulfilled') {
        return r.value.error || 'Unknown error'
      }
      return 'Unknown error'
    })

  return { sent, failed, errors }
}
