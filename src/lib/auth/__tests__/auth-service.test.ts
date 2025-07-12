import { AuthService } from '../service';
import { mockSupabaseClient } from '@/test/setup/mocks';
import * as crypto from 'crypto';
import { jest } from '@jest/globals';

// Mock the auth rate limiter
jest.mock('@/lib/security/rate-limit/service', () => ({
  RateLimitService: jest.fn().mockImplementation(() => ({
    check: jest.fn().mockResolvedValue(true),
    reset: jest.fn(),
  })),
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('signUp', () => {
    it('should create a new user successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {},
      };

      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      });

      mockSupabaseClient.from().insert().then.mockResolvedValueOnce({
        data: { id: 'profile-123' },
        error: null,
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
      });

      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'Test User',
          },
        },
      });
    });

    it('should handle signup errors', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      });

      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should validate password strength', async () => {
      const result = await authService.signUp({
        email: 'test@example.com',
        password: 'weak',
      });

      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Password must be at least');
    });
  });

  describe('signIn', () => {
    it('should sign in user successfully', async () => {
      const mockSession = {
        user: { id: 'user-123', email: 'test@example.com' },
        access_token: 'token',
        refresh_token: 'refresh',
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockSession.user, session: mockSession },
        error: null,
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(mockSession.user);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });

    it('should handle invalid credentials', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const result = await authService.signIn({
        email: 'test@example.com',
        password: 'wrong-password',
      });

      expect(result.user).toBeNull();
      expect(result.error).toBeTruthy();
    });

    it('should handle rate limiting', async () => {
      const rateLimitService = require('@/lib/security/rate-limit/service').RateLimitService;
      const mockCheck = jest.fn().mockResolvedValueOnce(false);
      rateLimitService.mockImplementationOnce(() => ({
        check: mockCheck,
      }));

      const service = new AuthService();
      const result = await service.signIn({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.error?.message).toContain('Too many login attempts');
    });
  });

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: null,
      });

      const result = await authService.signOut();
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    });

    it('should handle signout errors', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValueOnce({
        error: { message: 'Failed to sign out' },
      });

      const result = await authService.signOut();
      expect(result.error).toBeTruthy();
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      const result = await authService.resetPassword('test@example.com');
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object)
      );
    });

    it('should handle reset password errors', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValueOnce({
        data: {},
        error: { message: 'User not found' },
      });

      const result = await authService.resetPassword('test@example.com');
      expect(result.error).toBeTruthy();
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValueOnce({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const result = await authService.updatePassword('newPassword123!');
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123!',
      });
    });

    it('should validate new password strength', async () => {
      const result = await authService.updatePassword('weak');
      expect(result.error).toBeTruthy();
      expect(result.error?.message).toContain('Password must be at least');
    });
  });

  describe('getUser', () => {
    it('should get current user', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: mockUser },
        error: null,
      });

      const result = await authService.getUser();
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeNull();
    });

    it('should handle no user session', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const result = await authService.getUser();
      expect(result.user).toBeNull();
    });
  });

  describe('getSession', () => {
    it('should get current session', async () => {
      const mockSession = {
        user: { id: 'user-123' },
        access_token: 'token',
        refresh_token: 'refresh',
      };

      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });

      const result = await authService.getSession();
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeNull();
    });
  });

  describe('Password Utilities', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'ComplexP@ssw0rd',
        'Str0ng&Secure!',
      ];

      strongPasswords.forEach(password => {
        const result = authService.validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.score).toBeGreaterThanOrEqual(3);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password',
        '12345678',
        'Password',
        'Pass123',
      ];

      weakPasswords.forEach(password => {
        const result = authService.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors).not.toHaveLength(0);
      });
    });

    it('should hash passwords securely', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should verify password hashes', async () => {
      const password = 'TestPassword123!';
      const hash = await authService.hashPassword(password);

      const isValid = await authService.verifyPassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await authService.verifyPassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Session Management', () => {
    it('should check if user is authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      });

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(true);
    });

    it('should return false when not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValueOnce({
        data: { session: null },
        error: null,
      });

      const isAuthenticated = await authService.isAuthenticated();
      expect(isAuthenticated).toBe(false);
    });

    it('should refresh session token', async () => {
      const newSession = {
        user: { id: 'user-123' },
        access_token: 'new-token',
        refresh_token: 'new-refresh',
      };

      mockSupabaseClient.auth.refreshSession = jest.fn().mockResolvedValueOnce({
        data: { session: newSession },
        error: null,
      });

      const result = await authService.refreshSession();
      expect(result.session).toEqual(newSession);
      expect(result.error).toBeNull();
    });
  });

  describe('Profile Management', () => {
    it('should get user profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        full_name: 'Test User',
        avatar_url: 'https://example.com/avatar.jpg',
      };

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockProfile,
        error: null,
      });

      const result = await authService.getProfile('user-123');
      expect(result.profile).toEqual(mockProfile);
      expect(result.error).toBeNull();
    });

    it('should update user profile', async () => {
      const updates = {
        full_name: 'Updated Name',
        bio: 'New bio',
      };

      mockSupabaseClient.from().update().eq().select().single.mockResolvedValueOnce({
        data: { id: 'profile-123', ...updates },
        error: null,
      });

      const result = await authService.updateProfile('user-123', updates);
      expect(result.profile?.full_name).toBe('Updated Name');
      expect(result.error).toBeNull();
    });
  });

  describe('OAuth', () => {
    it('should sign in with OAuth provider', async () => {
      mockSupabaseClient.auth.signInWithOAuth = jest.fn().mockResolvedValueOnce({
        data: { provider: 'google', url: 'https://oauth.url' },
        error: null,
      });

      const result = await authService.signInWithOAuth('google');
      expect(result.error).toBeNull();
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.any(Object),
      });
    });

    it('should handle OAuth errors', async () => {
      mockSupabaseClient.auth.signInWithOAuth = jest.fn().mockResolvedValueOnce({
        data: null,
        error: { message: 'OAuth error' },
      });

      const result = await authService.signInWithOAuth('github');
      expect(result.error).toBeTruthy();
    });
  });
});