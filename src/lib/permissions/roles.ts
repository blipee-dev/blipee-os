/**
 * Role definitions and utilities for RBAC system
 */

export type Role =
  | 'account_owner'
  | 'sustainability_manager'
  | 'facility_manager'
  | 'analyst'
  | 'viewer';

export interface RoleDefinition {
  value: Role;
  label: string;
  description: string;
}

/**
 * Get all available roles in the system
 */
export function getAvailableRoles(): RoleDefinition[] {
  return [
    {
      value: 'account_owner',
      label: 'Account Owner',
      description: 'Full control over the organization, billing, and all settings'
    },
    {
      value: 'sustainability_manager',
      label: 'Sustainability Manager',
      description: 'Manage ESG data, sustainability targets, and reporting'
    },
    {
      value: 'facility_manager',
      label: 'Facility Manager',
      description: 'Manage sites, devices, and building operations'
    },
    {
      value: 'analyst',
      label: 'Analyst',
      description: 'View and analyze data, create reports, export data'
    },
    {
      value: 'viewer',
      label: 'Viewer',
      description: 'View-only access to data and reports'
    }
  ];
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleHierarchy(role: Role): number {
  const hierarchy: Record<Role, number> = {
    account_owner: 5,
    sustainability_manager: 4,
    facility_manager: 3,
    analyst: 2,
    viewer: 1
  };
  return hierarchy[role] || 0;
}

/**
 * Check if a role can perform an action on another role
 */
export function canManageRole(currentRole: Role, targetRole: Role): boolean {
  return getRoleHierarchy(currentRole) > getRoleHierarchy(targetRole);
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  const roleDefinition = getAvailableRoles().find(r => r.value === role);
  return roleDefinition?.label || role;
}

/**
 * Get role color for UI display
 */
export function getRoleColor(role: Role): string {
  const colors: Record<Role, string> = {
    account_owner: 'purple',
    sustainability_manager: 'green',
    facility_manager: 'blue',
    analyst: 'yellow',
    viewer: 'gray'
  };
  return colors[role] || 'gray';
}