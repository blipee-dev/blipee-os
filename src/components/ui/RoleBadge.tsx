/**
 * Unified Role Badge Component
 * Displays role badges with consistent styling across the app
 */

import React from 'react';
import { Role, getRoleDisplayName, getRoleBadgeColor } from '@/lib/permissions/roles';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RoleBadge({ role, size = 'md', className = '' }: RoleBadgeProps) {
  const displayName = getRoleDisplayName(role);
  const color = getRoleBadgeColor(role);
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };
  
  const colorClasses = {
    red: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
  };
  
  return (
    <span 
      className={`
        inline-flex items-center font-semibold rounded-full
        ${sizeClasses[size]}
        ${colorClasses[color as keyof typeof colorClasses] || colorClasses.gray}
        ${className}
      `}
    >
      {displayName}
    </span>
  );
}