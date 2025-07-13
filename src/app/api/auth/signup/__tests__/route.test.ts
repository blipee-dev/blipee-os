import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { signUp: jest.fn() },
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ data: null, error: null }))
    }))
  }))
}));

describe('POST /api/auth/signup', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  it('should create new user account', async () => {
    const mockUser = {
      id: 'user123',
      email: 'new@example.com',
      user_metadata: { full_name: 'New User' }
    };

    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'SecurePass123!',
        fullName: 'New User',
        organizationName: 'Test Org'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user.email).toBe('new@example.com');
    expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles');
  });

  it('should validate password strength', async () => {
    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        fullName: 'Test User'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('password');
  });

  it('should handle duplicate email', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' }
    });

    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'SecurePass123!',
        fullName: 'Test User'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('should create organization if provided', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'SecurePass123!',
        fullName: 'New User',
        organizationName: 'New Org'
      })
    });

    await POST(request);
    expect(mockSupabase.from).toHaveBeenCalledWith('organizations');
  });
});