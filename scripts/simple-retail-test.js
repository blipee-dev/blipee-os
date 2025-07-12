#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Running Retail Module Structure Tests...\n');

// Define test cases for file existence
const filesToCheck = {
  'API Routes': [
    'src/app/api/retail/v1/health/route.ts',
    'src/app/api/retail/v1/stores/route.ts',
    'src/app/api/retail/v1/analytics/route.ts',
    'src/app/api/retail/v1/traffic/realtime/route.ts',
    'src/app/api/retail/v1/telegram/auth/route.ts',
    'src/app/api/retail/v1/telegram/state/route.ts',
  ],
  'UI Components': [
    'src/components/retail/dashboard/RetailDashboard.tsx',
    'src/components/retail/ui/StoreSelector.tsx',
    'src/components/retail/ui/ConversationalInterface.tsx',
    'src/components/retail/analytics/RealTimeTraffic.tsx',
    'src/components/retail/analytics/QuickInsights.tsx',
    'src/components/retail/analytics/AnalyticsOverview.tsx',
  ],
  'Module System': [
    'src/lib/modules/registry.ts',
    'src/lib/modules/retail-module.ts',
    'src/lib/modules/types.ts',
  ],
  'Authentication': [
    'src/lib/auth/retail-permissions.ts',
    'src/lib/auth/retail-middleware.ts',
    'src/lib/hooks/useRetailAuth.ts',
  ],
  'Test Files': [
    'src/app/api/retail/v1/health/__tests__/route.test.ts',
    'src/app/api/retail/v1/stores/__tests__/route.test.ts',
    'src/app/api/retail/v1/analytics/__tests__/route.test.ts',
    'src/app/api/retail/v1/traffic/realtime/__tests__/route.test.ts',
    'src/components/retail/dashboard/__tests__/RetailDashboard.test.tsx',
    'src/lib/modules/__tests__/registry.test.ts',
    'src/lib/auth/__tests__/retail-permissions.test.ts',
  ],
};

let totalFiles = 0;
let passedTests = 0;
let failedTests = 0;

// Function to check if file exists
function checkFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  return fs.existsSync(fullPath);
}

// Run tests
console.log('📋 Testing File Structure:\n');

Object.entries(filesToCheck).forEach(([category, files]) => {
  console.log(`\n${category}:`);
  
  files.forEach(file => {
    totalFiles++;
    const exists = checkFile(file);
    
    if (exists) {
      passedTests++;
      console.log(`  ✅ ${path.basename(file)}`);
    } else {
      failedTests++;
      console.log(`  ❌ ${path.basename(file)} - NOT FOUND`);
    }
  });
});

// Test specific file contents
console.log('\n\n📄 Testing File Contents:');

// Test 1: Check if retail module exports correct structure
try {
  const modulePath = path.join(process.cwd(), 'src/lib/modules/retail-module.ts');
  const moduleContent = fs.readFileSync(modulePath, 'utf8');
  
  if (moduleContent.includes('retailModule') && moduleContent.includes('retail-intelligence')) {
    console.log('  ✅ Retail module has correct exports');
    passedTests++;
  } else {
    console.log('  ❌ Retail module missing exports');
    failedTests++;
  }
} catch (error) {
  console.log('  ❌ Could not read retail module');
  failedTests++;
}

// Test 2: Check if API routes export GET/POST functions
try {
  const healthPath = path.join(process.cwd(), 'src/app/api/retail/v1/health/route.ts');
  const healthContent = fs.readFileSync(healthPath, 'utf8');
  
  if (healthContent.includes('export async function GET')) {
    console.log('  ✅ Health API has GET handler');
    passedTests++;
  } else {
    console.log('  ❌ Health API missing GET handler');
    failedTests++;
  }
} catch (error) {
  console.log('  ❌ Could not read health API');
  failedTests++;
}

// Test 3: Check permissions structure
try {
  const permPath = path.join(process.cwd(), 'src/lib/auth/retail-permissions.ts');
  const permContent = fs.readFileSync(permPath, 'utf8');
  
  if (permContent.includes('RETAIL_PERMISSIONS') && permContent.includes('retail:read')) {
    console.log('  ✅ Permissions correctly defined');
    passedTests++;
  } else {
    console.log('  ❌ Permissions not properly defined');
    failedTests++;
  }
} catch (error) {
  console.log('  ❌ Could not read permissions file');
  failedTests++;
}

// Summary
console.log('\n\n📊 Test Summary:');
console.log(`Total Tests: ${totalFiles + 3}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / (totalFiles + 3)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! The retail module structure is complete.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please check the missing files above.');
  process.exit(1);
}