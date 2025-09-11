/**
 * Permission Guard Component
 * Conditionally renders children based on user permissions
 */

'use client';

import React, { useEffect, useState } from 'react';
import { permissionService } from '@/lib/permissions/service';
import { Role } from '@/types/permissions';
import { Loader2 } from 'lucide-react';

interface PermissionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredRole?: Role;
  resourceType?: 'organization' | 'site' | 'group';
  resourceId?: string;
  requireSuperAdmin?: boolean;
  loading?: React.ReactNode;
}

export function PermissionGuard({
  children,
  fallback = null,
  requiredRole,
  resourceType,
  resourceId,
  requireSuperAdmin = false,
  loading = <Loader2 className="w-4 h-4 animate-spin" />
}: PermissionGuardProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  useEffect(() => {
    async function checkPermission() {
      try {
        // Check super admin requirement
        if (requireSuperAdmin) {
          const isSuperAdmin = await permissionService.isSuperAdmin();
          setHasPermission(isSuperAdmin);
          return;
        }
        
        // Check resource-based permission
        if (resourceType && resourceId) {
          const result = await permissionService.canAccessResource(
            resourceType,
            resourceId,
            requiredRole
          );
          setHasPermission(result.hasAccess);
          return;
        }
        
        // If no specific checks, allow access
        setHasPermission(true);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      }
    }
    
    checkPermission();
  }, [requiredRole, resourceType, resourceId, requireSuperAdmin]);
  
  if (hasPermission === null) {
    return <>{loading}</>;
  }
  
  return hasPermission ? <>{children}</> : <>{fallback}</>;
}

/**
 * Hook for checking permissions
 */
export function usePermission(
  resourceType?: 'organization' | 'site' | 'group',
  resourceId?: string,
  requiredRole?: Role
) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function check() {
      if (!resourceType || !resourceId) {
        setHasPermission(true);
        setIsLoading(false);
        return;
      }
      
      try {
        const result = await permissionService.canAccessResource(
          resourceType,
          resourceId,
          requiredRole
        );
        setHasPermission(result.hasAccess);
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    check();
  }, [resourceType, resourceId, requiredRole]);
  
  return { hasPermission, isLoading };
}

/**
 * Hook for checking if user is super admin
 */
export function useSuperAdmin() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function check() {
      try {
        const result = await permissionService.isSuperAdmin();
        setIsSuperAdmin(result);
      } catch (error) {
        console.error('Super admin check failed:', error);
        setIsSuperAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    check();
  }, []);
  
  return { isSuperAdmin, isLoading };
}