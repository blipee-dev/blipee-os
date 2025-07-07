import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export interface TeamMember {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
  status: 'active' | 'pending' | 'inactive'
  invitedBy: string
  invitedAt: Date
  joinedAt?: Date
  lastActive?: Date
}

export interface TeamInvite {
  email: string
  role: string
  customPermissions?: string[]
  message?: string
}

export class TeamManagementService {
  // Invite team members
  async inviteTeamMembers(
    organizationId: string,
    invitedBy: string,
    invites: TeamInvite[]
  ): Promise<{ success: boolean; invited: string[]; failed: string[] }> {
    const invited: string[] = []
    const failed: string[] = []

    for (const invite of invites) {
      try {
        // Check if user already exists
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('email', invite.email)
          .single()

        if (existingMember) {
          failed.push(invite.email)
          continue
        }

        // Create invitation record
        const { error: inviteError } = await supabase
          .from('team_invitations')
          .insert({
            organization_id: organizationId,
            email: invite.email,
            role: invite.role,
            custom_permissions: invite.customPermissions,
            invited_by: invitedBy,
            status: 'pending',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          })

        if (inviteError) {
          failed.push(invite.email)
          continue
        }

        // Send invitation email (in production)
        await this.sendInvitationEmail(invite.email, organizationId, invite.message)
        
        invited.push(invite.email)
      } catch (error) {
        console.error(`Failed to invite ${invite.email}:`, error)
        failed.push(invite.email)
      }
    }

    return { success: failed.length === 0, invited, failed }
  }

  // Update team member role
  async updateMemberRole(
    organizationId: string,
    memberId: string,
    newRole: string,
    customPermissions?: string[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          role: newRole,
          custom_permissions: customPermissions,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('id', memberId)

      return !error
    } catch (error) {
      console.error('Failed to update member role:', error)
      return false
    }
  }

  // Remove team member
  async removeMember(
    organizationId: string,
    memberId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({
          status: 'inactive',
          removed_at: new Date().toISOString()
        })
        .eq('organization_id', organizationId)
        .eq('id', memberId)

      return !error
    } catch (error) {
      console.error('Failed to remove member:', error)
      return false
    }
  }

  // Get team members
  async getTeamMembers(organizationId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', organizationId)
        .neq('status', 'inactive')
        .order('created_at', { ascending: false })

      if (error) throw error

      return data.map(member => ({
        id: member.id,
        email: member.email,
        name: member.name || member.email,
        role: member.role,
        permissions: this.getRolePermissions(member.role).concat(member.custom_permissions || []),
        status: member.status,
        invitedBy: member.invited_by,
        invitedAt: new Date(member.created_at),
        joinedAt: member.joined_at ? new Date(member.joined_at) : undefined,
        lastActive: member.last_active ? new Date(member.last_active) : undefined
      }))
    } catch (error) {
      console.error('Failed to get team members:', error)
      return []
    }
  }

  // Check user permission
  async checkPermission(
    userId: string,
    organizationId: string,
    permission: string
  ): Promise<boolean> {
    try {
      const { data: member } = await supabase
        .from('team_members')
        .select('role, custom_permissions')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single()

      if (!member) return false

      // Account owner has all permissions
      if (member.role === 'account_owner') return true

      // Check role permissions
      const rolePermissions = this.getRolePermissions(member.role)
      if (rolePermissions.includes(permission) || rolePermissions.includes('*')) {
        return true
      }

      // Check custom permissions
      if (member.custom_permissions?.includes(permission)) {
        return true
      }

      return false
    } catch (error) {
      console.error('Failed to check permission:', error)
      return false
    }
  }

  // Get role permissions
  private getRolePermissions(role: string): string[] {
    const rolePermissions: Record<string, string[]> = {
      account_owner: ['*'],
      sustainability_manager: [
        'targets.create', 'targets.edit', 'targets.delete',
        'compliance.view', 'compliance.manage',
        'reports.create', 'reports.export',
        'emissions.view', 'emissions.edit'
      ],
      facility_manager: [
        'buildings.view', 'buildings.edit',
        'equipment.view', 'equipment.manage',
        'emissions.view', 'emissions.edit',
        'reports.view'
      ],
      analyst: [
        'emissions.view',
        'reports.view', 'reports.create',
        'analytics.view',
        'targets.view'
      ],
      viewer: [
        'emissions.view',
        'reports.view',
        'targets.view'
      ]
    }

    return rolePermissions[role] || []
  }

  // Send invitation email (placeholder)
  private async sendInvitationEmail(
    email: string,
    organizationId: string,
    message?: string
  ): Promise<void> {
    // In production, integrate with email service
    console.log(`Sending invitation to ${email} for organization ${organizationId}`)
    if (message) {
      console.log(`Custom message: ${message}`)
    }
  }

  // Accept invitation
  async acceptInvitation(
    invitationCode: string,
    userId: string
  ): Promise<{ success: boolean; organizationId?: string }> {
    try {
      // Get invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('code', invitationCode)
        .eq('status', 'pending')
        .single()

      if (inviteError || !invitation) {
        return { success: false }
      }

      // Check expiration
      if (new Date(invitation.expires_at) < new Date()) {
        return { success: false }
      }

      // Create team member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          organization_id: invitation.organization_id,
          user_id: userId,
          email: invitation.email,
          role: invitation.role,
          custom_permissions: invitation.custom_permissions,
          status: 'active',
          invited_by: invitation.invited_by,
          joined_at: new Date().toISOString()
        })

      if (memberError) {
        return { success: false }
      }

      // Update invitation status
      await supabase
        .from('team_invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('code', invitationCode)

      return { success: true, organizationId: invitation.organization_id }
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      return { success: false }
    }
  }
}

export const teamManagement = new TeamManagementService()