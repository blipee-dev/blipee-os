#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing Retail APIs...\n');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const apiTests = [
  {
    name: 'Health Check',
    path: '/api/retail/v1/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['status', 'timestamp', 'module'],
  },
  {
    name: 'List Stores',
    path: '/api/retail/v1/stores',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'stores', 'total'],
  },
  {
    name: 'Analytics (with params)',
    path: '/api/retail/v1/analytics?loja=OML01&start_date=2025-07-12&end_date=2025-07-12',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data', 'permissions', 'user'],
  },
  {
    name: 'Real-time Traffic',
    path: '/api/retail/v1/traffic/realtime?loja=OML01',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data'],
  },
];

let passedTests = 0;
let failedTests = 0;

// Function to make HTTP request
function testAPI(test) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${test.path}`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          
          // Check status code
          if (res.statusCode === test.expectedStatus) {
            console.log(`✅ ${test.name} - Status ${res.statusCode}`);
            
            // Check expected fields
            const missingFields = test.expectedFields.filter(field => !(field in json));
            if (missingFields.length === 0) {
              console.log(`   ✓ All expected fields present`);
              passedTests++;
            } else {
              console.log(`   ✗ Missing fields: ${missingFields.join(', ')}`);
              failedTests++;
            }
          } else {
            console.log(`❌ ${test.name} - Expected ${test.expectedStatus}, got ${res.statusCode}`);
            failedTests++;
          }
          
          resolve();
        } catch (error) {
          console.log(`❌ ${test.name} - Failed to parse response`);
          failedTests++;
          resolve();
        }
      });
    }).on('error', (err) => {
      console.log(`❌ ${test.name} - Connection error: ${err.message}`);
      failedTests++;
      resolve();
    });
  });
}

// Check if server is running
console.log(`Checking if server is running on port ${PORT}...\n`);

http.get(`${BASE_URL}/api/retail/v1/health`, (res) => {
  console.log('✅ Server is running!\n');
  console.log('Running API tests...\n');
  
  // Run all tests sequentially
  (async () => {
    for (const test of apiTests) {
      await testAPI(test);
      console.log(''); // Empty line between tests
    }
    
    // Summary
    console.log('📊 Test Summary:');
    console.log(`Total Tests: ${apiTests.length}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / apiTests.length) * 100).toFixed(1)}%`);
    
    if (failedTests === 0) {
      console.log('\n🎉 All API tests passed!');
    } else {
      console.log('\n⚠️  Some API tests failed.');
    }
  })();
}).on('error', () => {
  console.log('❌ Server is not running!');
  console.log(`Please start the server with: npm run dev`);
  console.log(`Then run this test again.`);
});