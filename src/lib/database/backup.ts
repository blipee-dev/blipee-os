// Server-side database backup utility

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { promises as fs } from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';

// const execAsync = promisify(exec);

export interface BackupOptions {
  tables?: string[];
  format?: 'sql' | 'csv' | 'json';
  compress?: boolean;
  excludeData?: string[];
  includeSchemaOnly?: boolean;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  tables: string[];
  format: string;
  compressed: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface RestoreOptions {
  tables?: string[];
  dropExisting?: boolean;
  skipConstraints?: boolean;
}

export class DatabaseBackup {
  private static instance: DatabaseBackup;
  private backupDir: string;
  
  private constructor() {
    // Store backups in a secure directory
    this.backupDir = process.env['BACKUP_DIR'] || path.join(process.cwd(), '.backups');
  }
  
  static getInstance(): DatabaseBackup {
    if (!DatabaseBackup.instance) {
      DatabaseBackup.instance = new DatabaseBackup();
    }
    return DatabaseBackup.instance;
  }
  
  /**
   * Initialize backup directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
      
      // Create .gitignore to prevent backups from being committed
      const gitignorePath = path.join(this.backupDir, '.gitignore');
      await fs.writeFile(gitignorePath, '*\n!.gitignore\n');
      
      logger.info('Backup directory initialized', { path: this.backupDir });
    } catch (error) {
      logger.error('Failed to initialize backup directory', error);
      throw error;
    }
  }
  
  /**
   * Create a database backup
   */
  async createBackup(options: BackupOptions = {}): Promise<BackupInfo> {
    await this.initialize();
    
    const {
      tables = [],
      format = 'sql',
      compress = true,
      excludeData = [],
      includeSchemaOnly = false
    } = options;
    
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    let filename = `${backupId}_${timestamp}.${format}`;
    
    if (compress) {
      filename += '.gz';
    }
    
    const filepath = path.join(this.backupDir, filename);
    
    try {
      // const supabase = createClient();
      
      // Log backup start
      logger.info('Starting database backup', {
        backupId,
        format,
        tables: tables.length || 'all',
        compress
      });
      
      let backupData: string;
      
      switch (format) {
        case 'sql':
          backupData = await this.createSQLBackup(tables, excludeData, includeSchemaOnly);
          break;
          
        case 'json':
          backupData = await this.createJSONBackup(tables, excludeData);
          break;
          
        case 'csv':
          backupData = await this.createCSVBackup(tables, excludeData);
          break;
          
        default:
          throw new Error(`Unsupported backup format: ${format}`);
      }
      
      // Write backup to file
      if (compress) {
        await this.writeCompressedFile(filepath, backupData);
      } else {
        await fs.writeFile(filepath, backupData);
      }
      
      // Get file size
      const stats = await fs.stat(filepath);
      
      // Create backup record
      const backupInfo: BackupInfo = {
        id: backupId,
        filename,
        size: stats.size,
        tables: tables.length ? tables : await this.getAllTables(),
        format,
        compressed: compress,
        created_at: new Date().toISOString(),
        metadata: {
          includeSchemaOnly,
          excludeData,
          node_version: process.version
        }
      };
      
      // Store backup metadata
      await this.saveBackupMetadata(backupInfo);
      
      logger.info('Database backup completed', {
        backupId,
        size: stats.size,
        filepath
      });
      
      return backupInfo;
      
    } catch (error) {
      logger.error('Database backup failed', error);
      
      // Clean up partial backup
      try {
        await fs.unlink(filepath);
      } catch {}
      
      throw error;
    }
  }
  
  /**
   * Create SQL format backup
   */
  private async createSQLBackup(
    tables: string[],
    excludeData: string[],
    schemaOnly: boolean
  ): Promise<string> {
    const supabase = createClient();
    let sql = '';
    
    // Add header
    sql += `-- Blipee OS Database Backup\n`;
    sql += `-- Generated: ${new Date().toISOString()}\n`;
    sql += `-- Tables: ${tables.length || 'all'}\n\n`;
    
    // Get tables to backup
    const tablesToBackup = tables.length ? tables : await this.getAllTables();
    
    for (const table of tablesToBackup) {
      sql += `\n-- Table: ${table}\n`;
      
      // For now, skip schema generation
      sql += `-- Table: ${table}\n\n`;
      
      // Add data if not schema only
      if (!schemaOnly && !excludeData.includes(table)) {
        const { data: rows } = await supabase
          .from(table)
          .select('*');
        
        if (rows && rows.length > 0) {
          sql += `-- Data for table: ${table}\n`;
          const columns = Object.keys(rows[0]);
          
          for (const row of rows) {
            const values = columns.map(col => 
              this.escapeValue(row[col])
            ).join(', ');
            
            sql += `INSERT INTO public.${table} (${columns.join(', ')}) VALUES (${values});\n`;
          }
          sql += '\n';
        }
      }
    }
    
    return sql;
  }
  
