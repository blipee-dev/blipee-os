/**
 * Prophet Forecasting Client
 * 
 * TypeScript client for communicating with the Prophet forecasting service.
 * Prophet service runs on localhost:8001 in the same Railway container.
 */

interface ProphetDataPoint {
  date: string;  // ISO format: "2022-01-01"
  value: number;
}

interface ProphetRequest {
  domain: 'energy' | 'water' | 'waste' | 'emissions';
  organizationId: string;
  historicalData: ProphetDataPoint[];
  monthsToForecast: number;
}

interface ProphetResponse {
  forecasted: number[];
  confidence: {
    lower: number[];
    upper: number[];
  };
  method: string;
  metadata: {
    trend: number;
    yearly: number;
    historical_mean: number;
    historical_std: number;
    data_points: number;
    forecast_horizon: number;
    domain: string;
    organization_id: string;
    generated_at: string;
  };
}

export class ProphetClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    // Use internal localhost (same container communication)
    this.baseUrl = process.env.FORECAST_SERVICE_URL || 'http://localhost:8001';
    this.timeout = 30000; // 30 seconds
  }

  /**
   * Generate forecast using Prophet
   */
  async forecast(request: ProphetRequest): Promise<ProphetResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Prophet service error: ${response.statusText} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Prophet service timeout (30s)');
        }
        throw error;
      }
      
      throw new Error('Unknown Prophet service error');
    }
  }

  /**
   * Check if Prophet service is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get Prophet service info
   */
  async getInfo(): Promise<{ service: string; status: string; version: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (!response.ok) return null;
      
      return await response.json();
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const prophetClient = new ProphetClient();
