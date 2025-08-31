/**
 * Authentication Journey E2E Tests
 * Phase 5, Task 5.1: Complete authentication flow testing
 */

import { test, expect } from '@playwright/test';
import { E2ETestFramework, TestUser } from '../e2e-test-framework';

const config = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  parallel: false,
  headless: process.env.CI === 'true',
  video: true,
  screenshot: 'only-on-failure' as const
};

const testUser: TestUser = {
  email: 'test.user@blipee-test.com',
  password: 'TestPassword123!',
  role: 'sustainability_manager',
  organizationId: 'test-org-123',
  firstName: 'Test',
  lastName: 'User'
};

test.describe('Authentication Journey', () => {
  let framework: E2ETestFramework;

  test.beforeEach(async () => {
    framework = new E2ETestFramework(config);
    await framework.initialize();
  });

  test.afterEach(async () => {
    await framework.cleanup();
  });

  test('User can sign up with valid information', async () => {
    await framework.navigateTo('/signup');

    // Fill signup form
    await framework.page.fill('[data-testid="firstName"]', testUser.firstName);
    await framework.page.fill('[data-testid="lastName"]', testUser.lastName);
    await framework.page.fill('[data-testid="email"]', testUser.email);
    await framework.page.fill('[data-testid="password"]', testUser.password);
    await framework.page.fill('[data-testid="confirmPassword"]', testUser.password);
    
    // Accept terms
    await framework.page.check('[data-testid="acceptTerms"]');
    
    // Submit form
    await framework.page.click('[data-testid="signup-button"]');
    
    // Should redirect to email verification page
    await framework.page.waitForURL('/auth/verify-email');
    
    // Verify success message
    const successMessage = await framework.page.locator('[data-testid="verification-message"]');
    await expect(successMessage).toContainText('verification email has been sent');
  });

  test('User can sign in with valid credentials', async () => {
    await framework.navigateTo('/signin');
    
    // Fill signin form
    await framework.page.fill('[data-testid="email"]', testUser.email);
    await framework.page.fill('[data-testid="password"]', testUser.password);
    
    // Submit form
    await framework.page.click('[data-testid="signin-button"]');
    
    // Should redirect to dashboard
    await framework.page.waitForURL('/dashboard');
    
    // Verify user is signed in
    const userMenu = await framework.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
    
    // Verify user name is displayed
    const userName = await framework.page.locator('[data-testid="user-name"]');
    await expect(userName).toContainText(`${testUser.firstName} ${testUser.lastName}`);
  });

  test('User cannot sign in with invalid credentials', async () => {
    await framework.navigateTo('/signin');
    
    // Fill signin form with wrong password
    await framework.page.fill('[data-testid="email"]', testUser.email);
    await framework.page.fill('[data-testid="password"]', 'WrongPassword123!');
    
    // Submit form
    await framework.page.click('[data-testid="signin-button"]');
    
    // Should show error message
    const errorMessage = await framework.page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toContainText('Invalid credentials');
    
    // Should stay on signin page
    await expect(framework.page).toHaveURL('/signin');
  });

  test('User can reset password', async () => {
    await framework.navigateTo('/signin');
    
    // Click forgot password link
    await framework.page.click('[data-testid="forgot-password-link"]');
    
    // Should redirect to password reset page
    await framework.page.waitForURL('/auth/reset-password');
    
    // Enter email
    await framework.page.fill('[data-testid="reset-email"]', testUser.email);
    
    // Submit form
    await framework.page.click('[data-testid="reset-button"]');
    
    // Should show success message
    const successMessage = await framework.page.locator('[data-testid="reset-success"]');
    await expect(successMessage).toContainText('password reset link has been sent');
  });

  test('User can sign out successfully', async () => {
    // First sign in
    await framework.signIn(testUser);
    
    // Verify we're on dashboard
    await expect(framework.page).toHaveURL('/dashboard');
    
    // Sign out
    await framework.signOut();
    
    // Should redirect to signin page
    await expect(framework.page).toHaveURL('/signin');
    
    // User menu should not be visible
    const userMenu = framework.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).not.toBeVisible();
  });

  test('Protected routes redirect to signin when not authenticated', async () => {
    // Try to access dashboard without signing in
    await framework.navigateTo('/dashboard');
    
    // Should redirect to signin
    await framework.page.waitForURL('/signin');
    
    // Should have redirect parameter
    expect(framework.page.url()).toContain('redirect=%2Fdashboard');
  });

  test('User is redirected to intended page after signin', async () => {
    // Try to access organizations page
    await framework.navigateTo('/organizations');
    
    // Should redirect to signin with redirect parameter
    await framework.page.waitForURL(/\/signin\?.*redirect=/);
    
    // Sign in
    await framework.page.fill('[data-testid="email"]', testUser.email);
    await framework.page.fill('[data-testid="password"]', testUser.password);
    await framework.page.click('[data-testid="signin-button"]');
    
    // Should redirect to originally requested page
    await framework.page.waitForURL('/organizations');
  });

  test('Session persists after page refresh', async () => {
    // Sign in
    await framework.signIn(testUser);
    
    // Refresh page
    await framework.page.reload();
    
    // Should still be authenticated
    const userMenu = await framework.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
    
    // Should still show user name
    const userName = await framework.page.locator('[data-testid="user-name"]');
    await expect(userName).toContainText(`${testUser.firstName} ${testUser.lastName}`);
  });

  test('Session expires after timeout', async () => {
    // Sign in
    await framework.signIn(testUser);
    
    // Mock session expiry by clearing cookies
    await framework.page.context().clearCookies();
    
    // Try to access protected resource
    await framework.page.goto('/api/user/profile');
    
    // Should get 401 response
    const response = await framework.page.waitForResponse('/api/user/profile');
    expect(response.status()).toBe(401);
    
    // Navigate to dashboard should redirect to signin
    await framework.navigateTo('/dashboard');
    await framework.page.waitForURL('/signin');
  });

  test('Multi-factor authentication flow works correctly', async () => {
    // Skip if MFA is not enabled in test environment
    if (!process.env.TEST_MFA_ENABLED) {
      test.skip();
      return;
    }

    // Sign in with MFA-enabled user
    await framework.navigateTo('/signin');
    await framework.page.fill('[data-testid="email"]', 'mfa.user@blipee-test.com');
    await framework.page.fill('[data-testid="password"]', 'TestPassword123!');
    await framework.page.click('[data-testid="signin-button"]');
    
    // Should redirect to MFA verification page
    await framework.page.waitForURL('/auth/mfa');
    
    // Enter MFA code (use test code)
    await framework.page.fill('[data-testid="mfa-code"]', '123456');
    await framework.page.click('[data-testid="verify-mfa-button"]');
    
    // Should redirect to dashboard
    await framework.page.waitForURL('/dashboard');
    
    // Verify user is signed in
    const userMenu = await framework.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
  });

  test('Social authentication works correctly', async () => {
    // Skip if social auth is not configured
    if (!process.env.TEST_SOCIAL_AUTH_ENABLED) {
      test.skip();
      return;
    }

    await framework.navigateTo('/signin');
    
    // Click Google signin button
    await framework.page.click('[data-testid="google-signin"]');
    
    // Should redirect to Google OAuth (mock in test)
    await framework.page.waitForURL(/accounts\.google\.com|localhost.*\/auth\/mock/);
    
    // In test environment, this would be mocked
    if (framework.page.url().includes('localhost')) {
      // Mock OAuth success
      await framework.page.click('[data-testid="mock-oauth-success"]');
    }
    
    // Should redirect back to dashboard
    await framework.page.waitForURL('/dashboard');
    
    // Verify user is signed in
    const userMenu = await framework.page.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
  });
});