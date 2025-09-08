/**
 * Phase 3 AI Integration Tests
 * Comprehensive testing of all AI features implemented in Phase 3
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { aiOrchestrator } from '../../orchestrator';
import { enhancedAIService } from '../../enhanced-service';
import { conversationMemoryManager } from '../../conversation-memory';
import { aiResponseCache } from '../../response-cache';
import { chainOfThoughtEngine } from '../../chain-of-thought';
import { aiCacheManager } from '../../cache-strategies';
import { conversationalEngine } from '../../conversational-engine';
import { predictiveIntelligence } from '../../predictive-intelligence';
import { recommendationEngine } from '../../recommendation-engine';
import { reportIntelligence } from '../../report-intelligence';
import { blipeeIntelligence } from '../../sustainability-intelligence';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      }))
    }
  }))
}));

// Mock cache services
jest.mock('@/lib/cache', () => ({
  getCache: jest.fn(() => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve()),
    delete: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve())
  }))
}));

describe('Phase 3 AI Integration Tests', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AI Orchestrator', () => {
    it('should initialize with multiple providers', async () => {
      expect(aiOrchestrator).toBeDefined();
      expect(aiOrchestrator.getProviders).toBeDefined();
    });

    it('should route tasks to appropriate providers', async () => {
      const result = await aiOrchestrator.routeTask({
        type: 'GENERAL_CHAT',
        prompt: 'Test prompt',
        context: {}
      });
      
      expect(result).toBeDefined();
      expect(result.provider).toBeDefined();
    });

    it('should handle provider failures with fallback', async () => {
      // Mock a provider failure
      const mockFailProvider = {
        name: 'failing-provider',
        isAvailable: () => true,
        chat: async () => { throw new Error('Provider failed'); }
      };
      
      aiOrchestrator.registerProvider(mockFailProvider);
      
      const result = await aiOrchestrator.routeTask({
        type: 'GENERAL_CHAT',
        prompt: 'Test prompt',
        context: {}
      });
      
      expect(result.provider).not.toBe('failing-provider');
    });
  });

  describe('Enhanced AI Service', () => {
    it('should process conversations with context', async () => {
      const response = await enhancedAIService.chat({
        message: 'What is my carbon footprint?',
        organizationId: 'test-org',
        userId: 'test-user',
        conversationId: 'test-conversation'
      });
      
      expect(response).toBeDefined();
      expect(response.message).toBeDefined();
    });

    it('should integrate with conversation memory', async () => {
      const response = await enhancedAIService.chat({
        message: 'Remember that my goal is net zero by 2030',
        organizationId: 'test-org',
        userId: 'test-user',
        conversationId: 'test-conversation'
      });
      
      expect(response).toBeDefined();
      
      // Check if memory was updated
      const memory = await conversationMemoryManager.getConversationMemory('test-conversation');
      expect(memory).toBeDefined();
    });
  });

  describe('Conversation Memory Manager', () => {
    it('should store and retrieve conversation context', async () => {
      const testContext = {
        topic: 'sustainability',
        goals: ['net zero by 2030'],
        preferences: { responseLength: 'detailed' }
      };
      
      await conversationMemoryManager.updateContext('test-conversation', testContext);
      const retrieved = await conversationMemoryManager.getConversationMemory('test-conversation');
      
      expect(retrieved).toBeDefined();
      expect(retrieved.context).toMatchObject(testContext);
    });

    it('should learn user preferences', async () => {
      await conversationMemoryManager.learnFromInteraction(
        'test-user',
        'test-conversation',
        {
          message: 'I prefer brief responses',
          timestamp: new Date().toISOString()
        },
        {
          message: 'Understood, I\'ll keep responses brief',
          timestamp: new Date().toISOString()
        }
      );
      
      const preferences = await conversationMemoryManager.getUserPreferences('test-user');
      expect(preferences).toBeDefined();
    });
  });

  describe('AI Response Cache', () => {
    it('should cache and retrieve AI responses', async () => {
      const testResponse = {
        message: 'Test response',
        confidence: 0.95,
        metadata: { cached: false }
      };
      
      await aiResponseCache.cacheResponse(
        'test-query',
        testResponse,
        'test-provider',
        { organizationId: 'test-org' }
      );
      
      const cached = await aiResponseCache.getCachedResponse(
        'test-query',
        { organizationId: 'test-org' }
      );
      
      expect(cached).toBeDefined();
      expect(cached.message).toBe(testResponse.message);
    });

    it('should calculate cache statistics', async () => {
      const stats = await aiResponseCache.getCacheStats('test-org');
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalEntries');
      expect(stats).toHaveProperty('hitRate');
      expect(stats).toHaveProperty('memoryUsage');
    });
  });

  describe('Chain of Thought Engine', () => {
    it('should process complex queries with reasoning steps', async () => {
      const result = await chainOfThoughtEngine.processWithReasoning(
        'How can I reduce emissions by 50% in 2 years?',
        'test-org',
        'test-user'
      );
      
      expect(result).toBeDefined();
      expect(result.reasoning).toBeInstanceOf(Array);
      expect(result.reasoning.length).toBeGreaterThan(0);
      expect(result.conclusion).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should generate actionable plans', async () => {
      const result = await chainOfThoughtEngine.processWithReasoning(
        'Create a carbon reduction plan',
        'test-org',
        'test-user'
      );
      
      expect(result.actions).toBeInstanceOf(Array);
      expect(result.actions.length).toBeGreaterThan(0);
      result.actions.forEach(action => {
        expect(action).toHaveProperty('action');
        expect(action).toHaveProperty('priority');
        expect(action).toHaveProperty('impact');
      });
    });
  });

  describe('AI Cache Manager', () => {
    it('should implement semantic similarity caching', async () => {
      await aiCacheManager.set(
        'What is my carbon footprint?',
        { message: 'Your carbon footprint is 1000 tons CO2' },
        { organizationId: 'test-org' }
      );
      
      // Similar query should hit cache
      const cached = await aiCacheManager.get(
        'Tell me about my carbon emissions',
        { organizationId: 'test-org' }
      );
      
      expect(cached).toBeDefined();
      expect(cached.cacheType).toBe('semantic');
    });

    it('should provide cache metrics', () => {
      const metrics = aiCacheManager.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('hitRate');
    });
  });

  describe('Conversational Engine', () => {
    it('should handle natural language queries', async () => {
      const response = await conversationalEngine.chat(
        'Show me energy usage trends for last month'
      );
      
      expect(response).toBeDefined();
      expect(response.response).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should generate appropriate visualizations', async () => {
      const response = await conversationalEngine.chat(
        'Create a chart of monthly emissions'
      );
      
      expect(response.visualizations).toBeDefined();
      expect(response.visualizations.length).toBeGreaterThan(0);
    });
  });

  describe('Predictive Intelligence', () => {
    it('should generate emissions predictions', async () => {
      const predictions = await predictiveIntelligence.predictEmissions(
        'test-org',
        'month'
      );
      
      expect(predictions).toBeDefined();
      expect(predictions.predictions).toBeInstanceOf(Array);
      expect(predictions.confidence).toBeGreaterThan(0);
      expect(predictions.recommendations).toBeInstanceOf(Array);
    });

    it('should predict energy consumption', async () => {
      const predictions = await predictiveIntelligence.predictEnergyConsumption(
        'test-org',
        30 // 30 days
      );
      
      expect(predictions).toBeDefined();
      expect(predictions).toHaveProperty('predicted_usage');
      expect(predictions).toHaveProperty('confidence');
    });
  });

  describe('Recommendation Engine', () => {
    it('should generate actionable recommendations', async () => {
      const recommendations = await recommendationEngine.generateRecommendations({
        organizationId: 'test-org',
        currentEmissions: { total: 1000, scope1: 300, scope2: 500, scope3: 200 },
        targets: [{ name: 'Net Zero 2030', value: 0, deadline: '2030-12-31' }]
      });
      
      expect(recommendations).toBeDefined();
      expect(recommendations.quickWins).toBeInstanceOf(Array);
      expect(recommendations.longTermStrategies).toBeInstanceOf(Array);
      expect(recommendations.quickWins.length).toBeGreaterThan(0);
    });

    it('should prioritize recommendations by impact', async () => {
      const recommendations = await recommendationEngine.generateRecommendations({
        organizationId: 'test-org',
        currentEmissions: { total: 1000 },
        targets: []
      });
      
      const quickWins = recommendations.quickWins;
      for (let i = 1; i < quickWins.length; i++) {
        expect(quickWins[i-1].impact).toBeGreaterThanOrEqual(quickWins[i].impact);
      }
    });
  });

  describe('Report Intelligence', () => {
    it('should generate comprehensive reports', async () => {
      const report = await reportIntelligence.generateReport(
        'Create Q4 2024 sustainability report',
        { period: 'Q4 2024', organizationId: 'test-org' }
      );
      
      expect(report).toBeDefined();
      expect(report.format).toBeDefined();
      expect(report.report).toHaveProperty('title');
      expect(report.report).toHaveProperty('executiveSummary');
      expect(report.report).toHaveProperty('sections');
    });

    it('should include visualizations in reports', async () => {
      const report = await reportIntelligence.generateReport(
        'Monthly emissions report with charts',
        { period: 'November 2024' }
      );
      
      expect(report.report.sections).toBeDefined();
      const hasVisualizations = report.report.sections.some(
        section => section.content?.visualizations?.length > 0
      );
      expect(hasVisualizations).toBe(true);
    });
  });

  describe('Sustainability Intelligence', () => {
    it('should analyze sustainability queries', async () => {
      const analysis = await blipeeIntelligence.analyzeQuery(
        'How can I improve my ESG score?',
        'test-org'
      );
      
      expect(analysis).toBeDefined();
      expect(analysis.intent).toBeDefined();
      expect(analysis.focusAreas).toBeInstanceOf(Array);
      expect(analysis.confidence).toBeGreaterThan(0);
    });

    it('should provide regulatory compliance insights', async () => {
      const compliance = await blipeeIntelligence.checkCompliance(
        'test-org',
        ['CSRD', 'TCFD']
      );
      
      expect(compliance).toBeDefined();
      expect(compliance.frameworks).toBeDefined();
      expect(compliance.gaps).toBeInstanceOf(Array);
      expect(compliance.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle end-to-end conversation flow', async () => {
      // 1. User asks a question
      const query = 'What are my biggest emission sources?';
      
      // 2. Enhanced AI processes with context
      const response = await enhancedAIService.chat({
        message: query,
        organizationId: 'test-org',
        userId: 'test-user',
        conversationId: 'test-conversation'
      });
      
      expect(response.message).toBeDefined();
      
      // 3. Memory is updated
      const memory = await conversationMemoryManager.getConversationMemory('test-conversation');
      expect(memory).toBeDefined();
      
      // 4. Response is cached
      const cached = await aiCacheManager.get(query, { organizationId: 'test-org' });
      expect(cached).toBeDefined();
    });

    it('should provide predictive insights with recommendations', async () => {
      // 1. Get predictions
      const predictions = await predictiveIntelligence.predictEmissions('test-org', 'quarter');
      
      // 2. Generate recommendations based on predictions
      const recommendations = await recommendationEngine.generateRecommendations({
        organizationId: 'test-org',
        currentEmissions: { total: 1000 },
        targets: [{ name: 'Reduce by 30%', value: 700 }],
        predictions: predictions.predictions
      });
      
      expect(recommendations.quickWins.length).toBeGreaterThan(0);
      expect(recommendations.quickWins[0]).toHaveProperty('expectedReduction');
    });

    it('should generate report with chain of thought reasoning', async () => {
      // 1. Analyze request with chain of thought
      const analysis = await chainOfThoughtEngine.processWithReasoning(
        'Generate comprehensive annual sustainability report',
        'test-org',
        'test-user'
      );
      
      // 2. Generate report based on analysis
      const report = await reportIntelligence.generateReport(
        'Annual sustainability report',
        { 
          period: '2024',
          insights: analysis.conclusion,
          recommendations: analysis.actions
        }
      );
      
      expect(report.report.sections.length).toBeGreaterThan(3);
      expect(report.confidence).toBeGreaterThan(0.8);
    });
  });
});

describe('Phase 3 Performance Tests', () => {
  it('should handle concurrent requests efficiently', async () => {
    const startTime = Date.now();
    const promises = [];
    
    // Simulate 10 concurrent requests
    for (let i = 0; i < 10; i++) {
      promises.push(
        enhancedAIService.chat({
          message: `Test query ${i}`,
          organizationId: 'test-org',
          userId: 'test-user',
          conversationId: `test-conversation-${i}`
        })
      );
    }
    
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    expect(results).toHaveLength(10);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });

  it('should maintain cache efficiency under load', async () => {
    const metrics = aiCacheManager.getMetrics();
    const initialHitRate = metrics.hitRate;
    
    // Simulate repeated similar queries
    for (let i = 0; i < 20; i++) {
      await aiCacheManager.get(
        `What is carbon footprint variation ${i % 5}?`,
        { organizationId: 'test-org' }
      );
    }
    
    const finalMetrics = aiCacheManager.getMetrics();
    expect(finalMetrics.hitRate).toBeGreaterThanOrEqual(initialHitRate);
  });
});