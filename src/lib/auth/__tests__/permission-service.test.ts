import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Permission Service', () => {
  class PermissionService {
    roles = {
      account_owner: {
        permissions: ['*'], // All permissions
        inherits: []
      },
      sustainability_lead: {
        permissions: [
          'sustainability.view',
          'sustainability.edit',
          'reports.view',
          'reports.create',
          'reports.edit',
          'analytics.view'
        ],
        inherits: ['analyst']
      },
      facility_manager: {
        permissions: [
          'buildings.view',
          'buildings.edit',
          'equipment.view',
          'equipment.edit',
          'maintenance.manage'
        ],
        inherits: ['analyst']
      },
      analyst: {
        permissions: [
          'data.view',
          'reports.view',
          'analytics.view'
        ],
        inherits: ['viewer']
      },
      viewer: {
        permissions: [
          'dashboard.view',
          'buildings.view',
          'reports.view'
        ],
        inherits: []
      }
    };
    
    userRoles = new Map();
    
    assignRole(userId, role) {
      if (!this.roles[role]) {
        throw new Error(`Unknown role: ${role}`);
      }
      
      const userRoleSet = this.userRoles.get(userId) || new Set();
      userRoleSet.add(role);
      this.userRoles.set(userId, userRoleSet);
      return true;
    }
    
    removeRole(userId, role) {
      const userRoleSet = this.userRoles.get(userId);
      if (!userRoleSet) return false;
      
      return userRoleSet.delete(role);
    }
    
    getUserRoles(userId) {
      const roleSet = this.userRoles.get(userId) || new Set();
      return Array.from(roleSet);
    }
    
    hasPermission(userId, permission) {
      const userRoles = this.getUserRoles(userId);
      
      for (const role of userRoles) {
        if (this.roleHasPermission(role, permission)) {
          return true;
        }
      }
      
      return false;
    }
    
    roleHasPermission(roleName, permission) {
      const role = this.roles[roleName];
      if (!role) return false;
      
      // Check wildcard permission
      if (role.permissions.includes('*')) return true;
      
      // Check specific permission
      if (role.permissions.includes(permission)) return true;
      
      // Check wildcard patterns (e.g., 'reports.*')
      const permissionParts = permission.split('.');
      for (let i = permissionParts.length; i > 0; i--) {
        const wildcardPerm = permissionParts.slice(0, i - 1).join('.') + '.*';
        if (role.permissions.includes(wildcardPerm)) return true;
      }
      
      // Check inherited roles
      for (const inheritedRole of role.inherits) {
        if (this.roleHasPermission(inheritedRole, permission)) {
          return true;
        }
      }
      
      return false;
    }
    
    canAccess(userId, resource, action) {
      const permission = `${resource}.${action}`;
      return this.hasPermission(userId, permission);
    }
    
    getAllPermissions(userId) {
      const permissions = new Set();
      const userRoles = this.getUserRoles(userId);
      
      for (const role of userRoles) {
        this.collectRolePermissions(role, permissions);
      }
      
      return Array.from(permissions);
    }
    
    collectRolePermissions(roleName, permissionSet) {
      const role = this.roles[roleName];
      if (!role) return;
      
      // Add direct permissions
      role.permissions.forEach(p => permissionSet.add(p));
      
      // Add inherited permissions
      role.inherits.forEach(inheritedRole => {
        this.collectRolePermissions(inheritedRole, permissionSet);
      });
    }
  }
  
  let service;
  
  beforeEach(() => {
    service = new PermissionService();
  });
  
  describe('Role assignment', () => {
    it('should assign roles to users', () => {
      service.assignRole('user123', 'analyst');
      expect(service.getUserRoles('user123')).toContain('analyst');
    });
    
    it('should handle multiple roles', () => {
      service.assignRole('user123', 'analyst');
      service.assignRole('user123', 'facility_manager');
      
      const roles = service.getUserRoles('user123');
      expect(roles).toHaveLength(2);
      expect(roles).toContain('analyst');
      expect(roles).toContain('facility_manager');
    });
    
    it('should throw for unknown role', () => {
      expect(() => service.assignRole('user123', 'invalid_role')).toThrow();
    });
  });
  
  describe('Permission checking', () => {
    it('should check direct permissions', () => {
      service.assignRole('user123', 'analyst');
      
      expect(service.hasPermission('user123', 'data.view')).toBe(true);
      expect(service.hasPermission('user123', 'data.edit')).toBe(false);
    });
    
    it('should check inherited permissions', () => {
      service.assignRole('user123', 'sustainability_lead');
      
      // Direct permission
      expect(service.hasPermission('user123', 'sustainability.edit')).toBe(true);
      // Inherited from analyst
      expect(service.hasPermission('user123', 'data.view')).toBe(true);
      // Inherited from viewer via analyst
      expect(service.hasPermission('user123', 'dashboard.view')).toBe(true);
    });
    
    it('should handle wildcard permissions', () => {
      service.assignRole('user123', 'account_owner');
      
      expect(service.hasPermission('user123', 'anything.at.all')).toBe(true);
      expect(service.hasPermission('user123', 'super.secret.admin')).toBe(true);
    });
  });
  
  describe('Resource access', () => {
    it('should check resource access', () => {
      service.assignRole('user123', 'facility_manager');
      
      expect(service.canAccess('user123', 'buildings', 'view')).toBe(true);
      expect(service.canAccess('user123', 'buildings', 'edit')).toBe(true);
      expect(service.canAccess('user123', 'buildings', 'delete')).toBe(false);
    });
  });
  
  describe('Permission collection', () => {
    it('should get all permissions for user', () => {
      service.assignRole('user123', 'sustainability_lead');
      
      const permissions = service.getAllPermissions('user123');
      
      // Should include direct permissions
      expect(permissions).toContain('sustainability.view');
      expect(permissions).toContain('sustainability.edit');
      
      // Should include inherited permissions
      expect(permissions).toContain('data.view');
      expect(permissions).toContain('dashboard.view');
    });
    
    it('should handle account owner wildcard', () => {
      service.assignRole('user123', 'account_owner');
      
      const permissions = service.getAllPermissions('user123');
      expect(permissions).toContain('*');
    });
  });
  
  describe('Role removal', () => {
    it('should remove roles', () => {
      service.assignRole('user123', 'analyst');
      service.assignRole('user123', 'viewer');
      
      service.removeRole('user123', 'analyst');
      
      const roles = service.getUserRoles('user123');
      expect(roles).toHaveLength(1);
      expect(roles).toContain('viewer');
      expect(roles).not.toContain('analyst');
    });
  });
});