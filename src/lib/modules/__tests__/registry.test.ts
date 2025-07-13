import { moduleRegistry } from '../registry';
import { Module, ModuleRegistration } from '../types';

describe('Module Registry', () => {
  beforeEach(() => {
    // Clear registry before each test
    moduleRegistry['modules'].clear();
    moduleRegistry['activeModules'].clear();
  });

  describe('register', () => {
    it('should register a valid module', () => {
      const testModule: Module = {
        id: 'test-module',
        name: 'Test Module',
        description: 'A test module',
        icon: 'Test',
        version: '1.0.0',
        status: 'active',
        path: '/test',
        requiredPermissions: ['test:read'],
        category: 'analytics',
        lastUpdated: new Date(),
      };

      const registration: ModuleRegistration = {
        module: testModule,
      };

      moduleRegistry.register(registration);
      
      const retrieved = moduleRegistry.getModule('test-module');
      expect(retrieved).toEqual(testModule);
    });

    it('should throw error for invalid module', () => {
      const invalidModule = {
        id: '',
        name: 'Invalid',
        path: '',
      } as any;

      expect(() => {
        moduleRegistry.register({ module: invalidModule });
      }).toThrow('Invalid module registration');
    });

    it('should mark active modules', () => {
      const activeModule: Module = {
        id: 'active-module',
        name: 'Active Module',
        description: 'An active module',
        icon: 'Active',
        version: '1.0.0',
        status: 'active',
        path: '/active',
        requiredPermissions: [],
        category: 'analytics',
        lastUpdated: new Date(),
      };

      moduleRegistry.register({ module: activeModule });
      
      const activeModules = moduleRegistry.getActiveModules();
      expect(activeModules).toHaveLength(1);
      expect(activeModules[0].id).toBe('active-module');
    });
  });

  describe('unregister', () => {
    it('should remove a registered module', () => {
      const testModule: Module = {
        id: 'remove-me',
        name: 'Remove Me',
        description: 'Module to remove',
        icon: 'Remove',
        version: '1.0.0',
        status: 'active',
        path: '/remove',
        requiredPermissions: [],
        category: 'analytics',
        lastUpdated: new Date(),
      };

      moduleRegistry.register({ module: testModule });
      expect(moduleRegistry.getModule('remove-me')).toBeDefined();

      moduleRegistry.unregister('remove-me');
      expect(moduleRegistry.getModule('remove-me')).toBeUndefined();
    });

    it('should throw error for non-existent module', () => {
      expect(() => {
        moduleRegistry.unregister('non-existent');
      }).toThrow('Module non-existent is not registered');
    });
  });

  describe('permissions', () => {
    it('should check user permissions correctly', () => {
      const testModule: Module = {
        id: 'secure-module',
        name: 'Secure Module',
        description: 'Requires permissions',
        icon: 'Secure',
        version: '1.0.0',
        status: 'active',
        path: '/secure',
        requiredPermissions: ['secure:read', 'secure:write'],
        category: 'analytics',
        lastUpdated: new Date(),
      };

      moduleRegistry.register({ module: testModule });

      const contextWithPermissions = {
        user: {},
        organization: {},
        permissions: ['secure:read', 'secure:write'],
        features: [],
      };

      const contextWithoutPermissions = {
        user: {},
        organization: {},
        permissions: ['secure:read'],
        features: [],
      };

      expect(moduleRegistry.hasPermission('secure-module', contextWithPermissions)).toBe(true);
      expect(moduleRegistry.hasPermission('secure-module', contextWithoutPermissions)).toBe(false);
    });
  });

  describe('module availability', () => {
    it('should check module dependencies', () => {
      const baseModule: Module = {
        id: 'base-module',
        name: 'Base Module',
        description: 'Base module',
        icon: 'Base',
        version: '1.0.0',
        status: 'active',
        path: '/base',
        requiredPermissions: [],
        category: 'analytics',
        lastUpdated: new Date(),
      };

      const dependentModule: Module = {
        id: 'dependent-module',
        name: 'Dependent Module',
        description: 'Depends on base',
        icon: 'Dependent',
        version: '1.0.0',
        status: 'active',
        path: '/dependent',
        requiredPermissions: [],
        category: 'analytics',
        lastUpdated: new Date(),
        dependencies: ['base-module'],
      };

      moduleRegistry.register({ module: baseModule });
      moduleRegistry.register({ module: dependentModule });

      const context = {
        user: {},
        organization: {},
        permissions: [],
        features: [],
      };

      expect(moduleRegistry.isModuleAvailable('dependent-module', context)).toBe(true);

      // Deactivate base module
      moduleRegistry.deactivateModule('base-module');
      expect(moduleRegistry.isModuleAvailable('dependent-module', context)).toBe(false);
    });
  });

  describe('module health', () => {
    it('should report module health status', () => {
      const healthyModule: Module = {
        id: 'healthy-module',
        name: 'Healthy Module',
        description: 'A healthy module',
        icon: 'Healthy',
        version: '1.0.0',
        status: 'active',
        path: '/healthy',
        requiredPermissions: [],
        category: 'analytics',
        lastUpdated: new Date(),
      };

      moduleRegistry.register({ module: healthyModule });

      const health = moduleRegistry.getModuleHealth();
      expect(health['healthy-module']).toEqual({
        status: 'healthy',
        errors: undefined,
      });
    });

    it('should report missing dependencies', () => {
      const dependentModule: Module = {
        id: 'broken-module',
        name: 'Broken Module',
        description: 'Has missing dependencies',
        icon: 'Broken',
        version: '1.0.0',
        status: 'active',
        path: '/broken',
        requiredPermissions: [],
        category: 'analytics',
        lastUpdated: new Date(),
        dependencies: ['missing-dependency'],
      };

      moduleRegistry.register({ module: dependentModule });

      const health = moduleRegistry.getModuleHealth();
      expect(health['broken-module'].status).toBe('warning');
      expect(health['broken-module'].errors).toContain('Missing dependency: missing-dependency');
    });
  });
});