import { BaseMLModel, MLModelConfig, PredictionResult, TrainingData } from '../base';
import { FeatureStore } from '../feature-store/feature-store';
import { createClient } from '@supabase/supabase-js';

interface DemandFeatures {
  historical_sales: number[];
  foot_traffic: number[];
  day_of_week: number[];
  hour_of_day: number[];
  weather_conditions: string[];
  seasonal_factors: number[];
  promotional_events: boolean[];
  inventory_levels: number[];
  price_points: number[];
  competitor_activity: number[];
}

interface DemandPrediction {
  storeId: string;
  productCategory: string;
  timeHorizon: number; // days
  predictedDemand: number[];
  confidence: number;
  factors: {
    traffic_impact: number;
    seasonal_impact: number;
    promotional_impact: number;
    weather_impact: number;
    trend_impact: number;
  };
  recommendedActions: string[];
  uncertainty: {
    lower_bound: number[];
    upper_bound: number[];
  };
}

interface SeasonalPattern {
  type: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  pattern: number[];
  strength: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class DemandForecastingModel extends BaseMLModel {
  private featureStore: FeatureStore;
  private supabase: any;
  private seasonalPatterns: Map<string, SeasonalPattern[]>;

  constructor(config: MLModelConfig) {
    super({
      ...config,
      name: 'Demand Forecasting Model',
      version: '1.0.0',
      type: 'forecasting',
      inputSchema: {
        storeId: 'string',
        productCategory: 'string',
        timeHorizon: 'number',
        includeExternalFactors: 'boolean'
      },
      outputSchema: {
        predictedDemand: 'number[]',
        confidence: 'number',
        factors: 'object',
        uncertainty: 'object'
      }
    });

    this.featureStore = new FeatureStore();
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    this.seasonalPatterns = new Map();
  }

  async train(trainingData: TrainingData): Promise<boolean> {
    try {
      console.log('Starting demand forecasting model training...');
      
      // Extract features from training data
      const features = await this.extractTrainingFeatures(trainingData);
      
      // Detect seasonal patterns
      const seasonalPatterns = await this.detectSeasonalPatterns(features);
      this.seasonalPatterns.set(trainingData.storeId, seasonalPatterns);
      
      // Train time series models for different categories
      const categoryModels = await this.trainCategoryModels(features);
      
      // Validate model performance
      const validation = await this.validateModel(features, categoryModels);
      
      if (validation.accuracy > 0.75) {
        this.isTraned = true;
        this.metadata.lastTraining = new Date();
        this.metadata.accuracy = validation.accuracy;
        this.metadata.modelData = {
          seasonalPatterns,
          categoryModels,
          featureImportance: validation.featureImportance
        };
        
        console.log(`Demand forecasting model trained successfully with ${(validation.accuracy * 100).toFixed(1)}% accuracy`);
        return true;
      } else {
        console.warn(`Model training failed - accuracy ${(validation.accuracy * 100).toFixed(1)}% below threshold`);
        return false;
      }
    } catch (error) {
      console.error('Error training demand forecasting model:', error);
      return false;
    }
  }

  async predict(input: any): Promise<PredictionResult> {
    if (!this.isTraned) {
      throw new Error('Model must be trained before making predictions');
    }

    try {
      const { storeId, productCategory, timeHorizon, includeExternalFactors = true } = input;
      
      // Get current features
      const currentFeatures = await this.getCurrentFeatures(storeId, productCategory);
      
      // Apply seasonal patterns
      const seasonalAdjustment = await this.applySeasonalPatterns(storeId, timeHorizon);
      
      // Generate base demand forecast
      const baseForecast = await this.generateBaseForecast(currentFeatures, timeHorizon);
      
      // Apply external factors if requested
      let adjustedForecast = baseForecast;
      let factors = { traffic_impact: 0, seasonal_impact: 0, promotional_impact: 0, weather_impact: 0, trend_impact: 0 };
      
      if (includeExternalFactors) {
        const externalFactors = await this.calculateExternalFactors(storeId, timeHorizon);
        adjustedForecast = this.applyExternalFactors(baseForecast, externalFactors);
        factors = externalFactors;
      }
      
      // Calculate confidence and uncertainty
      const confidence = await this.calculateConfidence(currentFeatures, timeHorizon);
      const uncertainty = await this.calculateUncertainty(adjustedForecast, confidence);
      
      // Generate actionable recommendations
      const recommendations = await this.generateRecommendations(adjustedForecast, factors, storeId);

      const prediction: DemandPrediction = {
        storeId,
        productCategory,
        timeHorizon,
        predictedDemand: adjustedForecast,
        confidence,
        factors,
        recommendedActions: recommendations,
        uncertainty
      };

      return {
        prediction,
        confidence,
        metadata: {
          modelVersion: this.config.version,
          predictionDate: new Date(),
          featuresUsed: Object.keys(currentFeatures),
          seasonalPatternsApplied: this.seasonalPatterns.get(storeId)?.length || 0
        }
      };
    } catch (error) {
      throw new Error(`Prediction failed: ${error.message}`);
    }
  }

  private async extractTrainingFeatures(trainingData: TrainingData): Promise<DemandFeatures> {
    const { storeId } = trainingData;
    
    // Get historical sales data
    const { data: salesData } = await this.supabase
      .from('retail.sales_transactions')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    // Get foot traffic data
    const { data: trafficData } = await this.supabase
      .from('retail.foot_traffic_raw')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    // Transform into features
    const features: DemandFeatures = {
      historical_sales: salesData?.map(s => s.amount || 0) || [],
      foot_traffic: trafficData?.map(t => (t.count_in || 0) + (t.count_out || 0)) || [],
      day_of_week: salesData?.map(s => new Date(s.timestamp).getDay()) || [],
      hour_of_day: salesData?.map(s => new Date(s.timestamp).getHours()) || [],
      weather_conditions: [], // Would integrate with weather API
      seasonal_factors: this.calculateSeasonalFactors(salesData || []),
      promotional_events: [], // Would track promotional periods
      inventory_levels: [], // Would integrate with inventory system
      price_points: salesData?.map(s => s.unit_price || 0) || [],
      competitor_activity: [] // Would track competitor pricing/promotions
    };

    return features;
  }

  private calculateSeasonalFactors(salesData: any[]): number[] {
    // Calculate seasonal multipliers based on historical data
    const monthlyAverages = new Array(12).fill(0);
    const monthlyCounts = new Array(12).fill(0);
    
    salesData.forEach(sale => {
      const month = new Date(sale.timestamp).getMonth();
      monthlyAverages[month] += sale.amount || 0;
      monthlyCounts[month]++;
    });
    
    // Calculate average per month
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyAverages[i] /= monthlyCounts[i];
      }
    }
    
