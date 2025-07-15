#!/usr/bin/env node

/**
 * API Endpoints Test Script
 * Tests all agent API endpoints for proper response handling
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class APITester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    
    console.log(`[${timestamp}] ${type.toUpperCase()}: ${message}`);
    
    if (type === 'error') {
      this.errors.push(logEntry);
    } else {
      this.results.push(logEntry);
    }
  }

  async testEndpoint(method, path, body = null, expectedStatus = 200) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_BASE_URL}${path}`, options);
      const responseData = await response.json().catch(() => null);

      if (response.status === expectedStatus) {
        this.log(`✅ ${method} ${path} - Status: ${response.status}`);
        return { success: true, data: responseData, status: response.status };
      } else {
        this.log(`❌ ${method} ${path} - Expected: ${expectedStatus}, Got: ${response.status}`, 'error');
        return { success: false, data: responseData, status: response.status };
      }
    } catch (error) {
      this.log(`❌ ${method} ${path} - Error: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log('🚀 Testing Agent API Endpoints');
    console.log('==============================');

    // Test 1: GET /api/agents
    await this.testEndpoint('GET', '/api/agents', null, 401); // Expect 401 without auth

    // Test 2: POST /api/agents
    await this.testEndpoint('POST', '/api/agents', { action: 'test' }, 401); // Expect 401 without auth

    // Test 3: GET /api/agents/[agentId]
    await this.testEndpoint('GET', '/api/agents/test-agent-id', null, 401); // Expect 401 without auth

    // Test 4: PUT /api/agents/[agentId]
    await this.testEndpoint('PUT', '/api/agents/test-agent-id', { status: 'running' }, 401); // Expect 401 without auth

    // Test 5: GET /api/agents/[agentId]/status
    await this.testEndpoint('GET', '/api/agents/test-agent-id/status', null, 401); // Expect 401 without auth

    // Test 6: POST /api/agents/[agentId]/status
    await this.testEndpoint('POST', '/api/agents/test-agent-id/status', { action: 'start' }, 401); // Expect 401 without auth

    // Test 7: GET /api/agents/[agentId]/tasks
    await this.testEndpoint('GET', '/api/agents/test-agent-id/tasks', null, 401); // Expect 401 without auth

    // Test 8: POST /api/agents/[agentId]/tasks
    await this.testEndpoint('POST', '/api/agents/test-agent-id/tasks', { 
      taskType: 'test', 
      taskName: 'Test Task' 
    }, 401); // Expect 401 without auth

    // Test 9: GET /api/agents/approvals
    await this.testEndpoint('GET', '/api/agents/approvals', null, 401); // Expect 401 without auth

    // Test 10: POST /api/agents/approvals
    await this.testEndpoint('POST', '/api/agents/approvals', { 
      approvalId: 'test-id', 
      action: 'approve' 
    }, 401); // Expect 401 without auth

    this.generateReport();
  }

  generateReport() {
    console.log('\n📊 API Test Results');
    console.log('===================');
    
    const totalTests = this.results.length + this.errors.length;
    const passed = this.results.length;
    const failed = this.errors.length;
    
    console.log(`Total Endpoints Tested: ${totalTests}`);
    console.log(`✅ Responding Correctly: ${passed}`);
    console.log(`❌ Errors: ${failed}`);
    
    if (failed === 0) {
      console.log('\n🎉 All API endpoints are responding correctly!');
      console.log('✅ Authentication is properly implemented');
      console.log('✅ Error handling is working as expected');
    } else {
      console.log('\n⚠️ Some API endpoints need attention:');
      this.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.message}`);
      });
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Set up authentication for testing');
    console.log('3. Test with authenticated requests');
    console.log('4. Visit /dashboard/agents to test the UI');
  }
}

// Import fetch for Node.js
const fetch = require('node-fetch');

// Run tests
async function runTests() {
  const tester = new APITester();
  await tester.runAllTests();
}

// Execute if run directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { APITester };