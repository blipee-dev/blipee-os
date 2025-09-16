'use client';

import React from 'react';
import { usePermission } from '@/lib/rbac/hooks';
import { ResourceType, Action } from '@/lib/rbac/types';

interface PermissionGateProps {
  resource: ResourceType;
  action: Action;
  organizationId?: string;
  siteId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLoading?: boolean;
}

export function PermissionGate({
  resource,
  action,
  organizationId,
  siteId,
  children,
  fallback = null,
  showLoading = true
}: PermissionGateProps) {
  const { allowed, loading, error } = usePermission(resource, action, organizationId, siteId);

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}