#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const isSecure = BASE_URL.startsWith('https');
const httpModule = isSecure ? https : http;

class RetailAPITester {
  constructor() {
    this.results = [];
    this.summary = { passed: 0, failed: 0, total: 0 };
  }

  async makeRequest(path, options = {}) {
    const url = new URL(path, BASE_URL);
    
    return new Promise((resolve, reject) => {
      const req = httpModule.request(url, {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : null;
            resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
          } catch (error) {
            resolve({ status: res.statusCode, data: data, headers: res.headers });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ status: 'ERROR', error: error.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'TIMEOUT', error: 'Request timed out' });
      });

      if (options.body) {
        req.write(JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async testEndpoint(name, path, options = {}) {
    console.log(`Testing ${name}...`);
    
    try {
      const response = await this.makeRequest(path, options);
      const success = response.status === 200 || response.status === 201 || 
                     (response.status === 401 && options.expectAuth);
      
      const result = {
        name,
        path,
        method: options.method || 'GET',
        status: response.status,
        success,
        data: response.data,
        error: response.error
      };

      this.results.push(result);
      this.summary.total++;
      
      if (success) {
        this.summary.passed++;
        console.log(`  ✓ ${name} - Status: ${response.status}`);
      } else {
        this.summary.failed++;
        console.log(`  ✗ ${name} - Status: ${response.status}`);
        if (response.error) {
          console.log(`    Error: ${response.error}`);
        }
      }

      return result;
    } catch (error) {
      const result = {
        name,
        path,
        method: options.method || 'GET',
        status: 'ERROR',
        success: false,
        error: error.message
      };

      this.results.push(result);
      this.summary.total++;
      this.summary.failed++;
      
      console.log(`  ✗ ${name} - ERROR`);
      console.log(`    Error: ${error.message}`);
      
      return result;
    }
  }

  async runTests() {
    console.log('\n🛍️  Retail Intelligence API Test Suite\n');
    console.log(`Testing against: ${BASE_URL}\n`);

    // Test health endpoint
    await this.testEndpoint(
      'Health Check',
      '/api/retail/v1/health'
    );

    // Test stores endpoint
    await this.testEndpoint(
      'Get Stores',
      '/api/retail/v1/stores',
      { expectAuth: true }
    );

    // Test real-time traffic
    await this.testEndpoint(
      'Real-time Traffic',
      '/api/retail/v1/traffic/realtime',
      { expectAuth: true }
    );

    // Test analytics
    await this.testEndpoint(
      'Analytics Data',
      '/api/retail/v1/analytics',
      { expectAuth: true }
    );

    // Test Telegram auth
    await this.testEndpoint(
      'Telegram Auth',
      '/api/retail/v1/auth/telegram',
      { 
        method: 'POST',
        body: { userId: 'test123' },
        expectAuth: true
      }
    );

    // Test Telegram state
    await this.testEndpoint(
      'Telegram State - GET',
      '/api/retail/v1/telegram/state',
      { expectAuth: true }
    );

    await this.testEndpoint(
      'Telegram State - POST',
      '/api/retail/v1/telegram/state',
      { 
        method: 'POST',
        body: { chatId: 'test123', state: 'active' },
        expectAuth: true
      }
    );

    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 Test Results Summary\n');

    // Detailed results
    console.log('Endpoint Results:');
    this.results.forEach(result => {
      const icon = result.success ? '✓' : '✗';
      const status = result.status === 'ERROR' ? 'ERROR' : `HTTP ${result.status}`;
      console.log(`  ${icon} ${result.method} ${result.path}`);
      console.log(`     Status: ${status}`);
      
      if (result.data && result.success) {
        console.log(`     Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
      }
      
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    // Summary
    const passRate = ((this.summary.passed / this.summary.total) * 100).toFixed(1);
    console.log('\n📈 Overall Summary:');
    console.log(`  Total endpoints tested: ${this.summary.total}`);
    console.log(`  Passed: ${this.summary.passed}`);
    console.log(`  Failed: ${this.summary.failed}`);
    console.log(`  Pass rate: ${passRate}%`);

    // Analysis
    console.log('\n🔍 Analysis:');
    
    const errors = this.results.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT');
    const auth401s = this.results.filter(r => r.status === 401);
    const server500s = this.results.filter(r => r.status >= 500);
    
    if (errors.length > 0) {
      console.log(`  ⚠️  ${errors.length} endpoints had connection errors`);
      console.log('     → Check if the development server is running');
    }
    
    if (auth401s.length > 0) {
      console.log(`  🔒 ${auth401s.length} endpoints require authentication`);
      console.log('     → This is expected behavior for protected endpoints');
    }
    
    if (server500s.length > 0) {
      console.log(`  ❌ ${server500s.length} endpoints returned server errors`);
      console.log('     → Check server logs for details');
    }

    // Recommendations
    if (this.summary.failed > 0) {
      console.log('\n⚠️  Recommendations:');
      
      if (errors.length > 0) {
        console.log('  1. Ensure the development server is running:');
        console.log('     npm run dev');
      }
      
      if (auth401s.length > 0) {
        console.log('  2. For authenticated endpoints, provide valid auth tokens');
      }
      
      console.log('  3. Check server logs for any error details');
      console.log('  4. Verify environment variables are set correctly');
    } else {
      console.log('\n✅ All API endpoints are responding correctly!');
    }

    // Save report
    const timestamp = new Date().toISOString();
    const reportPath = `/workspaces/blipee-os/retail-api-test-report-${timestamp.split('T')[0]}.json`;
    
    require('fs').writeFileSync(reportPath, JSON.stringify({
      timestamp,
      baseUrl: BASE_URL,
      results: this.results,
      summary: this.summary,
      analysis: {
        connectionErrors: errors.length,
        authRequired: auth401s.length,
        serverErrors: server500s.length
      }
    }, null, 2));
    
    console.log(`\nDetailed report saved to: ${reportPath}`);
  }
}

// Check if server is likely running
const checkServerRunning = async () => {
  try {
    const response = await new RetailAPITester().makeRequest('/');
    return response.status !== 'ERROR' && response.status !== 'TIMEOUT';
  } catch {
    return false;
  }
};

// Run tests
(async () => {
  const serverRunning = await checkServerRunning();
  
  if (!serverRunning) {
    console.log('⚠️  Warning: Server appears to be offline');
    console.log('   The tests will run but may show connection errors');
    console.log('   Start the server with: npm run dev\n');
  }

  const tester = new RetailAPITester();
  await tester.runTests();
})();