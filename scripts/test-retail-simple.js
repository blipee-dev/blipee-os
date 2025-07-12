#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

class RetailModuleTestRunner {
  constructor() {
    this.results = {
      apiEndpoints: [],
      components: [],
      modules: [],
      authentication: [],
      overall: { passed: 0, failed: 0, total: 0 }
    };
  }

  async run() {
    console.log('\n🛍️  Retail Intelligence Module Test Suite\n');
    console.log('Testing all components of the retail module...\n');

    await this.testAPIEndpoints();
    await this.testComponents();
    await this.testModules();
    await this.testAuthentication();

    this.generateReport();
  }

  async testAPIEndpoints() {
    console.log('Testing API endpoints...');
    
    const endpoints = [
      '/workspaces/blipee-os/src/app/api/retail/v1/health/route.ts',
      '/workspaces/blipee-os/src/app/api/retail/v1/stores/route.ts',
      '/workspaces/blipee-os/src/app/api/retail/v1/traffic/realtime/route.ts',
      '/workspaces/blipee-os/src/app/api/retail/v1/analytics/route.ts',
      '/workspaces/blipee-os/src/app/api/retail/v1/auth/telegram/route.ts',
      '/workspaces/blipee-os/src/app/api/retail/v1/telegram/state/route.ts'
    ];

    for (const endpoint of endpoints) {
      try {
        await fs.access(endpoint);
        const content = await fs.readFile(endpoint, 'utf8');
        
        // Check for required exports
        const hasGET = content.includes('export async function GET');
        const hasPOST = content.includes('export async function POST');
        const hasPUT = content.includes('export async function PUT');
        const hasDELETE = content.includes('export async function DELETE');
        
        const methods = [];
        if (hasGET) methods.push('GET');
        if (hasPOST) methods.push('POST');
        if (hasPUT) methods.push('PUT');
        if (hasDELETE) methods.push('DELETE');
        
        this.results.apiEndpoints.push({
          path: endpoint,
          exists: true,
          methods: methods,
          success: true
        });
        this.results.overall.passed++;
        
      } catch (error) {
        this.results.apiEndpoints.push({
          path: endpoint,
          exists: false,
          success: false,
          error: error.message
        });
        this.results.overall.failed++;
      }
      this.results.overall.total++;
    }
  }

  async testComponents() {
    console.log('Testing UI components...');
    
    const components = [
      '/workspaces/blipee-os/src/components/retail/dashboard/RetailDashboard.tsx',
      '/workspaces/blipee-os/src/components/retail/ui/StoreSelector.tsx',
      '/workspaces/blipee-os/src/components/retail/analytics/RealTimeTraffic.tsx',
      '/workspaces/blipee-os/src/components/retail/analytics/QuickInsights.tsx',
      '/workspaces/blipee-os/src/components/retail/analytics/AnalyticsOverview.tsx',
      '/workspaces/blipee-os/src/components/retail/ui/ConversationalInterface.tsx',
      '/workspaces/blipee-os/src/app/retail/page.tsx'
    ];

    for (const component of components) {
      try {
        await fs.access(component);
        const content = await fs.readFile(component, 'utf8');
        
        // Check for React component
        const isReactComponent = content.includes('import React') || content.includes('from \'react\'') || content.includes('from "react"');
        const hasExport = content.includes('export default') || content.includes('export {') || content.includes('export function');
        
        this.results.components.push({
          path: component,
          name: path.basename(component, path.extname(component)),
          exists: true,
          isReactComponent,
          hasExport,
          success: true
        });
        this.results.overall.passed++;
        
      } catch (error) {
        this.results.components.push({
          path: component,
          name: path.basename(component, path.extname(component)),
          exists: false,
          success: false,
          error: error.message
        });
        this.results.overall.failed++;
      }
      this.results.overall.total++;
    }
  }

  async testModules() {
    console.log('Testing module registry...');
    
    const moduleFiles = [
      '/workspaces/blipee-os/src/lib/modules/retail-module.ts',
      '/workspaces/blipee-os/src/lib/modules/registry.ts'
    ];

    for (const moduleFile of moduleFiles) {
      try {
        await fs.access(moduleFile);
        const content = await fs.readFile(moduleFile, 'utf8');
        
        // Check for module structure
        const hasModuleDefinition = content.includes('Module') || content.includes('module');
        const hasRetailModule = content.includes('retail') || content.includes('Retail');
        
        this.results.modules.push({
          path: moduleFile,
          name: path.basename(moduleFile),
          exists: true,
          hasModuleDefinition,
          hasRetailModule,
          success: true
        });
        this.results.overall.passed++;
        
      } catch (error) {
        this.results.modules.push({
          path: moduleFile,
          name: path.basename(moduleFile),
          exists: false,
          success: false,
          error: error.message
        });
        this.results.overall.failed++;
      }
      this.results.overall.total++;
    }
  }

