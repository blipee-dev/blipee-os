# Testing Documentation

## Overview

blipee OS employs a comprehensive testing strategy to ensure code quality, reliability, and security. Our testing approach includes unit tests, integration tests, end-to-end tests, performance tests, and security scans.

## Testing Stack

- **Unit Testing**: Jest + React Testing Library
- **E2E Testing**: Cypress
- **API Testing**: Cypress + Jest
- **Accessibility Testing**: jest-axe + cypress-axe
- **Security Testing**: Custom security scanner + npm audit
- **Performance Testing**: Cypress + k6
- **Code Coverage**: Jest coverage + Cypress coverage

## Test Structure

```
├── src/
│   ├── components/__tests__/     # Component unit tests
│   ├── lib/
│   │   ├── auth/__tests__/       # Auth service tests
│   │   ├── ai/__tests__/         # AI service tests
│   │   ├── cache/__tests__/      # Cache service tests
│   │   └── db/__tests__/         # Database tests
├── cypress/
│   ├── e2e/                      # End-to-end tests
│   ├── fixtures/                 # Test data files
│   └── support/                  # Custom commands and utilities
├── tests/
│   ├── benchmarks/               # Performance benchmarks
│   └── load/                     # Load testing scripts
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test auth.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate password"
```

### E2E Tests

```bash
# Run Cypress in interactive mode
npx cypress open

# Run all E2E tests headlessly
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/auth.cy.ts"

# Run tests in specific browser
npx cypress run --browser chrome
```

### Security Tests

```bash
# Run security scan
npm run test:security

# Run dependency audit
npm audit

# Run full security scan with custom scanner
npx tsx scripts/security-scan.ts
```

### Performance Tests

```bash
# Run k6 load tests
./scripts/load-test.sh

# Run performance benchmarks
npm test tests/benchmarks/performance.test.ts
```

## Test Coverage

We maintain a minimum of 80% code coverage across:
- Statements
- Branches
- Functions
- Lines

Current coverage thresholds are enforced in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

View coverage reports:
```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
open coverage/lcov-report/index.html
```

## Writing Tests

### Unit Test Example

```typescript
// src/lib/auth/__tests__/auth.test.ts
import { describe, it, expect } from '@jest/globals';
import { hashPassword, verifyPassword } from '../utils';

describe('Password Utilities', () => {
  it('should hash and verify passwords correctly', async () => {
    const password = 'SecurePassword123!';
    const hashedPassword = await hashPassword(password);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);

    const isValid = await verifyPassword(password, hashedPassword);
    expect(isValid).toBe(true);
  });
});
```

### Component Test Example

```typescript
// src/components/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button Component', () => {
  it('should call onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example

```typescript
// cypress/e2e/user-journey.cy.ts
describe('User Journey', () => {
  it('should complete onboarding flow', () => {
    cy.visit('/signup');
    cy.get('input[name="email"]').type('new@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/onboarding');
    cy.contains('Welcome').should('be.visible');
  });
});
```

## Test Patterns and Best Practices

### 1. AAA Pattern (Arrange, Act, Assert)

```typescript
it('should calculate emissions correctly', () => {
  // Arrange
  const data = { fuel: 100, type: 'diesel' };
  
  // Act
  const emissions = calculateEmissions(data);
  
  // Assert
  expect(emissions).toBe(264.2);
});
```

### 2. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
beforeEach(() => {
  // Reset state before each test
  jest.clearAllMocks();
  cleanup();
});

afterEach(() => {
  // Clean up after each test
  server.close();
});
```

### 3. Descriptive Test Names

```typescript
// Good
it('should return 401 when authentication token is invalid')

// Bad
it('test auth')
```

### 4. Mock External Dependencies

```typescript
jest.mock('@/lib/ai/providers/openai', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    generateResponse: jest.fn().mockResolvedValue({
      content: 'Mocked response'
    })
  }))
}));
```

### 5. Test Edge Cases

```typescript
describe('Rate Limiter', () => {
  it('should handle zero limit', () => {
    expect(() => rateLimiter.check('user', 0)).toThrow();
  });
  
  it('should handle negative limit', () => {
    expect(() => rateLimiter.check('user', -1)).toThrow();
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Nightly scheduled runs

GitHub Actions workflow (`.github/workflows/test.yml`):

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:security
      - run: npx cypress run
```

