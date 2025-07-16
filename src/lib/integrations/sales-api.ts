/**
 * Sales API Integration Service
 * Based on production reference system from retail-intelligence/retail-reference
 */

import { createClient } from '@supabase/supabase-js';

interface SalesAPIConfig {
  baseUrl: string;
  username: string;
  password: string;
}

interface SalesTransaction {
  storeId: string;
  data: Date;
  codigo: string;
  referenciaDocumento: string;
  documentoOriginal?: string;
  tipoDocumento: string;
  hora: string;
  vendedorCodigo: string;
  vendedorNomeCurto: string;
  item: string;
  descritivo: string;
  quantidade: number;
  valorVendaComIva: number;
  valorVendaSemIva: number;
  iva: number;
  desconto: number;
  percentualDesconto: number;
  motivoDesconto?: string;
}

interface AuthResponse {
  Sucesso: boolean;
  Objecto?: {
    IdentityToken: string;
  };
  Mensagem?: string;
}

interface SalesQueryResponse {
  Sucesso: boolean;
  Objecto?: {
    ResultSets: any[][];
  };
  Mensagem?: string;
}

// Items to exclude from analytics (from reference system)
const EXCLUDED_ITEMS = [
  '5713758079406',
  '5713759955808', 
  '5713759956829',
  'CARRIERBAG1',
  'GIFTOPTION1',
  'GIFTOPTION2'
];

export class SalesAPIService {
  private config: SalesAPIConfig;
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

  constructor() {
    this.config = {
      baseUrl: process.env.SALES_API_URL || 'https://mainfashion-api.retailmanager.pt',
      username: process.env.SALES_API_USERNAME || 'consulta',
      password: process.env.SALES_API_PASSWORD || 'Mf@2023!'
    };
  }

  /**
   * Authenticate with the sales API
   */
  async authenticate(): Promise<string> {
    try {
      const authUrl = `${this.config.baseUrl}/api/autenticar`;
      const authPayload = {
        Username: this.config.username,
        Password: this.config.password
      };

      const response = await fetch(authUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authPayload)
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const authData: AuthResponse = await response.json();
      
      if (authData.Sucesso && authData.Objecto?.IdentityToken) {
        return authData.Objecto.IdentityToken;
      } else {
        throw new Error(`Authentication error: ${authData.Mensagem}`);
      }
    } catch (error) {
      console.error('Error authenticating with sales API:', error);
      throw error;
    }
  }

