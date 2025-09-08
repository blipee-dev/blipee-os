// Database migration utility

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';

interface Migration {
  id: string;
  name: string;
  version: number;
  checksum: string;
  applied_at?: string;
  executed_by?: string;
  execution_time_ms?: number;
  status: 'pending' | 'applied' | 'failed' | 'rolled_back';
  error?: string;
}

interface MigrationFile {
  path: string;
  name: string;
  version: number;
  content: string;
  checksum: string;
}

export class MigrationManager {
  private static instance: MigrationManager;
  private migrationsDir: string;
  
  private constructor() {
    this.migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  }
  
  static getInstance(): MigrationManager {
    if (!MigrationManager.instance) {
      MigrationManager.instance = new MigrationManager();
    }
    return MigrationManager.instance;
  }
  
  /**
   * Initialize migration system
   */
  async initialize(): Promise<void> {
    const supabase = createClient();
    
    // For now, skip table creation since schema_migrations is not in generated types
    logger.info('Migration table initialization skipped');
    
    logger.info('Migration system initialized');
  }
  
  /**
   * Get all migration files
   */
  async getMigrationFiles(): Promise<MigrationFile[]> {
    try {
      const files = await fs.readdir(this.migrationsDir);
      const migrations: MigrationFile[] = [];
      
      for (const file of files) {
        if (!file.endsWith('.sql')) continue;
        
        const filePath = path.join(this.migrationsDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Parse version from filename (e.g., 20250828_migration_name.sql)
        const versionMatch = file.match(/^(\d+)/);
        if (!versionMatch) continue;
        
        const version = parseInt(versionMatch[1], 10);
        const name = file.replace('.sql', '');
        const checksum = this.calculateChecksum(content);
        
        migrations.push({
          path: filePath,
          name,
          version,
          content,
          checksum
        });
      }
      
      // Sort by version
      return migrations.sort((a, b) => a.version - b.version);
      
    } catch (error) {
      logger.error('Failed to read migration files', error);
      return [];
    }
  }
  
  /**
   * Get applied migrations
   */
  async getAppliedMigrations(): Promise<Migration[]> {
    // For now, return empty array since schema_migrations table is not available
    return [];
  }
  
  /**
   * Get pending migrations
   */
  async getPendingMigrations(): Promise<MigrationFile[]> {
    const [files, applied] = await Promise.all([
      this.getMigrationFiles(),
      this.getAppliedMigrations()
    ]);
    
    const appliedVersions = new Set(applied.map(m => m.version));
    
    return files.filter(file => !appliedVersions.has(file.version));
  }
  
  /**
   * Run a single migration
   */
  async runMigration(migration: MigrationFile): Promise<void> {
    const supabase = createClient();
    const startTime = Date.now();
    
    logger.info(`Running migration: ${migration.name}`);
    
    try {
      // Begin transaction (if supported)
      await supabase.rpc('execute_sql', {
        sql_query: 'BEGIN;'
      });
      
      // Split migration into individual statements
      const statements = this.splitStatements(migration.content);
      
      // Execute each statement
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        const { error } = await supabase.rpc('execute_sql', {
          sql_query: statement
        });
        
        if (error) {
          throw error;
        }
      }
      
      // Record migration
      const { data: { user } } = await supabase.auth.getUser();
      const executionTime = Date.now() - startTime;
      
      await supabase
        .from('schema_migrations')
        .insert({
          id: `${migration.version}_${migration.name}`,
          name: migration.name,
          version: migration.version,
          checksum: migration.checksum,
          executed_by: user?.id,
          execution_time_ms: executionTime,
          status: 'applied'
        });
      
      // Commit transaction
      await supabase.rpc('execute_sql', {
        sql_query: 'COMMIT;'
      });
      
      logger.info(`Migration completed: ${migration.name} (${executionTime}ms)`);
      
    } catch (error) {
      // Rollback transaction
      await supabase.rpc('execute_sql', {
        sql_query: 'ROLLBACK;'
      });
      
      // Record failed migration
      await supabase
        .from('schema_migrations')
        .insert({
          id: `${migration.version}_${migration.name}`,
          name: migration.name,
          version: migration.version,
          checksum: migration.checksum,
          executed_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'failed',
          error_message: error instanceof Error ? error.message : String(error)
        });
      
      logger.error(`Migration failed: ${migration.name}`, error);
      throw error;
    }
  }
  
