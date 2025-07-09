import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { AIService } from '../service';
import { ContextEngine } from '../context-engine';
import { ActionPlanner } from '../action-planner';
import { aiCacheManager } from '../cache-strategies';

// Mock providers
jest.mock('../providers/deepseek', () => ({
  DeepSeekProvider: jest.fn().mockImplementation(() => ({
    isAvailable: jest.fn().mockResolvedValue(true),
    generateResponse: jest.fn().mockResolvedValue({
      content: 'DeepSeek response',
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    })
  }))
}));

jest.mock('../providers/openai', () => ({
  OpenAIProvider: jest.fn().mockImplementation(() => ({
    isAvailable: jest.fn().mockResolvedValue(true),
    generateResponse: jest.fn().mockResolvedValue({
      content: 'OpenAI response',
      usage: { prompt_tokens: 100, completion_tokens: 50 }
    })
  }))
}));

jest.mock('../context-engine', () => ({
  ContextEngine: jest.fn().mockImplementation(() => ({
    buildContext: jest.fn().mockResolvedValue({
      user: { id: 'user_123', name: 'Test User' },
      organization: { id: 'org_123', name: 'Test Org' },
      building: { id: 'bld_123', name: 'Test Building' },
      recentData: {},
      conversationHistory: []
    })
  }))
}));

jest.mock('../action-planner', () => ({
  ActionPlanner: jest.fn().mockImplementation(() => ({
    planActions: jest.fn().mockResolvedValue({
      steps: [
        { action: 'analyze', description: 'Analyze request' },
        { action: 'respond', description: 'Generate response' }
      ]
    })
  }))
}));

