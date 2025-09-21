/**
 * Simple RBAC Authentication & Authorization System
 * Based on industry best practices - 4 core roles that cover 90% of use cases
 *
 * @module auth-simple-rbac
 * @version 3.0.0
 */

import { z } from 'zod';

// ============================================================================
// SIMPLE RBAC ROLE DEFINITIONS
// ============================================================================

/**
 * Core system roles - Simple and effective
 * These 4 roles cover 90% of enterprise use cases
 */
export const SIMPLE_ROLES = {
  OWNER: 'owner',         // Organization owner with full control
  MANAGER: 'manager',     // Manages sites and users
  MEMBER: 'member',       // Can edit data and create reports
  VIEWER: 'viewer',       // Read-only access
} as const;

export type SimpleRole = typeof SIMPLE_ROLES[keyof typeof SIMPLE_ROLES];

// Zod schema for runtime validation
export const SimpleRoleSchema = z.enum([
  SIMPLE_ROLES.OWNER,
  SIMPLE_ROLES.MANAGER,
  SIMPLE_ROLES.MEMBER,
  SIMPLE_ROLES.VIEWER,
]);

// Role hierarchy for permission inheritance
export const SIMPLE_ROLE_HIERARCHY: Record<SimpleRole, number> = {
  [SIMPLE_ROLES.OWNER]: 100,
  [SIMPLE_ROLES.MANAGER]: 70,
  [SIMPLE_ROLES.MEMBER]: 40,
  [SIMPLE_ROLES.VIEWER]: 10,
};

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export const RESOURCE_TYPES = {
  ORGANIZATION: 'org',
  SITE: 'site',
  REPORT: 'report',
  DEVICE: 'device',
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

// ============================================================================
// ACTIONS
// ============================================================================

export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  ALL: '*',
} as const;

export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// ============================================================================
// PERMISSION DEFINITIONS
// ============================================================================

/**
 * Permission matrix defining what each role can do
 */
export const ROLE_PERMISSIONS: Record<SimpleRole, Record<string, Action[]>> = {
  [SIMPLE_ROLES.OWNER]: {
    organization: ['*'],
    sites: ['*'],
    users: ['*'],
    billing: ['*'],
    settings: ['*'],
    reports: ['*'],
    data: ['*'],
    devices: ['*'],
  },
  [SIMPLE_ROLES.MANAGER]: {
    organization: ['read', 'update'],
    sites: ['*'],
    users: ['create', 'read', 'update'],
    settings: ['read', 'update'],
    reports: ['*'],
    data: ['*'],
    devices: ['*'],
  },
  [SIMPLE_ROLES.MEMBER]: {
    sites: ['read', 'update'],
    reports: ['create', 'read'],
    data: ['create', 'read', 'update'],
    devices: ['read', 'update'],
  },
  [SIMPLE_ROLES.VIEWER]: {
    sites: ['read'],
    reports: ['read'],
    data: ['read'],
    devices: ['read'],
  },
};

// ============================================================================
// USER ACCESS TYPE
// ============================================================================

export interface UserAccess {
  id: string;
  user_id: string;
  resource_type: ResourceType;
  resource_id: string;
  role: SimpleRole;
  permissions?: Record<string, any>;
  granted_by?: string;
  granted_at: Date;
  expires_at?: Date;
}

// ============================================================================
// PERMISSION CHECK RESULT
// ============================================================================

export interface PermissionCheck {
  allowed: boolean;
  role?: SimpleRole;
  source: 'role' | 'super_admin' | 'none';
}

// ============================================================================
// SUPER ADMIN
// ============================================================================

/**
 * Super admin is NOT a role - it's a separate table
 * Super admins bypass all permission checks
 */
export interface SuperAdmin {
  id: string;
  user_id: string;
  granted_by?: string;
  granted_at: Date;
  reason?: string;
}

// ============================================================================
// LEGACY ROLE MAPPING
// ============================================================================

/**
 * Map legacy roles to Simple RBAC roles
 * For backward compatibility during migration
 */
export const LEGACY_TO_SIMPLE_MAPPING: Record<string, SimpleRole> = {
  'account_owner': SIMPLE_ROLES.OWNER,
  'sustainability_manager': SIMPLE_ROLES.MANAGER,
  'facility_manager': SIMPLE_ROLES.MEMBER,
  'analyst': SIMPLE_ROLES.MEMBER,
  'viewer': SIMPLE_ROLES.VIEWER,
  'stakeholder': SIMPLE_ROLES.VIEWER,
  'user': SIMPLE_ROLES.MEMBER,
  'member': SIMPLE_ROLES.MEMBER,
  'admin': SIMPLE_ROLES.OWNER,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(
  role: SimpleRole,
  resource: string,
  action: Action
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  return resourcePermissions.includes('*') || resourcePermissions.includes(action);
}

/**
 * Get the highest role from a list of roles
 */
export function getHighestRole(roles: SimpleRole[]): SimpleRole {
  if (roles.length === 0) return SIMPLE_ROLES.VIEWER;

  return roles.reduce((highest, current) => {
    return SIMPLE_ROLE_HIERARCHY[current] > SIMPLE_ROLE_HIERARCHY[highest]
      ? current
      : highest;
  });
}

/**
 * Check if role A is higher than role B
 */
export function isRoleHigher(roleA: SimpleRole, roleB: SimpleRole): boolean {
  return SIMPLE_ROLE_HIERARCHY[roleA] > SIMPLE_ROLE_HIERARCHY[roleB];
}

/**
 * Convert legacy role to Simple RBAC role
 */
export function convertLegacyRole(legacyRole: string): SimpleRole {
  return LEGACY_TO_SIMPLE_MAPPING[legacyRole] || SIMPLE_ROLES.VIEWER;
}