import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getPooledAdminClient } from './pooled-client';

export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'brin';
  unique?: boolean;
  where?: string;
  include?: string[];
  comment?: string;
}

export interface IndexStatus {
  name: string;
  table: string;
  size: string;
  scansCount: number;
  tupleReads: number;
  effectiveness: number;
  created: Date;
}

/**
 * Index optimizer for database performance
 */
export class IndexOptimizer {
  private supabase: SupabaseClient<Database> | null = null;

  private getSupabase(): SupabaseClient<Database> {
    if (!this.supabase) {
      this.supabase = getPooledAdminClient();
    }
    return this.supabase;
  }

  /**
   * Core indexes for the application
   */
  private getCoreIndexes(): IndexDefinition[] {
    return [
      // Organization-based indexes
      {
        name: 'idx_emissions_org_period',
        table: 'emissions',
        columns: ['organization_id', 'period_start', 'period_end'],
        type: 'btree',
        comment: 'Optimize organization emission queries by date range'
      },
      {
        name: 'idx_emissions_source_period',
        table: 'emissions',
        columns: ['source_id', 'period_start'],
        type: 'btree',
        comment: 'Optimize emission source timeline queries'
      },
      {
        name: 'idx_emissions_verification',
        table: 'emissions',
        columns: ['verification_status', 'organization_id'],
        type: 'btree',
        where: "verification_status != 'unverified'",
        comment: 'Optimize verified emissions queries'
      },
      
      // API usage indexes
      {
        name: 'idx_api_usage_org_created',
        table: 'api_usage',
        columns: ['organization_id', 'created_at'],
        type: 'btree',
        comment: 'Optimize API usage analytics queries'
      },
      {
        name: 'idx_api_usage_key_created',
        table: 'api_usage',
        columns: ['api_key_id', 'created_at'],
        type: 'btree',
        comment: 'Optimize per-key usage queries'
      },
      {
        name: 'idx_api_usage_status',
        table: 'api_usage',
        columns: ['response_status'],
        type: 'btree',
        where: 'response_status >= 400',
        comment: 'Optimize error rate calculations'
      },
      
      // Organization members indexes
      {
        name: 'idx_org_members_composite',
        table: 'organization_members',
        columns: ['organization_id', 'user_id', 'invitation_status'],
        type: 'btree',
        comment: 'Optimize member lookup queries'
      },
      {
        name: 'idx_org_members_role',
        table: 'organization_members',
        columns: ['role', 'organization_id'],
        type: 'btree',
        where: "invitation_status = 'accepted'",
        comment: 'Optimize role-based access queries'
      },
      
      // Facilities indexes
      {
        name: 'idx_facilities_org_name',
        table: 'facilities',
        columns: ['organization_id', 'name'],
        type: 'btree',
        unique: true,
        comment: 'Ensure unique facility names per organization'
      },
      {
        name: 'idx_facilities_location',
        table: 'facilities',
        columns: ['country', 'state_province', 'city'],
        type: 'btree',
        comment: 'Optimize location-based queries'
      },
      
      // Messages indexes
      {
        name: 'idx_messages_conversation_created',
        table: 'messages',
        columns: ['conversation_id', 'created_at'],
        type: 'btree',
        comment: 'Optimize message history queries'
      },
      {
        name: 'idx_messages_user_created',
        table: 'messages',
        columns: ['user_id', 'created_at'],
        type: 'btree',
        comment: 'Optimize user message history'
      },
      
      // Security audit logs indexes
      {
        name: 'idx_security_logs_user_time',
        table: 'security_audit_logs',
        columns: ['user_id', 'timestamp'],
        type: 'btree',
        comment: 'Optimize user security event queries'
      },
      {
        name: 'idx_security_logs_ip_time',
        table: 'security_audit_logs',
        columns: ['ip_address', 'timestamp'],
        type: 'btree',
        comment: 'Optimize IP-based security analysis'
      },
      
      // JSONB indexes for metadata searches
      {
        name: 'idx_buildings_metadata_gin',
        table: 'buildings',
        columns: ['metadata'],
        type: 'gin',
        comment: 'Enable fast JSONB searches on building metadata'
      },
      {
        name: 'idx_emissions_metadata_gin',
        table: 'emissions',
        columns: ['metadata'],
        type: 'gin',
        comment: 'Enable fast JSONB searches on emission metadata'
      },
      
      // Partial indexes for status queries
      {
        name: 'idx_api_keys_active',
        table: 'api_keys',
        columns: ['organization_id', 'expires_at'],
        type: 'btree',
        where: "status = 'active' AND (expires_at IS NULL OR expires_at > NOW())",
        comment: 'Optimize active API key lookups'
      },
      
      // Covering indexes for common queries
      {
        name: 'idx_emissions_covering',
        table: 'emissions',
        columns: ['organization_id', 'period_start'],
        type: 'btree',
        include: ['co2e_tonnes', 'source_id'],
        comment: 'Covering index for emission summary queries'
      }
    ];
  }

