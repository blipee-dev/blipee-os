/**
 * Server initialization
 * This file is imported by Next.js API routes to ensure services are initialized
 */

import { initializeMonitoring } from './monitoring';

let initialized = false;

export async function initializeServer() {
  if (initialized) return;
  
  try {
    console.log('🚀 Initializing server services...');
    
    // Initialize monitoring
    await initializeMonitoring();
    
    // Add other service initializations here as needed
    
    initialized = true;
    console.log('✅ Server services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize server services:', error);
    // Don't throw - allow the server to start even if some services fail
  }
}

// Auto-initialize on module load
if (typeof window === 'undefined') {
  initializeServer().catch(console.error);
}