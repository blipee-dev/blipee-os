# Fortune 10 Testing Guide for blipee OS

## Overview

This guide outlines the comprehensive testing strategy to achieve Fortune 10 enterprise standards (90%+ test coverage) for the blipee OS platform.

## Current Status

- **Current Coverage**: 0.5%
- **Target Coverage**: 90%+
- **Test Infrastructure**: ✅ Complete
- **Test Implementation**: 🚧 In Progress

## Testing Stack

### Core Technologies
- **Jest**: Unit and integration testing
- **React Testing Library**: Component testing
- **Cypress**: E2E testing
- **Supertest**: API testing
- **Stryker**: Mutation testing
- **Percy**: Visual regression testing

### Configuration Files
- `jest.config.mjs`: Main Jest configuration with ESM support
- `jest.setup.enterprise.js`: Comprehensive test setup
- `.env.test`: Test environment variables

## Quick Start

### 1. Run All Tests
```bash
npm test
```

### 2. Run Tests with Coverage
```bash
npm run test:coverage
```

### 3. Run Specific Test Categories
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:api          # API tests
npm run test:security     # Security tests
npm run test:e2e         # End-to-end tests
```

### 4. Generate New Tests
```bash
node scripts/generate-fortune10-tests.js
```

### 5. Run Fortune 10 Compliance Check
```bash
node scripts/fortune10-test-runner.js
```

## Test Categories

### 1. Unit Tests (30% of coverage)
Test individual functions, components, and modules in isolation.

**Example:**
```typescript
describe('UtilityFunction', () => {
  it('should calculate correctly', () => {
    expect(calculateValue(10, 20)).toBe(30);
  });
});
```

### 2. Integration Tests (25% of coverage)
Test interactions between multiple modules.

**Example:**
```typescript
describe('AIService Integration', () => {
  it('should integrate with multiple providers', async () => {
    const result = await aiService.process('test query');
    expect(result).toBeDefined();
  });
});
```

### 3. API Tests (20% of coverage)
Test all API endpoints for functionality, security, and performance.

**Example:**
```typescript
describe('GET /api/buildings', () => {
  it('should return buildings for authenticated user', async () => {
    const response = await request(app)
      .get('/api/buildings')
      .set('Authorization', 'Bearer token');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('buildings');
  });
});
```

### 4. Component Tests (15% of coverage)
Test React components with user interactions.

**Example:**
```typescript
describe('ConversationInterface', () => {
  it('should send message on submit', async () => {
    const user = userEvent.setup();
    render(<ConversationInterface />);
    
    await user.type(screen.getByRole('textbox'), 'Test message');
    await user.click(screen.getByRole('button', { name: /send/i }));
    
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });
});
```

### 5. E2E Tests (10% of coverage)
Test complete user workflows.

**Example:**
```javascript
describe('User Journey', () => {
  it('should complete sustainability report workflow', () => {
    cy.visit('/');
    cy.login('user@example.com', 'password');
    cy.get('[data-cy=new-report]').click();
    // ... complete workflow
  });
});
```

## Best Practices

### 1. Test Structure
```typescript
describe('ComponentName', () => {
  // Setup
  beforeEach(() => {
    // Common setup
  });

  // Group related tests
  describe('Feature', () => {
    it('should behave correctly', () => {
      // Arrange
      const input = prepareInput();
      
      // Act
      const result = performAction(input);
      
      // Assert
      expect(result).toMatchExpectation();
    });
  });

  // Cleanup
  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

### 2. Mock Best Practices
```typescript
// Create reusable mocks
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ data: [], error: null })
  }))
};

// Use in tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => mockSupabaseClient
}));
```

### 3. Async Testing
```typescript
// Always use async/await for clarity
it('should handle async operations', async () => {
  const result = await asyncOperation();
  expect(result).toBeDefined();
});

// Test error cases
it('should handle errors', async () => {
  mockFunction.mockRejectedValue(new Error('Test error'));
  
  await expect(asyncOperation()).rejects.toThrow('Test error');
});
```

### 4. Performance Testing
```typescript
it('should complete within performance budget', async () => {
  const start = performance.now();
  await performOperation();
  const duration = performance.now() - start;
  
  expect(duration).toBeLessThan(100); // 100ms budget
});
```

## Coverage Requirements

### Fortune 10 Standards
- **Statements**: 90%+
- **Branches**: 90%+
- **Functions**: 90%+
- **Lines**: 90%+

### Critical Paths (Must have 100% coverage)
- Authentication flows
- Payment processing
- Data security functions
- Error handling
- User permissions

## CI/CD Integration

### GitHub Actions Workflow
```yaml
- name: Run Tests
  run: npm test

- name: Check Coverage
  run: npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  
- name: Fortune 10 Compliance Check
  run: node scripts/fortune10-test-runner.js
```

## Common Issues and Solutions

### 1. ESM Module Issues
**Problem**: Cannot use import statement outside a module
**Solution**: Use `jest.config.mjs` with proper ESM configuration

### 2. Mock Not Working
**Problem**: Real module being called instead of mock
**Solution**: Ensure mock is defined before import

### 3. Async Test Timeout
**Problem**: Test times out
**Solution**: Increase timeout or optimize async operations
```typescript
jest.setTimeout(30000); // 30 seconds
```

### 4. Coverage Not Detected
**Problem**: Files show 0% coverage despite tests
**Solution**: Check `collectCoverageFrom` patterns in Jest config

## Monitoring Progress

### Weekly Targets
- Week 1: 15% coverage (Foundation)
- Week 2: 35% coverage (Components)
- Week 3: 55% coverage (Services)
- Week 4: 75% coverage (APIs)
- Week 5: 85% coverage (Integration)
- Week 6: 90%+ coverage (Polish)

### Daily Checklist
- [ ] Write tests for new code
- [ ] Run coverage report
- [ ] Fix any failing tests
- [ ] Review and improve existing tests
- [ ] Update documentation

## Resources

### Internal
- `/scripts/generate-fortune10-tests.js`: Test generator
- `/scripts/fortune10-test-runner.js`: Compliance checker
- `/src/test/utils/`: Test utilities
- `/src/test/fixtures/`: Test data

### External
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

## Support

For questions or issues:
1. Check this guide
2. Review existing tests for examples
3. Consult team lead
4. Open issue in repository

Remember: **Quality over Speed** - Better to have fewer well-written tests than many poor ones.