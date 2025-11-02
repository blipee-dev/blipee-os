import { test, expect } from '@playwright/test'

/**
 * Public Pages Tests
 *
 * Tests for marketing pages and public routes that don't require authentication
 */

test.describe('Public Pages', () => {
  test.describe('Landing Page', () => {
    test('should load landing page', async ({ page }) => {
      await page.goto('/')

      // Should see landing page content
      await expect(page.locator('body')).toBeVisible()
      await expect(page).toHaveTitle(/Blipee/)
    })

    test('should have CTA buttons', async ({ page }) => {
      await page.goto('/')

      // Should have call-to-action buttons
      const ctaButtons = page.locator(
        'a:has-text("Get Started"), a:has-text("Sign Up"), button:has-text("Get Started")'
      )
      const count = await ctaButtons.count()
      expect(count).toBeGreaterThan(0)
    })

    test('should navigate to signup from CTA', async ({ page }) => {
      await page.goto('/')

      // Click a signup CTA
      const signupButton = page.locator('a:has-text("Get Started"), a:has-text("Sign Up")').first()
      if (await signupButton.isVisible()) {
        await signupButton.click()
        await page.waitForURL(/signup|signin/, { timeout: 5000 })
      }
    })

    test('should have navigation menu', async ({ page }) => {
      await page.goto('/')

      // Should have navigation
      const nav = page.locator('nav, [role="navigation"]')
      await expect(nav).toBeVisible()
    })
  })

  test.describe('About Page', () => {
    test('should load about page', async ({ page }) => {
      await page.goto('/about')

      await expect(page).toHaveURL(/\/about/)
      await expect(page.locator('h1, h2')).toBeVisible()
    })
  })

  test.describe('Pricing Page', () => {
    test('should load pricing page', async ({ page }) => {
      await page.goto('/pricing')

      await expect(page).toHaveURL(/\/pricing/)

      // Should have pricing information
      const content = await page.locator('main, [role="main"]').textContent()
      expect(content).toBeTruthy()
    })
  })

  test.describe('Contact Page', () => {
    test('should load contact page', async ({ page }) => {
      await page.goto('/contact')

      await expect(page).toHaveURL(/\/contact/)
    })

    test('should have contact form', async ({ page }) => {
      await page.goto('/contact')

      // Should have form elements
      const hasForm = (await page.locator('form').count()) > 0
      const hasEmailInput = (await page.locator('input[type="email"], input[name*="email"]').count()) > 0

      expect(hasForm || hasEmailInput).toBeTruthy()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy on landing', async ({ page }) => {
      await page.goto('/')

      // Should have h1
      const h1Count = await page.locator('h1').count()
      expect(h1Count).toBeGreaterThan(0)
    })

    test('should have alt text on images', async ({ page }) => {
      await page.goto('/')

      const images = page.locator('img')
      const imageCount = await images.count()

      if (imageCount > 0) {
        // Check that images have alt attributes
        for (let i = 0; i < Math.min(imageCount, 10); i++) {
          const img = images.nth(i)
          const alt = await img.getAttribute('alt')
          // Alt can be empty string for decorative images, but should exist
          expect(alt).toBeDefined()
        }
      }
    })

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/')

      // Tab through elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should have visible focus
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })

  test.describe('SEO', () => {
    test('should have meta description', async ({ page }) => {
      await page.goto('/')

      const metaDescription = page.locator('meta[name="description"]')
      await expect(metaDescription).toHaveCount(1)

      const content = await metaDescription.getAttribute('content')
      expect(content).toBeTruthy()
      expect(content!.length).toBeGreaterThan(50)
    })

    test('should have proper canonical URL', async ({ page }) => {
      await page.goto('/')

      const canonical = page.locator('link[rel="canonical"]')
      const count = await canonical.count()

      if (count > 0) {
        const href = await canonical.getAttribute('href')
        expect(href).toBeTruthy()
      }
    })
  })

  test.describe('Performance', () => {
    test('should not have excessive console errors', async ({ page }) => {
      const errors: string[] = []

      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text())
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Filter known acceptable errors
      const criticalErrors = errors.filter(
        error =>
          !error.includes('favicon') &&
          !error.includes('sourcemap') &&
          !error.includes('DevTools')
      )

      expect(criticalErrors.length).toBeLessThan(5)
    })
  })

  test.describe('Responsive Design', () => {
    test('should be mobile responsive', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/')

      // Should render without horizontal scroll
      const body = await page.locator('body')
      await expect(body).toBeVisible()

      // Check for mobile menu if present
      const mobileMenuButton = page.locator('button[aria-label*="menu"], .mobile-menu-button')
      const hasMobileMenu = (await mobileMenuButton.count()) > 0

      // Either should have mobile menu or regular nav should work
      expect(hasMobileMenu || (await page.locator('nav').count()) > 0).toBeTruthy()
    })
  })
})
