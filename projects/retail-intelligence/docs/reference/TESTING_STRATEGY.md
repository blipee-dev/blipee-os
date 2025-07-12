# Testing Strategy: Retail Intelligence Platform Integration

## Overview

This document outlines the comprehensive testing strategy to achieve and maintain 90% test coverage across the entire platform, with mandatory testing phases at the end of each sprint.

## Testing Requirements

### Coverage Goals
- **Overall Platform**: 90% minimum coverage
- **New Code**: 95% minimum coverage
- **Critical Paths**: 100% coverage (auth, payments, data integrity)

### Sprint Testing Protocol
Every sprint MUST end with:
1. **Test Phase** (2-3 days)
2. **Coverage Report**
3. **Code Review**
4. **Commit with test results**
5. **Push to feature branch**
6. **PR with coverage badges**

## Testing Architecture

### 1. Test Types & Coverage Distribution

```yaml
coverage_distribution:
  unit_tests: 70%          # Component and function level
  integration_tests: 15%   # API and service integration
  e2e_tests: 10%          # Critical user journeys
  performance_tests: 5%    # Load and stress testing
```

### 2. Testing Stack

```json
{
  "unit": {
    "framework": "Jest",
    "react": "React Testing Library",
    "coverage": "c8",
    "mocking": "MSW (Mock Service Worker)"
  },
  "integration": {
    "api": "Supertest",
    "database": "pg-mem (in-memory PostgreSQL)",
    "framework": "Jest"
  },
  "e2e": {
    "framework": "Playwright",
    "visual": "Percy",
    "accessibility": "axe-playwright"
  },
  "performance": {
    "load": "k6",
    "monitoring": "Lighthouse CI"
  }
}
```

## Sprint Testing Process

### Sprint Structure (2-week sprints)

```mermaid
gantt
    title Sprint Testing Timeline
    dateFormat  YYYY-MM-DD
    section Sprint 1
    Development     :active, dev1, 2024-01-01, 8d
    Test Writing    :test1, after dev1, 2d
    Test Execution  :exec1, after test1, 1d
    Coverage Report :report1, after exec1, 1d
    Code Review     :review1, after report1, 1d
    Commit & Push   :push1, after review1, 1d
```

### Daily Testing Workflow

```bash
# During development (TDD approach)
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Check coverage locally

# Before committing
npm run test:all          # Run all tests
npm run lint              # Code quality
npm run type-check        # TypeScript validation

# Pre-commit hooks (automatic)
- Run affected tests
- Check coverage threshold
- Lint staged files
```

### End-of-Sprint Testing Checklist

```typescript
interface SprintTestChecklist {
  unitTests: {
    writtenForNewCode: boolean;      // ✓ All new functions have tests
    coverageAbove90: boolean;         // ✓ Coverage meets threshold
    passingInCI: boolean;            // ✓ All tests pass in CI
  };
  
  integrationTests: {
    apiEndpointsTested: boolean;      // ✓ New endpoints have tests
    databaseMigrationsTested: boolean;// ✓ Schema changes tested
    externalAPIsMocked: boolean;      // ✓ External services mocked
  };
  
  e2eTests: {
    criticalPathsCovered: boolean;    // ✓ User journeys tested
    crossBrowserTested: boolean;      // ✓ Chrome, Firefox, Safari
    mobileResponsive: boolean;        // ✓ Mobile viewports tested
  };
  
  documentation: {
    testPlanUpdated: boolean;         // ✓ Test documentation current
    coverageReportGenerated: boolean; // ✓ HTML coverage report
    testResultsLogged: boolean;       // ✓ Results in sprint notes
  };
}
```

## Test Implementation Guidelines

### 1. Unit Testing Standards

```typescript
// src/components/retail/FootTrafficChart.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FootTrafficChart } from './FootTrafficChart';
import { mockFootTrafficData } from '@/test/fixtures';

describe('FootTrafficChart', () => {
  // Component rendering
  it('should render without crashing', () => {
    render(<FootTrafficChart data={mockFootTrafficData} />);
    expect(screen.getByRole('chart')).toBeInTheDocument();
  });

  // Props validation
  it('should handle empty data gracefully', () => {
    render(<FootTrafficChart data={[]} />);
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  // User interactions
  it('should show tooltip on hover', async () => {
    render(<FootTrafficChart data={mockFootTrafficData} />);
    const dataPoint = screen.getByTestId('data-point-0');
    fireEvent.mouseOver(dataPoint);
    expect(await screen.findByRole('tooltip')).toBeInTheDocument();
  });

  // Edge cases
  it('should handle data updates correctly', () => {
    const { rerender } = render(<FootTrafficChart data={mockFootTrafficData} />);
    const newData = [...mockFootTrafficData, { time: '14:00', count: 150 }];
    rerender(<FootTrafficChart data={newData} />);
    expect(screen.getAllByTestId(/data-point/)).toHaveLength(newData.length);
  });
});
```

