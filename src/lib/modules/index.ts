// Module system exports
export * from './types';
export * from './registry';
export * from './retail-module';

// Core sustainability module (built-in)
export const sustainabilityModule = {
  id: 'sustainability-core',
  name: 'Sustainability Intelligence',
  description: 'Core sustainability management and AI capabilities',
  icon: 'TreePine',
  version: '1.0.0',
  status: 'active' as const,
  path: '/',
  requiredPermissions: ['sustainability:read'],
  category: 'sustainability' as const,
  lastUpdated: new Date(),
  dependencies: [],
  config: {
    features: [
      'emissions-tracking',
      'conversational-ai',
      'document-parsing',
      'building-management',
      'compliance-monitoring'
    ]
  }
};

// Register core modules
import { moduleRegistry } from './registry';
import { retailModuleRegistration } from './retail-module';

// Track initialization state
let isInitialized = false;

// Initialize module system
export function initializeModuleSystem() {
  // Prevent double initialization in React StrictMode
  if (isInitialized) {
    return;
  }
  
  
  // Register core sustainability module
  moduleRegistry.register({
    module: sustainabilityModule,
    initializeServices: async () => {
    }
  });

  // Register retail module
  moduleRegistry.register(retailModuleRegistration);

  isInitialized = true;
}