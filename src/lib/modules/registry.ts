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

    // Check if already registered
    const alreadyRegistered = this.modules.has(module.id);
    
    if (alreadyRegistered) {
      if (process.env.NODE_ENV === 'development') {
        // Silent skip - this is expected in React StrictMode
        return;
      }
      console.warn(`Module ${module.id} is already registered. Updating.`);
    }

    // Store registration
    this.modules.set(module.id, registration);
    
    // Mark as active if status is active
    if (module.status === 'active') {
      this.activeModules.add(module.id);
    }

    // Initialize services if provided (only for new registrations)
    if (registration.initializeServices && !alreadyRegistered) {
      registration.initializeServices().catch(error => {
        console.error(`Failed to initialize services for module ${module.id}:`, error);
      });
    }

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
    const moduleItem = this.getModule(moduleId);
    if (!moduleItem) return false;

    // Check if user has all required permissions
    return moduleItem.requiredPermissions.every(permission => 
      context.permissions.includes(permission)
    );
  }

  isModuleAvailable(moduleId: string, context: ModuleContext): boolean {
    const moduleItem = this.getModule(moduleId);
    if (!moduleItem) return false;

    // Check status
    if (moduleItem.status !== 'active') return false;

    // Check permissions
    if (!this.hasPermission(moduleId, context)) return false;

    // Check dependencies
    if (moduleItem.dependencies) {
      return moduleItem.dependencies.every(depId => {
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

  }

  deactivateModule(moduleId: string): void {
    const registration = this.modules.get(moduleId);
    if (!registration) {
      throw new Error(`Module ${moduleId} is not registered`);
    }

    registration.module.status = 'inactive';
    this.activeModules.delete(moduleId);

  }

  getAllModules(): Module[] {
    return Array.from(this.modules.values())
      .map(reg => reg.module)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getModuleHealth(): Record<string, { status: string; errors?: string[] }> {
    const health: Record<string, { status: string; errors?: string[] }> = {};

    for (const [id, registration] of this.modules) {
      const moduleItem = registration.module;
      const errors: string[] = [];

      // Check dependencies
      if (moduleItem.dependencies) {
        for (const depId of moduleItem.dependencies) {
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