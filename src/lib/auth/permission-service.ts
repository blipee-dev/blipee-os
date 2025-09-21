/**
 * Centralized Permission Service
 * Handles all permission checks using Simple RBAC system
 * Provides consistent interface for super admin, role-based, and resource-level permissions
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { createClient as createBrowserClient } from '@/lib/supabase/client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { SimpleRBACService } from '@/lib/rbac-simple/service';

export type CoreRole = 'owner' | 'manager' | 'member' | 'viewer';
export type ResourceType = 'org' | 'site' | 'report' | 'device';
export type Action = 'create' | 'read' | 'update' | 'delete' | '*';

// Define what actions each role can perform on each resource
const ROLE_PERMISSIONS: Record<CoreRole, Record<string, string[]>> = {
  owner: {
    organization: ['*'],
    sites: ['*'],
    users: ['*'],
    billing: ['*'],
    settings: ['*'],
    reports: ['*'],
    data: ['*'],
    devices: ['*']
  },
  manager: {
    organization: ['read', 'update'],
    sites: ['*'],
    users: ['create', 'read', 'update'],
    settings: ['read', 'update'],
    reports: ['*'],
    data: ['*'],
    devices: ['*']
  },
  member: {
    sites: ['read', 'update'],
    reports: ['create', 'read'],
    data: ['create', 'read', 'update'],
    devices: ['read', 'update']
  },
  viewer: {
    sites: ['read'],
    reports: ['read'],
    data: ['read'],
    devices: ['read']
  }
};

export class PermissionService {
  /**
   * Check if current user is a super admin
   * Super admins bypass all permission checks
   */
  static async isSuperAdmin(userId?: string): Promise<boolean> {
    try {
      // If no userId provided, get current user
      if (!userId) {
        const supabase = typeof window === 'undefined'
          ? await createClient()
          : createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        userId = user.id;
      }

      // Use admin client to avoid RLS issues when checking super admin status
      const { data } = await supabaseAdmin
        .from('super_admins')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      return !!data;
    } catch (error) {
      console.error('Error checking super admin status:', error);
      return false;
    }
  }

  /**
   * Get user's role for an organization
   * Uses user_access table from Simple RBAC
   */
  static async getUserOrgRole(userId: string, orgId: string): Promise<CoreRole | null> {
    try {
      const supabase = typeof window === 'undefined'
        ? await createClient()
        : createBrowserClient();

      // First check user_access table (Simple RBAC)
      const { data: accessData } = await supabase
        .from('user_access')
        .select('role')
        .eq('user_id', userId)
        .eq('resource_type', 'org')
        .eq('resource_id', orgId)
        .maybeSingle();

      if (accessData?.role) {
        return accessData.role as CoreRole;
      }

      // Fallback: Check app_users table for organization membership
      const { data: appUser } = await supabase
        .from('app_users')
        .select('role, organization_id')
        .eq('auth_user_id', userId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (appUser?.role) {
        // Map to Simple RBAC roles if needed
        const role = appUser.role;
        if (['owner', 'manager', 'member', 'viewer'].includes(role)) {
          return role as CoreRole;
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting user org role:', error);
      return null;
    }
  }

  /**
   * Main permission check function
   * Checks: super_admin → role permissions → deny
   */
  static async checkPermission(
    userId: string,
    resource: string,
    action: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // 1. Super admin bypass
      if (await this.isSuperAdmin(userId)) {
        return true;
      }

      // 2. If resourceId is provided, get user's role for that specific resource
      if (resourceId) {
        // Determine resource type based on the resource name
        let resourceType: ResourceType = 'org';
        if (resource === 'sites' || resource === 'site') resourceType = 'site';
        else if (resource === 'reports' || resource === 'report') resourceType = 'report';
        else if (resource === 'devices' || resource === 'device') resourceType = 'device';

        // Use SimpleRBACService for resource-specific checks
        const permissionCheck = await SimpleRBACService.checkPermission(
          userId,
          resourceType,
          resourceId,
          action
        );

        if (permissionCheck.allowed) {
          return true;
        }

        // If not in user_access, check app_users for organization-level permissions
        if (resourceType === 'org') {
          const role = await this.getUserOrgRole(userId, resourceId);
          if (role && this.roleHasPermission(role, resource, action)) {
            return true;
          }
        }
      }

      // 3. Check general permissions without specific resource
      // Get user's organizations and check if they have permission in any
      const supabase = typeof window === 'undefined'
        ? supabaseAdmin // Use admin client to bypass RLS
        : createBrowserClient();

      const { data: appUser } = await supabase
        .from('app_users')
        .select('role, organization_id')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (appUser?.role) {
        return this.roleHasPermission(appUser.role as CoreRole, resource, action);
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Check if a role has permission for a specific action on a resource
   */
  static roleHasPermission(role: CoreRole, resource: string, action: string): boolean {
    const permissions = ROLE_PERMISSIONS[role];
    if (!permissions) return false;

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions.includes('*') || resourcePermissions.includes(action);
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string): Promise<Record<string, string[]>> {
    try {
      // Check if super admin
      if (await this.isSuperAdmin(userId)) {
        // Super admins have all permissions
        return {
          organization: ['*'],
          sites: ['*'],
          users: ['*'],
          billing: ['*'],
          settings: ['*'],
          reports: ['*'],
          data: ['*'],
          devices: ['*']
        };
      }

      // Get user's role from app_users
      const supabase = typeof window === 'undefined'
        ? await createClient()
        : createBrowserClient();

      const { data: appUser } = await supabase
        .from('app_users')
        .select('role')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (appUser?.role && ROLE_PERMISSIONS[appUser.role as CoreRole]) {
        return ROLE_PERMISSIONS[appUser.role as CoreRole];
      }

      // Default to viewer permissions
      return ROLE_PERMISSIONS.viewer;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {};
    }
  }

  /**
   * Check if user can manage other users
   */
  static async canManageUsers(userId: string, orgId?: string): Promise<boolean> {
    if (orgId) {
      return this.checkPermission(userId, 'users', 'update', orgId);
    }
    return this.checkPermission(userId, 'users', 'update');
  }

  /**
   * Check if user can manage organizations
   */
  static async canManageOrganizations(userId: string, orgId?: string): Promise<boolean> {
    if (orgId) {
      return this.checkPermission(userId, 'organization', 'update', orgId);
    }
    return this.checkPermission(userId, 'organization', 'update');
  }

  /**
   * Check if user can view sites
   */
  static async canViewSites(userId: string, siteId?: string): Promise<boolean> {
    if (siteId) {
      return this.checkPermission(userId, 'sites', 'read', siteId);
    }
    return this.checkPermission(userId, 'sites', 'read');
  }

  /**
   * Check if user can manage sites
   */
  static async canManageSites(userId: string, siteId?: string): Promise<boolean> {
    if (siteId) {
      return this.checkPermission(userId, 'sites', 'update', siteId);
    }
    return this.checkPermission(userId, 'sites', 'update');
  }

  /**
   * Check if user can view data
   */
  static async canViewData(userId: string, orgId?: string): Promise<boolean> {
    if (orgId) {
      return this.checkPermission(userId, 'data', 'read', orgId);
    }
    return this.checkPermission(userId, 'data', 'read');
  }

  /**
   * Check if user can edit data
   */
  static async canEditData(userId: string, orgId?: string): Promise<boolean> {
    if (orgId) {
      return this.checkPermission(userId, 'data', 'update', orgId);
    }
    return this.checkPermission(userId, 'data', 'update');
  }
}

// Export convenience functions for common checks
export const {
  isSuperAdmin,
  checkPermission,
  getUserOrgRole,
  getUserPermissions,
  canManageUsers,
  canManageOrganizations,
  canViewSites,
  canManageSites,
  canViewData,
  canEditData
} = PermissionService;