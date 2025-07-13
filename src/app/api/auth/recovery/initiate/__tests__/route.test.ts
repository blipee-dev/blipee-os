import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/auth/recovery/service', () => ({
  RecoveryService: jest.fn(() => ({
    initiateRecovery: jest.fn(),
    sendRecoveryEmail: jest.fn(),
    sendRecoverySMS: jest.fn()
  }))
}));

describe('POST /api/auth/recovery/initiate', () => {
  let mockRecoveryService: any;

  beforeEach(() => {
    mockRecoveryService = new (require('@/lib/auth/recovery/service').RecoveryService)();
  });

  it('should initiate email recovery', async () => {
    mockRecoveryService.initiateRecovery.mockResolvedValue({
      recoveryId: 'rec123',
      method: 'email',
      maskedEmail: 't***@example.com'
    });

    const _request = new NextRequest('http://localhost:3000/api/auth/recovery/initiate', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        method: 'email'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.recoveryId).toBeDefined();
    expect(data.maskedEmail).toBe('t***@example.com');
  });

  it('should initiate SMS recovery', async () => {
    mockRecoveryService.initiateRecovery.mockResolvedValue({
      recoveryId: 'rec456',
      method: 'sms',
      maskedPhone: '***-***-1234'
    });

    const _request = new NextRequest('http://localhost:3000/api/auth/recovery/initiate', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        method: 'sms'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should handle non-existent account', async () => {
    mockRecoveryService.initiateRecovery.mockResolvedValue(null);

    const _request = new NextRequest('http://localhost:3000/api/auth/recovery/initiate', {
      method: 'POST',
      body: JSON.stringify({
        email: 'notfound@example.com',
        method: 'email'
      })
    });

    const response = await POST(request);
    // Should return success to prevent user enumeration
    expect(response.status).toBe(200);
  });
});