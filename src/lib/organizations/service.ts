import { createClient } from '@/lib/supabase/client'
import type {
  Organization,
  Building,
  OrganizationMember,
  BuildingAssignment,
  UserRole,
  InvitationStatus
} from '@/types/auth'

export class OrganizationService {
  private supabase = createClient()

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching organization:', error)
      return null
    }

    return data
  }

  /**
   * Update organization settings
   */
  async updateOrganization(
    id: string, 
    updates: Partial<Organization>
  ): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from('organizations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating organization:', error)
      return null
    }

    return data
  }

  /**
   * Get all buildings for an organization
   */
  async getOrganizationBuildings(organizationId: string): Promise<Building[]> {
    const { data, error } = await this.supabase
      .from('buildings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name')

    if (error) {
      console.error('Error fetching buildings:', error)
      return []
    }

    return data || []
  }

  /**
   * Create a new building
   */
  async createBuilding(
    organizationId: string,
    buildingData: Partial<Building>
  ): Promise<Building | null> {
    const slug = this.generateSlug(buildingData.name || '')

    const { data, error } = await this.supabase
      .from('buildings')
      .insert({
        organization_id: organizationId,
        slug,
        ...buildingData
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating building:', error)
      return null
    }

    return data
  }

  /**
   * Update building information
   */
  async updateBuilding(
    id: string,
    updates: Partial<Building>
  ): Promise<Building | null> {
    const { data, error } = await this.supabase
      .from('buildings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating building:', error)
      return null
    }

    return data
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(
    organizationId: string
  ): Promise<OrganizationMember[]> {
    const { data, error } = await this.supabase
      .from('organization_members')
      .select(`
        *,
        user:user_profiles(*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at')

    if (error) {
      console.error('Error fetching members:', error)
      return []
    }

    return data || []
  }

  /**
   * Invite user to organization
   */
  async inviteUser(
    organizationId: string,
    email: string,
    role: UserRole,
    invitedBy: string
  ): Promise<OrganizationMember | null> {
    try {
      // First check if user exists
      let { data: userProfile } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      // If user doesn't exist, create a placeholder profile
      if (!userProfile) {
        const { data: newProfile, error: profileError } = await this.supabase
          .from('user_profiles')
          .insert({
            email,
            onboarding_completed: false
          })
          .select()
          .single()

        if (profileError) throw profileError
        userProfile = newProfile
      }

      // Create invitation
      if (!userProfile) {
        throw new Error('Failed to create or find user profile')
      }

      const { data, error } = await this.supabase
        .from('organization_members')
        .insert({
          organization_id: organizationId,
          user_id: userProfile.id,
          role,
          invitation_status: 'pending' as InvitationStatus,
          invited_by: invitedBy,
          invited_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // TODO: Send invitation email

      return data
    } catch (error) {
      console.error('Error inviting user:', error)
      return null
    }
  }

  /**
   * Remove user from organization
   */
  async removeUser(
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing user:', error)
      return false
    }

    // Also remove building assignments
    const { data: buildings } = await this.supabase
      .from('buildings')
      .select('id')
      .eq('organization_id', organizationId)

    if (buildings) {
      const buildingIds = buildings.map(b => b.id)
      await this.supabase
        .from('building_assignments')
        .delete()
        .eq('user_id', userId)
        .in('building_id', buildingIds)
    }

    return true
  }

  /**
   * Update user role
   */
  async updateUserRole(
    organizationId: string,
    userId: string,
    newRole: UserRole
  ): Promise<OrganizationMember | null> {
    const { data, error } = await this.supabase
      .from('organization_members')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating user role:', error)
      return null
    }

    return data
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('organization_members')
      .update({
        invitation_status: 'accepted' as InvitationStatus,
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('invitation_status', 'pending')

    if (error) {
      console.error('Error accepting invitation:', error)
      return false
    }

    return true
  }

  /**
   * Get building assignments for a user
   */
  async getUserBuildingAssignments(
    userId: string
  ): Promise<BuildingAssignment[]> {
    const { data, error } = await this.supabase
      .from('building_assignments')
      .select(`
        *,
        building:buildings(*)
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching assignments:', error)
      return []
    }

    return data || []
  }

  /**
   * Assign user to building
   */
  async assignUserToBuilding(
    buildingId: string,
    userId: string,
    role: UserRole,
    createdBy: string,
    areas?: string[]
  ): Promise<BuildingAssignment | null> {
    const { data, error } = await this.supabase
      .from('building_assignments')
      .insert({
        building_id: buildingId,
        user_id: userId,
        role,
        areas: areas || [],
        created_by: createdBy
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning user to building:', error)
      return null
    }

    return data
  }

  /**
   * Update building assignment
   */
  async updateBuildingAssignment(
    id: string,
    updates: Partial<BuildingAssignment>
  ): Promise<BuildingAssignment | null> {
    const { data, error } = await this.supabase
      .from('building_assignments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return null
    }

    return data
  }

  /**
   * Remove user from building
   */
  async removeUserFromBuilding(
    buildingId: string,
    userId: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('building_assignments')
      .delete()
      .eq('building_id', buildingId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error removing assignment:', error)
      return false
    }

    return true
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

// Export singleton instance
export const organizationService = new OrganizationService()