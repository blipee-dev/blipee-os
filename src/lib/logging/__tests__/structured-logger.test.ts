/**
 * Tests for Structured Logger
 * Phase 4, Task 4.1: Comprehensive test coverage
 */

import { StructuredLogger, LogLevel } from '../structured-logger';
import { asyncLocalStorage } from '../structured-logger';

describe('StructuredLogger', () => {
  let logger: StructuredLogger;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new StructuredLogger({
      level: LogLevel.DEBUG,
      redactPaths: ['password', 'apiKey', 'token']
    });

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Log Levels', () => {
    it('should log at debug level', () => {
      logger.debug('Debug message', { data: 'test' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('debug');
      expect(logOutput.message).toBe('Debug message');
      expect(logOutput.data).toBe('test');
    });

    it('should log at info level', () => {
      logger.info('Info message');
      
      expect(consoleLogSpy).toHaveBeenCalled();
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('info');
      expect(logOutput.message).toBe('Info message');
    });

    it('should log at warn level', () => {
      logger.warn('Warning message');
      
      expect(consoleWarnSpy).toHaveBeenCalled();
      const logOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('warn');
      expect(logOutput.message).toBe('Warning message');
    });

    it('should log at error level with error object', () => {
      const error = new Error('Test error');
      logger.error('Error occurred', error);
      
      expect(consoleErrorSpy).toHaveBeenCalled();
      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.level).toBe('error');
      expect(logOutput.message).toBe('Error occurred');
      expect(logOutput.error.message).toBe('Test error');
      expect(logOutput.error.stack).toBeDefined();
    });

    it('should respect log level configuration', () => {
      const warnLogger = new StructuredLogger({ level: LogLevel.WARN });
      
      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warning message');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Context Management', () => {
    it('should maintain context within runWithContext', () => {
      logger.runWithContext(
        { userId: '123', correlationId: 'abc' },
        () => {
          logger.info('Message with context');
        }
      );

      expect(consoleLogSpy).toHaveBeenCalled();
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.userId).toBe('123');
      expect(logOutput.correlationId).toBe('abc');
    });

    it('should generate correlationId if not provided', () => {
      logger.runWithContext({ userId: '123' }, () => {
        logger.info('Message');
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.correlationId).toBeDefined();
      expect(logOutput.correlationId).toMatch(/^[0-9a-f-]+$/);
    });

    it('should merge nested contexts', () => {
      logger.runWithContext({ level1: 'value1' }, () => {
        logger.runWithContext({ level2: 'value2' }, () => {
          logger.info('Nested context');
        });
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.level1).toBe('value1');
      expect(logOutput.level2).toBe('value2');
    });
  });

  describe('Child Loggers', () => {
    it('should create child logger with additional context', () => {
      const childLogger = logger.child({ service: 'test-service' });
      childLogger.info('Child logger message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.service).toBe('test-service');
    });

    it('should inherit parent context in child logger', () => {
      logger.runWithContext({ parentContext: 'value' }, () => {
        const childLogger = logger.child({ childContext: 'child' });
        childLogger.info('Message');
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.parentContext).toBe('value');
      expect(logOutput.childContext).toBe('child');
    });
  });

  describe('Data Redaction', () => {
    it('should redact sensitive fields', () => {
      logger.info('Sensitive data', {
        username: 'john',
        password: 'secret123',
        apiKey: 'key-123-456',
        token: 'jwt-token'
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.username).toBe('john');
      expect(logOutput.password).toBe('[REDACTED]');
      expect(logOutput.apiKey).toBe('[REDACTED]');
      expect(logOutput.token).toBe('[REDACTED]');
    });

    it('should redact nested sensitive fields', () => {
      logger.info('Nested sensitive data', {
        user: {
          name: 'john',
          credentials: {
            password: 'secret',
            apiKey: 'key'
          }
        }
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.user.name).toBe('john');
      expect(logOutput.user.credentials.password).toBe('[REDACTED]');
      expect(logOutput.user.credentials.apiKey).toBe('[REDACTED]');
    });

    it('should redact arrays with sensitive data', () => {
      logger.info('Array sensitive data', {
        tokens: ['token1', 'token2'],
        data: [{ password: 'secret' }]
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.tokens).toEqual(['[REDACTED]', '[REDACTED]']);
      expect(logOutput.data[0].password).toBe('[REDACTED]');
    });
  });

  describe('Error Handling', () => {
    it('should handle circular references', () => {
      const obj: any = { name: 'test' };
      obj.circular = obj;

      logger.info('Circular reference', obj);
      
      expect(consoleLogSpy).toHaveBeenCalled();
      // Should not throw
    });

    it('should handle null and undefined values', () => {
      logger.info('Null values', {
        nullValue: null,
        undefinedValue: undefined
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.nullValue).toBeNull();
      expect(logOutput.undefinedValue).toBeUndefined();
    });
  });

  describe('Performance', () => {
    it('should add timestamp to all logs', () => {
      logger.info('Test message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.timestamp).toBeDefined();
      expect(new Date(logOutput.timestamp).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should include hostname', () => {
      logger.info('Test message');

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.hostname).toBeDefined();
    });
  });

  describe('Async Context', () => {
    it('should maintain context across async operations', async () => {
      await logger.runWithContext({ requestId: '123' }, async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        logger.info('After timeout');
      });

      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      expect(logOutput.requestId).toBe('123');
    });

    it('should isolate contexts between parallel operations', async () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => logs.push(msg);

      await Promise.all([
        logger.runWithContext({ requestId: 'req1' }, async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          logger.info('Request 1');
        }),
        logger.runWithContext({ requestId: 'req2' }, async () => {
          await new Promise(resolve => setTimeout(resolve, 5));
          logger.info('Request 2');
        })
      ]);

      console.log = originalLog;

      const log1 = JSON.parse(logs.find(l => l.includes('Request 1'))!);
      const log2 = JSON.parse(logs.find(l => l.includes('Request 2'))!);

      expect(log1.requestId).toBe('req1');
      expect(log2.requestId).toBe('req2');
    });
  });
});