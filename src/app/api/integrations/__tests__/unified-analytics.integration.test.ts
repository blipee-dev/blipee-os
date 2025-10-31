/**
 * Integration Tests for Unified Analytics API
 *
 * Tests the full integration of the unified analytics endpoint including:
 * - Performance optimization (caching, query optimization)
 * - Data aggregation from multiple systems
 * - Error handling and validation
 * - Rate limiting
 */

import { GET } from '../unified-analytics/route';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
jest.mock('@/lib/auth/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Unified Analytics API - Integration Tests', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Setup Supabase mock
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Unauthorized'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBeDefined();
    });

    it('should allow authenticated users', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      // Mock organization membership
      const mockOrgQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-123' },
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockOrgQuery);

      // Mock analytics data queries
      const mockDataQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return mockOrgQuery;
        return mockDataQuery;
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should validate organization membership', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      // Mock no organization membership
      const mockOrgQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Not found'),
        }),
      };

      mockSupabase.from.mockReturnValue(mockOrgQuery);

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toMatch(/organization/i);
    });
  });

  describe('Query Parameter Validation', () => {
    beforeEach(() => {
      // Mock authenticated user with organization
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockOrgQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-123' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return mockOrgQuery;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
    });

    it('should validate days_back parameter', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=invalid'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/invalid.*parameter/i);
    });

    it('should enforce minimum days_back value', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=0'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/days_back.*minimum/i);
    });

    it('should enforce maximum days_back value', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=400'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/days_back.*maximum/i);
    });

    it('should use default days_back when not provided', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      // Default should be 30 days
    });

    it('should accept valid days_back values', async () => {
      const validValues = [1, 7, 30, 90, 180, 365];

      for (const days of validValues) {
        const request = new NextRequest(
          `http://localhost:3000/api/integrations/unified-analytics?days_back=${days}`
        );

        const response = await GET(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Data Aggregation', () => {
    beforeEach(() => {
      // Mock authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockOrgQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-123' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return mockOrgQuery;
      });
    });

    it('should aggregate agent execution metrics', async () => {
      const mockAgentData = [
        {
          agent_id: 'agent-1',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
        {
          agent_id: 'agent-2',
          status: 'completed',
          created_at: new Date().toISOString(),
        },
        {
          agent_id: 'agent-1',
          status: 'failed',
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'agent_task_executions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({
              data: mockAgentData,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.agents).toBeDefined();
      expect(data.agents.totalExecutions).toBe(3);
      expect(data.agents.successRate).toBeCloseTo(66.67, 1);
    });

    it('should aggregate ML model predictions', async () => {
      const mockMLData = [
        {
          model_id: 'prophet-v1',
          created_at: new Date().toISOString(),
          metadata: { accuracy: 0.92 },
        },
        {
          model_id: 'prophet-v1',
          created_at: new Date().toISOString(),
          metadata: { accuracy: 0.88 },
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'ml_predictions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({
              data: mockMLData,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.mlModels).toBeDefined();
      expect(data.mlModels.totalPredictions).toBe(2);
      expect(data.mlModels.avgAccuracy).toBeCloseTo(90, 0);
    });

    it('should aggregate conversation metrics', async () => {
      const mockConversations = [
        {
          id: 'conv-1',
          type: 'user_chat',
          created_at: new Date().toISOString(),
        },
        {
          id: 'conv-2',
          type: 'agent_proactive',
          created_at: new Date().toISOString(),
        },
        {
          id: 'conv-3',
          type: 'user_chat',
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({
              data: mockConversations,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.conversations).toBeDefined();
      expect(data.conversations.totalConversations).toBe(3);
    });

    it('should generate AI recommendations based on metrics', async () => {
      // Mock data showing low agent success rate
      const mockAgentData = Array.from({ length: 10 }, (_, i) => ({
        agent_id: 'agent-1',
        status: i < 5 ? 'completed' : 'failed',
        created_at: new Date().toISOString(),
      }));

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'agent_task_executions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({
              data: mockAgentData,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.recommendations).toBeDefined();
      expect(Array.isArray(data.recommendations)).toBe(true);

      // Should recommend investigating agent failures
      const hasAgentRecommendation = data.recommendations.some(
        (rec: any) => rec.category === 'agents' && rec.priority === 'high'
      );
      expect(hasAgentRecommendation).toBe(true);
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockOrgQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-123' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return mockOrgQuery;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
    });

    it('should respond within performance budget (< 200ms)', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const startTime = Date.now();
      const response = await GET(request);
      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(200);
    });

    it('should cache identical requests', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      // First request
      const start1 = Date.now();
      await GET(request);
      const duration1 = Date.now() - start1;

      // Second request (should be cached)
      const start2 = Date.now();
      await GET(request);
      const duration2 = Date.now() - start2;

      // Cached request should be significantly faster
      expect(duration2).toBeLessThan(duration1 / 2);
    });

    it('should execute parallel queries for better performance', async () => {
      let queryCounts = {
        agents: 0,
        ml: 0,
        conversations: 0,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'agent_task_executions') queryCounts.agents++;
        if (table === 'ml_predictions') queryCounts.ml++;
        if (table === 'conversations') queryCounts.conversations++;

        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      await GET(request);

      // Should query all systems
      expect(queryCounts.agents).toBeGreaterThan(0);
      expect(queryCounts.ml).toBeGreaterThan(0);
      expect(queryCounts.conversations).toBeGreaterThan(0);
    });

    it('should include cache headers in response', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);

      expect(response.headers.get('Cache-Control')).toBeDefined();
      expect(response.headers.get('ETag')).toBeDefined();
    });

    it('should support conditional requests with If-None-Match', async () => {
      const request1 = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response1 = await GET(request1);
      const etag = response1.headers.get('ETag');

      const request2 = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30',
        {
          headers: {
            'If-None-Match': etag || '',
          },
        }
      );

      const response2 = await GET(request2);

      expect(response2.status).toBe(304); // Not Modified
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockOrgQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-123' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return mockOrgQuery;
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database connection failed'),
        }),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should handle partial failures in data aggregation', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'agent_task_executions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            lte: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Agent query failed'),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);

      // Should still return 200 with partial data
      expect(response.status).toBe(200);
    });

    it('should return meaningful error messages', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Invalid token'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics'
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/unauthorized|authentication/i);
      expect(data.message).toBeDefined();
    });

    it('should log errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockRejectedValue(new Error('Unexpected error')),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      await GET(request);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      });

      const mockOrgQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-123' },
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') return mockOrgQuery;
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          gte: jest.fn().mockReturnThis(),
          lte: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      });
    });

    it('should include rate limit headers', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
      );

      const response = await GET(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
    });

    it('should enforce rate limits per user', async () => {
      const requests = Array.from({ length: 60 }, () =>
        new NextRequest(
          'http://localhost:3000/api/integrations/unified-analytics?days_back=30'
        )
      );

      const responses = await Promise.all(requests.map(req => GET(req)));

      // Some requests should be rate limited (assuming limit < 60)
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
