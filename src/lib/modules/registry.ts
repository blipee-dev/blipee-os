import { Module, ModuleRegistration, ModuleContext, ModuleAPI } from './types';

class ModuleRegistry implements ModuleAPI {
  private modules = new Map<string, ModuleRegistration>();
  private activeModules = new Set<string>();

  register(registration: ModuleRegistration): void {
    const { module } = registration;
    
    // Validate module
    if (!module.id || !module.name || !module.path) {
      throw new Error(`Invalid module registration: ${module.id}`);
    }

    // Check for conflicts
    if (this.modules.has(module.id)) {
      console.warn(`Module ${module.id} is already registered. Updating.`);
    }

    // Store registration
    this.modules.set(module.id, registration);
    
    // Mark as active if status is active
    if (module.status === 'active') {
      this.activeModules.add(module.id);
    }

    // Initialize services if provided
    if (registration.initializeServices) {
      registration.initializeServices().catch(error => {
        console.error(`Failed to initialize services for module ${module.id}:`, error);
      });
    }

    console.log(`✅ Module registered: ${module.name} (${module.id})`);
  }

  unregister(moduleId: string): void {
    const registration = this.modules.get(moduleId);
    if (!registration) {
      throw new Error(`Module ${moduleId} is not registered`);
    }

    // Cleanup if provided
    if (registration.cleanup) {
      registration.cleanup().catch(error => {
        console.error(`Failed to cleanup module ${moduleId}:`, error);
      });
    }

    // Remove from active modules
    this.activeModules.delete(moduleId);
    
    // Remove from registry
    this.modules.delete(moduleId);

    console.log(`❌ Module unregistered: ${moduleId}`);
  }

  getModule(moduleId: string): Module | undefined {
    const registration = this.modules.get(moduleId);
    return registration?.module;
  }

  getActiveModules(): Module[] {
    return Array.from(this.activeModules)
      .map(id => this.getModule(id))
      .filter((module): module is Module => module !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getModulesByCategory(category: string): Module[] {
    return Array.from(this.modules.values())
      .map(reg => reg.module)
      .filter(module => module.category === category && module.status === 'active')
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  hasPermission(moduleId: string, context: ModuleContext): boolean {
    const module = this.getModule(moduleId);
    if (!module) return false;

    // Check if user has all required permissions
    return module.requiredPermissions.every(permission => 
      context.permissions.includes(permission)
    );
  }

  isModuleAvailable(moduleId: string, context: ModuleContext): boolean {
    const module = this.getModule(moduleId);
    if (!module) return false;

    // Check status
    if (module.status !== 'active') return false;

    // Check permissions
    if (!this.hasPermission(moduleId, context)) return false;

    // Check dependencies
    if (module.dependencies) {
      return module.dependencies.every(depId => {
        const dep = this.getModule(depId);
        return dep && dep.status === 'active';
      });
    }

    return true;
  }

  // Admin functions
  activateModule(moduleId: string): void {
    const registration = this.modules.get(moduleId);
    if (!registration) {
      throw new Error(`Module ${moduleId} is not registered`);
    }

    registration.module.status = 'active';
    this.activeModules.add(moduleId);

    console.log(`✅ Module activated: ${moduleId}`);
  }

  deactivateModule(moduleId: string): void {
    const registration = this.modules.get(moduleId);
    if (!registration) {
      throw new Error(`Module ${moduleId} is not registered`);
    }

    registration.module.status = 'inactive';
    this.activeModules.delete(moduleId);

    console.log(`⏸️ Module deactivated: ${moduleId}`);
  }

  getAllModules(): Module[] {
    return Array.from(this.modules.values())
      .map(reg => reg.module)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getModuleHealth(): Record<string, { status: string; errors?: string[] }> {
    const health: Record<string, { status: string; errors?: string[] }> = {};

    for (const [id, registration] of this.modules) {
      const module = registration.module;
      const errors: string[] = [];

      // Check dependencies
      if (module.dependencies) {
        for (const depId of module.dependencies) {
          const dep = this.getModule(depId);
          if (!dep) {
            errors.push(`Missing dependency: ${depId}`);
          } else if (dep.status !== 'active') {
            errors.push(`Inactive dependency: ${depId}`);
          }
        }
      }

      health[id] = {
        status: errors.length === 0 ? 'healthy' : 'warning',
        errors: errors.length > 0 ? errors : undefined,
      };
    }

    return health;
  }
}

// Global registry instance
export const moduleRegistry = new ModuleRegistry();

// Export registry as default export and named export
export default moduleRegistry;