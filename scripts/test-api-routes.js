#!/usr/bin/env node

/**
 * Test API routes for coverage boost
 */

const fs = require('fs').promises;
const path = require('path');

const apiRouteTests = [
  // Health check route
  {
    file: 'src/app/api/health/__tests__/route-real.test.ts',
    content: `import { describe, it, expect, jest } from '@jest/globals';
import { GET } from '../route';
import { NextRequest } from 'next/server';

describe('Health Check API', () => {
  it('should return health status', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'healthy');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
  });

  it('should include environment info', async () => {
    const request = new NextRequest('http://localhost:3000/api/health');
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('environment');
    expect(data.environment).toBe(process.env.NODE_ENV || 'development');
  });
});`
  },

  // Auth signup route
  {
    file: 'src/app/api/auth/signup/__tests__/route-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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
      error: null
    });
    mockSupabase.from().insert.mockResolvedValue({
      data: { id: 'profile123' },
      error: null
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
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
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
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
    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
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
      error: { message: 'User already registered' }
    });

    const request = new NextRequest('http://localhost:3000/api/auth/signup', {
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
});`
  },

  // Auth signin route
  {
    file: 'src/app/api/auth/signin/__tests__/route-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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
});`
  },

  // Organizations API
  {
    file: 'src/app/api/organizations/__tests__/route-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            error: null
          }))
        }))
      }))
    }))
  }))
}));

describe('Organizations API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    const { createClient } = require('@/lib/supabase/server');
    mockSupabase = createClient();
  });

  describe('GET /api/organizations', () => {
    it('should return user organizations', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const mockOrgs = [
        { id: 'org1', name: 'Org 1', role: 'admin' },
        { id: 'org2', name: 'Org 2', role: 'member' }
      ];

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockOrgs,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockOrgs);
    });

    it('should handle unauthorized requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' }
      });

      const request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/organizations', () => {
    it('should create new organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const newOrg = {
        id: 'org123',
        name: 'New Organization',
        created_by: 'user123'
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newOrg,
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Organization',
          description: 'Test org'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('New Organization');
    });

    it('should validate organization name', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const request = new NextRequest('http://localhost:3000/api/organizations', {
        method: 'POST',
        body: JSON.stringify({
          // Missing name
          description: 'Test'
        })
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});`
  },

  // Webhooks API
  {
    file: 'src/app/api/webhooks/__tests__/route-real.test.ts',
    content: `import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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

      const request = new NextRequest('http://localhost:3000/api/webhooks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockWebhooks);
    });

    it('should handle service errors', async () => {
      mockWebhookService.listWebhooks.mockRejectedValue(
        new Error('Database error')
      );

      const request = new NextRequest('http://localhost:3000/api/webhooks');
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

      const request = new NextRequest('http://localhost:3000/api/webhooks', {
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
      const request = new NextRequest('http://localhost:3000/api/webhooks', {
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
      const request = new NextRequest('http://localhost:3000/api/webhooks', {
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
});`
  }
];

async function testApiRoutes() {
  console.log('🚀 Creating API route tests...\n');
  
  for (const test of apiRouteTests) {
    try {
      const dir = path.dirname(test.file);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(test.file, test.content);
      console.log(`✅ Created: ${test.file}`);
    } catch (error) {
      console.error(`❌ Error creating ${test.file}:`, error.message);
    }
  }
  
  console.log('\n✨ API route tests created!');
}

testApiRoutes().catch(console.error);