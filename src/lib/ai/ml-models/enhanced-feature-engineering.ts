/**
 * Enhanced Feature Engineering Pipeline for Phase 5
 * Advanced feature extraction for ESG and sustainability data
 */

import {
  Feature,
  ESGData,
  EmissionsData,
  FeatureEngineeringConfig
} from './types';

interface EngineeredFeatures {
  features: Feature[];
  metadata: {
    totalFeatures: number;
    featureImportance?: Array<{ name: string; importance: number }>;
    correlationMatrix?: number[][];
    engineeringTime: number;
  };
}

interface FeatureConfig extends FeatureEngineeringConfig {
  includeTimeFeatures?: boolean;
  includeLagFeatures?: boolean;
  includeRollingStats?: boolean;
  includeDomainFeatures?: boolean;
  includeInteractionFeatures?: boolean;
  includeSeasonalFeatures?: boolean;
}

export class FeatureEngineeringPipeline {
  private encoders: Map<string, any> = new Map();
  private scalers: Map<string, any> = new Map();
  private featureHistory: Map<string, number[]> = new Map();
  private config: FeatureConfig;

  constructor(config: FeatureConfig = {}) {
    this.config = {
      lagPeriods: [1, 7, 30],
      windowSizes: [7, 14, 30],
      maxFeatures: 100,
      maxInteractionDepth: 2,
      includeTimeFeatures: true,
      includeLagFeatures: true,
      includeRollingStats: true,
      includeDomainFeatures: true,
      includeInteractionFeatures: true,
      includeSeasonalFeatures: true,
      ...config
    };
  }

  /**
   * Engineer comprehensive features from ESG data
   */
  async engineerFeatures(
    rawData: ESGData | ESGData[],
    targetVariable?: string
  ): Promise<EngineeredFeatures> {
    const startTime = Date.now();
    console.log('⚙️ Engineering features from ESG data...');
    
    const dataArray = Array.isArray(rawData) ? rawData : [rawData];
    const allFeatures: Feature[] = [];
    
    for (const data of dataArray) {
      const features: Feature[] = [];
      
      // Time-based features
      if (this.config.includeTimeFeatures) {
        const timeFeatures = this.extractTimeFeatures(data.timestamp || new Date());
        features.push(...timeFeatures);
      }
      
      // Domain-specific ESG features
      if (this.config.includeDomainFeatures) {
        const domainFeatures = await this.extractESGFeatures(data);
        features.push(...domainFeatures);
      }
      
      // Seasonal features
      if (this.config.includeSeasonalFeatures) {
        const seasonalFeatures = this.extractSeasonalFeatures(data.timestamp || new Date());
        features.push(...seasonalFeatures);
      }
      
      // Rolling statistics (if historical data available)
      if (this.config.includeRollingStats && this.featureHistory.size > 0) {
        const rollingFeatures = this.calculateRollingStats(data, this.config.windowSizes!);
        features.push(...rollingFeatures);
      }
      
      // Lag features (if historical data available)
      if (this.config.includeLagFeatures && this.featureHistory.size > 0) {
        const lagFeatures = this.createLagFeatures(data, this.config.lagPeriods!);
        features.push(...lagFeatures);
      }
      
      allFeatures.push(...features);
    }
    
    // Interaction features
    let finalFeatures = allFeatures;
    if (this.config.includeInteractionFeatures && allFeatures.length > 1) {
      const interactionFeatures = this.createInteractionFeatures(
        allFeatures,
        this.config.maxInteractionDepth!
      );
      finalFeatures = [...allFeatures, ...interactionFeatures];
    }
    
    // Feature selection
    if (targetVariable && finalFeatures.length > this.config.maxFeatures!) {
      finalFeatures = await this.selectFeatures(
        finalFeatures,
        targetVariable,
        this.config.maxFeatures!
      );
    }
    
    // Feature scaling and normalization
    finalFeatures = this.scaleFeatures(finalFeatures);
    
    // Update feature history for future lag/rolling calculations
    this.updateFeatureHistory(finalFeatures);
    
    const engineeringTime = Date.now() - startTime;
    
    console.log(`✅ Feature engineering completed: ${finalFeatures.length} features in ${engineeringTime}ms`);
    
    return {
      features: finalFeatures,
      metadata: {
        totalFeatures: finalFeatures.length,
        featureImportance: await this.calculateFeatureImportance(finalFeatures, targetVariable),
        correlationMatrix: this.calculateCorrelationMatrix(finalFeatures),
        engineeringTime
      }
    };
  }

