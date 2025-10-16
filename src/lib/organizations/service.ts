import { createClient } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type {
  Organization,
  Building,
  OrganizationMember,
  BuildingAssignment,
  UserRole,
  InvitationStatus,
} from "@/types/auth";

export class OrganizationService {
  private supabase = createClient();
  private adminSupabase = typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    : null;

  /**
   * Get organization by ID
   */
  async getOrganization(id: string): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching organization:", error);
      return null;
    }

    return data;
  }

  /**
   * Update organization settings
   */
  async updateOrganization(
    id: string,
    updates: Partial<Organization>,
  ): Promise<Organization | null> {
    const { data, error } = await this.supabase
      .from("organizations")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating organization:", error);
      return null;
    }

    return data;
  }

  /**
   * Get all buildings for an organization
   * Note: Fetches from 'sites' table as that's what metrics_data references
   */
  async getOrganizationBuildings(organizationId: string): Promise<Building[]> {
    // Use admin client to bypass RLS (sites table requires admin access)
    const client = this.adminSupabase || this.supabase;

    const { data, error } = await client
      .from("sites")
      .select("*")
      .eq("organization_id", organizationId)
      .order("name");

    if (error) {
      console.error("Error fetching sites:", error);
      return [];
    }

    // Map sites to Building interface
    return (data || []).map(site => ({
      id: site.id,
      organization_id: site.organization_id,
      name: site.name,
      address: typeof site.address === 'object' ?
        `${site.address.street || ''}, ${site.address.city || ''}`.trim() :
        site.location || '',
      city: typeof site.address === 'object' ? site.address.city : site.location,
      country: typeof site.address === 'object' ? site.address.country : undefined,
      postal_code: typeof site.address === 'object' ? site.address.postal_code : undefined,
      size_sqm: site.total_area_sqm, // Use sqm directly (metric)
      created_at: site.created_at,
      updated_at: site.updated_at
    }));
  }

  /**
   * Create a new building
   */
  async createBuilding(
    organizationId: string,
    buildingData: Partial<Building>,
  ): Promise<Building | null> {
    const slug = this.generateSlug(buildingData.name || "");

    const { data, error } = await this.supabase
      .from("buildings")
      .insert({
        organization_id: organizationId,
        slug,
        ...buildingData,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating building:", error);
      return null;
    }

    return data;
  }

  /**
   * Update building information
   */
  async updateBuilding(
    id: string,
    updates: Partial<Building>,
  ): Promise<Building | null> {
    const { data, error } = await this.supabase
      .from("buildings")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating building:", error);
      return null;
    }

    return data;
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(
    organizationId: string,
  ): Promise<OrganizationMember[]> {
    const { data, error } = await this.supabase
      .from("organization_members")
      .select(
        `
        *,
        user:user_profiles(*)
      `,
      )
      .eq("organization_id", organizationId)
      .order("created_at");

    if (error) {
      console.error("Error fetching members:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Invite user to organization
   */
  async inviteUser(
    organizationId: string,
    email: string,
    role: UserRole,
    invitedBy: string,
  ): Promise<OrganizationMember | null> {
    try {
      // Use admin client for user operations (only available server-side)
      const adminClient = this.adminSupabase || this.supabase;

      // First check if user exists in auth.users
      const { data: authUsers } = await adminClient.auth.admin.listUsers();
      const existingAuthUser = authUsers?.users?.find(u => u.email === email);

      let userId: string;

      if (existingAuthUser) {
        // User already exists in auth system
        userId = existingAuthUser.id;

        // Check if they have a profile
        const { data: profile } = await this.supabase
          .from("user_profiles")
          .select("id")
          .eq("id", userId)
          .single();

        if (!profile) {
          // Create profile if missing
          const { error: profileError } = await this.supabase
            .from("user_profiles")
            .insert({
              id: userId,
              email,
              full_name: existingAuthUser.user_metadata?.full_name || email.split('@')[0],
              display_name: existingAuthUser.user_metadata?.full_name || email.split('@')[0],
              email_verified: existingAuthUser.email_confirmed_at ? true : false,
            });

          if (profileError && profileError.code !== '23505') {
            throw profileError;
          }
        }
      } else {
        // Create new auth user with temporary password
        const tempPassword = `Temp-${Math.random().toString(36).slice(2)}-${Date.now()}`;

        const { data: newAuthUser, error: authError } = await adminClient.auth.admin.createUser({
          email,
          password: tempPassword,
          email_confirm: false, // They'll confirm via invitation
          user_metadata: {
            full_name: email.split('@')[0],
            role: role,
            invited_by: invitedBy,
            temp_password: true // Flag for password reset on first login
          }
        });

        if (authError) throw authError;
        if (!newAuthUser.user) throw new Error("Failed to create auth user");

        userId = newAuthUser.user.id;

        // Create profile for new user
        const { error: profileError } = await this.supabase
          .from("user_profiles")
          .insert({
            id: userId,
            email,
            full_name: email.split('@')[0],
            display_name: email.split('@')[0],
            email_verified: false,
          });

        if (profileError && profileError.code !== '23505') {
          throw profileError;
        }
      }

      // Check if already a member
      const { data: existingMember } = await this.supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("user_id", userId)
        .single();

      if (existingMember) {
        return existingMember;
      }

      // Create organization membership invitation
      const { data, error } = await this.supabase
        .from("organization_members")
        .insert({
          organization_id: organizationId,
          user_id: userId,
          role,
          invitation_status: "pending" as InvitationStatus,
          invited_by: invitedBy,
          invited_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      if (!existingAuthUser) {
        // For new users, send invitation with password reset link
        const { error: inviteError } = await adminClient.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/accept-invitation?org=${organizationId}`,
        });

        if (inviteError) {
          console.error("Error sending invitation email:", inviteError);
        } else {
        }
      } else {
        // For existing users, we'd send a different email
        // TODO: Implement organization invitation email for existing users
      }

      return data;
    } catch (error) {
      console.error("Error inviting user:", error);
      return null;
    }
  }

  /**
   * Remove user from organization
   */
  async removeUser(organizationId: string, userId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing user:", error);
      return false;
    }

    // Also remove building assignments
    const { data: buildings } = await this.supabase
      .from("buildings")
      .select("id")
      .eq("organization_id", organizationId);

    if (buildings) {
      const buildingIds = buildings.map((b) => b.id);
      await this.supabase
        .from("building_assignments")
        .delete()
        .eq("user_id", userId)
        .in("building_id", buildingIds);
    }

    return true;
  }

  /**
   * Update user role
   */
  async updateUserRole(
    organizationId: string,
    userId: string,
    newRole: UserRole,
  ): Promise<OrganizationMember | null> {
    const { data, error } = await this.supabase
      .from("organization_members")
      .update({
        role: newRole,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user role:", error);
      return null;
    }

    return data;
  }

  /**
   * Accept invitation
   */
  async acceptInvitation(
    organizationId: string,
    userId: string,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("organization_members")
      .update({
        invitation_status: "accepted" as InvitationStatus,
        joined_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .eq("invitation_status", "pending");

    if (error) {
      console.error("Error accepting invitation:", error);
      return false;
    }

    return true;
  }

  /**
   * Get building assignments for a user
   */
  async getUserBuildingAssignments(
    userId: string,
  ): Promise<BuildingAssignment[]> {
    const { data, error } = await this.supabase
      .from("building_assignments")
      .select(
        `
        *,
        building:buildings(*)
      `,
      )
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching assignments:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Assign user to building
   */
  async assignUserToBuilding(
    buildingId: string,
    userId: string,
    role: UserRole,
    createdBy: string,
    areas?: string[],
  ): Promise<BuildingAssignment | null> {
    const { data, error } = await this.supabase
      .from("building_assignments")
      .insert({
        building_id: buildingId,
        user_id: userId,
        role,
        areas: areas || [],
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error("Error assigning user to building:", error);
      return null;
    }

    return data;
  }

  /**
   * Update building assignment
   */
  async updateBuildingAssignment(
    id: string,
    updates: Partial<BuildingAssignment>,
  ): Promise<BuildingAssignment | null> {
    const { data, error } = await this.supabase
      .from("building_assignments")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating assignment:", error);
      return null;
    }

    return data;
  }

  /**
   * Remove user from building
   */
  async removeUserFromBuilding(
    buildingId: string,
    userId: string,
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from("building_assignments")
      .delete()
      .eq("building_id", buildingId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error removing assignment:", error);
      return false;
    }

    return true;
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
}

// Export singleton instance
export const organizationService = new OrganizationService();
