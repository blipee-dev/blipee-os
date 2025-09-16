/**
 * Enterprise RBAC Service
 * Central service for all permission management
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  RoleName,
  RoleLevel,
  UserRole,
  PermissionOverride,
  Delegation,
  PermissionCheckResult,
  UserAccessProfile,
  UserRoleInfo,
  ResourceType,
  Action,
  PermissionContext,
  LEGACY_ROLE_MAPPING
} from './types';

export class RBACService {
  /**
   * Check if a user has permission to perform an action on a resource
   */
  static async checkPermission(context: PermissionContext): Promise<PermissionCheckResult> {
    const supabase = await createClient();

    // Check using the database function
    const { data, error } = await supabase
      .rpc('check_user_permission', {
        p_user_id: context.user_id,
        p_resource: context.resource,
        p_action: context.action,
        p_organization_id: context.organization_id,
        p_site_id: context.site_id
      });

    if (error) {
      console.error('Error checking permission:', error);
      return { allowed: false, source: 'role' };
    }

    // If database says yes, determine the source
    if (data) {
      // Check if super admin
      const { data: superAdmin } = await supabase
        .from('super_admins')
        .select('id')
        .eq('user_id', context.user_id)
        .single();

      if (superAdmin) {
        return { allowed: true, source: 'super_admin' };
      }

      // Check if it's from a role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select(`
          *,
          roles!inner(name)
        `)
        .eq('user_id', context.user_id)
        .eq('is_active', true)
        .single();

      if (userRole) {
        return {
          allowed: true,
          source: 'role',
          role: userRole.roles.name,
          expires_at: userRole.expires_at
        };
      }

      // Check if it's from an override
      const { data: override } = await supabase
        .from('permission_overrides')
        .select('*')
        .eq('user_id', context.user_id)
        .eq('resource_type', context.resource)
        .eq('permission', context.action)
        .single();

      if (override) {
        return {
          allowed: true,
          source: 'override',
          expires_at: override.expires_at
        };
      }

      // Must be from a delegation
      return {
        allowed: true,
        source: 'delegation'
      };
    }

    return { allowed: false, source: 'role' };
  }

  /**
   * Get a user's complete access profile
   */
  static async getUserAccessProfile(userId: string): Promise<UserAccessProfile> {
    const supabase = await createClient();

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Get user roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select(`
        *,
        roles!inner(name, level),
        organizations!inner(name),
        sites(name)
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    const roles: UserRoleInfo[] = userRoles?.map(ur => ({
      role_name: ur.roles.name,
      role_level: ur.roles.level,
      organization_id: ur.organization_id,
      organization_name: ur.organizations?.name,
      site_id: ur.site_id,
      site_name: ur.sites?.name,
      region: ur.region,
      is_active: ur.is_active,
      expires_at: ur.expires_at
    })) || [];

    // Get permission overrides
    const { data: overrides } = await supabase
      .from('permission_overrides')
      .select('*')
      .eq('user_id', userId);

    // Get delegations
    const { data: delegations } = await supabase
      .from('delegations')
      .select('*')
      .eq('delegate_user_id', userId)
      .eq('is_active', true);

    return {
      user_id: userId,
      is_super_admin: !!superAdmin,
      roles: roles,
      overrides: overrides || [],
      delegations: delegations || []
    };
  }

  /**
   * Grant a role to a user
   */
  static async grantRole(
    userId: string,
    roleName: RoleName | string,
    organizationId: string,
    siteId?: string,
    grantedBy?: string,
    expiresAt?: Date
  ): Promise<UserRole | null> {
    // Map legacy role names if needed
    const mappedRoleName = LEGACY_ROLE_MAPPING[roleName] || roleName;

    // Get role ID
    const supabaseAdmin = createAdminClient();
    const { data: role, error: roleError } = await supabaseAdmin
      .from('roles')
      .select('id')
      .eq('name', mappedRoleName)
      .single();

    if (roleError || !role) {
      console.error('Role not found:', mappedRoleName);
      return null;
    }

    // Create user role assignment
    const { data: userRole, error } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: role.id,
        organization_id: organizationId,
        site_id: siteId,
        granted_by: grantedBy,
        expires_at: expiresAt,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error granting role:', error);
      return null;
    }

    return userRole;
  }

  /**
   * Revoke a role from a user
   */
  static async revokeRole(userRoleId: string): Promise<boolean> {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('user_roles')
      .update({ is_active: false })
      .eq('id', userRoleId);

    if (error) {
      console.error('Error revoking role:', error);
      return false;
    }

    return true;
  }

  /**
   * Grant a permission override
   */
  static async grantPermissionOverride(
    userId: string,
    resource: ResourceType,
    permission: Action,
    organizationId: string,
    reason: string,
    grantedBy: string,
    siteId?: string,
    resourceId?: string,
    expiresAt?: Date
  ): Promise<PermissionOverride | null> {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('permission_overrides')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        site_id: siteId,
        resource_type: resource,
        resource_id: resourceId,
        permission: permission,
        granted_by: grantedBy,
        reason: reason,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) {
      console.error('Error granting permission override:', error);
      return null;
    }

    return data;
  }

  /**
   * Create a delegation
   */
  static async createDelegation(
    delegatorUserId: string,
    delegateUserId: string,
    delegatorRoleId: string,
    scope: 'full' | 'partial',
    reason: string,
    startsAt: Date,
    endsAt?: Date,
    permissions?: Record<string, string[]>
  ): Promise<Delegation | null> {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('delegations')
      .insert({
        delegator_user_id: delegatorUserId,
        delegate_user_id: delegateUserId,
        delegator_role_id: delegatorRoleId,
        scope: scope,
        permissions: permissions,
        reason: reason,
        starts_at: startsAt,
        ends_at: endsAt,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating delegation:', error);
      return null;
    }

    return data;
  }

  /**
   * Get users by role in an organization
   */
  static async getUsersByRole(
    organizationId: string,
    roleName?: RoleName,
    siteId?: string
  ): Promise<UserRoleInfo[]> {
    const supabase = await createClient();

    let query = supabase
      .from('user_roles')
      .select(`
        *,
        roles!inner(name, level),
        organizations!inner(name),
        sites(name),
        auth.users!inner(email)
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (roleName) {
      query = query.eq('roles.name', roleName);
    }

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users by role:', error);
      return [];
    }

    return data?.map(ur => ({
      role_name: ur.roles.name,
      role_level: ur.roles.level,
      organization_id: ur.organization_id,
      organization_name: ur.organizations?.name,
      site_id: ur.site_id,
      site_name: ur.sites?.name,
      region: ur.region,
      is_active: ur.is_active,
      expires_at: ur.expires_at
    })) || [];
  }

  /**
   * Check if a user is a super admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    const supabase = await createClient();

    const { data } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .single();

    return !!data;
  }

  /**
   * Get all available roles
   */
  static async getAvailableRoles(): Promise<any[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('level', { ascending: true });

    if (error) {
      console.error('Error fetching roles:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Clean up expired permissions (should be called periodically)
   */
  static async cleanupExpiredPermissions(): Promise<void> {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.rpc('cleanup_expired_permissions');

    if (error) {
      console.error('Error cleaning up expired permissions:', error);
    }
  }
}