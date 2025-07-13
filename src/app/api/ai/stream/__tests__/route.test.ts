import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() }
  }))
}));

jest.mock('@/lib/ai/service', () => ({
  AIService: jest.fn(() => ({
    streamResponse: jest.fn()
  }))
}));

describe('POST /api/ai/stream', () => {
  let mockSupabase: any;
  let mockAIService: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = require('@/lib/supabase/server').createClient();
    mockAIService = new (require('@/lib/ai/service').AIService)();
  });

  it('should stream AI response', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    const mockStream = new ReadableStream();
    mockAIService.streamResponse.mockResolvedValue(mockStream);

    const _request = new NextRequest('http://localhost:3000/api/ai/stream', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
        buildingId: 'building123'
      })
    });

    const response = await POST(request);
    
    expect(response.headers.get('content-type')).toBe('text/event-stream');
    expect(mockAIService.streamResponse).toHaveBeenCalled();
  });

  it('should require authentication', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' }
    });

    const _request = new NextRequest('http://localhost:3000/api/ai/stream', {
      method: 'POST',
      body: JSON.stringify({ messages: [] })
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('should validate request body', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user123' } },
      error: null
    });

    const _request = new NextRequest('http://localhost:3000/api/ai/stream', {
      method: 'POST',
      body: JSON.stringify({}) // Missing messages
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});