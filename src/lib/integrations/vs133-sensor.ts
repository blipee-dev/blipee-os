/**
 * VS133 Sensor Integration Service
 * Based on production reference system from retail-intelligence/retail-reference
 */

import { createClient } from '@supabase/supabase-js';

interface VS133Config {
  baseUrl: string;
  username: string;
  password: string;
  storeId: string;
  storeName: string;
}

interface PeopleCountingData {
  storeId: string;
  sensorIp: string;
  startTime: Date;
  endTime: Date;
  totalIn: number;
  line1In: number;
  line2In: number;
  line3In: number;
  line4In: number;
  line4Out: number;
}

interface RegionalCountingData {
  storeId: string;
  sensorIp: string;
  startTime: Date;
  endTime: Date;
  region1: number;
  region2: number;
  region3: number;
  region4: number;
  region5?: number;
  region6?: number;
  region7?: number;
  region8?: number;
  total: number;
}

interface HeatmapData {
  storeId: string;
  sensorIp: string;
  startTime: Date;
  endTime: Date;
  value: number; // Duration in seconds
}

// Store configurations from reference system
const STORE_CONFIGS: Record<string, VS133Config> = {
  'OML01': {
    baseUrl: 'http://93.108.96.96:21001',
    username: 'admin',
    password: 'grnl.2024',
    storeId: 'OML01',
    storeName: 'OML01-Omnia GuimarãesShopping'
  },
  'ONL01': {
    baseUrl: 'http://93.108.245.76:21002',
    username: 'admin', 
    password: 'grnl.2024',
    storeId: 'ONL01',
    storeName: 'ONL01-Only UBBO Amadora'
  },
  'OML02': {
    baseUrl: 'http://188.37.190.134:2201',
    username: 'admin',
    password: 'grnl.2024', 
    storeId: 'OML02',
    storeName: 'OML02-Omnia Fórum Almada'
  },
  'OML03': {
    baseUrl: 'http://188.37.124.33:21002',
    username: 'admin',
    password: 'grnl.2024',
    storeId: 'OML03', 
    storeName: 'OML03-Omnia Norteshopping'
  }
};

export class VS133SensorService {
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

  /**
   * Get people counting configuration from VS133 sensor
   */
  async getPeopleCountingConfig(config: VS133Config): Promise<any> {
    try {
      const url = `${config.baseUrl}/api/v1/counting/getAlgoParams`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Digest username="${config.username}", password="${config.password}"`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get config: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting VS133 config:', error);
      throw error;
    }
  }

  /**
   * Extract UUIDs from sensor configuration
   */
  extractUuids(configData: any): { lines: string[] } {
    const uuids = { lines: [] as string[] };
    
    if (configData?.data?.areas?.lineUuids) {
      uuids.lines = configData.data.areas.lineUuids.filter((uuid: string) => uuid);
    }
    
    return uuids;
  }

  /**
   * Initiate data query on VS133 sensor
   */
  async initiateQuery(
    config: VS133Config,
    uuid: string, 
    event: number,
    startTime: Date,
    endTime: Date
  ): Promise<any> {
    try {
      const url = `${config.baseUrl}/api/v1/counting/getDatabseRecords`;
      const payload = {
        event,
        timeStart: startTime.toISOString().replace('T', ' ').substring(0, 19),
        timeEnd: endTime.toISOString().replace('T', ' ').substring(0, 19),
        lineParam: { line: 1, timeUnit: 0, mode: 0 },
        uuid
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Digest username="${config.username}", password="${config.password}"`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to initiate query: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error initiating VS133 query:', error);
      throw error;
    }
  }

