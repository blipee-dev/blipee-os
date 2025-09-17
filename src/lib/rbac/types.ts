/**
 * RBAC System Types
 * Simple 4-role system: owner, manager, member, viewer
 */

// Role names
export enum SimpleRoleName {
  OWNER = 'owner',
  MANAGER = 'manager',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

// Legacy role mapping (for backward compatibility)
export const LEGACY_TO_SIMPLE_MAPPING: Record<string, SimpleRoleName> = {
  'account_owner': SimpleRoleName.OWNER,
  'sustainability_manager': SimpleRoleName.MANAGER,
  'facility_manager': SimpleRoleName.MEMBER,
  'analyst': SimpleRoleName.MEMBER,
  'viewer': SimpleRoleName.VIEWER,
  'stakeholder': SimpleRoleName.VIEWER,
  // Legacy Enterprise RBAC mappings (deprecated)
  'ORGANIZATION_OWNER': SimpleRoleName.OWNER,
  'ORGANIZATION_ADMIN': SimpleRoleName.MANAGER,
  'SUSTAINABILITY_DIRECTOR': SimpleRoleName.MANAGER,
  'REGIONAL_MANAGER': SimpleRoleName.MANAGER,
  'SITE_MANAGER': SimpleRoleName.MEMBER,
  'SITE_ANALYST': SimpleRoleName.MEMBER,
  'SITE_OPERATOR': SimpleRoleName.MEMBER,
  'AUDITOR': SimpleRoleName.VIEWER,
  'STAKEHOLDER': SimpleRoleName.VIEWER
};

// User access record (from user_access table)
export interface UserAccess {
  id: string;
  user_id: string;
  resource_type: 'org' | 'site' | 'report' | string;
  resource_id: string;
  role: SimpleRoleName;
  permissions?: Record<string, any>; // Override permissions if needed
  granted_by?: string;
  granted_at: Date;
  expires_at?: Date;
  metadata?: Record<string, any>;
}

// Super admin record (from super_admins table)
export interface SuperAdmin {
  user_id: string;
  granted_by?: string;
  granted_at: Date;
  reason?: string;
}

// Role permissions structure
export interface RolePermissions {
  organization?: string[];
  sites?: string[];
  users?: string[];
  billing?: string[];
  settings?: string[];
  reports?: string[];
  data?: string[];
  devices?: string[];
}

// Role definition
export interface SimpleRole {
  name: SimpleRoleName;
  level: 'org' | 'site';
  base_permissions: RolePermissions;
  description: string;
}

// Role definitions with permissions
export const SIMPLE_RBAC_ROLES: Record<SimpleRoleName, SimpleRole> = {
  [SimpleRoleName.OWNER]: {
    name: SimpleRoleName.OWNER,
    level: 'org',
    base_permissions: {
      organization: ['*'],
      sites: ['*'],
      users: ['*'],
      billing: ['*'],
      settings: ['*'],
      reports: ['*'],
      data: ['*'],
      devices: ['*']
    },
    description: 'Organization owner - full control'
  },
  [SimpleRoleName.MANAGER]: {
    name: SimpleRoleName.MANAGER,
    level: 'org',
    base_permissions: {
      organization: ['read', 'update'],
      sites: ['*'],
      users: ['create', 'read', 'update'],
      settings: ['read', 'update'],
      reports: ['*'],
      data: ['*'],
      devices: ['*']
    },
    description: 'Organization manager - manages sites and users'
  },
  [SimpleRoleName.MEMBER]: {
    name: SimpleRoleName.MEMBER,
    level: 'site',
    base_permissions: {
      sites: ['read', 'update'],
      reports: ['create', 'read'],
      data: ['create', 'read', 'update'],
      devices: ['read', 'update']
    },
    description: 'Site member - can edit data and create reports'
  },
  [SimpleRoleName.VIEWER]: {
    name: SimpleRoleName.VIEWER,
    level: 'site',
    base_permissions: {
      sites: ['read'],
      reports: ['read'],
      data: ['read'],
      devices: ['read']
    },
    description: 'Viewer - read-only access'
  }
};