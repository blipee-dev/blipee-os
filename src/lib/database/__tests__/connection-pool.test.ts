import { describe, expect, it, jest, beforeAll, afterAll } from '@jest/globals';
import { 
  createConnectionPool, 
  getPoolClient, 
  query, 
  transaction,
  checkPoolHealth,
  closeConnectionPool 
} from '../connection-pool';
import { dbMonitor } from '../monitoring';

describe('Database Connection Pool', () => {
  beforeAll(() => {
    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
    process.env.PGBOUNCER_HOST = 'localhost';
    process.env.PGBOUNCER_PORT = '6432';
  });
  
  afterAll(async () => {
    await closeConnectionPool();
  });
  
  describe('Connection Pool Creation', () => {
    it('should create a connection pool singleton', () => {
      const pool1 = createConnectionPool();
      const pool2 = createConnectionPool();
      
      expect(pool1).toBe(pool2);
    });
    
    it('should use PgBouncer config when enabled', () => {
      process.env.PGBOUNCER_HOST = 'pgbouncer.example.com';
      
      const pool = createConnectionPool();
      expect(pool.options.host).toBe('pgbouncer.example.com');
      expect(pool.options.port).toBe(6432);
    });
  });
  
  describe('Pool Client Management', () => {
    it('should acquire and release clients', async () => {
      const client = await getPoolClient();
      expect(client).toBeDefined();
      expect(client.query).toBeDefined();
      expect(client.release).toBeDefined();
      
      client.release();
    });
    
    it('should add query timing to clients', async () => {
      const client = await getPoolClient();
      const consoleSpy = jest.spyOn(console, 'warn');
      
      // Mock slow query
      client.query = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ rows: [] }), 150))
      );
      
      await client.query('SELECT 1');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Slow query detected'),
        'SELECT 1'
      );
      
      client.release();
      consoleSpy.mockRestore();
    });
  });
  
  describe('Query Execution', () => {
    it('should execute simple queries', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rows: [{ id: 1 }] });
      jest.spyOn(require('../connection-pool'), 'getPoolClient')
        .mockResolvedValue({
          query: mockQuery,
          release: jest.fn(),
        });
      
      const result = await query('SELECT * FROM users WHERE id = $1', [1]);
      
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result).toEqual([{ id: 1 }]);
    });
  });
  
  describe('Transactions', () => {
    it('should handle successful transactions', async () => {
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [] }),
        release: jest.fn(),
      };
      
      jest.spyOn(require('../connection-pool'), 'getPoolClient')
        .mockResolvedValue(mockClient);
      
      const result = await transaction(async (client) => {
        await client.query('INSERT INTO logs (action) VALUES ($1)', ['test']);
        return { success: true };
      });
      
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(result).toEqual({ success: true });
    });
    
    it('should rollback failed transactions', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({ rows: [] }) // BEGIN
          .mockRejectedValueOnce(new Error('Insert failed')), // INSERT
        release: jest.fn(),
      };
      
      jest.spyOn(require('../connection-pool'), 'getPoolClient')
        .mockResolvedValue(mockClient);
      
      await expect(
        transaction(async (client) => {
          await client.query('INSERT INTO logs (action) VALUES ($1)', ['test']);
        })
      ).rejects.toThrow('Insert failed');
      
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
  
  describe('Health Checks', () => {
    it('should report pool health', async () => {
      const mockPool = {
        connect: jest.fn().mockResolvedValue({
          query: jest.fn().mockResolvedValue({}),
          release: jest.fn(),
        }),
        totalCount: 5,
        idleCount: 3,
        waitingCount: 0,
        options: { max: 10 },
      };
      
      jest.spyOn(require('../connection-pool'), 'createConnectionPool')
        .mockReturnValue(mockPool);
      
      const health = await checkPoolHealth();
      
      expect(health).toEqual({
        healthy: true,
        totalClients: 5,
        idleClients: 3,
        waitingClients: 0,
        maxClients: 10,
      });
    });
    
    it('should report unhealthy pool on connection failure', async () => {
      const mockPool = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        totalCount: 0,
        idleCount: 0,
        waitingCount: 5,
        options: { max: 10 },
      };
      
      jest.spyOn(require('../connection-pool'), 'createConnectionPool')
        .mockReturnValue(mockPool);
      
      const health = await checkPoolHealth();
      
      expect(health.healthy).toBe(false);
      expect(health.waitingClients).toBe(5);
    });
  });
  
  describe('Monitoring Integration', () => {
    it('should record query metrics', async () => {
      const recordSpy = jest.spyOn(dbMonitor, 'recordQuery');
      
      const mockClient = {
        query: jest.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 }),
        release: jest.fn(),
      };
      
      jest.spyOn(require('../connection-pool'), 'getPoolClient')
        .mockResolvedValue(mockClient);
      
      await query('SELECT * FROM users');
      
      expect(recordSpy).toHaveBeenCalledWith({
        query: 'SELECT * FROM users',
        duration: expect.any(Number),
        timestamp: expect.any(Date),
        success: true,
        rowCount: 1,
        params: undefined,
      });
    });
  });
});