import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn()
    }
  }))
}));

describe('Signin API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    const { createClient } = require('@/lib/supabase/server');
    mockSupabase = createClient();
  });

  it('should sign in user', async () => {
    const mockSession = {
      user: { id: 'user123', email: 'test@example.com' },
      access_token: 'token123'
    };
    
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { session: mockSession },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.session).toBeDefined();
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

  it('should validate request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com'
        // Missing password
      })
    });

    const response = await POST(request);
    
    expect(response.status).toBe(400);
  });
});