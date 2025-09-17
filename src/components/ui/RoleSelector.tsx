/**
 * Role Selector Component
 * For selecting user roles with Simple RBAC system (4 roles)
 */

import React from 'react';
import { CustomDropdown } from './CustomDropdown';
import { SimpleRoleName, SIMPLE_RBAC_ROLES } from '@/lib/rbac/types';

interface RoleSelectorProps {
  value: string;
  onChange: (role: string) => void;
  disabled?: boolean;
  currentUserRole?: string;
  className?: string;
}

export function RoleSelector({
  value,
  onChange,
  disabled = false,
  currentUserRole,
  className = ''
}: RoleSelectorProps) {
  // Simple RBAC roles
  const simpleRoles = [
    { value: 'owner', label: 'Owner', description: SIMPLE_RBAC_ROLES.owner.description },
    { value: 'manager', label: 'Manager', description: SIMPLE_RBAC_ROLES.manager.description },
    { value: 'member', label: 'Member', description: SIMPLE_RBAC_ROLES.member.description },
    { value: 'viewer', label: 'Viewer', description: SIMPLE_RBAC_ROLES.viewer.description }
  ];

  // Filter roles based on current user's role (can't assign higher roles)
  const hierarchy: Record<string, number> = {
    owner: 4,
    manager: 3,
    member: 2,
    viewer: 1
  };

  const filteredRoles = currentUserRole
    ? simpleRoles.filter(role => {
        return hierarchy[role.value] <= (hierarchy[currentUserRole] || 0);
      })
    : simpleRoles;

  const options = filteredRoles.map(role => ({
    value: role.value,
    label: role.label,
    description: role.description
  }));
  
  return (
    <div className={className}>
      <CustomDropdown
        value={value}
        onChange={onChange}
        options={options}
        disabled={disabled}
        placeholder="Select a role"
        className="w-full"
      />
      {options.find(opt => opt.value === value)?.description && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {options.find(opt => opt.value === value)?.description}
        </p>
      )}
    </div>
  );
}

/**
 * Simple role selector without descriptions
 */
export function SimpleRoleSelector({
  value,
  onChange,
  disabled = false,
  className = ''
}: Omit<RoleSelectorProps, 'currentUserRole'>) {
  // Simple RBAC roles
  const simpleRoles = [
    { value: 'owner', label: 'Owner' },
    { value: 'manager', label: 'Manager' },
    { value: 'member', label: 'Member' },
    { value: 'viewer', label: 'Viewer' }
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`
        px-3 py-2 bg-white dark:bg-[#212121]
        border border-gray-200 dark:border-white/[0.05]
        rounded-lg text-gray-900 dark:text-white
        focus:outline-none focus:ring-2 accent-ring
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {simpleRoles.map(role => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}