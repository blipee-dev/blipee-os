import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signInWithOAuth: jest.fn()
    }
  }))
}));

jest.mock('@/lib/audit/logger', () => ({
  auditLogger: { log: jest.fn() }
}));

describe('POST /api/auth/signin', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  it('should sign in with email/password', async () => {
    const mockSession = {
      user: { id: 'user123', email: 'test@example.com' },
      access_token: 'token123',
      refresh_token: 'refresh123'
    };

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'SecurePass123!'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.session).toBeDefined();
    expect(data.user.email).toBe('test@example.com');
  });

  it('should handle invalid credentials', async () => {
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid login credentials' }
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrong'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should validate email format', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'password'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should log authentication attempts', async () => {
    const { auditLogger } = require('@/lib/audit/logger');

    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: {} },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password'
      })
    });

    await POST(request);
    expect(auditLogger.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'auth.signin',
        email: 'test@example.com'
      })
    );
  });
});