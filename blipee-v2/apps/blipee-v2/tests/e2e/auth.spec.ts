import { test, expect } from '@playwright/test'
import {
  fillAndSubmitForm,
  expectErrorMessage,
  expectSuccessMessage,
  generateTestEmail,
  generateTestPassword,
  navigateAndWait,
} from '../fixtures/test-helpers'

/**
 * Authentication Flow Tests
 *
 * Tests for signin, signup, password reset, and OAuth flows
 */

test.describe('Authentication', () => {
  test.describe('Sign In', () => {
    test('should show signin page with form', async ({ page }) => {
      await page.goto('/signin')

      // Check page title
      await expect(page).toHaveTitle(/Sign In|Blipee/)

      // Check form elements exist
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/signin')

      await fillAndSubmitForm(page, {
        email: 'invalid-email',
        password: 'password123',
      })

      // Should see error (either from client validation or server)
      await page.waitForURL(/signin\?error=/, { timeout: 5000 })
      const url = page.url()
      expect(url).toContain('error=')
    })

    test('should show error for incorrect credentials', async ({ page }) => {
      await page.goto('/signin')

      await fillAndSubmitForm(page, {
        email: 'nonexistent@blipee.com',
        password: 'WrongPassword123!',
      })

      // Should redirect with error
      await page.waitForURL(/signin\?error=/, { timeout: 5000 })
      const url = page.url()
      expect(url).toMatch(/error=.*Invalid/i)
    })

    test('should successfully sign in with valid credentials', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL || 'test@blipee.com'
      const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

      await page.goto('/signin')

      await fillAndSubmitForm(page, {
        email,
        password,
      })

      // Should redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 10000 })
      expect(page.url()).toContain('/dashboard')
    })

    test('should redirect to dashboard if already authenticated', async ({ page }) => {
      // This test uses the saved auth state from setup
      await page.goto('/signin')

      // Should auto-redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 5000 })
      expect(page.url()).toContain('/dashboard')
    })
  })

  test.describe('Sign Up', () => {
    test('should show signup page with form', async ({ page }) => {
      await page.goto('/signup')

      // Check page title
      await expect(page).toHaveTitle(/Sign Up|Blipee/)

      // Check form elements exist
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('input[name="password"]')).toBeVisible()
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show error when passwords do not match', async ({ page }) => {
      await page.goto('/signup')

      await fillAndSubmitForm(page, {
        email: generateTestEmail(),
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
      })

      // Should show error about password mismatch
      await page.waitForURL(/signup\?error=/, { timeout: 5000 })
      const url = page.url()
      expect(url).toMatch(/error=.*match/i)
    })

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/signup')

      await fillAndSubmitForm(page, {
        email: generateTestEmail(),
        password: 'weak',
        confirmPassword: 'weak',
      })

      // Should show error about password requirements
      await page.waitForURL(/signup\?error=/, { timeout: 5000 })
      const url = page.url()
      expect(url).toMatch(/error=.*8 characters/i)
    })

    test('should successfully create new account', async ({ page }) => {
      const email = generateTestEmail()
      const password = generateTestPassword()

      await page.goto('/signup')

      await fillAndSubmitForm(page, {
        email,
        password,
        confirmPassword: password,
        name: 'Test User',
      })

      // Should redirect with success message or to email confirmation page
      await page.waitForURL(/signup\?message=|dashboard/, { timeout: 10000 })

      const url = page.url()
      // Either redirected to dashboard or got confirmation message
      expect(url).toMatch(/message=.*email|dashboard/)
    })

    test('should show error when signing up with existing email', async ({ page }) => {
      const email = process.env.TEST_USER_EMAIL || 'test@blipee.com'
      const password = generateTestPassword()

      await page.goto('/signup')

      await fillAndSubmitForm(page, {
        email,
        password,
        confirmPassword: password,
      })

      // Should show error about user already existing
      await page.waitForURL(/signup\?error=/, { timeout: 5000 })
      const url = page.url()
      expect(url).toMatch(/error=.*already|exists/i)
    })
  })

  test.describe('Password Reset', () => {
    test('should show forgot password page', async ({ page }) => {
      await page.goto('/forgot-password')

      await expect(page).toHaveTitle(/Forgot Password|Reset|Blipee/)
      await expect(page.locator('input[name="email"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('should show success message after requesting reset', async ({ page }) => {
      await page.goto('/forgot-password')

      await fillAndSubmitForm(page, {
        email: process.env.TEST_USER_EMAIL || 'test@blipee.com',
      })

      // Should show success message
      await page.waitForURL(/forgot-password\?message=/, { timeout: 5000 })
      const url = page.url()
      expect(url).toMatch(/message=.*email/i)
    })

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/forgot-password')

      await fillAndSubmitForm(page, {
        email: 'not-an-email',
      })

      await page.waitForURL(/forgot-password\?error=/, { timeout: 5000 })
      const url = page.url()
      expect(url).toMatch(/error=.*email/i)
    })
  })

  test.describe('Navigation', () => {
    test('should navigate between auth pages', async ({ page }) => {
      // Start at signin
      await page.goto('/signin')

      // Click link to signup
      await page.click('a[href*="signup"]')
      await page.waitForURL('**/signup**')
      expect(page.url()).toContain('/signup')

      // Click link to signin
      await page.click('a[href*="signin"]')
      await page.waitForURL('**/signin**')
      expect(page.url()).toContain('/signin')

      // Click link to forgot password
      await page.click('a[href*="forgot-password"]')
      await page.waitForURL('**/forgot-password**')
      expect(page.url()).toContain('/forgot-password')
    })
  })

  test.describe('OAuth (Visual Check)', () => {
    test('should show OAuth buttons on signin page', async ({ page }) => {
      await page.goto('/signin')

      // Check if OAuth buttons are visible (don't actually test OAuth flow)
      const hasGoogleButton = await page.locator('button:has-text("Google"), a:has-text("Google")').count()
      const hasGitHubButton = await page.locator('button:has-text("GitHub"), a:has-text("GitHub")').count()

      // At least one OAuth option should be visible
      expect(hasGoogleButton + hasGitHubButton).toBeGreaterThan(0)
    })
  })
})
