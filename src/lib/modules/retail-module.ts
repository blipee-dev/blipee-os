import { Module, ModuleRegistration } from './types';
import { moduleRegistry } from './registry';

// Retail Intelligence Module Definition
export const retailModule: Module = {
  id: 'retail-intelligence',
  name: 'Retail Intelligence',
  description: 'AI-powered retail analytics, traffic monitoring, and sales optimization',
  icon: 'ShoppingBag',
  version: '1.0.0',
  status: 'active',
  path: '/retail',
  requiredPermissions: ['retail:read', 'retail:analytics'],
  category: 'retail',
  lastUpdated: new Date(),
  dependencies: [],
  config: {
    features: [
      'real-time-traffic',
      'sales-analytics',
      'conversion-tracking',
      'ai-insights',
      'store-management'
    ],
    apiEndpoints: [
      '/api/retail/v1/health',
      '/api/retail/v1/stores',
      '/api/retail/v1/analytics',
      '/api/retail/v1/traffic/realtime'
    ],
    integrations: [
      'viewsonic-sensors',
      'sales-api',
      'telegram-bot'
    ]
  }
};

// Initialize retail services
async function initializeRetailServices(): Promise<void> {
  console.log('🛍️ Initializing Retail Intelligence services...');
  
  try {
    // Test API health
    const response = await fetch('/api/retail/v1/health');
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    console.log('✅ Retail Intelligence API is healthy');
    
    // Initialize any background services here
    // Example: WebSocket connections, data sync, etc.
    
    console.log('✅ Retail Intelligence services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Retail Intelligence services:', error);
    throw error;
  }
}

// Cleanup retail services
async function cleanupRetailServices(): Promise<void> {
  console.log('🧹 Cleaning up Retail Intelligence services...');
  
  // Cleanup any background services, connections, etc.
  
  console.log('✅ Retail Intelligence services cleaned up');
}

// Module registration
export const retailModuleRegistration: ModuleRegistration = {
  module: retailModule,
  initializeServices: initializeRetailServices,
  cleanup: cleanupRetailServices,
};

// Auto-register the module
if (typeof window === 'undefined') {
  // Only register on server-side to avoid issues with SSR
  setTimeout(() => {
    moduleRegistry.register(retailModuleRegistration);
  }, 0);
}