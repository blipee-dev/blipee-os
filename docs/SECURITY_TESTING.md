# Security Testing Documentation

This document describes the comprehensive security testing suite for blipee OS, covering all security components and attack vectors.

## Overview

The security testing suite addresses the "No security tests" shortcut by implementing thorough testing for all security components:

- **Encryption & Key Management**
- **Rate Limiting & DDoS Protection**
- **Multi-Factor Authentication (MFA)**
- **WebAuthn/FIDO2 Security**
- **Account Recovery Systems**
- **Audit Logging**
- **Integration Testing**
- **Attack Vector Testing**

## Test Structure

```
src/lib/security/__tests__/
├── encryption.test.ts        # Encryption service tests
├── rate-limit.test.ts        # Rate limiting tests
├── integration.test.ts       # Integration tests
src/lib/auth/__tests__/
├── mfa.test.ts              # MFA system tests
├── webauthn.test.ts         # WebAuthn/FIDO2 tests
```

## Running Security Tests

### Quick Start

```bash
# Run all security tests
npm run test:security

# Run specific test categories
npm test -- --testPathPattern="encryption\.test\.ts"
npm test -- --testPathPattern="rate-limit\.test\.ts"
npm test -- --testPathPattern="mfa\.test\.ts"
npm test -- --testPathPattern="webauthn\.test\.ts"
npm test -- --testPathPattern="integration\.test\.ts"

# Run with coverage
npm run test:coverage
```

### Detailed Test Execution

```bash
# Make the security test script executable
chmod +x scripts/test-security.sh

# Run comprehensive security test suite
./scripts/test-security.sh
```

## Test Categories

### 1. Encryption & Key Management Tests (`encryption.test.ts`)

**Coverage:**
- ✅ Basic encryption/decryption operations
- ✅ Context-based encryption
- ✅ Key management and rotation
- ✅ Data key caching
- ✅ Memory security (key zeroing)
- ✅ Error handling and edge cases
- ✅ Unicode and large data handling
- ✅ Factory pattern implementation

**Key Test Scenarios:**
- Encrypt/decrypt various data types and sizes
- Context isolation and validation
- Key rotation and versioning
- Memory cleanup verification
- Error message sanitization
- Performance under load

### 2. Rate Limiting Tests (`rate-limit.test.ts`)

**Coverage:**
- ✅ Basic rate limiting functionality
- ✅ Burst handling and refill
- ✅ Rule management and updates
- ✅ Key isolation
- ✅ Statistics and monitoring
- ✅ Concurrent request handling
- ✅ Storage failure graceful handling

**Key Test Scenarios:**
- Rate limit enforcement and reset
- Burst capacity management
- Rule configuration and updates
- Multi-user isolation
- Performance under high load
- Redis failover handling

### 3. Multi-Factor Authentication Tests (`mfa.test.ts`)

**Coverage:**
- ✅ TOTP MFA setup and verification
- ✅ Backup code generation and usage
- ✅ Secret encryption and storage
- ✅ MFA status management
- ✅ Error handling and edge cases
- ✅ Security question integration

**Key Test Scenarios:**
- Complete MFA setup flow
- Token verification (valid/invalid)
- Backup code management
- Duplicate setup prevention
- Timing attack prevention
- Error message consistency

### 4. WebAuthn/FIDO2 Tests (`webauthn.test.ts`)

**Coverage:**
- ✅ Registration options generation
- ✅ Registration verification
- ✅ Authentication flows
- ✅ Credential management
- ✅ Counter-based replay protection
- ✅ Challenge validation
- ✅ AAGUID allowlist/blocklist
- ✅ Statistics and monitoring

**Key Test Scenarios:**
- Complete WebAuthn registration flow
- Authentication with various credentials
- Replay attack prevention
- Challenge expiration handling
- Credential isolation between users
- Device type recognition

### 5. Integration Tests (`integration.test.ts`)

**Coverage:**
- ✅ End-to-end security flows
- ✅ Component interaction testing
- ✅ Security boundary verification
- ✅ Attack vector simulation
- ✅ Performance and scalability
- ✅ Concurrent operation handling

**Key Test Scenarios:**
- Complete user security setup
- Multi-layer security verification
- Cross-component data isolation
- Attack simulation and prevention
- Performance under load
- Concurrent user operations

## Security Test Patterns

### 1. Boundary Testing

```typescript
// Test security boundaries
it('should isolate user data in encryption', async () => {
  const user1Data = 'User 1 secret data';
  const user2Data = 'User 2 secret data';
  const user1Context = { userId: 'user-1' };
  const user2Context = { userId: 'user-2' };

  const encrypted1 = await encryptionService.encrypt(user1Data, user1Context);
  const encrypted2 = await encryptionService.encrypt(user2Data, user2Context);

  // Cross-user access should fail
  encrypted1.context = user2Context;
  await expect(encryptionService.decrypt(encrypted1)).rejects.toThrow();
});
```

### 2. Attack Vector Testing

