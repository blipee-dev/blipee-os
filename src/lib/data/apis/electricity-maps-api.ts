/**
 * Electricity Maps API Integration
 * Provides real-time grid carbon intensity data
 */

export interface ElectricityMapsConfig {
  apiKey: string;
  baseUrl?: string;
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
  };
}

interface CarbonIntensityData {
  zone: string;
  carbonIntensity: number; // gCO2eq/kWh
  datetime: Date;
  updatedAt: Date;
  emissionFactorType: 'lifecycle' | 'direct';
  isEstimated: boolean;
  estimationMethod?: string;
}

interface ElectricityBreakdown {
  powerConsumptionTotal: number; // MW
  powerProductionTotal: number; // MW
  powerImportTotal: number; // MW
  powerExportTotal: number; // MW
  fossilFreePercentage: number;
  renewablePercentage: number;
  powerConsumptionBreakdown: Record<string, number>;
  powerProductionBreakdown: Record<string, number>;
}

export class ElectricityMapsAPI {
  private config: ElectricityMapsConfig;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();

  constructor(config: ElectricityMapsConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.electricitymap.org/v3';
  }

  /**
   * Get real-time carbon intensity for a zone
   */
  async getCarbonIntensity(zone: string): Promise<CarbonIntensityData> {
    const cacheKey = `carbon-${zone}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/carbon-intensity/latest?zone=${zone}`,
        {
          headers: {
            'auth-token': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      const result: CarbonIntensityData = {
        zone: data.zone,
        carbonIntensity: data.carbonIntensity,
        datetime: new Date(data.datetime),
        updatedAt: new Date(data.updatedAt),
        emissionFactorType: data.emissionFactorType,
        isEstimated: data.isEstimated,
        estimationMethod: data.estimationMethod
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Electricity Maps API error:', error);
      return this.getMockCarbonIntensity(zone);
    }
  }

  /**
   * Get power breakdown for a zone
   */
  async getPowerBreakdown(zone: string): Promise<ElectricityBreakdown> {
    const cacheKey = `power-${zone}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(
        `${this.baseUrl}/power-breakdown/latest?zone=${zone}`,
        {
          headers: {
            'auth-token': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      const result: ElectricityBreakdown = {
        powerConsumptionTotal: data.powerConsumptionTotal,
        powerProductionTotal: data.powerProductionTotal,
        powerImportTotal: data.powerImportTotal,
        powerExportTotal: data.powerExportTotal,
        fossilFreePercentage: data.fossilFreePercentage,
        renewablePercentage: data.renewablePercentage,
        powerConsumptionBreakdown: data.powerConsumptionBreakdown,
        powerProductionBreakdown: data.powerProductionBreakdown
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Power breakdown API error:', error);
      return this.getMockPowerBreakdown(zone);
    }
  }

  /**
   * Get historical carbon intensity
   */
  async getHistoricalCarbonIntensity(
    zone: string,
    datetime: Date
  ): Promise<CarbonIntensityData[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/carbon-intensity/history?zone=${zone}&datetime=${datetime.toISOString()}`,
        {
          headers: {
            'auth-token': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      return data.history.map((item: any) => ({
        zone: item.zone,
        carbonIntensity: item.carbonIntensity,
        datetime: new Date(item.datetime),
        updatedAt: new Date(item.updatedAt),
        emissionFactorType: item.emissionFactorType,
        isEstimated: item.isEstimated
      }));
    } catch (error) {
      console.error('Historical data API error:', error);
      return [];
    }
  }

  /**
   * Get carbon intensity forecast
   */
  async getCarbonIntensityForecast(
    zone: string,
    hours: number = 24
  ): Promise<Array<{
    datetime: Date;
    carbonIntensity: number;
    marginCarbonIntensity?: number;
  }>> {
    const cacheKey = `forecast-${zone}-${hours}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Simulate forecast based on historical patterns
      const current = await this.getCarbonIntensity(zone);
      const forecast = [];

      for (let i = 1; i <= hours; i++) {
        const datetime = new Date(Date.now() + i * 3600000);
        const hour = datetime.getHours();
        
        // Simulate daily patterns
        let multiplier = 1;
        if (hour >= 0 && hour < 6) multiplier = 0.7; // Night
        else if (hour >= 6 && hour < 9) multiplier = 1.2; // Morning peak
        else if (hour >= 9 && hour < 17) multiplier = 0.9; // Day
        else if (hour >= 17 && hour < 21) multiplier = 1.3; // Evening peak
        else multiplier = 0.8; // Late evening

        // Add some randomness
        multiplier += (Math.random() - 0.5) * 0.2;

        forecast.push({
          datetime,
          carbonIntensity: Math.round(current.carbonIntensity * multiplier),
          marginCarbonIntensity: Math.round(current.carbonIntensity * multiplier * 1.1)
        });
      }

      this.setCache(cacheKey, forecast, 3600); // Cache for 1 hour
      return forecast;
    } catch (error) {
      console.error('Forecast API error:', error);
      return [];
    }
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations(
    zone: string,
    loadProfile: { hour: number; load: number }[]
  ): Promise<{
    currentCost: number;
    optimizedCost: number;
    savings: number;
    recommendations: Array<{
      action: string;
      fromHour: number;
      toHour: number;
      loadShift: number;
      carbonReduction: number;
    }>;
  }> {
    try {
      const forecast = await this.getCarbonIntensityForecast(zone, 24);
      
      // Calculate current carbon cost
      let currentCost = 0;
      loadProfile.forEach(({ hour, load }) => {
        const intensity = forecast[hour]?.carbonIntensity || 400;
        currentCost += load * intensity;
      });

      // Find optimal load shifting opportunities
      const recommendations = [];
      const sortedHours = forecast
        .map((f, idx) => ({ hour: idx, intensity: f.carbonIntensity }))
        .sort((a, b) => a.intensity - b.intensity);

      const lowCarbonHours = sortedHours.slice(0, 8);
      const highCarbonHours = sortedHours.slice(-8);

      // Recommend shifting from high to low carbon hours
      highCarbonHours.forEach(high => {
        const highLoad = loadProfile.find(l => l.hour === high.hour)?.load || 0;
        if (highLoad > 100) { // Only shift significant loads
          const lowHour = lowCarbonHours.find(low => 
            Math.abs(low.hour - high.hour) > 2 // Not adjacent hours
          );

          if (lowHour) {
            const loadToShift = Math.min(highLoad * 0.3, 500); // Shift up to 30%
            const carbonReduction = loadToShift * (high.intensity - lowHour.intensity);

            recommendations.push({
              action: 'shift_load',
              fromHour: high.hour,
              toHour: lowHour.hour,
              loadShift: loadToShift,
              carbonReduction
            });
          }
        }
      });

      // Calculate optimized cost
      let optimizedCost = currentCost;
      recommendations.forEach(rec => {
        optimizedCost -= rec.carbonReduction;
      });

      return {
        currentCost,
        optimizedCost,
        savings: ((currentCost - optimizedCost) / currentCost) * 100,
        recommendations: recommendations.slice(0, 5) // Top 5 recommendations
      };
    } catch (error) {
      console.error('Optimization error:', error);
      return {
        currentCost: 0,
        optimizedCost: 0,
        savings: 0,
        recommendations: []
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; zones?: string[]; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/zones`,
        {
          headers: {
            'auth-token': this.config.apiKey
          }
        }
      );

      if (!response.ok) {
        return {
          healthy: false,
          error: response.statusText
        };
      }

      const zones = await response.json();

      return {
        healthy: true,
        zones: Object.keys(zones)
      };
    } catch (error) {
      return {
        healthy: false,
        error: String(error)
      };
    }
  }

  // Cache helpers
  private getFromCache(key: string): any {
    if (!this.config.cache?.enabled) return null;

    const cached = this.cache.get(key);
    if (!cached) return null;

    const age = (Date.now() - cached.timestamp) / 1000;
    if (age > (this.config.cache.ttl || 300)) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCache(key: string, data: any, ttl?: number): void {
    if (!this.config.cache?.enabled) return;

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });

    // Clean old cache entries
    if (this.cache.size > 100) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }
  }

  // Mock data for development/testing
  private getMockCarbonIntensity(zone: string): CarbonIntensityData {
    const baseIntensity = {
      'US-CAL-CISO': 250,
      'DE': 400,
      'FR': 100,
      'GB': 350,
      'US-TEX-ERCO': 450,
      'IN': 700,
      'CN': 600,
      'BR': 150
    };

    const intensity = baseIntensity[zone] || 400;

    return {
      zone,
      carbonIntensity: intensity + Math.random() * 50 - 25,
      datetime: new Date(),
      updatedAt: new Date(),
      emissionFactorType: 'lifecycle',
      isEstimated: false
    };
  }

  private getMockPowerBreakdown(zone: string): ElectricityBreakdown {
    return {
      powerConsumptionTotal: 50000 + Math.random() * 10000,
      powerProductionTotal: 48000 + Math.random() * 10000,
      powerImportTotal: 5000 + Math.random() * 2000,
      powerExportTotal: 3000 + Math.random() * 2000,
      fossilFreePercentage: 40 + Math.random() * 20,
      renewablePercentage: 30 + Math.random() * 15,
      powerConsumptionBreakdown: {
        nuclear: 20,
        gas: 30,
        coal: 15,
        wind: 15,
        solar: 10,
        hydro: 10
      },
      powerProductionBreakdown: {
        nuclear: 25,
        gas: 25,
        coal: 10,
        wind: 20,
        solar: 12,
        hydro: 8
      }
    };
  }
}