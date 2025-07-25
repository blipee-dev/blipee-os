import { createClient } from "@/lib/supabase/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { UserRole } from "@/types/auth";
// Removed auth-fix import - trigger now handles profile creation properly
import type {
  AuthResponse,
  Session,
  SignUpMetadata,
  Organization,
  Permission,
} from "@/types/auth";

export class AuthService {
  private async getSupabase() {
    if (typeof window === 'undefined') {
      // Server-side
      return await createServerSupabaseClient();
    } else {
      // Client-side
      return createClient();
    }
  }

  /**
   * Sign up a new user with proper transaction handling
   */
  async signUpWithTransaction(
    email: string,
    password: string,
    metadata: SignUpMetadata,
  ): Promise<AuthResponse> {
    const supabase = await this.getSupabase();
    let userId: string | null = null;

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            role: metadata.role || "subscription_owner",
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("User creation failed");
      
      userId = authData.user.id;

      // Step 2: Wait a moment for trigger to create profile
      // The database trigger will handle profile creation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 3: Create organization if company name provided
      if (metadata.company_name) {
        const orgSlug = this.generateSlug(metadata.company_name);

        const { error: orgError } = await supabase.rpc(
          "create_organization_with_owner",
          {
            org_name: metadata.company_name,
            org_slug: orgSlug,
            owner_id: userId,
          },
        );

        if (orgError) {
          // If org creation fails, we should still have a valid user
          console.error("Organization creation failed:", orgError);
          // Don't throw - user can create org later
        }
      }

      // Step 4: Get user profile
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (!profile) {
        throw new Error("Failed to retrieve user profile");
      }

      // Step 5: Get session
      const session = await this.getSession();

      return {
        user: profile,
        session: session || {
          user: profile,
          organizations: [],
          current_organization: null,
          permissions: [],
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        },
        access_token: authData.session?.access_token || "",
        refresh_token: authData.session?.refresh_token || "",
      };
    } catch (error) {
      // Cleanup on failure
      if (userId) {
        try {
          // Note: This requires service role key
          const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
          if (deleteError) {
            console.error("Failed to cleanup user after error:", deleteError);
          }
        } catch (cleanupError) {
          console.error("Cleanup failed:", cleanupError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Sign up a new user and create their organization (legacy method - will update to use transaction)
   */
  async signUp(
    email: string,
    password: string,
    metadata: SignUpMetadata,
  ): Promise<AuthResponse> {
    const supabase = await this.getSupabase();
    
    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata.full_name,
            role: metadata.role || "subscription_owner",
          },
        },
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    // Wait for trigger to create profile, then get it
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile was not created. Please check database trigger.");
    }
    
    // Update AI settings based on role
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({
        ai_personality_settings: this.getDefaultAISettings(metadata.role),
      })
      .eq("id", authData.user.id);
      
    if (updateError) {
      console.warn("Failed to update AI settings:", updateError);
    }

    // Create organization if company name provided
    if (metadata.company_name) {
      const orgSlug = this.generateSlug(metadata.company_name);

      const { error: orgError } = await supabase.rpc(
        "create_organization_with_owner",
        {
          org_name: metadata.company_name,
          org_slug: orgSlug,
          owner_id: authData.user.id,
        },
      );

      if (orgError) throw orgError;
    }

    // Get session
    const session = await this.getSession();

    return {
      user: profile,
      session: session!,
      access_token: authData.session?.access_token || "",
      refresh_token: authData.session?.refresh_token || "",
    };
  }

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string): Promise<AuthResponse & { requiresMFA?: boolean; challengeId?: string }> {
    const supabase = await this.getSupabase();
    
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Authentication failed");

    // Check if user has MFA enabled
    const { data: mfaConfig } = await supabase
      .from("user_mfa_config")
      .select("*")
      .eq("user_id", authData.user.id)
      .eq("enabled", true)
      .single();

    // If MFA is enabled, create a challenge and require verification
    if (mfaConfig) {
      const { MFAService } = await import('@/lib/auth/mfa/service');
      const mfaService = new MFAService();
      const challenge = await mfaService.createChallenge(authData.user.id);

      // Return partial auth response with MFA requirement
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profile) throw new Error("User profile not found");

      return {
        user: profile,
        session: null as any, // Session will be created after MFA verification
        access_token: "",
        refresh_token: "",
        requiresMFA: true,
        challengeId: challenge.challengeId,
      };
    }

    // Get user profile directly if session is null
    const session = await this.getSession();
    
    if (!session) {
      // If no session (no organizations), return minimal auth response
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profile) throw new Error("User profile not found");

