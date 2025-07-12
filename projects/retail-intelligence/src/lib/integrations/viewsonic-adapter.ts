/**
 * ViewSonic VS133 Sensor Adapter
 * Based on working implementation from data_collector_model.py
 */

import axios from 'axios';
import { parse } from 'csv-parse/sync';
import { addHours, format } from 'date-fns';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Sensor configuration schema
const SensorConfigSchema = z.object({
  ip: z.string(),
  port: z.number().default(21001),
  username: z.string().default('admin'),
  password: z.string(),
  storeId: z.string(),
  storeName: z.string(),
});

export type SensorConfig = z.infer<typeof SensorConfigSchema>;

// CSV data schemas based on actual format
const PeopleCountingRowSchema = z.object({
  StartTime: z.string(),
  EndTime: z.string(),
  'Line1 - In': z.string(),
  'Line2 - In': z.string(),
  'Line3 - In': z.string(),
  'Line4 - In': z.string(),
  'Line4 - Out': z.string(),
});

const HeatmapRowSchema = z.object({
  StartTime: z.string(),
  EndTime: z.string(),
  'Value(s)': z.string(),
});

const RegionalCountingRowSchema = z.object({
  StartTime: z.string(),
  EndTime: z.string(),
  region1: z.string(),
  region2: z.string(),
  region3: z.string(),
  region4: z.string(),
  Sum: z.string(),
});

export class ViewSonicAdapter {
  private config: SensorConfig;
  private baseUrl: string;

  constructor(config: SensorConfig) {
    this.config = SensorConfigSchema.parse(config);
    this.baseUrl = `http://${this.config.username}:${this.config.password}@${this.config.ip}:${this.config.port}`;
  }

