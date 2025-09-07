import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getPooledAdminClient } from './pooled-client';
import { dbMonitor } from './monitoring';

export interface QueryAnalysis {
  query: string;
  estimatedCost: number;
  executionTime: number;
  rowsReturned: number;
  indexesUsed: string[];
  suggestions: string[];
  queryPlan: any;
}

export interface IndexRecommendation {
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist';
  reason: string;
  estimatedImprovement: string;
  createStatement: string;
}

export interface TableStatistics {
  table: string;
  rowCount: number;
  tableSize: string;
  indexSize: string;
  unusedIndexes: string[];
  missingIndexes: IndexRecommendation[];
  bloatRatio: number;
}

/**
 * Query analyzer for database optimization
 */
export class QueryAnalyzer {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Analyze a specific query
   */
  async analyzeQuery(sql: string, params?: any[]): Promise<QueryAnalysis> {
    // Use EXPLAIN ANALYZE to get query plan
    const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`;
    
    try {
      const { data, error } = await this.supabase.rpc('analyze_query', {
        query_text: explainQuery,
        query_params: params || []
      });

      if (error) throw error;

      const plan = data[0]['QUERY PLAN'][0];
      const analysis = this.parseQueryPlan(plan);

      // Record in monitoring
      dbMonitor.recordQuery({
        query: sql,
        duration: analysis.executionTime,
        timestamp: new Date(),
        success: true,
        rowCount: analysis.rowsReturned,
        params
      });

      return analysis;
    } catch (error) {
      console.error('Query analysis failed:', error);
      throw error;
    }
  }

  /**
   * Parse PostgreSQL query plan
   */
  private parseQueryPlan(plan: any): QueryAnalysis {
    const analysis: QueryAnalysis = {
      query: plan['Query Text'] || '',
      estimatedCost: plan['Total Cost'] || 0,
      executionTime: plan['Actual Total Time'] || 0,
      rowsReturned: plan['Actual Rows'] || 0,
      indexesUsed: [],
      suggestions: [],
      queryPlan: plan
    };

    // Extract index usage
    this.extractIndexUsage(plan, analysis.indexesUsed);

    // Generate suggestions
    this.generateSuggestions(plan, analysis.suggestions);

    return analysis;
  }

  /**
   * Extract index usage from query plan
   */
  private extractIndexUsage(node: any, indexes: string[]): void {
    if (node['Index Name']) {
      indexes.push(node['Index Name']);
    }

    if (node['Plans']) {
      node['Plans'].forEach((child: any) => {
        this.extractIndexUsage(child, indexes);
      });
    }
  }

  /**
   * Generate optimization suggestions
   */
  private generateSuggestions(plan: any, suggestions: string[]): void {
    // Check for sequential scans
    if (plan['Node Type'] === 'Seq Scan' && plan['Actual Rows'] > 1000) {
      suggestions.push(
        `Sequential scan on ${plan['Relation Name']} returning ${plan['Actual Rows']} rows. ` +
        `Consider adding an index on the filter columns.`
      );
    }

    // Check for slow sorts
    if (plan['Node Type'] === 'Sort' && plan['Actual Total Time'] > 100) {
      suggestions.push(
        `Slow sort operation taking ${plan['Actual Total Time']}ms. ` +
        `Consider adding an index on the sort columns.`
      );
    }

    // Check for nested loops with high iterations
    if (plan['Node Type'] === 'Nested Loop' && plan['Actual Loops'] > 100) {
      suggestions.push(
        `Nested loop with ${plan['Actual Loops']} iterations. ` +
        `Consider rewriting the query or adding appropriate indexes.`
      );
    }

    // Recursive check for child nodes
    if (plan['Plans']) {
      plan['Plans'].forEach((child: any) => {
        this.generateSuggestions(child, suggestions);
      });
    }
  }

  /**
   * Get table statistics
   */
  async getTableStatistics(tableName: string): Promise<TableStatistics> {
    const { data, error } = await this.supabase.rpc('get_table_stats', {
      table_name: tableName
    });

    if (error) throw error;

    const stats = data[0];
    const missingIndexes = await this.identifyMissingIndexes(tableName);
    const unusedIndexes = await this.identifyUnusedIndexes(tableName);

    return {
      table: tableName,
      rowCount: stats.row_count,
      tableSize: stats.table_size,
      indexSize: stats.index_size,
      unusedIndexes,
      missingIndexes,
      bloatRatio: stats.bloat_ratio || 0
    };
  }

  /**
   * Identify missing indexes based on query patterns
   */
  private async identifyMissingIndexes(tableName: string): Promise<IndexRecommendation[]> {
    const recommendations: IndexRecommendation[] = [];
    
    // Analyze common query patterns from monitoring
    const queryStats = dbMonitor.getQueryStatistics();
    
    queryStats.forEach((stats, pattern) => {
      // Simple pattern matching for common cases
      const whereMatch = pattern.match(/WHERE\s+(\w+)\s*=\s*\$/gi);
      const joinMatch = pattern.match(/JOIN\s+\w+\s+ON\s+\w+\.(\w+)\s*=\s*\w+\.(\w+)/gi);
      
      if (whereMatch && pattern.includes(tableName)) {
        const columns = whereMatch.map(m => m.match(/WHERE\s+(\w+)/i)?.[1] || '').filter(Boolean);
        if (columns.length > 0) {
          recommendations.push({
            table: tableName,
            columns,
            type: 'btree',
            reason: `Frequent equality filters on ${columns.join(', ')}`,
            estimatedImprovement: '50-80% faster queries',
            createStatement: `CREATE INDEX idx_${tableName}_${columns.join('_')} ON ${tableName}(${columns.join(', ')});`
          });
        }
      }
    });

    return recommendations;
  }

  /**
   * Identify unused indexes
   */
  private async identifyUnusedIndexes(tableName: string): Promise<string[]> {
    const { data, error } = await this.supabase.rpc('get_unused_indexes', {
      table_name: tableName,
      days_threshold: 30
    });

    if (error) {
      console.error('Failed to identify unused indexes:', error);
      return [];
    }

    return data.map((idx: any) => idx.index_name);
  }

  /**
   * Recommend indexes for a set of tables
   */
  async recommendIndexes(tables: string[]): Promise<IndexRecommendation[]> {
    const allRecommendations: IndexRecommendation[] = [];

    for (const table of tables) {
      try {
        const stats = await this.getTableStatistics(table);
        allRecommendations.push(...stats.missingIndexes);
      } catch (error) {
        console.error(`Failed to analyze table ${table}:`, error);
      }
    }

    // Deduplicate and prioritize recommendations
    return this.prioritizeRecommendations(allRecommendations);
  }

  /**
   * Prioritize index recommendations
   */
  private prioritizeRecommendations(recommendations: IndexRecommendation[]): IndexRecommendation[] {
    // Remove duplicates
    const unique = new Map<string, IndexRecommendation>();
    
    recommendations.forEach(rec => {
      const key = `${rec.table}_${rec.columns.join('_')}`;
      if (!unique.has(key) || rec.estimatedImprovement > (unique.get(key)?.estimatedImprovement || '')) {
        unique.set(key, rec);
      }
    });

    // Sort by estimated improvement
    return Array.from(unique.values()).sort((a, b) => {
      const aImp = parseInt(a.estimatedImprovement) || 0;
      const bImp = parseInt(b.estimatedImprovement) || 0;
      return bImp - aImp;
    });
  }

  /**
   * Generate optimization report
   */
  async generateOptimizationReport(): Promise<{
    summary: {
      totalTables: number;
      totalIndexes: number;
      unusedIndexes: number;
      recommendedIndexes: number;
      estimatedImprovement: string;
    };
    details: TableStatistics[];
    recommendations: IndexRecommendation[];
    slowQueries: any[];
  }> {
    // Get all tables
    const { data: tables } = await this.supabase.rpc('get_all_tables');
    const tableNames = tables?.map((t: any) => t.table_name) || [];
    
    const details: TableStatistics[] = [];
    let totalUnusedIndexes = 0;
    let totalRecommendedIndexes = 0;

    // Analyze each table
    for (const tableName of tableNames) {
      try {
        const stats = await this.getTableStatistics(tableName);
        details.push(stats);
        totalUnusedIndexes += stats.unusedIndexes.length;
        totalRecommendedIndexes += stats.missingIndexes.length;
      } catch (error) {
        console.error(`Failed to analyze table ${tableName}:`, error);
      }
    }

    // Get all recommendations
    const recommendations = await this.recommendIndexes(tableNames);
    
    // Get slow queries
    const slowQueries = dbMonitor.getSlowQueries(10);

    return {
      summary: {
        totalTables: tableNames.length,
        totalIndexes: details.reduce((sum, t) => sum + (t.unusedIndexes.length || 0), 0),
        unusedIndexes: totalUnusedIndexes,
        recommendedIndexes: totalRecommendedIndexes,
        estimatedImprovement: '30-60% overall query performance improvement'
      },
      details,
      recommendations,
      slowQueries
    };
  }
}

// Export singleton instance
// Defer initialization to avoid build-time issues
let _queryAnalyzer: QueryAnalyzer | null = null;

export const queryAnalyzer = {
  analyzeQuery: async (...args: Parameters<QueryAnalyzer['analyzeQuery']>) => {
    if (!_queryAnalyzer) {
      _queryAnalyzer = new QueryAnalyzer(getPooledAdminClient());
    }
    return _queryAnalyzer.analyzeQuery(...args);
  },
  
  recommendIndexes: async (...args: Parameters<QueryAnalyzer['recommendIndexes']>) => {
    if (!_queryAnalyzer) {
      _queryAnalyzer = new QueryAnalyzer(getPooledAdminClient());
    }
    return _queryAnalyzer.recommendIndexes(...args);
  },
  
  getTableStatistics: async (...args: Parameters<QueryAnalyzer['getTableStatistics']>) => {
    if (!_queryAnalyzer) {
      _queryAnalyzer = new QueryAnalyzer(getPooledAdminClient());
    }
    return _queryAnalyzer.getTableStatistics(...args);
  },
  
  generateOptimizationReport: async (...args: Parameters<QueryAnalyzer['generateOptimizationReport']>) => {
    if (!_queryAnalyzer) {
      _queryAnalyzer = new QueryAnalyzer(getPooledAdminClient());
    }
    return _queryAnalyzer.generateOptimizationReport(...args);
  }
};