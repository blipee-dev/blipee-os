/**
 * Tests for Database Logger
 * Phase 4, Task 4.1: Database query logging tests
 */

import { DatabaseLogger, LogDatabaseQuery } from '../database-logger';
import { logger } from '../structured-logger';

// Mock the base logger
jest.mock('../structured-logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn().mockReturnThis()
  }
}));

describe('DatabaseLogger', () => {
  let dbLogger: DatabaseLogger;

  beforeEach(() => {
    dbLogger = new DatabaseLogger();
    jest.clearAllMocks();
  });

  describe('Query Logging', () => {
    it('should log successful queries', () => {
      dbLogger.logQuery(
        'SELECT * FROM users WHERE id = $1',
        ['123'],
        150,
        10,
        undefined
      );

      expect(logger.debug).toHaveBeenCalledWith(
        'Database query executed',
        expect.objectContaining({
          query: 'SELECT * FROM users WHERE id = $1',
          params: ['123'],
          duration: 150,
          rowCount: 10,
          operation: 'SELECT'
        })
      );
    });

    it('should log slow queries', () => {
      dbLogger.logQuery(
        'SELECT * FROM large_table',
        [],
        3500, // > 3000ms threshold
        1000000,
        undefined
      );

      expect(logger.warn).toHaveBeenCalledWith(
        'Slow database query detected',
        expect.objectContaining({
          query: 'SELECT * FROM large_table',
          duration: 3500,
          threshold: 3000,
          rowCount: 1000000
        })
      );
    });

    it('should log query errors', () => {
      const error = new Error('Table does not exist');
      dbLogger.logQuery(
        'SELECT * FROM non_existent_table',
        [],
        50,
        0,
        error
      );

      expect(logger.error).toHaveBeenCalledWith(
        'Database query failed',
        error,
        expect.objectContaining({
          query: 'SELECT * FROM non_existent_table',
          duration: 50
        })
      );
    });

    it('should redact sensitive parameters', () => {
      dbLogger.logQuery(
        'INSERT INTO users (email, password) VALUES ($1, $2)',
        ['user@example.com', 'secret123'],
        100,
        1,
        undefined
      );

      const logCall = (logger.debug as jest.Mock).mock.calls[0];
      const loggedParams = logCall[1].params;
      
      expect(loggedParams[0]).toBe('user@example.com');
      expect(loggedParams[1]).toBe('[REDACTED]');
    });

    it('should extract operation type correctly', () => {
      const queries = [
        { sql: 'INSERT INTO users VALUES ($1)', op: 'INSERT' },
        { sql: 'UPDATE users SET name = $1', op: 'UPDATE' },
        { sql: 'DELETE FROM users WHERE id = $1', op: 'DELETE' },
        { sql: 'SELECT COUNT(*) FROM users', op: 'SELECT' },
        { sql: '  SELECT * FROM users  ', op: 'SELECT' },
        { sql: 'WITH cte AS (SELECT * FROM users) SELECT * FROM cte', op: 'WITH' }
      ];

      queries.forEach(({ sql, op }) => {
        dbLogger.logQuery(sql, [], 100, 1, undefined);
        const lastCall = (logger.debug as jest.Mock).mock.calls.slice(-1)[0];
        expect(lastCall[1].operation).toBe(op);
      });
    });
  });

  describe('Transaction Logging', () => {
    it('should log transaction start', () => {
      dbLogger.logTransaction('tx-123', 'begin');

      expect(logger.info).toHaveBeenCalledWith(
        'Database transaction started',
        expect.objectContaining({
          transactionId: 'tx-123',
          operation: 'begin'
        })
      );
    });

    it('should log transaction commit', () => {
      dbLogger.logTransaction('tx-123', 'commit', 500);

      expect(logger.info).toHaveBeenCalledWith(
        'Database transaction committed',
        expect.objectContaining({
          transactionId: 'tx-123',
          operation: 'commit',
          duration: 500
        })
      );
    });

    it('should log transaction rollback', () => {
      dbLogger.logTransaction('tx-123', 'rollback', 200);

      expect(logger.warn).toHaveBeenCalledWith(
        'Database transaction rolled back',
        expect.objectContaining({
          transactionId: 'tx-123',
          operation: 'rollback',
          duration: 200
        })
      );
    });

    it('should warn on long-running transactions', () => {
      dbLogger.logTransaction('tx-123', 'commit', 15000); // > 10s

      expect(logger.warn).toHaveBeenCalledWith(
        'Long-running transaction detected',
        expect.objectContaining({
          transactionId: 'tx-123',
          duration: 15000,
          threshold: 10000
        })
      );
    });
  });

  describe('Connection Pool Logging', () => {
    it('should log connection pool stats', () => {
      dbLogger.logConnectionPool({
        total: 10,
        active: 5,
        idle: 3,
        waiting: 2
      });

      expect(logger.info).toHaveBeenCalledWith(
        'Database connection pool status',
        expect.objectContaining({
          pool: {
            total: 10,
            active: 5,
            idle: 3,
            waiting: 2,
            utilization: 0.5
          }
        })
      );
    });

    it('should warn on high pool utilization', () => {
      dbLogger.logConnectionPool({
        total: 10,
        active: 9,
        idle: 1,
        waiting: 5
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'High database connection pool utilization',
        expect.objectContaining({
          pool: expect.objectContaining({
            utilization: 0.9,
            waiting: 5
          })
        })
      );
    });

    it('should handle zero total connections', () => {
      dbLogger.logConnectionPool({
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0
      });

      const logCall = (logger.info as jest.Mock).mock.calls[0];
      expect(logCall[1].pool.utilization).toBe(0);
    });
  });

  describe('Sensitive Data Redaction', () => {
    it('should redact password in various query formats', () => {
      const queries = [
        "UPDATE users SET password = 'secret123' WHERE id = 1",
        "INSERT INTO auth (password, token) VALUES ('pwd', 'tok')",
        "SELECT * FROM users WHERE password = 'test'",
        "UPDATE profile SET api_key = 'key123', name = 'John'"
      ];

      queries.forEach(query => {
        dbLogger.logQuery(query, [], 100, 1, undefined);
      });

      const calls = (logger.debug as jest.Mock).mock.calls;
      calls.forEach(call => {
        const loggedQuery = call[1].query;
        expect(loggedQuery).toContain('[REDACTED]');
        expect(loggedQuery).not.toContain('secret123');
        expect(loggedQuery).not.toContain('pwd');
        expect(loggedQuery).not.toContain('key123');
      });
    });

    it('should redact sensitive parameters by position', () => {
      // Query with password at position 2 (0-indexed)
      dbLogger.logQuery(
        'UPDATE users SET email = $1, password = $2, name = $3 WHERE id = $4',
        ['user@example.com', 'secretPassword', 'John Doe', '123'],
        100,
        1,
        undefined
      );

      const logCall = (logger.debug as jest.Mock).mock.calls[0];
      const params = logCall[1].params;
      
      expect(params[0]).toBe('user@example.com');
      expect(params[1]).toBe('[REDACTED]');
      expect(params[2]).toBe('John Doe');
      expect(params[3]).toBe('123');
    });
  });

  describe('Decorator', () => {
    it('should log decorated database methods', async () => {
      class DatabaseService {
        @LogDatabaseQuery()
        async findUser(id: string): Promise<any> {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, 50));
          return { id, name: 'John Doe' };
        }
      }

      const service = new DatabaseService();
      const result = await service.findUser('123');

      expect(result.id).toBe('123');
      expect(logger.debug).toHaveBeenCalledWith(
        'Database operation completed',
        expect.objectContaining({
          method: 'findUser',
          duration: expect.any(Number)
        })
      );
    });

    it('should log slow decorated methods', async () => {
      class DatabaseService {
        @LogDatabaseQuery(100) // 100ms threshold
        async slowQuery(): Promise<void> {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }

      const service = new DatabaseService();
      await service.slowQuery();

      expect(logger.warn).toHaveBeenCalledWith(
        'Slow database operation detected',
        expect.objectContaining({
          method: 'slowQuery',
          threshold: 100
        })
      );
    });

    it('should log decorated method errors', async () => {
      class DatabaseService {
        @LogDatabaseQuery()
        async failingQuery(): Promise<void> {
          throw new Error('Connection refused');
        }
      }

      const service = new DatabaseService();
      
      await expect(service.failingQuery()).rejects.toThrow('Connection refused');
      expect(logger.error).toHaveBeenCalledWith(
        'Database operation failed',
        expect.any(Error),
        expect.objectContaining({
          method: 'failingQuery'
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle null parameters', () => {
      dbLogger.logQuery(
        'SELECT * FROM users WHERE deleted_at IS NULL',
        null as any,
        100,
        10,
        undefined
      );

      expect(logger.debug).toHaveBeenCalled();
      const logCall = (logger.debug as jest.Mock).mock.calls[0];
      expect(logCall[1].params).toBeNull();
    });

    it('should handle very long queries', () => {
      const longQuery = 'SELECT ' + 'column1, column2, column3, '.repeat(100) + ' FROM table';
      dbLogger.logQuery(longQuery, [], 100, 1, undefined);

      expect(logger.debug).toHaveBeenCalled();
      // Should truncate or handle gracefully
    });

    it('should handle non-standard SQL statements', () => {
      const statements = [
        'EXPLAIN ANALYZE SELECT * FROM users',
        'VACUUM ANALYZE users',
        'CREATE INDEX idx_users_email ON users(email)',
        'ALTER TABLE users ADD COLUMN age INT'
      ];

      statements.forEach(sql => {
        dbLogger.logQuery(sql, [], 100, 0, undefined);
      });

      expect(logger.debug).toHaveBeenCalledTimes(statements.length);
    });
  });
});