  /**
   * Fetch people counting data
   */
  async fetchPeopleCountingData(startTime: Date, endTime: Date) {
    const url = this.buildUrl('vcalogcsv', {
      report_type: '0',
      linetype: '31',
      statistics_type: '3',
      time_start: this.formatDateTime(startTime),
      time_end: this.formatDateTime(endTime),
    });

    try {
      const response = await axios.get(url);
      const records = parse(response.data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records.map((row: any) => {
        const validated = PeopleCountingRowSchema.parse(row);
        return {
          storeId: this.config.storeId,
          storeName: this.config.storeName,
          sensorIp: `${this.config.ip}:${this.config.port}`,
          startTime: this.parseDateTime(validated.StartTime),
          endTime: this.parseDateTime(validated.EndTime),
          totalIn: 
            parseInt(validated['Line1 - In']) + 
            parseInt(validated['Line2 - In']) + 
            parseInt(validated['Line3 - In']),
          line1In: parseInt(validated['Line1 - In']),
          line2In: parseInt(validated['Line2 - In']),
          line3In: parseInt(validated['Line3 - In']),
          line4In: parseInt(validated['Line4 - In']),
          line4Out: parseInt(validated['Line4 - Out']),
        };
      });
    } catch (error) {
      logger.error('Error fetching people counting data', {
        sensor: this.config.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Fetch heatmap data
   */
  async fetchHeatmapData(startTime: Date, endTime: Date) {
    const url = this.buildUrl('heatmapcsv', {
      sub_type: '0',
      time_start: this.formatDateTime(startTime),
      time_end: this.formatDateTime(endTime),
    });

    // Special cameras that need value division
    const specialCameras = [
      '62.48.154.135:21001',
      '62.48.154.135:21002',
      '93.108.96.96:21001',
    ];

    try {
      const response = await axios.get(url);
      const records = parse(response.data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      const sensorId = `${this.config.ip}:${this.config.port}`;
      const needsDivision = specialCameras.includes(sensorId);

      return records.map((row: any) => {
        const validated = HeatmapRowSchema.parse(row);
        const rawValue = parseInt(validated['Value(s)']);
        
        return {
          storeId: this.config.storeId,
          storeName: this.config.storeName,
          sensorIp: sensorId,
          startTime: this.parseDateTime(validated.StartTime),
          endTime: this.parseDateTime(validated.EndTime),
          value: needsDivision ? rawValue / 10 : rawValue,
        };
      });
    } catch (error) {
      logger.error('Error fetching heatmap data', {
        sensor: this.config.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Fetch regional counting data
   */
  async fetchRegionalCountingData(startTime: Date, endTime: Date) {
    const url = this.buildUrl('regionalcountlogcsv', {
      report_type: '0',
      lengthtype: '0',
      length: '0',
      region1: '1',
      region2: '1',
      region3: '1',
      region4: '1',
      time_start: this.formatDateTime(startTime),
      time_end: this.formatDateTime(endTime),
    });

    try {
      const response = await axios.get(url);
      const records = parse(response.data, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records.map((row: any) => {
        const validated = RegionalCountingRowSchema.parse(row);
        return {
          storeId: this.config.storeId,
          storeName: this.config.storeName,
          sensorIp: `${this.config.ip}:${this.config.port}`,
          startTime: this.parseDateTime(validated.StartTime),
          endTime: this.parseDateTime(validated.EndTime),
          region1: parseInt(validated.region1),
          region2: parseInt(validated.region2),
          region3: parseInt(validated.region3),
          region4: parseInt(validated.region4),
          total: parseInt(validated.Sum),
        };
      });
    } catch (error) {
      logger.error('Error fetching regional counting data', {
        sensor: this.config.ip,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate hourly URLs for batch processing
   */
  generateHourlyUrls(startDate: Date, endDate: Date, dataType: string) {
    const urls: string[] = [];
    let currentDate = new Date(startDate);

    while (currentDate < endDate) {
      const nextHour = addHours(currentDate, 1);
      const params = {
        time_start: this.formatDateTime(currentDate),
        time_end: this.formatDateTime(nextHour),
      };

      // Add data type specific parameters
      if (dataType === 'people_counting') {
        Object.assign(params, {
          report_type: '0',
          linetype: '31',
          statistics_type: '3',
        });
        urls.push(this.buildUrl('vcalogcsv', params));
      } else if (dataType === 'heatmap') {
        Object.assign(params, { sub_type: '0' });
        urls.push(this.buildUrl('heatmapcsv', params));
      } else if (dataType === 'regional') {
        Object.assign(params, {
          report_type: '0',
          lengthtype: '0',
          length: '0',
          region1: '1',
          region2: '1',
          region3: '1',
          region4: '1',
        });
        urls.push(this.buildUrl('regionalcountlogcsv', params));
      }

      currentDate = nextHour;
    }

    return urls;
  }

  /**
   * Build URL with parameters
   */
  private buildUrl(dataType: string, params: Record<string, string>) {
    const queryString = new URLSearchParams(params).toString();
    return `${this.baseUrl}/dataloader.cgi?dw=${dataType}&${queryString}`;
  }

  /**
   * Format date for sensor API (YYYY-MM-DD-HH:MM:SS)
   */
  private formatDateTime(date: Date): string {
    return format(date, 'yyyy-MM-dd-HH:mm:ss');
  }

  /**
   * Parse date from sensor format
   * Handles both 'YYYY/MM/DD HH:MM:SS' and 'YYYY-MM-DD HH:MM:SS' formats
   */
  private parseDateTime(dateStr: string): Date {
    const normalized = dateStr.replace(/\//g, '-');
    return new Date(normalized);
  }

  /**
   * Health check for sensor connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch last hour of data as health check
      const endTime = new Date();
      const startTime = addHours(endTime, -1);
      
      const url = this.buildUrl('vcalogcsv', {
        report_type: '0',
        linetype: '31',
        statistics_type: '3',
        time_start: this.formatDateTime(startTime),
        time_end: this.formatDateTime(endTime),
      });

      const response = await axios.get(url, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

// Store configurations matching the Python implementation
export const STORE_SENSORS: Record<string, SensorConfig[]> = {
  'OML01-Omnia GuimarãesShopping': [
    {
      ip: '93.108.96.96',
      port: 21001,
      username: 'admin',
      password: 'grnl.2024',
      storeId: 'OML01',
      storeName: 'Omnia GuimarãesShopping',
    },
  ],
  'ONL01-Only UBBO Amadora': [
    {
      ip: '93.108.245.76',
      port: 21002,
      username: 'admin',
      password: 'grnl.2024',
      storeId: 'ONL01',
      storeName: 'Only UBBO Amadora',
    },
    {
      ip: '93.108.245.76',
      port: 21003,
      username: 'admin',
      password: 'grnl.2024',
      storeId: 'ONL01',
      storeName: 'Only UBBO Amadora',
    },
  ],
  'OML02-Omnia Fórum Almada': [
    {
      ip: '188.37.175.41',
      port: 2201,
      username: 'admin',
      password: 'grnl.2024',
      storeId: 'OML02',
      storeName: 'Omnia Fórum Almada',
    },
  ],
  'OML03-Omnia Norteshopping': [
    {
      ip: '188.37.124.33',
      port: 21002,
      username: 'admin',
      password: 'grnl.2024',
      storeId: 'OML03',
      storeName: 'Omnia Norteshopping',
    },
  ],
  'ONL02-Only Gaia': [
    {
      ip: '62.48.154.135',
      port: 21001,
      username: 'admin',
      password: 'grnl.2024',
      storeId: 'ONL02',
      storeName: 'Only Gaia',
    },
    {
      ip: '62.48.154.135',
      port: 21002,
      username: 'admin',
      password: 'grnl.2024',
      storeId: 'ONL02',
      storeName: 'Only Gaia',
    },
  ],
};