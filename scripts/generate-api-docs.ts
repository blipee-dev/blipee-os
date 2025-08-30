#!/usr/bin/env node

import { generateSimpleAPIDocs } from '../src/lib/docs/simple-api-docs';

/**
 * Generate API documentation script
 */
async function main() {
  try {
    console.log('🚀 Starting API documentation generation...');
    
    await generateSimpleAPIDocs();
    
    console.log('✅ API documentation generated successfully!');
    console.log('📖 View documentation at: docs/api/index.html');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Failed to generate API documentation:', error);
    process.exit(1);
  }
}

// Only run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}