```typescript
// Test timing attacks
it('should prevent timing attacks on token verification', async () => {
  const validToken = '123456';
  const invalidToken = '000000';

  const validStart = performance.now();
  await mfaService.verifyMFA(userId, validToken);
  const validEnd = performance.now();

  const invalidStart = performance.now();
  await mfaService.verifyMFA(userId, invalidToken);
  const invalidEnd = performance.now();

  // Times should be similar
  expect(Math.abs(validTime - invalidTime)).toBeLessThan(100);
});
```

### 3. Error Handling Testing

```typescript
// Test error message consistency
it('should prevent enumeration attacks via consistent error messages', async () => {
  const validUserId = 'valid-user';
  const invalidUserId = 'invalid-user';

  const result1 = await mfaService.verifyMFA(validUserId, '123456');
  const result2 = await mfaService.verifyMFA(invalidUserId, '123456');

  // Error messages should be consistent
  expect(result1.error).toBe(result2.error);
});
```

## Test Configuration

### Jest Configuration (`jest.config.js`)

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/lib/security/**/*.ts',
    'src/lib/auth/**/*.ts',
    'src/lib/audit/**/*.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Test Setup (`jest.setup.js`)

- Mock external dependencies (Redis, Supabase, etc.)
- Set up test environment variables
- Configure global mocks and utilities
- Initialize test databases and cleanup

## Coverage Requirements

### Minimum Coverage Thresholds

- **Global Coverage**: 80% (branches, functions, lines, statements)
- **Security Components**: 85% (higher threshold for critical components)
- **Authentication Components**: 85%

### Coverage Reports

- **HTML Report**: `coverage/lcov-report/index.html`
- **LCOV Report**: `coverage/lcov.info`
- **JUnit XML**: `test-results/junit.xml`
- **HTML Test Report**: `test-results/test-report.html`

## Security Test Checklist

### Pre-Test Setup
- [ ] Test environment isolated from production
- [ ] Mock external services properly configured
- [ ] Test data encryption keys properly managed
- [ ] Rate limiting rules configured for testing
- [ ] Audit logging enabled and configured

### Test Execution
- [ ] All encryption tests passing
- [ ] All rate limiting tests passing
- [ ] All MFA tests passing
- [ ] All WebAuthn tests passing
- [ ] All integration tests passing
- [ ] Coverage thresholds met
- [ ] No security vulnerabilities in dependencies

### Post-Test Validation
- [ ] Test reports generated successfully
- [ ] Coverage reports reviewed
- [ ] Security vulnerabilities addressed
- [ ] Performance benchmarks met
- [ ] Test artifacts cleaned up

## Security Testing Best Practices

### 1. Test Data Management

```typescript
// Use secure test data
const testData = {
  user: {
    id: 'test-user-' + crypto.randomUUID(),
    email: 'test@example.com',
    hashedPassword: 'hashed-test-password',
  },
  secrets: {
    totpSecret: 'TEST-SECRET-' + crypto.randomBytes(10).toString('hex'),
    backupCodes: Array.from({ length: 8 }, () => crypto.randomBytes(4).toString('hex')),
  },
};
```

### 2. Mock Security

```typescript
// Mock external services securely
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));
```

### 3. Error Testing

```typescript
// Test error conditions thoroughly
it('should handle encryption failures gracefully', async () => {
  const corruptedData = {
    ciphertext: 'corrupted-data',
    encryptedDataKey: 'invalid-key',
    algorithm: 'aes-256-gcm',
  };

  await expect(encryptionService.decrypt(corruptedData)).rejects.toThrow();
});
```

## Continuous Security Testing

### CI/CD Integration

```yaml
# .github/workflows/security-tests.yml
name: Security Tests
on: [push, pull_request]
jobs:
  security-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:security
      - run: npm audit
```

### Security Monitoring

- **Daily automated security test runs**
- **Dependency vulnerability scanning**
- **Performance regression testing**
- **Security metric tracking**

## Troubleshooting

### Common Issues

1. **Test Timeout**: Increase Jest timeout for encryption tests
2. **Mock Failures**: Ensure all external dependencies are properly mocked
3. **Coverage Issues**: Check for untested error paths
4. **Performance**: Adjust test thresholds for slower environments

### Debug Commands

```bash
# Run tests with debug output
npm test -- --verbose --detectOpenHandles

# Run specific test with debugging
npm test -- --testNamePattern="should encrypt" --verbose

# Check test coverage for specific files
npm test -- --collectCoverageFrom="src/lib/security/encryption/**/*.ts" --coverage
```

## Security Test Metrics

### Key Performance Indicators

- **Test Coverage**: >85% for security components
- **Test Execution Time**: <5 minutes for full suite
- **Security Vulnerability Count**: 0 high/critical
- **Test Stability**: >99% pass rate

### Security Validation Metrics

- **Authentication Tests**: 100% pass rate
- **Authorization Tests**: 100% pass rate
- **Encryption Tests**: 100% pass rate
- **Rate Limiting Tests**: 100% pass rate

## Conclusion

The comprehensive security testing suite ensures that all security components are thoroughly tested against various attack vectors and edge cases. Regular execution of these tests maintains the security posture of the blipee OS platform.

For questions or issues with security testing, please refer to the troubleshooting section or contact the security team.