### 2. Integration Testing Standards

```typescript
// src/app/api/retail/traffic/route.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from './route';
import { createTestDatabase, seedTestData } from '@/test/utils';

describe('POST /api/retail/traffic', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await createTestDatabase();
    await seedTestData(db);
  });

  afterAll(async () => {
    await db.cleanup();
  });

  it('should create traffic entry with valid data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        storeId: 'test-store-123',
        timestamp: '2024-01-01T10:00:00Z',
        countIn: 45,
        countOut: 32
      }
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(201);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.entry).toMatchObject({
      countIn: 45,
      countOut: 32
    });
  });

  it('should validate required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { storeId: 'test-store-123' } // Missing required fields
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(400);
    const data = JSON.parse(res._getData());
    expect(data.error).toContain('Required fields missing');
  });

  it('should enforce authentication', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {} // No auth header
    });

    await POST(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

### 3. E2E Testing Standards

```typescript
// e2e/retail/foot-traffic-dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsStoreManager, setupTestStore } from '../utils';

test.describe('Foot Traffic Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupTestStore();
    await loginAsStoreManager(page);
    await page.goto('/retail/dashboard');
  });

  test('should display real-time foot traffic', async ({ page }) => {
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: 'Foot Traffic' })).toBeVisible();
    
    // Check live counter
    const liveCounter = page.getByTestId('live-visitor-count');
    await expect(liveCounter).toBeVisible();
    await expect(liveCounter).toContainText(/\d+/); // Should show a number
    
    // Verify chart is rendered
    const chart = page.getByTestId('traffic-chart');
    await expect(chart).toBeVisible();
    
    // Check data updates (mock real-time update)
    const initialCount = await liveCounter.textContent();
    await page.waitForTimeout(5000); // Wait for update
    const updatedCount = await liveCounter.textContent();
    expect(initialCount).not.toBe(updatedCount);
  });

  test('should filter traffic by date range', async ({ page }) => {
    // Open date filter
    await page.getByRole('button', { name: 'Filter' }).click();
    
    // Select date range
    await page.getByLabel('Start Date').fill('2024-01-01');
    await page.getByLabel('End Date').fill('2024-01-07');
    await page.getByRole('button', { name: 'Apply' }).click();
    
    // Verify chart updates
    await expect(page.getByText('Jan 1 - Jan 7, 2024')).toBeVisible();
    
    // Check data points
    const dataPoints = page.locator('.chart-data-point');
    expect(await dataPoints.count()).toBeGreaterThan(0);
  });

  test('should export traffic data', async ({ page }) => {
    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export' }).click();
    await page.getByRole('menuitem', { name: 'Export as CSV' }).click();
    
    // Verify download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('foot-traffic');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
```

## Coverage Configuration

### 1. Jest Configuration

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/test/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    // Critical paths require 100% coverage
    './src/lib/auth/**/*': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
    './src/lib/payments/**/*': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  coverageReporters: ['html', 'text', 'lcov', 'json-summary'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
};
```

### 2. CI/CD Test Pipeline

```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy

on:
  push:
    branches: [main, develop, 'feature/*']
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app: [sustainability, retail, auth, shared]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run linting
        run: pnpm turbo run lint --filter=${{ matrix.app }}
        
      - name: Run type checking
        run: pnpm turbo run type-check --filter=${{ matrix.app }}
        
      - name: Run unit tests with coverage
        run: pnpm turbo run test:coverage --filter=${{ matrix.app }}
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./apps/${{ matrix.app }}/coverage/lcov.info
          flags: ${{ matrix.app }}
          
      - name: Check coverage thresholds
        run: |
          coverage=$(cat ./apps/${{ matrix.app }}/coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$coverage < 90" | bc -l) )); then
            echo "Coverage is below 90%: $coverage%"
            exit 1
          fi
          
  integration-tests:
    needs: test
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v3
      
      - name: Run integration tests
        run: pnpm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          
  e2e-tests:
    needs: integration-tests
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm run test:e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          
  coverage-report:
    needs: [test, integration-tests, e2e-tests]
    runs-on: ubuntu-latest
    
    steps:
      - name: Generate combined coverage report
        run: |
          pnpm run coverage:merge
          pnpm run coverage:report
          
      - name: Comment PR with coverage
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          lcov-file: ./coverage/lcov.info
```

## Sprint Testing Workflow

### 1. Sprint Planning
```markdown
## Sprint X Testing Plan
- [ ] Identify testable features
- [ ] Assign test writing tasks
- [ ] Review existing test gaps
- [ ] Set coverage goals for sprint
```

### 2. During Development
```bash
# Developer workflow
git checkout -b feature/retail-dashboard

# Write tests first (TDD)
npm run test:watch -- FootTrafficChart

# Implement feature
# ... code implementation ...

# Verify coverage
npm run test:coverage -- --collectCoverageFrom='src/components/retail/**'

# Commit with tests
git add .
git commit -m "feat: implement foot traffic chart with 95% test coverage"
```

### 3. End of Sprint Testing

```bash
# Sprint test phase checklist
./scripts/sprint-test.sh

# This script will:
# 1. Run all tests
# 2. Generate coverage report
# 3. Run E2E tests
# 4. Create test summary
# 5. Check coverage thresholds
# 6. Generate sprint test report

# Example output:
Sprint 5 Test Report
====================
Total Tests: 487
Passed: 485
Failed: 2
Coverage: 91.3%

Unit Tests: 92.1%
Integration: 89.5%
E2E: 88.2%

New Code Coverage: 95.4%
Critical Path Coverage: 100%

Status: READY FOR COMMIT ✓
```

### 4. Sprint Commit Protocol

```bash
# After successful test phase
git add .
git commit -m "chore: Sprint 5 completion - 91.3% coverage

- Implemented foot traffic dashboard
- Added sales correlation features  
- Created capture rate analytics

Test Results:
- Total: 487 tests (485 passing)
- Coverage: 91.3% (target: 90%)
- New code: 95.4% coverage

Jira: BLIP-123, BLIP-124, BLIP-125"

# Push to feature branch
git push origin feature/sprint-5-retail-dashboard

# Create PR with test results
gh pr create --title "Sprint 5: Retail Dashboard (91.3% coverage)" \
  --body "$(cat sprint-5-test-report.md)"
```

## Test Data Management

### 1. Test Fixtures

```typescript
// test/fixtures/retail.ts
export const testStores = [
  {
    id: 'store-001',
    name: 'Downtown Flagship',
    mallId: 'mall-001',
    monthlyTrafficAvg: 45000,
    captureRate: 0.34,
  },
  // ... more test data
];

export const testFootTraffic = generateTimeSeriesData({
  days: 30,
  minValue: 100,
  maxValue: 1000,
  peakHours: [12, 13, 18, 19],
});
```

### 2. Database Seeding

```typescript
// test/seed/retail-seed.ts
export async function seedRetailTestData(db: Database) {
  // Clear existing data
  await db.query('TRUNCATE retail.stores CASCADE');
  
  // Insert test stores
  await db.stores.insertMany(testStores);
  
  // Insert foot traffic data
  await db.footTraffic.insertMany(testFootTraffic);
  
  // Insert sales data
  await db.sales.insertMany(testSalesData);
}
```

## Monitoring & Reporting

### 1. Coverage Dashboard

```typescript
// scripts/coverage-dashboard.ts
interface CoverageMetrics {
  timestamp: Date;
  sprint: number;
  overall: number;
  byModule: {
    sustainability: number;
    retail: number;
    shared: number;
    auth: number;
  };
  byType: {
    unit: number;
    integration: number;
    e2e: number;
  };
}

// Generate dashboard HTML
generateCoverageDashboard(metrics);
```

### 2. Test Performance Tracking

```yaml
# Track test execution time
test_performance:
  unit_tests:
    target: "< 2 minutes"
    current: "1m 45s"
  integration_tests:
    target: "< 5 minutes"
    current: "4m 12s"
  e2e_tests:
    target: "< 10 minutes"
    current: "8m 30s"
```

## Best Practices

### 1. Test Writing Guidelines
- Write tests before implementation (TDD)
- Test behavior, not implementation
- Use descriptive test names
- Group related tests with `describe`
- Mock external dependencies
- Test edge cases and error paths

### 2. Coverage Guidelines
- Don't chase 100% coverage blindly
- Focus on critical business logic
- Test error handling paths
- Cover edge cases
- Ensure integration points are tested

### 3. Sprint Testing Discipline
- No sprint closes without meeting coverage targets
- Failed tests block sprint completion
- Document test failures and fixes
- Review test quality in code reviews
- Celebrate coverage achievements

## Tools & Resources

### Testing Tools
- **Jest Dashboard**: `npm run test:ui`
- **Coverage Report**: `npm run coverage:open`
- **E2E Test UI**: `npm run test:e2e:ui`
- **Performance Tests**: `npm run test:perf`

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Coverage Best Practices](./coverage-best-practices.md)

## Enforcement & Compliance

### 1. Automated Enforcement
- Pre-commit hooks prevent commits with failing tests
- CI/CD blocks deployment if coverage drops below 90%
- PR checks require all tests passing
- Coverage reports automatically posted to PRs

### 2. Sprint Review Checklist
- [ ] All sprint features have tests
- [ ] Coverage meets or exceeds 90%
- [ ] E2E tests cover new user journeys
- [ ] Performance benchmarks maintained
- [ ] Test documentation updated
- [ ] Sprint test report generated and archived

This comprehensive testing strategy ensures quality and reliability while maintaining development velocity. Every sprint delivers tested, production-ready code with confidence.