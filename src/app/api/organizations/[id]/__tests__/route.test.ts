import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { GET, PATCH } from '../route';
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
      update: jest.fn(() => ({
        eq: jest.fn(() => ({ data: null, error: null }))
      }))
    }))
  }))
}));

describe('Organization API', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = require('@/lib/supabase/server').createClient();
  });

  describe('GET /api/organizations/[id]', () => {
    it('should return organization details', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      const mockOrg = {
        id: 'org123',
        name: 'Test Organization',
        description: 'Test description',
        settings: {},
        member_count: 5
      };

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: mockOrg,
        error: null
      });

      const _request = new NextRequest('http://localhost:3000/api/organizations/org123');
      const response = await GET(request, { params: { id: 'org123' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Test Organization');
    });

    it('should check user access', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Not found' }
      });

      const _request = new NextRequest('http://localhost:3000/api/organizations/org123');
      const response = await GET(request, { params: { id: 'org123' } });

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/organizations/[id]', () => {
    it('should update organization', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null
      });

      mockSupabase.from().update().eq.mockResolvedValue({
        data: { id: 'org123', name: 'Updated Org' },
        error: null
      });

      const _request = new NextRequest('http://localhost:3000/api/organizations/org123', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Org',
          description: 'New description'
        })
      });

      const response = await PATCH(request, { params: { id: 'org123' } });
      expect(response.status).toBe(200);
    });
  });
});