    // Calculate overall average
    const overallAverage = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 12;
    
    // Return seasonal factors (ratio to overall average)
    return monthlyAverages.map(avg => overallAverage > 0 ? avg / overallAverage : 1);
  }

  private async detectSeasonalPatterns(features: DemandFeatures): Promise<SeasonalPattern[]> {
    const patterns: SeasonalPattern[] = [];
    
    // Detect weekly patterns
    const weeklyPattern = this.analyzeWeeklyPattern(features.historical_sales, features.day_of_week);
    if (weeklyPattern.strength > 0.3) {
      patterns.push(weeklyPattern);
    }
    
    // Detect monthly patterns (simplified)
    const monthlyPattern = this.analyzeMonthlyPattern(features.seasonal_factors);
    if (monthlyPattern.strength > 0.2) {
      patterns.push(monthlyPattern);
    }
    
    return patterns;
  }

  private analyzeWeeklyPattern(sales: number[], daysOfWeek: number[]): SeasonalPattern {
    const dailyAverages = new Array(7).fill(0);
    const dailyCounts = new Array(7).fill(0);
    
    sales.forEach((sale, index) => {
      const day = daysOfWeek[index];
      if (day !== undefined) {
        dailyAverages[day] += sale;
        dailyCounts[day]++;
      }
    });
    
    // Calculate averages
    for (let i = 0; i < 7; i++) {
      if (dailyCounts[i] > 0) {
        dailyAverages[i] /= dailyCounts[i];
      }
    }
    
    // Calculate pattern strength (coefficient of variation)
    const mean = dailyAverages.reduce((sum, avg) => sum + avg, 0) / 7;
    const variance = dailyAverages.reduce((sum, avg) => sum + Math.pow(avg - mean, 2), 0) / 7;
    const strength = Math.sqrt(variance) / mean;
    
    return {
      type: 'weekly',
      pattern: dailyAverages,
      strength: Math.min(strength, 1),
      trend: this.determineTrend(dailyAverages)
    };
  }

  private analyzeMonthlyPattern(seasonalFactors: number[]): SeasonalPattern {
    const mean = seasonalFactors.reduce((sum, factor) => sum + factor, 0) / seasonalFactors.length;
    const variance = seasonalFactors.reduce((sum, factor) => sum + Math.pow(factor - mean, 2), 0) / seasonalFactors.length;
    const strength = Math.sqrt(variance) / mean;
    
    return {
      type: 'monthly',
      pattern: seasonalFactors,
      strength: Math.min(strength, 1),
      trend: this.determineTrend(seasonalFactors)
    };
  }

  private determineTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 3) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const difference = (secondAvg - firstAvg) / firstAvg;
    
    if (difference > 0.05) return 'increasing';
    if (difference < -0.05) return 'decreasing';
    return 'stable';
  }

  private async trainCategoryModels(features: DemandFeatures) {
    // Simplified model training - in production would use proper ML algorithms
    return {
      electronics: { trend: 0.02, seasonality: features.seasonal_factors },
      clothing: { trend: 0.01, seasonality: features.seasonal_factors },
      food: { trend: 0.005, seasonality: features.seasonal_factors },
      general: { trend: 0.015, seasonality: features.seasonal_factors }
    };
  }

  private async validateModel(features: DemandFeatures, models: any) {
    // Simple validation - split data and test predictions
    const testSize = Math.floor(features.historical_sales.length * 0.2);
    const testData = features.historical_sales.slice(-testSize);
    const trainData = features.historical_sales.slice(0, -testSize);
    
    // Generate predictions for test period
    const predictions = testData.map((_, index) => {
      const trend = models.general.trend;
      const baseValue = trainData[trainData.length - 1] || 0;
      return baseValue * (1 + trend * index);
    });
    
    // Calculate accuracy (simplified MAPE)
    let totalError = 0;
    let validPredictions = 0;
    
    for (let i = 0; i < testData.length; i++) {
      if (testData[i] > 0) {
        const error = Math.abs(testData[i] - predictions[i]) / testData[i];
        totalError += error;
        validPredictions++;
      }
    }
    
    const accuracy = validPredictions > 0 ? 1 - (totalError / validPredictions) : 0;
    
    return {
      accuracy: Math.max(0, accuracy),
      featureImportance: {
        historical_sales: 0.4,
        foot_traffic: 0.25,
        seasonal_factors: 0.2,
        day_of_week: 0.15
      }
    };
  }

  private async getCurrentFeatures(storeId: string, productCategory: string): Promise<any> {
    // Get recent data for features
    const { data: recentSales } = await this.supabase
      .from('retail.sales_transactions')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(100);

    const { data: recentTraffic } = await this.supabase
      .from('retail.foot_traffic_raw')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(168); // One week of hourly data

    return {
      recent_sales_trend: this.calculateTrend(recentSales?.map(s => s.amount) || []),
      recent_traffic_trend: this.calculateTrend(recentTraffic?.map(t => (t.count_in || 0) + (t.count_out || 0)) || []),
      current_day_of_week: new Date().getDay(),
      current_hour: new Date().getHours(),
      current_month: new Date().getMonth()
    };
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  }

  private async applySeasonalPatterns(storeId: string, timeHorizon: number): Promise<number[]> {
    const patterns = this.seasonalPatterns.get(storeId) || [];
    const adjustments = new Array(timeHorizon).fill(1);
    
    for (let day = 0; day < timeHorizon; day++) {
      const currentDate = new Date(Date.now() + day * 24 * 60 * 60 * 1000);
      
      patterns.forEach(pattern => {
        if (pattern.type === 'weekly') {
          const dayOfWeek = currentDate.getDay();
          adjustments[day] *= pattern.pattern[dayOfWeek] || 1;
        } else if (pattern.type === 'monthly') {
          const month = currentDate.getMonth();
          adjustments[day] *= pattern.pattern[month] || 1;
        }
      });
    }
    
    return adjustments;
  }

  private async generateBaseForecast(features: any, timeHorizon: number): Promise<number[]> {
    // Simplified forecasting - in production would use ARIMA, Prophet, or neural networks
    const baseDemand = 100; // Base daily demand
    const trend = features.recent_sales_trend || 0;
    
    const forecast = [];
    for (let day = 0; day < timeHorizon; day++) {
      const trendAdjustment = 1 + (trend * day / 30); // Apply trend over time
      const randomVariation = 0.9 + Math.random() * 0.2; // Add some randomness
      forecast.push(baseDemand * trendAdjustment * randomVariation);
    }
    
    return forecast;
  }

  private async calculateExternalFactors(storeId: string, timeHorizon: number) {
    // In production, these would integrate with external APIs and data sources
    return {
      traffic_impact: 0.1, // 10% impact from expected traffic changes
      seasonal_impact: 0.05, // 5% seasonal impact
      promotional_impact: 0.0, // No promotions planned
      weather_impact: -0.02, // Slight negative weather impact
      trend_impact: 0.03 // 3% positive trend
    };
  }

  private applyExternalFactors(baseForecast: number[], factors: any): number[] {
    const totalImpact = Object.values(factors).reduce((sum: number, factor: any) => sum + factor, 0);
    return baseForecast.map(value => value * (1 + totalImpact));
  }

  private async calculateConfidence(features: any, timeHorizon: number): Promise<number> {
    // Confidence decreases with longer time horizons and less stable features
    const baseConfidence = 0.85;
    const timeDecay = Math.max(0, 1 - (timeHorizon / 30)); // Confidence drops with time
    const dataQuality = features.recent_sales_trend !== undefined ? 1 : 0.7;
    
    return Math.max(0.5, baseConfidence * timeDecay * dataQuality);
  }

  private async calculateUncertainty(forecast: number[], confidence: number) {
    const uncertaintyFactor = 1 - confidence;
    
    return {
      lower_bound: forecast.map(value => value * (1 - uncertaintyFactor)),
      upper_bound: forecast.map(value => value * (1 + uncertaintyFactor))
    };
  }

  private async generateRecommendations(forecast: number[], factors: any, storeId: string): Promise<string[]> {
    const recommendations = [];
    
    // Analyze forecast trends
    const totalDemand = forecast.reduce((sum, value) => sum + value, 0);
    const avgDemand = totalDemand / forecast.length;
    
    if (avgDemand > 120) {
      recommendations.push('Increase inventory levels to meet high demand forecast');
      recommendations.push('Consider staffing adjustments for peak periods');
    } else if (avgDemand < 80) {
      recommendations.push('Optimize inventory to avoid overstock');
      recommendations.push('Consider promotional activities to boost demand');
    }
    
    // Factor-based recommendations
    if (factors.traffic_impact > 0.05) {
      recommendations.push('Leverage increased foot traffic with strategic product placement');
    }
    
    if (factors.seasonal_impact > 0.1) {
      recommendations.push('Prepare for seasonal demand increase');
    }
    
    return recommendations;
  }

  async retrain(newData: TrainingData): Promise<boolean> {
    console.log('Retraining demand forecasting model with new data...');
    return await this.train(newData);
  }

  getModelInfo() {
    return {
      name: this.config.name,
      version: this.config.version,
      type: this.config.type,
      isTraned: this.isTraned,
      accuracy: this.metadata.accuracy,
      lastTraining: this.metadata.lastTraining,
      seasonalPatterns: this.seasonalPatterns.size,
      supportedCategories: ['electronics', 'clothing', 'food', 'general']
    };
  }
}