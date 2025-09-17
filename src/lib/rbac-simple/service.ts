/**
 * Simple RBAC Service
 * Based on industry best practices from top ESG platforms
 * Fast, simple, effective - exactly what users need
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';

export type CoreRole = 'owner' | 'manager' | 'member' | 'viewer';
export type ResourceType = 'org' | 'site' | 'report' | 'device';

export interface UserAccess {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  resource_id: string;
  role: CoreRole;
  permissions?: Record<string, any>;
  granted_by?: string;
  granted_at: Date;
  expires_at?: Date;
}

export interface PermissionCheck {
  allowed: boolean;
  role?: CoreRole;
  source: 'role' | 'super_admin' | 'none';
}

export class SimpleRBACService {
  /**
   * Check if a user has permission to perform an action on a resource
   * Single query, indexed, fast - exactly what you need
   */
  static async checkPermission(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    action: string
  ): Promise<PermissionCheck> {
    const supabase = await createClient();

    // Check if super admin first
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (superAdmin) {
      return { allowed: true, source: 'super_admin' };
    }

    // Use the database function for fast permission check
    const { data, error } = await supabase
      .rpc('check_user_permission', {
        p_user_id: userId,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_action: action
      });

    if (error) {
      console.error('Permission check error:', error);
      return { allowed: false, source: 'none' };
    }

    if (data) {
      // Get the user's role for context
      const { data: roleData } = await supabase
        .rpc('get_user_role', {
          p_user_id: userId,
          p_resource_type: resourceType,
          p_resource_id: resourceId
        });

      return {
        allowed: true,
        role: roleData as CoreRole,
        source: 'role'
      };
    }

    return { allowed: false, source: 'none' };
  }

  /**
   * Grant access to a user for a resource
   */
  static async grantAccess(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    role: CoreRole,
    grantedBy: string,
    expiresAt?: Date
  ): Promise<UserAccess | null> {
    const supabaseAdmin = createAdminClient();
    const { data, error } = await supabaseAdmin
      .from('user_access')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
        role: role,
        granted_by: grantedBy,
        expires_at: expiresAt
      })
      .select()
      .single();

    if (error) {
      console.error('Error granting access:', error);
      return null;
    }

    return data;
  }

  /**
   * Revoke access from a user for a resource
   */
  static async revokeAccess(
    userId: string,
    resourceType: ResourceType,
    resourceId: string
  ): Promise<boolean> {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('user_access')
      .delete()
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId);

    if (error) {
      console.error('Error revoking access:', error);
      return false;
    }

    return true;
  }

  /**
   * Update a user's role for a resource
   */
  static async updateAccess(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    newRole: CoreRole
  ): Promise<boolean> {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('user_access')
      .update({ role: newRole })
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId);

    if (error) {
      console.error('Error updating access:', error);
      return false;
    }

    return true;
  }

  /**
   * Get all access records for a user
   */
  static async getUserAccess(userId: string): Promise<UserAccess[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_access')
      .select('*')
      .eq('user_id', userId)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Error fetching user access:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get all users with access to a resource
   */
  static async getResourceUsers(
    resourceType: ResourceType,
    resourceId: string
  ): Promise<Array<UserAccess & { user_email?: string }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_access')
      .select(`
        *,
        auth.users!inner(email)
      `)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('Error fetching resource users:', error);
      return [];
    }

    return data?.map(item => ({
      ...item,
      user_email: item.auth?.users?.email
    })) || [];
  }

  /**
   * Check if user is super admin
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
   * Get user's role for organization (backward compatibility)
   */
  static async getUserOrgRole(userId: string, orgId: string): Promise<CoreRole | null> {
    const supabase = await createClient();

    const { data } = await supabase
      .rpc('get_user_role', {
        p_user_id: userId,
        p_resource_type: 'org',
        p_resource_id: orgId
      });

    return data as CoreRole || null;
  }

  /**
   * Grant organization access (for user creation/invitation)
   */
  static async grantOrgAccess(
    userId: string,
    orgId: string,
    role: CoreRole,
    grantedBy: string
  ): Promise<boolean> {
    const access = await this.grantAccess(userId, 'org', orgId, role, grantedBy);
    return !!access;
  }

  /**
   * Grant site access (for site-specific permissions)
   */
  static async grantSiteAccess(
    userId: string,
    siteId: string,
    role: CoreRole,
    grantedBy: string
  ): Promise<boolean> {
    const access = await this.grantAccess(userId, 'site', siteId, role, grantedBy);
    return !!access;
  }

  /**
   * Get organizations user has access to
   */
  static async getUserOrganizations(userId: string): Promise<Array<{
    organization_id: string;
    role: CoreRole;
    organization_name?: string;
  }>> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('user_access')
      .select(`
        resource_id,
        role,
        organizations!inner(name)
      `)
      .eq('user_id', userId)
      .eq('resource_type', 'org');

    if (error) {
      console.error('Error fetching user organizations:', error);
      return [];
    }

    return data?.map(item => ({
      organization_id: item.resource_id,
      role: item.role as CoreRole,
      organization_name: item.organizations?.name
    })) || [];
  }

  /**
   * Clean up expired access records
   */
  static async cleanupExpiredAccess(): Promise<void> {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin
      .from('user_access')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired access:', error);
    }
  }
}