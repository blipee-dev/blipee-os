#!/usr/bin/env tsx

/**
 * Test script for enhanced session security
 * Run with: npm run test:session-security
 */

import { 
  generateDeviceFingerprint, 
  getClientIP,
  isSessionExpired,
  shouldRotateSession,
  createSecureSession,
  validateSessionSecurity,
  SESSION_SECURITY
} from '../src/lib/security/session-security';
import { NextRequest } from 'next/server';

console.log('🔐 Testing Enhanced Session Security...\n');

// Mock request helper
function createMockRequest(options: {
  ip?: string;
  userAgent?: string;
  headers?: Record<string, string>;
}): NextRequest {
  const headers = new Headers({
    'x-forwarded-for': options.ip || '192.168.1.1',
    'user-agent': options.userAgent || 'Mozilla/5.0 (test)',
    'accept-language': 'en-US',
    'accept-encoding': 'gzip, deflate',
    ...options.headers,
  });

  return new NextRequest(new URL('https://example.com'), { headers });
}

let passed = 0;
let failed = 0;

// Test 1: Device fingerprint generation
console.log('Test 1: Device Fingerprint Generation');
const req1 = createMockRequest({ userAgent: 'Chrome/100.0' });
const req2 = createMockRequest({ userAgent: 'Firefox/100.0' });
const fingerprint1 = generateDeviceFingerprint(req1);
const fingerprint2 = generateDeviceFingerprint(req2);

if (fingerprint1 !== fingerprint2 && fingerprint1.length === 16) {
  console.log('✅ Different user agents produce different fingerprints');
  passed++;
} else {
  console.log('❌ Fingerprint generation failed');
  failed++;
}

// Test 2: IP extraction
console.log('\nTest 2: IP Address Extraction');
const reqWithIP = createMockRequest({ ip: '10.0.0.1, 192.168.1.1' });
const extractedIP = getClientIP(reqWithIP);

if (extractedIP === '10.0.0.1') {
  console.log('✅ Correctly extracted first IP from X-Forwarded-For');
  passed++;
} else {
  console.log(`❌ Expected '10.0.0.1', got '${extractedIP}'`);
  failed++;
}

// Test 3: Session expiration
console.log('\nTest 3: Session Expiration Checks');
const now = Date.now();
const mockSession = {
  id: 'test-session',
  userId: 'test-user',
  createdAt: now - (25 * 60 * 60 * 1000), // 25 hours ago
  lastActivity: now,
  rotatedAt: now,
  expiresAt: now + (1 * 60 * 60 * 1000),
} as any;

if (isSessionExpired(mockSession)) {
  console.log('✅ Correctly detected expired session (exceeded max lifetime)');
  passed++;
} else {
  console.log('❌ Failed to detect expired session');
  failed++;
}

// Test 4: Session rotation
console.log('\nTest 4: Session Rotation Detection');
const rotationSession = {
  ...mockSession,
  createdAt: now,
  rotatedAt: now - (31 * 60 * 1000), // 31 minutes ago
};

if (shouldRotateSession(rotationSession)) {
  console.log('✅ Correctly detected session needs rotation');
  passed++;
} else {
  console.log('❌ Failed to detect session rotation need');
  failed++;
}

// Test 5: Session security validation
console.log('\nTest 5: Session Security Validation');
const secureReq = createMockRequest({ ip: '192.168.1.100' });
const secureSession = createSecureSession('user-123', secureReq, {
  loginMethod: 'password',
  permissions: ['read', 'write'],
  organizationId: 'org-123',
});

// Test with matching request
const validation1 = validateSessionSecurity(secureSession, secureReq);
if (validation1.valid) {
  console.log('✅ Valid session passed security checks');
  passed++;
} else {
  console.log('❌ Valid session failed security checks:', validation1.reason);
  failed++;
}

// Test with different IP (when enforcement is disabled)
SESSION_SECURITY.ENFORCE_IP_BINDING = false;
const differentIPReq = createMockRequest({ ip: '10.0.0.1' });
const validation2 = validateSessionSecurity(secureSession, differentIPReq);
if (validation2.valid) {
  console.log('✅ Session valid with different IP (enforcement disabled)');
  passed++;
} else {
  console.log('❌ Session invalid with different IP:', validation2.reason);
  failed++;
}

// Test 6: Secure session creation
console.log('\nTest 6: Secure Session Creation');
const newSession = createSecureSession('user-456', secureReq, {
  loginMethod: 'mfa',
  isMfaVerified: true,
  permissions: ['admin'],
});

const checks = [
  newSession.id.length === 64,
  newSession.userId === 'user-456',
  newSession.isMfaVerified === true,
  newSession.loginMethod === 'mfa',
  newSession.permissions.includes('admin'),
  newSession.rotationCount === 0,
];

if (checks.every(check => check)) {
  console.log('✅ Secure session created with all properties');
  passed++;
} else {
  console.log('❌ Secure session creation incomplete');
  failed++;
}

// Summary
console.log('\n\n📊 Test Summary:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed === 0) {
  console.log('\n✨ All session security tests passed!');
} else {
  console.log('\n⚠️  Some tests failed. Check session security implementation.');
}

// Display security configuration
console.log('\n🔧 Current Security Configuration:');
console.log(`- Session rotation interval: ${SESSION_SECURITY.ROTATION_INTERVAL / 60000} minutes`);
console.log(`- Maximum session lifetime: ${SESSION_SECURITY.MAX_LIFETIME / 3600000} hours`);
console.log(`- Idle timeout: ${SESSION_SECURITY.IDLE_TIMEOUT / 3600000} hours`);
console.log(`- Max concurrent sessions: ${SESSION_SECURITY.MAX_CONCURRENT_SESSIONS}`);
console.log(`- IP binding enforcement: ${SESSION_SECURITY.ENFORCE_IP_BINDING}`);
console.log(`- Device fingerprint enforcement: ${SESSION_SECURITY.ENFORCE_FINGERPRINT}`);