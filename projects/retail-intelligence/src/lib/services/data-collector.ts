/**
 * Data Collector Service
 * TypeScript implementation based on data_collector_model.py
 */

import { CronJob } from 'cron';
import { subHours, format, isWithinInterval } from 'date-fns';
import { ViewSonicAdapter, STORE_SENSORS } from '@/lib/integrations/viewsonic-adapter';
import { SalesApiAdapter, STORE_CONFIGS, OPERATING_HOURS } from '@/lib/integrations/sales-api-adapter';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import pLimit from 'p-limit';
import { spawn } from 'child_process';

export type CollectionInterval = 'hora_cheia' | '20_minutos' | '40_minutos';

export class DataCollectorService {
  private salesAdapter: SalesApiAdapter;
  private sensorAdapters: Map<string, ViewSonicAdapter[]> = new Map();
  private cronJobs: CronJob[] = [];
  private isRunning = false;

  constructor(config: {
    salesApiUrl: string;
    salesAuthUrl: string;
    salesUsername: string;
    salesPassword: string;
  }) {
    // Initialize sales adapter
    this.salesAdapter = new SalesApiAdapter({
      apiUrl: config.salesApiUrl,
      authUrl: config.salesAuthUrl,
      username: config.salesUsername,
      password: config.salesPassword,
    });

    // Initialize sensor adapters for each store
    for (const [storeName, sensors] of Object.entries(STORE_SENSORS)) {
      const adapters = sensors.map(config => new ViewSonicAdapter(config));
      this.sensorAdapters.set(storeName, adapters);
    }
  }

  /**
   * Start the data collection service
   */
  start() {
    if (this.isRunning) {
      logger.warn('Data collector is already running');
      return;
    }

    logger.info('Starting data collector service...');

    // Initial collection
    this.collectData('hora_cheia').catch(error => {
      logger.error('Error in initial data collection', { error });
    });

    // Schedule collections
    this.scheduleJobs();
    this.isRunning = true;

    logger.info('Data collector service started');
  }

  /**
   * Stop the data collection service
   */
  stop() {
    logger.info('Stopping data collector service...');
    
    for (const job of this.cronJobs) {
      job.stop();
    }
    
    this.cronJobs = [];
    this.isRunning = false;
    
    logger.info('Data collector service stopped');
  }

  /**
   * Schedule collection jobs
   */
  private scheduleJobs() {
    // Every hour at :00
    this.cronJobs.push(
      new CronJob('0 * * * *', () => {
        this.collectData('hora_cheia').catch(error => {
          logger.error('Error in scheduled collection (hora_cheia)', { error });
        });
      }, null, true)
    );

    // Every hour at :20
    this.cronJobs.push(
      new CronJob('20 * * * *', () => {
        this.collectData('20_minutos').catch(error => {
          logger.error('Error in scheduled collection (20_minutos)', { error });
        });
      }, null, true)
    );

    // Every hour at :40
    this.cronJobs.push(
      new CronJob('40 * * * *', () => {
        this.collectData('40_minutos').catch(error => {
          logger.error('Error in scheduled collection (40_minutos)', { error });
        });
      }, null, true)
    );
  }

