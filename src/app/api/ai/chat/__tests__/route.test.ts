import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => ({ data: null, error: null }))
    }))
  }))
}));

describe('POST /api/ai/chat', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  it('should process chat message', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    const _request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'What is the energy usage?' }],
        conversationId: 'conv123',
        buildingId: 'building123'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('message');
    expect(data).toHaveProperty('conversationId');
  });

  it('should handle document attachments', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    const _request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Analyze this document' }],
        documents: ['doc123'],
        conversationId: 'conv123'
      })
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should enforce rate limits', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    // Simulate rate limit exceeded
    const _request = new NextRequest('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'X-Rate-Limit-Exceeded': 'true' },
      body: JSON.stringify({ messages: [] })
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
  });
});