  /**
   * Query sales data for a specific store and date
   */
  async querySalesData(jwtToken: string, date: string, store: string): Promise<any[]> {
    try {
      const consultaUrl = `${this.config.baseUrl}/api/consulta/executarsync`;
      const consultaPayload = {
        ConsultaId: '3af64719-a6b3-ee11-8933-005056b8cd07',
        Parametros: [
          { Nome: 'Data', Valor: date },
          { Nome: 'Loja', Valor: store }
        ]
      };

      const response = await fetch(consultaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`
        },
        body: JSON.stringify(consultaPayload)
      });

      if (!response.ok) {
        throw new Error(`Sales query failed: ${response.status}`);
      }

      const queryData: SalesQueryResponse = await response.json();
      
      if (queryData.Sucesso && queryData.Objecto?.ResultSets) {
        const resultSets = queryData.Objecto.ResultSets;
        if (resultSets && resultSets.length > 0) {
          return this.filterDataByStore(resultSets[0], store);
        }
      }

      return [];
    } catch (error) {
      console.error(`Error querying sales data for ${store} on ${date}:`, error);
      throw error;
    }
  }

  /**
   * Filter sales data by store (from reference system)
   */
  private filterDataByStore(data: any[], store: string): any[] {
    return data.filter(item => item.Loja === store);
  }

  /**
   * Process raw sales data into database format
   */
  private processSalesData(rawData: any): SalesTransaction | null {
    try {
      // Parse date and time
      const dateTime = new Date(`${rawData.Data}T${rawData.Hora}`);
      
      return {
        storeId: rawData.Loja,
        data: dateTime,
        codigo: rawData.Codigo,
        referenciaDocumento: rawData.ReferenciaDocumento,
        documentoOriginal: rawData.DocumentoOriginal || null,
        tipoDocumento: rawData.TipoDocumento,
        hora: rawData.Hora,
        vendedorCodigo: rawData.VendedorCodigo,
        vendedorNomeCurto: rawData.VendedorNomeCurto,
        item: rawData.Item,
        descritivo: rawData.Descritivo,
        quantidade: parseFloat(rawData.QuantidadeDataTypeNumber?.replace(',', '.') || '0'),
        valorVendaComIva: parseFloat(rawData['Valor venda com IVADataTypeNumber']?.replace(',', '.') || '0'),
        valorVendaSemIva: parseFloat(rawData['Valor venda sem IVADataTypeNumber']?.replace(',', '.') || '0'),
        iva: parseFloat(rawData.IVADataTypeNumber?.replace(',', '.') || '0'),
        desconto: parseFloat(rawData.DescontoDataTypeNumber?.replace(',', '.') || '0'),
        percentualDesconto: parseFloat(rawData['% DescontoDataTypeNumber']?.replace(',', '.') || '0'),
        motivoDesconto: rawData['Motivo Desconto'] || null
      };
    } catch (error) {
      console.error('Error processing sales data:', error);
      return null;
    }
  }

  /**
   * Check if sales transaction already exists in database
   */
  private async checkDuplicateTransaction(
    referenciaDocumento: string,
    item: string,
    data: Date
  ): Promise<boolean> {
    try {
      const { data: existing, error } = await this.supabase
        .from('retail.sales_transactions')
        .select('id')
        .eq('pos_transaction_id', referenciaDocumento)
        .eq('timestamp', data.toISOString())
        .limit(1);

      if (error) {
        console.error('Error checking duplicate transaction:', error);
        return false;
      }

      return existing && existing.length > 0;
    } catch (error) {
      console.error('Error in checkDuplicateTransaction:', error);
      return false;
    }
  }

  /**
   * Store sales transactions in database
   */
  async storeSalesTransactions(transactions: SalesTransaction[]): Promise<void> {
    try {
      for (const transaction of transactions) {
        // Check for duplicates
        const isDuplicate = await this.checkDuplicateTransaction(
          transaction.referenciaDocumento,
          transaction.item,
          transaction.data
        );

        if (isDuplicate) {
          console.log(`Duplicate transaction found: ${transaction.referenciaDocumento}`);
          continue;
        }

        // Store transaction
        const { error: transactionError } = await this.supabase
          .from('retail.sales_transactions')
          .insert({
            store_id: transaction.storeId,
            pos_transaction_id: transaction.referenciaDocumento,
            timestamp: transaction.data.toISOString(),
            amount: transaction.valorVendaComIva,
            tax_amount: transaction.iva,
            discount_amount: transaction.desconto,
            items_count: transaction.quantidade,
            staff_id: transaction.vendedorCodigo,
            payment_method: 'unknown', // Not provided in reference data
            metadata: {
              tipo_documento: transaction.tipoDocumento,
              documento_original: transaction.documentoOriginal,
              vendedor_nome: transaction.vendedorNomeCurto,
              motivo_desconto: transaction.motivoDesconto,
              percentual_desconto: transaction.percentualDesconto
            }
          });

        if (transactionError) {
          console.error('Error storing transaction:', transactionError);
          continue;
        }

        // Store sales item
        const { error: itemError } = await this.supabase
          .from('retail.sales_items')
          .insert({
            transaction_id: transaction.referenciaDocumento, // Will need to get actual UUID
            product_id: transaction.item,
            product_name: transaction.descritivo,
            quantity: transaction.quantidade,
            unit_price: transaction.valorVendaSemIva / transaction.quantidade,
            total_price: transaction.valorVendaSemIva
          });

        if (itemError) {
          console.error('Error storing sales item:', itemError);
        }
      }
    } catch (error) {
      console.error('Error in storeSalesTransactions:', error);
      throw error;
    }
  }

  /**
   * Collect sales data for a date range
   */
  async collectSalesData(
    store: string,
    startDate: Date,
    endDate: Date
  ): Promise<SalesTransaction[]> {
    try {
      console.log(`Collecting sales data for ${store} from ${startDate.toDateString()} to ${endDate.toDateString()}`);

      // Authenticate
      const jwtToken = await this.authenticate();
      
      const allTransactions: SalesTransaction[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        try {
          const rawData = await this.querySalesData(jwtToken, dateString, store);
          
          for (const item of rawData) {
            const transaction = this.processSalesData(item);
            if (transaction && !EXCLUDED_ITEMS.includes(transaction.item)) {
              allTransactions.push(transaction);
            }
          }
        } catch (error) {
          console.error(`Error collecting sales data for ${store} on ${dateString}:`, error);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      console.log(`Collected ${allTransactions.length} transactions for ${store}`);
      return allTransactions;
    } catch (error) {
      console.error(`Error in collectSalesData for ${store}:`, error);
      throw error;
    }
  }

  /**
   * Calculate sales analytics for a store and date range
   */
  async calculateSalesAnalytics(store: string, startDate: Date, endDate: Date) {
    try {
      const { data: transactions, error } = await this.supabase
        .from('retail.sales_transactions')
        .select(`
          *,
          sales_items!inner(*)
        `)
        .eq('store_id', store)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString());

      if (error) {
        throw error;
      }

      if (!transactions || transactions.length === 0) {
        return {
          totalSalesWithTax: 0,
          totalSalesWithoutTax: 0,
          transactionCount: 0,
          averageTransactionValue: 0,
          totalItems: 0,
          totalDiscounts: 0,
          returnIndex: 0,
          discountIndex: 0
        };
      }

      // Calculate analytics
      const totalSalesWithTax = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalTax = transactions.reduce((sum, t) => sum + (t.tax_amount || 0), 0);
      const totalSalesWithoutTax = totalSalesWithTax - totalTax;
      const totalDiscounts = transactions.reduce((sum, t) => sum + (t.discount_amount || 0), 0);
      const totalItems = transactions.reduce((sum, t) => sum + (t.items_count || 0), 0);
      
      const positiveTransactions = transactions.filter(t => (t.amount || 0) >= 0);
      const negativeTransactions = transactions.filter(t => (t.amount || 0) < 0);
      
      const transactionCount = positiveTransactions.length;
      const averageTransactionValue = transactionCount > 0 ? totalSalesWithTax / transactionCount : 0;
      const returnValue = negativeTransactions.reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
      const returnIndex = totalSalesWithoutTax > 0 ? (returnValue / totalSalesWithoutTax) * 100 : 0;
      const discountIndex = totalSalesWithTax > 0 ? (totalDiscounts / totalSalesWithTax) * 100 : 0;

      return {
        totalSalesWithTax,
        totalSalesWithoutTax,
        transactionCount,
        averageTransactionValue,
        totalItems,
        totalDiscounts,
        returnIndex,
        discountIndex,
        unitsPerTransaction: transactionCount > 0 ? totalItems / transactionCount : 0
      };
    } catch (error) {
      console.error('Error calculating sales analytics:', error);
      throw error;
    }
  }

  /**
   * Get top performing staff for a store and date range
   */
  async getTopStaff(store: string, startDate: Date, endDate: Date, limit = 3) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_top_staff_performance', {
          p_store_id: store,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString(),
          p_limit: limit
        });

      if (error) {
        console.error('Error getting top staff:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopStaff:', error);
      return [];
    }
  }

  /**
   * Get top selling products for a store and date range
   */
  async getTopProducts(store: string, startDate: Date, endDate: Date, limit = 5) {
    try {
      const { data, error } = await this.supabase
        .rpc('get_top_products', {
          p_store_id: store,
          p_start_date: startDate.toISOString(),
          p_end_date: endDate.toISOString(),
          p_limit: limit
        });

      if (error) {
        console.error('Error getting top products:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTopProducts:', error);
      return [];
    }
  }
}

// Lazy-loaded singleton instance
let _salesAPIService: SalesAPIService | null = null;

export const salesAPIService = {
  async getSalesData(storeId: string, startDate: Date, endDate: Date) {
    if (!_salesAPIService) {
      _salesAPIService = new SalesAPIService();
    }
    return _salesAPIService.collectSalesData(storeId, startDate, endDate);
  },
  
  async testConnection() {
    // Return a mock response for build purposes
    return {
      connected: false,
      message: 'Sales API integration not configured for build'
    };
  }
};