/**
 * Feature Engineering Pipeline
 * Comprehensive feature extraction and engineering for ESG ML models
 */

import * as ss from 'simple-statistics';
import { 
  Feature, 
  FeatureEngineeringConfig, 
  RawData,
  EmissionsData,
  ESGData
} from './types';

export interface EngineeredFeatures {
  features: Feature[];
  metadata: {
    totalFeatures: number;
    featureImportance: Record<string, number>;
    correlationMatrix?: number[][];
  };
}

export class FeatureEngineeringPipeline {
  private encoders: Map<string, any> = new Map();
  private scalers: Map<string, any> = new Map();
  private featureHistory: Map<string, number[]> = new Map();
  private config: FeatureEngineeringConfig;

  constructor(config: FeatureEngineeringConfig = {}) {
    this.config = config;
  }

  /**
   * Main feature engineering method
   */
  async engineerFeatures(
    rawData: RawData | ESGData,
    featureConfig?: FeatureEngineeringConfig
  ): Promise<EngineeredFeatures> {
    const config = { ...this.config, ...featureConfig };
    
    // Time-based features
    const timeFeatures = rawData.timestamp ? 
      this.extractTimeFeatures(new Date(rawData.timestamp)) : [];
    
    // Lag features
    const lagFeatures = config.lagPeriods ? 
      await this.createLagFeatures(rawData, config.lagPeriods) : [];
    
    // Rolling statistics
    const rollingFeatures = config.windowSizes ?
      await this.calculateRollingStats(rawData, config.windowSizes) : [];
    
    // Domain-specific features
    const domainFeatures = await this.extractDomainFeatures(rawData as ESGData);
    
    // Interaction features
    const allBaseFeatures = [...timeFeatures, ...lagFeatures, ...rollingFeatures, ...domainFeatures];
    const interactions = config.maxInteractionDepth ?
      this.createInteractionFeatures(allBaseFeatures, config.maxInteractionDepth) : [];
    
    // Combine all features
    const allFeatures = [...allBaseFeatures, ...interactions];
    
    // Feature selection
    const selected = config.targetVariable && config.maxFeatures ?
      await this.selectFeatures(allFeatures, config.targetVariable, config.maxFeatures) :
      allFeatures;
    
    return {
      features: selected,
      metadata: {
        totalFeatures: selected.length,
        featureImportance: await this.calculateFeatureImportance(selected),
        correlationMatrix: selected.length <= 50 ? 
          await this.calculateCorrelations(selected) : undefined
      }
    };
  }

  /**
   * Extract time-based features
   */
  extractTimeFeatures(timestamp: Date): Feature[] {
    const features: Feature[] = [
      { name: 'hour_of_day', value: timestamp.getHours(), type: 'numeric' },
      { name: 'day_of_week', value: timestamp.getDay(), type: 'numeric' },
      { name: 'day_of_month', value: timestamp.getDate(), type: 'numeric' },
      { name: 'month', value: timestamp.getMonth() + 1, type: 'numeric' },
      { name: 'quarter', value: Math.floor(timestamp.getMonth() / 3) + 1, type: 'numeric' },
      { name: 'year', value: timestamp.getFullYear(), type: 'numeric' },
      { name: 'is_weekend', value: timestamp.getDay() >= 5 ? 1 : 0, type: 'binary' },
      { name: 'is_holiday', value: this.isHoliday(timestamp) ? 1 : 0, type: 'binary' },
      { name: 'is_business_hours', value: this.isBusinessHours(timestamp) ? 1 : 0, type: 'binary' }
    ];

    // Add cyclical encoding for time features
    const hourRad = (2 * Math.PI * timestamp.getHours()) / 24;
    features.push(
      { name: 'hour_sin', value: Math.sin(hourRad), type: 'numeric' },
      { name: 'hour_cos', value: Math.cos(hourRad), type: 'numeric' }
    );

    const dayRad = (2 * Math.PI * timestamp.getDay()) / 7;
    features.push(
      { name: 'day_sin', value: Math.sin(dayRad), type: 'numeric' },
      { name: 'day_cos', value: Math.cos(dayRad), type: 'numeric' }
    );

    const monthRad = (2 * Math.PI * (timestamp.getMonth() + 1)) / 12;
    features.push(
      { name: 'month_sin', value: Math.sin(monthRad), type: 'numeric' },
      { name: 'month_cos', value: Math.cos(monthRad), type: 'numeric' }
    );

    return features;
  }