  /**
   * Create JSON format backup
   */
  private async createJSONBackup(
    tables: string[],
    excludeData: string[]
  ): Promise<string> {
    const supabase = createClient();
    const backup: Record<string, any> = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    const tablesToBackup = tables.length ? tables : await this.getAllTables();
    
    for (const table of tablesToBackup) {
      backup.tables![table] = {
        schema: [], // await this.getTableSchema(table),
        data: []
      };
      
      if (!excludeData.includes(table)) {
        const { data } = await supabase
          .from(table)
          .select('*');
        
        if (data) {
          backup.tables![table].data = data;
        }
      }
    }
    
    return JSON.stringify(backup, null, 2);
  }
  
  /**
   * Create CSV format backup
   */
  private async createCSVBackup(
    tables: string[],
    excludeData: string[]
  ): Promise<string> {
    const supabase = createClient();
    let csv = '';
    
    const tablesToBackup = tables.length ? tables : await this.getAllTables();
    
    for (const table of tablesToBackup) {
      csv += `# Table: ${table}\n`;
      
      if (!excludeData.includes(table)) {
        const { data } = await supabase
          .from(table)
          .select('*');
        
        if (data && data.length > 0) {
          // Headers
          const headers = Object.keys(data[0]);
          csv += headers.join(',') + '\n';
          
          // Data
          for (const row of data) {
            const values = headers.map(header => 
              this.escapeCSV(row[header])
            );
            csv += values.join(',') + '\n';
          }
        }
      }
      
      csv += '\n';
    }
    
    return csv;
  }
  
  /**
   * Restore from backup
   */
  async restoreBackup(
    backupId: string,
    options: RestoreOptions = {}
  ): Promise<void> {
    const {
      tables = [],
      dropExisting = false,
      skipConstraints = false
    } = options;
    
    try {
      // Get backup metadata
      const backupInfo = await this.getBackupInfo(backupId);
      if (!backupInfo) {
        throw new Error(`Backup not found: ${backupId}`);
      }
      
      const filepath = path.join(this.backupDir, backupInfo.filename);
      
      // Check if file exists
      await fs.access(filepath);
      
      logger.info('Starting database restore', {
        backupId,
        format: backupInfo.format,
        tables: tables.length || 'all'
      });
      
      // Read backup data
      let backupData: string;
      if (backupInfo.compressed) {
        backupData = await this.readCompressedFile(filepath);
      } else {
        backupData = await fs.readFile(filepath, 'utf-8');
      }
      
      // Restore based on format
      switch (backupInfo.format) {
        case 'sql':
          await this.restoreFromSQL(backupData, tables, dropExisting, skipConstraints);
          break;
          
        case 'json':
          await this.restoreFromJSON(backupData, tables, dropExisting);
          break;
          
        case 'csv':
          throw new Error('CSV restore not yet implemented');
          
        default:
          throw new Error(`Unsupported restore format: ${backupInfo.format}`);
      }
      
      logger.info('Database restore completed', { backupId });
      
    } catch (error) {
      logger.error('Database restore failed', error);
      throw error;
    }
  }
  
  /**
   * List available backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    await this.initialize();
    
    try {
      const metadataPath = path.join(this.backupDir, 'metadata.json');
      
      // Check if metadata exists
      try {
        await fs.access(metadataPath);
      } catch {
        return [];
      }
      
      const metadata = await fs.readFile(metadataPath, 'utf-8');
      const backups = JSON.parse(metadata);
      
      // Sort by creation date (newest first)
      return Object.values(backups).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
    } catch (error) {
      logger.error('Failed to list backups', error);
      return [];
    }
  }
  
  /**
   * Delete a backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupInfo = await this.getBackupInfo(backupId);
      if (!backupInfo) {
        throw new Error(`Backup not found: ${backupId}`);
      }
      
      const filepath = path.join(this.backupDir, backupInfo.filename);
      
      // Delete file
      await fs.unlink(filepath);
      
      // Remove from metadata
      await this.removeBackupMetadata(backupId);
      
      logger.info('Backup deleted', { backupId });
      
    } catch (error) {
      logger.error('Failed to delete backup', error);
      throw error;
    }
  }
  
  /**
   * Schedule automatic backups
   */
  async scheduleBackups(
    cronExpression: string,
    options: BackupOptions = {}
  ): Promise<void> {
    // This would integrate with a cron job system
    // For now, just log the intention
    logger.info('Backup scheduling requested', {
      schedule: cronExpression,
      options
    });
    
    // In production, you would:
    // 1. Use node-cron or similar
    // 2. Or use Supabase edge functions
    // 3. Or use external cron service
  }
  
