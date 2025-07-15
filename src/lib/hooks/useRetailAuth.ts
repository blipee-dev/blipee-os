'use client';

import { useState, useEffect } from 'react';
import { ModuleContext } from '@/lib/modules/types';
import { createRetailContext, RETAIL_PERMISSIONS } from '@/lib/auth/retail-permissions';

interface RetailAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  context: ModuleContext | null;
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  user: any;
  organization: any;
}

// Mock session hook - in production this would integrate with your auth system
export function useRetailAuth(): RetailAuthState {
  const [state, setState] = useState<RetailAuthState>({
    isAuthenticated: false,
    isLoading: true,
    context: null,
    permissions: [],
    hasPermission: () => false,
    user: null,
    organization: null,
  });

  useEffect(() => {
    // Simulate auth check - in production this would be real auth validation
    const mockSession = {
      user: {
        id: 'user-123',
        email: 'demo@blipee.ai',
        name: 'Demo User',
        roles: ['retail_manager', 'sustainability_lead']
      },
      organization: {
        id: 'org-456',
        name: 'Demo Organization',
        type: 'retail'
      }
    };

    const context = createRetailContext(
      mockSession.user,
      mockSession.organization,
      mockSession.user.roles
    );

    setState({
      isAuthenticated: true,
      isLoading: false,
      context,
      permissions: context.permissions,
      hasPermission: (permission: string) => context.permissions.includes(permission),
      user: mockSession.user,
      organization: mockSession.organization,
    });
  }, []);

  return state;
}

// Convenience hooks for specific permissions
export function useRetailReadAccess(): boolean {
  const { hasPermission } = useRetailAuth();
  return hasPermission(RETAIL_PERMISSIONS.READ);
}

export function useRetailAnalyticsAccess(): boolean {
  const { hasPermission } = useRetailAuth();
  return hasPermission(RETAIL_PERMISSIONS.ANALYTICS);
}

export function useRetailAdminAccess(): boolean {
  const { hasPermission } = useRetailAuth();
  return hasPermission(RETAIL_PERMISSIONS.ADMIN);
}

// Hook for checking multiple permissions
export function useRetailPermissions(requiredPermissions: string[]): boolean {
  const { hasPermission } = useRetailAuth();
  return requiredPermissions.every(permission => hasPermission(permission));
}