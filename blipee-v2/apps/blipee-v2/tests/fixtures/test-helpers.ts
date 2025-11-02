import { Page, expect } from '@playwright/test'

/**
 * Test Helper Functions
 *
 * Reusable utilities for common test operations
 */

/**
 * Fill and submit a form
 */
export async function fillAndSubmitForm(
  page: Page,
  formData: Record<string, string>,
  submitButtonSelector = 'button[type="submit"]'
) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`input[name="${name}"]`, value)
  }
  await page.click(submitButtonSelector)
}

/**
 * Wait for and verify error message
 */
export async function expectErrorMessage(page: Page, errorText: string) {
  const errorLocator = page.locator('[role="alert"], .error-message, [data-testid="error"]')
  await expect(errorLocator).toBeVisible({ timeout: 5000 })
  await expect(errorLocator).toContainText(errorText)
}

/**
 * Wait for and verify success message
 */
export async function expectSuccessMessage(page: Page, successText: string) {
  const successLocator = page.locator('[role="status"], .success-message, [data-testid="success"]')
  await expect(successLocator).toBeVisible({ timeout: 5000 })
  await expect(successLocator).toContainText(successText)
}

/**
 * Sign out user
 */
export async function signOut(page: Page) {
  // Adjust selector based on your actual logout button
  await page.click('button:has-text("Sign Out"), a:has-text("Sign Out")')
  await page.waitForURL('**/signin**')
}

/**
 * Navigate and wait for page to be ready
 */
export async function navigateAndWait(page: Page, url: string) {
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    // Check for user-specific elements that only appear when authenticated
    // Adjust this selector based on your UI
    const userMenu = page.locator('[data-testid="user-menu"], .user-avatar, button:has-text("Sign Out")')
    await userMenu.waitFor({ timeout: 3000 })
    return true
  } catch {
    return false
  }
}

/**
 * Generate random test email
 */
export function generateTestEmail(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `test-${timestamp}-${random}@blipee.test`
}

/**
 * Generate random test password
 */
export function generateTestPassword(): string {
  return `Test${Math.random().toString(36).substring(2, 10)}Pass123!`
}

/**
 * Wait for Supabase auth to settle
 * (Useful after login/signup to ensure cookies are set)
 */
export async function waitForAuth(page: Page) {
  await page.waitForTimeout(1000)
  // Wait for any auth-related network requests to complete
  await page.waitForLoadState('networkidle')
}

/**
 * Take screenshot with timestamp
 */
export async function takeDebugScreenshot(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  await page.screenshot({ path: `playwright-screenshots/${name}-${timestamp}.png`, fullPage: true })
}

/**
 * Check for console errors
 */
export function setupConsoleErrorListener(page: Page) {
  const errors: string[] = []

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  return {
    getErrors: () => errors,
    hasErrors: () => errors.length > 0,
  }
}
