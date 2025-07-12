#!/usr/bin/env node

/**
 * Test auth and session services
 */

const fs = require('fs').promises;
const path = require('path');

const authTests = [
  // Test auth service
  {
    file: 'src/lib/auth/__tests__/auth-service-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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
});`
  },

  // Test session manager
  {
    file: 'src/lib/session/__tests__/manager-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { SessionManager } from '../manager';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    scan: jest.fn(),
    pipeline: jest.fn(() => ({
      del: jest.fn(),
      exec: jest.fn()
    }))
  }));
});

describe('Session Manager', () => {
  let sessionManager: SessionManager;
  let mockRedis: any;

  beforeEach(() => {
    sessionManager = new SessionManager();
    mockRedis = (sessionManager as any).redis;
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      mockRedis.set.mockResolvedValue('OK');

      const session = await sessionManager.createSession('user123', {
        role: 'admin',
        permissions: ['read', 'write']
      });

      expect(session.id).toMatch(/^sess_/);
      expect(session.userId).toBe('user123');
      expect(session.data.role).toBe('admin');
      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.stringContaining('session:'),
        expect.any(String),
        'EX',
        3600
      );
    });

    it('should handle custom TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await sessionManager.createSession('user123', {}, 7200);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        7200
      );
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      const sessionData = {
        id: 'sess_123',
        userId: 'user123',
        data: { role: 'admin' },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(sessionData));

      const session = await sessionManager.getSession('sess_123');

      expect(session).toEqual(sessionData);
      expect(mockRedis.get).toHaveBeenCalledWith('session:sess_123');
    });

    it('should return null for non-existent session', async () => {
      mockRedis.get.mockResolvedValue(null);

      const session = await sessionManager.getSession('invalid');

      expect(session).toBeNull();
    });

    it('should handle malformed session data', async () => {
      mockRedis.get.mockResolvedValue('invalid json');

      const session = await sessionManager.getSession('sess_123');

      expect(session).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session data', async () => {
      const existingSession = {
        id: 'sess_123',
        userId: 'user123',
        data: { role: 'user' },
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      };

      mockRedis.get.mockResolvedValue(JSON.stringify(existingSession));
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.ttl.mockResolvedValue(1800);

      const updated = await sessionManager.updateSession('sess_123', {
        role: 'admin',
        newField: 'value'
      });

      expect(updated).toBe(true);
      expect(mockRedis.set).toHaveBeenCalledWith(
        'session:sess_123',
        expect.stringContaining('"role":"admin"'),
        'EX',
        1800
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      mockRedis.del.mockResolvedValue(1);

      const result = await sessionManager.deleteSession('sess_123');

      expect(result).toBe(true);
      expect(mockRedis.del).toHaveBeenCalledWith('session:sess_123');
    });

    it('should return false for non-existent session', async () => {
      mockRedis.del.mockResolvedValue(0);

      const result = await sessionManager.deleteSession('invalid');

      expect(result).toBe(false);
    });
  });

  describe('getUserSessions', () => {
    it('should get all sessions for a user', async () => {
      const sessions = [
        { id: 'sess_1', userId: 'user123', data: {} },
        { id: 'sess_2', userId: 'user123', data: {} }
      ];

      mockRedis.scan.mockResolvedValue(['0', ['session:sess_1', 'session:sess_2']]);
      mockRedis.get.mockImplementation((key) => {
        const id = key.split(':')[1];
        const session = sessions.find(s => s.id === id);
        return Promise.resolve(session ? JSON.stringify(session) : null);
      });

      const userSessions = await sessionManager.getUserSessions('user123');

      expect(userSessions).toHaveLength(2);
      expect(userSessions[0].userId).toBe('user123');
    });
  });

  describe('extendSession', () => {
    it('should extend session TTL', async () => {
      mockRedis.expire.mockResolvedValue(1);

      const result = await sessionManager.extendSession('sess_123', 7200);

      expect(result).toBe(true);
      expect(mockRedis.expire).toHaveBeenCalledWith('session:sess_123', 7200);
    });
  });

  describe('cleanup', () => {
    it('should clean up expired sessions', async () => {
      const mockPipeline = {
        del: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([])
      };

      mockRedis.scan.mockResolvedValue(['0', ['session:sess_1', 'session:sess_2']]);
      mockRedis.get.mockImplementation(() => 
        Promise.resolve(JSON.stringify({
          expiresAt: new Date(Date.now() - 1000).toISOString()
        }))
      );
      mockRedis.pipeline.mockReturnValue(mockPipeline);

      const cleaned = await sessionManager.cleanup();

      expect(cleaned).toBe(2);
      expect(mockPipeline.del).toHaveBeenCalledTimes(2);
    });
  });
});`
  },

  // Test middleware
  {
    file: 'src/lib/auth/__tests__/middleware-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { authMiddleware, requireAuth, requireRole } from '../middleware';
import { NextRequest, NextResponse } from 'next/server';

// Mock auth utilities
jest.mock('../auth', () => ({
  verifyToken: jest.fn(),
  getSession: jest.fn()
}));

describe('Auth Middleware', () => {
  let mockRequest: NextRequest;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: new Headers(),
      cookies: {
        get: jest.fn()
      }
    } as any;
    mockNext = jest.fn(() => NextResponse.next());
  });

  describe('authMiddleware', () => {
    it('should allow public routes', async () => {
      mockRequest.nextUrl = { pathname: '/api/auth/signin' };

      const response = await authMiddleware(mockRequest, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(response).toBeDefined();
    });

    it('should check auth for protected routes', async () => {
      mockRequest.nextUrl = { pathname: '/api/users' };
      mockRequest.headers.set('Authorization', 'Bearer valid-token');

      const { verifyToken } = require('../auth');
      verifyToken.mockResolvedValue({ userId: 'user123' });

      const response = await authMiddleware(mockRequest, mockNext);

      expect(verifyToken).toHaveBeenCalledWith('valid-token');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should reject invalid tokens', async () => {
      mockRequest.nextUrl = { pathname: '/api/users' };
      mockRequest.headers.set('Authorization', 'Bearer invalid-token');

      const { verifyToken } = require('../auth');
      verifyToken.mockResolvedValue(null);

      const response = await authMiddleware(mockRequest, mockNext);

      expect(response.status).toBe(401);
    });
  });

  describe('requireAuth', () => {
    it('should pass with valid session', async () => {
      const handler = jest.fn((req) => NextResponse.json({ success: true }));
      const wrapped = requireAuth(handler);

      mockRequest.headers.set('Authorization', 'Bearer valid-token');
      
      const { getSession } = require('../auth');
      getSession.mockResolvedValue({ userId: 'user123', role: 'admin' });

      const response = await wrapped(mockRequest);

      expect(handler).toHaveBeenCalled();
      expect((mockRequest as any).session).toEqual({ userId: 'user123', role: 'admin' });
    });

    it('should reject without session', async () => {
      const handler = jest.fn();
      const wrapped = requireAuth(handler);

      const { getSession } = require('../auth');
      getSession.mockResolvedValue(null);

      const response = await wrapped(mockRequest);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
    });
  });

  describe('requireRole', () => {
    it('should allow users with required role', async () => {
      const handler = jest.fn((req) => NextResponse.json({ success: true }));
      const wrapped = requireRole(['admin', 'manager'])(handler);

      mockRequest.headers.set('Authorization', 'Bearer valid-token');
      
      const { getSession } = require('../auth');
      getSession.mockResolvedValue({ userId: 'user123', role: 'admin' });

      const response = await wrapped(mockRequest);

      expect(handler).toHaveBeenCalled();
    });

    it('should reject users without required role', async () => {
      const handler = jest.fn();
      const wrapped = requireRole(['admin'])(handler);

      const { getSession } = require('../auth');
      getSession.mockResolvedValue({ userId: 'user123', role: 'viewer' });

      const response = await wrapped(mockRequest);

      expect(handler).not.toHaveBeenCalled();
      expect(response.status).toBe(403);
    });
  });
});`
  }
];

async function testAuthServices() {
  console.log('🚀 Creating auth service tests...\n');
  
  for (const test of authTests) {
    try {
      const dir = path.dirname(test.file);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(test.file, test.content);
      console.log(`✅ Created: ${test.file}`);
    } catch (error) {
      console.error(`❌ Error creating ${test.file}:`, error.message);
    }
  }
  
  console.log('\n✨ Auth service tests created!');
}

testAuthServices().catch(console.error);