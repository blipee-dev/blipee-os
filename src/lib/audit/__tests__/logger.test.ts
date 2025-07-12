import { jest } from '@jest/globals';
import { 
  AuditLogger,
  createAuditLogger,
  logEvent,
  logAction,
  logError,
  getAuditLogs 
} from '../logger';

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn(() => ({
        data: [],
        error: null
      }))
    }))
  }))
}));

describe('AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    logger = createAuditLogger({
      enabled: true,
      logLevel: 'info'
    });
  });

  describe('logEvent', () => {
    it('should log an event', async () => {
      await expect(logEvent({
        type: 'user.login',
        userId: 'user-1',
        metadata: { ip: '127.0.0.1' }
      })).resolves.not.toThrow();
    });

    it('should include timestamp', async () => {
      const mockInsert = jest.fn().mockReturnValue({ error: null });
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: mockInsert
        }))
      });

      await logEvent({
        type: 'test.event',
        userId: 'user-1'
      });

      expect(mockInsert).toHaveBeenCalled();
      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData).toHaveProperty('timestamp');
    });
  });

  describe('logAction', () => {
    it('should log user action', async () => {
      await expect(logAction({
        action: 'create',
        resource: 'building',
        resourceId: 'building-1',
        userId: 'user-1'
      })).resolves.not.toThrow();
    });

    it('should categorize as action type', async () => {
      const mockInsert = jest.fn().mockReturnValue({ error: null });
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: mockInsert
        }))
      });

      await logAction({
        action: 'update',
        resource: 'organization',
        resourceId: 'org-1',
        userId: 'user-1'
      });

      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData.type).toContain('action');
    });
  });

  describe('logError', () => {
    it('should log error event', async () => {
      await expect(logError({
        error: new Error('Test error'),
        context: { endpoint: '/api/test' },
        userId: 'user-1'
      })).resolves.not.toThrow();
    });

    it('should include error details', async () => {
      const mockInsert = jest.fn().mockReturnValue({ error: null });
      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          insert: mockInsert
        }))
      });

      const error = new Error('Test error');
      await logError({
        error,
        context: { operation: 'test' }
      });

      const insertedData = mockInsert.mock.calls[0][0];
      expect(insertedData.metadata).toHaveProperty('error');
      expect(insertedData.metadata.error).toContain('Test error');
    });
  });

  describe('getAuditLogs', () => {
    it('should retrieve audit logs', async () => {
      const logs = await getAuditLogs({
        userId: 'user-1',
        limit: 10
      });

      expect(Array.isArray(logs)).toBe(true);
    });

    it('should filter by date range', async () => {
      const mockQuery = {
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn(() => ({ data: [], error: null }))
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => mockQuery)
      });

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await getAuditLogs({
        startDate,
        endDate
      });

      expect(mockQuery.gte).toHaveBeenCalledWith('timestamp', startDate.toISOString());
      expect(mockQuery.lte).toHaveBeenCalledWith('timestamp', endDate.toISOString());
    });

    it('should order by timestamp descending', async () => {
      const mockQuery = {
        order: jest.fn().mockReturnThis(),
        limit: jest.fn(() => ({ data: [], error: null }))
      };

      const { createClient } = require('@/lib/supabase/server');
      createClient.mockReturnValue({
        from: jest.fn(() => mockQuery)
      });

      await getAuditLogs({});

      expect(mockQuery.order).toHaveBeenCalledWith('timestamp', { ascending: false });
    });
  });
});