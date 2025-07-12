export interface Module {
  id: string;
  name: string;
  description: string;
  icon: string;
  version: string;
  status: 'active' | 'inactive' | 'maintenance';
  path: string;
  requiredPermissions: string[];
  category: 'sustainability' | 'retail' | 'ai' | 'compliance' | 'analytics';
  lastUpdated: Date;
  dependencies?: string[];
  config?: Record<string, any>;
}

export interface ModuleRegistration {
  module: Module;
  registerRoutes?: () => void;
  initializeServices?: () => Promise<void>;
  cleanup?: () => Promise<void>;
}

export interface ModuleContext {
  user: any;
  organization: any;
  permissions: string[];
  features: string[];
}

export interface ModuleAPI {
  register(registration: ModuleRegistration): void;
  unregister(moduleId: string): void;
  getModule(moduleId: string): Module | undefined;
  getActiveModules(): Module[];
  getModulesByCategory(category: string): Module[];
  hasPermission(moduleId: string, context: ModuleContext): boolean;
  isModuleAvailable(moduleId: string, context: ModuleContext): boolean;
}