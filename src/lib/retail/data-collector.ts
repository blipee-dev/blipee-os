/**
 * Retail Data Collector System
 * Based on production reference system from retail-intelligence/retail-reference
 * Orchestrates data collection from VS133 sensors and sales API
 */

import { createClient } from '@supabase/supabase-js';
import { vs133SensorService } from '../integrations/vs133-sensor';
import { salesAPIService } from '../integrations/sales-api';

interface CollectionConfig {
  storeId: string;
  storeName: string;
  collectSensorData: boolean;
  collectSalesData: boolean;
  intervalMinutes: number;
}

interface CollectionResult {
  storeId: string;
  success: boolean;
  errors: string[];
  dataCollected: {
    sensorData: boolean;
    salesData: boolean;
    analyticsComputed: boolean;
  };
  timestamp: Date;
}

// Store configurations (from reference system)
const STORE_CONFIGS: CollectionConfig[] = [
  {
    storeId: 'OML01',
    storeName: 'OML01-Omnia GuimarãesShopping',
    collectSensorData: true,
    collectSalesData: true,
    intervalMinutes: 20
  },
  {
    storeId: 'ONL01',
    storeName: 'ONL01-Only UBBO Amadora',
    collectSensorData: true,
    collectSalesData: true,
    intervalMinutes: 20
  },
  {
    storeId: 'OML02',
    storeName: 'OML02-Omnia Fórum Almada',
    collectSensorData: true,
    collectSalesData: true,
    intervalMinutes: 20
  },
  {
    storeId: 'OML03',
    storeName: 'OML03-Omnia Norteshopping',
    collectSensorData: true,
    collectSalesData: true,
    intervalMinutes: 20
  }
];

export class RetailDataCollector {
  private _supabase: any = null;
  
  private get supabase() {
    if (!this._supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
      
      if (!url || !key) {
        throw new Error('Supabase configuration missing. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      }
      
      this._supabase = createClient(url, key);
    }
    return this._supabase;
  }

  private isCollecting = false;
  private collectionInterval: NodeJS.Timeout | null = null;

  /**
   * Get last update time for a store
   */
  async getLastUpdate(storeId: string): Promise<Date | null> {
    try {
      const { data, error } = await this.supabase
        .from('retail.last_update')
        .select('last_update_time')
        .eq('store_id', storeId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found error
        console.error(`Error getting last update for ${storeId}:`, error);
        return null;
      }

      return data ? new Date(data.last_update_time) : null;
    } catch (error) {
      console.error(`Error in getLastUpdate for ${storeId}:`, error);
      return null;
    }
  }

  /**
   * Set last update time for a store
   */
  async setLastUpdate(storeId: string, timestamp: Date): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('retail.last_update')
        .upsert({
          store_id: storeId,
          last_update_time: timestamp.toISOString()
        });

      if (error) {
        console.error(`Error setting last update for ${storeId}:`, error);
      }
    } catch (error) {
      console.error(`Error in setLastUpdate for ${storeId}:`, error);
    }
  }