  /**
   * Extract time-based features
   */
  private extractTimeFeatures(timestamp: Date | string): Feature[] {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    
    return [
      { name: 'hour_of_day', value: date.getHours(), type: 'numeric' },
      { name: 'day_of_week', value: date.getDay(), type: 'numeric' },
      { name: 'day_of_month', value: date.getDate(), type: 'numeric' },
      { name: 'month', value: date.getMonth() + 1, type: 'numeric' },
      { name: 'quarter', value: Math.floor(date.getMonth() / 3) + 1, type: 'numeric' },
      { name: 'year', value: date.getFullYear(), type: 'numeric' },
      { name: 'is_weekend', value: date.getDay() >= 5 ? 1 : 0, type: 'binary' },
      { name: 'is_month_end', value: this.isMonthEnd(date) ? 1 : 0, type: 'binary' },
      { name: 'is_quarter_end', value: this.isQuarterEnd(date) ? 1 : 0, type: 'binary' },
      { name: 'is_year_end', value: this.isYearEnd(date) ? 1 : 0, type: 'binary' },
      { name: 'days_since_epoch', value: Math.floor(date.getTime() / (1000 * 60 * 60 * 24)), type: 'numeric' }
    ];
  }

  /**
   * Extract seasonal features
   */
  private extractSeasonalFeatures(timestamp: Date | string): Feature[] {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const dayOfYear = this.getDayOfYear(date);
    
    return [
      { name: 'day_of_year', value: dayOfYear, type: 'numeric' },
      { name: 'season', value: this.getSeason(date), type: 'numeric' },
      { name: 'sin_day_of_year', value: Math.sin(2 * Math.PI * dayOfYear / 365), type: 'numeric' },
      { name: 'cos_day_of_year', value: Math.cos(2 * Math.PI * dayOfYear / 365), type: 'numeric' },
      { name: 'sin_month', value: Math.sin(2 * Math.PI * date.getMonth() / 12), type: 'numeric' },
      { name: 'cos_month', value: Math.cos(2 * Math.PI * date.getMonth() / 12), type: 'numeric' },
      { name: 'sin_hour', value: Math.sin(2 * Math.PI * date.getHours() / 24), type: 'numeric' },
      { name: 'cos_hour', value: Math.cos(2 * Math.PI * date.getHours() / 24), type: 'numeric' }
    ];
  }

