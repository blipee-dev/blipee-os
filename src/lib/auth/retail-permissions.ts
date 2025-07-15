import { ModuleContext } from '@/lib/modules/types';

// Retail-specific permission definitions
export const RETAIL_PERMISSIONS = {
  READ: 'retail:read',
  WRITE: 'retail:write',
  ANALYTICS: 'retail:analytics',
  ADMIN: 'retail:admin',
  STORE_MANAGEMENT: 'retail:store_management',
  REPORTS: 'retail:reports',
} as const;

// User role to permission mapping for retail module
export const RETAIL_ROLE_PERMISSIONS = {
  retail_viewer: [RETAIL_PERMISSIONS.READ],
  retail_analyst: [RETAIL_PERMISSIONS.READ, RETAIL_PERMISSIONS.ANALYTICS],
  retail_manager: [
    RETAIL_PERMISSIONS.READ,
    RETAIL_PERMISSIONS.WRITE,
    RETAIL_PERMISSIONS.ANALYTICS,
    RETAIL_PERMISSIONS.STORE_MANAGEMENT,
  ],
  retail_admin: [
    RETAIL_PERMISSIONS.READ,
    RETAIL_PERMISSIONS.WRITE,
    RETAIL_PERMISSIONS.ANALYTICS,
    RETAIL_PERMISSIONS.STORE_MANAGEMENT,
    RETAIL_PERMISSIONS.REPORTS,
    RETAIL_PERMISSIONS.ADMIN,
  ],
  // Global roles that include retail access
  account_owner: Object.values(RETAIL_PERMISSIONS),
  sustainability_lead: [RETAIL_PERMISSIONS.READ, RETAIL_PERMISSIONS.ANALYTICS],
} as const;

export function hasRetailPermission(
  permission: string,
  userPermissions: string[]
): boolean {
  return userPermissions.includes(permission);
}

export function getRetailPermissionsForRole(role: string): string[] {
  return RETAIL_ROLE_PERMISSIONS[role as keyof typeof RETAIL_ROLE_PERMISSIONS] || [];
}

export function createRetailContext(
  user: any,
  organization: any,
  userRoles: string[] = []
): ModuleContext {
  // Combine permissions from all user roles
  const permissions = userRoles.flatMap(role => 
    getRetailPermissionsForRole(role)
  );

  return {
    user,
    organization,
    permissions: [...new Set(permissions)], // Remove duplicates
    features: [
      'real-time-traffic',
      'sales-analytics',
      'conversion-tracking',
      'ai-insights',
      'store-management'
    ],
  };
}

// Middleware function for checking retail access
export function checkRetailAccess(
  requiredPermission: string,
  context: ModuleContext
): boolean {
  return hasRetailPermission(requiredPermission, context.permissions);
}

// Helper for API route protection
export function requireRetailPermission(permission: string) {
  return (context: ModuleContext) => {
    if (!checkRetailAccess(permission, context)) {
      throw new Error(`Insufficient permissions. Required: ${permission}`);
    }
    return true;
  };
}