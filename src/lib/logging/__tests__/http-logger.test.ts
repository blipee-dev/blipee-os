/**
 * Tests for HTTP Logger
 * Phase 4, Task 4.1: HTTP middleware testing
 */

import { NextRequest, NextResponse } from 'next/server';
import { httpLogger, withLogging } from '../http-logger';
import { logger } from '../structured-logger';

// Mock the logger
jest.mock('../structured-logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis(),
    runWithContext: jest.fn((context, fn) => fn())
  }
}));

describe('HTTP Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('httpLogger middleware', () => {
    it('should log successful requests', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        method: 'GET',
        headers: {
          'user-agent': 'test-agent',
          'x-forwarded-for': '192.168.1.1'
        }
      });

      const mockHandler = jest.fn().mockResolvedValue(
        NextResponse.json({ success: true }, { status: 200 })
      );

      await httpLogger(mockRequest, mockHandler);

      expect(logger.runWithContext).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('HTTP GET /api/test'),
        expect.objectContaining({
          method: 'GET',
          path: '/api/test',
          status: 200,
          userAgent: 'test-agent',
          ip: '192.168.1.1'
        })
      );
    });

    it('should log failed requests', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        method: 'POST'
      });

      const error = new Error('Test error');
      const mockHandler = jest.fn().mockRejectedValue(error);

      await expect(httpLogger(mockRequest, mockHandler)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        'HTTP request failed',
        error,
        expect.objectContaining({
          method: 'POST',
          path: '/api/test'
        })
      );
    });

    it('should sanitize sensitive headers', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test', {
        headers: {
          'authorization': 'Bearer token123',
          'cookie': 'session=abc123',
          'x-api-key': 'secret-key',
          'content-type': 'application/json'
        }
      });

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({}));

      await httpLogger(mockRequest, mockHandler);

      const logCall = (logger.info as jest.Mock).mock.calls[0];
      const loggedHeaders = logCall[1].headers;

      expect(loggedHeaders.authorization).toBe('[REDACTED]');
      expect(loggedHeaders.cookie).toBe('[REDACTED]');
      expect(loggedHeaders['x-api-key']).toBe('[REDACTED]');
      expect(loggedHeaders['content-type']).toBe('application/json');
    });

    it('should add correlation headers to response', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockResponse = NextResponse.json({ data: 'test' });
      const mockHandler = jest.fn().mockResolvedValue(mockResponse);

      const response = await httpLogger(mockRequest, mockHandler);

      expect(response.headers.get('x-request-id')).toBeDefined();
      expect(response.headers.get('x-correlation-id')).toBeDefined();
      expect(response.headers.get('x-response-time')).toBeDefined();
    });

    it('should measure request duration', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn().mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return NextResponse.json({});
      });

      await httpLogger(mockRequest, mockHandler);

      const logCall = (logger.info as jest.Mock).mock.calls[0];
      expect(logCall[1].duration).toBeGreaterThan(90);
      expect(logCall[1].duration).toBeLessThan(200);
    });

    it('should handle query parameters', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test?page=1&limit=10');
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({}));

      await httpLogger(mockRequest, mockHandler);

      const logCall = (logger.info as jest.Mock).mock.calls[0];
      expect(logCall[1].query).toEqual({
        page: '1',
        limit: '10'
      });
    });
  });

  describe('withLogging decorator', () => {
    it('should wrap route handlers with logging', async () => {
      const handler = jest.fn().mockResolvedValue(
        NextResponse.json({ message: 'Hello' })
      );

      const wrappedHandler = withLogging(handler);
      const mockRequest = new NextRequest('http://localhost/api/hello');

      const response = await wrappedHandler(mockRequest);

      expect(handler).toHaveBeenCalledWith(mockRequest);
      expect(logger.info).toHaveBeenCalled();
      expect(response.headers.get('x-request-id')).toBeDefined();
    });

    it('should handle errors in wrapped handlers', async () => {
      const error = new Error('Handler error');
      const handler = jest.fn().mockRejectedValue(error);

      const wrappedHandler = withLogging(handler);
      const mockRequest = new NextRequest('http://localhost/api/error');

      await expect(wrappedHandler(mockRequest)).rejects.toThrow(error);

      expect(logger.error).toHaveBeenCalledWith(
        'HTTP request failed',
        error,
        expect.any(Object)
      );
    });

    it('should preserve handler context', async () => {
      const context = { value: 'test' };
      const handler = jest.fn(function(this: any) {
        return NextResponse.json({ context: this.value });
      });

      const wrappedHandler = withLogging(handler.bind(context));
      const mockRequest = new NextRequest('http://localhost/api/context');

      const response = await wrappedHandler(mockRequest);
      const data = await response.json();

      expect(data.context).toBe('test');
    });
  });

  describe('Edge cases', () => {
    it('should handle requests without user-agent', async () => {
      const mockRequest = new NextRequest('http://localhost/api/test');
      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({}));

      await httpLogger(mockRequest, mockHandler);

      const logCall = (logger.info as jest.Mock).mock.calls[0];
      expect(logCall[1].userAgent).toBeUndefined();
    });

    it('should handle non-JSON responses', async () => {
      const mockRequest = new NextRequest('http://localhost/api/text');
      const mockHandler = jest.fn().mockResolvedValue(
        new NextResponse('Plain text', {
          headers: { 'content-type': 'text/plain' }
        })
      );

      await httpLogger(mockRequest, mockHandler);

      expect(logger.info).toHaveBeenCalled();
    });

    it('should use existing correlation ID if provided', async () => {
      const correlationId = 'existing-correlation-id';
      const mockRequest = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-correlation-id': correlationId
        }
      });

      const mockHandler = jest.fn().mockResolvedValue(NextResponse.json({}));
      const response = await httpLogger(mockRequest, mockHandler);

      expect(response.headers.get('x-correlation-id')).toBe(correlationId);
    });
  });
});