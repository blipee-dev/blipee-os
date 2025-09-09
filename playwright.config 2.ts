/**
 * Playwright Configuration for E2E Tests
 * Phase 5, Task 5.1: End-to-End Testing Setup
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/test',
  
  // Test execution settings
  fullyParallel: false, // Run tests sequentially for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 1, // Single worker for consistency
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
    ...(process.env.CI ? [['github']] : [])
  ],

  // Global test settings
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: process.env.CI === 'true',
    ignoreHTTPSErrors: true,
    
    // Extended timeouts for AI operations
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Custom viewport
    viewport: { width: 1920, height: 1080 },
    
    // Test data directory
    storageState: {
      cookies: [],
      origins: []
    }
  },

  // Projects for different browsers and devices
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*\.test\.ts$/
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: /.*\.test\.ts$/,
      dependencies: ['chromium'] // Run after chromium
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: /.*\.test\.ts$/,
      dependencies: ['firefox'] // Run after firefox
    },
    
    // Mobile devices
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: /.*mobile.*\.test\.ts$/
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch: /.*mobile.*\.test\.ts$/
    },
    
    // Accessibility testing
    {
      name: 'accessibility',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /.*accessibility.*\.test\.ts$/
    },
    
    // Security testing (headless, extended timeout)
    {
      name: 'security',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        video: 'off',
        screenshot: 'off'
      },
      testMatch: /.*security.*\.test\.ts$/,
      timeout: 180000 // 3 minutes for security tests
    }
  ],

  // Test timeout
  timeout: 120000, // 2 minutes for complex operations

  // Global setup and teardown
  globalSetup: './src/test/e2e/global-setup.ts',
  globalTeardown: './src/test/e2e/global-teardown.ts',

  // Web server setup (if needed for testing)
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Output directory
  outputDir: 'test-results/artifacts',
  
  // Test patterns
  testIgnore: [
    '**/*.skip.ts',
    '**/*.draft.ts'
  ],

  // Global expect timeout
  expect: {
    timeout: 10000
  },

  // Metadata
  metadata: {
    'test-suite': 'blipee-os-e2e',
    'phase': 'phase-5-quality-testing',
    'environment': process.env.NODE_ENV || 'test'
  }
});