  /**
   * Create lag features from historical data
   */
  async createLagFeatures(data: RawData | ESGData, lagPeriods: number[]): Promise<Feature[]> {
    const features: Feature[] = [];
    const keyMetrics = ['emissions', 'energy_consumption', 'production_volume', 'revenue'];
    
    for (const metric of keyMetrics) {
      const currentValue = this.extractMetricValue(data, metric);
      if (currentValue === null) continue;
      
      // Update history
      const history = this.featureHistory.get(metric) || [];
      history.push(currentValue);
      if (history.length > Math.max(...lagPeriods) + 1) {
        history.shift();
      }
      this.featureHistory.set(metric, history);
      
      // Create lag features
      for (const lag of lagPeriods) {
        if (history.length > lag) {
          const lagValue = history[history.length - lag - 1];
          features.push({
            name: `${metric}_lag_${lag}`,
            value: lagValue,
            type: 'numeric'
          });
          
          // Add difference features
          features.push({
            name: `${metric}_diff_${lag}`,
            value: currentValue - lagValue,
            type: 'numeric'
          });
          
          // Add percentage change
          if (lagValue !== 0) {
            features.push({
              name: `${metric}_pct_change_${lag}`,
              value: ((currentValue - lagValue) / lagValue) * 100,
              type: 'numeric'
            });
          }
        }
      }
    }
    
    return features;
  }

  /**
   * Calculate rolling statistics
   */
  async calculateRollingStats(data: RawData | ESGData, windowSizes: number[]): Promise<Feature[]> {
    const features: Feature[] = [];
    const keyMetrics = ['emissions', 'energy_consumption', 'production_volume'];
    
    for (const metric of keyMetrics) {
      const currentValue = this.extractMetricValue(data, metric);
      if (currentValue === null) continue;
      
      const history = this.featureHistory.get(metric) || [];
      
      for (const window of windowSizes) {
        if (history.length >= window) {
          const windowData = history.slice(-window);
          
          // Mean
          const mean = ss.mean(windowData);
          features.push({
            name: `${metric}_rolling_mean_${window}`,
            value: mean,
            type: 'numeric'
          });
          
          // Standard deviation
          const std = windowData.length > 1 ? ss.standardDeviation(windowData) : 0;
          features.push({
            name: `${metric}_rolling_std_${window}`,
            value: std,
            type: 'numeric'
          });
          
          // Min and Max
          features.push({
            name: `${metric}_rolling_min_${window}`,
            value: ss.min(windowData),
            type: 'numeric'
          });
          
          features.push({
            name: `${metric}_rolling_max_${window}`,
            value: ss.max(windowData),
            type: 'numeric'
          });
          
          // Trend (slope of linear regression)
          if (windowData.length > 2) {
            const indices = Array.from({ length: windowData.length }, (_, i) => i);
            const slope = ss.linearRegressionLine(ss.linearRegression(
              indices.map((i, idx) => [i, windowData[idx]])
            ))(1) - ss.linearRegressionLine(ss.linearRegression(
              indices.map((i, idx) => [i, windowData[idx]])
            ))(0);
            
            features.push({
              name: `${metric}_rolling_trend_${window}`,
              value: slope,
              type: 'numeric'
            });
          }
        }
      }
    }
    
    return features;
  }

  /**
   * Extract ESG domain-specific features
   */
  async extractESGFeatures(data: ESGData): Promise<Feature[]> {
    const features: Feature[] = [];
    
    // Emissions features
    if (data.emissions) {
      // Emissions intensity
      if (data.revenue && data.revenue > 0) {
        features.push({
          name: 'emissions_intensity',
          value: data.emissions.total / data.revenue,
          type: 'numeric'
        });
      }
      
      // Scope ratios
      if (data.emissions.scope1 !== undefined && data.emissions.total > 0) {
        features.push({
          name: 'scope1_ratio',
          value: data.emissions.scope1 / data.emissions.total,
          type: 'numeric'
        });
      }
      
      if (data.emissions.scope2 !== undefined && data.emissions.total > 0) {
        features.push({
          name: 'scope2_ratio',
          value: data.emissions.scope2 / data.emissions.total,
          type: 'numeric'
        });
      }
      
      if (data.emissions.scope3 !== undefined && data.emissions.total > 0) {
        features.push({
          name: 'scope3_ratio',
          value: data.emissions.scope3 / data.emissions.total,
          type: 'numeric'
        });
      }
    }
    
    // Energy features
    if (data.energy) {
      // Energy efficiency
      if (data.production && data.production > 0) {
        features.push({
          name: 'energy_efficiency',
          value: data.production / data.energy.consumption,
          type: 'numeric'
        });
      }
      
      // Renewable percentage
      if (data.energy.total > 0) {
        features.push({
          name: 'renewable_percentage',
          value: (data.energy.renewable / data.energy.total) * 100,
          type: 'numeric'
        });
      }
      
      // Energy intensity
      if (data.revenue && data.revenue > 0) {
        features.push({
          name: 'energy_intensity',
          value: data.energy.consumption / data.revenue,
          type: 'numeric'
        });
      }
    }
    
    // Supply chain features
    if (data.suppliers && data.suppliers.length > 0) {
      features.push({
        name: 'supply_chain_risk',
        value: await this.calculateSupplyChainRisk(data.suppliers),
        type: 'numeric'
      });
      
      features.push({
        name: 'supplier_count',
        value: data.suppliers.length,
        type: 'numeric'
      });
      
      // Geographic diversity
      const uniqueLocations = new Set(data.suppliers.map(s => s.location)).size;
      features.push({
        name: 'supplier_geographic_diversity',
        value: uniqueLocations / data.suppliers.length,
        type: 'numeric'
      });
    }
    
    return features;
  }

