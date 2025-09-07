import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { IndexOptimizer } from '../index-optimizer';
import { QueryAnalyzer } from '../query-analyzer';

// Mock Supabase client
const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(),
};

// Mock getPooledAdminClient
jest.mock('../pooled-client', () => ({
  getPooledAdminClient: () => mockSupabase,
}));

describe('Database Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('IndexOptimizer', () => {
    let indexOptimizer: IndexOptimizer;

    beforeEach(() => {
      indexOptimizer = new IndexOptimizer();
    });

    it('should create an index with correct SQL', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const index = {
        name: 'idx_test_table_column',
        table: 'test_table',
        columns: ['column1', 'column2'],
        type: 'btree' as const,
        unique: false,
      };

      const result = await indexOptimizer.createIndex(index);

      expect(result).toBe(true);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_sql', {
        sql_query: 'CREATE INDEX IF NOT EXISTS idx_test_table_column ON test_table (column1, column2)',
      });
    });

    it('should create a unique index', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const index = {
        name: 'idx_unique_test',
        table: 'test_table',
        columns: ['email'],
        type: 'btree' as const,
        unique: true,
      };

      await indexOptimizer.createIndex(index);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_sql', {
        sql_query: 'CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_test ON test_table (email)',
      });
    });

    it('should create a partial index with WHERE clause', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const index = {
        name: 'idx_partial_test',
        table: 'test_table',
        columns: ['status'],
        type: 'btree' as const,
        where: "status = 'active'",
      };

      await indexOptimizer.createIndex(index);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_sql', {
        sql_query: "CREATE INDEX IF NOT EXISTS idx_partial_test ON test_table (status) WHERE status = 'active'",
      });
    });

    it('should create a covering index with INCLUDE', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const index = {
        name: 'idx_covering_test',
        table: 'test_table',
        columns: ['id'],
        type: 'btree' as const,
        include: ['name', 'email'],
      };

      await indexOptimizer.createIndex(index);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_sql', {
        sql_query: 'CREATE INDEX IF NOT EXISTS idx_covering_test ON test_table (id) INCLUDE (name, email)',
      });
    });

    it('should create a GIN index for JSONB', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: null });

      const index = {
        name: 'idx_gin_test',
        table: 'test_table',
        columns: ['metadata'],
        type: 'gin' as const,
      };

      await indexOptimizer.createIndex(index);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('execute_sql', {
        sql_query: 'CREATE INDEX IF NOT EXISTS idx_gin_test ON test_table USING gin (metadata)',
      });
    });

    it('should handle index creation errors', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({ 
        data: null, 
        error: { message: 'Index already exists' } 
      });

      const index = {
        name: 'idx_test',
        table: 'test_table',
        columns: ['column1'],
        type: 'btree' as const,
      };

      const result = await indexOptimizer.createIndex(index);

      expect(result).toBe(false);
    });

    it('should get index statistics', async () => {
      const mockStats = [
        {
          index_name: 'idx_test',
          table_name: 'test_table',
          index_size: '8192 bytes',
          idx_scan: 100,
          idx_tup_read: 1000,
          idx_tup_fetch: 900,
          created_at: '2024-01-01',
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: mockStats, error: null });

      const stats = await indexOptimizer.getIndexStats('idx_test');

      expect(stats).toHaveLength(1);
      expect(stats[0].name).toBe('idx_test');
      expect(stats[0].effectiveness).toBe(10); // 1000 / 100
    });

    it('should analyze index usage', async () => {
      const mockStats = [
        {
          index_name: 'idx_unused',
          table_name: 'test_table',
          index_size: '8192 bytes',
          idx_scan: 0,
          idx_tup_read: 0,
          idx_tup_fetch: 0,
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          index_name: 'idx_inefficient',
          table_name: 'test_table',
          index_size: '16384 bytes',
          idx_scan: 100,
          idx_tup_read: 500,
          idx_tup_fetch: 400,
          created_at: '2024-01-01',
        },
      ];

      mockSupabase.rpc.mockResolvedValueOnce({ data: mockStats, error: null });

      const analysis = await indexOptimizer.analyzeIndexUsage(30);

      expect(analysis.unused).toHaveLength(1);
      expect(analysis.unused[0].name).toBe('idx_unused');
      expect(analysis.inefficient).toHaveLength(1);
      expect(analysis.inefficient[0].name).toBe('idx_inefficient');
    });
  });

  describe('QueryAnalyzer', () => {
    let queryAnalyzer: QueryAnalyzer;

    beforeEach(() => {
      queryAnalyzer = new QueryAnalyzer(mockSupabase as any);
    });

    it('should analyze a query', async () => {
      const mockPlan = {
        'QUERY PLAN': [{
          'Node Type': 'Seq Scan',
          'Relation Name': 'test_table',
          'Total Cost': 100,
          'Actual Total Time': 50,
          'Actual Rows': 1000,
          'Query Text': 'SELECT * FROM test_table',
        }],
      };

      mockSupabase.rpc.mockResolvedValueOnce({ data: mockPlan, error: null });

      const analysis = await queryAnalyzer.analyzeQuery('SELECT * FROM test_table');

      expect(analysis.estimatedCost).toBe(100);
      expect(analysis.executionTime).toBe(50);
      expect(analysis.rowsReturned).toBe(1000);
      expect(analysis.suggestions).toHaveLength(1);
      expect(analysis.suggestions[0]).toContain('Sequential scan');
    });

    it('should get table statistics', async () => {
      const mockStats = [{
        row_count: 10000,
        table_size: '1 MB',
        index_size: '512 KB',
        total_size: '1.5 MB',
        bloat_ratio: 1.2,
        last_vacuum: '2024-01-01',
        last_analyze: '2024-01-01',
      }];

      const mockUnusedIndexes = [
        { index_name: 'idx_unused' },
      ];

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: mockStats, error: null })
        .mockResolvedValueOnce({ data: mockUnusedIndexes, error: null });

      const stats = await queryAnalyzer.getTableStatistics('test_table');

      expect(stats.rowCount).toBe(10000);
      expect(stats.tableSize).toBe('1 MB');
      expect(stats.bloatRatio).toBe(1.2);
      expect(stats.unusedIndexes).toContain('idx_unused');
    });

    it('should recommend indexes based on query patterns', async () => {
      const mockTables = [
        { table_name: 'emissions' },
        { table_name: 'buildings' },
      ];

      mockSupabase.rpc
        .mockResolvedValueOnce({ data: mockTables, error: null })
        .mockResolvedValue({ data: [], error: null });

      const recommendations = await queryAnalyzer.recommendIndexes(['emissions', 'buildings']);

      expect(recommendations).toBeDefined();
    });
  });

  describe('Query Router', () => {
    it('should identify read-only queries', () => {
      const { QueryRouter } = require('../query-router');
      const router = new QueryRouter();

      expect(router['isReadOnlyQuery']('SELECT * FROM table')).toBe(true);
      expect(router['isReadOnlyQuery']('WITH cte AS (SELECT 1) SELECT * FROM cte')).toBe(true);
      expect(router['isReadOnlyQuery']('INSERT INTO table VALUES (1)')).toBe(false);
      expect(router['isReadOnlyQuery']('UPDATE table SET col = 1')).toBe(false);
      expect(router['isReadOnlyQuery']('DELETE FROM table')).toBe(false);
    });

    it('should extract table names from queries', () => {
      const { QueryRouter } = require('../query-router');
      const router = new QueryRouter();

      const tables = router['extractTableNames'](
        'SELECT * FROM users u JOIN organizations o ON u.org_id = o.id'
      );

      expect(tables).toContain('users');
      expect(tables).toContain('organizations');
    });

    it('should plan query execution correctly', () => {
      const { QueryRouter } = require('../query-router');
      const router = new QueryRouter();

      // Write query should go to primary
      let plan = router.planQuery('INSERT INTO users VALUES (1)');
      expect(plan.target).toBe('primary');
      expect(plan.reason).toBe('Write operation');

      // Read query should consider replicas
      plan = router.planQuery('SELECT * FROM users');
      expect(plan.target).toBeDefined();
      expect(plan.reason).toBeDefined();

      // Force primary
      plan = router.planQuery('SELECT * FROM users', { forcePrimary: true });
      expect(plan.target).toBe('primary');
      expect(plan.reason).toBe('Forced to primary');

      // Strong consistency
      plan = router.planQuery('SELECT * FROM users', { consistency: 'strong' });
      expect(plan.target).toBe('primary');
      expect(plan.reason).toBe('Strong consistency required');
    });
  });
});