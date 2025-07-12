import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { WebhookService } from '@/lib/webhooks/webhook-service';

jest.mock('@/lib/webhooks/webhook-service');
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn() }
  }))
}));

describe('Webhooks API', () => {
  let mockWebhookService: jest.Mocked<WebhookService>;
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockWebhookService = new WebhookService() as jest.Mocked<WebhookService>;
    (WebhookService as jest.Mock).mockImplementation(() => mockWebhookService);
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  describe('GET /api/webhooks', () => {
    it('should list user webhooks', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const mockWebhooks = [
        {
          id: 'webhook1',
          url: 'https://example.com/hook1',
          events: ['user.created', 'user.updated'],
          active: true,
          created_at: new Date()
        }
      ];

      mockWebhookService.listWebhooks.mockResolvedValue(mockWebhooks);

      const request = new NextRequest('http://localhost:3000/api/webhooks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].url).toBe('https://example.com/hook1');
    });

    it('should filter by active status', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      mockWebhookService.listWebhooks.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/webhooks?active=true');
      await GET(request);

      expect(mockWebhookService.listWebhooks).toHaveBeenCalledWith({
        userId: 'user123',
        active: true
      });
    });
  });

  describe('POST /api/webhooks', () => {
    it('should create new webhook', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const newWebhook = {
        id: 'webhook123',
        url: 'https://example.com/webhook',
        events: ['user.created'],
        secret: 'whsec_123',
        active: true
      };

      mockWebhookService.createWebhook.mockResolvedValue(newWebhook);

      const request = new NextRequest('http://localhost:3000/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/webhook',
          events: ['user.created']
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.url).toBe('https://example.com/webhook');
      expect(data.secret).toBeDefined();
    });

    it('should validate webhook URL', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: 'not-a-valid-url',
          events: ['user.created']
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should require HTTPS URLs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: 'http://example.com/webhook',
          events: ['user.created']
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});