import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Mock implementations
export const mockSupabaseAdmin = {
  auth: {
    admin: {
      getUserById: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      updateUserById: jest.fn(),
      listUsers: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    range: jest.fn().mockReturnThis(),
  })),
};

export const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
};

// Helper to create authenticated requests
export function createAuthenticatedRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    userId?: string;
    sessionToken?: string;
  } = {}
) {
  const { method = 'GET', body, headers: customHeaders = {}, userId = 'test-user-id', sessionToken = 'test-session-token' } = options;

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`,
    'X-User-Id': userId,
    ...customHeaders,
  });

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Helper to create API context
export function createApiContext(overrides: any = {}) {
  return {
    params: {},
    searchParams: new URLSearchParams(),
    ...overrides,
  };
}

// Common test assertions
export const assertAuthRequired = async (
  handler: Function,
  request: NextRequest,
  context: any = {}
) => {
  const unauthRequest = new NextRequest(request.url, {
    method: request.method,
    body: request.body,
  });
  
  const response = await handler(unauthRequest, context);
  expect(response.status).toBe(401);
  const data = await response.json();
  expect(data.error).toContain('Authentication required');
};

export const assertRateLimited = async (
  handler: Function,
  request: NextRequest,
  context: any = {},
  limit: number = 10
) => {
  // Make requests up to the limit
  for (let i = 0; i < limit; i++) {
    const response = await handler(request, context);
    expect(response.status).toBeLessThan(429);
  }
  
  // Next request should be rate limited
  const response = await handler(request, context);
  expect(response.status).toBe(429);
  const data = await response.json();
  expect(data.error).toContain('Rate limit exceeded');
};

export const assertValidation = async (
  handler: Function,
  request: NextRequest,
  context: any = {},
  expectedErrors: string[]
) => {
  const response = await handler(request, context);
  expect(response.status).toBe(400);
  const data = await response.json();
  
  expectedErrors.forEach(error => {
    expect(data.error).toContain(error);
  });
};

// Security test helpers
export const testSqlInjection = async (
  handler: Function,
  paramName: string,
  context: any = {}
) => {
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "1'; DELETE FROM organizations WHERE '1'='1",
    "admin'--",
    "1' UNION SELECT * FROM users--",
  ];

  for (const payload of sqlInjectionPayloads) {
    const request = createAuthenticatedRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: { [paramName]: payload },
    });
    
    const response = await handler(request, context);
    expect(response.status).not.toBe(500); // Should not cause server error
    
    // Verify no data was actually deleted/modified
    const data = await response.json();
    expect(data.error).toBeDefined(); // Should have validation error
  }
};

export const testXssProtection = async (
  handler: Function,
  paramName: string,
  context: any = {}
) => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    '<svg onload=alert("XSS")>',
    'javascript:alert("XSS")',
    '<iframe src="javascript:alert(\'XSS\')">',
  ];

  for (const payload of xssPayloads) {
    const request = createAuthenticatedRequest('http://localhost:3000/api/test', {
      method: 'POST',
      body: { [paramName]: payload },
    });
    
    const response = await handler(request, context);
    const data = await response.json();
    
    // Verify payload is escaped or rejected
    if (response.status === 200) {
      expect(data[paramName]).not.toContain('<script>');
      expect(data[paramName]).not.toContain('javascript:');
    }
  }
};

// Performance test helpers
export const measureResponseTime = async (
  handler: Function,
  request: NextRequest,
  context: any = {},
  maxTimeMs: number = 500
) => {
  const start = performance.now();
  await handler(request, context);
  const end = performance.now();
  
  const responseTime = end - start;
  expect(responseTime).toBeLessThan(maxTimeMs);
  return responseTime;
};

export const testConcurrentRequests = async (
  handler: Function,
  request: NextRequest,
  context: any = {},
  concurrentCount: number = 100
) => {
  const requests = Array(concurrentCount).fill(null).map(() => 
    measureResponseTime(handler, request, context, 1000)
  );
  
  const responseTimes = await Promise.all(requests);
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  
  expect(avgResponseTime).toBeLessThan(500); // Average should be under 500ms
  return { responseTimes, avgResponseTime };
};

// Mock data generators
export const generateMockUser = (overrides = {}) => ({
  id: 'user-' + Math.random().toString(36).substr(2, 9),
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const generateMockOrganization = (overrides = {}) => ({
  id: 'org-' + Math.random().toString(36).substr(2, 9),
  name: 'Test Organization',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const generateMockApiKey = (overrides = {}) => ({
  id: 'key-' + Math.random().toString(36).substr(2, 9),
  key: 'sk_test_' + Math.random().toString(36).substr(2, 32),
  name: 'Test API Key',
  permissions: ['read', 'write'],
  created_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});