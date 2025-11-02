# Blipee V2 - Testing Guide

**Playwright E2E Testing Implementation**

This guide covers end-to-end testing with Playwright for Blipee V2.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

Blipee V2 uses [Playwright](https://playwright.dev/) for end-to-end testing. Playwright provides:

- ✅ Cross-browser testing (Chromium, Firefox, WebKit)
- ✅ Fast, reliable test execution
- ✅ Built-in test fixtures and assertions
- ✅ Automatic waiting and retries
- ✅ Visual debugging with Playwright Inspector
- ✅ HTML test reports
- ✅ Video and screenshot capture on failure

### Test Coverage

Our test suite covers:

1. **Authentication Flows** (`auth.spec.ts`)
   - Sign in / Sign up
   - Password reset
   - OAuth providers
   - Session management

2. **Dashboard** (`dashboard.spec.ts`)
   - Access control
   - Carbon metrics
   - Energy tracking
   - Navigation
   - Responsive design

3. **Public Pages** (`public.spec.ts`)
   - Landing page
   - Marketing pages
   - SEO metadata
   - Accessibility
   - Performance

---

## 🚀 Setup

### 1. Install Dependencies

```bash
cd apps/blipee-v2
npm install
```

This installs `@playwright/test` as a dev dependency.

### 2. Install Playwright Browsers

```bash
npm run test:install
```

This downloads Chromium, Firefox, and WebKit browsers.

### 3. Configure Test Environment

Create or update `.env.local` with test credentials:

```bash
# Test User Credentials
TEST_USER_EMAIL=test@blipee.com
TEST_USER_PASSWORD=TestPassword123!

# Optional: Override base URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3005
```

**Important**: Create a dedicated test user in your Supabase project with these credentials.

### 4. Verify Setup

```bash
npm test
```

This runs all tests in headless mode.

---

## 🏃 Running Tests

### Basic Commands

```bash
# Run all tests (headless)
npm test

# Run with UI mode (recommended for development)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug mode with Playwright Inspector
npm run test:debug

# Run specific test file
npm run test:auth
npm run test:dashboard
npm run test:public

# View last test report
npm run test:report
```

### Advanced Options

```bash
# Run specific test by name
npx playwright test -g "should sign in"

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run in parallel (default)
npx playwright test --workers=4

# Run sequentially
npx playwright test --workers=1

# Update snapshots
npx playwright test --update-snapshots
```

---

## 📁 Test Structure

```
apps/blipee-v2/
├── tests/
│   ├── e2e/                      # End-to-end tests
│   │   ├── auth.setup.ts        # Setup: Authenticate test user
│   │   ├── auth.spec.ts         # Auth flow tests
│   │   ├── dashboard.spec.ts    # Dashboard tests
│   │   └── public.spec.ts       # Public pages tests
│   │
│   └── fixtures/                 # Test helpers
│       └── test-helpers.ts      # Reusable functions
│
├── playwright/
│   └── .auth/                   # Saved auth state
│       └── user.json           # Test user session
│
├── playwright.config.ts         # Playwright configuration
└── playwright-report/           # Test reports (generated)
```

---

## ✍️ Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Navigate
    await page.goto('/some-page')

    // Interact
    await page.click('button')

    // Assert
    await expect(page.locator('h1')).toContainText('Expected Text')
  })
})
```

### Using Test Helpers

```typescript
import { fillAndSubmitForm, expectErrorMessage } from '../fixtures/test-helpers'

test('should validate form', async ({ page }) => {
  await page.goto('/signin')

  await fillAndSubmitForm(page, {
    email: 'invalid',
    password: 'weak',
  })

  await expectErrorMessage(page, 'Invalid email')
})
```

### Testing Authenticated Routes

Tests in `dashboard.spec.ts` automatically use saved authentication state:

```typescript
test('should access protected page', async ({ page }) => {
  // Already authenticated via auth.setup.ts
  await page.goto('/dashboard')

  // User is already signed in
  await expect(page).toHaveURL(/\/dashboard/)
})
```

### Visual Debugging

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/dashboard')

  // Pause test for debugging
  await page.pause()

  // Take screenshot
  await page.screenshot({ path: 'debug.png' })

  // Print page content
  console.log(await page.content())
})
```

---

## 🎨 Best Practices