  /**
   * Get people counting results from VS133 sensor
   */
  async getPeopleCountingResults(
    config: VS133Config,
    uuid: string,
    event: number
  ): Promise<any> {
    try {
      const url = `${config.baseUrl}/api/v1/counting/getRecordsResult`;
      const payload = { uuid, event };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Digest username="${config.username}", password="${config.password}"`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to get results: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting VS133 results:', error);
      throw error;
    }
  }

  /**
   * Collect people counting data from VS133 sensor
   */
  async collectPeopleCountingData(
    storeCode: string,
    startTime: Date,
    endTime: Date
  ): Promise<PeopleCountingData[]> {
    const config = STORE_CONFIGS[storeCode];
    if (!config) {
      throw new Error(`Store config not found for: ${storeCode}`);
    }

    try {
      // Get sensor configuration
      const configData = await this.getPeopleCountingConfig(config);
      const uuids = this.extractUuids(configData);

      const results: PeopleCountingData[] = [];

      // Process each line UUID
      for (const uuid of uuids.lines) {
        if (!uuid) continue;

        // Initiate query
        await this.initiateQuery(config, uuid, 0, startTime, endTime);
        
        // Wait for processing
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Get results
        const data = await this.getPeopleCountingResults(config, uuid, 0);
        
        if (data?.data?.lineRecords?.records) {
          for (const record of data.data.lineRecords.records) {
            results.push({
              storeId: config.storeId,
              sensorIp: config.baseUrl.replace('http://', ''),
              startTime: new Date(startTime.getTime() + 60 * 60 * 1000), // Adjust for timezone
              endTime: new Date(endTime.getTime() + 60 * 60 * 1000),
              totalIn: record.enter || 0,
              line1In: record.line1_enter || 0,
              line2In: record.line2_enter || 0,
              line3In: record.line3_enter || 0,
              line4In: record.line4_enter || 0,
              line4Out: record.line4_exit || 0
            });
          }
        }
      }

      return results;
    } catch (error) {
      console.error(`Error collecting people counting data for ${storeCode}:`, error);
      throw error;
    }
  }

  /**
   * Collect regional people counting data using CSV endpoint
   */
  async collectRegionalCountingData(
    storeCode: string,
    startTime: Date,
    endTime: Date
  ): Promise<RegionalCountingData[]> {
    const config = STORE_CONFIGS[storeCode];
    if (!config) {
      throw new Error(`Store config not found for: ${storeCode}`);
    }

    try {
      const url = `${config.baseUrl}/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&lengthtype=0&length=0&region1=1&region2=1&region3=1&region4=1&time_start=${startTime.toISOString().replace('T', '-').replace(/\..+/, '').replace(/:/g, ':')}&time_end=${endTime.toISOString().replace('T', '-').replace(/\..+/, '').replace(/:/g, ':')}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch regional data: ${response.status}`);
      }

      const csvData = await response.text();
      return this.parseRegionalCSV(csvData, config.storeId, config.baseUrl.replace('http://', ''));
    } catch (error) {
      console.error(`Error collecting regional data for ${storeCode}:`, error);
      throw error;
    }
  }

  /**
   * Collect heatmap data for dwell time analysis
   */
  async collectHeatmapData(
    storeCode: string,
    startTime: Date,
    endTime: Date
  ): Promise<HeatmapData[]> {
    const config = STORE_CONFIGS[storeCode];
    if (!config) {
      throw new Error(`Store config not found for: ${storeCode}`);
    }

    try {
      const url = `${config.baseUrl}/dataloader.cgi?dw=heatmapcsv&sub_type=0&time_start=${startTime.toISOString().replace('T', '-').replace(/\..+/, '').replace(/:/g, ':')}&time_end=${endTime.toISOString().replace('T', '-').replace(/\..+/, '').replace(/:/g, ':')}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch heatmap data: ${response.status}`);
      }

      const csvData = await response.text();
      return this.parseHeatmapCSV(csvData, config.storeId, config.baseUrl.replace('http://', ''));
    } catch (error) {
      console.error(`Error collecting heatmap data for ${storeCode}:`, error);
      throw error;
    }
  }

  /**
   * Parse regional CSV data
   */
  private parseRegionalCSV(csvData: string, storeId: string, sensorIp: string): RegionalCountingData[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const results: RegionalCountingData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      results.push({
        storeId,
        sensorIp,
        startTime: new Date(rowData.StartTime),
        endTime: new Date(rowData.EndTime),
        region1: parseInt(rowData.region1) || 0,
        region2: parseInt(rowData.region2) || 0,
        region3: parseInt(rowData.region3) || 0,
        region4: parseInt(rowData.region4) || 0,
        total: parseInt(rowData.Sum) || 0
      });
    }

    return results;
  }

  /**
   * Parse heatmap CSV data
   */
  private parseHeatmapCSV(csvData: string, storeId: string, sensorIp: string): HeatmapData[] {
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const results: HeatmapData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const rowData: any = {};
      headers.forEach((header, index) => {
        rowData[header] = values[index];
      });

      results.push({
        storeId,
        sensorIp,
        startTime: new Date(rowData.StartTime),
        endTime: new Date(rowData.EndTime),
        value: parseInt(rowData['Value(s)']) || 0
      });
    }

    return results;
  }

  /**
   * Store people counting data in database
   */
  async storePeopleCountingData(data: PeopleCountingData[]): Promise<void> {
    try {
      for (const record of data) {
        const { error } = await this.supabase
          .from('retail.foot_traffic_raw')
          .upsert({
            store_id: record.storeId,
            sensor_ip: record.sensorIp,
            start_time: record.startTime.toISOString(),
            end_time: record.endTime.toISOString(),
            total_in: record.totalIn,
            line1_in: record.line1In,
            line2_in: record.line2In,
            line3_in: record.line3In,
            line4_in: record.line4In,
            line4_out: record.line4Out
          });

        if (error) {
          console.error('Error storing people counting data:', error);
        }
      }
    } catch (error) {
      console.error('Error in storePeopleCountingData:', error);
      throw error;
    }
  }

  /**
   * Store regional counting data in database
   */
  async storeRegionalCountingData(data: RegionalCountingData[]): Promise<void> {
    try {
      for (const record of data) {
        const { error } = await this.supabase
          .from('retail.regional_people_counting_data')
          .upsert({
            store_id: record.storeId,
            sensor_ip: record.sensorIp,
            start_time: record.startTime.toISOString(),
            end_time: record.endTime.toISOString(),
            region1: record.region1,
            region2: record.region2,
            region3: record.region3,
            region4: record.region4,
            region5: record.region5 || 0,
            region6: record.region6 || 0,
            region7: record.region7 || 0,
            region8: record.region8 || 0,
            total: record.total
          });

        if (error) {
          console.error('Error storing regional counting data:', error);
        }
      }
    } catch (error) {
      console.error('Error in storeRegionalCountingData:', error);
      throw error;
    }
  }

  /**
   * Store heatmap data in database
   */
  async storeHeatmapData(data: HeatmapData[]): Promise<void> {
    try {
      for (const record of data) {
        const { error } = await this.supabase
          .from('retail.heatmap_data')
          .upsert({
            store_id: record.storeId,
            sensor_ip: record.sensorIp,
            start_time: record.startTime.toISOString(),
            end_time: record.endTime.toISOString(),
            value: record.value
          });

        if (error) {
          console.error('Error storing heatmap data:', error);
        }
      }
    } catch (error) {
      console.error('Error in storeHeatmapData:', error);
      throw error;
    }
  }

  /**
   * Collect all sensor data for a store
   */
  async collectAllSensorData(storeCode: string, startTime: Date, endTime: Date): Promise<void> {
    try {
      console.log(`Collecting sensor data for ${storeCode} from ${startTime} to ${endTime}`);

      // Collect people counting data
      const peopleCountingData = await this.collectPeopleCountingData(storeCode, startTime, endTime);
      await this.storePeopleCountingData(peopleCountingData);

      // Collect regional counting data
      const regionalData = await this.collectRegionalCountingData(storeCode, startTime, endTime);
      await this.storeRegionalCountingData(regionalData);

      // Collect heatmap data
      const heatmapData = await this.collectHeatmapData(storeCode, startTime, endTime);
      await this.storeHeatmapData(heatmapData);

      console.log(`Sensor data collection completed for ${storeCode}`);
    } catch (error) {
      console.error(`Error collecting sensor data for ${storeCode}:`, error);
      throw error;
    }
  }

  /**
   * Get available store codes
   */
  getAvailableStores(): string[] {
    return Object.keys(STORE_CONFIGS);
  }
}

// Lazy-loaded singleton instance
let _vs133SensorService: VS133SensorService | null = null;

export const vs133SensorService = {
  async getSensorData(storeId: string, startDate: Date, endDate: Date) {
    if (!_vs133SensorService) {
      _vs133SensorService = new VS133SensorService();
    }
    return _vs133SensorService.collectAllSensorData(storeId, startDate, endDate);
  },
  
  async testConnection() {
    // Return a mock response for build purposes
    return {
      connected: false,
      message: 'VS133 sensor integration not configured for build'
    };
  }
};