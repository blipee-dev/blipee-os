/**
 * Sales API Adapter
 * Based on working implementation from data_collector_model.py
 */

import axios from 'axios';
import { z } from 'zod';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';
import pRetry from 'p-retry';

// Sales data schema based on actual API response
const SalesDataSchema = z.object({
  Loja: z.string(),
  Data: z.string(), // YYYYMMDD format
  Hora: z.string(), // HH:MM:SS format
  Codigo: z.string(),
  ReferenciaDocumento: z.string(),
  DocumentoOriginal: z.string().nullable(),
  TipoDocumento: z.string(),
  VendedorCodigo: z.string(),
  VendedorNomeCurto: z.string(),
  Item: z.string(),
  Descritivo: z.string(),
  QuantidadeDataTypeNumber: z.string(),
  'Valor venda com IVADataTypeNumber': z.string(),
  'Valor venda sem IVADataTypeNumber': z.string(),
  IVADataTypeNumber: z.string(),
  DescontoDataTypeNumber: z.string(),
  '% DescontoDataTypeNumber': z.string(),
  'Motivo Desconto': z.string().nullable(),
});

// API response structure
const ApiResponseSchema = z.object({
  Sucesso: z.boolean(),
  Objecto: z.object({
    ResultSets: z.array(z.array(SalesDataSchema)),
  }),
});

export type SalesData = z.infer<typeof SalesDataSchema>;
export type ProcessedSalesData = {
  storeId: string;
  timestamp: Date;
  code: string;
  documentReference: string;
  originalDocument: string | null;
  documentType: string;
  sellerCode: string;
  sellerName: string;
  item: string;
  description: string;
  quantity: number;
  amountWithTax: number;
  amountWithoutTax: number;
  tax: number;
  discount: number;
  discountPercentage: number;
  discountReason: string | null;
};

