import { POST } from '../signin/route';
import { jest } from '@jest/globals';
import { 
  createAuthenticatedRequest, 
  assertValidation,
  testSqlInjection,
  testXssProtection,
  assertRateLimited,
  measureResponseTime,
  mockSupabaseClient
} from '@/test/utils/api-test-helpers';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Mock rate limiter
jest.mock('@/lib/security/rate-limit', () => ({
  rateLimiter: {
    check: jest.fn().mockResolvedValue({ success: true }),
  },
}));

describe('POST /api/auth/signin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Functional Tests', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123', user: mockUser };
      
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        _error: null,
      });

      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toEqual({
        user: mockUser,
        session: mockSession,
      });
    });

    it('should return 401 for invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        _error: { message: 'Invalid login credentials' },
      });

      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toBe('Invalid login credentials');
    });

    it('should handle MFA requirement', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        _error: { message: 'MFA required', code: 'mfa_required' },
      });

      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'SecurePassword123!',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.requiresMfa).toBe(true);
    });
  });

  describe('Validation Tests', () => {
    it('should validate required fields', async () => {
      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      await assertValidation(POST, request, {}, ['email', 'password']);
    });

    it('should validate email format', async () => {
      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'password123',
        }),
      });

      await assertValidation(POST, request, {}, ['Invalid email']);
    });

    it('should enforce password minimum length', async () => {
      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: '123',
        }),
      });

      await assertValidation(POST, request, {}, ['Password must be at least']);
    });
  });

  describe('Security Tests', () => {
    it('should prevent SQL injection in email field', async () => {
      await testSqlInjection(POST, 'email');
    });

    it('should prevent XSS in error messages', async () => {
      await testXssProtection(POST, 'email');
    });

    it('should rate limit sign-in attempts', async () => {
      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      // Mock rate limiter to fail after 5 attempts
      let attempts = 0;
      jest.mocked(require('@/lib/security/rate-limit').rateLimiter.check)
        .mockImplementation(async () => {
          attempts++;
          return { success: attempts <= 5 };
        });

      await assertRateLimited(POST, request, {}, 5);
    });

    it('should prevent timing attacks on user enumeration', async () => {
      // Test with existing user
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        _error: { message: 'Invalid login credentials' },
      });

      const existingUserRequest = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'existing@example.com',
          password: 'WrongPassword',
        }),
      });

      const existingUserTime = await measureResponseTime(POST, existingUserRequest);

      // Test with non-existing user
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        _error: { message: 'Invalid login credentials' },
      });

      const nonExistingUserRequest = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexisting@example.com',
          password: 'WrongPassword',
        }),
      });

      const nonExistingUserTime = await measureResponseTime(POST, nonExistingUserRequest);

      // Response times should be similar (within 50ms)
      expect(Math.abs(existingUserTime - nonExistingUserTime)).toBeLessThan(50);
    });

    it('should log failed sign-in attempts', async () => {
      const auditLogSpy = jest.spyOn(require('@/lib/audit/logger'), 'logSecurityEvent');

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        _error: { message: 'Invalid login credentials' },
      });

      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      });

      await POST(request);

      expect(auditLogSpy).toHaveBeenCalledWith({
        _event: 'FAILED_LOGIN_ATTEMPT',
        email: 'test@example.com',
        ip: expect.any(String),
        userAgent: expect.any(String),
      });
    });
  });

  describe('Performance Tests', () => {
    it('should respond within 500ms', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        _error: null,
      });

      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const responseTime = await measureResponseTime(POST, request);
      expect(responseTime).toBeLessThan(500);
    });

    it('should handle concurrent sign-in requests', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: 'user-123' }, session: { access_token: 'token' } },
        _error: null,
      });

      const requests = Array(50).fill(null).map((_, i) => 
        POST(new Request('http://localhost:3000/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: `test${i}@example.com`,
            password: 'password123',
          }),
        }))
      );

      const start = performance.now();
      const responses = await Promise.all(requests);
      const end = performance.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Total time for 50 concurrent requests should be reasonable
      expect(end - start).toBeLessThan(2000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockRejectedValueOnce(
        new Error('Network error')
      );

      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);

      const data = await response.json();
      expect(data.error).toBe('An error occurred during sign in');
    });

    it('should handle malformed JSON', async () => {
      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"email": "test@example.com", "password": }', // Invalid JSON
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('Invalid request');
    });

    it('should enforce HTTPS in production', async () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      const _request = new Request('http://localhost:3000/api/auth/signin', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Forwarded-Proto': 'http',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(403);

      const data = await response.json();
      expect(data.error).toContain('HTTPS required');

      process.env['NODE_ENV'] = originalEnv;
    });
  });
});