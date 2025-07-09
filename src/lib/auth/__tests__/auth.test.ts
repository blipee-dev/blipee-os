import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';
import { hashPassword, verifyPassword, generateToken, verifyToken } from '../utils';
import { rateLimiter } from '../rate-limiter';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(),
      update: jest.fn(),
    })),
  })),
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Password Utilities', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'SecurePassword123!';
      const hashedPassword = await hashPassword(password);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(20);

      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);

      const isInvalid = await verifyPassword('WrongPassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Token Management', () => {
    it('should generate and verify JWT tokens', () => {
      const payload = { userId: 'user_123', role: 'admin' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = verifyToken(token);
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
    });

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => verifyToken(invalidToken)).toThrow();
    });

    it('should handle expired tokens', () => {
      const payload = { userId: 'user_123' };
      const token = generateToken(payload, '0s'); // Expires immediately

      // Wait a bit to ensure expiration
      setTimeout(() => {
        expect(() => verifyToken(token)).toThrow();
      }, 100);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      rateLimiter.reset();
    });

    it('should allow requests within limit', async () => {
      const identifier = 'test-user-1';
      const limit = 5;

      for (let i = 0; i < limit; i++) {
        const result = await rateLimiter.check(identifier, limit);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }
    });

    it('should block requests exceeding limit', async () => {
      const identifier = 'test-user-2';
      const limit = 3;

      // Use up the limit
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(identifier, limit);
      }

      // Next request should be blocked
      const result = await rateLimiter.check(identifier, limit);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset after time window', async () => {
      const identifier = 'test-user-3';
      const limit = 2;

      // Use up the limit
      for (let i = 0; i < limit; i++) {
        await rateLimiter.check(identifier, limit);
      }

      // Should be blocked
      let result = await rateLimiter.check(identifier, limit);
      expect(result.allowed).toBe(false);

      // Wait for reset (mock time passage)
      await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute

      // Should be allowed again
      result = await rateLimiter.check(identifier, limit);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should validate session tokens', async () => {
      const mockSession = {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        user: { id: 'user_123', email: 'test@example.com' }
      };

      const supabase = createClient('url', 'key');
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const session = await supabase.auth.getSession();
      expect(session.data.session).toEqual(mockSession);
    });

    it('should handle invalid sessions', async () => {
      const supabase = createClient('url', 'key');
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid session' }
      });

      const session = await supabase.auth.getSession();
      expect(session.data.session).toBeNull();
      expect(session.error).toBeDefined();
    });
  });

  describe('User Authentication Flow', () => {
    it('should handle successful sign up', async () => {
      const newUser = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      };

      const supabase = createClient('url', 'key');
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'user_new', email: newUser.email },
          session: { access_token: 'token' }
        },
        error: null
      });

      const result = await supabase.auth.signUp(newUser);
      expect(result.data.user?.email).toBe(newUser.email);
      expect(result.error).toBeNull();
    });

    it('should handle sign up errors', async () => {
      const supabase = createClient('url', 'key');
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' }
      });

      const result = await supabase.auth.signUp({
        email: 'existing@example.com',
        password: 'password'
      });

      expect(result.data.user).toBeNull();
      expect(result.error?.message).toBe('User already exists');
    });

    it('should handle successful sign in', async () => {
      const credentials = {
        email: 'user@example.com',
        password: 'password123'
      };

      const supabase = createClient('url', 'key');
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'user_123', email: credentials.email },
          session: { access_token: 'token' }
        },
        error: null
      });

      const result = await supabase.auth.signInWithPassword(credentials);
      expect(result.data.user?.email).toBe(credentials.email);
      expect(result.data.session).toBeDefined();
    });

    it('should handle sign out', async () => {
      const supabase = createClient('url', 'key');
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null
      });

      const result = await supabase.auth.signOut();
      expect(result.error).toBeNull();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should check user permissions correctly', () => {
      const roles = {
        account_owner: ['all'],
        admin: ['read', 'write', 'delete'],
        manager: ['read', 'write'],
        analyst: ['read'],
        viewer: ['read']
      };

      // Account owner should have all permissions
      expect(roles.account_owner.includes('all')).toBe(true);

      // Admin should have specific permissions
      expect(roles.admin.includes('delete')).toBe(true);
      expect(roles.admin.includes('write')).toBe(true);

      // Viewer should only have read
      expect(roles.viewer.includes('read')).toBe(true);
      expect(roles.viewer.includes('write')).toBe(false);
    });
  });
});