/**
 * Tests for AI Logger
 * Phase 4, Task 4.1: AI operations logging tests
 */

import { AILogger, LogAIOperation } from '../ai-logger';
import { logger } from '../structured-logger';

// Mock the base logger
jest.mock('../structured-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis()
  }
}));

describe('AILogger', () => {
  let aiLogger: AILogger;

  beforeEach(() => {
    aiLogger = new AILogger();
    jest.clearAllMocks();
  });

  describe('Request/Response Logging', () => {
    it('should log AI requests', () => {
      aiLogger.logRequest('chat_completion', 'openai', 'gpt-4', {
        queue: { requestId: '123', priority: 'high' },
        performance: { latency: 0 }
      });

      expect(logger.info).toHaveBeenCalledWith(
        'AI request initiated',
        expect.objectContaining({
          operation: 'chat_completion',
          provider: 'openai',
          model: 'gpt-4',
          queue: { requestId: '123', priority: 'high' }
        })
      );
    });

    it('should log successful AI responses', () => {
      aiLogger.logResponse('chat_completion', 'openai', 'gpt-4', true, {
        tokens: { prompt: 100, completion: 200, total: 300 },
        cost: { amount: 0.01, currency: 'USD' },
        performance: { latency: 1500 }
      });

      expect(logger.info).toHaveBeenCalledWith(
        'AI response completed',
        expect.objectContaining({
          success: true,
          tokens: { prompt: 100, completion: 200, total: 300 },
          cost: { amount: 0.01, currency: 'USD' },
          performance: { latency: 1500 }
        })
      );
    });

    it('should log failed AI responses', () => {
      aiLogger.logResponse('chat_completion', 'openai', 'gpt-4', false, {
        error: 'Rate limit exceeded'
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'AI response failed',
        expect.objectContaining({
          success: false,
          error: 'Rate limit exceeded'
        })
      );
    });
  });

  describe('Cost Tracking', () => {
    it('should log cost tracking information', () => {
      aiLogger.logCostTracking('openai', 'gpt-4', 
        { prompt: 1000, completion: 500, total: 1500 },
        0.045,
        { organizationId: 'org-123', cached: false }
      );

      expect(logger.info).toHaveBeenCalledWith(
        'AI cost tracked',
        expect.objectContaining({
          provider: 'openai',
          model: 'gpt-4',
          tokens: { prompt: 1000, completion: 500, total: 1500 },
          cost: 0.045,
          organizationId: 'org-123',
          cached: false
        })
      );
    });

    it('should handle cached requests with zero cost', () => {
      aiLogger.logCostTracking('openai', 'gpt-3.5-turbo',
        { prompt: 500, completion: 200, total: 700 },
        0,
        { organizationId: 'org-123', cached: true }
      );

      expect(logger.info).toHaveBeenCalledWith(
        'AI cost tracked',
        expect.objectContaining({
          cost: 0,
          cached: true
        })
      );
    });
  });

  describe('Cache Operations', () => {
    it('should log cache hits', () => {
      aiLogger.logCacheOperation('lookup', true, {
        cacheId: 'cache-key-123',
        ttl: 3600
      });

      expect(logger.debug).toHaveBeenCalledWith(
        'AI cache hit',
        expect.objectContaining({
          operation: 'lookup',
          hit: true,
          cacheId: 'cache-key-123',
          ttl: 3600
        })
      );
    });

    it('should log cache misses', () => {
      aiLogger.logCacheOperation('lookup', false, {
        cacheId: 'cache-key-456'
      });

      expect(logger.debug).toHaveBeenCalledWith(
        'AI cache miss',
        expect.objectContaining({
          operation: 'lookup',
          hit: false,
          cacheId: 'cache-key-456'
        })
      );
    });

    it('should log cache store operations', () => {
      aiLogger.logCacheOperation('store', true, {
        cacheId: 'cache-key-789',
        size: 1024
      });

      expect(logger.debug).toHaveBeenCalledWith(
        'AI cache hit',
        expect.objectContaining({
          operation: 'store',
          hit: true,
          size: 1024
        })
      );
    });
  });

  describe('Queue Operations', () => {
    it('should log queue operations', () => {
      aiLogger.logQueueOperation('enqueue', 'request-123', {
        position: 5,
        priority: 'normal',
        estimatedWait: 2500
      });

      expect(logger.info).toHaveBeenCalledWith(
        'AI queue operation',
        expect.objectContaining({
          operation: 'enqueue',
          requestId: 'request-123',
          position: 5,
          priority: 'normal',
          estimatedWait: 2500
        })
      );
    });

    it('should log dequeue operations', () => {
      aiLogger.logQueueOperation('dequeue', 'request-456', {
        waitTime: 3000,
        processingTime: 1500
      });

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('Model Performance', () => {
    it('should log model performance metrics', () => {
      aiLogger.logModelPerformance('gpt-4', 'chat_completion', {
        latency: 2000,
        throughput: 50,
        tokenPerSecond: 150,
        errorRate: 0.02
      });

      expect(logger.info).toHaveBeenCalledWith(
        'AI model performance',
        expect.objectContaining({
          model: 'gpt-4',
          operation: 'chat_completion',
          metrics: {
            latency: 2000,
            throughput: 50,
            tokenPerSecond: 150,
            errorRate: 0.02
          }
        })
      );
    });

    it('should log performance degradation', () => {
      aiLogger.logModelPerformance('gpt-3.5-turbo', 'embeddings', {
        latency: 5000,
        errorRate: 0.15
      });

      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('Error Logging', () => {
    it('should log AI errors with context', () => {
      const error = new Error('API rate limit exceeded');
      aiLogger.logError('chat_completion', error, {
        provider: 'openai',
        model: 'gpt-4',
        retryable: true,
        attempts: 3
      });

      expect(logger.error).toHaveBeenCalledWith(
        'AI operation error',
        error,
        expect.objectContaining({
          operation: 'chat_completion',
          provider: 'openai',
          model: 'gpt-4',
          retryable: true,
          attempts: 3
        })
      );
    });

    it('should log non-retryable errors', () => {
      const error = new Error('Invalid API key');
      aiLogger.logError('embeddings', error, {
        provider: 'openai',
        retryable: false
      });

      expect(logger.error).toHaveBeenCalled();
      const logCall = (logger.error as jest.Mock).mock.calls[0];
      expect(logCall[2].retryable).toBe(false);
    });
  });

  describe('ML Pipeline Logging', () => {
    it('should log ML pipeline stages', () => {
      aiLogger.logMLPipeline('pipeline-123', 'start', {
        datasetSize: 10000,
        features: 50,
        modelType: 'regression'
      });

      expect(logger.info).toHaveBeenCalledWith(
        'ML pipeline: start',
        expect.objectContaining({
          pipelineId: 'pipeline-123',
          stage: 'start',
          datasetSize: 10000,
          features: 50,
          modelType: 'regression'
        })
      );
    });

    it('should log pipeline errors', () => {
      const error = new Error('Training failed');
      aiLogger.logMLPipeline('pipeline-456', 'error', {
        error,
        stage: 'training'
      });

      expect(logger.error).toHaveBeenCalledWith(
        'ML pipeline error',
        error,
        expect.objectContaining({
          pipelineId: 'pipeline-456',
          stage: 'error'
        })
      );
    });
  });

  describe('Agent Operations', () => {
    it('should log agent operations', () => {
      aiLogger.logAgentOperation('agent-001', 'carbon-optimizer', 'analyze', {
        decision: { action: 'reduce_hvac', confidence: 0.85 },
        impact: 'high'
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Autonomous agent operation',
        expect.objectContaining({
          agentId: 'agent-001',
          agentType: 'carbon-optimizer',
          operation: 'analyze',
          decision: { action: 'reduce_hvac', confidence: 0.85 },
          impact: 'high'
        })
      );
    });

    it('should log agent errors', () => {
      const error = new Error('Decision conflict');
      aiLogger.logAgentOperation('agent-002', 'compliance-guardian', 'validate', {
        error
      });

      expect(logger.error).toHaveBeenCalledWith(
        'Autonomous agent error',
        error,
        expect.objectContaining({
          agentId: 'agent-002',
          agentType: 'compliance-guardian',
          operation: 'validate'
        })
      );
    });
  });

  describe('Timer Functionality', () => {
    it('should measure operation duration', () => {
      jest.useFakeTimers();
      
      const timer = aiLogger.startTimer('test-operation');
      
      jest.advanceTimersByTime(1500);
      const duration = timer();

      expect(duration).toBe(1500);
      expect(logger.debug).toHaveBeenCalledWith(
        'AI operation completed',
        expect.objectContaining({
          operation: 'test-operation',
          duration: 1500
        })
      );

      jest.useRealTimers();
    });
  });

  describe('Decorator', () => {
    it('should log decorated methods', async () => {
      class TestService {
        @LogAIOperation('test_operation')
        async testMethod(input: string): Promise<string> {
          return `Processed: ${input}`;
        }
      }

      const service = new TestService();
      const result = await service.testMethod('hello');

      expect(result).toBe('Processed: hello');
      expect(logger.info).toHaveBeenCalledTimes(2); // start and complete
    });

    it('should log decorated method errors', async () => {
      class TestService {
        @LogAIOperation('failing_operation')
        async failingMethod(): Promise<void> {
          throw new Error('Method failed');
        }
      }

      const service = new TestService();
      
      await expect(service.failingMethod()).rejects.toThrow('Method failed');
      expect(logger.error).toHaveBeenCalled();
    });
  });
});