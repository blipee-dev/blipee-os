#!/usr/bin/env node

const http = require('http');
const https = require('https');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const isSecure = BASE_URL.startsWith('https');
const httpModule = isSecure ? https : http;

class RetailModuleFinalTest {
  constructor() {
    this.results = [];
    this.summary = { passed: 0, failed: 0, total: 0 };
  }

  async makeRequest(path, options = {}) {
    const url = new URL(path, BASE_URL);
    
    // Add query parameters if provided
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
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

  async runTests() {
    console.log('\n🛍️  Retail Intelligence Module - Final Test Report');
    console.log('=' + '='.repeat(50));
    console.log(`Testing against: ${BASE_URL}\n`);

    // Define all test scenarios with correct parameters
    const testScenarios = [
      {
        category: '🏥 Health & Basic Endpoints',
        tests: [
          {
            name: 'Health Check',
            path: '/api/retail/v1/health',
            method: 'GET',
            expectedStatus: 200
          },
          {
            name: 'List Stores',
            path: '/api/retail/v1/stores',
            method: 'GET',
            expectedStatus: 200
          }
        ]
      },
      {
        category: '📊 Analytics Endpoints',
        tests: [
          {
            name: 'Real-time Traffic',
            path: '/api/retail/v1/traffic/realtime',
            method: 'GET',
            params: { loja: 'OML01' },
            expectedStatus: 200
          },
          {
            name: 'Analytics with Date Range',
            path: '/api/retail/v1/analytics',
            method: 'GET',
            params: { 
              loja: 'OML01',
              start_date: '2025-01-01',
              end_date: '2025-01-31'
            },
            expectedStatus: [200, 401] // May require auth
          }
        ]
      },
      {
        category: '🔐 Authentication Endpoints',
        tests: [
          {
            name: 'Telegram Authentication',
            path: '/api/retail/v1/auth/telegram',
            method: 'POST',
            body: { 
              telegram_user_id: 'test123',
              telegram_username: 'testuser',
              chat_id: 'chat123'
            },
            expectedStatus: 200
          }
        ]
      },
      {
        category: '💬 Telegram State Management',
        tests: [
          {
            name: 'Get Telegram State',
            path: '/api/retail/v1/telegram/state',
            method: 'GET',
            params: { chat_id: 'chat123' },
            expectedStatus: 200
          },
          {
            name: 'Update Telegram State',
            path: '/api/retail/v1/telegram/state',
            method: 'POST',
            body: { 
              chat_id: 'chat123',
              state: 'store_selection',
              data: { selectedStore: 'OML01' }
            },
            expectedStatus: 200
          }
        ]
      },
      {
        category: '🎨 UI Access',
        tests: [
          {
            name: 'Retail Module Page',
            path: '/retail',
            method: 'GET',
            expectedStatus: [200, 307] // May redirect
          }
        ]
      }
    ];

    // Run all test scenarios
    for (const scenario of testScenarios) {
      console.log(`\n${scenario.category}`);
      console.log('-'.repeat(50));

      for (const test of scenario.tests) {
        const response = await this.makeRequest(test.path, {
          method: test.method,
          params: test.params,
          body: test.body
        });

        const expectedStatuses = Array.isArray(test.expectedStatus) ? test.expectedStatus : [test.expectedStatus];
        const success = response.status !== 'ERROR' && 
                       response.status !== 'TIMEOUT' && 
                       expectedStatuses.includes(response.status);

        this.results.push({
          category: scenario.category,
          name: test.name,
          path: test.path,
          method: test.method,
          status: response.status,
          success,
          response: response.data,
          error: response.error
        });

        this.summary.total++;
        if (success) {
          this.summary.passed++;
          console.log(`✅ ${test.name}`);
          console.log(`   ${test.method} ${test.path} → ${response.status}`);
          if (response.data && response.data.success) {
            const preview = JSON.stringify(response.data).substring(0, 60);
            console.log(`   Response: ${preview}...`);
          }
        } else {
          this.summary.failed++;
          console.log(`❌ ${test.name}`);
          console.log(`   ${test.method} ${test.path} → ${response.status}`);
          if (response.error) {
            console.log(`   Error: ${response.error}`);
          } else if (response.data?.error) {
            console.log(`   Error: ${response.data.error}`);
          }
        }
      }
    }

    this.generateFinalReport();
  }

  generateFinalReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL TEST SUMMARY');
    console.log('='.repeat(60));

    const passRate = ((this.summary.passed / this.summary.total) * 100).toFixed(1);
    const status = passRate >= 80 ? '✅ PASSED' : passRate >= 60 ? '⚠️  WARNING' : '❌ FAILED';

    console.log(`\nOverall Status: ${status}`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log(`Tests Passed: ${this.summary.passed}/${this.summary.total}`);

    // Group results by category
    const categories = {};
    this.results.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { passed: 0, failed: 0, tests: [] };
      }
      categories[result.category].tests.push(result);
      if (result.success) {
        categories[result.category].passed++;
      } else {
        categories[result.category].failed++;
      }
    });

    console.log('\nResults by Category:');
    Object.entries(categories).forEach(([category, data]) => {
      const catRate = ((data.passed / data.tests.length) * 100).toFixed(0);
      const catIcon = catRate >= 80 ? '✅' : catRate >= 50 ? '⚠️ ' : '❌';
      console.log(`\n${catIcon} ${category}: ${data.passed}/${data.tests.length} (${catRate}%)`);
      
      // Show failed tests in this category
      const failed = data.tests.filter(t => !t.success);
      if (failed.length > 0) {
        failed.forEach(test => {
          console.log(`   ❌ ${test.name} - ${test.status}`);
        });
      }
    });

    // Module Health Assessment
    console.log('\n🏥 Module Health Assessment:');
    
    const healthChecks = {
      'API Endpoints Accessible': this.results.filter(r => r.path.includes('/api/')).some(r => r.success),
      'Health Check Passing': this.results.find(r => r.name === 'Health Check')?.success || false,
      'Store Listing Works': this.results.find(r => r.name === 'List Stores')?.success || false,
      'Real-time Data Available': this.results.find(r => r.name === 'Real-time Traffic')?.success || false,
      'UI Accessible': this.results.find(r => r.name === 'Retail Module Page')?.success || false
    };

    Object.entries(healthChecks).forEach(([check, passed]) => {
      console.log(`  ${passed ? '✅' : '❌'} ${check}`);
    });

    const healthyChecks = Object.values(healthChecks).filter(v => v).length;
    const healthPercentage = (healthyChecks / Object.keys(healthChecks).length * 100).toFixed(0);

    console.log(`\n  Overall Health: ${healthPercentage}%`);
    
    if (healthPercentage >= 80) {
      console.log('  Status: 🟢 Healthy - Ready for production');
    } else if (healthPercentage >= 60) {
      console.log('  Status: 🟡 Fair - Some issues need attention');
    } else {
      console.log('  Status: 🔴 Critical - Major issues detected');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    
    if (this.results.some(r => r.status === 'ERROR' || r.status === 'TIMEOUT')) {
      console.log('  • Server Connection Issues:');
      console.log('    - Ensure the development server is running: npm run dev');
      console.log('    - Check if the correct port is being used');
    }

    if (this.results.some(r => r.status === 401)) {
      console.log('  • Authentication Required:');
      console.log('    - Some endpoints require authentication');
      console.log('    - Implement proper auth middleware or provide tokens');
    }

    if (this.results.some(r => r.status === 400 && r.success === false)) {
      console.log('  • Parameter Issues:');
      console.log('    - Review API documentation for required parameters');
      console.log('    - Ensure all request bodies match expected format');
    }

    // Save detailed report
    const timestamp = new Date().toISOString();
    const reportPath = `/workspaces/blipee-os/retail-final-test-report-${timestamp.split('T')[0]}.json`;
    
    require('fs').writeFileSync(reportPath, JSON.stringify({
      timestamp,
      baseUrl: BASE_URL,
      summary: {
        ...this.summary,
        passRate: passRate + '%',
        overallStatus: status,
        healthPercentage: healthPercentage + '%'
      },
      healthChecks,
      results: this.results,
      categorySummary: categories
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    console.log('\n✨ Test run completed successfully!\n');
  }
}

// Run the final test
const tester = new RetailModuleFinalTest();
tester.runTests().catch(console.error);