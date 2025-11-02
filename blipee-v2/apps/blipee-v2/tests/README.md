# Blipee V2 Tests

End-to-end tests using Playwright for Blipee V2.

## Quick Start

```bash
# Install browsers
npm run test:install

# Run all tests
npm test

# Run with UI (recommended)
npm run test:ui

# Run specific test suite
npm run test:auth
npm run test:dashboard
npm run test:public
```

## Test Files

- **`e2e/auth.setup.ts`** - Authentication setup (runs first)
- **`e2e/auth.spec.ts`** - Sign in, sign up, password reset
- **`e2e/dashboard.spec.ts`** - Protected dashboard pages
- **`e2e/public.spec.ts`** - Landing and marketing pages

## Test Helpers

- **`fixtures/test-helpers.ts`** - Reusable test utilities

## Configuration

- **`playwright.config.ts`** - Main configuration
- Test credentials: Set in `.env.local`
  ```
  TEST_USER_EMAIL=test@blipee.com
  TEST_USER_PASSWORD=TestPassword123!
  ```

## Documentation

See [`docs/TESTING_GUIDE.md`](../docs/TESTING_GUIDE.md) for comprehensive guide.

## Coverage

Current test coverage:
- ✅ Authentication flows
- ✅ Dashboard access control
- ✅ Public pages
- ✅ Responsive design
- ✅ Accessibility basics
- ✅ Performance checks

## Adding New Tests

1. Create test file in `tests/e2e/`
2. Use existing helpers from `fixtures/`
3. Follow naming: `feature.spec.ts`
4. Run with: `npx playwright test path/to/test.spec.ts`

## Debugging

```bash
# Debug mode with Inspector
npm run test:debug

# Run in headed mode
npm run test:headed

# View report
npm run test:report
```

## CI Integration

Tests run automatically on:
- Pull requests
- Main branch pushes
- Pre-deployment

See `.github/workflows/test.yml` for CI configuration.
