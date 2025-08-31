/**
 * End-to-End Test Framework
 * Phase 5, Task 5.1: Comprehensive E2E Testing
 */

import { Page, Browser, BrowserContext } from '@playwright/test';

export interface E2ETestConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  parallel: boolean;
  headless: boolean;
  video: boolean;
  screenshot: 'only-on-failure' | 'always' | 'never';
}

export interface TestUser {
  email: string;
  password: string;
  role: 'account_owner' | 'sustainability_manager' | 'facility_manager' | 'analyst' | 'viewer';
  organizationId: string;
  firstName: string;
  lastName: string;
}

export interface TestOrganization {
  id: string;
  name: string;
  type: string;
  buildings: TestBuilding[];
}

export interface TestBuilding {
  id: string;
  name: string;
  address: string;
  type: string;
}

export class E2ETestFramework {
  private config: E2ETestConfig;
  private browser!: Browser;
  private context!: BrowserContext;
  private page!: Page;

  constructor(config: E2ETestConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    const { chromium } = await import('@playwright/test');
    
    this.browser = await chromium.launch({
      headless: this.config.headless
    });

    this.context = await this.browser.newContext({
      baseURL: this.config.baseURL,
      viewport: { width: 1920, height: 1080 },
      video: this.config.video ? 'retain-on-failure' : undefined,
      screenshot: this.config.screenshot
    });

    this.page = await this.context.newPage();
    
    // Set longer timeout for complex operations
    this.page.setDefaultTimeout(this.config.timeout);
    
    // Add request/response logging for debugging
    this.page.on('request', (request) => {
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    this.page.on('response', (response) => {
      if (!response.ok()) {
        console.log(`← ${response.status()} ${response.url()}`);
      }
    });
  }

  async cleanup(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
  }

  // Authentication Helpers
  async signIn(user: TestUser): Promise<void> {
    await this.page.goto('/signin');
    
    await this.page.fill('[data-testid="email"]', user.email);
    await this.page.fill('[data-testid="password"]', user.password);
    await this.page.click('[data-testid="signin-button"]');
    
    // Wait for successful sign-in
    await this.page.waitForURL('/dashboard', { timeout: 10000 });
    
    // Verify user is signed in
    await this.page.waitForSelector('[data-testid="user-menu"]');
  }

  async signOut(): Promise<void> {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="signout-button"]');
    await this.page.waitForURL('/signin');
  }

  // Navigation Helpers
  async navigateTo(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForAIResponse(timeout: number = 30000): Promise<void> {
    // Wait for AI conversation to complete
    await this.page.waitForSelector('[data-testid="ai-response"]', { timeout });
    
    // Wait for any streaming to complete
    await this.page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="ai-response"]');
      return element && !element.classList.contains('streaming');
    }, { timeout });
  }

  // Data Entry Helpers
  async createOrganization(org: Partial<TestOrganization>): Promise<string> {
    await this.navigateTo('/organizations/new');
    
    await this.page.fill('[data-testid="org-name"]', org.name!);
    await this.page.selectOption('[data-testid="org-type"]', org.type!);
    await this.page.click('[data-testid="create-org-button"]');
    
    // Wait for creation and get ID from URL
    await this.page.waitForURL(/\/organizations\/[a-zA-Z0-9-]+/);
    const url = this.page.url();
    const orgId = url.split('/').pop()!;
    
    return orgId;
  }

  async addBuilding(orgId: string, building: Partial<TestBuilding>): Promise<string> {
    await this.navigateTo(`/organizations/${orgId}/buildings`);
    
    await this.page.click('[data-testid="add-building-button"]');
    await this.page.fill('[data-testid="building-name"]', building.name!);
    await this.page.fill('[data-testid="building-address"]', building.address!);
    await this.page.selectOption('[data-testid="building-type"]', building.type!);
    await this.page.click('[data-testid="save-building-button"]');
    
    // Wait for building to appear in list
    await this.page.waitForSelector(`[data-testid="building-${building.name}"]`);
    
    // Get building ID from the element
    const buildingElement = await this.page.locator(`[data-testid="building-${building.name}"]`);
    const buildingId = await buildingElement.getAttribute('data-building-id');
    
    return buildingId!;
  }

  async addEmissionsData(buildingId: string, data: {
    scope: 'scope1' | 'scope2' | 'scope3';
    category: string;
    amount: number;
    unit: string;
    date: string;
  }): Promise<void> {
    await this.navigateTo(`/buildings/${buildingId}/emissions`);
    
    await this.page.click('[data-testid="add-emissions-button"]');
    await this.page.selectOption('[data-testid="scope-select"]', data.scope);
    await this.page.selectOption('[data-testid="category-select"]', data.category);
    await this.page.fill('[data-testid="amount-input"]', data.amount.toString());
    await this.page.selectOption('[data-testid="unit-select"]', data.unit);
    await this.page.fill('[data-testid="date-input"]', data.date);
    await this.page.click('[data-testid="save-emissions-button"]');
    
    // Wait for data to be saved
    await this.page.waitForSelector('[data-testid="emissions-saved-toast"]');
  }

  // AI Conversation Helpers
  async startConversation(message: string): Promise<void> {
    await this.navigateTo('/chat');
    
    await this.page.fill('[data-testid="chat-input"]', message);
    await this.page.click('[data-testid="send-button"]');
    
    await this.waitForAIResponse();
  }

  async sendMessage(message: string): Promise<string> {
    await this.page.fill('[data-testid="chat-input"]', message);
    await this.page.click('[data-testid="send-button"]');
    
    await this.waitForAIResponse();
    
    // Get the latest AI response
    const response = await this.page.locator('[data-testid="ai-response"]').last().textContent();
    return response || '';
  }

  // Verification Helpers
  async verifyElementExists(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  async verifyText(selector: string, expectedText: string): Promise<boolean> {
    const element = await this.page.locator(selector);
    const actualText = await element.textContent();
    return actualText?.includes(expectedText) || false;
  }

  async verifyURL(expectedPath: string): Promise<boolean> {
    const currentURL = this.page.url();
    return currentURL.includes(expectedPath);
  }

  async verifyAPIResponse(endpoint: string, expectedStatus: number = 200): Promise<boolean> {
    try {
      const response = await this.page.request.get(endpoint);
      return response.status() === expectedStatus;
    } catch {
      return false;
    }
  }

  // Performance Helpers
  async measurePageLoad(url: string): Promise<{
    loadTime: number;
    domContentLoaded: number;
    firstContentfulPaint: number;
  }> {
    const startTime = Date.now();
    
    await this.page.goto(url);
    
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.fetchStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0
      };
    });
    
    return performanceMetrics;
  }

  // Screenshot and Recording Helpers
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}.png`,
      fullPage: true
    });
  }

  async recordVideo(action: () => Promise<void>, name: string): Promise<void> {
    const context = await this.browser.newContext({
      recordVideo: { dir: `test-results/videos/${name}/` }
    });
    
    const page = await context.newPage();
    
    try {
      await action();
    } finally {
      await page.close();
      await context.close();
    }
  }

  // Accessibility Helpers
  async checkAccessibility(): Promise<{
    violations: any[];
    passes: any[];
  }> {
    // Inject axe-core
    await this.page.addScriptTag({ path: 'node_modules/axe-core/axe.min.js' });
    
    // Run accessibility tests
    const results = await this.page.evaluate(() => {
      return (window as any).axe.run();
    });
    
    return {
      violations: results.violations,
      passes: results.passes
    };
  }

  // Error Handling
  async captureErrorLogs(): Promise<string[]> {
    const errors: string[] = [];
    
    this.page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(`Console Error: ${msg.text()}`);
      }
    });
    
    return errors;
  }

  // Test Data Cleanup
  async cleanupTestData(orgId: string): Promise<void> {
    // Clean up via API to ensure complete cleanup
    await this.page.request.delete(`/api/organizations/${orgId}`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export class E2ETestRunner {
  private framework: E2ETestFramework;
  private config: E2ETestConfig;

  constructor(config: E2ETestConfig) {
    this.config = config;
    this.framework = new E2ETestFramework(config);
  }

  async runTestSuite(suiteName: string, tests: (() => Promise<void>)[]): Promise<{
    passed: number;
    failed: number;
    errors: string[];
  }> {
    console.log(`\n🧪 Running E2E Test Suite: ${suiteName}`);
    
    const results = {
      passed: 0,
      failed: 0,
      errors: [] as string[]
    };

    await this.framework.initialize();

    for (let i = 0; i < tests.length; i++) {
      const testName = `Test ${i + 1}`;
      console.log(`\n  Running ${testName}...`);

      try {
        await tests[i]();
        console.log(`  ✅ ${testName} passed`);
        results.passed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log(`  ❌ ${testName} failed: ${errorMessage}`);
        results.failed++;
        results.errors.push(`${testName}: ${errorMessage}`);

        // Take screenshot on failure
        await this.framework.takeScreenshot(`${suiteName}-${testName}-failure`);
      }
    }

    await this.framework.cleanup();

    console.log(`\n📊 Test Suite Results:`);
    console.log(`  Passed: ${results.passed}`);
    console.log(`  Failed: ${results.failed}`);
    console.log(`  Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

    return results;
  }
}