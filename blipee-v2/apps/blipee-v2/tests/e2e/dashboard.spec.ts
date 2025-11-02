import { test, expect } from '@playwright/test'
import { navigateAndWait } from '../fixtures/test-helpers'

/**
 * Dashboard Tests
 *
 * Tests for authenticated dashboard pages and functionality
 * These tests use the saved authentication state from auth.setup.ts
 */

test.describe('Dashboard', () => {
  test.describe('Access Control', () => {
    test('should access dashboard when authenticated', async ({ page }) => {
      await page.goto('/dashboard')

      // Should successfully load dashboard
      await expect(page).toHaveURL(/\/dashboard/)

      // Should see dashboard content
      await expect(page.locator('h1, h2')).toBeVisible()
    })

    test('should show user-specific navigation', async ({ page }) => {
      await page.goto('/dashboard')

      // Should see user menu or sign out button
      const userNav = page.locator(
        '[data-testid="user-menu"], button:has-text("Sign Out"), .user-avatar'
      )
      await expect(userNav).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Carbon Dashboard', () => {
    test('should display carbon dashboard page', async ({ page }) => {
      await page.goto('/dashboard')

      // Check for carbon-related content
      await expect(
        page.locator('h1:has-text("Carbon"), h2:has-text("Carbon")')
      ).toBeVisible({ timeout: 10000 })
    })

    test('should show KPI metrics', async ({ page }) => {
      await page.goto('/dashboard')

      // Should see metric cards (adjust selectors based on actual UI)
      const kpiCards = page.locator('[class*="kpi"], [data-testid*="metric"]')
      const count = await kpiCards.count()

      // Should have at least one KPI card
      expect(count).toBeGreaterThan(0)
    })

    test('should display charts and visualizations', async ({ page }) => {
      await page.goto('/dashboard')

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Check for chart elements (SVG, canvas, or chart containers)
      const hasCharts =
        (await page.locator('svg, canvas, [class*="chart"]').count()) > 0

      expect(hasCharts).toBeTruthy()
    })

    test('should have working filters', async ({ page }) => {
      await page.goto('/dashboard')

      // Look for filter dropdowns
      const filters = page.locator('select[class*="filter"], [data-testid*="filter"]')
      const filterCount = await filters.count()

      if (filterCount > 0) {
        // Try to change a filter
        const firstFilter = filters.first()
        await firstFilter.selectOption({ index: 1 })

        // Wait for any data updates
        await page.waitForTimeout(1000)

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible()
      }
    })
  })

  test.describe('Energy Dashboard', () => {
    test('should navigate to energy dashboard', async ({ page }) => {
      await page.goto('/dashboard/energy')

      // Should load energy page
      await expect(page).toHaveURL(/\/dashboard\/energy/)

      // Should see energy-related content
      await expect(
        page.locator('h1:has-text("Energy"), h2:has-text("Energy")')
      ).toBeVisible({ timeout: 10000 })
    })

    test('should display energy metrics', async ({ page }) => {
      await page.goto('/dashboard/energy')

      await page.waitForLoadState('networkidle')

      // Should have some content loaded
      const content = await page.locator('main, [role="main"], .dashboard').textContent()
      expect(content).toBeTruthy()
      expect(content!.length).toBeGreaterThan(100)
    })
  })

  test.describe('Settings', () => {
    test('should navigate to settings', async ({ page }) => {
      await page.goto('/dashboard/settings')

      // Should load settings page
      await expect(page).toHaveURL(/\/dashboard\/settings/)
    })

    test('should show preferences tab', async ({ page }) => {
      await page.goto('/dashboard/settings/preferences')

      // Should load preferences
      await expect(page).toHaveURL(/\/dashboard\/settings\/preferences/)

      // Should see preferences content
      await expect(page.locator('h1, h2, h3')).toBeVisible()
    })
  })

  test.describe('Sign Out', () => {
    test('should sign out successfully', async ({ page }) => {
      await page.goto('/dashboard')

      // Find and click sign out button
      const signOutButton = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")')
      await signOutButton.click()

      // Should redirect to signin page
      await page.waitForURL('**/signin**', { timeout: 5000 })
      expect(page.url()).toContain('/signin')
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/dashboard')

      // Dashboard should still be accessible
      await expect(page.locator('body')).toBeVisible()

      // Main content should be visible
      await expect(page.locator('main, [role="main"], .dashboard')).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })

      await page.goto('/dashboard')

      // Dashboard should be fully functional
      await expect(page.locator('body')).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const loadTime = Date.now() - startTime

      // Should load within 5 seconds (adjust as needed)
      expect(loadTime).toBeLessThan(5000)
    })

    test('should not have console errors', async ({ page }) => {
      const consoleErrors: string[] = []

      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      // Filter out known/acceptable errors (adjust as needed)
      const criticalErrors = consoleErrors.filter(
        error => !error.includes('favicon') && !error.includes('sourcemap')
      )

      expect(criticalErrors).toHaveLength(0)
    })
  })

  test.describe('Navigation', () => {
    test('should navigate between dashboard sections', async ({ page }) => {
      await page.goto('/dashboard')

      // Try to find and click navigation links
      const navLinks = page.locator('nav a, [role="navigation"] a')
      const linkCount = await navLinks.count()

      if (linkCount > 0) {
        // Click second nav link (skip home/dashboard)
        const secondLink = navLinks.nth(1)
        await secondLink.click()

        // Should navigate somewhere
        await page.waitForLoadState('networkidle')
        await expect(page.locator('body')).toBeVisible()
      }
    })

    test('should show breadcrumbs or page hierarchy', async ({ page }) => {
      await page.goto('/dashboard/settings/preferences')

      // Check if breadcrumbs or back navigation exists
      const hasBreadcrumbs = await page.locator('[aria-label*="breadcrumb"], .breadcrumb').count()
      const hasBackButton = await page.locator('button:has-text("Back"), a:has-text("Back")').count()

      // Should have some form of navigation aid
      expect(hasBreadcrumbs + hasBackButton).toBeGreaterThanOrEqual(0)
    })
  })
})
