import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import * as speakeasy from 'speakeasy';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        }))
      })),
      update: jest.fn(() => ({ data: null, error: null }))
    }))
  }))
}));

jest.mock('speakeasy');

describe('POST /api/auth/mfa/setup', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  it('should setup TOTP MFA', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123', email: 'test@example.com' } },
      error: null
    });

    (speakeasy.generateSecret as jest.Mock).mockReturnValue({
      base32: 'JBSWY3DPEHPK3PXP',
      otpauth_url: 'otpauth://totp/Test:test@example.com?secret=JBSWY3DPEHPK3PXP'
    });

    const request = new NextRequest('http://localhost:3000/api/auth/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({ type: 'totp' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.secret).toBeDefined();
    expect(data.qrCode).toBeDefined();
  });

  it('should setup SMS MFA', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/auth/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({
        type: 'sms',
        phoneNumber: '+1234567890'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.phoneNumber).toBe('+1234567890');
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    });

    const request = new NextRequest('http://localhost:3000/api/auth/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({ type: 'totp' })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should validate MFA type', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/auth/mfa/setup', {
      method: 'POST',
      body: JSON.stringify({ type: 'invalid' })
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});