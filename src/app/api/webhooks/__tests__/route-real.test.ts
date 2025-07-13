import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { WebhookService } from '@/lib/webhooks/webhook-service';

jest.mock('@/lib/webhooks/webhook-service');
jest.mock('@/lib/auth/middleware', () => ({
  requireAuth: (handler: any) => handler,
  requireRole: (roles: string[]) => (handler: any) => handler
}));

describe('Webhooks API', () => {
  let mockWebhookService: jest.Mocked<WebhookService>;

  beforeEach(() => {
    mockWebhookService = new WebhookService() as jest.Mocked<WebhookService>;
    (WebhookService as jest.Mock).mockImplementation(() => mockWebhookService);
  });

  describe('GET /api/webhooks', () => {
    it('should return webhooks list', async () => {
      const mockWebhooks = [
        {
          id: 'webhook1',
          url: 'https://example.com/hook1',
          events: ['user.created'],
          active: true
        },
        {
          id: 'webhook2',
          url: 'https://example.com/hook2',
          events: ['org.updated'],
          active: false
        }
      ];

      mockWebhookService.listWebhooks.mockResolvedValue(mockWebhooks);

      const _request = new NextRequest('http://localhost:3000/api/webhooks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockWebhooks);
    });

    it('should handle service errors', async () => {
      mockWebhookService.listWebhooks.mockRejectedValue(
        new Error('Database error')
      );

      const _request = new NextRequest('http://localhost:3000/api/webhooks');
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe('POST /api/webhooks', () => {
    it('should create new webhook', async () => {
      const newWebhook = {
        id: 'webhook123',
        url: 'https://example.com/webhook',
        events: ['user.created', 'user.updated'],
        secret: 'secret123',
        active: true
      };

      mockWebhookService.createWebhook.mockResolvedValue(newWebhook);

      const _request = new NextRequest('http://localhost:3000/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/webhook',
          events: ['user.created', 'user.updated']
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.url).toBe('https://example.com/webhook');
      expect(data.secret).toBeDefined();
    });

    it('should validate webhook URL', async () => {
      const _request = new NextRequest('http://localhost:3000/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: 'not-a-url',
          events: ['user.created']
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should validate events array', async () => {
      const _request = new NextRequest('http://localhost:3000/api/webhooks', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://example.com/webhook',
          events: [] // Empty events
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});