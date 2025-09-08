/**
 * Unit tests for AI Orchestrator
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AIOrchestrator, TaskType, AIProvider } from '../../orchestrator';

describe('AI Orchestrator', () => {
  let orchestrator: AIOrchestrator;
  let mockProvider: AIProvider;

  beforeEach(() => {
    orchestrator = new AIOrchestrator();
    
    mockProvider = {
      name: 'test-provider',
      isAvailable: jest.fn().mockResolvedValue(true),
      chat: jest.fn().mockResolvedValue({ 
        message: 'Test response',
        usage: { tokens: 100 }
      }),
      streamChat: jest.fn(),
      getCapabilities: jest.fn().mockReturnValue(['chat', 'analysis'])
    };
  });

  describe('Provider Management', () => {
    it('should register a new provider', () => {
      orchestrator.registerProvider(mockProvider);
      const providers = orchestrator.getProviders();
      expect(providers.includes('test-provider')).toBe(true);
    });

    it('should not register duplicate providers', () => {
      orchestrator.registerProvider(mockProvider);
      orchestrator.registerProvider(mockProvider);
      const providers = orchestrator.getProviders();
      expect(providers.filter(p => p === 'test-provider').length).toBe(1);
    });

    it('should check provider health', async () => {
      orchestrator.registerProvider(mockProvider);
      const health = await orchestrator.getProviderHealth('test-provider');
      
      expect(health).toBeDefined();
      expect(health.available).toBe(true);
      expect(health.lastChecked).toBeDefined();
    });
  });

  describe('Task Routing', () => {
    it('should route general chat tasks', async () => {
      orchestrator.registerProvider(mockProvider);
      
      const result = await orchestrator.routeTask({
        type: TaskType.GENERAL_CHAT,
        prompt: 'Hello',
        context: {}
      });

      expect(result).toBeDefined();
      expect(result.response).toBe('Test response');
      expect(result.provider).toBe('test-provider');
      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should use specialized providers for specific tasks', async () => {
      const analyticsProvider: AIProvider = {
        name: 'analytics-provider',
        isAvailable: jest.fn().mockResolvedValue(true),
        chat: jest.fn().mockResolvedValue({ message: 'Analytics response' }),
        streamChat: jest.fn(),
        getCapabilities: jest.fn().mockReturnValue(['analytics', 'data-analysis'])
      };

      orchestrator.registerProvider(mockProvider);
      orchestrator.registerProvider(analyticsProvider);

      const result = await orchestrator.routeTask({
        type: TaskType.DATA_ANALYSIS,
        prompt: 'Analyze data',
        context: {}
      });

      expect(result.provider).toBe('analytics-provider');
    });

    it('should handle provider failures with circuit breaker', async () => {
      const failingProvider: AIProvider = {
        name: 'failing-provider',
        isAvailable: jest.fn().mockResolvedValue(true),
        chat: jest.fn().mockRejectedValue(new Error('Provider error')),
        streamChat: jest.fn(),
        getCapabilities: jest.fn().mockReturnValue(['chat'])
      };

      orchestrator.registerProvider(failingProvider);
      orchestrator.registerProvider(mockProvider);

      // First few failures
      for (let i = 0; i < 3; i++) {
        await orchestrator.routeTask({
          type: TaskType.GENERAL_CHAT,
          prompt: 'Test',
          context: {}
        });
      }

      // Circuit should be open, should use fallback provider
      const result = await orchestrator.routeTask({
        type: TaskType.GENERAL_CHAT,
        prompt: 'Test',
        context: {}
      });

      expect(result.provider).toBe('test-provider');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track response times', async () => {
      orchestrator.registerProvider(mockProvider);
      
      await orchestrator.routeTask({
        type: TaskType.GENERAL_CHAT,
        prompt: 'Test',
        context: {}
      });

      const metrics = orchestrator.getPerformanceMetrics();
      expect(metrics['test-provider']).toBeDefined();
      expect(metrics['test-provider'].avgResponseTime).toBeGreaterThan(0);
      expect(metrics['test-provider'].successRate).toBe(100);
    });

    it('should calculate success rates correctly', async () => {
      const unreliableProvider: AIProvider = {
        name: 'unreliable-provider',
        isAvailable: jest.fn().mockResolvedValue(true),
        chat: jest.fn()
          .mockResolvedValueOnce({ message: 'Success' })
          .mockRejectedValueOnce(new Error('Fail'))
          .mockResolvedValueOnce({ message: 'Success' }),
        streamChat: jest.fn(),
        getCapabilities: jest.fn().mockReturnValue(['chat'])
      };

      orchestrator.registerProvider(unreliableProvider);

      // Make 3 calls: success, fail, success
      for (let i = 0; i < 3; i++) {
        try {
          await orchestrator.routeTask({
            type: TaskType.GENERAL_CHAT,
            prompt: 'Test',
            context: {}
          });
        } catch (e) {
          // Expected failure
        }
      }

      const metrics = orchestrator.getPerformanceMetrics();
      expect(metrics['unreliable-provider'].successRate).toBeCloseTo(66.67, 1);
    });
  });

  describe('Smart Routing Algorithm', () => {
    it('should consider provider capabilities', async () => {
      const providers = [
        {
          name: 'general-provider',
          capabilities: ['chat'],
          successRate: 95
        },
        {
          name: 'specialized-provider',
          capabilities: ['chat', 'compliance', 'analysis'],
          successRate: 90
        }
      ];

      providers.forEach(p => {
        const provider: AIProvider = {
          name: p.name,
          isAvailable: jest.fn().mockResolvedValue(true),
          chat: jest.fn().mockResolvedValue({ message: `${p.name} response` }),
          streamChat: jest.fn(),
          getCapabilities: jest.fn().mockReturnValue(p.capabilities)
        };
        orchestrator.registerProvider(provider);
      });

      const result = await orchestrator.routeTask({
        type: TaskType.COMPLIANCE_CHECK,
        prompt: 'Check compliance',
        context: {}
      });

      expect(result.provider).toBe('specialized-provider');
    });

    it('should balance load across providers', async () => {
      const provider1: AIProvider = {
        name: 'provider-1',
        isAvailable: jest.fn().mockResolvedValue(true),
        chat: jest.fn().mockResolvedValue({ message: 'Response 1' }),
        streamChat: jest.fn(),
        getCapabilities: jest.fn().mockReturnValue(['chat'])
      };

      const provider2: AIProvider = {
        name: 'provider-2',
        isAvailable: jest.fn().mockResolvedValue(true),
        chat: jest.fn().mockResolvedValue({ message: 'Response 2' }),
        streamChat: jest.fn(),
        getCapabilities: jest.fn().mockReturnValue(['chat'])
      };

      orchestrator.registerProvider(provider1);
      orchestrator.registerProvider(provider2);

      // Make multiple requests
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          orchestrator.routeTask({
            type: TaskType.GENERAL_CHAT,
            prompt: 'Test',
            context: {}
          })
        )
      );

      // Both providers should have been used
      const provider1Count = results.filter(r => r.provider === 'provider-1').length;
      const provider2Count = results.filter(r => r.provider === 'provider-2').length;

      expect(provider1Count).toBeGreaterThan(0);
      expect(provider2Count).toBeGreaterThan(0);
    });
  });
});