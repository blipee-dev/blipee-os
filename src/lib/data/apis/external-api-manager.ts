/**
 * External API Manager
 * Centralized orchestration of all external data sources
 */

import { WeatherAPI } from './weather-api';
import { ElectricityMapsAPI } from './electricity-maps-api';
import { CarbonInterfaceAPI } from './carbon-interface-api';
import { RegulatoryAPI } from './regulatory-api';

export interface ExternalAPIConfig {
  weather?: {
    apiKey: string;
    rateLimit?: { requests: number; windowMs: number };
  };
  electricityMaps?: {
    apiKey: string;
    cache?: { enabled: boolean; ttl: number };
  };
  carbonInterface?: {
    apiKey: string;
    units?: 'metric' | 'imperial';
  };
  regulatory?: {
    apiKey: string;
    webhookUrl?: string;
  };
}

export class ExternalAPIManager {
  private weather?: WeatherAPI;
  private electricityMaps?: ElectricityMapsAPI;
  private carbonInterface?: CarbonInterfaceAPI;
  private regulatory?: RegulatoryAPI;

  constructor(config: ExternalAPIConfig) {
    // Initialize APIs based on available configuration
    if (config.weather?.apiKey) {
      this.weather = new WeatherAPI(config.weather);
    }

    if (config.electricityMaps?.apiKey) {
      this.electricityMaps = new ElectricityMapsAPI(config.electricityMaps);
    }

    if (config.carbonInterface?.apiKey) {
      this.carbonInterface = new CarbonInterfaceAPI(config.carbonInterface);
    }

    if (config.regulatory?.apiKey) {
      this.regulatory = new RegulatoryAPI(config.regulatory);
    }
  }

  /**
   * Get comprehensive building intelligence data
   */
  async getBuildingIntelligence(params: {
    location: { lat: number; lon: number };
    zone?: string;
    buildingProfile?: {
      type: 'office' | 'retail' | 'industrial' | 'residential';
      size: number; // sqm
      occupancy: number;
      energyUse: number; // kWh/month
    };
  }): Promise<{
    weather: any;
    grid: any;
    recommendations: any;
    sustainability: any;
  }> {
    const results = await Promise.allSettled([
      // Weather data for HVAC optimization
      this.weather?.getCurrentWeather(params.location),
      
      // Grid data for load shifting
      params.zone ? this.electricityMaps?.getCarbonIntensity(params.zone) : null,
      
      // Grid forecast for optimization
      params.zone ? this.electricityMaps?.getCarbonIntensityForecast(params.zone, 24) : null
    ]);

    const [weatherResult, gridResult, forecastResult] = results;

    const weatherData = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
    const gridData = gridResult.status === 'fulfilled' ? gridResult.value : null;
    const forecastData = forecastResult.status === 'fulfilled' ? forecastResult.value : null;

    // Generate integrated recommendations
    const recommendations = this.generateIntegratedRecommendations({
      weather: weatherData,
      grid: gridData,
      forecast: forecastData,
      building: params.buildingProfile
    });

    // Calculate sustainability metrics
    const sustainability = await this.calculateSustainabilityMetrics({
      building: params.buildingProfile,
      grid: gridData,
      weather: weatherData
    });

    return {
      weather: weatherData,
      grid: {
        current: gridData,
        forecast: forecastData
      },
      recommendations,
      sustainability
    };
  }

  /**
   * Calculate emissions for various activities
   */
  async calculateEmissions(activities: Array<{
    type: 'electricity' | 'vehicle' | 'flight' | 'shipping';
    data: any;
  }>): Promise<{
    totalEmissions: number;
    breakdown: Array<{
      type: string;
      emissions: number;
      unit: string;
      details: any;
    }>;
    equivalencies: {
      cars: number;
      trees: number;
      flights: number;
    };
  }> {
    if (!this.carbonInterface) {
      throw new Error('Carbon Interface API not configured');
    }

    const results = await Promise.allSettled(
      activities.map(async (activity) => {
        switch (activity.type) {
          case 'electricity':
            return {
              type: 'electricity',
              result: await this.carbonInterface!.calculateElectricityEmissions(activity.data)
            };
          case 'vehicle':
            return {
              type: 'vehicle',
              result: await this.carbonInterface!.calculateVehicleEmissions(activity.data)
            };
          case 'flight':
            return {
              type: 'flight',
              result: await this.carbonInterface!.calculateFlightEmissions(activity.data)
            };
          case 'shipping':
            return {
              type: 'shipping',
              result: await this.carbonInterface!.calculateShippingEmissions(activity.data)
            };
          default:
            throw new Error(`Unknown activity type: ${activity.type}`);
        }
      })
    );

    const breakdown = results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => {
        const { type, result: data } = result.value;
        return {
          type,
          emissions: data.carbon_kg || data.attributes?.carbon_kg || data.carbonKg,
          unit: 'kg CO2e',
          details: data
        };
      });

