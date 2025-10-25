#!/usr/bin/env tsx

/**
 * Test Security Headers Implementation
 */

import https from 'https';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Expected security headers
const EXPECTED_HEADERS = {
  'x-frame-options': 'DENY',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
  'x-xss-protection': '1; mode=block',
  'x-dns-prefetch-control': 'on',
  'content-security-policy': true, // Just check it exists
};

const PRODUCTION_ONLY_HEADERS = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};

interface TestResult {
  path: string;
  method: string;
  success: boolean;
  missingHeaders: string[];
  errors: string[];
}

async function testEndpoint(path: string, method = 'GET'): Promise<TestResult> {
  const result: TestResult = {
    path,
    method,
    success: true,
    missingHeaders: [],
    errors: [],
  };

  return new Promise((resolve) => {
    const url = new URL(path, BASE_URL);
    
    const options = {
      method,
      headers: {
        'Accept': 'application/json',
      },
    };

    const request = (url.protocol === 'https:' ? https : require('http')).request(
      url,
      options,
      (response) => {
        // Check expected headers
        for (const [header, value] of Object.entries(EXPECTED_HEADERS)) {
          const actualValue = response.headers[header];
          
          if (!actualValue) {
            result.success = false;
            result.missingHeaders.push(header);
          } else if (typeof value === 'string' && actualValue !== value) {
            result.success = false;
            result.errors.push(
              `Header ${header} has incorrect value: ${actualValue} (expected: ${value})`
            );
          }
        }

        // Check production headers if in production
        if (process.env.NODE_ENV === 'production') {
          for (const [header, value] of Object.entries(PRODUCTION_ONLY_HEADERS)) {
            const actualValue = response.headers[header];
            
            if (!actualValue) {
              result.success = false;
              result.missingHeaders.push(header);
            } else if (actualValue !== value) {
              result.success = false;
              result.errors.push(
                `Header ${header} has incorrect value: ${actualValue} (expected: ${value})`
              );
            }
          }
        }

        // Check CSP header details
        const csp = response.headers['content-security-policy'];
        if (csp) {
          // Verify key CSP directives
          const requiredDirectives = [
            'default-src',
            'script-src',
            'style-src',
            'img-src',
            'connect-src',
            'frame-ancestors',
          ];

          for (const directive of requiredDirectives) {
            if (!csp.includes(directive)) {
              result.errors.push(`CSP missing directive: ${directive}`);
              result.success = false;
            }
          }
        }

        resolve(result);
      }
    );

    request.on('error', (error) => {
      result.success = false;
      result.errors.push(`Request failed: ${error.message}`);
      resolve(result);
    });

    request.end();
  });
}

async function main() {
  console.log('🔒 Testing Security Headers Implementation\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  // Test various endpoints
  const endpoints = [
    '/',
    '/signin',
    '/api/health',
    '/api/monitoring/health',
    '/_next/static/test.js', // Should be excluded by middleware
  ];

  const results: TestResult[] = [];

  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint}...`);
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${endpoint} - All security headers present`);
    } else {
      console.log(`❌ ${endpoint} - Security headers issues:`);
      if (result.missingHeaders.length > 0) {
        console.log(`   Missing headers: ${result.missingHeaders.join(', ')}`);
      }
      result.errors.forEach(error => console.log(`   ${error}`));
    }
    console.log('');
  }

  // Summary
  console.log('\n📊 Summary:');
  const successCount = results.filter(r => r.success).length;
  console.log(`Total endpoints tested: ${results.length}`);
  console.log(`Passed: ${successCount}`);
  console.log(`Failed: ${results.length - successCount}`);

  if (successCount === results.length) {
    console.log('\n✅ All security headers tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some security headers tests failed');
    process.exit(1);
  }
}

main().catch(console.error);
