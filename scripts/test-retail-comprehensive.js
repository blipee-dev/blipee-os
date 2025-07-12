#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const isSecure = BASE_URL.startsWith('https');
const httpModule = isSecure ? https : http;

class ComprehensiveRetailTester {
  constructor() {
    this.results = {
      structure: [],
      api: [],
      ui: [],
      integration: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };
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

  async testStructure() {
    console.log('\n📁 Testing Module Structure...\n');

    const files = [
      // API Routes
      { path: '/workspaces/blipee-os/src/app/api/retail/v1/health/route.ts', type: 'API' },
      { path: '/workspaces/blipee-os/src/app/api/retail/v1/stores/route.ts', type: 'API' },
      { path: '/workspaces/blipee-os/src/app/api/retail/v1/traffic/realtime/route.ts', type: 'API' },
      { path: '/workspaces/blipee-os/src/app/api/retail/v1/analytics/route.ts', type: 'API' },
      { path: '/workspaces/blipee-os/src/app/api/retail/v1/auth/telegram/route.ts', type: 'API' },
      { path: '/workspaces/blipee-os/src/app/api/retail/v1/telegram/state/route.ts', type: 'API' },
      
      // UI Components
      { path: '/workspaces/blipee-os/src/components/retail/dashboard/RetailDashboard.tsx', type: 'UI' },
      { path: '/workspaces/blipee-os/src/components/retail/ui/StoreSelector.tsx', type: 'UI' },
      { path: '/workspaces/blipee-os/src/components/retail/analytics/RealTimeTraffic.tsx', type: 'UI' },
      { path: '/workspaces/blipee-os/src/components/retail/analytics/QuickInsights.tsx', type: 'UI' },
      { path: '/workspaces/blipee-os/src/components/retail/analytics/AnalyticsOverview.tsx', type: 'UI' },
      { path: '/workspaces/blipee-os/src/components/retail/ui/ConversationalInterface.tsx', type: 'UI' },
      { path: '/workspaces/blipee-os/src/app/retail/page.tsx', type: 'Page' },
      
      // Module & Auth
      { path: '/workspaces/blipee-os/src/lib/modules/retail-module.ts', type: 'Module' },
      { path: '/workspaces/blipee-os/src/lib/hooks/useRetailAuth.ts', type: 'Hook' },
      { path: '/workspaces/blipee-os/src/lib/auth/retail-middleware.ts', type: 'Middleware' },
      { path: '/workspaces/blipee-os/src/lib/auth/retail-permissions.ts', type: 'Permissions' }
    ];

    for (const file of files) {
      try {
        await fs.access(file.path);
        this.results.structure.push({
          path: file.path,
          type: file.type,
          exists: true,
          success: true
        });
        this.results.summary.passed++;
        console.log(`  ✓ ${file.type}: ${path.basename(file.path)}`);
      } catch (error) {
        this.results.structure.push({
          path: file.path,
          type: file.type,
          exists: false,
          success: false
        });
        this.results.summary.failed++;
        console.log(`  ✗ ${file.type}: ${path.basename(file.path)} - MISSING`);
      }
      this.results.summary.total++;
    }
  }

  async testAPIs() {
    console.log('\n🔌 Testing API Endpoints...\n');

    const endpoints = [
      {
        name: 'Health Check',
        path: '/api/retail/v1/health',
        method: 'GET'
      },
      {
        name: 'List Stores',
        path: '/api/retail/v1/stores',
        method: 'GET'
      },
      {
        name: 'Real-time Traffic (with store)',
        path: '/api/retail/v1/traffic/realtime',
        method: 'GET',
        params: { loja: 'OML01' }
      },
      {
        name: 'Analytics Data (with store)',
        path: '/api/retail/v1/analytics',
        method: 'GET',
        params: { loja: 'OML01' }
      },
      {
        name: 'Telegram Auth',
        path: '/api/retail/v1/auth/telegram',
        method: 'POST',
        body: { 
          userId: 'test123',
          username: 'testuser',
          first_name: 'Test',
          last_name: 'User'
        }
      },
      {
        name: 'Get Telegram State',
        path: '/api/retail/v1/telegram/state',
        method: 'GET',
        params: { chatId: 'test123' }
      },
      {
        name: 'Update Telegram State',
        path: '/api/retail/v1/telegram/state',
        method: 'POST',
        body: { 
          chatId: 'test123',
          state: 'store_selection',
          data: { selectedStore: 'OML01' }
        }
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await this.makeRequest(endpoint.path, {
          method: endpoint.method,
          params: endpoint.params,
          body: endpoint.body
        });

        const success = response.status === 200 || response.status === 201;
        
        this.results.api.push({
          name: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          status: response.status,
          success,
          response: response.data
        });

        this.results.summary.total++;
        if (success) {
          this.results.summary.passed++;
          console.log(`  ✓ ${endpoint.name} - Status: ${response.status}`);
          if (response.data) {
            console.log(`    Response: ${JSON.stringify(response.data).substring(0, 80)}...`);
          }
        } else {
          this.results.summary.failed++;
          console.log(`  ✗ ${endpoint.name} - Status: ${response.status}`);
          if (response.data?.error) {
            console.log(`    Error: ${response.data.error}`);
          }
        }
      } catch (error) {
        this.results.api.push({
          name: endpoint.name,
          path: endpoint.path,
          method: endpoint.method,
          status: 'ERROR',
          success: false,
          error: error.message
        });
        this.results.summary.total++;
        this.results.summary.failed++;
        console.log(`  ✗ ${endpoint.name} - ERROR: ${error.message}`);
      }
    }
  }

  async testUIAccess() {
    console.log('\n🎨 Testing UI Access...\n');

    const uiEndpoints = [
      { name: 'Retail Module Page', path: '/retail' },
      { name: 'Main App', path: '/' }
    ];

    for (const endpoint of uiEndpoints) {
      try {
        const response = await this.makeRequest(endpoint.path);
        const success = response.status === 200 || response.status === 307; // 307 for redirects
        
        this.results.ui.push({
          name: endpoint.name,
          path: endpoint.path,
          status: response.status,
          success
        });

        this.results.summary.total++;
        if (success) {
          this.results.summary.passed++;
          console.log(`  ✓ ${endpoint.name} - Status: ${response.status}`);
        } else {
          this.results.summary.failed++;
          console.log(`  ✗ ${endpoint.name} - Status: ${response.status}`);
        }
      } catch (error) {
        this.results.ui.push({
          name: endpoint.name,
          path: endpoint.path,
          status: 'ERROR',
          success: false,
          error: error.message
        });
        this.results.summary.total++;
        this.results.summary.failed++;
        console.log(`  ✗ ${endpoint.name} - ERROR`);
      }
    }
  }

  async testIntegration() {
    console.log('\n🔗 Testing Integration...\n');

    // Test module registration
    try {
      const moduleContent = await fs.readFile('/workspaces/blipee-os/src/lib/modules/retail-module.ts', 'utf8');
      const hasRegistration = moduleContent.includes('moduleRegistry.register');
      
      this.results.integration.push({
        name: 'Module Registration',
        success: hasRegistration,
        details: hasRegistration ? 'Auto-registration found' : 'No auto-registration'
      });

      this.results.summary.total++;
      if (hasRegistration) {
        this.results.summary.passed++;
        console.log('  ✓ Module Registration - Auto-registration configured');
      } else {
        this.results.summary.failed++;
        console.log('  ✗ Module Registration - No auto-registration found');
      }
    } catch (error) {
      this.results.integration.push({
        name: 'Module Registration',
        success: false,
        error: error.message
      });
      this.results.summary.total++;
      this.results.summary.failed++;
      console.log('  ✗ Module Registration - ERROR');
    }

    // Test auth integration
    try {
      const authContent = await fs.readFile('/workspaces/blipee-os/src/lib/auth/retail-permissions.ts', 'utf8');
      const hasPermissions = authContent.includes('retail:read') || authContent.includes('retail:write');
      
      this.results.integration.push({
        name: 'Permission Definitions',
        success: hasPermissions,
        details: hasPermissions ? 'Retail permissions defined' : 'No retail permissions'
      });

      this.results.summary.total++;
      if (hasPermissions) {
        this.results.summary.passed++;
        console.log('  ✓ Permission Definitions - Retail permissions defined');
      } else {
        this.results.summary.failed++;
        console.log('  ✗ Permission Definitions - No retail permissions found');
      }
    } catch (error) {
      this.results.integration.push({
        name: 'Permission Definitions',
        success: false,
        error: error.message
      });
      this.results.summary.total++;
      this.results.summary.failed++;
      console.log('  ✗ Permission Definitions - ERROR');
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));

    // Overall Summary
    const passRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
    const passColor = passRate >= 80 ? '🟢' : passRate >= 60 ? '🟡' : '🔴';
    
    console.log('\n📈 Overall Summary:');
    console.log(`  Total tests: ${this.results.summary.total}`);
    console.log(`  Passed: ${this.results.summary.passed}`);
    console.log(`  Failed: ${this.results.summary.failed}`);
    console.log(`  Pass rate: ${passColor} ${passRate}%`);

    // Category Breakdown
    console.log('\n📊 Category Breakdown:');
    
    const categories = [
      { name: 'Structure', data: this.results.structure },
      { name: 'API Endpoints', data: this.results.api },
      { name: 'UI Access', data: this.results.ui },
      { name: 'Integration', data: this.results.integration }
    ];

    categories.forEach(category => {
      const passed = category.data.filter(r => r.success).length;
      const total = category.data.length;
      const rate = total > 0 ? ((passed / total) * 100).toFixed(0) : 0;
      console.log(`  ${category.name}: ${passed}/${total} (${rate}%)`);
    });

    // Failed Tests
    const allFailed = [
      ...this.results.structure.filter(r => !r.success),
      ...this.results.api.filter(r => !r.success),
      ...this.results.ui.filter(r => !r.success),
      ...this.results.integration.filter(r => !r.success)
    ];

    if (allFailed.length > 0) {
      console.log('\n❌ Failed Tests:');
      allFailed.forEach(test => {
        console.log(`  • ${test.name || test.type || test.path}`);
        if (test.error) {
          console.log(`    Error: ${test.error}`);
        }
      });
    }

    // Module Health
    console.log('\n🏥 Module Health:');
    if (passRate >= 80) {
      console.log('  ✅ Module is healthy and ready for use');
    } else if (passRate >= 60) {
      console.log('  ⚠️  Module is partially functional but needs attention');
    } else {
      console.log('  ❌ Module has critical issues that need to be fixed');
    }

    // Recommendations
    if (this.results.summary.failed > 0) {
      console.log('\n💡 Recommendations:');
      
      const structureFailed = this.results.structure.filter(r => !r.success).length;
      if (structureFailed > 0) {
        console.log('  1. Missing files detected - ensure all components are created');
      }

      const apiFailed = this.results.api.filter(r => !r.success).length;
      if (apiFailed > 0) {
        console.log('  2. API endpoints failing - check server logs and parameters');
      }

      const serverErrors = this.results.api.filter(r => r.status === 'ERROR' || r.status === 'TIMEOUT');
      if (serverErrors.length > 0) {
        console.log('  3. Server connection issues - ensure dev server is running');
      }
    }

    // Save detailed report
    const timestamp = new Date().toISOString();
    const reportPath = `/workspaces/blipee-os/retail-comprehensive-report-${timestamp.split('T')[0]}.json`;
    
    fs.writeFile(reportPath, JSON.stringify({
      timestamp,
      results: this.results,
      summary: {
        ...this.results.summary,
        passRate: passRate + '%',
        health: passRate >= 80 ? 'healthy' : passRate >= 60 ? 'warning' : 'critical'
      }
    }, null, 2)).then(() => {
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    });
  }

  async run() {
    console.log('\n🛍️  Retail Intelligence Module - Comprehensive Test Suite');
    console.log('Testing against: ' + BASE_URL);
    
    await this.testStructure();
    await this.testAPIs();
    await this.testUIAccess();
    await this.testIntegration();
    
    this.generateReport();
  }
}

// Run the comprehensive test
const tester = new ComprehensiveRetailTester();
tester.run().catch(console.error);