import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@simplewebauthn/server', () => ({
  generateRegistrationOptions: jest.fn()
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() }
  }))
}));

describe('POST /api/auth/webauthn/register/options', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  it('should generate registration options', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null
    });

    const mockOptions = {
      challenge: 'challenge123',
      rp: { name: 'Blipee OS', id: 'localhost' },
      user: { id: 'user123', name: 'test@example.com', displayName: 'Test User' },
      pubKeyCredParams: [],
      timeout: 60000,
      attestation: 'direct'
    };

    const { generateRegistrationOptions } = require('@simplewebauthn/server');
    generateRegistrationOptions.mockResolvedValue(mockOptions);

    const request = new NextRequest('http://localhost:3000/api/auth/webauthn/register/options', {
      method: 'POST'
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.challenge).toBeDefined();
    expect(data.user.id).toBe('user123');
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    });

    const request = new NextRequest('http://localhost:3000/api/auth/webauthn/register/options', {
      method: 'POST'
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});