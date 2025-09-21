/**
 * Enterprise Authentication Service v2
 * Complete rewrite with proper validation, error handling, and audit logging
 */

import { createClient } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  SystemRole,
  SystemRoleSchema,
  SignUpMetadataSchema,
  type AuthResponse,
  type Session,
  type SignUpMetadata,
  type Organization,
  type Permission,
  type UserProfile,
  type OrganizationMember,
  SYSTEM_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  hasPermission as checkPermission,
  canRolePerformAction,
} from "@/types/auth-unified";
import { z } from "zod";

export class EnterpriseAuthService {
  private async getSupabase() {
    if (typeof window === 'undefined') {
      return await createServerSupabaseClient();
    } else {
      return createClient();
    }
  }

  /**
   * Sign up a new user with comprehensive validation and transaction safety
   */
  async signUp(
    email: string,
    password: string,
    metadata: SignUpMetadata,
  ): Promise<AuthResponse> {
    const supabase = await this.getSupabase();

    // Validate metadata
    const validatedMetadata = SignUpMetadataSchema.parse(metadata);

    // Start audit log entry
    const auditId = crypto.randomUUID();

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: validatedMetadata.full_name,
            role: validatedMetadata.role,
            audit_id: auditId,
          },
        },
      });

      if (authError) {
        await this.logAuthEvent('signup_failed', null, 'failure', {
          error: authError.message,
          email,
        });
        throw authError;
      }

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      const userId = authData.user.id;

      // Step 2: Wait for trigger to create profile (with timeout)
      const profile = await this.waitForProfile(userId, 5000); // 5 second timeout

      if (!profile) {
        // If profile wasn't created by trigger, create it manually
        const { data: manualProfile, error: profileError } = await supabase
          .from("user_profiles")
          .insert({
            id: userId,
            email,
            full_name: validatedMetadata.full_name,
          })
          .select()
          .single();

        if (profileError) {
          // Attempt cleanup
          await this.cleanupFailedSignup(userId);
          throw new Error("Profile creation failed: " + profileError.message);
        }
      }

      // Step 3: Create organization if company name provided
      let organizationId: string | null = null;
      if (validatedMetadata.company_name) {
        const orgSlug = this.generateSlug(validatedMetadata.company_name);

        const { data: orgData, error: orgError } = await supabase.rpc(
          "create_organization_with_owner",
          {
            org_name: validatedMetadata.company_name,
            org_slug: orgSlug,
            owner_id: userId,
          },
        );

        if (orgError) {
          console.error("Organization creation failed:", orgError);
          // Don't fail signup if org creation fails - user can create later
        } else {
          organizationId = orgData;
        }
      }

      // Step 4: Log successful signup
      await this.logAuthEvent('signup_success', userId, 'success', {
        email,
        organization_id: organizationId,
        role: validatedMetadata.role,
      });

      // Step 5: Get session
      const session = await this.buildSession(userId);

      return {
        user: session.user,
        session,
        access_token: authData.session?.access_token || "",
        refresh_token: authData.session?.refresh_token || "",
      };
    } catch (error) {
      // Log the failure
      await this.logAuthEvent('signup_error', null, 'failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
        audit_id: auditId,
      });

      throw error;
    }
  }

  /**
   * Sign in with comprehensive validation
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    const supabase = await this.getSupabase();

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        await this.logAuthEvent('signin_failed', null, 'failure', {
          error: authError.message,
          email,
        });
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Check for MFA requirement
      const { data: mfaConfig } = await supabase
        .from("user_mfa_config")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("enabled", true)
        .single();

      if (mfaConfig) {
        // Return partial response for MFA challenge
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", authData.user.id)
          .single();

        if (!profile) throw new Error("User profile not found");

        return {
          user: profile,
          session: {} as Session, // Will be created after MFA
          access_token: "",
          refresh_token: "",
          requiresMFA: true,
          challengeId: crypto.randomUUID(), // Generate challenge
        };
      }

      // Build full session
      const session = await this.buildSession(authData.user.id);

      // Log successful signin
      await this.logAuthEvent('signin_success', authData.user.id, 'success', {
        email,
      });

      return {
        user: session.user,
        session,
        access_token: authData.session?.access_token || "",
        refresh_token: authData.session?.refresh_token || "",
      };
    } catch (error) {
      await this.logAuthEvent('signin_error', null, 'failure', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email,
      });
      throw error;
    }
  }

  /**
   * Get current session with all context
   */
  async getSession(): Promise<Session | null> {
    const supabase = await this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return this.buildSession(user.id);
  }

  /**
   * Build a complete session object
   */
  private async buildSession(userId: string): Promise<Session> {
    const supabase = await this.getSupabase();

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("*")
      .eq("user_id", userId)
      .single();

    // Get organization memberships
    const { data: memberships } = await supabase
      .from("organization_members")
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq("user_id", userId)
      .eq("invitation_status", "accepted");

    const organizations = (memberships || []).map(m => m.organization as Organization);
    const currentOrg = organizations[0] || null;

    // Build permissions
    let permissions: Permission[] = [];
    if (superAdmin) {
      permissions = [{ resource: '*', action: '*' }];
    } else if (memberships && memberships.length > 0) {
      const membership = memberships[0];
      permissions = this.buildPermissions(membership.role, membership.custom_permissions);
    }

    return {
      user: profile,
      organizations,
      current_organization: currentOrg,
      permissions,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      session_id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Build permissions based on role and custom permissions
   */
  private buildPermissions(role: SystemRole, customPermissions?: any): Permission[] {
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
    const custom = Array.isArray(customPermissions) ? customPermissions : [];
    return [...rolePermissions, ...custom];
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    const supabase = await this.getSupabase();

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await this.logAuthEvent('signout', user.id, 'success', {});
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Check if user has permission
   */
  hasPermission(
    session: Session,
    resource: string,
    action: string,
    scope?: Record<string, any>
  ): boolean {
    return checkPermission(session.permissions, resource, action, scope);
  }

  /**
   * Invite user to organization
   */
  async inviteUser(
    email: string,
    organizationId: string,
    role: SystemRole,
    invitedBy: string
  ): Promise<void> {
    const supabase = await this.getSupabase();

    // Validate role
    SystemRoleSchema.parse(role);

    // Check if inviter has permission
    const inviterRole = await this.getUserOrgRole(invitedBy, organizationId);
    if (!inviterRole || !canRolePerformAction(inviterRole, role)) {
      throw new Error("Insufficient permissions to assign this role");
    }

    // Create invitation
    const { error } = await supabase
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: crypto.randomUUID(), // Placeholder until user accepts
        role,
        invitation_status: 'pending',
        invited_by: invitedBy,
        invited_at: new Date().toISOString(),
      });

    if (error) throw error;

    // TODO: Send invitation email

    await this.logAuthEvent('user_invited', invitedBy, 'success', {
      email,
      organization_id: organizationId,
      role,
    });
  }

  /**
   * Update user role
   */
  async updateUserRole(
    userId: string,
    organizationId: string,
    newRole: SystemRole,
    updatedBy: string
  ): Promise<void> {
    const supabase = await this.getSupabase();

    // Validate role
    SystemRoleSchema.parse(newRole);

    // Check permissions
    const updaterRole = await this.getUserOrgRole(updatedBy, organizationId);
    if (!updaterRole || !canRolePerformAction(updaterRole, newRole)) {
      throw new Error("Insufficient permissions to assign this role");
    }

    // Update role
    const { error } = await supabase
      .from("organization_members")
      .update({ role: newRole })
      .eq("user_id", userId)
      .eq("organization_id", organizationId);

    if (error) throw error;

    await this.logAuthEvent('role_updated', updatedBy, 'success', {
      target_user: userId,
      organization_id: organizationId,
      new_role: newRole,
    });
  }

  /**
   * Remove user from organization
   */
  async removeUser(
    userId: string,
    organizationId: string,
    removedBy: string
  ): Promise<void> {
    const supabase = await this.getSupabase();

    // Check permissions
    const removerRole = await this.getUserOrgRole(removedBy, organizationId);
    if (!removerRole || removerRole !== SYSTEM_ROLES.ACCOUNT_OWNER) {
      throw new Error("Only account owners can remove users");
    }

    // Remove user
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("user_id", userId)
      .eq("organization_id", organizationId);

    if (error) throw error;

    await this.logAuthEvent('user_removed', removedBy, 'success', {
      target_user: userId,
      organization_id: organizationId,
    });
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Wait for profile to be created by trigger
   */
  private async waitForProfile(userId: string, timeout: number): Promise<UserProfile | null> {
    const supabase = await this.getSupabase();
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data) return data;

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return null;
  }

  /**
   * Cleanup failed signup
   */
  private async cleanupFailedSignup(userId: string): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      // Note: This requires service role key
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        console.error("Failed to cleanup user:", error);
      }
    } catch (error) {
      console.error("Cleanup error:", error);
    }
  }

  /**
   * Get user's role in organization
   */
  private async getUserOrgRole(userId: string, organizationId: string): Promise<SystemRole | null> {
    const supabase = await this.getSupabase();

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from("super_admins")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (superAdmin) return SYSTEM_ROLES.SUPER_ADMIN;

    // Get org role
    const { data } = await supabase
      .from("organization_members")
      .select("role")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .eq("invitation_status", "accepted")
      .single();

    return data?.role || null;
  }

  /**
   * Log authentication event
   */
  private async logAuthEvent(
    eventType: string,
    userId: string | null,
    status: 'success' | 'failure' | 'pending',
    metadata: Record<string, any>
  ): Promise<void> {
    const supabase = await this.getSupabase();

    try {
      await supabase.from("auth_audit_log").insert({
        event_type: eventType,
        user_id: userId,
        status,
        metadata,
        ip_address: typeof window !== 'undefined' ? null : null, // TODO: Get from request
        user_agent: typeof window !== 'undefined' ? navigator.userAgent : null,
      });
    } catch (error) {
      console.error("Failed to log auth event:", error);
    }
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
export const authService = new EnterpriseAuthService();