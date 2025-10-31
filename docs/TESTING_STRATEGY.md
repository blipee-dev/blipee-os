# Testing Strategy & Infrastructure

**FASE 3 - Week 3: Testing & Quality Assurance**

This document outlines the comprehensive testing strategy for Blipee OS, covering unit tests, integration tests, E2E tests, and quality assurance practices.

---

## Testing Pyramid

```
        /\
       /E2E\          <- 10% (Critical user flows)
      /______\
     /        \
    /Integration\     <- 30% (API & service integration)
   /____________\
  /              \
 /   Unit Tests   \   <- 60% (Core business logic)
/__________________\
```

---

## 1. Unit Testing

### Setup

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
```

### Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### Test Setup File

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### Unit Test Examples

#### Testing Utility Functions

```typescript
// src/lib/performance/__tests__/query-optimizer.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { QueryOptimizer } from '../query-optimizer';

describe('QueryOptimizer', () => {
  let optimizer: QueryOptimizer;

  beforeEach(() => {
    optimizer = new QueryOptimizer();
  });

  it('should cache query results', async () => {
    const queryFn = vi.fn(() => Promise.resolve({ data: 'test' }));

    // First call - cache miss
    const result1 = await optimizer.executeWithCache(
      { key: 'test-key', ttl: 5000 },
      queryFn
    );

    // Second call - cache hit
    const result2 = await optimizer.executeWithCache(
      { key: 'test-key', ttl: 5000 },
      queryFn
    );

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(result1).toEqual(result2);
  });

  it('should expire cached data after TTL', async () => {
    const queryFn = vi.fn(() => Promise.resolve({ data: 'test' }));

    await optimizer.executeWithCache(
      { key: 'test-key', ttl: 100 },
      queryFn
    );

    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 150));

    await optimizer.executeWithCache(
      { key: 'test-key', ttl: 100 },
      queryFn
    );

    expect(queryFn).toHaveBeenCalledTimes(2);
  });

  it('should track cache statistics', async () => {
    const queryFn = () => Promise.resolve({ data: 'test' });

    // Cache miss
    await optimizer.executeWithCache({ key: 'key1', ttl: 5000 }, queryFn);
    // Cache hit
    await optimizer.executeWithCache({ key: 'key1', ttl: 5000 }, queryFn);

    const stats = optimizer.getCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });
});
```

#### Testing React Components

```typescript
// src/components/integrations/__tests__/UnifiedDashboard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { UnifiedDashboard } from '../UnifiedDashboard';

// Mock fetch
global.fetch = vi.fn();

describe('UnifiedDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    render(<UnifiedDashboard />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should fetch and display metrics', async () => {
    const mockData = {
      agents: { totalExecutions: 100, successRate: 95 },
      mlModels: { totalPredictions: 50 },
      conversations: { totalConversations: 200 },
      insights: { systemEfficiency: 85 },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<UnifiedDashboard daysBack={30} />);

    await waitFor(() => {
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('85% Efficient')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<UnifiedDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });
});
```

#### Testing Services

```typescript
// src/lib/integrations/__tests__/unified-analytics-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnifiedAnalyticsService } from '../unified-analytics-service';

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
        })),
      })),
    })),
  }),
}));

describe('UnifiedAnalyticsService', () => {
  let service: UnifiedAnalyticsService;

  beforeEach(() => {
    service = new UnifiedAnalyticsService();
  });

  it('should aggregate metrics from all systems', async () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-01-31');

    const metrics = await service.getUnifiedMetrics(
      'test-org-id',
      startDate,
      endDate
    );

    expect(metrics).toHaveProperty('agents');
    expect(metrics).toHaveProperty('mlModels');
    expect(metrics).toHaveProperty('conversations');
    expect(metrics).toHaveProperty('insights');
    expect(metrics).toHaveProperty('recommendations');
  });

  it('should generate recommendations based on metrics', async () => {
    // Test recommendation logic
    const metrics = await service.getUnifiedMetrics(
      'test-org-id',
      new Date(),
      new Date()
    );

    expect(Array.isArray(metrics.recommendations)).toBe(true);
  });
});
```

---

## 2. Integration Testing

### API Integration Tests

```typescript
// src/app/api/__tests__/unified-analytics.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '../integrations/unified-analytics/route';
import { NextRequest } from 'next/server';

