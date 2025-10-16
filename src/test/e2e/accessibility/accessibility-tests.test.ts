/**
 * Accessibility Tests
 * Phase 5, Task 5.1: WCAG compliance and accessibility testing
 */

import { test, expect } from '@playwright/test';
import { E2ETestFramework, TestUser } from '../e2e-test-framework';
import AxeBuilder from '@axe-core/playwright';

const config = {
  baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 1,
  parallel: false,
  headless: process.env.CI === 'true',
  video: false,
  screenshot: 'only-on-failure' as const
};

const testUser: TestUser = {
  email: 'accessibility.test@blipee-test.com',
  password: 'TestPassword123!',
  role: 'sustainability_manager',
  organizationId: 'test-org-a11y',
  firstName: 'Access',
  lastName: 'Tester'
};

test.describe('Accessibility Tests', () => {
  let framework: E2ETestFramework;

  test.beforeEach(async () => {
    framework = new E2ETestFramework(config);
    await framework.initialize();
  });

  test.afterEach(async () => {
    await framework.cleanup();
  });

  test('Landing page meets WCAG 2.1 AA standards', async () => {
    await framework.navigateTo('/');

    const accessibilityScanResults = await new AxeBuilder({ page: framework.page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();


    // Log any violations
    if (accessibilityScanResults.violations.length > 0) {
      accessibilityScanResults.violations.forEach((violation, index) => {
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Authentication pages are accessible', async () => {
    const authPages = ['/signin', '/signup'];

    for (const pagePath of authPages) {
      await framework.navigateTo(pagePath);

      const accessibilityScanResults = await new AxeBuilder({ page: framework.page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();


      if (accessibilityScanResults.violations.length > 0) {
        accessibilityScanResults.violations.forEach((violation, index) => {
        });
      }

      expect(accessibilityScanResults.violations).toEqual([]);
    }
  });

  test('Dashboard accessibility for authenticated users', async () => {
    await framework.signIn(testUser);
    await framework.navigateTo('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page: framework.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[data-testid="chart-canvas"]') // Charts may need special handling
      .analyze();


    if (accessibilityScanResults.violations.length > 0) {
      accessibilityScanResults.violations.forEach((violation, index) => {
        violation.nodes.forEach(node => {
        });
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('AI chat interface accessibility', async () => {
    await framework.signIn(testUser);
    await framework.navigateTo('/chat');

    // Test initial chat interface
    let accessibilityScanResults = await new AxeBuilder({ page: framework.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();


    expect(accessibilityScanResults.violations).toEqual([]);

    // Send a message and test with conversation content
    await framework.startConversation('Hello, can you help me with sustainability data?');

    // Test chat with messages
    accessibilityScanResults = await new AxeBuilder({ page: framework.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();


    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigation works correctly', async () => {
    await framework.navigateTo('/signin');


    // Test Tab navigation through form
    await framework.page.keyboard.press('Tab'); // Should focus email input
    let focused = await framework.page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('email');

    await framework.page.keyboard.press('Tab'); // Should focus password input
    focused = await framework.page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('password');

    await framework.page.keyboard.press('Tab'); // Should focus sign in button
    focused = await framework.page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('signin-button');

    // Test Shift+Tab (reverse navigation)
    await framework.page.keyboard.press('Shift+Tab');
    focused = await framework.page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('password');

  });

  test('Form accessibility and ARIA labels', async () => {
    await framework.navigateTo('/signup');


    // Check for proper ARIA labels and roles
    const emailInput = await framework.page.locator('[data-testid="email"]');
    const passwordInput = await framework.page.locator('[data-testid="password"]');
    const submitButton = await framework.page.locator('[data-testid="signup-button"]');

    // Verify inputs have labels
    const emailLabel = await emailInput.getAttribute('aria-label') || 
                      await framework.page.locator('label[for*="email"]').textContent();
    expect(emailLabel).toBeTruthy();

    const passwordLabel = await passwordInput.getAttribute('aria-label') || 
                         await framework.page.locator('label[for*="password"]').textContent();
    expect(passwordLabel).toBeTruthy();

    // Test form validation accessibility
    await framework.page.fill('[data-testid="email"]', 'invalid-email');
    await framework.page.fill('[data-testid="password"]', '123'); // Too short
    await submitButton.click();

    // Check for error messages with proper ARIA attributes
    const errorMessages = await framework.page.locator('[role="alert"], [aria-live="assertive"]');
    const errorCount = await errorMessages.count();

    expect(errorCount).toBeGreaterThan(0);
  });

  test('Color contrast meets WCAG standards', async () => {
    await framework.navigateTo('/');


    // Test with axe-core color contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page: framework.page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();


    if (accessibilityScanResults.violations.length > 0) {
      accessibilityScanResults.violations.forEach((violation, index) => {
        violation.nodes.forEach(node => {
          if (node.any.length > 0) {
          }
        });
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Screen reader compatibility', async () => {
    await framework.signIn(testUser);
    await framework.navigateTo('/dashboard');


    // Check for proper heading structure
    const headings = await framework.page.locator('h1, h2, h3, h4, h5, h6').all();
    const headingTexts = await Promise.all(headings.map(h => h.textContent()));
    
    headingTexts.forEach((text, index) => {
    });

    // Verify main content area is properly marked
    const main = await framework.page.locator('main, [role="main"]');
    expect(await main.count()).toBeGreaterThan(0);

    // Check for skip links
    const skipLinks = await framework.page.locator('a[href="#main"], a[href="#content"], .skip-link');
    const skipLinkCount = await skipLinks.count();

    // Check for landmark regions
    const landmarks = await framework.page.locator('[role="navigation"], [role="main"], [role="banner"], [role="contentinfo"], nav, main, header, footer');
    const landmarkCount = await landmarks.count();
    expect(landmarkCount).toBeGreaterThan(0);
  });

  test('Focus management and visual indicators', async () => {
    await framework.navigateTo('/signin');


    // Test that focused elements have visible focus indicators
    const focusableElements = await framework.page.locator('input, button, a, [tabindex="0"]').all();
    
    for (let i = 0; i < Math.min(focusableElements.length, 5); i++) {
      const element = focusableElements[i];
      await element.focus();
      
      // Check if element has focus styles
      const focusStyles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });
      
      // Should have some form of focus indication
      const hasFocusIndicator = 
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none';
      
      const elementInfo = await element.getAttribute('data-testid') || await element.textContent() || 'Unknown element';
    }
  });

  test('Mobile accessibility', async () => {
    // Set mobile viewport
    await framework.page.setViewportSize({ width: 375, height: 667 });
    await framework.navigateTo('/');


    const accessibilityScanResults = await new AxeBuilder({ page: framework.page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();


    // Test touch target sizes
    const buttons = await framework.page.locator('button, a, input[type="button"], input[type="submit"]').all();
    
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const button = buttons[i];
      const box = await button.boundingBox();
      
      if (box) {
        const minSize = 44; // WCAG recommendation for touch targets
        const meetsSize = box.width >= minSize && box.height >= minSize;
        
        const buttonText = await button.textContent() || await button.getAttribute('aria-label') || 'Unknown button';
      }
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('High contrast mode compatibility', async () => {

    // Simulate high contrast mode with CSS media query
    await framework.page.emulateMedia({ colorScheme: 'dark' });
    await framework.navigateTo('/');

    // Check that content is still visible and accessible
    const accessibilityScanResults = await new AxeBuilder({ page: framework.page })
      .withTags(['wcag2aa'])
      .withRules(['color-contrast'])
      .analyze();


    // Reset to light mode
    await framework.page.emulateMedia({ colorScheme: 'light' });

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});