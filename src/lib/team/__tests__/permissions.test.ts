import { 
  hasPermission, 
  getRolePermissions, 
  canAccessBuilding,
  PERMISSIONS,
  ROLE_HIERARCHY 
} from '../permissions';

describe('permissions', () => {
  describe('hasPermission', () => {
    it('should return true for account_owner for any permission', () => {
      expect(hasPermission('account_owner', 'buildings.create')).toBe(true);
      expect(hasPermission('account_owner', 'analytics.view')).toBe(true);
    });

    it('should check specific permissions for other roles', () => {
      expect(hasPermission('facility_manager', 'buildings.update')).toBe(true);
      expect(hasPermission('viewer', 'buildings.create')).toBe(false);
    });

    it('should handle invalid roles', () => {
      expect(hasPermission('invalid_role', 'buildings.view')).toBe(false);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for account_owner', () => {
      const permissions = getRolePermissions('account_owner');
      expect(permissions).toContain('buildings.create');
      expect(permissions).toContain('team.manage');
      expect(permissions).toContain('settings.manage');
    });

    it('should return subset of permissions for viewer', () => {
      const permissions = getRolePermissions('viewer');
      expect(permissions).toContain('buildings.view');
      expect(permissions).not.toContain('buildings.create');
    });

    it('should return empty array for invalid role', () => {
      const permissions = getRolePermissions('invalid_role');
      expect(permissions).toEqual([]);
    });
  });

  describe('canAccessBuilding', () => {
    const user = {
      id: 'user-1',
      role: 'facility_manager',
      organization_id: 'org-1'
    };

    it('should allow access to buildings in same organization', () => {
      const building = {
        id: 'building-1',
        organization_id: 'org-1'
      };
      expect(canAccessBuilding(user, building)).toBe(true);
    });

    it('should deny access to buildings in different organization', () => {
      const building = {
        id: 'building-2',
        organization_id: 'org-2'
      };
      expect(canAccessBuilding(user, building)).toBe(false);
    });
  });

  describe('constants', () => {
    it('should export PERMISSIONS constant', () => {
      expect(PERMISSIONS).toBeDefined();
      expect(PERMISSIONS.BUILDINGS_VIEW).toBe('buildings.view');
      expect(PERMISSIONS.TEAM_MANAGE).toBe('team.manage');
    });

    it('should export ROLE_HIERARCHY', () => {
      expect(ROLE_HIERARCHY).toBeDefined();
      expect(ROLE_HIERARCHY.account_owner).toBe(5);
      expect(ROLE_HIERARCHY.viewer).toBe(1);
    });
  });
});