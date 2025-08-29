import { GET, POST } from '../route';
import { NextRequest } from 'next/server';
import { jest } from '@jest/globals';

// Mock auth
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(() => ({ 
        data: { user: { id: 'user-1' } }, 
        _error: null 
      }))
    }
  }))
}));

// Mock API key service
jest.mock('@/lib/api/gateway/api-key-service', () => ({
  listApiKeys: jest.fn(() => Promise.resolve([
    { id: 'key-1', name: 'Production Key', created_at: '2024-01-01' },
    { id: 'key-2', name: 'Development Key', created_at: '2024-01-02' }
  ])),
  createApiKey: jest.fn(() => Promise.resolve({
    id: 'key-3',
    key: 'sk_test_123456',
    name: 'New Key'
  }))
}));


// Mock Next.js Request/Response
global.Request = class Request {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Map(Object.entries(init.headers || {}));
    this.body = init.body;
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.headers = new Map(Object.entries(init.headers || {}));
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
  }
};

describe('API Keys endpoint', () => {
  describe('GET /api/gateway/keys', () => {
    it('should return list of API keys', async () => {
      const _request = new NextRequest('http://localhost:3000/api/gateway/keys');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty('name', 'Production Key');
    });

    it('should require authentication', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        auth: {
          getUser: jest.fn(() => ({ 
            data: { user: null }, 
            _error: new Error('Not authenticated') 
          }))
        }
      });

      const _request = new NextRequest('http://localhost:3000/api/gateway/keys');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/gateway/keys', () => {
    it('should create new API key', async () => {
      const _request = new NextRequest('http://localhost:3000/api/gateway/keys', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Key',
          scopes: ['read', 'write']
        })
      });

      const response = await POST(request);
      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data).toHaveProperty('key');
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('New Key');
    });

    it('should validate request body', async () => {
      const _request = new NextRequest('http://localhost:3000/api/gateway/keys', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should require authentication', async () => {
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        auth: {
          getUser: jest.fn(() => ({ 
            data: { user: null }, 
            _error: new Error('Not authenticated') 
          }))
        }
      });

      const _request = new NextRequest('http://localhost:3000/api/gateway/keys', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' })
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });
});