  /**
   * Extract ESG-specific domain features
   */
  private async extractESGFeatures(data: ESGData): Promise<Feature[]> {
    const features: Feature[] = [];
    
    // Emissions features
    if (data.emissions) {
      const totalEmissions = (data.emissions.scope1 || 0) + 
                            (data.emissions.scope2 || 0) + 
                            (data.emissions.scope3 || 0);
      
      features.push(
        { name: 'total_emissions', value: totalEmissions, type: 'numeric' },
        { name: 'scope1_emissions', value: data.emissions.scope1 || 0, type: 'numeric' },
        { name: 'scope2_emissions', value: data.emissions.scope2 || 0, type: 'numeric' },
        { name: 'scope3_emissions', value: data.emissions.scope3 || 0, type: 'numeric' }
      );
      
      // Emissions ratios
      if (totalEmissions > 0) {
        features.push(
          { name: 'scope1_ratio', value: (data.emissions.scope1 || 0) / totalEmissions, type: 'numeric' },
          { name: 'scope2_ratio', value: (data.emissions.scope2 || 0) / totalEmissions, type: 'numeric' },
          { name: 'scope3_ratio', value: (data.emissions.scope3 || 0) / totalEmissions, type: 'numeric' }
        );
      }
      
      // Emissions intensity
      if (data.revenue && data.revenue > 0) {
        features.push({
          name: 'emissions_intensity_revenue',
          value: totalEmissions / data.revenue,
          type: 'numeric'
        });
      }
      
      if (data.production && data.production > 0) {
        features.push({
          name: 'emissions_intensity_production',
          value: totalEmissions / data.production,
          type: 'numeric'
        });
      }
    }
    
    // Energy features
    if (data.energy) {
      const totalEnergy = data.energy.total || data.energy.consumption;
      
      features.push(
        { name: 'total_energy_consumption', value: totalEnergy, type: 'numeric' },
        { name: 'renewable_energy', value: data.energy.renewable || 0, type: 'numeric' }
      );
      
      // Energy efficiency metrics
      if (totalEnergy > 0) {
        const renewableRatio = (data.energy.renewable || 0) / totalEnergy;
        features.push(
          { name: 'renewable_energy_ratio', value: renewableRatio, type: 'numeric' },
          { name: 'fossil_energy_ratio', value: 1 - renewableRatio, type: 'numeric' }
        );
      }
      
      // Energy intensity
      if (data.revenue && data.revenue > 0 && totalEnergy > 0) {
        features.push({
          name: 'energy_intensity_revenue',
          value: totalEnergy / data.revenue,
          type: 'numeric'
        });
      }
      
      if (data.production && data.production > 0 && totalEnergy > 0) {
        features.push({
          name: 'energy_intensity_production',
          value: totalEnergy / data.production,
          type: 'numeric'
        });
      }
    }
    
    // Supply chain features
    if (data.suppliers && data.suppliers.length > 0) {
      const avgRiskScore = data.suppliers.reduce((sum, s) => sum + s.riskScore, 0) / data.suppliers.length;
      const highRiskSuppliers = data.suppliers.filter(s => s.riskScore > 0.7).length;
      const supplierDiversity = this.calculateSupplierDiversity(data.suppliers);
      
      features.push(
        { name: 'supplier_count', value: data.suppliers.length, type: 'numeric' },
        { name: 'avg_supplier_risk_score', value: avgRiskScore, type: 'numeric' },
        { name: 'high_risk_supplier_count', value: highRiskSuppliers, type: 'numeric' },
        { name: 'high_risk_supplier_ratio', value: highRiskSuppliers / data.suppliers.length, type: 'numeric' },
        { name: 'supplier_diversity_index', value: supplierDiversity, type: 'numeric' }
      );
    }
    
    // Business performance features
    if (data.revenue) {
      features.push({ name: 'revenue', value: data.revenue, type: 'numeric' });
    }
    
    if (data.production) {
      features.push({ name: 'production_volume', value: data.production, type: 'numeric' });
    }
    
    return features;
  }

  /**
   * Create lag features from historical data
   */
  private createLagFeatures(data: ESGData, lagPeriods: number[]): Feature[] {
    const lagFeatures: Feature[] = [];
    
    for (const lag of lagPeriods) {
      // Get historical values for lag periods
      const emissions = this.getHistoricalValue('total_emissions', lag);
      const energy = this.getHistoricalValue('total_energy_consumption', lag);
      const revenue = this.getHistoricalValue('revenue', lag);
      
      if (emissions !== null) {
        lagFeatures.push({
          name: `emissions_lag_${lag}`,
          value: emissions,
          type: 'numeric'
        });
      }
      
      if (energy !== null) {
        lagFeatures.push({
          name: `energy_lag_${lag}`,
          value: energy,
          type: 'numeric'
        });
      }
      
      if (revenue !== null) {
        lagFeatures.push({
          name: `revenue_lag_${lag}`,
          value: revenue,
          type: 'numeric'
        });
      }
    }
    
    return lagFeatures;
  }

