import { describe, it, expect, jest, beforeEach } from '@jest/globals';
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
          _error: null
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {},
            _error: null
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
        _error: null
      });

      const mockOrgs = [
        { id: 'org1', name: 'Org 1', role: 'admin' },
        { id: 'org2', name: 'Org 2', role: 'member' }
      ];

      mockSupabase.from().select().eq.mockResolvedValue({
        data: mockOrgs,
        _error: null
      });

      const _request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockOrgs);
    });

    it('should handle unauthorized requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        _error: { message: 'Not authenticated' }
      });

      const _request = new NextRequest('http://localhost:3000/api/organizations');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/organizations', () => {
    it('should create new organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        _error: null
      });

      const newOrg = {
        id: 'org123',
        name: 'New Organization',
        created_by: 'user123'
      };

      mockSupabase.from().insert().select().single.mockResolvedValue({
        data: newOrg,
        _error: null
      });

      const _request = new NextRequest('http://localhost:3000/api/organizations', {
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
        _error: null
      });

      const _request = new NextRequest('http://localhost:3000/api/organizations', {
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
});