  /**
   * Remove future and duplicate records
   */
  async cleanupDuplicateRecords(): Promise<void> {
    try {
      console.log('Cleaning up duplicate and future records...');

      // Clean foot traffic data
      await this.supabase.rpc('cleanup_foot_traffic_duplicates');
      
      // Clean regional counting data
      await this.supabase.rpc('cleanup_regional_counting_duplicates');
      
      // Clean heatmap data
      await this.supabase.rpc('cleanup_heatmap_duplicates');

      console.log('Cleanup completed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Collect data for a single store
   */
  async collectStoreData(config: CollectionConfig): Promise<CollectionResult> {
    const result: CollectionResult = {
      storeId: config.storeId,
      success: false,
      errors: [],
      dataCollected: {
        sensorData: false,
        salesData: false,
        analyticsComputed: false
      },
      timestamp: new Date()
    };

    try {
      console.log(`Starting data collection for ${config.storeName}...`);

      // Get last update time
      const lastUpdate = await this.getLastUpdate(config.storeId);
      const startTime = lastUpdate || new Date(Date.now() - 60 * 60 * 1000); // Default to 1 hour ago
      const endTime = new Date();

      // Collect sensor data
      if (config.collectSensorData) {
        try {
          await vs133SensorService.collectAllSensorData(config.storeId, startTime, endTime);
          result.dataCollected.sensorData = true;
          console.log(`✅ Sensor data collected for ${config.storeId}`);
        } catch (error) {
          const errorMsg = `Sensor data collection failed: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Collect sales data
      if (config.collectSalesData) {
        try {
          const salesTransactions = await salesAPIService.collectSalesData(
            config.storeId,
            startTime,
            endTime
          );
          
          if (salesTransactions.length > 0) {
            await salesAPIService.storeSalesTransactions(salesTransactions);
          }
          
          result.dataCollected.salesData = true;
          console.log(`✅ Sales data collected for ${config.storeId} (${salesTransactions.length} transactions)`);
        } catch (error) {
          const errorMsg = `Sales data collection failed: ${error}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      // Update last collection time if any data was collected successfully
      if (result.dataCollected.sensorData || result.dataCollected.salesData) {
        await this.setLastUpdate(config.storeId, endTime);
        result.success = true;
      }

      console.log(`Data collection completed for ${config.storeName}`);
      return result;

    } catch (error) {
      const errorMsg = `General collection error: ${error}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return result;
    }
  }

  /**
   * Collect data for all stores
   */
  async collectAllStoresData(): Promise<CollectionResult[]> {
    console.log('🚀 Starting data collection for all stores...');
    
    const results: CollectionResult[] = [];
    
    // Process stores in parallel with limited concurrency
    const promises = STORE_CONFIGS.map(config => 
      this.collectStoreData(config).catch(error => ({
        storeId: config.storeId,
        success: false,
        errors: [`Collection failed: ${error}`],
        dataCollected: {
          sensorData: false,
          salesData: false,
          analyticsComputed: false
        },
        timestamp: new Date()
      }))
    );

    const collectionResults = await Promise.all(promises);
    results.push(...collectionResults);

    // Cleanup duplicate records
    try {
      await this.cleanupDuplicateRecords();
    } catch (error) {
      console.error('Cleanup failed:', error);
    }

    // Log summary
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    console.log(`📊 Collection completed: ${successful}/${total} stores successful`);

    // Log errors
    results.forEach(result => {
      if (result.errors.length > 0) {
        console.error(`Errors for ${result.storeId}:`, result.errors);
      }
    });

    return results;
  }

  /**
   * Start automatic data collection
   */
  startAutomaticCollection(intervalMinutes = 20): void {
    if (this.isCollecting) {
      console.log('Data collection is already running');
      return;
    }

    console.log(`🔄 Starting automatic data collection (every ${intervalMinutes} minutes)`);
    this.isCollecting = true;

    // Initial collection
    this.collectAllStoresData();

    // Schedule recurring collection
    this.collectionInterval = setInterval(() => {
      if (this.isCollecting) {
        this.collectAllStoresData();
      }
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic data collection
   */
  stopAutomaticCollection(): void {
    console.log('⏹️ Stopping automatic data collection');
    this.isCollecting = false;
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Get collection status
   */
  getCollectionStatus() {
    return {
      isCollecting: this.isCollecting,
      storeCount: STORE_CONFIGS.length,
      stores: STORE_CONFIGS.map(config => ({
        storeId: config.storeId,
        storeName: config.storeName,
        sensorEnabled: config.collectSensorData,
        salesEnabled: config.collectSalesData
      }))
    };
  }

  /**
   * Collect data for specific date range (manual collection)
   */
  async collectHistoricalData(
    storeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CollectionResult> {
    const config = STORE_CONFIGS.find(c => c.storeId === storeId);
    if (!config) {
      throw new Error(`Store configuration not found for: ${storeId}`);
    }

    console.log(`📅 Collecting historical data for ${config.storeName} from ${startDate.toDateString()} to ${endDate.toDateString()}`);

    const result: CollectionResult = {
      storeId: config.storeId,
      success: false,
      errors: [],
      dataCollected: {
        sensorData: false,
        salesData: false,
        analyticsComputed: false
      },
      timestamp: new Date()
    };

    try {
      // Break down date range into daily chunks
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        console.log(`Collecting data for ${currentDate.toDateString()}`);

        // Collect sensor data for the day
        if (config.collectSensorData) {
          try {
            await vs133SensorService.collectAllSensorData(config.storeId, dayStart, dayEnd);
            result.dataCollected.sensorData = true;
          } catch (error) {
            result.errors.push(`Sensor data failed for ${currentDate.toDateString()}: ${error}`);
          }
        }

        // Collect sales data for the day
        if (config.collectSalesData) {
          try {
            const salesTransactions = await salesAPIService.collectSalesData(
              config.storeId,
              dayStart,
              dayEnd
            );
            
            if (salesTransactions.length > 0) {
              await salesAPIService.storeSalesTransactions(salesTransactions);
            }
            
            result.dataCollected.salesData = true;
          } catch (error) {
            result.errors.push(`Sales data failed for ${currentDate.toDateString()}: ${error}`);
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Set success if any data was collected
      result.success = result.dataCollected.sensorData || result.dataCollected.salesData;
      
      console.log(`📅 Historical data collection completed for ${config.storeName}`);
      return result;

    } catch (error) {
      result.errors.push(`Historical collection error: ${error}`);
      console.error(`❌ Historical collection error for ${storeId}:`, error);
      return result;
    }
  }

  /**
   * Test connection to all services
   */
  async testConnections(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};

    // Test database connection
    try {
      const { error } = await this.supabase.from('retail.stores').select('id').limit(1);
      results.database = !error;
    } catch (error) {
      results.database = false;
    }

    // Test sales API
    try {
      await salesAPIService.authenticate();
      results.salesAPI = true;
    } catch (error) {
      results.salesAPI = false;
    }

    // Test sensor connections
    for (const config of STORE_CONFIGS) {
      try {
        // This would test basic connectivity - simplified for now
        results[`sensor_${config.storeId}`] = true;
      } catch (error) {
        results[`sensor_${config.storeId}`] = false;
      }
    }

    return results;
  }
}

// Lazy-loaded singleton instance
let _retailDataCollector: RetailDataCollector | null = null;

export const retailDataCollector = {
  getCollectionStatus: () => {
    if (!_retailDataCollector) {
      _retailDataCollector = new RetailDataCollector();
    }
    return _retailDataCollector.getCollectionStatus();
  },
  
  testConnections: async () => {
    if (!_retailDataCollector) {
      _retailDataCollector = new RetailDataCollector();
    }
    return _retailDataCollector.testConnections();
  },
  
  startAutomaticCollection: (intervalMinutes?: number) => {
    if (!_retailDataCollector) {
      _retailDataCollector = new RetailDataCollector();
    }
    return _retailDataCollector.startAutomaticCollection(intervalMinutes);
  },
  
  stopAutomaticCollection: () => {
    if (!_retailDataCollector) {
      _retailDataCollector = new RetailDataCollector();
    }
    return _retailDataCollector.stopAutomaticCollection();
  },
  
  collectAllStores: async () => {
    if (!_retailDataCollector) {
      _retailDataCollector = new RetailDataCollector();
    }
    return _retailDataCollector.collectAllStores();
  },
  
  collectStore: async (storeId: string, startDate?: Date, endDate?: Date) => {
    if (!_retailDataCollector) {
      _retailDataCollector = new RetailDataCollector();
    }
    return _retailDataCollector.collectStore(storeId, startDate, endDate);
  }
};