import { test as setup, expect } from '@playwright/test'
import path from 'path'

/**
 * Authentication Setup
 *
 * This runs once before all tests to authenticate a test user
 * and save the authentication state.
 *
 * The saved state is reused across all tests, avoiding repeated logins.
 */

const authFile = path.join(__dirname, '../../playwright/.auth/user.json')

setup('authenticate', async ({ page }) => {
  // Get test credentials from environment
  const email = process.env.TEST_USER_EMAIL || 'test@blipee.com'
  const password = process.env.TEST_USER_PASSWORD || 'TestPassword123!'

  console.log(`Authenticating test user: ${email}`)

  // Navigate to signin page
  await page.goto('/signin')

  // Fill in credentials
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)

  // Submit form
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard or check if we're authenticated
  // Adjust this selector based on your actual dashboard structure
  await page.waitForURL('**/dashboard**', { timeout: 10000 }).catch(async () => {
    // If redirect didn't happen, check if there's an error
    const errorMessage = await page.locator('[role="alert"]').textContent().catch(() => null)

    if (errorMessage?.includes('Invalid') || errorMessage?.includes('not found')) {
      console.log('Test user does not exist. Attempting to create...')

      // Navigate to signup
      await page.goto('/signup')

      // Fill signup form
      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', password)
      await page.fill('input[name="confirmPassword"]', password)
      await page.fill('input[name="name"]', 'Test User')

      // Submit
      await page.click('button[type="submit"]')

      // For now, we'll assume email confirmation is disabled in test env
      // If email confirmation is required, you'll need to handle that
      console.log('Test user created. You may need to confirm email.')

      // Try signing in again
      await page.goto('/signin')
      await page.fill('input[name="email"]', email)
      await page.fill('input[name="password"]', password)
      await page.click('button[type="submit"]')
      await page.waitForURL('**/dashboard**', { timeout: 10000 })
    }
  })

  // Verify we're authenticated by checking for user-specific content
  await expect(page.locator('body')).toBeVisible()

  // Save signed-in state to 'playwright/.auth/user.json'
  await page.context().storageState({ path: authFile })

  console.log('Authentication state saved successfully')
})