describe('/api/integrations/unified-analytics', () => {
  it('should require authentication', async () => {
    const req = new NextRequest('http://localhost:3000/api/integrations/unified-analytics');
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('should return unified metrics for authenticated users', async () => {
    // Mock authenticated request
    const req = new NextRequest(
      'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
    );

    // Set auth headers (mock)
    // const response = await GET(req);
    // expect(response.status).toBe(200);
  });

  it('should validate query parameters', async () => {
    const req = new NextRequest(
      'http://localhost:3000/api/integrations/unified-analytics?days_back=invalid'
    );

    // Should handle invalid parameters gracefully
  });
});
```

### Database Integration Tests

```typescript
// src/lib/performance/__tests__/query-optimizer.integration.test.ts
import { describe, it, expect } from 'vitest';
import { queryOptimizer } from '../query-optimizer';
import { createClient } from '@supabase/supabase-js';

describe('QueryOptimizer Integration', () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  it('should optimize conversation queries', async () => {
    const conversations = await queryOptimizer.getConversationsOptimized(
      supabase,
      'test-org-id',
      { limit: 10 }
    );

    expect(Array.isArray(conversations)).toBe(true);
  });

  it('should cache repeated queries', async () => {
    const start = Date.now();

    // First call
    await queryOptimizer.getConversationsOptimized(
      supabase,
      'test-org-id',
      { limit: 10 }
    );

    const firstCallTime = Date.now() - start;

    // Second call (cached)
    const cachedStart = Date.now();
    await queryOptimizer.getConversationsOptimized(
      supabase,
      'test-org-id',
      { limit: 10 }
    );
    const cachedCallTime = Date.now() - cachedStart;

    expect(cachedCallTime).toBeLessThan(firstCallTime);
  });
});
```

---

## 3. End-to-End (E2E) Testing

### Setup with Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Test Examples

```typescript
// e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Unified Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should display system efficiency score', async ({ page }) => {
    await page.goto('/dashboard/unified');

    // Wait for data to load
    await page.waitForSelector('[data-testid="efficiency-score"]');

    const score = await page.textContent('[data-testid="efficiency-score"]');
    expect(score).toMatch(/\d+% Efficient/);
  });

  test('should show agent metrics', async ({ page }) => {
    await page.goto('/dashboard/unified');

    await expect(page.getByText('Autonomous Agents')).toBeVisible();
    await expect(page.getByText('Total Executions')).toBeVisible();
    await expect(page.getByText('Success Rate')).toBeVisible();
  });

  test('should display AI recommendations', async ({ page }) => {
    await page.goto('/dashboard/unified');

    await expect(page.getByText('AI Recommendations')).toBeVisible();

    // Check for priority badges
    const priorityBadges = page.locator('[data-priority]');
    await expect(priorityBadges.first()).toBeVisible();
  });

  test('should handle date range changes', async ({ page }) => {
    await page.goto('/dashboard/unified');

    // Change date range
    await page.selectOption('select[name="days_back"]', '7');

    // Wait for data refresh
    await page.waitForResponse(
      resp => resp.url().includes('/api/integrations/unified-analytics')
    );

    expect(page.url()).toContain('days_back=7');
  });
});
```

---

## 4. Test Coverage Requirements

### Target Coverage

```
Overall: 80%+
Critical paths: 95%+
Business logic: 90%+
UI components: 70%+
```

### Running Coverage

```bash
npm run test:coverage
```

### Coverage Configuration

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 5. Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
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
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e
```

---

## 6. Quality Assurance Checklist

### Pre-Deployment

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing for critical flows
- [ ] Code coverage > 80%
- [ ] No console errors in browser
- [ ] Lighthouse score > 90
- [ ] Performance metrics within targets
- [ ] Security audit passed
- [ ] Accessibility audit passed

### Manual Testing

- [ ] Login/logout flows
- [ ] Dashboard data display
- [ ] Agent execution monitoring
- [ ] Conversation viewing
- [ ] ML predictions display
- [ ] Error handling
- [ ] Mobile responsiveness
- [ ] Dark mode functionality

---

## 7. Test Data Management

### Mock Data

```typescript
// src/test/mockData/conversations.ts
export const mockConversations = [
  {
    id: '1',
    organization_id: 'org1',
    type: 'user_chat',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    organization_id: 'org1',
    type: 'agent_proactive',
    created_at: '2025-01-02T00:00:00Z',
  },
];

export const mockAnalytics = {
  conversation_id: '1',
  conversation_metadata: { qualityScore: 85 },
  user_satisfaction_score: 4.5,
  topics_discussed: ['sustainability', 'energy'],
};
```

### Test Fixtures

```typescript
// src/test/fixtures/setup.ts
export function createTestOrganization() {
  return {
    id: 'test-org-id',
    name: 'Test Organization',
    created_at: new Date().toISOString(),
  };
}

export function createTestUser() {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    organization_id: 'test-org-id',
  };
}
```

---

## 8. Performance Testing

### Load Testing with k6

```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/integrations/unified-analytics');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
  sleep(1);
}
```

---

**Testing Pyramid Maintained:**
- 60% Unit Tests (Fast, isolated)
- 30% Integration Tests (Service interactions)
- 10% E2E Tests (Critical user flows)

**Next:** Monitoring & Observability
