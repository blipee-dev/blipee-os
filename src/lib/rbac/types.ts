/**
 * Enterprise RBAC System Types
 * Based on docs/RBAC_SYSTEM_ARCHITECTURE.md
 */

// Role levels in the hierarchy
export enum RoleLevel {
  PLATFORM = 'platform',
  ORGANIZATION = 'organization',
  REGIONAL = 'regional',
  SITE = 'site',
  EXTERNAL = 'external'
}

// System role names
export enum RoleName {
  // Platform
  SUPER_ADMIN = 'SUPER_ADMIN',

  // Organization
  ORGANIZATION_OWNER = 'ORGANIZATION_OWNER',
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  SUSTAINABILITY_DIRECTOR = 'SUSTAINABILITY_DIRECTOR',

  // Regional
  REGIONAL_MANAGER = 'REGIONAL_MANAGER',

  // Site
  SITE_MANAGER = 'SITE_MANAGER',
  SITE_ANALYST = 'SITE_ANALYST',
  SITE_OPERATOR = 'SITE_OPERATOR',

  // External
  AUDITOR = 'AUDITOR',
  STAKEHOLDER = 'STAKEHOLDER'
}

// Legacy role mapping (for backward compatibility during migration)
export const LEGACY_ROLE_MAPPING: Record<string, RoleName> = {
  'account_owner': RoleName.ORGANIZATION_OWNER,
  'sustainability_manager': RoleName.SUSTAINABILITY_DIRECTOR,
  'facility_manager': RoleName.SITE_MANAGER,
  'analyst': RoleName.SITE_ANALYST,
  'viewer': RoleName.STAKEHOLDER
};

// Role definition
export interface Role {
  id: string;
  name: RoleName;
  level: RoleLevel;
  permissions: Record<string, string[] | boolean>;
  description: string;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

// User role assignment
export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  organization_id: string;
  site_id?: string;
  region?: string;
  granted_by?: string;
  granted_at: Date;
  expires_at?: Date;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// Permission override
export interface PermissionOverride {
  id: string;
  user_id: string;
  organization_id: string;
  site_id?: string;
  resource_type: string;
  resource_id?: string;
  permission: string;
  granted_by: string;
  reason: string;
  expires_at?: Date;
  created_at: Date;
}

// Delegation
export interface Delegation {
  id: string;
  delegator_user_id: string;
  delegate_user_id: string;
  delegator_role_id: string;
  scope: 'full' | 'partial';
  permissions?: Record<string, string[]>;
  reason: string;
  starts_at: Date;
  ends_at?: Date;
  is_active: boolean;
  approved_by?: string;
  approved_at?: Date;
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  role?: string;
  source: 'role' | 'override' | 'delegation' | 'super_admin';
  expires_at?: Date;
}

// User's complete access profile
export interface UserAccessProfile {
  user_id: string;
  is_super_admin: boolean;
  roles: UserRoleInfo[];
  overrides: PermissionOverride[];
  delegations: Delegation[];
}

export interface UserRoleInfo {
  role_name: RoleName;
  role_level: RoleLevel;
  organization_id: string;
  organization_name?: string;
  site_id?: string;
  site_name?: string;
  region?: string;
  is_active: boolean;
  expires_at?: Date;
}

// Resource types that can have permissions
export type ResourceType =
  | 'organization'
  | 'site'
  | 'user'
  | 'report'
  | 'emission'
  | 'target'
  | 'device'
  | 'billing'
  | 'settings'
  | 'compliance'
  | 'audit_trail';

// Actions that can be performed on resources
export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'export'
  | 'analyze'
  | '*'; // All actions

// Permission structure
export interface Permission {
  resource: ResourceType;
  actions: Action[];
}

// Helper type for permission checking
export interface PermissionContext {
  user_id: string;
  resource: ResourceType;
  action: Action;
  organization_id?: string;
  site_id?: string;
  resource_id?: string;
}