### 1. Use Data Test IDs

Add `data-testid` attributes to your components:

```tsx
// In your React component
<button data-testid="submit-button">Submit</button>

// In your test
await page.click('[data-testid="submit-button"]')
```

### 2. Wait for Elements Properly

```typescript
// ❌ Bad: Arbitrary timeouts
await page.waitForTimeout(2000)

// ✅ Good: Wait for specific conditions
await page.waitForSelector('[data-testid="dashboard"]')
await page.waitForURL('**/dashboard**')
await page.waitForLoadState('networkidle')
```

### 3. Use Meaningful Assertions

```typescript
// ❌ Bad: Weak assertion
await expect(page.locator('h1')).toBeVisible()

// ✅ Good: Specific assertion
await expect(page.locator('h1')).toHaveText('Carbon Dashboard')
```

### 4. Organize Tests Logically

```typescript
test.describe('Feature', () => {
  test.describe('Sub-feature', () => {
    test('specific behavior', async ({ page }) => {
      // Test implementation
    })
  })
})
```

### 5. Clean Up After Tests

```typescript
test('should create resource', async ({ page }) => {
  // Create resource
  await page.click('[data-testid="create"]')

  // Test it...

  // Clean up (if needed)
  await page.click('[data-testid="delete"]')
})
```

### 6. Use Test Fixtures

Create reusable setup/teardown logic:

```typescript
// tests/fixtures/authenticated-page.ts
import { test as base } from '@playwright/test'

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Sign in
    await page.goto('/signin')
    // ... sign in logic

    // Provide page to test
    await use(page)

    // Teardown: Sign out
    await page.click('[data-testid="signout"]')
  },
})
```

---

## 🔧 CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run tests
        run: npm test
        env:
          TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
          TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### Environment Variables in CI

Add secrets in your CI platform:
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 🐛 Troubleshooting

### Tests Fail on First Run

**Problem**: Auth setup fails or user doesn't exist

**Solution**: Create test user manually in Supabase:
1. Go to Supabase Dashboard → Authentication → Users
2. Create user with test credentials
3. Confirm email if required

### Timeouts

**Problem**: Tests timeout waiting for elements

**Solutions**:
```typescript
// Increase timeout for slow operations
test.setTimeout(60000)

// Or per-action
await page.waitForSelector('element', { timeout: 10000 })
```

### Flaky Tests

**Problem**: Tests pass sometimes, fail other times

**Solutions**:
1. Wait for network to be idle:
   ```typescript
   await page.waitForLoadState('networkidle')
   ```

2. Wait for specific conditions:
   ```typescript
   await expect(page.locator('element')).toBeVisible()
   ```

3. Add retries in config:
   ```typescript
   // playwright.config.ts
   retries: 2
   ```

### Screenshots Not Captured

**Problem**: Test fails but no screenshot

**Solution**: Check config:
```typescript
// playwright.config.ts
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### Auth State Not Working

**Problem**: Tests can't reuse authentication

**Solutions**:
1. Check auth file exists:
   ```bash
   ls playwright/.auth/user.json
   ```

2. Delete and regenerate:
   ```bash
   rm playwright/.auth/user.json
   npm test
   ```

### Browser Not Installed

**Problem**: Error about missing browser

**Solution**:
```bash
npm run test:install
```

---

## 📊 Test Reports

### View HTML Report

```bash
npm run test:report
```

Opens interactive HTML report in browser showing:
- Test results by file
- Screenshots on failure
- Videos of failed tests
- Trace files for debugging

### Trace Viewer

For failed tests, use trace viewer:

```bash
npx playwright show-trace playwright-report/trace.zip
```

Shows detailed timeline of:
- Page interactions
- Network requests
- Console logs
- Screenshots at each step

---

## 🎯 Coverage Goals

Target test coverage:
- ✅ **Auth flows**: 100% (critical path)
- ✅ **Dashboard**: 80%
- ✅ **Public pages**: 70%
- ✅ **API routes**: 80% (via E2E)

---

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [API Reference](https://playwright.dev/docs/api/class-test)

---

## 🆘 Getting Help

1. Check this guide
2. Review [Playwright docs](https://playwright.dev/)
3. Check test examples in `tests/e2e/`
4. Ask in team Slack/Discord

---

**Happy Testing! 🎭**
