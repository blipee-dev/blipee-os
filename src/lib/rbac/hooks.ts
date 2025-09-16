/**
 * React hooks for Enterprise RBAC
 */

import { useEffect, useState, useCallback } from 'react';
import { UserAccessProfile, PermissionCheckResult, ResourceType, Action, RoleName } from './types';

/**
 * Hook to check if user has a specific permission
 */
export function usePermission(
  resource: ResourceType,
  action: Action,
  organizationId?: string,
  siteId?: string
): {
  allowed: boolean;
  loading: boolean;
  error: Error | null;
} {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rbac/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource,
            action,
            organization_id: organizationId,
            site_id: siteId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to check permission');
        }

        const result: PermissionCheckResult = await response.json();
        setAllowed(result.allowed);
      } catch (err) {
        setError(err as Error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [resource, action, organizationId, siteId]);

  return { allowed, loading, error };
}

/**
 * Hook to get user's complete access profile
 */
export function useUserAccessProfile(): {
  profile: UserAccessProfile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const [profile, setProfile] = useState<UserAccessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/rbac/profile');

      if (!response.ok) {
        throw new Error('Failed to fetch user access profile');
      }

      const data: UserAccessProfile = await response.json();
      setProfile(data);
    } catch (err) {
      setError(err as Error);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(
  roleName: RoleName,
  organizationId?: string,
  siteId?: string
): boolean {
  const { profile } = useUserAccessProfile();

  if (!profile) return false;

  // Super admin has all roles
  if (profile.is_super_admin) return true;

  return profile.roles.some(role => {
    const roleMatches = role.role_name === roleName;
    const orgMatches = !organizationId || role.organization_id === organizationId;
    const siteMatches = !siteId || !role.site_id || role.site_id === siteId;

    return roleMatches && orgMatches && siteMatches;
  });
}

/**
 * Hook to check if user is a super admin
 */
export function useIsSuperAdmin(): boolean {
  const { profile } = useUserAccessProfile();
  return profile?.is_super_admin || false;
}

/**
 * Hook to get user's highest role in an organization
 */
export function useHighestRole(organizationId: string): RoleName | null {
  const { profile } = useUserAccessProfile();

  if (!profile) return null;

  // Super admin is always highest
  if (profile.is_super_admin) return RoleName.SUPER_ADMIN;

  // Role hierarchy (highest to lowest)
  const roleHierarchy = [
    RoleName.ORGANIZATION_OWNER,
    RoleName.ORGANIZATION_ADMIN,
    RoleName.SUSTAINABILITY_DIRECTOR,
    RoleName.REGIONAL_MANAGER,
    RoleName.SITE_MANAGER,
    RoleName.SITE_ANALYST,
    RoleName.SITE_OPERATOR,
    RoleName.AUDITOR,
    RoleName.STAKEHOLDER
  ];

  const userRolesInOrg = profile.roles.filter(
    role => role.organization_id === organizationId
  );

  for (const roleName of roleHierarchy) {
    if (userRolesInOrg.some(role => role.role_name === roleName)) {
      return roleName;
    }
  }

  return null;
}

/**
 * Hook for conditional rendering based on permissions
 */
export function useConditionalRender(
  resource: ResourceType,
  action: Action,
  organizationId?: string,
  siteId?: string
): {
  render: boolean;
  loading: boolean;
} {
  const { allowed, loading } = usePermission(resource, action, organizationId, siteId);
  return { render: allowed, loading };
}

/**
 * Hook to get available actions for a resource
 */
export function useAvailableActions(
  resource: ResourceType,
  organizationId?: string,
  siteId?: string
): {
  actions: Action[];
  loading: boolean;
} {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/rbac/available-actions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resource,
            organization_id: organizationId,
            site_id: siteId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch available actions');
        }

        const data = await response.json();
        setActions(data.actions || []);
      } catch (err) {
        console.error('Error fetching available actions:', err);
        setActions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [resource, organizationId, siteId]);

  return { actions, loading };
}