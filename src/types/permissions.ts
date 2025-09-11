/**
 * Simple RBAC Permission System Types
 */

// Core role hierarchy (simple!)
export enum Role {
  OWNER = 'owner',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

// Resource types that can have permissions
export type ResourceType = 'organization' | 'site' | 'group';

// How the user got access
export type AccessType = 'super_admin' | 'organization' | 'direct' | 'group' | 'assigned';

// User access record
export interface UserAccess {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  resource_id: string;
  role: Role;
  granted_by?: string;
  created_at: Date;
  updated_at: Date;
  expires_at?: Date;
}

// Group for multi-site access
export interface Group {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  site_ids: string[];
  created_by?: string;
  created_at: Date;
  updated_at: Date;
}

// Permission check result
export interface PermissionResult {
  hasAccess: boolean;
  role?: Role;
  accessType?: AccessType;
  expiresAt?: Date;
}

// User's complete access profile
export interface UserAccessProfile {
  user_id: string;
  is_super_admin: boolean;
  organizations: OrganizationAccess[];
  sites: SiteAccess[];
  groups: GroupAccess[];
}

export interface OrganizationAccess {
  organization_id: string;
  organization_name: string;
  role: Role;
  access_type: AccessType;
}

export interface SiteAccess {
  site_id: string;
  site_name: string;
  organization_id: string;
  role: Role;
  access_type: AccessType;
}

export interface GroupAccess {
  group_id: string;
  group_name: string;
  organization_id: string;
  role: Role;
  site_ids: string[];
}

// Audit log entry
export interface AccessAuditLog {
  id: string;
  user_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  resource_type: ResourceType;
  resource_id: string;
  old_data?: any;
  new_data?: any;
  created_at: Date;
}

// Helper type for role hierarchy comparison
export const RoleHierarchy: Record<Role, number> = {
  [Role.OWNER]: 4,
  [Role.MANAGER]: 3,
  [Role.MEMBER]: 2,
  [Role.VIEWER]: 1
};

// Permission utilities
export class PermissionUtils {
  /**
   * Check if a user role has required permission level
   */
  static hasPermission(userRole: Role, requiredRole: Role): boolean {
    return RoleHierarchy[userRole] >= RoleHierarchy[requiredRole];
  }

  /**
   * Get the highest role from a list of roles
   */
  static getHighestRole(roles: Role[]): Role {
    if (roles.length === 0) return Role.VIEWER;
    
    return roles.reduce((highest, current) => {
      return RoleHierarchy[current] > RoleHierarchy[highest] ? current : highest;
    });
  }

  /**
   * Check if access has expired
   */
  static isExpired(expiresAt?: Date | string): boolean {
    if (!expiresAt) return false;
    const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return expiry < new Date();
  }

  /**
   * Format role for display
   */
  static getRoleDisplayName(role: Role): string {
    const displayNames: Record<Role, string> = {
      [Role.OWNER]: 'Owner',
      [Role.MANAGER]: 'Manager',
      [Role.MEMBER]: 'Member',
      [Role.VIEWER]: 'Viewer'
    };
    return displayNames[role] || role;
  }

  /**
   * Get role badge color for UI
   */
  static getRoleBadgeColor(role: Role): string {
    const colors: Record<Role, string> = {
      [Role.OWNER]: 'red',
      [Role.MANAGER]: 'orange',
      [Role.MEMBER]: 'blue',
      [Role.VIEWER]: 'gray'
    };
    return colors[role] || 'gray';
  }
}

// Type guards
export function isOwner(role?: Role): boolean {
  return role === Role.OWNER;
}

export function isManager(role?: Role): boolean {
  return role === Role.MANAGER || role === Role.OWNER;
}

export function isMember(role?: Role): boolean {
  return role === Role.MEMBER || isManager(role);
}

export function isViewer(role?: Role): boolean {
  return !!role; // Any role can view
}

// Permission actions by role
export const RolePermissions = {
  [Role.OWNER]: {
    // Organization level
    canManageOrganization: true,
    canManageBilling: true,
    canDeleteOrganization: true,
    canInviteUsers: true,
    canRemoveUsers: true,
    canManageAllSites: true,
    canCreateSites: true,
    canDeleteSites: true,
    
    // Site level
    canEditSiteData: true,
    canViewSiteData: true,
    canExportData: true,
    canManageTargets: true,
    canApproveReports: true,
    
    // System
    canAccessAuditLogs: true,
    canManageIntegrations: true
  },
  [Role.MANAGER]: {
    // Organization level
    canManageOrganization: true,
    canManageBilling: false,
    canDeleteOrganization: false,
    canInviteUsers: true,
    canRemoveUsers: true,
    canManageAllSites: true,
    canCreateSites: true,
    canDeleteSites: false,
    
    // Site level
    canEditSiteData: true,
    canViewSiteData: true,
    canExportData: true,
    canManageTargets: true,
    canApproveReports: true,
    
    // System
    canAccessAuditLogs: true,
    canManageIntegrations: true
  },
  [Role.MEMBER]: {
    // Organization level
    canManageOrganization: false,
    canManageBilling: false,
    canDeleteOrganization: false,
    canInviteUsers: false,
    canRemoveUsers: false,
    canManageAllSites: false,
    canCreateSites: false,
    canDeleteSites: false,
    
    // Site level
    canEditSiteData: true,
    canViewSiteData: true,
    canExportData: true,
    canManageTargets: false,
    canApproveReports: false,
    
    // System
    canAccessAuditLogs: false,
    canManageIntegrations: false
  },
  [Role.VIEWER]: {
    // Organization level
    canManageOrganization: false,
    canManageBilling: false,
    canDeleteOrganization: false,
    canInviteUsers: false,
    canRemoveUsers: false,
    canManageAllSites: false,
    canCreateSites: false,
    canDeleteSites: false,
    
    // Site level
    canEditSiteData: false,
    canViewSiteData: true,
    canExportData: true,
    canManageTargets: false,
    canApproveReports: false,
    
    // System
    canAccessAuditLogs: false,
    canManageIntegrations: false
  }
};