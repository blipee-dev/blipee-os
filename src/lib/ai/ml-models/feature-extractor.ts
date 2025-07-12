/**
 * Feature Extractor
 * Extracts and engineers features from raw data
 */

import { Feature, RawData, FeatureEngineeringConfig } from './types';

export class FeatureExtractor {
  private config: FeatureEngineeringConfig;

  constructor(config: FeatureEngineeringConfig) {
    this.config = config;
  }

  /**
   * Extract features from raw data
   */
  async extract(data: RawData): Promise<Feature[]> {
    const features: Feature[] = [];
    
    // Extract basic features
    features.push(...this.extractBasicFeatures(data));
    
    // Extract time-based features
    if (data.timestamp) {
      features.push(...this.extractTimeFeatures(data.timestamp));
    }
    
    // Extract domain-specific features
    features.push(...await this.extractDomainFeatures(data));
    
    // Create lag features if configured
    if (this.config.lagPeriods) {
      features.push(...this.createLagFeatures(data, this.config.lagPeriods));
    }
    
    // Create rolling statistics if configured
    if (this.config.windowSizes) {
      features.push(...this.createRollingFeatures(data, this.config.windowSizes));
    }
    
    return features;
  }

  /**
   * Extract basic numeric features
   */
  private extractBasicFeatures(data: RawData): Feature[] {
    const features: Feature[] = [];
    const numericFields = [
      'scope1', 'scope2', 'scope3', 'totalEmissions',
      'energyConsumption', 'productionVolume', 'temperature',
      'humidity', 'economicIndex'
    ];
    
    for (const field of numericFields) {
      if (field in data && typeof data[field] === 'number') {
        features.push({
          name: field,
          value: data[field],
          type: 'numeric'
        });
      }
    }
    
    return features;
  }

  /**
   * Extract time-based features
   */
  private extractTimeFeatures(timestamp: any): Feature[] {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    
    return [
      {
        name: 'hour_of_day',
        value: date.getHours(),
        type: 'numeric'
      },
      {
        name: 'day_of_week',
        value: date.getDay(),
        type: 'numeric'
      },
      {
        name: 'day_of_month',
        value: date.getDate(),
        type: 'numeric'
      },
      {
        name: 'month',
        value: date.getMonth() + 1,
        type: 'numeric'
      },
      {
        name: 'quarter',
        value: Math.floor(date.getMonth() / 3) + 1,
        type: 'numeric'
      },
      {
        name: 'is_weekend',
        value: date.getDay() >= 5 ? 1 : 0,
        type: 'binary'
      },
      {
        name: 'is_holiday',
        value: this.isHoliday(date) ? 1 : 0,
        type: 'binary'
      }
    ];
  }

  /**
   * Extract domain-specific ESG features
   */
  private async extractDomainFeatures(data: RawData): Promise<Feature[]> {
    const features: Feature[] = [];
    
    // Emissions intensity
    if (data.emissions && data.revenue) {
      features.push({
        name: 'emissions_intensity',
        value: data.emissions.total / data.revenue,
        type: 'numeric'
      });
    }
    
    // Energy efficiency
    if (data.energyConsumption && data.productionVolume && data.productionVolume > 0) {
      features.push({
        name: 'energy_efficiency',
        value: data.productionVolume / data.energyConsumption,
        type: 'numeric'
      });
    }
    
    // Renewable percentage
    if (data.renewableEnergy && data.totalEnergy) {
      features.push({
        name: 'renewable_percentage',
        value: data.renewableEnergy / data.totalEnergy,
        type: 'numeric'
      });
    }
    
    // Carbon price sensitivity
    if (data.carbonPrice) {
      features.push({
        name: 'carbon_price',
        value: data.carbonPrice,
        type: 'numeric'
      });
    }
    
    return features;
  }

  /**
   * Create lag features
   */
  private createLagFeatures(data: RawData, lagPeriods: number[]): Feature[] {
    const features: Feature[] = [];
    
    // For demonstration, creating synthetic lag features
    // In production, this would access historical data
    for (const lag of lagPeriods) {
      if (data.energyConsumption) {
        features.push({
          name: `energy_lag_${lag}`,
          value: data.energyConsumption * (1 + Math.random() * 0.1 - 0.05),
          type: 'numeric'
        });
      }
      
      if (data.totalEmissions) {
        features.push({
          name: `emissions_lag_${lag}`,
          value: data.totalEmissions * (1 + Math.random() * 0.1 - 0.05),
          type: 'numeric'
        });
      }
    }
    
    return features;
  }

  /**
   * Create rolling statistics features
   */
  private createRollingFeatures(data: RawData, windowSizes: number[]): Feature[] {
    const features: Feature[] = [];
    
    // For demonstration, creating synthetic rolling features
    // In production, this would calculate from historical data
    for (const window of windowSizes) {
      if (data.energyConsumption) {
        features.push({
          name: `energy_rolling_mean_${window}`,
          value: data.energyConsumption,
          type: 'numeric'
        });
        
        features.push({
          name: `energy_rolling_std_${window}`,
          value: data.energyConsumption * 0.1,
          type: 'numeric'
        });
      }
    }
    
    return features;
  }

  /**
   * Check if a date is a holiday
   */
  private isHoliday(date: Date): boolean {
    // Simple implementation - check for major US holidays
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    const holidays = [
      { month: 1, day: 1 },   // New Year's Day
      { month: 7, day: 4 },   // Independence Day
      { month: 12, day: 25 }  // Christmas
    ];
    
    return holidays.some(h => h.month === month && h.day === day);
  }

  /**
   * Get feature importance scores
   */
  async getFeatureImportance(): Promise<Record<string, number>> {
    // Placeholder for feature importance calculation
    return {
      'energyConsumption': 0.35,
      'productionVolume': 0.28,
      'temperature': 0.15,
      'renewable_percentage': 0.22
    };
  }
}