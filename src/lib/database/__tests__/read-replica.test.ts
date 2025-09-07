import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { 
  readReplicaManager,
  queryReadReplica,
  createReadReplicaClient 
} from '../read-replica';
import { queryRouter, smartQuery } from '../query-router';
import { 
  RoundRobinStrategy,
  LeastConnectionsStrategy,
  GeographicStrategy,
  AdaptiveStrategy 
} from '../load-balancer';

// Mock pg module
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    }),
    on: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
    totalCount: 5,
    idleCount: 3,
    waitingCount: 0,
    options: { max: 10 },
  })),
}));

describe('Read Replica Management', () => {
  beforeEach(() => {
    // Set up test environment
    process.env.SUPABASE_READ_REPLICA_URLS = 'postgresql://test1.db.com,postgresql://test2.db.com';
    process.env.SUPABASE_READ_REPLICA_REGIONS = 'us-east-1,eu-west-1';
    process.env.SUPABASE_READ_REPLICA_WEIGHTS = '2,1';
  });

  afterEach(async () => {
    await readReplicaManager.close();
    jest.clearAllMocks();
  });

  describe('Read Replica Manager', () => {
    it('should initialize replicas from environment', () => {
      const stats = readReplicaManager.getStatistics();
      expect(stats.total).toBe(2);
      expect(stats.replicas[0].region).toBe('us-east-1');
      expect(stats.replicas[1].region).toBe('eu-west-1');
    });

    it('should handle weighted replica selection', () => {
      const selections = new Map<string, number>();
      
      // Make 100 selections
      for (let i = 0; i < 100; i++) {
        const replica = readReplicaManager.getReadReplica();
        if (replica) {
          const key = replica.region || 'unknown';
          selections.set(key, (selections.get(key) || 0) + 1);
        }
      }

      // US replica (weight 2) should get roughly twice the traffic
      const usSelections = selections.get('us-east-1') || 0;
      const euSelections = selections.get('eu-west-1') || 0;
      
      expect(usSelections).toBeGreaterThan(euSelections);
      expect(usSelections / euSelections).toBeCloseTo(2, 1);
    });

    it('should handle regional replica selection', () => {
      const replica = readReplicaManager.getRegionalReplica('eu-west-1');
      expect(replica?.region).toBe('eu-west-1');
    });

    it('should fall back when regional replica unavailable', () => {
      const replica = readReplicaManager.getRegionalReplica('ap-south-1');
      expect(replica).not.toBeNull();
      expect(['us-east-1', 'eu-west-1']).toContain(replica?.region);
    });

    it('should execute queries on replicas', async () => {
      const mockQuery = jest.fn().mockResolvedValue({ rows: [{ count: 10 }] });
      const mockPool = {
        connect: jest.fn().mockResolvedValue({
          query: mockQuery,
          release: jest.fn(),
        }),
      };
      
      // Mock the pool for testing
      readReplicaManager['replicas'][0].pool = mockPool as any;

      const result = await queryReadReplica('SELECT COUNT(*) FROM users');
      
      expect(mockQuery).toHaveBeenCalledWith('SELECT COUNT(*) FROM users', undefined);
      expect(result).toEqual([{ count: 10 }]);
    });

    it('should handle query errors and fallback', async () => {
      const mockError = new Error('Connection failed');
      const mockPool = {
        connect: jest.fn().mockRejectedValue(mockError),
      };
      
      readReplicaManager['replicas'].forEach(r => {
        r.pool = mockPool as any;
      });

      // Mock primary query
      jest.mock('../connection-pool', () => ({
        query: jest.fn().mockResolvedValue([{ count: 5 }]),
      }));

      await expect(
        queryReadReplica('SELECT * FROM users', [], { fallbackToPrimary: false })
      ).rejects.toThrow('Connection failed');

      // With fallback enabled
      const result = await queryReadReplica(
        'SELECT * FROM users', 
        [], 
        { fallbackToPrimary: true }
      );
      
      // Should fall back to primary (mocked)
      expect(result).toBeDefined();
    });
  });

  describe('Query Router', () => {
    it('should route read queries to replicas', () => {
      const plan = queryRouter.planQuery('SELECT * FROM users');
      expect(plan.target).toBe('replica');
      expect(plan.reason).toBe('Read query with acceptable staleness');
    });

    it('should route write queries to primary', () => {
      const plan = queryRouter.planQuery('INSERT INTO users (name) VALUES ($1)');
      expect(plan.target).toBe('primary');
      expect(plan.reason).toBe('Write operation');
    });

    it('should respect consistency requirements', () => {
      const plan = queryRouter.planQuery('SELECT * FROM accounts', {
        consistency: 'strong',
      });
      expect(plan.target).toBe('primary');
      expect(plan.reason).toBe('Strong consistency required');
    });

    it('should detect recent writes and route to primary', () => {
      // Record a recent write
      queryRouter.recordWrite(['users']);

      const plan = queryRouter.planQuery('SELECT * FROM users', {
        maxStaleness: 100, // 100ms
      });
      
      expect(plan.target).toBe('primary');
      expect(plan.reason).toBe('Recent write detected');
    });

    it('should force routing when specified', () => {
      const replicaPlan = queryRouter.planQuery('SELECT * FROM users', {
        forceReplica: true,
      });
      expect(replicaPlan.target).toBe('replica');

      const primaryPlan = queryRouter.planQuery('SELECT * FROM users', {
        forcePrimary: true,
      });
      expect(primaryPlan.target).toBe('primary');
    });
  });

  describe('Load Balancing Strategies', () => {
    const mockReplicas = [
      {
        url: 'replica1',
        pool: {} as any,
        healthy: true,
        lastHealthCheck: new Date(),
        weight: 1,
        requestCount: 10,
        errorCount: 1,
        averageLatency: 20,
      },
      {
        url: 'replica2',
        pool: {} as any,
        healthy: true,
        lastHealthCheck: new Date(),
        weight: 2,
        requestCount: 5,
        errorCount: 0,
        averageLatency: 15,
      },
      {
        url: 'replica3',
        pool: {} as any,
        healthy: false,
        lastHealthCheck: new Date(),
        weight: 1,
        requestCount: 0,
        errorCount: 10,
        averageLatency: 100,
      },
    ];

    it('should use round-robin strategy', () => {
      const strategy = new RoundRobinStrategy();
      
      const selections = [];
      for (let i = 0; i < 4; i++) {
        const replica = strategy.select(mockReplicas);
        selections.push(replica?.url);
      }
      
      expect(selections).toEqual(['replica1', 'replica2', 'replica1', 'replica2']);
    });

    it('should use least-connections strategy', () => {
      const strategy = new LeastConnectionsStrategy();
      const replica = strategy.select(mockReplicas);
      
      expect(replica?.url).toBe('replica2'); // Has fewer requests
    });

    it('should use geographic strategy', () => {
      const regionalReplicas = mockReplicas.map((r, i) => ({
        ...r,
        region: ['us-east-1', 'eu-west-1', 'ap-south-1'][i],
      }));
      
      const strategy = new GeographicStrategy('eu-west-1');
      const replica = strategy.select(regionalReplicas);
      
      expect(replica?.region).toBe('eu-west-1');
    });

    it('should adapt strategy based on conditions', () => {
      const strategy = new AdaptiveStrategy();
      
      // High latency variance should trigger least-response-time
      const highVarianceReplicas = [
        { ...mockReplicas[0], averageLatency: 10 },
        { ...mockReplicas[1], averageLatency: 100 },
      ];
      
      const replica = strategy.select(highVarianceReplicas);
      expect(replica?.averageLatency).toBe(10);
    });
  });

  describe('Smart Query Helper', () => {
    it('should provide convenient query methods', async () => {
      const mockExecute = jest.spyOn(queryRouter, 'execute')
        .mockResolvedValue([{ id: 1 }]);

      // Select query
      await smartQuery.select('SELECT * FROM users');
      expect(mockExecute).toHaveBeenCalledWith(
        'SELECT * FROM users',
        undefined,
        expect.objectContaining({ preferReplica: true })
      );

      // Mutate query
      await smartQuery.mutate('INSERT INTO users (name) VALUES ($1)', ['John']);
      expect(mockExecute).toHaveBeenCalledWith(
        'INSERT INTO users (name) VALUES ($1)',
        ['John'],
        expect.objectContaining({ forcePrimary: true })
      );

      mockExecute.mockRestore();
    });

    it('should provide statistics', () => {
      const stats = smartQuery.getStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('healthy');
      expect(stats).toHaveProperty('replicas');
    });
  });
});