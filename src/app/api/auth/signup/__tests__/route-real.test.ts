import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn()
    },
    from: jest.fn(() => ({
      insert: jest.fn()
    }))
  }))
}));

describe('Signup API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    const { createClient } = require('@/lib/supabase/server');
    mockSupabase = createClient();
  });

  it('should create new user', async () => {
    const mockUser = { id: 'user123', email: 'new@example.com' };
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: mockUser },
      _error: null
    });
    mockSupabase.from().insert.mockResolvedValue({
      data: { id: 'profile123' },
      _error: null
    });

    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'SecurePass123!',
        fullName: 'New User'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.user).toEqual(mockUser);
  });

  it('should validate email format', async () => {
    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invalid-email',
        password: 'SecurePass123!'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });

  it('should validate password strength', async () => {
    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak'
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });

  it('should handle duplicate email', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      _error: { message: 'User already registered' }
    });

    const _request = new NextRequest('http://localhost:3000/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'existing@example.com',
        password: 'SecurePass123!'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('already registered');
  });
});