  /**
   * Calculate rolling statistics
   */
  private calculateRollingStats(data: ESGData, windowSizes: number[]): Feature[] {
    const rollingFeatures: Feature[] = [];
    
    for (const window of windowSizes) {
      // Calculate rolling statistics for key metrics
      const emissionsStats = this.calculateRollingStatsForMetric('total_emissions', window);
      const energyStats = this.calculateRollingStatsForMetric('total_energy_consumption', window);
      const revenueStats = this.calculateRollingStatsForMetric('revenue', window);
      
      // Add rolling mean, std, min, max
      if (emissionsStats) {
        rollingFeatures.push(
          { name: `emissions_rolling_mean_${window}`, value: emissionsStats.mean, type: 'numeric' },
          { name: `emissions_rolling_std_${window}`, value: emissionsStats.std, type: 'numeric' },
          { name: `emissions_rolling_min_${window}`, value: emissionsStats.min, type: 'numeric' },
          { name: `emissions_rolling_max_${window}`, value: emissionsStats.max, type: 'numeric' }
        );
      }
      
      if (energyStats) {
        rollingFeatures.push(
          { name: `energy_rolling_mean_${window}`, value: energyStats.mean, type: 'numeric' },
          { name: `energy_rolling_std_${window}`, value: energyStats.std, type: 'numeric' }
        );
      }
      
      if (revenueStats) {
        rollingFeatures.push(
          { name: `revenue_rolling_mean_${window}`, value: revenueStats.mean, type: 'numeric' },
          { name: `revenue_rolling_std_${window}`, value: revenueStats.std, type: 'numeric' }
        );
      }
    }
    
    return rollingFeatures;
  }

  /**
   * Create interaction features between existing features
   */
  private createInteractionFeatures(features: Feature[], maxDepth: number): Feature[] {
    if (maxDepth < 2) return [];
    
    const interactionFeatures: Feature[] = [];
    const numericFeatures = features.filter(f => f.type === 'numeric');
    
    // Create pairwise interactions
    for (let i = 0; i < numericFeatures.length; i++) {
      for (let j = i + 1; j < numericFeatures.length; j++) {
        const feature1 = numericFeatures[i];
        const feature2 = numericFeatures[j];
        
        // Multiplication interaction
        interactionFeatures.push({
          name: `${feature1.name}_x_${feature2.name}`,
          value: feature1.value * feature2.value,
          type: 'numeric'
        });
        
        // Ratio interaction (avoid division by zero)
        if (Math.abs(feature2.value) > 1e-10) {
          interactionFeatures.push({
            name: `${feature1.name}_div_${feature2.name}`,
            value: feature1.value / feature2.value,
            type: 'numeric'
          });
        }
        
        // Difference
        interactionFeatures.push({
          name: `${feature1.name}_minus_${feature2.name}`,
          value: feature1.value - feature2.value,
          type: 'numeric'
        });
      }
    }
    
    // Limit number of interaction features
    return interactionFeatures.slice(0, 50);
  }

  /**
   * Select top features using mutual information
   */
  private async selectFeatures(
    features: Feature[],
    target: string,
    maxFeatures: number
  ): Promise<Feature[]> {
    // Simplified feature selection - in production would use actual mutual information
    const numericFeatures = features.filter(f => f.type === 'numeric');
    
    // Score features based on variance and correlation heuristics
    const scoredFeatures = numericFeatures.map(feature => {
      // Simple scoring: prefer features with higher variance and meaningful names
      let score = Math.abs(feature.value) / (1 + Math.abs(feature.value));
      
      // Bonus for domain-relevant features
      if (feature.name.includes('emissions') || feature.name.includes('energy') || feature.name.includes('revenue')) {
        score *= 1.5;
      }
      
      // Bonus for time features
      if (feature.name.includes('month') || feature.name.includes('quarter') || feature.name.includes('season')) {
        score *= 1.2;
      }
      
      return { feature, score };
    });
    
    // Sort by score and select top features
    scoredFeatures.sort((a, b) => b.score - a.score);
    const selectedNumeric = scoredFeatures.slice(0, maxFeatures - 10).map(sf => sf.feature);
    
    // Always include categorical/binary features
    const nonNumericFeatures = features.filter(f => f.type !== 'numeric');
    
    return [...selectedNumeric, ...nonNumericFeatures.slice(0, 10)];
  }