  /**
   * Main data collection method
   */
  async collectData(intervalType: CollectionInterval) {
    // Check operating hours (9:00 - 1:00)
    const now = new Date();
    const hour = now.getHours();
    
    if (!(hour >= OPERATING_HOURS.start || hour <= OPERATING_HOURS.end)) {
      logger.info('Outside operating hours (09:00 - 01:00). Skipping collection.');
      return;
    }

    logger.info(`Starting data collection for interval: ${intervalType}`);

    // Calculate time range based on interval type
    const { startDate, endDate } = this.calculateTimeRange(intervalType);

    // Process each store
    for (const [storeName, sensorAdapters] of this.sensorAdapters.entries()) {
      try {
        // Get last update time for the store
        const lastUpdate = await this.getLastUpdate(storeName);
        const effectiveStartDate = lastUpdate || startDate;

        // Reset current hour data
        await this.resetCurrentHourData(storeName, endDate);

        // Collect sales data
        await this.collectSalesData(storeName, effectiveStartDate, endDate);

        // Collect sensor data in parallel
        await this.collectSensorData(storeName, sensorAdapters, effectiveStartDate, endDate);

        // Update last collection time
        await this.setLastUpdate(storeName, endDate);

        logger.info(`Completed data collection for ${storeName}`);
      } catch (error) {
        logger.error(`Error collecting data for ${storeName}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Trigger analytics collector (similar to Python's iniciar_outro_script)
    await this.triggerAnalyticsCollector();

    // Clean up duplicate and future records
    await this.cleanupData();

    logger.info('Data collection completed');
  }

  /**
   * Calculate time range based on interval type
   */
  private calculateTimeRange(intervalType: CollectionInterval) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (intervalType) {
      case 'hora_cheia':
        // Full previous hour
        endDate = new Date(now.setMinutes(0, 0, 0));
        startDate = subHours(endDate, 1);
        break;
      
      case '20_minutos':
        // Current hour from :00 to :59 (but only :00-:19 data available)
        endDate = new Date(now.setMinutes(59, 59, 999));
        startDate = new Date(now.setMinutes(0, 0, 0));
        break;
      
      case '40_minutos':
        // Current hour from :00 to :59 (but only :00-:39 data available)
        endDate = new Date(now.setMinutes(59, 59, 999));
        startDate = new Date(now.setMinutes(0, 0, 0));
        break;
    }

    return { startDate, endDate };
  }

  /**
   * Collect sales data for a store
   */
  private async collectSalesData(storeName: string, startDate: Date, endDate: Date) {
    logger.info(`Collecting sales data for ${storeName} from ${startDate} to ${endDate}`);
    
    try {
      const storeId = this.getStoreId(storeName);
      const salesData = await this.salesAdapter.fetchSalesDataRange(
        startDate,
        endDate,
        storeId,
        OPERATING_HOURS.excludeHours
      );

      // Store in database
      if (salesData.length > 0) {
        await this.storeSalesData(salesData);
        logger.info(`Stored ${salesData.length} sales records for ${storeName}`);
      } else {
        logger.warn(`No sales data found for ${storeName}`);
      }
    } catch (error) {
      logger.error(`Error collecting sales data for ${storeName}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Collect sensor data for a store
   */
  private async collectSensorData(
    storeName: string,
    adapters: ViewSonicAdapter[],
    startDate: Date,
    endDate: Date
  ) {
    logger.info(`Collecting sensor data for ${storeName} from ${startDate} to ${endDate}`);

    // Limit concurrent requests
    const limit = pLimit(adapters.length);

    const tasks = adapters.flatMap(adapter => [
      // People counting data
      limit(async () => {
        try {
          const data = await adapter.fetchPeopleCountingData(startDate, endDate);
          await this.storePeopleCountingData(data);
          logger.info(`Stored ${data.length} people counting records`);
        } catch (error) {
          logger.error('Error collecting people counting data', { error });
        }
      }),

      // Heatmap data
      limit(async () => {
        try {
          const data = await adapter.fetchHeatmapData(startDate, endDate);
          await this.storeHeatmapData(data);
          logger.info(`Stored ${data.length} heatmap records`);
        } catch (error) {
          logger.error('Error collecting heatmap data', { error });
        }
      }),

      // Regional counting data
      limit(async () => {
        try {
          const data = await adapter.fetchRegionalCountingData(startDate, endDate);
          await this.storeRegionalCountingData(data);
          logger.info(`Stored ${data.length} regional counting records`);
        } catch (error) {
          logger.error('Error collecting regional counting data', { error });
        }
      }),
    ]);

    await Promise.all(tasks);
  }

  /**
   * Get last update time for a store
   */
  private async getLastUpdate(storeName: string): Promise<Date | null> {
    const result = await db.query(
      'SELECT last_update_time FROM retail.last_updates WHERE store_name = $1',
      [storeName]
    );
    
    return result.rows[0]?.last_update_time || null;
  }

  /**
   * Set last update time for a store
   */
  private async setLastUpdate(storeName: string, updateTime: Date) {
    await db.query(
      `INSERT INTO retail.last_updates (store_name, last_update_time) 
       VALUES ($1, $2) 
       ON CONFLICT (store_name) 
       DO UPDATE SET last_update_time = $2`,
      [storeName, updateTime]
    );
  }

  /**
   * Reset data for current hour
   */
  private async resetCurrentHourData(storeName: string, hourDate: Date) {
    const hourStr = format(hourDate, 'yyyy-MM-dd HH');
    
    await db.query(
      `DELETE FROM retail.foot_traffic_raw 
       WHERE store_id IN (SELECT id FROM retail.stores WHERE name = $1)
       AND date_trunc('hour', timestamp) = $2::timestamp`,
      [storeName, hourStr]
    );

    logger.info(`Reset current hour data for ${storeName}`);
  }

  /**
   * Store sales data in database
   */
  private async storeSalesData(salesData: any[]) {
    // Implementation would batch insert sales data
    // Checking for duplicates based on document reference, item, and timestamp
  }

  /**
   * Store people counting data in database
   */
  private async storePeopleCountingData(data: any[]) {
    // Implementation would batch insert sensor data
  }

  /**
   * Store heatmap data in database
   */
  private async storeHeatmapData(data: any[]) {
    // Implementation would batch insert heatmap data
  }

  /**
   * Store regional counting data in database
   */
  private async storeRegionalCountingData(data: any[]) {
    // Implementation would batch insert regional data
  }

  /**
   * Trigger analytics collector script
   */
  private async triggerAnalyticsCollector() {
    return new Promise<void>((resolve, reject) => {
      logger.info('Triggering analytics collector...');
      
      const analyticsProcess = spawn('npm', ['run', 'analytics:collect'], {
        cwd: process.cwd(),
        stdio: 'inherit',
      });

      analyticsProcess.on('close', (code) => {
        if (code === 0) {
          logger.info('Analytics collector completed successfully');
          resolve();
        } else {
          logger.error(`Analytics collector exited with code ${code}`);
          reject(new Error(`Analytics collector failed with code ${code}`));
        }
      });

      analyticsProcess.on('error', (error) => {
        logger.error('Failed to start analytics collector', { error });
        reject(error);
      });
    });
  }

  /**
   * Clean up duplicate and future records
   */
  private async cleanupData() {
    logger.info('Cleaning up duplicate and future records...');
    
    try {
      // Remove future records
      await db.query(`
        DELETE FROM retail.foot_traffic_raw
        WHERE timestamp > NOW()
      `);

      await db.query(`
        DELETE FROM retail.sales_transactions
        WHERE timestamp > NOW()
      `);

      // Remove duplicates (keeping the oldest record)
      await db.query(`
        DELETE FROM retail.foot_traffic_raw a
        USING retail.foot_traffic_raw b
        WHERE a.id > b.id
        AND a.store_id = b.store_id
        AND a.sensor_id = b.sensor_id
        AND a.timestamp = b.timestamp
      `);

      logger.info('Cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get store ID from store name
   */
  private getStoreId(storeName: string): string {
    // Extract store ID from name (e.g., "OML01-Omnia GuimarãesShopping" -> "OML01")
    return storeName.split('-')[0];
  }
}

// Export singleton instance
export const dataCollector = new DataCollectorService({
  salesApiUrl: process.env.SALES_API_URL || '',
  salesAuthUrl: process.env.SALES_AUTH_URL || '',
  salesUsername: process.env.SALES_USERNAME || '',
  salesPassword: process.env.SALES_PASSWORD || '',
});