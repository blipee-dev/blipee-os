import {
  RETAIL_PERMISSIONS,
  RETAIL_ROLE_PERMISSIONS,
  hasRetailPermission,
  getRetailPermissionsForRole,
  createRetailContext,
  checkRetailAccess,
  requireRetailPermission,
} from '../retail-permissions';

describe('Retail Permissions', () => {
  describe('Permission Constants', () => {
    it('should define all retail permissions', () => {
      expect(RETAIL_PERMISSIONS.READ).toBe('retail:read');
      expect(RETAIL_PERMISSIONS.WRITE).toBe('retail:write');
      expect(RETAIL_PERMISSIONS.ANALYTICS).toBe('retail:analytics');
      expect(RETAIL_PERMISSIONS.ADMIN).toBe('retail:admin');
      expect(RETAIL_PERMISSIONS.STORE_MANAGEMENT).toBe('retail:store_management');
      expect(RETAIL_PERMISSIONS.REPORTS).toBe('retail:reports');
    });
  });

  describe('Role Permissions', () => {
    it('should define permissions for retail_viewer', () => {
      const permissions = RETAIL_ROLE_PERMISSIONS.retail_viewer;
      expect(permissions).toEqual(['retail:read']);
    });

    it('should define permissions for retail_analyst', () => {
      const permissions = RETAIL_ROLE_PERMISSIONS.retail_analyst;
      expect(permissions).toContain('retail:read');
      expect(permissions).toContain('retail:analytics');
    });

    it('should define permissions for retail_manager', () => {
      const permissions = RETAIL_ROLE_PERMISSIONS.retail_manager;
      expect(permissions).toContain('retail:read');
      expect(permissions).toContain('retail:write');
      expect(permissions).toContain('retail:analytics');
      expect(permissions).toContain('retail:store_management');
    });

    it('should define permissions for retail_admin', () => {
      const permissions = RETAIL_ROLE_PERMISSIONS.retail_admin;
      expect(permissions).toHaveLength(6);
      expect(permissions).toContain('retail:admin');
    });

    it('should grant all permissions to account_owner', () => {
      const permissions = RETAIL_ROLE_PERMISSIONS.account_owner;
      expect(permissions).toEqual(Object.values(RETAIL_PERMISSIONS));
    });
  });

  describe('hasRetailPermission', () => {
    it('should return true when permission exists', () => {
      const userPermissions = ['retail:read', 'retail:write'];
      expect(hasRetailPermission('retail:read', userPermissions)).toBe(true);
    });

    it('should return false when permission missing', () => {
      const userPermissions = ['retail:read'];
      expect(hasRetailPermission('retail:write', userPermissions)).toBe(false);
    });
  });

  describe('getRetailPermissionsForRole', () => {
    it('should return permissions for valid role', () => {
      const permissions = getRetailPermissionsForRole('retail_manager');
      expect(permissions).toContain('retail:read');
      expect(permissions).toContain('retail:write');
    });

    it('should return empty array for invalid role', () => {
      const permissions = getRetailPermissionsForRole('invalid_role');
      expect(permissions).toEqual([]);
    });
  });

  describe('createRetailContext', () => {
    it('should create context with combined permissions', () => {
      const user = { id: '123', email: 'test@example.com' };
      const org = { id: '456', name: 'Test Org' };
      const roles = ['retail_viewer', 'retail_analyst'];

      const context = createRetailContext(user, org, roles);

      expect(context.user).toBe(user);
      expect(context.organization).toBe(org);
      expect(context.permissions).toContain('retail:read');
      expect(context.permissions).toContain('retail:analytics');
      expect(context.features).toContain('real-time-traffic');
    });

    it('should remove duplicate permissions', () => {
      const user = { id: '123' };
      const org = { id: '456' };
      const roles = ['retail_viewer', 'retail_analyst', 'retail_manager'];

      const context = createRetailContext(user, org, roles);
      
      // Count occurrences of retail:read
      const readCount = context.permissions.filter(p => p === 'retail:read').length;
      expect(readCount).toBe(1);
    });
  });

  describe('checkRetailAccess', () => {
    it('should return true for granted permission', () => {
      const context = {
        user: {},
        organization: {},
        permissions: ['retail:read', 'retail:analytics'],
        features: [],
      };

      expect(checkRetailAccess('retail:read', context)).toBe(true);
    });

    it('should return false for missing permission', () => {
      const context = {
        user: {},
        organization: {},
        permissions: ['retail:read'],
        features: [],
      };

      expect(checkRetailAccess('retail:admin', context)).toBe(false);
    });
  });

  describe('requireRetailPermission', () => {
    it('should return true when permission granted', () => {
      const context = {
        user: {},
        organization: {},
        permissions: ['retail:analytics'],
        features: [],
      };

      const validator = requireRetailPermission('retail:analytics');
      expect(validator(context)).toBe(true);
    });

    it('should throw error when permission missing', () => {
      const context = {
        user: {},
        organization: {},
        permissions: ['retail:read'],
        features: [],
      };

      const validator = requireRetailPermission('retail:admin');
      expect(() => validator(context)).toThrow('Insufficient permissions. Required: retail:admin');
    });
  });
});