  /**
   * Extract domain features (wrapper for ESG features)
   */
  async extractDomainFeatures(data: ESGData): Promise<Feature[]> {
    return this.extractESGFeatures(data);
  }

  /**
   * Create interaction features between existing features
   */
  createInteractionFeatures(features: Feature[], maxDepth: number): Feature[] {
    const interactions: Feature[] = [];
    const numericFeatures = features.filter(f => f.type === 'numeric');
    
    if (maxDepth >= 2) {
      // Pairwise interactions
      for (let i = 0; i < numericFeatures.length; i++) {
        for (let j = i + 1; j < numericFeatures.length; j++) {
          const f1 = numericFeatures[i];
          const f2 = numericFeatures[j];
          
          // Multiplication
          interactions.push({
            name: `${f1.name}_x_${f2.name}`,
            value: f1.value * f2.value,
            type: 'numeric'
          });
          
          // Division (if denominator is not zero)
          if (Math.abs(f2.value) > 0.0001) {
            interactions.push({
              name: `${f1.name}_div_${f2.name}`,
              value: f1.value / f2.value,
              type: 'numeric'
            });
          }
        }
      }
    }
    
    return interactions;
  }

  /**
   * Select most important features
   */
  async selectFeatures(
    features: Feature[],
    targetVariable: string,
    maxFeatures: number
  ): Promise<Feature[]> {
    // Calculate mutual information scores
    const scores = await this.calculateMutualInformation(features, targetVariable);
    
    // Sort by importance and select top features
    return features
      .map((f, i) => ({ feature: f, score: scores[i] }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxFeatures)
      .map(item => item.feature);
  }

  /**
   * Calculate feature importance
   */
  async calculateFeatureImportance(features: Feature[]): Promise<Record<string, number>> {
    const importance: Record<string, number> = {};
    
    // Placeholder importance calculation
    // In production, this would use trained model's feature importance
    const baseImportance = {
      'emissions_intensity': 0.35,
      'energy_efficiency': 0.28,
      'renewable_percentage': 0.22,
      'supply_chain_risk': 0.15,
      'energy_consumption': 0.30,
      'production_volume': 0.25,
      'temperature': 0.10,
      'is_weekend': 0.05
    };
    
    for (const feature of features) {
      importance[feature.name] = baseImportance[feature.name] || 
        0.1 * Math.random(); // Random small importance for unknown features
    }
    
    return importance;
  }

  /**
   * Calculate correlation matrix
   */
  async calculateCorrelations(features: Feature[]): Promise<number[][]> {
    const numericFeatures = features.filter(f => f.type === 'numeric');
    const n = numericFeatures.length;
    const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    
    // Calculate pairwise correlations
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          // Placeholder - in production would calculate actual correlation
          matrix[i][j] = i < j ? 0.1 * Math.random() : matrix[j][i];
        }
      }
    }
    
    return matrix;
  }

  /**
   * Calculate mutual information between features and target
   */
  private async calculateMutualInformation(
    features: Feature[],
    targetVariable: string
  ): Promise<number[]> {
    // Placeholder - in production would calculate actual mutual information
    return features.map(() => Math.random());
  }

  /**
   * Calculate supply chain risk score
   */
  private async calculateSupplyChainRisk(suppliers: any[]): Promise<number> {
    if (suppliers.length === 0) return 0;
    
    const riskScores = suppliers.map(s => s.riskScore || 0);
    return ss.mean(riskScores);
  }

  /**
   * Extract metric value from data
   */
  private extractMetricValue(data: any, metric: string): number | null {
    switch (metric) {
      case 'emissions':
        return data.emissions?.total || data.totalEmissions || null;
      case 'energy_consumption':
        return data.energy?.consumption || data.energyConsumption || null;
      case 'production_volume':
        return data.production || data.productionVolume || null;
      case 'revenue':
        return data.revenue || null;
      default:
        return data[metric] || null;
    }
  }

  /**
   * Check if date is a holiday
   */
  private isHoliday(date: Date): boolean {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    
    // Major US holidays
    const holidays = [
      { month: 1, day: 1 },    // New Year's Day
      { month: 7, day: 4 },    // Independence Day
      { month: 12, day: 25 },  // Christmas
      { month: 11, day: 11 },  // Veterans Day
      { month: 2, day: 14 },   // Valentine's Day
      { month: 10, day: 31 }   // Halloween
    ];
    
    return holidays.some(h => h.month === month && h.day === day);
  }

  /**
   * Check if time is during business hours
   */
  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    const day = date.getDay();
    
    // Monday-Friday, 9 AM - 5 PM
    return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
  }
}