  async testAuthentication() {
    console.log('Testing authentication...');
    
    const authFiles = [
      '/workspaces/blipee-os/src/lib/hooks/useRetailAuth.ts',
      '/workspaces/blipee-os/src/lib/auth/retail-middleware.ts',
      '/workspaces/blipee-os/src/lib/auth/retail-permissions.ts'
    ];

    for (const authFile of authFiles) {
      try {
        await fs.access(authFile);
        const content = await fs.readFile(authFile, 'utf8');
        
        // Check for auth-related code
        const hasAuthLogic = content.includes('auth') || content.includes('Auth');
        const hasPermissions = content.includes('permission') || content.includes('Permission');
        const hasRetailSpecific = content.includes('retail') || content.includes('Retail');
        
        this.results.authentication.push({
          path: authFile,
          name: path.basename(authFile),
          exists: true,
          hasAuthLogic,
          hasPermissions,
          hasRetailSpecific,
          success: true
        });
        this.results.overall.passed++;
        
      } catch (error) {
        this.results.authentication.push({
          path: authFile,
          name: path.basename(authFile),
          exists: false,
          success: false,
          error: error.message
        });
        this.results.overall.failed++;
      }
      this.results.overall.total++;
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary\n');

    // API Endpoints
    console.log('API Endpoints:');
    this.results.apiEndpoints.forEach(result => {
      const icon = result.success ? '✓' : '✗';
      const status = result.success ? 'FOUND' : 'MISSING';
      console.log(`  ${icon} ${path.basename(result.path)} - ${status}`);
      if (result.methods && result.methods.length > 0) {
        console.log(`     Methods: ${result.methods.join(', ')}`);
      }
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });

    // Components
    console.log('\nUI Components:');
    this.results.components.forEach(result => {
      const icon = result.success ? '✓' : '✗';
      const status = result.success ? 'FOUND' : 'MISSING';
      console.log(`  ${icon} ${result.name} - ${status}`);
      if (result.isReactComponent !== undefined) {
        console.log(`     React Component: ${result.isReactComponent ? 'Yes' : 'No'}`);
      }
    });

    // Modules
    console.log('\nModule Registry:');
    this.results.modules.forEach(result => {
      const icon = result.success ? '✓' : '✗';
      const status = result.success ? 'FOUND' : 'MISSING';
      console.log(`  ${icon} ${result.name} - ${status}`);
      if (result.hasRetailModule !== undefined) {
        console.log(`     Has Retail Module: ${result.hasRetailModule ? 'Yes' : 'No'}`);
      }
    });

    // Authentication
    console.log('\nAuthentication:');
    this.results.authentication.forEach(result => {
      const icon = result.success ? '✓' : '✗';
      const status = result.success ? 'FOUND' : 'MISSING';
      console.log(`  ${icon} ${result.name} - ${status}`);
      if (result.hasRetailSpecific !== undefined) {
        console.log(`     Retail-specific: ${result.hasRetailSpecific ? 'Yes' : 'No'}`);
      }
    });

    // Overall Summary
    console.log('\n📈 Overall Summary:');
    const passRate = ((this.results.overall.passed / this.results.overall.total) * 100).toFixed(1);
    
    console.log(`  Total tests: ${this.results.overall.total}`);
    console.log(`  Passed: ${this.results.overall.passed}`);
    console.log(`  Failed: ${this.results.overall.failed}`);
    console.log(`  Pass rate: ${passRate}%`);

    // Save report
    const timestamp = new Date().toISOString();
    const reportPath = `/workspaces/blipee-os/retail-module-test-report-${timestamp.split('T')[0]}.json`;
    
    fs.writeFile(reportPath, JSON.stringify({
      timestamp,
      results: this.results,
      summary: {
        totalTests: this.results.overall.total,
        passed: this.results.overall.passed,
        failed: this.results.overall.failed,
        passRate: passRate + '%'
      }
    }, null, 2)).then(() => {
      console.log(`\nDetailed report saved to: ${reportPath}`);
    });

    if (this.results.overall.failed > 0) {
      console.log('\n⚠️  Some tests failed. Please check the missing files.');
    } else {
      console.log('\n✅ All tests passed! The retail module structure is complete.');
    }
  }
}

// Run the tests
const runner = new RetailModuleTestRunner();
runner.run().catch(console.error);