  /**
   * Create an index
   */
  async createIndex(index: IndexDefinition): Promise<boolean> {
    try {
      let sql = `CREATE`;
      
      if (index.unique) sql += ' UNIQUE';
      
      sql += ` INDEX IF NOT EXISTS ${index.name} ON ${index.table}`;
      
      // Add USING clause for non-btree indexes
      if (index.type !== 'btree') {
        sql += ` USING ${index.type}`;
      }
      
      sql += ` (${index.columns.join(', ')})`;
      
      // Add INCLUDE clause for covering indexes
      if (index.include && index.include.length > 0) {
        sql += ` INCLUDE (${index.include.join(', ')})`;
      }
      
      // Add WHERE clause for partial indexes
      if (index.where) {
        sql += ` WHERE ${index.where}`;
      }
      
      // Execute the index creation
      const { error } = await this.getSupabase().rpc('execute_sql', { 
        sql_query: sql 
      });
      
      if (error) {
        console.error(`Failed to create index ${index.name}:`, error);
        return false;
      }
      
      // Add comment if provided
      if (index.comment) {
        await this.getSupabase().rpc('execute_sql', {
          sql_query: `COMMENT ON INDEX ${index.name} IS '${index.comment}'`
        });
      }
      
      return true;
      
    } catch (error) {
      console.error(`Failed to create index ${index.name}:`, error);
      return false;
    }
  }

