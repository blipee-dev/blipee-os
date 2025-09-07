/**
 * End-to-End AI Conversation Flow Tests
 * Simulates real user interactions with the AI system
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';

describe('E2E: AI Conversation Flow', () => {
  const baseURL = process.env.API_URL || 'http://localhost:3000';
  let authToken: string;
  let conversationId: string;
  let organizationId: string = 'test-org-e2e';
  let userId: string = 'test-user-e2e';

  beforeAll(async () => {
    // In a real test, we would authenticate and get a real token
    authToken = 'mock-auth-token';
    conversationId = `conv-${Date.now()}`;
  });

  describe('Basic Conversation Flow', () => {
    it('should handle initial greeting', async () => {
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Hello, I need help with my sustainability goals',
          organizationId,
          conversationId
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.message.toLowerCase()).toContain('sustainability');
      expect(response.body.suggestions).toBeInstanceOf(Array);
    });

    it('should remember conversation context', async () => {
      // First message: Set context
      await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'My company goal is to achieve net zero by 2030',
          organizationId,
          conversationId
        });

      // Second message: Reference context
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What steps should I take to reach my goal?',
          organizationId,
          conversationId
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('2030');
      expect(response.body.message).toContain('net zero');
    });

    it('should provide data visualizations', async () => {
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Show me a chart of my monthly emissions',
          organizationId,
          conversationId
        });

      expect(response.status).toBe(200);
      expect(response.body.components).toBeDefined();
      expect(response.body.components.length).toBeGreaterThan(0);
      
      const chartComponent = response.body.components.find(
        (c: any) => c.type === 'chart'
      );
      expect(chartComponent).toBeDefined();
      expect(chartComponent.props.data).toBeDefined();
    });
  });

  describe('Document Processing Flow', () => {
    it('should process uploaded sustainability report', async () => {
      const mockPdfBase64 = 'JVBERi0xLjQKJeLjz9MKCg=='; // Mock PDF header
      
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I uploaded my sustainability report, can you analyze it?',
          organizationId,
          conversationId,
          attachments: [{
            name: 'sustainability-report-2024.pdf',
            type: 'application/pdf',
            data: mockPdfBase64
          }]
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('report');
      expect(response.body.message).toContain('analyzed');
    });

    it('should extract emissions data from documents', async () => {
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What emissions data did you find in the report?',
          organizationId,
          conversationId
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatch(/\d+.*tons|tonnes.*CO2/i);
    });
  });

  describe('Advanced AI Capabilities', () => {
    it('should provide predictive analytics', async () => {
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Predict my emissions for next quarter',
          organizationId,
          conversationId
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('predict');
      expect(response.body.components).toBeDefined();
      
      // Should include confidence level
      expect(response.body.confidence).toBeDefined();
      expect(response.body.confidence).toBeGreaterThan(0);
      expect(response.body.confidence).toBeLessThanOrEqual(1);
    });

    it('should use chain of thought for complex queries', async () => {
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Create a comprehensive plan to reduce our Scope 1, 2, and 3 emissions by 50% in 2 years',
          organizationId,
          conversationId
        });

      expect(response.status).toBe(200);
      expect(response.body.reasoning).toBeDefined();
      expect(response.body.reasoning).toBeInstanceOf(Array);
      expect(response.body.actions).toBeDefined();
      expect(response.body.actions.length).toBeGreaterThan(0);
      
      // Each action should have priority and impact
      response.body.actions.forEach((action: any) => {
        expect(action.priority).toBeDefined();
        expect(action.impact).toBeDefined();
      });
    });

    it('should generate comprehensive reports', async () => {
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Generate my Q4 2024 sustainability report',
          organizationId,
          conversationId
        });

      expect(response.status).toBe(200);
      expect(response.body.components).toBeDefined();
      
      const reportComponent = response.body.components.find(
        (c: any) => c.type === 'report'
      );
      expect(reportComponent).toBeDefined();
      expect(reportComponent.props.title).toContain('Q4 2024');
      expect(reportComponent.props.metrics).toBeDefined();
    });
  });

  describe('Streaming Responses', () => {
    it('should stream long responses', async () => {
      const response = await request(baseURL)
        .post('/api/ai/stream')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Accept', 'text/event-stream')
        .send({
          message: 'Explain all GRI standards relevant to my industry',
          organizationId,
          conversationId,
          stream: true
        });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('Cache Performance', () => {
    it('should return cached responses faster', async () => {
      const query = 'What is my current carbon footprint?';
      
      // First request - not cached
      const start1 = Date.now();
      const response1 = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: query,
          organizationId,
          conversationId: `${conversationId}-cache-1`
        });
      const time1 = Date.now() - start1;

      expect(response1.status).toBe(200);
      expect(response1.body.cached).toBeFalsy();

      // Second request - should be cached
      const start2 = Date.now();
      const response2 = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: query,
          organizationId,
          conversationId: `${conversationId}-cache-2`
        });
      const time2 = Date.now() - start2;

      expect(response2.status).toBe(200);
      expect(response2.body.cached).toBeTruthy();
      expect(time2).toBeLessThan(time1 * 0.5); // Cached should be at least 2x faster
    });

    it('should use semantic caching for similar queries', async () => {
      // Prime the cache
      await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What are my total emissions?',
          organizationId,
          conversationId: `${conversationId}-semantic-1`
        });

      // Similar query should hit cache
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Tell me about my emissions total',
          organizationId,
          conversationId: `${conversationId}-semantic-2`
        });

      expect(response.status).toBe(200);
      expect(response.body.cached).toBeTruthy();
      expect(response.body.cacheMetrics.cacheType).toBe('semantic');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid requests gracefully', async () => {
      const response = await request(baseURL)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
          message: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle rate limiting', async () => {
      // Make many requests rapidly
      const promises = Array.from({ length: 20 }, () =>
        request(baseURL)
          .post('/api/ai/chat')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            message: 'Test rate limit',
            organizationId,
            conversationId
          })
      );

      const responses = await Promise.all(promises);
      const rateLimited = responses.some(r => r.status === 429);
      
      expect(rateLimited).toBeTruthy();
    });
  });

  describe('Multi-turn Conversations', () => {
    it('should maintain context across multiple turns', async () => {
      const conversationSteps = [
        {
          message: 'I want to track Scope 1, 2, and 3 emissions',
          expectInResponse: ['scope', 'emissions']
        },
        {
          message: 'What data do I need for Scope 3?',
          expectInResponse: ['scope 3', 'supply chain', 'value chain']
        },
        {
          message: 'How do I collect supplier data?',
          expectInResponse: ['supplier', 'questionnaire', 'data collection']
        },
        {
          message: 'Can you create a supplier questionnaire template?',
          expectInResponse: ['template', 'questionnaire']
        }
      ];

      let previousResponse;
      for (const step of conversationSteps) {
        const response = await request(baseURL)
          .post('/api/ai/chat')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            message: step.message,
            organizationId,
            conversationId: `${conversationId}-multitur

            n`
          });

        expect(response.status).toBe(200);
        
        // Check expected content
        step.expectInResponse.forEach(expected => {
          expect(response.body.message.toLowerCase()).toContain(expected.toLowerCase());
        });

        // Verify context is maintained
        if (previousResponse) {
          expect(response.body.message).not.toBe(previousResponse.body.message);
        }
        
        previousResponse = response;
      }
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (conversationId) {
      await request(baseURL)
        .delete(`/api/conversations/${conversationId}/history`)
        .set('Authorization', `Bearer ${authToken}`)
        .send();
    }
  });
});