jest.mock('../cache-strategies', () => ({
  aiCacheManager: {
    initialize: jest.fn(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn(),
    getMetrics: jest.fn().mockReturnValue({
      hitRate: '85.00',
      totalRequests: 1000,
      cacheHits: 850,
      cacheMisses: 150
    })
  }
}));

describe('AI Service', () => {
  let aiService: AIService;

  beforeEach(() => {
    jest.clearAllMocks();
    aiService = new AIService();
  });

  describe('Provider Selection', () => {
    it('should select primary provider when available', async () => {
      const provider = await aiService.selectProvider();
      expect(provider).toBeDefined();
      expect(provider.constructor.name).toBe('DeepSeekProvider');
    });

    it('should fallback to secondary provider when primary fails', async () => {
      // Mock DeepSeek as unavailable
      const deepseekProvider = aiService.providers.deepseek;
      (deepseekProvider.isAvailable as jest.Mock).mockResolvedValue(false);

      const provider = await aiService.selectProvider();
      expect(provider.constructor.name).toBe('OpenAIProvider');
    });

    it('should throw error when no providers available', async () => {
      // Mock all providers as unavailable
      Object.values(aiService.providers).forEach(provider => {
        (provider.isAvailable as jest.Mock).mockResolvedValue(false);
      });

      await expect(aiService.selectProvider()).rejects.toThrow('No AI providers available');
    });
  });

  describe('Response Generation', () => {
    it('should generate response with context', async () => {
      const message = 'What is our energy usage?';
      const conversationId = 'conv_123';

      const response = await aiService.generateResponse({
        message,
        conversationId,
        userId: 'user_123',
        organizationId: 'org_123'
      });

      expect(response).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.provider).toBe('deepseek');
      expect(response.cached).toBe(false);
    });

    it('should use cached response when available', async () => {
      const cachedResponse = {
        content: 'Cached response',
        provider: 'cache',
        cacheType: 'semantic'
      };

      (aiCacheManager.get as jest.Mock).mockResolvedValueOnce(cachedResponse);

      const response = await aiService.generateResponse({
        message: 'What is our energy usage?',
        conversationId: 'conv_123',
        userId: 'user_123',
        organizationId: 'org_123'
      });

      expect(response.cached).toBe(true);
      expect(response.content).toBe('Cached response');
      expect(aiCacheManager.set).not.toHaveBeenCalled();
    });

    it('should cache new responses', async () => {
      const response = await aiService.generateResponse({
        message: 'What is our carbon footprint?',
        conversationId: 'conv_123',
        userId: 'user_123',
        organizationId: 'org_123'
      });

      expect(aiCacheManager.set).toHaveBeenCalledWith(
        'What is our carbon footprint?',
        expect.any(Object),
        expect.objectContaining({
          content: expect.any(String),
          provider: 'deepseek'
        })
      );
    });
  });

  describe('Context Building', () => {
    it('should build comprehensive context', async () => {
      const contextEngine = new ContextEngine();
      const context = await contextEngine.buildContext({
        userId: 'user_123',
        organizationId: 'org_123',
        buildingId: 'bld_123',
        conversationId: 'conv_123'
      });

      expect(context).toHaveProperty('user');
      expect(context).toHaveProperty('organization');
      expect(context).toHaveProperty('building');
      expect(context).toHaveProperty('recentData');
      expect(context).toHaveProperty('conversationHistory');
    });
  });

  describe('Action Planning', () => {
    it('should plan actions based on query', async () => {
      const actionPlanner = new ActionPlanner();
      const plan = await actionPlanner.planActions(
        'Show me energy trends and suggest optimizations'
      );

      expect(plan.steps).toBeDefined();
      expect(plan.steps.length).toBeGreaterThan(0);
      expect(plan.steps[0]).toHaveProperty('action');
      expect(plan.steps[0]).toHaveProperty('description');
    });
  });

  describe('Error Handling', () => {
    it('should handle provider errors gracefully', async () => {
      // Mock provider to throw error
      const deepseekProvider = aiService.providers.deepseek;
      (deepseekProvider.generateResponse as jest.Mock).mockRejectedValueOnce(
        new Error('API rate limit exceeded')
      );

      const response = await aiService.generateResponse({
        message: 'Test query',
        conversationId: 'conv_123',
        userId: 'user_123',
        organizationId: 'org_123'
      });

      // Should fallback to OpenAI
      expect(response.provider).toBe('openai');
      expect(response.content).toBe('OpenAI response');
    });

    it('should handle all providers failing', async () => {
      // Mock all providers to fail
      Object.values(aiService.providers).forEach(provider => {
        (provider.generateResponse as jest.Mock).mockRejectedValue(
          new Error('Provider error')
        );
      });

      await expect(
        aiService.generateResponse({
          message: 'Test query',
          conversationId: 'conv_123',
          userId: 'user_123',
          organizationId: 'org_123'
        })
      ).rejects.toThrow();
    });
  });

  describe('Streaming Responses', () => {
    it('should support streaming responses', async () => {
      const streamChunks = ['Analyzing', ' your', ' request', '...'];
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          for (const chunk of streamChunks) {
            yield chunk;
          }
        }
      };

      const deepseekProvider = aiService.providers.deepseek;
      (deepseekProvider.generateResponse as jest.Mock).mockResolvedValue({
        stream: mockStream
      });

      const response = await aiService.generateResponse({
        message: 'Stream test',
        conversationId: 'conv_123',
        userId: 'user_123',
        organizationId: 'org_123',
        stream: true
      });

      expect(response.stream).toBeDefined();
      
      // Collect stream chunks
      const chunks = [];
      for await (const chunk of response.stream) {
        chunks.push(chunk);
      }
      
      expect(chunks).toEqual(streamChunks);
    });
  });

  describe('Performance Metrics', () => {
    it('should track cache metrics', () => {
      const metrics = aiCacheManager.getMetrics();

      expect(metrics).toHaveProperty('hitRate');
      expect(metrics).toHaveProperty('totalRequests');
      expect(metrics).toHaveProperty('cacheHits');
      expect(metrics).toHaveProperty('cacheMisses');
      expect(metrics.hitRate).toBe('85.00');
    });
  });
});