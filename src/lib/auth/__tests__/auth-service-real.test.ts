import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AuthService } from '../auth-service';
import { createClient } from '@/lib/supabase/client';

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn()
    }
  }))
}));

describe('Auth Service', () => {
  let authService: AuthService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createClient();
    authService = new AuthService();
  });

  describe('signIn', () => {
    it('should sign in with email and password', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null
      });

      const result = await authService.signIn('test@example.com', 'password');
      
      expect(result.data?.user).toEqual(mockUser);
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('should handle sign in errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      });

      const result = await authService.signIn('test@example.com', 'wrong');
      
      expect(result.data).toBeNull();
      expect(result.error?.message).toBe('Invalid credentials');
    });
  });

  describe('signUp', () => {
    it('should sign up new user', async () => {
      const mockUser = { id: 'new123', email: 'new@example.com' };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const result = await authService.signUp('new@example.com', 'password', {
        full_name: 'New User'
      });
      
      expect(result.data?.user).toEqual(mockUser);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password',
        options: {
          data: { full_name: 'New User' }
        }
      });
    });
  });

  describe('signOut', () => {
    it('should sign out user', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      const result = await authService.signOut();
      
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('getSession', () => {
    it('should get current session', async () => {
      const mockSession = { access_token: 'token', user: { id: 'user123' } };
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      });

      const result = await authService.getSession();
      
      expect(result.data?.session).toEqual(mockSession);
    });
  });

  describe('getUser', () => {
    it('should get current user', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' };
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const result = await authService.getUser();
      
      expect(result.data?.user).toEqual(mockUser);
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      const result = await authService.resetPassword('test@example.com');
      
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(Object)
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: { id: 'user123', user_metadata: { full_name: 'Updated' } } },
        error: null
      });

      const result = await authService.updateProfile({ full_name: 'Updated' });
      
      expect(result.error).toBeNull();
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { full_name: 'Updated' }
      });
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();
      
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe } }
      });

      authService.onAuthStateChange(callback);
      
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(callback);
    });
  });
});