export class SalesApiAdapter {
  private apiUrl: string;
  private authUrl: string;
  private username: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: {
    apiUrl: string;
    authUrl: string;
    username: string;
    password: string;
  }) {
    this.apiUrl = config.apiUrl;
    this.authUrl = config.authUrl;
    this.username = config.username;
    this.password = config.password;
  }

  /**
   * Authenticate and get JWT token
   */
  async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.token && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.token;
    }

    try {
      logger.info('Authenticating with sales API...');
      
      const response = await axios.post(this.authUrl, {
        username: this.username,
        password: this.password,
      });

      this.token = response.data.token;
      // Assume token expires in 1 hour
      this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
      
      logger.info('Successfully authenticated with sales API');
      return this.token;
    } catch (error) {
      logger.error('Failed to authenticate with sales API', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Fetch sales data for a specific date and store
   */
  async fetchSalesData(date: Date, storeId: string): Promise<ProcessedSalesData[]> {
    const token = await this.authenticate();
    const dateStr = format(date, 'yyyy-MM-dd');

    try {
      const response = await pRetry(
        async () => {
          const result = await axios.get(`${this.apiUrl}/vendas`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            params: {
              data: dateStr,
              loja: storeId,
            },
          });
          return result;
        },
        {
          retries: 5,
          minTimeout: 10000, // 10 seconds
          onFailedAttempt: (error) => {
            logger.warn(`Sales API request failed, attempt ${error.attemptNumber}`, {
              error: error.message,
              retriesLeft: error.retriesLeft,
            });
          },
        }
      );

      const validated = ApiResponseSchema.parse(response.data);
      
      if (!validated.Sucesso) {
        logger.warn(`Sales API returned unsuccessful response for ${storeId} on ${dateStr}`);
        return [];
      }

      const salesData: ProcessedSalesData[] = [];
      
      // Process result sets
      for (const resultSet of validated.Objecto.ResultSets) {
        for (const record of resultSet) {
          salesData.push(this.processRecord(record));
        }
      }

      // Remove duplicates based on document reference, item, and timestamp
      const uniqueData = this.removeDuplicates(salesData);
      
      logger.info(`Fetched ${uniqueData.length} sales records for ${storeId} on ${dateStr}`);
      return uniqueData;
    } catch (error) {
      logger.error('Error fetching sales data', {
        storeId,
        date: dateStr,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Fetch sales data for a date range
   */
  async fetchSalesDataRange(
    startDate: Date,
    endDate: Date,
    storeId: string,
    excludeHours?: number[]
  ): Promise<ProcessedSalesData[]> {
    const allData: ProcessedSalesData[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate < endDate) {
      const hour = currentDate.getHours();
      
      // Skip excluded hours (default: 0-8)
      if (excludeHours && excludeHours.includes(hour)) {
        currentDate.setHours(hour + 1);
        continue;
      }

      try {
        const data = await this.fetchSalesData(currentDate, storeId);
        allData.push(...data);
      } catch (error) {
        logger.error(`Failed to fetch sales data for ${storeId} at ${currentDate}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        // Continue with next hour even if this one fails
      }

      // Move to next hour
      currentDate.setHours(hour + 1);
    }

    return allData;
  }

  /**
   * Process raw sales record
   */
  private processRecord(record: SalesData): ProcessedSalesData {
    // Parse numeric values (handle comma as decimal separator)
    const parseNumber = (value: string): number => {
      return parseFloat(value.replace(',', '.'));
    };

    // Combine date and time
    const timestamp = new Date(`${record.Data.slice(0, 4)}-${record.Data.slice(4, 6)}-${record.Data.slice(6, 8)}T${record.Hora}`);

    return {
      storeId: record.Loja,
      timestamp,
      code: record.Codigo,
      documentReference: record.ReferenciaDocumento,
      originalDocument: record.DocumentoOriginal,
      documentType: record.TipoDocumento,
      sellerCode: record.VendedorCodigo,
      sellerName: record.VendedorNomeCurto,
      item: record.Item,
      description: record.Descritivo,
      quantity: parseNumber(record.QuantidadeDataTypeNumber),
      amountWithTax: parseNumber(record['Valor venda com IVADataTypeNumber']),
      amountWithoutTax: parseNumber(record['Valor venda sem IVADataTypeNumber']),
      tax: parseNumber(record.IVADataTypeNumber),
      discount: parseNumber(record.DescontoDataTypeNumber),
      discountPercentage: parseNumber(record['% DescontoDataTypeNumber']),
      discountReason: record['Motivo Desconto'],
    };
  }

  /**
   * Remove duplicate records
   */
  private removeDuplicates(data: ProcessedSalesData[]): ProcessedSalesData[] {
    const seen = new Set<string>();
    const unique: ProcessedSalesData[] = [];

    for (const record of data) {
      const key = `${record.documentReference}-${record.item}-${record.timestamp.toISOString()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(record);
      }
    }

    return unique;
  }

  /**
   * Validate data quality
   */
  validateDataQuality(data: ProcessedSalesData[]): {
    valid: ProcessedSalesData[];
    invalid: Array<{ record: ProcessedSalesData; reason: string }>;
  } {
    const valid: ProcessedSalesData[] = [];
    const invalid: Array<{ record: ProcessedSalesData; reason: string }> = [];

    for (const record of data) {
      if (record.quantity <= 0) {
        invalid.push({ record, reason: 'Invalid quantity' });
      } else if (record.amountWithTax < 0) {
        invalid.push({ record, reason: 'Negative amount' });
      } else if (record.timestamp > new Date()) {
        invalid.push({ record, reason: 'Future timestamp' });
      } else {
        valid.push(record);
      }
    }

    return { valid, invalid };
  }
}

// Configuration for stores (matching Python implementation)
export const STORE_CONFIGS = {
  'OML01': 'OML01-Omnia GuimarãesShopping',
  'ONL01': 'ONL01-Only UBBO Amadora',
  'OML02': 'OML02-Omnia Fórum Almada',
  'OML03': 'OML03-Omnia Norteshopping',
  'ONL02': 'ONL02-Only Gaia',
};

// Operating hours configuration
export const OPERATING_HOURS = {
  start: 9, // 9 AM
  end: 1,   // 1 AM next day
  excludeHours: [0, 1, 2, 3, 4, 5, 6, 7, 8], // Skip overnight hours
};