  /**
   * Run all pending migrations
   */
  async runPendingMigrations(): Promise<number> {
    await this.initialize();
    
    const pending = await this.getPendingMigrations();
    
    if (pending.length === 0) {
      logger.info('No pending migrations');
      return 0;
    }
    
    logger.info(`Found ${pending.length} pending migrations`);
    
    let completed = 0;
    for (const migration of pending) {
      try {
        await this.runMigration(migration);
        completed++;
      } catch (error) {
        logger.error(`Migration failed at ${migration.name}, stopping execution`, error);
        break;
      }
    }
    
    logger.info(`Completed ${completed} of ${pending.length} migrations`);
    return completed;
  }
  
  /**
   * Validate migrations
   */
  async validateMigrations(): Promise<{
    valid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    const [files, applied] = await Promise.all([
      this.getMigrationFiles(),
      this.getAppliedMigrations()
    ]);
    
    // Check for checksum mismatches
    for (const appliedMig of applied) {
      const file = files.find(f => f.version === appliedMig.version);
      if (!file) {
        issues.push(`Applied migration ${appliedMig.name} not found in files`);
      } else if (file.checksum !== appliedMig.checksum) {
        issues.push(`Checksum mismatch for ${appliedMig.name}`);
      }
    }
    
    // Check for duplicate versions
    const versions = files.map(f => f.version);
    const duplicates = versions.filter((v, i) => versions.indexOf(v) !== i);
    if (duplicates.length > 0) {
      issues.push(`Duplicate versions found: ${duplicates.join(', ')}`);
    }
    
    // Check for gaps in versions
    const sortedVersions = [...new Set(versions)].sort((a, b) => a - b);
    for (let i = 1; i < sortedVersions.length; i++) {
      const gap = sortedVersions[i] - sortedVersions[i - 1];
      if (gap > 1000000) { // Allow gaps less than 1M (about 11 days)
        issues.push(`Large gap between versions ${sortedVersions[i - 1]} and ${sortedVersions[i]}`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
  
  /**
   * Create a new migration file
   */
  async createMigration(name: string, content: string = ''): Promise<string> {
    const timestamp = new Date().toISOString()
      .replace(/[-:]/g, '')
      .replace('T', '')
      .split('.')[0];
    
    const filename = `${timestamp}_${name.toLowerCase().replace(/\s+/g, '_')}.sql`;
    const filepath = path.join(this.migrationsDir, filename);
    
    const template = `-- Migration: ${name}
-- Date: ${new Date().toISOString()}
-- Description: ${name}

${content}
`;
    
    await fs.writeFile(filepath, template);
    
    logger.info(`Created migration: ${filename}`);
    return filepath;
  }
  
  /**
   * Generate migration from schema diff
   */
  async generateMigrationFromDiff(): Promise<string | null> {
    // This would compare current schema with desired schema
    // For now, return a message
    logger.info('Schema diff generation not yet implemented');
    return null;
  }
  
  /**
   * Export migration status
   */
  async exportStatus(): Promise<{
    applied: Migration[];
    pending: MigrationFile[];
    validation: { valid: boolean; issues: string[] };
  }> {
    const [applied, pending, validation] = await Promise.all([
      this.getAppliedMigrations(),
      this.getPendingMigrations(),
      this.validateMigrations()
    ]);
    
    return {
      applied,
      pending,
      validation
    };
  }
  
  /**
   * Calculate checksum for migration content
   */
  private calculateChecksum(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
  
  /**
   * Split SQL into individual statements
   */
  private splitStatements(sql: string): string[] {
    // Remove comments
    const withoutComments = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n');
    
    // Split by semicolon, but respect string literals
    const statements: string[] = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < withoutComments.length; i++) {
      const char = withoutComments[i];
      const prevChar = i > 0 ? withoutComments[i - 1] : '';
      
      if (inString) {
        current += char;
        if (char === stringChar && prevChar !== '\\') {
          inString = false;
        }
      } else {
        if (char === "'" || char === '"') {
          inString = true;
          stringChar = char;
          current += char;
        } else if (char === ';') {
          statements.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
    }
    
    if (current.trim()) {
      statements.push(current.trim());
    }
    
    return statements;
  }
}

// Export singleton instance
export const migrationManager = MigrationManager.getInstance();