      return {
        user: profile,
        session: {
          user: profile,
          organizations: [],
          current_organization: null,
          permissions: [],
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        },
        access_token: authData.session?.access_token || "",
        refresh_token: authData.session?.refresh_token || "",
      };
    }

    return {
      user: session.user,
      session: session,
      access_token: authData.session?.access_token || "",
      refresh_token: authData.session?.refresh_token || "",
    };
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider: "google" | "azure"): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error: _error } = await supabase.auth.signInWithOAuth({
      provider: provider as any, // Type assertion for now
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
  }

  /**
   * Get current session with full context
   */
  async getSession(): Promise<Session | null> {
    const supabase = await this.getSupabase();
    
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Get user profile
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // Get user's organizations
    const { data: memberships } = await supabase
      .from("organization_members")
      .select(
        `
        *,
        organization:organizations(*)
      `,
      )
      .eq("user_id", user.id)
      .eq("invitation_status", "accepted");

    // Return session even if no organizations
    if (!memberships || memberships.length === 0) {
      return {
        user: profile,
        organizations: [],
        current_organization: null,
        permissions: [],
        expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      };
    }

    // Get current organization (first one for now)
    const currentMembership = memberships[0];
    const currentOrg = currentMembership.organization as Organization;

    // Get user's permissions
    const permissions = this.buildPermissions(
      currentMembership.role,
      currentMembership.permissions,
    );

    return {
      user: profile,
      organizations: memberships.map((m) => m.organization as Organization),
      current_organization: currentOrg,
      permissions,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    };
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error: _error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error: _error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error: _error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  }

  /**
   * Check if user has permission
   */
  hasPermission(
    session: Session,
    resource: string,
    action: string,
    scope?: Record<string, string>,
  ): boolean {
    return session.permissions.some(
      (permission) =>
        permission.resource === resource &&
        permission.action === action &&
        (!scope || this.matchesScope(permission.scope, scope)),
    );
  }

  /**
   * Build permissions based on role
   */
  private buildPermissions(
    role: string,
    customPermissions: any = {},
  ): Permission[] {
    const basePermissions = this.getRolePermissions(role as UserRole);
    const custom = customPermissions?.permissions || [];

    return [...basePermissions, ...custom];
  }

  /**
   * Get default permissions for a role
   */
  private getRolePermissions(role: UserRole): Permission[] {
    const permissionMap: Record<UserRole, Permission[]> = {
      [UserRole.SUBSCRIPTION_OWNER]: [{ resource: "*", action: "*" }],
      [UserRole.ORGANIZATION_ADMIN]: [
        { resource: "organization", action: "view" },
        { resource: "organization", action: "edit" },
        { resource: "buildings", action: "*" },
        { resource: "users", action: "*" },
        { resource: "reports", action: "*" },
      ],
      [UserRole.SITE_MANAGER]: [
        { resource: "buildings", action: "view" },
        { resource: "buildings", action: "edit" },
        { resource: "systems", action: "*" },
        { resource: "users", action: "invite" },
        { resource: "reports", action: "*" },
      ],
      [UserRole.FACILITY_MANAGER]: [
        { resource: "buildings", action: "view" },
        { resource: "systems", action: "view" },
        { resource: "systems", action: "control" },
        { resource: "maintenance", action: "*" },
        { resource: "reports", action: "view" },
      ],
      [UserRole.TECHNICIAN]: [
        { resource: "buildings", action: "view" },
        { resource: "systems", action: "view" },
        { resource: "systems", action: "control" },
        { resource: "maintenance", action: "*" },
      ],
      [UserRole.GROUP_MANAGER]: [
        { resource: "buildings", action: "view" },
        { resource: "systems", action: "control" },
        { resource: "reports", action: "view" },
      ],
      [UserRole.TENANT]: [
        { resource: "buildings", action: "view" },
        { resource: "systems", action: "view" },
        { resource: "maintenance", action: "create" },
      ],
      [UserRole.GUEST]: [{ resource: "buildings", action: "view" }],
    };

    return permissionMap[role] || [];
  }

  /**
   * Check if permission scope matches
   */
  private matchesScope(
    permissionScope: any,
    requiredScope: Record<string, string>,
  ): boolean {
    if (!permissionScope) return true;

    return Object.entries(requiredScope).every(
      ([key, value]) => permissionScope[key] === value,
    );
  }

  /**
   * Get default AI settings for role
   */
  private getDefaultAISettings(role?: string) {
    const roleSettings: Record<string, any> = {
      subscription_owner: {
        tone: "professional",
        detail_level: "executive",
        proactivity: "medium",
        expertise_level: "intermediate",
      },
      site_manager: {
        tone: "friendly",
        detail_level: "detailed",
        proactivity: "high",
        expertise_level: "intermediate",
      },
      technician: {
        tone: "casual",
        detail_level: "technical",
        proactivity: "high",
        expertise_level: "expert",
      },
    };

    return (
      roleSettings[role || "subscription_owner"] ||
      roleSettings.subscription_owner
    );
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
export const authService = new AuthService();
