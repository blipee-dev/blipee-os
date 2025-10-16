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

  private async getSupabaseAdmin() {
    if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Server-side with service role key - bypasses RLS
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );
    } else {
      // Fall back to regular client
      return this.getSupabase();
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
            role: metadata.role || "account_owner",
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

      // Step 4: Get user profile using admin client to bypass RLS
      const adminSupabase = await this.getSupabaseAdmin();
      const { data: profile } = await adminSupabase
        .from("app_users")
        .select("*")
        .eq("auth_user_id", userId)
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
            role: metadata.role || "account_owner",
          },
        },
      });

    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");

    // Wait for trigger to create profile, then get it
    await new Promise(resolve => setTimeout(resolve, 100));

    // Use admin client to bypass RLS
    const adminSupabase = await this.getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminSupabase
      .from("app_users")
      .select("*")
      .eq("auth_user_id", authData.user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile was not created. Please check database trigger.");
    }
    
    // Update AI settings based on role
    const { error: updateError } = await adminSupabase
      .from("app_users")
      .update({
        ai_personality_settings: this.getDefaultAISettings(metadata.role),
      })
      .eq("auth_user_id", authData.user.id);
      
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

    if (authError) {
      console.error('🔴 Supabase auth error:', authError.message, authError.code);
      throw authError;
    }
    if (!authData.user) {
      console.error('🔴 No user returned from Supabase');
      throw new Error("Authentication failed");
    }


    // Use admin client to bypass RLS for fetching user data
    const adminSupabase = await this.getSupabaseAdmin();

    // Parallelize MFA config and profile fetching for faster signin
    const [mfaResult, profileResult] = await Promise.all([
      adminSupabase
        .from("user_mfa_config")
        .select("*")
        .eq("user_id", authData.user.id)
        .eq("enabled", true)
        .single(),
      adminSupabase
        .from("app_users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
        .single()
    ]);

    const mfaConfig = mfaResult.data;
    const profile = profileResult.data;

    // If MFA is enabled, create a challenge and require verification
    if (mfaConfig) {
      const { MFAService } = await import('@/lib/auth/mfa/service');
      const mfaService = new MFAService();
      const challenge = await mfaService.createChallenge(authData.user.id);

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

      // Use admin client to bypass RLS issues
      const adminSupabase = await this.getSupabaseAdmin();
      const { data: profile, error: profileError } = await adminSupabase
        .from("app_users")
        .select("*")
        .eq("auth_user_id", authData.user.id)
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
    
    const { error } = await supabase.auth.signInWithOAuth({
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

    // Use admin client to bypass RLS issues
    const adminSupabase = await this.getSupabaseAdmin();

    // Get user profile with organization
    const { data: profile, error: profileError } = await adminSupabase
      .from("app_users")
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq("auth_user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error('Failed to fetch user profile:', profileError);
      return null;
    }

    // Check for organization_members entries (for invited users)
    const { data: memberships } = await adminSupabase
      .from("organization_members")
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq("user_id", profile.id)  // Use profile.id, not auth user.id
      .eq("invitation_status", "accepted");

    // Build organizations list
    const organizations: Organization[] = [];
    let currentOrganization: Organization | null = null;
    let userRole = profile.role || 'viewer';
    let userPermissions: any = null;

    // If user has a direct organization assignment in app_users
    if (profile.organization_id && profile.organization) {
      organizations.push(profile.organization as Organization);
      currentOrganization = profile.organization as Organization;
      userPermissions = profile.permissions;
    }

    // Add any organizations from memberships table (for invited users)
    if (memberships && memberships.length > 0) {
      for (const membership of memberships) {
        if (membership.organization &&
            !organizations.find(org => org.id === membership.organization.id)) {
          organizations.push(membership.organization as Organization);
        }
      }
      // If no current org set yet, use first membership
      if (!currentOrganization && memberships[0]?.organization) {
        currentOrganization = memberships[0].organization as Organization;
        userRole = memberships[0].role || userRole;
        userPermissions = memberships[0].permissions || userPermissions;
      }
    }

    // Build permissions based on role
    const permissions = this.buildPermissions(userRole, userPermissions);

    return {
      user: profile,
      organizations,
      current_organization: currentOrganization,
      permissions,
      expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours
    };
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<void> {
    const supabase = await this.getSupabase();
    
    const { error } = await supabase.auth.updateUser({
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
  private getRolePermissions(role: UserRole | string): Permission[] {
    const permissionMap: Record<string, Permission[]> = {
      ["account_owner"]: [
        // Can manage everything within their organization
        { resource: "organization", action: "view" },
        { resource: "organization", action: "edit" },
        { resource: "organization", action: "delete" },
        { resource: "buildings", action: "*" },
        { resource: "users", action: "*" },
        { resource: "reports", action: "*" },
        { resource: "sustainability", action: "*" },
        { resource: "systems", action: "*" },
        { resource: "maintenance", action: "*" },
        { resource: "analytics", action: "*" },
        { resource: "settings", action: "*" },
        { resource: "billing", action: "*" },
        { resource: "integrations", action: "*" },
        // Cannot create new organizations
      ],
      ["sustainability_manager"]: [
        { resource: "organization", action: "view" },
        { resource: "buildings", action: "*" },
        { resource: "users", action: "view" },
        { resource: "users", action: "invite" }, // Can only invite facility_manager, analyst, viewer
        { resource: "reports", action: "*" },
        { resource: "sustainability", action: "*" },
        { resource: "analytics", action: "*" },
        { resource: "systems", action: "view" },
      ],
      ["facility_manager"]: [
        { resource: "organization", action: "view" },
        { resource: "buildings", action: "view" },
        { resource: "buildings", action: "edit" },
        { resource: "systems", action: "*" },
        { resource: "maintenance", action: "*" },
        { resource: "reports", action: "view" },
        { resource: "reports", action: "create" },
        { resource: "users", action: "view" },
        { resource: "sustainability", action: "view" },
      ],
      ["analyst"]: [
        { resource: "organization", action: "view" },
        { resource: "buildings", action: "view" },
        { resource: "reports", action: "view" },
        { resource: "reports", action: "create" },
        { resource: "reports", action: "export" },
        { resource: "sustainability", action: "view" },
        { resource: "analytics", action: "*" },
        { resource: "users", action: "view" },
      ],
      ["viewer"]: [
        { resource: "organization", action: "view" },
        { resource: "buildings", action: "view" },
        { resource: "reports", action: "view" },
        { resource: "sustainability", action: "view" },
        { resource: "analytics", action: "view" },
        { resource: "users", action: "view" },
      ],
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
      account_owner: {
        tone: "professional",
        detail_level: "executive",
        proactivity: "medium",
        expertise_level: "intermediate",
      },
      sustainability_manager: {
        tone: "professional",
        detail_level: "detailed",
        proactivity: "high",
        expertise_level: "expert",
      },
      facility_manager: {
        tone: "friendly",
        detail_level: "detailed",
        proactivity: "high",
        expertise_level: "intermediate",
      },
      analyst: {
        tone: "professional",
        detail_level: "technical",
        proactivity: "medium",
        expertise_level: "expert",
      },
      viewer: {
        tone: "friendly",
        detail_level: "executive",
        proactivity: "low",
        expertise_level: "beginner",
      },
    };

    return (
      roleSettings[role || "account_owner"] ||
      roleSettings.account_owner
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
