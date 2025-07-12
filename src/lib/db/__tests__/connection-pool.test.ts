import { 
  ConnectionPool,
  createPool,
  getConnection,
  releaseConnection,
  getPoolStats 
} from '../connection-pool';

// Mock database connection
class MockConnection {
  id: string;
  inUse: boolean;

  constructor(id: string) {
    this.id = id;
    this.inUse = false;
  }

  async query(sql: string) {
    return { rows: [], rowCount: 0 };
  }

  async close() {
    this.inUse = false;
  }
}

describe('connection-pool', () => {
  let pool: ConnectionPool;

  beforeEach(() => {
    pool = createPool({
      maxConnections: 5,
      minConnections: 2,
      connectionTimeout: 5000
    });
  });

  afterEach(async () => {
    await pool.close();
  });

  describe('createPool', () => {
    it('should create a connection pool', () => {
      expect(pool).toBeDefined();
      expect(pool).toHaveProperty('getConnection');
      expect(pool).toHaveProperty('releaseConnection');
    });

    it('should respect configuration', () => {
      const config = pool.getConfig();
      expect(config.maxConnections).toBe(5);
      expect(config.minConnections).toBe(2);
    });
  });

  describe('getConnection', () => {
    it('should get a connection from pool', async () => {
      const connection = await getConnection(pool);
      expect(connection).toBeDefined();
      expect(connection).toHaveProperty('query');
    });

    it('should handle concurrent requests', async () => {
      const connections = await Promise.all([
        getConnection(pool),
        getConnection(pool),
        getConnection(pool)
      ]);

      expect(connections).toHaveLength(3);
      connections.forEach(conn => {
        expect(conn).toBeDefined();
      });
    });

    it('should wait when pool is exhausted', async () => {
      // Get all available connections
      const connections = [];
      for (let i = 0; i < 5; i++) {
        connections.push(await getConnection(pool));
      }

      // Next request should wait
      const waitPromise = getConnection(pool);
      
      // Release one connection
      await releaseConnection(pool, connections[0]);
      
      // Now the waiting request should resolve
      const connection = await waitPromise;
      expect(connection).toBeDefined();
    });
  });

  describe('releaseConnection', () => {
    it('should release connection back to pool', async () => {
      const connection = await getConnection(pool);
      const stats = getPoolStats(pool);
      const activeCount = stats.activeConnections;

      await releaseConnection(pool, connection);
      const newStats = getPoolStats(pool);
      
      expect(newStats.activeConnections).toBe(activeCount - 1);
    });

    it('should handle releasing already released connection', async () => {
      const connection = await getConnection(pool);
      await releaseConnection(pool, connection);
      
      // Should not throw
      await expect(releaseConnection(pool, connection)).resolves.not.toThrow();
    });
  });

  describe('getPoolStats', () => {
    it('should return pool statistics', () => {
      const stats = getPoolStats(pool);
      
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('activeConnections');
      expect(stats).toHaveProperty('idleConnections');
      expect(stats).toHaveProperty('waitingRequests');
    });

    it('should update stats as connections are used', async () => {
      const initialStats = getPoolStats(pool);
      
      const connection = await getConnection(pool);
      const activeStats = getPoolStats(pool);
      
      expect(activeStats.activeConnections).toBe(initialStats.activeConnections + 1);
      
      await releaseConnection(pool, connection);
      const finalStats = getPoolStats(pool);
      
      expect(finalStats.activeConnections).toBe(initialStats.activeConnections);
    });
  });
});