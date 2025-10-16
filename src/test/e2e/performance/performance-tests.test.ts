/**
 * Performance Tests
 * Phase 5, Task 5.1: Performance benchmarking and load testing
 */

import { test, expect } from '@playwright/test';
import { E2ETestFramework, TestUser } from '../e2e-test-framework';

const config = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 60000,
  retries: 1,
  parallel: false,
  headless: true, // Always headless for performance tests
  video: false, // No video for performance tests
  screenshot: 'never' as const
};

const testUser: TestUser = {
  email: 'perf.test@blipee-test.com',
  password: 'TestPassword123!',
  role: 'sustainability_manager',
  organizationId: 'test-org-perf',
  firstName: 'Perf',
  lastName: 'Tester'
};

test.describe('Performance Tests', () => {
  let framework: E2ETestFramework;

  test.beforeEach(async () => {
    framework = new E2ETestFramework(config);
    await framework.initialize();
  });

  test.afterEach(async () => {
    await framework.cleanup();
  });

  test('Page load performance benchmarks', async () => {
    const pages = [
      { path: '/', name: 'Landing Page', maxLoadTime: 2000 },
      { path: '/signin', name: 'Sign In Page', maxLoadTime: 1500 },
      { path: '/signup', name: 'Sign Up Page', maxLoadTime: 1500 }
    ];

    const results: Array<{
      name: string;
      loadTime: number;
      domContentLoaded: number;
      firstContentfulPaint: number;
      passed: boolean;
    }> = [];

    for (const page of pages) {
      
      const metrics = await framework.measurePageLoad(page.path);
      const passed = metrics.loadTime <= page.maxLoadTime;
      
      results.push({
        name: page.name,
        loadTime: metrics.loadTime,
        domContentLoaded: metrics.domContentLoaded,
        firstContentfulPaint: metrics.firstContentfulPaint,
        passed
      });


      // Assert performance requirements
      expect(metrics.loadTime, `${page.name} load time should be under ${page.maxLoadTime}ms`)
        .toBeLessThanOrEqual(page.maxLoadTime);
    }

    // Log summary
    const passedTests = results.filter(r => r.passed).length;
  });

  test('Authenticated page performance', async () => {
    // Sign in first
    await framework.signIn(testUser);

    const authenticatedPages = [
      { path: '/dashboard', name: 'Dashboard', maxLoadTime: 3000 },
      { path: '/chat', name: 'AI Chat', maxLoadTime: 2500 },
      { path: '/organizations', name: 'Organizations', maxLoadTime: 2000 }
    ];

    for (const page of authenticatedPages) {
      
      const startTime = Date.now();
      await framework.navigateTo(page.path);
      const loadTime = Date.now() - startTime;


      expect(loadTime, `${page.name} load time should be under ${page.maxLoadTime}ms`)
        .toBeLessThanOrEqual(page.maxLoadTime);
    }
  });

  test('API response performance', async () => {
    const apiEndpoints = [
      { path: '/api/health', name: 'Health Check', maxResponseTime: 500 },
      { path: '/api/organizations', name: 'Organizations API', maxResponseTime: 1000 },
      { path: '/api/emissions', name: 'Emissions API', maxResponseTime: 1500 }
    ];

    for (const endpoint of apiEndpoints) {
      
      const startTime = Date.now();
      const response = await framework.page.request.get(endpoint.path);
      const responseTime = Date.now() - startTime;


      expect(response.status()).toBeLessThan(400);
      expect(responseTime, `${endpoint.name} response time should be under ${endpoint.maxResponseTime}ms`)
        .toBeLessThanOrEqual(endpoint.maxResponseTime);
    }
  });

  test('AI conversation response time', async () => {
    await framework.signIn(testUser);
    await framework.navigateTo('/chat');


    const testMessages = [
      'Hello, can you help me?',
      'What are our current emissions?',
      'Generate a simple chart of our data'
    ];

    const maxAIResponseTime = 15000; // 15 seconds for AI responses
    const responseTimes: number[] = [];

    for (let i = 0; i < testMessages.length; i++) {
      const message = testMessages[i];
      
      const startTime = Date.now();
      await framework.sendMessage(message);
      const responseTime = Date.now() - startTime;
      
      responseTimes.push(responseTime);
      

      expect(responseTime, `AI response time should be under ${maxAIResponseTime}ms`)
        .toBeLessThanOrEqual(maxAIResponseTime);
      
      // Wait between messages to avoid rate limiting
      await framework.page.waitForTimeout(2000);
    }

    const avgResponseTime = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
  });

  test('Large dataset handling performance', async () => {
    await framework.signIn(testUser);


    // Navigate to emissions page
    await framework.navigateTo('/organizations/test-org-perf/emissions');

    // Simulate large dataset load
    const startTime = Date.now();
    
    // Add many data points through bulk import simulation
    await framework.page.click('[data-testid="bulk-import-button"]');
    
    // Create large CSV data (1000 rows)
    const csvRows = ['date,scope,category,amount,unit'];
    for (let i = 0; i < 1000; i++) {
      const date = new Date(2024, 0, (i % 365) + 1).toISOString().split('T')[0];
      const scope = `scope${(i % 3) + 1}`;
      const amount = Math.floor(Math.random() * 1000) + 100;
      csvRows.push(`${date},${scope},Electricity,${amount},kwh`);
    }
    
    const largeCsvData = csvRows.join('\n');
    
    // Upload large CSV
    const fileInput = await framework.page.locator('[data-testid="csv-file-input"]');
    await fileInput.setInputFiles({
      name: 'large-test-data.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(largeCsvData)
    });

    await framework.page.click('[data-testid="process-csv-button"]');
    
    // Wait for processing with extended timeout
    await framework.page.waitForSelector('[data-testid="import-success-message"]', { timeout: 120000 });
    
    const processingTime = Date.now() - startTime;
    const maxProcessingTime = 60000; // 1 minute for 1000 records


    expect(processingTime, `Large dataset processing should complete within ${maxProcessingTime}ms`)
      .toBeLessThanOrEqual(maxProcessingTime);
  });

  test('Memory usage monitoring', async () => {
    await framework.signIn(testUser);


    // Monitor memory usage during heavy operations
    const memoryUsage: number[] = [];
    
    const monitorMemory = async () => {
      const metrics = await framework.page.evaluate(() => {
        return {
          usedJSMemory: (performance as any).memory?.usedJSMemory || 0,
          totalJSMemory: (performance as any).memory?.totalJSMemory || 0
        };
      });
      memoryUsage.push(metrics.usedJSMemory);
      return metrics;
    };

    // Baseline memory
    const baseline = await monitorMemory();

    // Perform memory-intensive operations
    const operations = [
      { name: 'Load Dashboard', action: () => framework.navigateTo('/dashboard') },
      { name: 'Load Large Dataset', action: () => framework.navigateTo('/organizations/test-org-perf/analytics') },
      { name: 'AI Conversation', action: () => framework.sendMessage('Generate a complex analysis') }
    ];

    for (const operation of operations) {
      await operation.action();
      await framework.page.waitForTimeout(2000); // Wait for stabilization
      
      const metrics = await monitorMemory();
      const memoryMB = Math.round(metrics.usedJSMemory / 1024 / 1024);
      
    }

    // Check for memory leaks
    const maxMemory = Math.max(...memoryUsage);
    const currentMemory = memoryUsage[memoryUsage.length - 1];
    const memoryGrowth = ((currentMemory - baseline.usedJSMemory) / baseline.usedJSMemory) * 100;


    // Memory growth should be reasonable (less than 300% increase)
    expect(memoryGrowth, 'Memory growth should be reasonable')
      .toBeLessThan(300);
  });

  test('Concurrent user simulation', async () => {

    const concurrentUsers = 5;
    const userPromises: Promise<void>[] = [];

    // Simulate multiple users accessing the application
    for (let i = 0; i < concurrentUsers; i++) {
      const userPromise = (async (userIndex: number) => {
        const userFramework = new E2ETestFramework({
          ...config,
          timeout: 30000
        });
        
        try {
          await userFramework.initialize();
          
          const startTime = Date.now();
          
          // Each user performs different actions
          await userFramework.signIn({
            ...testUser,
            email: `perf.user${userIndex}@blipee-test.com`
          });
          
          await userFramework.navigateTo('/dashboard');
          await userFramework.navigateTo('/chat');
          await userFramework.sendMessage('What is my carbon footprint?');
          
          const duration = Date.now() - startTime;
          
          await userFramework.cleanup();
          
        } catch (error) {
          console.error(`  User ${userIndex + 1}: Failed -`, error);
          await userFramework.cleanup();
          throw error;
        }
      })(i);
      
      userPromises.push(userPromise);
    }

    const startTime = Date.now();
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    const totalDuration = Date.now() - startTime;
    const maxConcurrentDuration = 45000; // 45 seconds for 5 concurrent users


    expect(totalDuration, `Concurrent user test should complete within ${maxConcurrentDuration}ms`)
      .toBeLessThanOrEqual(maxConcurrentDuration);
  });
});