'use server';

import { databaseBackup } from './backup';
import type { BackupOptions } from './backup';
import { logger } from '@/lib/logger';
import * as cron from 'node-cron';

export interface ScheduledBackupConfig {
  id: string;
  name: string;
  schedule: string; // Cron expression
  options: BackupOptions;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
}

export class ScheduledBackupService {
  private static instance: ScheduledBackupService;
  private tasks: Map<string, cron.ScheduledTask> = new Map();
  private configs: Map<string, ScheduledBackupConfig> = new Map();
  
  private constructor() {}
  
  static getInstance(): ScheduledBackupService {
    if (!ScheduledBackupService.instance) {
      ScheduledBackupService.instance = new ScheduledBackupService();
    }
    return ScheduledBackupService.instance;
  }
  
  /**
   * Schedule a backup task
   */
  scheduleBackup(config: ScheduledBackupConfig): void {
    // Stop existing task if any
    this.stopBackup(config.id);
    
    if (!config.enabled) {
      logger.info(`Backup schedule ${config.name} is disabled`);
      return;
    }
    
    // Validate cron expression
    if (!cron.validate(config.schedule)) {
      throw new Error(`Invalid cron expression: ${config.schedule}`);
    }
    
    // Create scheduled task
    const task = cron.schedule(config.schedule, async () => {
      logger.info(`Running scheduled backup: ${config.name}`);
      
      try {
        // Update last run time
        config.lastRun = new Date().toISOString();
        
        // Run backup
        const backupInfo = await databaseBackup.createBackup(config.options);
        
        logger.info(`Scheduled backup completed: ${config.name}`, {
          backupId: backupInfo.id,
          size: backupInfo.size
        });
        
        // Calculate next run
        config.nextRun = this.getNextRun(config.schedule);
        
      } catch (error) {
        logger.error(`Scheduled backup failed: ${config.name}`, error);
      }
    }, {
      timezone: process.env.TZ || 'UTC'
    });
    
    // Store task and config
    this.tasks.set(config.id, task);
    this.configs.set(config.id, config);
    
    // Calculate next run
    config.nextRun = this.getNextRun(config.schedule);
    
    logger.info(`Backup scheduled: ${config.name}`, {
      schedule: config.schedule,
      nextRun: config.nextRun
    });
  }
  
  /**
   * Stop a scheduled backup
   */
  stopBackup(id: string): void {
    const task = this.tasks.get(id);
    if (task) {
      task.stop();
      this.tasks.delete(id);
      logger.info(`Backup schedule stopped: ${id}`);
    }
  }
  
  /**
   * Get all scheduled backups
   */
  getScheduledBackups(): ScheduledBackupConfig[] {
    return Array.from(this.configs.values());
  }
  
  /**
   * Get a specific scheduled backup
   */
  getScheduledBackup(id: string): ScheduledBackupConfig | undefined {
    return this.configs.get(id);
  }
  
  /**
   * Update scheduled backup
   */
  updateScheduledBackup(id: string, updates: Partial<ScheduledBackupConfig>): void {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`Scheduled backup not found: ${id}`);
    }
    
    // Update config
    Object.assign(config, updates);
    
    // Reschedule if needed
    if (updates.schedule || updates.enabled !== undefined) {
      this.scheduleBackup(config);
    }
  }
  
  /**
   * Delete scheduled backup
   */
  deleteScheduledBackup(id: string): void {
    this.stopBackup(id);
    this.configs.delete(id);
  }
  
  /**
   * Initialize default backup schedules
   */
  initializeDefaultSchedules(): void {
    // Daily backup at 2 AM
    this.scheduleBackup({
      id: 'daily-full',
      name: 'Daily Full Backup',
      schedule: '0 2 * * *',
      options: {
        format: 'sql',
        compress: true
      },
      enabled: false // Disabled by default
    });
    
    // Weekly backup on Sunday at 3 AM
    this.scheduleBackup({
      id: 'weekly-full',
      name: 'Weekly Full Backup',
      schedule: '0 3 * * 0',
      options: {
        format: 'json',
        compress: true
      },
      enabled: false
    });
    
    // Hourly backup of critical tables
    this.scheduleBackup({
      id: 'hourly-critical',
      name: 'Hourly Critical Tables',
      schedule: '0 * * * *',
      options: {
        tables: ['organizations', 'users', 'emissions_data'],
        format: 'sql',
        compress: true
      },
      enabled: false
    });
  }
  
  /**
   * Get next run time for a cron expression
   */
  private getNextRun(cronExpression: string): string {
    try {
      // For now, return a placeholder
      return new Date(Date.now() + 3600000).toISOString();
    } catch {
      return 'Invalid schedule';
    }
  }
  
  /**
   * Run backup immediately
   */
  async runBackupNow(id: string): Promise<void> {
    const config = this.configs.get(id);
    if (!config) {
      throw new Error(`Scheduled backup not found: ${id}`);
    }
    
    logger.info(`Running backup immediately: ${config.name}`);
    
    config.lastRun = new Date().toISOString();
    const backupInfo = await databaseBackup.createBackup(config.options);
    
    logger.info(`Immediate backup completed: ${config.name}`, {
      backupId: backupInfo.id,
      size: backupInfo.size
    });
  }
}

// Export singleton instance
export const scheduledBackupService = ScheduledBackupService.getInstance();