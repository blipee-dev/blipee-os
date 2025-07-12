import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, POST } from '../route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/graphql/server', () => ({
  graphqlServer: {
    executeOperation: jest.fn()
  }
}));

describe('GraphQL API', () => {
  let mockGraphQL: any;

  beforeEach(() => {
    mockGraphQL = require('@/lib/graphql/server').graphqlServer;
  });

  describe('POST /api/graphql', () => {
    it('should execute GraphQL query', async () => {
      mockGraphQL.executeOperation.mockResolvedValue({
        body: {
          kind: 'single',
          singleResult: {
            data: {
              user: { id: 'user123', name: 'Test User' }
            }
          }
        }
      });

      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: '{ user(id: "user123") { id name } }'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.user.name).toBe('Test User');
    });

    it('should handle GraphQL errors', async () => {
      mockGraphQL.executeOperation.mockResolvedValue({
        body: {
          kind: 'single',
          singleResult: {
            errors: [{ message: 'Field not found' }]
          }
        }
      });

      const request = new NextRequest('http://localhost:3000/api/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: '{ invalidField }'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.errors).toBeDefined();
    });
  });

  describe('GET /api/graphql', () => {
    it('should serve GraphQL playground', async () => {
      const request = new NextRequest('http://localhost:3000/api/graphql');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
    });
  });
});