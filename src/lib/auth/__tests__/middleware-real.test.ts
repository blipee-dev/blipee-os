import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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
});