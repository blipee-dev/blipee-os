'use client';

import { useEffect, useState, useCallback } from 'react';
import { CoreRole, ResourceType } from './service';

/**
 * Simple permission hook - one hook to rule them all
 */
export function usePermission(
  resourceType: ResourceType,
  resourceId: string,
  action: string
): {
  allowed: boolean;
  loading: boolean;
  error: Error | null;
  role?: CoreRole;
} {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [role, setRole] = useState<CoreRole | undefined>();

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rbac-simple/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource_type: resourceType,
            resource_id: resourceId,
            action
          })
        });

        if (!response.ok) {
          throw new Error('Failed to check permission');
        }

        const result = await response.json();
        setAllowed(result.allowed);
        setRole(result.role);
      } catch (err) {
        setError(err as Error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [resourceType, resourceId, action]);

  return { allowed, loading, error, role };
}

/**
 * Hook to check if user has a specific role for a resource
 */
export function useHasRole(
  resourceType: ResourceType,
  resourceId: string,
  requiredRole: CoreRole
): boolean {
  const { allowed, role } = usePermission(resourceType, resourceId, 'read');

  if (!allowed || !role) return false;

  // Role hierarchy check
  const roleHierarchy: CoreRole[] = ['owner', 'manager', 'member', 'viewer'];
  const userRoleIndex = roleHierarchy.indexOf(role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex !== -1 && userRoleIndex <= requiredRoleIndex;
}

/**
 * Hook to get user's access records
 */
export function useUserAccess(): {
  access: Array<{
    resource_type: ResourceType;
    resource_id: string;
    role: CoreRole;
    resource_name?: string;
  }>;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [access, setAccess] = useState<Array<{
    resource_type: ResourceType;
    resource_id: string;
    role: CoreRole;
    resource_name?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccess = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rbac-simple/user-access');

      if (!response.ok) {
        throw new Error('Failed to fetch user access');
      }

      const data = await response.json();
      setAccess(data.access || []);
    } catch (err) {
      setError(err as Error);
      setAccess([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  return { access, loading, error, refetch: fetchAccess };
}

/**
 * Hook for organization access (backward compatibility)
 */
export function useOrgAccess(orgId: string) {
  return usePermission('org', orgId, 'read');
}

/**
 * Hook for site access (backward compatibility)
 */
export function useSiteAccess(siteId: string) {
  return usePermission('site', siteId, 'read');
}

/**
 * Hook to check if user can manage users in an organization
 */
export function useCanManageUsers(orgId: string): boolean {
  const { allowed, role } = usePermission('org', orgId, 'users');
  return allowed && (role === 'owner' || role === 'manager');
}

/**
 * Hook to check if user can manage sites in an organization
 */
export function useCanManageSites(orgId: string): boolean {
  const { allowed, role } = usePermission('org', orgId, 'sites');
  return allowed && (role === 'owner' || role === 'manager');
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useConditionalRender(
  resourceType: ResourceType,
  resourceId: string,
  action: string
): {
  render: boolean;
  loading: boolean;
} {
  const { allowed, loading } = usePermission(resourceType, resourceId, action);
  return { render: allowed, loading };
}