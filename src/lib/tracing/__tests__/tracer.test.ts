/**
 * Tests for Tracer
 * Phase 4, Task 4.2: Core tracer functionality tests
 */

import { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import { BlipeeTracer, createTracer, Trace, traceAsync } from '../tracer';

// Mock OpenTelemetry API
jest.mock('@opentelemetry/api', () => ({
  trace: {
    getTracer: jest.fn().mockReturnValue({
      startSpan: jest.fn(),
      startActiveSpan: jest.fn()
    }),
    getActiveSpan: jest.fn()
  },
  context: {
    active: jest.fn(),
    with: jest.fn((ctx, fn) => fn())
  },
  SpanStatusCode: {
    UNSET: 0,
    OK: 1,
    ERROR: 2
  },
  SpanKind: {
    INTERNAL: 0,
    SERVER: 1,
    CLIENT: 2,
    PRODUCER: 3,
    CONSUMER: 4
  }
}));

// Mock logger
jest.mock('@/lib/logging', () => ({
  logger: {
    debug: jest.fn()
  }
}));

describe('BlipeeTracer', () => {
  let tracer: BlipeeTracer;
  let mockTracer: any;
  let mockSpan: any;

  beforeEach(() => {
    mockSpan = {
      spanContext: jest.fn().mockReturnValue({
        spanId: 'span-123',
        traceId: 'trace-456'
      }),
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      recordException: jest.fn(),
      addEvent: jest.fn(),
      end: jest.fn()
    };

    mockTracer = {
      startSpan: jest.fn().mockReturnValue(mockSpan),
      startActiveSpan: jest.fn((name, options, fn) => {
        if (typeof options === 'function') {
          return options(mockSpan);
        }
        return fn(mockSpan);
      })
    };

    (trace.getTracer as jest.Mock).mockReturnValue(mockTracer);

    tracer = createTracer({
      serviceName: 'test-service',
      serviceVersion: '1.0.0',
      environment: 'test',
      samplingRate: 1.0
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('startSpan', () => {
    it('should create a span with basic attributes', () => {
      const span = tracer.startSpan('test-operation');

      expect(mockTracer.startSpan).toHaveBeenCalledWith('test-operation', {
        attributes: {
          'service.name': 'test-service',
          'service.version': '1.0.0',
          'deployment.environment': 'test'
        }
      });
      expect(span).toBe(mockSpan);
    });

    it('should flatten custom attributes', () => {
      tracer.startSpan('test-operation', {
        attributes: {
          userId: 'user-123',
          organizationId: 'org-456',
          aiProvider: 'openai'
        }
      });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('test-operation', {
        attributes: expect.objectContaining({
          'userId': 'user-123',
          'organizationId': 'org-456',
          'aiProvider': 'openai'
        })
      });
    });

    it('should handle nested attributes', () => {
      tracer.startSpan('test-operation', {
        attributes: {
          userId: 'user-123',
          metadata: {
            source: 'api',
            version: 2
          }
        } as any
      });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('test-operation', {
        attributes: expect.objectContaining({
          'userId': 'user-123',
          'metadata.source': 'api',
          'metadata.version': 2
        })
      });
    });
  });

  describe('startActiveSpan', () => {
    it('should execute function within span context', async () => {
      const result = await tracer.startActiveSpan(
        'async-operation',
        async (span) => {
          expect(span).toBe(mockSpan);
          return 'success';
        }
      );

      expect(result).toBe('success');
      expect(mockSpan.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.OK });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should handle errors and set error status', async () => {
      const error = new Error('Test error');

      await expect(
        tracer.startActiveSpan('failing-operation', async () => {
          throw error;
        })
      ).rejects.toThrow(error);

      expect(mockSpan.recordException).toHaveBeenCalledWith(error);
      expect(mockSpan.setStatus).toHaveBeenCalledWith({
        code: SpanStatusCode.ERROR,
        message: 'Test error'
      });
      expect(mockSpan.end).toHaveBeenCalled();
    });

    it('should set custom attributes', async () => {
      await tracer.startActiveSpan(
        'operation-with-attrs',
        async () => 'done',
        {
          attributes: {
            userId: 'user-123',
            cacheHit: true
          }
        }
      );

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('userId', 'user-123');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('cacheHit', true);
    });
  });

  describe('getActiveSpan', () => {
    it('should return the active span', () => {
      (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);

      const span = tracer.getActiveSpan();
      expect(span).toBe(mockSpan);
    });
  });

  describe('setSpanAttributes', () => {
    it('should set attributes on a span', () => {
      tracer.setSpanAttributes(mockSpan, {
        userId: 'user-123',
        organizationId: 'org-456',
        tokenCount: 500
      });

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('userId', 'user-123');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('organizationId', 'org-456');
      expect(mockSpan.setAttribute).toHaveBeenCalledWith('tokenCount', 500);
    });

    it('should skip undefined attributes', () => {
      tracer.setSpanAttributes(mockSpan, {
        userId: 'user-123',
        organizationId: undefined,
        buildingId: null as any
      });

      expect(mockSpan.setAttribute).toHaveBeenCalledWith('userId', 'user-123');
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('organizationId', undefined);
      expect(mockSpan.setAttribute).not.toHaveBeenCalledWith('buildingId', null);
    });
  });

  describe('recordEvent', () => {
    it('should add event to active span', () => {
      (trace.getActiveSpan as jest.Mock).mockReturnValue(mockSpan);

      tracer.recordEvent('milestone_reached', {
        progress: 50,
        checkpoint: 'halfway'
      });

      expect(mockSpan.addEvent).toHaveBeenCalledWith('milestone_reached', {
        progress: 50,
        checkpoint: 'halfway'
      });
    });

    it('should not add event if no active span', () => {
      (trace.getActiveSpan as jest.Mock).mockReturnValue(undefined);

      tracer.recordEvent('test_event');

      expect(mockSpan.addEvent).not.toHaveBeenCalled();
    });
  });

  describe('attribute flattening', () => {
    it('should handle arrays', () => {
      const span = tracer.startSpan('test', {
        attributes: {
          tags: ['tag1', 'tag2', 'tag3']
        } as any
      });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('test', {
        attributes: expect.objectContaining({
          'tags': '["tag1","tag2","tag3"]'
        })
      });
    });

    it('should handle complex nested objects', () => {
      const span = tracer.startSpan('test', {
        attributes: {
          user: {
            id: '123',
            profile: {
              name: 'John',
              settings: {
                theme: 'dark'
              }
            }
          }
        } as any
      });

      expect(mockTracer.startSpan).toHaveBeenCalledWith('test', {
        attributes: expect.objectContaining({
          'user.id': '123',
          'user.profile.name': 'John',
          'user.profile.settings.theme': 'dark'
        })
      });
    });
  });
});

describe('Trace Decorator', () => {
  it('should wrap methods with tracing', async () => {
    const mockSpan = {
      setAttribute: jest.fn(),
      setStatus: jest.fn(),
      end: jest.fn()
    };

    const mockTracer = {
      startActiveSpan: jest.fn((name, fn) => fn(mockSpan))
    };

    (trace.getTracer as jest.Mock).mockReturnValue(mockTracer);

    class TestService {
      @Trace('custom.operation')
      async doSomething(value: string): Promise<string> {
        return `processed: ${value}`;
      }
    }

    const service = new TestService();
    const result = await service.doSomething('test');

    expect(result).toBe('processed: test');
    expect(mockTracer.startActiveSpan).toHaveBeenCalledWith(
      'custom.operation',
      expect.any(Function),
      undefined
    );
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('code.function', 'doSomething');
    expect(mockSpan.setAttribute).toHaveBeenCalledWith('code.namespace', 'TestService');
  });
});

describe('traceAsync', () => {
  it('should trace async operations', async () => {
    const mockFn = jest.fn().mockResolvedValue('result');
    const mockTracer = createTracer();

    // Mock the tracer's startActiveSpan
    const startActiveSpanSpy = jest.spyOn(mockTracer, 'startActiveSpan')
      .mockImplementation(async (name, fn) => fn(mockSpan));

    const result = await traceAsync('test-operation', mockFn, {
      userId: 'user-123'
    });

    expect(result).toBe('result');
    expect(mockFn).toHaveBeenCalled();
  });
});