  /**
   * Scale features using standardization
   */
  private scaleFeatures(features: Feature[]): Feature[] {
    const scaledFeatures: Feature[] = [];
    
    for (const feature of features) {
      if (feature.type === 'numeric') {
        // Get or create scaler for this feature
        let scaler = this.scalers.get(feature.name);
        if (!scaler) {
          scaler = { mean: 0, std: 1, count: 0, sum: 0, sumSquares: 0 };
          this.scalers.set(feature.name, scaler);
        }
        
        // Update running statistics
        scaler.count++;
        scaler.sum += feature.value;
        scaler.sumSquares += feature.value * feature.value;
        scaler.mean = scaler.sum / scaler.count;
        
        if (scaler.count > 1) {
          const variance = (scaler.sumSquares - (scaler.sum * scaler.sum) / scaler.count) / (scaler.count - 1);
          scaler.std = Math.sqrt(Math.max(variance, 1e-10));
        }
        
        // Scale the feature
        const scaledValue = (feature.value - scaler.mean) / scaler.std;
        
        scaledFeatures.push({
          ...feature,
          value: scaledValue
        });
      } else {
        // Don't scale categorical/binary features
        scaledFeatures.push(feature);
      }
    }
    
    return scaledFeatures;
  }

  // Helper methods
  
  private updateFeatureHistory(features: Feature[]): void {
    for (const feature of features) {
      if (feature.type === 'numeric') {
        if (!this.featureHistory.has(feature.name)) {
          this.featureHistory.set(feature.name, []);
        }
        
        const history = this.featureHistory.get(feature.name)!;
        history.push(feature.value);
        
        // Keep only last 100 values
        if (history.length > 100) {
          history.shift();
        }
      }
    }
  }

  private getHistoricalValue(featureName: string, lag: number): number | null {
    const history = this.featureHistory.get(featureName);
    if (!history || history.length < lag + 1) {
      return null;
    }
    return history[history.length - lag - 1];
  }

  private calculateRollingStatsForMetric(metricName: string, window: number): {
    mean: number;
    std: number;
    min: number;
    max: number;
  } | null {
    const history = this.featureHistory.get(metricName);
    if (!history || history.length < window) {
      return null;
    }
    
    const windowData = history.slice(-window);
    const mean = windowData.reduce((sum, val) => sum + val, 0) / windowData.length;
    const variance = windowData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / windowData.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...windowData);
    const max = Math.max(...windowData);
    
    return { mean, std, min, max };
  }

  private calculateSupplierDiversity(suppliers: Array<{ location: string; riskScore: number }>): number {
    // Calculate geographical diversity using Shannon entropy
    const locationCounts = new Map<string, number>();
    
    for (const supplier of suppliers) {
      const count = locationCounts.get(supplier.location) || 0;
      locationCounts.set(supplier.location, count + 1);
    }
    
    let entropy = 0;
    const total = suppliers.length;
    
    for (const count of Array.from(locationCounts.values())) {
      const probability = count / total;
      entropy -= probability * Math.log2(probability);
    }
    
    return entropy;
  }

  private async calculateFeatureImportance(
    features: Feature[],
    targetVariable?: string
  ): Promise<Array<{ name: string; importance: number }> | undefined> {
    if (!targetVariable) return undefined;
    
    // Simplified feature importance - in production would use actual ML techniques
    return features.map(feature => ({
      name: feature.name,
      importance: Math.random() // Placeholder
    })).sort((a, b) => b.importance - a.importance).slice(0, 10);
  }

  private calculateCorrelationMatrix(features: Feature[]): number[][] {
    const numericFeatures = features.filter(f => f.type === 'numeric');
    const n = numericFeatures.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i < n; i++) {
      matrix[i] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          // Simplified correlation calculation
          matrix[i][j] = Math.random() * 0.5; // Placeholder
        }
      }
    }
    
    return matrix;
  }

  // Date utility methods
  
  private isMonthEnd(date: Date): boolean {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    return nextDay.getMonth() !== date.getMonth();
  }

  private isQuarterEnd(date: Date): boolean {
    const month = date.getMonth() + 1;
    return (month === 3 || month === 6 || month === 9 || month === 12) && this.isMonthEnd(date);
  }

  private isYearEnd(date: Date): boolean {
    return date.getMonth() === 11 && this.isMonthEnd(date);
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  private getSeason(date: Date): number {
    const month = date.getMonth() + 1;
    if (month >= 3 && month <= 5) return 1; // Spring
    if (month >= 6 && month <= 8) return 2; // Summer
    if (month >= 9 && month <= 11) return 3; // Fall
    return 4; // Winter
  }
}