  /**
   * Drop an index
   */
  async dropIndex(indexName: string, ifExists = true): Promise<boolean> {
    try {
      const sql = `DROP INDEX ${ifExists ? 'IF EXISTS' : ''} ${indexName}`;
      
      const { error } = await this.getSupabase().rpc('execute_sql', { 
        sql_query: sql 
      });
      
      if (error) {
        console.error(`Failed to drop index ${indexName}:`, error);
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error(`Failed to drop index ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(indexName?: string): Promise<IndexStatus[]> {
    try {
      const { data, error } = await this.getSupabase().rpc('get_index_stats', {
        index_name: indexName
      });
      
      if (error) throw error;
      
      return data.map((stat: any) => ({
        name: stat.index_name,
        table: stat.table_name,
        size: stat.index_size,
        scansCount: stat.idx_scan,
        tupleReads: stat.idx_tup_read,
        effectiveness: stat.idx_scan > 0 ? stat.idx_tup_read / stat.idx_scan : 0,
        created: new Date(stat.created_at)
      }));
      
    } catch (error) {
      console.error('Failed to get index statistics:', error);
      return [];
    }
  }

  /**
   * Rebuild an index (REINDEX)
   */
  async rebuildIndex(indexName: string): Promise<boolean> {
    try {
      const sql = `REINDEX INDEX ${indexName}`;
      
      const { error } = await this.getSupabase().rpc('execute_sql', { 
        sql_query: sql 
      });
      
      if (error) {
        console.error(`Failed to rebuild index ${indexName}:`, error);
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error(`Failed to rebuild index ${indexName}:`, error);
      return false;
    }
  }

  /**
   * Create all core indexes
   */
  async createCoreIndexes(): Promise<{
    created: string[];
    failed: string[];
    skipped: string[];
  }> {
    const results = {
      created: [] as string[],
      failed: [] as string[],
      skipped: [] as string[]
    };
    
    const coreIndexes = this.getCoreIndexes();
    
    for (const index of coreIndexes) {
      // Check if index already exists
      const stats = await this.getIndexStats(index.name);
      if (stats.length > 0) {
        results.skipped.push(index.name);
        continue;
      }
      
      const success = await this.createIndex(index);
      if (success) {
        results.created.push(index.name);
      } else {
        results.failed.push(index.name);
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  /**
   * Analyze index usage and recommend improvements
   */
  async analyzeIndexUsage(days = 30): Promise<{
    unused: IndexStatus[];
    inefficient: IndexStatus[];
    missing: string[];
  }> {
    const allStats = await this.getIndexStats();
    
    // Find unused indexes (0 scans in the period)
    const unused = allStats.filter(stat => 
      stat.scansCount === 0 && 
      stat.created < new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    );
    
    // Find inefficient indexes (low effectiveness)
    const inefficient = allStats.filter(stat => 
      stat.scansCount > 0 && 
      stat.effectiveness < 10 // Less than 10 tuples read per scan
    );
    
    // Check for missing core indexes
    const coreIndexes = this.getCoreIndexes();
    const existingNames = new Set(allStats.map(s => s.name));
    const missing = coreIndexes
      .filter(idx => !existingNames.has(idx.name))
      .map(idx => idx.name);
    
    return { unused, inefficient, missing };
  }

  /**
   * Optimize indexes by removing unused and creating missing
   */
  async optimizeIndexes(dryRun = false): Promise<{
    report: string;
    actions: string[];
  }> {
    const actions: string[] = [];
    let report = '# Index Optimization Report\n\n';
    
    // Analyze current state
    const analysis = await this.analyzeIndexUsage();
    
    report += `## Current State\n`;
    report += `- Total indexes: ${await this.getIndexStats().then(s => s.length)}\n`;
    report += `- Unused indexes: ${analysis.unused.length}\n`;
    report += `- Inefficient indexes: ${analysis.inefficient.length}\n`;
    report += `- Missing core indexes: ${analysis.missing.length}\n\n`;
    
    // Remove unused indexes
    if (analysis.unused.length > 0) {
      report += '## Unused Indexes (Recommended for Removal)\n';
      for (const idx of analysis.unused) {
        report += `- ${idx.name} on ${idx.table} (${idx.size})\n`;
        actions.push(`DROP INDEX ${idx.name}`);
        
        if (!dryRun) {
          await this.dropIndex(idx.name);
        }
      }
      report += '\n';
    }
    
    // Report inefficient indexes
    if (analysis.inefficient.length > 0) {
      report += '## Inefficient Indexes (Consider Rebuilding)\n';
      for (const idx of analysis.inefficient) {
        report += `- ${idx.name}: ${idx.effectiveness.toFixed(2)} tuples/scan\n`;
        actions.push(`REINDEX INDEX ${idx.name}`);
        
        if (!dryRun) {
          await this.rebuildIndex(idx.name);
        }
      }
      report += '\n';
    }
    
    // Create missing indexes
    if (analysis.missing.length > 0) {
      report += '## Missing Core Indexes (Will Create)\n';
      const coreIndexes = this.getCoreIndexes();
      
      for (const indexName of analysis.missing) {
        const index = coreIndexes.find(i => i.name === indexName);
        if (index) {
          report += `- ${index.name}: ${index.comment || 'No description'}\n`;
          actions.push(`CREATE INDEX ${index.name} ON ${index.table}(${index.columns.join(', ')})`);
          
          if (!dryRun) {
            await this.createIndex(index);
          }
        }
      }
      report += '\n';
    }
    
    report += `## Summary\n`;
    report += `Total optimization actions: ${actions.length}\n`;
    if (dryRun) {
      report += '\n*This was a dry run. No changes were made.*\n';
    }
    
    return { report, actions };
  }
}

// Export singleton instance with lazy initialization
let _indexOptimizer: IndexOptimizer | null = null;

export function getIndexOptimizer(): IndexOptimizer {
  if (!_indexOptimizer) {
    _indexOptimizer = new IndexOptimizer();
  }
  return _indexOptimizer;
}

// For backward compatibility
export const indexOptimizer = {
  analyzeIndexUsage: (...args: any[]) => getIndexOptimizer().analyzeIndexUsage(...args),
  recommendIndexes: (...args: any[]) => getIndexOptimizer().recommendIndexes(...args),
  createIndex: (...args: any[]) => getIndexOptimizer().createIndex(...args),
  dropIndex: (...args: any[]) => getIndexOptimizer().dropIndex(...args),
  getIndexStatistics: (...args: any[]) => getIndexOptimizer().getIndexStatistics(...args),
  rebuildIndex: (...args: any[]) => getIndexOptimizer().rebuildIndex(...args),
  checkIndexHealth: (...args: any[]) => getIndexOptimizer().checkIndexHealth(...args),
  autoOptimize: (...args: any[]) => getIndexOptimizer().autoOptimize(...args)
};