  /**
   * Get backup info
   */
  private async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    try {
      const metadataPath = path.join(this.backupDir, 'metadata.json');
      const metadata = await fs.readFile(metadataPath, 'utf-8');
      const backups = JSON.parse(metadata);
      return backups[backupId] || null;
    } catch {
      return null;
    }
  }
  
  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(info: BackupInfo): Promise<void> {
    const metadataPath = path.join(this.backupDir, 'metadata.json');
    
    let metadata: Record<string, BackupInfo> = {};
    
    try {
      const existing = await fs.readFile(metadataPath, 'utf-8');
      metadata = JSON.parse(existing);
    } catch {}
    
    metadata[info.id] = info;
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }
  
  /**
   * Remove backup metadata
   */
  private async removeBackupMetadata(backupId: string): Promise<void> {
    const metadataPath = path.join(this.backupDir, 'metadata.json');
    
    try {
      const existing = await fs.readFile(metadataPath, 'utf-8');
      const metadata = JSON.parse(existing);
      delete metadata[backupId];
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    } catch {}
  }
  
  /**
   * Get all table names
   */
  private async getAllTables(): Promise<string[]> {
    const supabase = createClient();
    
    const { data } = await supabase.rpc('get_all_tables');
    
    return data?.map((t: any) => t.table_name) || [];
  }
  
  /**
   * Get table schema
   */
  private async getTableSchema(tableName: string): Promise<any[]> {
    const supabase = createClient();
    
    const { data } = await supabase
      .rpc('get_table_columns', { table_name: tableName });
    
    return data || [];
  }
  
  /**
   * Escape SQL value
   */
  private escapeValue(value: any): string {
    if (value === null) return 'NULL';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    if (typeof value === 'number') return value.toString();
    if (value instanceof Date) return `'${value.toISOString()}'`;
    
    // Escape string
    return `'${String(value).replace(/'/g, "''")}'`;
  }
  
  /**
   * Escape CSV value
   */
  private escapeCSV(value: any): string {
    if (value === null || value === undefined) return '';
    
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    
    return str;
  }
  
  /**
   * Write compressed file
   */
  private async writeCompressedFile(filepath: string, data: string): Promise<void> {
    return pipeline(
      async function* () {
        yield data;
      },
      createGzip(),
      createWriteStream(filepath)
    );
  }
  
  /**
   * Read compressed file
   */
  private async readCompressedFile(filepath: string): Promise<string> {
    const chunks: Buffer[] = [];
    
    await pipeline(
      createReadStream(filepath),
      createGunzip(),
      async function (source) {
        for await (const chunk of source) {
          chunks.push(chunk);
        }
      }
    );
    
    return Buffer.concat(chunks).toString('utf-8');
  }
  
  /**
   * Restore from SQL backup
   */
  private async restoreFromSQL(
    sql: string,
    tables: string[],
    dropExisting: boolean,
    _skipConstraints: boolean
  ): Promise<void> {
    const supabase = createClient();
    
    // Parse SQL into statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    // Filter statements if specific tables requested
    let filteredStatements = statements;
    if (tables.length > 0) {
      filteredStatements = statements.filter(stmt => 
        tables.some(table => 
          stmt.includes(`public.${table}`) || 
          stmt.includes(`Table: ${table}`)
        )
      );
    }
    
    // Execute statements
    for (const statement of filteredStatements) {
      try {
        // Skip comments
        if (statement.startsWith('--')) continue;
        
        // Handle DROP TABLE if requested
        if (dropExisting && statement.includes('CREATE TABLE')) {
          const tableMatch = statement.match(/CREATE TABLE.*public\.(\w+)/);
          if (tableMatch) {
            // For now, skip drop table
            console.log(`Would drop table: ${tableMatch[1]}`);
          }
        }
        
        // For now, skip SQL execution
        console.log('Would execute:', statement.substring(0, 50) + '...');
        
      } catch (error) {
        logger.error('Failed to execute statement', { statement, error });
        throw error;
      }
    }
  }
  
  /**
   * Restore from JSON backup
   */
  private async restoreFromJSON(
    jsonData: string,
    tables: string[],
    dropExisting: boolean
  ): Promise<void> {
    const supabase = createClient();
    const backup = JSON.parse(jsonData);
    
    const tablesToRestore = tables.length 
      ? tables 
      : Object.keys(backup.tables);
    
    for (const table of tablesToRestore) {
      if (!backup.tables[table]) continue;
      
      const tableData = backup.tables[table];
      
      // Drop existing if requested
      if (dropExisting) {
        await supabase.rpc('execute_sql', {
          sql_query: `TRUNCATE TABLE public.${table} CASCADE`
        });
      }
      
      // Insert data
      if (tableData.data && tableData.data.length > 0) {
        const { error } = await supabase
          .from(table)
          .insert(tableData.data);
        
        if (error) {
          logger.error(`Failed to restore table ${table}`, error);
          throw error;
        }
      }
    }
  }
}

// Export singleton instance
export const databaseBackup = DatabaseBackup.getInstance();