    const totalEmissions = breakdown.reduce((sum, item) => sum + item.emissions, 0);

    return {
      totalEmissions,
      breakdown,
      equivalencies: {
        cars: Math.round(totalEmissions / 4600), // Average car emissions per year
        trees: Math.round(totalEmissions / 21), // Trees needed to absorb CO2
        flights: Math.round(totalEmissions / 200) // Short-haul flights equivalent
      }
    };
  }

  /**
   * Get compliance status and upcoming deadlines
   */
  async getComplianceStatus(params: {
    jurisdiction: string;
    industry: string;
    companySize: 'small' | 'medium' | 'large';
    frameworks?: string[];
  }): Promise<{
    applicable: any[];
    upcoming: any[];
    deadlines: any[];
    alerts: any[];
  }> {
    if (!this.regulatory) {
      throw new Error('Regulatory API not configured');
    }

    const [applicable, updates, calendar] = await Promise.allSettled([
      this.regulatory.getApplicableRegulations(params),
      this.regulatory.getRegulationUpdates({
        jurisdictions: [params.jurisdiction],
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      }),
      this.regulatory.getRegulatoryCalendar({
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
        jurisdictions: [params.jurisdiction]
      })
    ]);

    return {
      applicable: applicable.status === 'fulfilled' ? applicable.value : [],
      upcoming: updates.status === 'fulfilled' ? updates.value : [],
      deadlines: calendar.status === 'fulfilled' ? calendar.value : [],
      alerts: [] // Would come from webhook subscriptions
    };
  }

  /**
   * Generate energy optimization plan
   */
  async generateEnergyOptimizationPlan(params: {
    location: { lat: number; lon: number };
    zone?: string;
    currentUsage: Array<{ hour: number; usage: number }>; // kWh by hour
    constraints?: {
      minLoad?: number;
      maxShift?: number; // percentage
      criticalHours?: number[];
    };
  }): Promise<{
    currentCost: number;
    optimizedCost: number;
    savings: {
      carbon: number; // kg CO2e
      cost: number; // currency
      percentage: number;
    };
    schedule: Array<{
      hour: number;
      originalLoad: number;
      optimizedLoad: number;
      carbonIntensity: number;
      reason: string;
    }>;
    recommendations: string[];
  }> {
    // Get current weather for HVAC optimization
    const weather = this.weather ? 
      await this.weather.getCurrentWeather(params.location) : null;

    // Get grid carbon intensity forecast
    const forecast = this.electricityMaps && params.zone ? 
      await this.electricityMaps.getCarbonIntensityForecast(params.zone, 24) : null;

    // Get optimization recommendations from electricity maps
    const optimization = this.electricityMaps && params.zone ?
      await this.electricityMaps.getOptimizationRecommendations(params.zone, params.currentUsage) : null;

    // Calculate baseline costs and emissions
    let currentCarbonCost = 0;
    params.currentUsage.forEach(({ hour, usage }) => {
      const intensity = forecast?.[hour]?.carbonIntensity || 400;
      currentCarbonCost += usage * intensity;
    });

    // Apply optimizations
    const schedule = params.currentUsage.map(({ hour, usage }) => {
      const intensity = forecast?.[hour]?.carbonIntensity || 400;
      let optimizedLoad = usage;
      let reason = 'No optimization';

      // Apply load shifting from grid optimization
      const gridRec = optimization?.recommendations.find(r => r.fromHour === hour);
      if (gridRec) {
        optimizedLoad = Math.max(usage - gridRec.loadShift, params.constraints?.minLoad || 0);
        reason = 'Load shifted to low-carbon period';
      }

      // Apply weather-based HVAC optimization
      if (weather?.hvac?.schedule) {
        const hvacRec = weather.hvac.schedule.find((s: any) => s.hour === hour);
        if (hvacRec) {
          // Adjust HVAC load based on weather recommendations
          const hvacAdjustment = hvacRec.mode === 'auto' ? 0 : 
                               hvacRec.mode === 'heating' ? usage * 0.1 :
                               hvacRec.mode === 'cooling' ? usage * 0.15 : 0;
          optimizedLoad += hvacAdjustment;
          reason += reason === 'No optimization' ? 'HVAC optimization' : ' + HVAC optimization';
        }
      }

      return {
        hour,
        originalLoad: usage,
        optimizedLoad,
        carbonIntensity: intensity,
        reason
      };
    });

    // Calculate optimized costs
    const optimizedCarbonCost = schedule.reduce((sum, { optimizedLoad, carbonIntensity }) => 
      sum + optimizedLoad * carbonIntensity, 0
    );

    const carbonSavings = currentCarbonCost - optimizedCarbonCost;
    const costSavings = carbonSavings * 0.05; // Assume $0.05/kg CO2e carbon price

    return {
      currentCost: currentCarbonCost,
      optimizedCost: optimizedCarbonCost,
      savings: {
        carbon: carbonSavings / 1000, // Convert to tonnes
        cost: costSavings,
        percentage: (carbonSavings / currentCarbonCost) * 100
      },
      schedule,
      recommendations: [
        ...(optimization?.recommendations.map(r => 
          `Shift ${r.loadShift}kWh from hour ${r.fromHour} to hour ${r.toHour}`
        ) || []),
        ...(weather?.alerts || []).map((alert: any) => alert.action)
      ]
    };
  }

  /**
   * Health check all configured APIs
   */
  async healthCheck(): Promise<{
    overall: boolean;
    services: Record<string, { healthy: boolean; error?: string; details?: any }>;
  }> {
    const checks = await Promise.allSettled([
      this.weather ? this.weather.healthCheck().then(result => ({ name: 'weather', result })) : null,
      this.electricityMaps ? this.electricityMaps.healthCheck().then(result => ({ name: 'electricityMaps', result })) : null,
      this.carbonInterface ? this.carbonInterface.healthCheck().then(result => ({ name: 'carbonInterface', result })) : null,
      this.regulatory ? this.regulatory.healthCheck().then(result => ({ name: 'regulatory', result })) : null
    ].filter(Boolean));

    const services: Record<string, any> = {};
    let healthyCount = 0;
    let totalCount = 0;

    checks.forEach(check => {
      if (check.status === 'fulfilled' && check.value) {
        const { name, result } = check.value;
        services[name] = result;
        totalCount++;
        if (result.healthy) healthyCount++;
      }
    });

    return {
      overall: healthyCount === totalCount && totalCount > 0,
      services
    };
  }

  // Private helper methods

  private generateIntegratedRecommendations(data: any): any {
    const recommendations = [];

    // Weather-based recommendations
    if (data.weather?.recommendations) {
      recommendations.push(...data.weather.recommendations);
    }

    // Grid-based recommendations
    if (data.grid?.trend === 'increasing') {
      recommendations.push('Consider reducing energy consumption - grid carbon intensity is rising');
    }

    // Forecast-based recommendations
    if (data.forecast) {
      const lowCarbonHours = data.forecast
        .map((f: any, idx: number) => ({ hour: idx, intensity: f.carbonIntensity }))
        .sort((a: any, b: any) => a.intensity - b.intensity)
        .slice(0, 6);

      if (lowCarbonHours.length > 0) {
        recommendations.push(
          `Best times for energy-intensive tasks: ${lowCarbonHours.map((h: any) => `${h.hour}:00`).join(', ')}`
        );
      }
    }

    return {
      immediate: recommendations.slice(0, 3),
      planning: recommendations.slice(3),
      priority: 'medium'
    };
  }

  private async calculateSustainabilityMetrics(data: any): Promise<any> {
    if (!data.building) return {};

    const monthlyEmissions = data.building.energyUse * (data.grid?.carbonIntensity || 400) / 1000; // kg CO2e

    return {
      monthlyEmissions,
      annualEmissions: monthlyEmissions * 12,
      intensity: monthlyEmissions / data.building.size, // kg CO2e/sqm
      benchmark: 'Above average for building type', // Would use real benchmarking data
      trend: 'stable',
      recommendations: [
        'Implement LED lighting upgrade',
        'Optimize HVAC scheduling',
        'Consider solar installation'
      ]
    };
  }
}