## Debugging Tests

### Jest Debugging

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run single test with console output
npm test -- --verbose auth.test.ts
```

### Cypress Debugging

```javascript
// Add debugger statement
it('should login', () => {
  cy.visit('/login');
  debugger; // Execution will pause here
  cy.get('input[name="email"]').type('test@example.com');
});

// Use cy.pause()
cy.get('button').click();
cy.pause(); // Pause execution in Cypress
```

## Accessibility Testing

All components and pages are tested for accessibility:

```typescript
// In Jest tests
import { axe } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// In Cypress tests
it('should be accessible', () => {
  cy.visit('/page');
  cy.checkA11y();
});
```

## Performance Testing

### Load Testing with k6

```javascript
// tests/load/k6-config.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function() {
  let response = http.get('https://api.blipee.com/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

### Performance Benchmarks

```typescript
// tests/benchmarks/cache.bench.ts
describe('Cache Performance', () => {
  it('should handle 10000 operations per second', async () => {
    const operations = 10000;
    const start = Date.now();
    
    for (let i = 0; i < operations; i++) {
      await cache.set(`key${i}`, `value${i}`);
    }
    
    const duration = Date.now() - start;
    const opsPerSecond = (operations / duration) * 1000;
    
    expect(opsPerSecond).toBeGreaterThan(10000);
  });
});
```

## Security Testing

### Automated Security Scans

Our security scanner checks for:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Exposed secrets
- Insecure dependencies
- Missing security headers
- Authentication flaws
- API security issues

Run security scan:
```bash
npx tsx scripts/security-scan.ts
```

### Manual Security Testing

1. **Authentication Testing**
   - Test password policies
   - Verify session management
   - Check MFA implementation
   - Test OAuth flows

2. **Authorization Testing**
   - Verify role-based access
   - Test data isolation
   - Check API permissions
   - Validate RLS policies

3. **Input Validation**
   - Test SQL injection points
   - Check XSS vulnerabilities
   - Validate file upload restrictions
   - Test API input validation

## Test Data Management

### Fixtures

```typescript
// cypress/fixtures/user.json
{
  "testUser": {
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User"
  }
}

// Usage in tests
cy.fixture('user').then((data) => {
  cy.get('input[name="email"]').type(data.testUser.email);
});
```

### Test Database

For integration tests, use a separate test database:

```bash
# .env.test
DATABASE_URL=postgresql://localhost/blipee_test
```

### Seed Data

```typescript
// tests/utils/seed.ts
export async function seedTestData() {
  await db.organization.create({
    data: {
      name: 'Test Organization',
      users: {
        create: {
          email: 'test@example.com',
          role: 'admin'
        }
      }
    }
  });
}
```

## Troubleshooting

### Common Issues

1. **Tests timing out**
   ```javascript
   // Increase timeout for specific test
   it('should handle large file', async () => {
     // test code
   }, 10000); // 10 second timeout
   ```

2. **Flaky tests**
   ```javascript
   // Add explicit waits
   cy.get('[data-testid="element"]').should('be.visible');
   cy.wait('@apiCall'); // Wait for intercepted call
   ```

3. **Module resolution errors**
   ```javascript
   // Ensure jest config has proper module mapping
   moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/src/$1',
   }
   ```

## Reporting

### Test Reports

- **Coverage Reports**: `coverage/lcov-report/index.html`
- **Jest Reports**: Console output or custom reporters
- **Cypress Reports**: Screenshots and videos in `cypress/screenshots` and `cypress/videos`
- **Security Reports**: `security-scan-report.json`

### CI/CD Integration

Test results are automatically reported in:
- Pull request comments
- GitHub Actions summary
- Slack notifications (if configured)

## Best Practices Summary

1. **Write tests first** (TDD) when possible
2. **Keep tests simple** and focused
3. **Use descriptive names** for tests
4. **Mock external dependencies**
5. **Test edge cases** and error scenarios
6. **Maintain high coverage** (>80%)
7. **Run tests locally** before pushing
8. **Fix flaky tests** immediately
9. **Review test code** like production code
10. **Update tests** when changing features