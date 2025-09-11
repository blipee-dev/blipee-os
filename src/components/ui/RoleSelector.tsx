/**
 * Role Selector Component
 * For selecting user roles in forms with new RBAC system
 */

import React from 'react';
import { Role, getAvailableRoles } from '@/lib/permissions/roles';
import { CustomDropdown } from './CustomDropdown';

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
  const availableRoles = getAvailableRoles();
  
  // Filter roles based on current user's role (can't assign higher roles)
  const filteredRoles = currentUserRole 
    ? availableRoles.filter(role => {
        const hierarchy: Record<string, number> = {
          owner: 4,
          manager: 3,
          member: 2,
          viewer: 1
        };
        return hierarchy[role.value] <= (hierarchy[currentUserRole] || 0);
      })
    : availableRoles;
  
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
  const roles = getAvailableRoles();
  
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
      {roles.map(role => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}