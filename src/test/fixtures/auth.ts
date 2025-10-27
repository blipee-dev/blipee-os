/**
 * Authentication Test Fixtures
 *
 * Provides authenticated page fixtures for testing protected routes
 */

import { test as base, Page } from '@playwright/test';

// Test user credentials (matches global-setup.ts)
export const TEST_USERS = {
  aiUser: {
    email: 'ai.user@blipee-test.com',
    password: 'TestPassword123!',
  },
  sustainabilityManager: {
    email: 'sustainability.manager@blipee-test.com',
    password: 'TestPassword123!',
  },
  analyst: {
    email: 'analyst@blipee-test.com',
    password: 'TestPassword123!',
  },
};

/**
 * Authenticate a user via the signin page
 */
export async function authenticate(page: Page, credentials = TEST_USERS.aiUser) {
  const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';

  // Go to signin page
  await page.goto(`${baseURL}/signin`);

  // Fill in credentials
  await page.fill('input[type="email"], input[name="email"]', credentials.email);
  await page.fill('input[type="password"], input[name="password"]', credentials.password);

  // Submit form
  await page.click('button[type="submit"], button:has-text("Sign in")');

  // Wait for navigation to complete
  await page.waitForURL(/.*(?!signin).*/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

/**
 * Extended test with authenticated page
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    // Authenticate before each test
    await authenticate(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
