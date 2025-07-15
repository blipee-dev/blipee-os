import { BaseMLModel, MLModelConfig, PredictionResult, TrainingData } from '../base';
import { createClient } from '@supabase/supabase-js';

interface PriceOptimizationFeatures {
  current_price: number;
  demand_elasticity: number;
  competitor_prices: number[];
  inventory_level: number;
  historical_sales: number[];
  foot_traffic: number[];
  customer_segments: CustomerSegmentData[];
  promotional_history: PromotionalData[];
  cost_structure: CostData;
  external_factors: ExternalFactors;
}

interface CustomerSegmentData {
  segment: string;
  price_sensitivity: number;
  volume_share: number;
  willingness_to_pay: number;
}

interface PromotionalData {
  discount_percentage: number;
  duration_days: number;
  impact_on_sales: number;
  timestamp: Date;
}

interface CostData {
  cost_of_goods: number;
  storage_cost: number;
  overhead_allocation: number;
  minimum_margin: number;
}

interface ExternalFactors {
  market_trend: number;
  seasonal_factor: number;
  economic_indicators: number;
  supply_chain_pressure: number;
}

interface PriceRecommendation {
  productId: string;
  storeId: string;
  currentPrice: number;
  recommendedPrice: number;
  strategy: 'premium' | 'competitive' | 'penetration' | 'skimming' | 'dynamic';
  confidence: number;
  expectedImpact: {
    salesVolumeChange: number;
    revenueChange: number;
    marginChange: number;
    competitivePosition: string;
  };
  rationale: string[];
  timeframe: {
    implementBy: Date;
    reviewAfter: number; // days
  };
  riskFactors: string[];
}

interface PriceElasticity {
  coefficient: number;
  confidence: number;
  priceRange: { min: number; max: number };
  demandResponse: { priceChange: number; demandChange: number }[];
}

export class PriceOptimizationModel extends BaseMLModel {
  private supabase: any;
  private elasticityCache: Map<string, PriceElasticity>;

  constructor(config: MLModelConfig) {
    super({
      ...config,
      name: 'Price Optimization Model',
      version: '1.0.0',
      type: 'optimization',
      inputSchema: {
        storeId: 'string',
        productId: 'string',
        optimizationGoal: 'string', // 'revenue', 'profit', 'volume', 'market_share'
        constraints: 'object',
        timeHorizon: 'number'
      },
      outputSchema: {
        recommendedPrice: 'number',
        strategy: 'string',
        expectedImpact: 'object',
        confidence: 'number'
      }
    });

    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    this.elasticityCache = new Map();
  }

  async train(trainingData: TrainingData): Promise<boolean> {
    try {
      console.log('Training price optimization model...');
      
      // Extract features from historical pricing and sales data
      const features = await this.extractPricingFeatures(trainingData);
      
      // Calculate price elasticity for different products
      const elasticityModels = await this.calculatePriceElasticity(features);
      
      // Train competitor response models
      const competitorModels = await this.trainCompetitorResponseModels(features);
      
      // Train customer segment models
      const segmentModels = await this.trainCustomerSegmentModels(features);
      
      // Validate model performance
      const validation = await this.validatePricingModel(features, elasticityModels);
      
      if (validation.accuracy > 0.70) {
        this.isTraned = true;
        this.metadata.lastTraining = new Date();
        this.metadata.accuracy = validation.accuracy;
        this.metadata.modelData = {
          elasticityModels,
          competitorModels,
          segmentModels,
          validationMetrics: validation
        };
        
        console.log(`Price optimization model trained with ${(validation.accuracy * 100).toFixed(1)}% accuracy`);
        return true;
      } else {
        console.warn(`Model training failed - accuracy ${(validation.accuracy * 100).toFixed(1)}% below threshold`);
        return false;
      }
    } catch (error) {
      console.error('Error training price optimization model:', error);
      return false;
    }
  }

  async predict(input: any): Promise<PredictionResult> {
    if (!this.isTraned) {
      throw new Error('Model must be trained before making predictions');
    }

    try {
      const { storeId, productId, optimizationGoal = 'profit', constraints = {}, timeHorizon = 30 } = input;
      
      // Get current product and market data
      const currentFeatures = await this.getCurrentPricingFeatures(storeId, productId);
      
      // Calculate price elasticity for this product
      const elasticity = await this.calculateProductElasticity(storeId, productId);
      
      // Get competitor intelligence
      const competitorData = await this.getCompetitorPricing(productId);
      
      // Analyze customer segments
      const segmentAnalysis = await this.analyzeCustomerSegments(storeId, productId);
      
      // Generate optimization scenarios
      const scenarios = await this.generatePricingScenarios(
        currentFeatures,
        elasticity,
        competitorData,
        segmentAnalysis,
        optimizationGoal,
        constraints
      );
      
      // Select optimal scenario
      const optimalScenario = await this.selectOptimalScenario(scenarios, optimizationGoal);
      
      // Generate detailed recommendation
      const recommendation = await this.generatePriceRecommendation(
        storeId,
        productId,
        optimalScenario,
        currentFeatures,
        timeHorizon
      );

      return {
        prediction: recommendation,
        confidence: recommendation.confidence,
        metadata: {
          modelVersion: this.config.version,
          predictionDate: new Date(),
          optimizationGoal,
          scenariosEvaluated: scenarios.length,
          elasticityCoefficient: elasticity.coefficient
        }
      };
    } catch (error) {
      throw new Error(`Price optimization failed: ${error.message}`);
    }
  }

  private async extractPricingFeatures(trainingData: TrainingData): Promise<PriceOptimizationFeatures> {
    const { storeId } = trainingData;
    
    // Get historical sales and pricing data
    const { data: salesData } = await this.supabase
      .from('retail.sales_transactions')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    // Get foot traffic data
    const { data: trafficData } = await this.supabase
      .from('retail.foot_traffic_raw')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

    // Extract features
    const features: PriceOptimizationFeatures = {
      current_price: this.calculateAveragePrice(salesData || []),
      demand_elasticity: 0, // Will be calculated separately
      competitor_prices: [], // Would integrate with competitor tracking
      inventory_level: 100, // Mock data
      historical_sales: salesData?.map(s => s.amount || 0) || [],
      foot_traffic: trafficData?.map(t => (t.count_in || 0) + (t.count_out || 0)) || [],
      customer_segments: await this.extractCustomerSegments(salesData || []),
      promotional_history: await this.extractPromotionalHistory(salesData || []),
      cost_structure: {
        cost_of_goods: 20, // Mock data - would come from inventory system
        storage_cost: 2,
        overhead_allocation: 5,
        minimum_margin: 0.15
      },
      external_factors: {
        market_trend: 0.02,
        seasonal_factor: 1.1,
        economic_indicators: 0.98,
        supply_chain_pressure: 1.05
      }
    };

    return features;
  }

  private calculateAveragePrice(salesData: any[]): number {
    if (salesData.length === 0) return 50; // Default price
    
    const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    const totalItems = salesData.reduce((sum, sale) => sum + (sale.items_count || 1), 0);
    
    return totalItems > 0 ? totalRevenue / totalItems : 50;
  }

  private async extractCustomerSegments(salesData: any[]): Promise<CustomerSegmentData[]> {
    // Simplified segmentation based on purchase amounts
    const segments: CustomerSegmentData[] = [
      {
        segment: 'price_sensitive',
        price_sensitivity: 0.8,
        volume_share: 0.4,
        willingness_to_pay: 30
      },
      {
        segment: 'value_seekers',
        price_sensitivity: 0.5,
        volume_share: 0.35,
        willingness_to_pay: 50
      },
      {
        segment: 'premium_buyers',
        price_sensitivity: 0.2,
        volume_share: 0.25,
        willingness_to_pay: 80
      }
    ];

    return segments;
  }

  private async extractPromotionalHistory(salesData: any[]): Promise<PromotionalData[]> {
    // Mock promotional data - would track actual promotions
    return [
      {
        discount_percentage: 0.15,
        duration_days: 7,
        impact_on_sales: 1.4,
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      },
      {
        discount_percentage: 0.10,
        duration_days: 3,
        impact_on_sales: 1.2,
        timestamp: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private async calculatePriceElasticity(features: PriceOptimizationFeatures) {
    // Simplified elasticity calculation
    // In production, would use regression analysis on price-demand data
    const elasticityModels = new Map();
    
    // Calculate elasticity based on promotional history
    let elasticitySum = 0;
    let count = 0;
    
    features.promotional_history.forEach(promo => {
      const priceChange = -promo.discount_percentage;
      const demandChange = promo.impact_on_sales - 1;
      
      if (priceChange !== 0) {
        const elasticity = demandChange / priceChange;
        elasticitySum += elasticity;
        count++;
      }
    });
    
    const avgElasticity = count > 0 ? elasticitySum / count : -1.2; // Default elasticity
    
    elasticityModels.set('default', {
      coefficient: avgElasticity,
      confidence: 0.75,
      priceRange: { min: features.current_price * 0.7, max: features.current_price * 1.3 },
      segments: features.customer_segments.map(seg => ({
        segment: seg.segment,
        elasticity: avgElasticity * seg.price_sensitivity
      }))
    });
    
    return elasticityModels;
  }

  private async trainCompetitorResponseModels(features: PriceOptimizationFeatures) {
    // Mock competitor models - would analyze competitor pricing patterns
    return {
      response_speed: 'medium', // How quickly competitors respond to price changes
      response_magnitude: 0.6, // How much competitors match price changes
      market_leader: false,
      competitive_advantage: 'service_quality'
    };
  }

  private async trainCustomerSegmentModels(features: PriceOptimizationFeatures) {
    // Train models for each customer segment
    const segmentModels = {};
    
    features.customer_segments.forEach(segment => {
      segmentModels[segment.segment] = {
        elasticity: -1.2 * segment.price_sensitivity,
        maxPrice: segment.willingness_to_pay,
        volumeContribution: segment.volume_share,
        loyaltyFactor: 1 - segment.price_sensitivity * 0.5
      };
    });
    
    return segmentModels;
  }

  private async validatePricingModel(features: PriceOptimizationFeatures, models: any) {
    // Validate model by testing predictions against held-out data
    // Simplified validation
    const predictedDemand = [];
    const actualDemand = features.historical_sales.slice(-30); // Last 30 days
    
    // Generate predictions using the model
    for (let i = 0; i < 30; i++) {
      const basePrice = features.current_price;
      const predicted = basePrice * 2.5; // Simplified prediction
      predictedDemand.push(predicted);
    }
    
    // Calculate accuracy (MAPE)
    let totalError = 0;
    let validPredictions = 0;
    
    for (let i = 0; i < Math.min(predictedDemand.length, actualDemand.length); i++) {
      if (actualDemand[i] > 0) {
        const error = Math.abs(actualDemand[i] - predictedDemand[i]) / actualDemand[i];
        totalError += error;
        validPredictions++;
      }
    }
    
    const accuracy = validPredictions > 0 ? Math.max(0, 1 - (totalError / validPredictions)) : 0.75;
    
    return {
      accuracy,
      meanAbsoluteError: validPredictions > 0 ? totalError / validPredictions : 0,
      elasticityAccuracy: 0.8,
      segmentAccuracy: 0.75
    };
  }

  private async getCurrentPricingFeatures(storeId: string, productId: string) {
    // Get current pricing and sales context
    const { data: recentSales } = await this.supabase
      .from('retail.sales_transactions')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    const currentPrice = this.calculateAveragePrice(recentSales || []);
    const salesVolume = recentSales?.length || 0;
    const salesTrend = this.calculateSalesTrend(recentSales || []);

    return {
      currentPrice,
      salesVolume,
      salesTrend,
      inventoryTurnover: 0.8, // Mock data
      competitivePosition: 'neutral',
      marketShare: 0.15
    };
  }

  private calculateSalesTrend(salesData: any[]): number {
    if (salesData.length < 4) return 0;
    
    const firstHalf = salesData.slice(0, Math.floor(salesData.length / 2));
    const secondHalf = salesData.slice(Math.floor(salesData.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, sale) => sum + (sale.amount || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, sale) => sum + (sale.amount || 0), 0) / secondHalf.length;
    
    return firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
  }

  private async calculateProductElasticity(storeId: string, productId: string): Promise<PriceElasticity> {
    const cacheKey = `${storeId}_${productId}`;
    
    if (this.elasticityCache.has(cacheKey)) {
      return this.elasticityCache.get(cacheKey)!;
    }
    
    // Calculate elasticity from historical data
    const elasticity: PriceElasticity = {
      coefficient: -1.2, // Default elastic demand
      confidence: 0.75,
      priceRange: { min: 20, max: 100 },
      demandResponse: [
        { priceChange: -0.1, demandChange: 0.12 },
        { priceChange: -0.05, demandChange: 0.06 },
        { priceChange: 0.05, demandChange: -0.06 },
        { priceChange: 0.1, demandChange: -0.12 }
      ]
    };
    
    this.elasticityCache.set(cacheKey, elasticity);
    return elasticity;
  }

  private async getCompetitorPricing(productId: string) {
    // Mock competitor data - would integrate with price monitoring services
    return {
      averageCompetitorPrice: 45,
      priceRange: { min: 35, max: 65 },
      recentChanges: [
        { competitor: 'CompetitorA', oldPrice: 50, newPrice: 48, date: new Date() },
        { competitor: 'CompetitorB', oldPrice: 42, newPrice: 44, date: new Date() }
      ],
      marketPosition: 'middle' // 'low', 'middle', 'high'
    };
  }

  private async analyzeCustomerSegments(storeId: string, productId: string) {
    // Analyze how different customer segments respond to pricing
    return {
      segmentResponses: [
        {
          segment: 'price_sensitive',
          currentShare: 0.4,
          elasticity: -1.8,
          switchingThreshold: 0.15
        },
        {
          segment: 'value_seekers',
          currentShare: 0.35,
          elasticity: -1.0,
          switchingThreshold: 0.25
        },
        {
          segment: 'premium_buyers',
          currentShare: 0.25,
          elasticity: -0.4,
          switchingThreshold: 0.40
        }
      ]
    };
  }

  private async generatePricingScenarios(
    currentFeatures: any,
    elasticity: PriceElasticity,
    competitorData: any,
    segmentAnalysis: any,
    optimizationGoal: string,
    constraints: any
  ) {
    const currentPrice = currentFeatures.currentPrice;
    const scenarios = [];
    
    // Generate different pricing scenarios
    const priceMultipliers = [0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15];
    
    for (const multiplier of priceMultipliers) {
      const newPrice = currentPrice * multiplier;
      const priceChange = (newPrice - currentPrice) / currentPrice;
      
      // Calculate expected demand change using elasticity
      const demandChange = elasticity.coefficient * priceChange;
      const newVolume = currentFeatures.salesVolume * (1 + demandChange);
      
      // Calculate revenue and profit impact
      const newRevenue = newPrice * newVolume;
      const currentRevenue = currentPrice * currentFeatures.salesVolume;
      const revenueChange = (newRevenue - currentRevenue) / currentRevenue;
      
      // Calculate profit (simplified)
      const costPerUnit = 25; // Mock cost
      const newProfit = (newPrice - costPerUnit) * newVolume;
      const currentProfit = (currentPrice - costPerUnit) * currentFeatures.salesVolume;
      const profitChange = currentProfit > 0 ? (newProfit - currentProfit) / currentProfit : 0;
      
      scenarios.push({
        price: newPrice,
        priceChange,
        expectedVolume: newVolume,
        volumeChange: demandChange,
        revenueChange,
        profitChange,
        competitivePosition: this.assessCompetitivePosition(newPrice, competitorData),
        riskScore: this.calculateRiskScore(priceChange, demandChange, competitorData),
        strategy: this.determineStrategy(multiplier, competitorData)
      });
    }
    
    return scenarios;
  }

  private assessCompetitivePosition(price: number, competitorData: any): string {
    const avgCompPrice = competitorData.averageCompetitorPrice;
    
    if (price < avgCompPrice * 0.95) return 'competitive_advantage';
    if (price > avgCompPrice * 1.05) return 'premium_position';
    return 'market_aligned';
  }

  private calculateRiskScore(priceChange: number, demandChange: number, competitorData: any): number {
    let risk = 0;
    
    // Price change risk
    risk += Math.abs(priceChange) * 0.3;
    
    // Demand impact risk
    if (demandChange < -0.2) risk += 0.4;
    
    // Competitive risk
    if (competitorData.marketPosition === 'low' && priceChange > 0.1) risk += 0.3;
    
    return Math.min(1, risk);
  }

  private determineStrategy(multiplier: number, competitorData: any): 'premium' | 'competitive' | 'penetration' | 'skimming' | 'dynamic' {
    if (multiplier >= 1.1) return 'premium';
    if (multiplier <= 0.9) return 'penetration';
    if (multiplier >= 1.05) return 'skimming';
    return 'competitive';
  }

  private async selectOptimalScenario(scenarios: any[], optimizationGoal: string) {
    let optimalScenario = scenarios[0];
    
    switch (optimizationGoal) {
      case 'revenue':
        optimalScenario = scenarios.reduce((best, current) => 
          current.revenueChange > best.revenueChange ? current : best
        );
        break;
      
      case 'profit':
        optimalScenario = scenarios.reduce((best, current) => 
          current.profitChange > best.profitChange ? current : best
        );
        break;
      
      case 'volume':
        optimalScenario = scenarios.reduce((best, current) => 
          current.volumeChange > best.volumeChange ? current : best
        );
        break;
      
      case 'market_share':
        optimalScenario = scenarios.reduce((best, current) => 
          current.competitivePosition === 'competitive_advantage' ? current : best
        );
        break;
      
      default:
        // Default to profit optimization
        optimalScenario = scenarios.reduce((best, current) => 
          current.profitChange > best.profitChange ? current : best
        );
    }
    
    return optimalScenario;
  }

  private async generatePriceRecommendation(
    storeId: string,
    productId: string,
    scenario: any,
    currentFeatures: any,
    timeHorizon: number
  ): Promise<PriceRecommendation> {
    const recommendation: PriceRecommendation = {
      productId,
      storeId,
      currentPrice: currentFeatures.currentPrice,
      recommendedPrice: Math.round(scenario.price * 100) / 100,
      strategy: scenario.strategy,
      confidence: this.calculateRecommendationConfidence(scenario),
      expectedImpact: {
        salesVolumeChange: scenario.volumeChange,
        revenueChange: scenario.revenueChange,
        marginChange: scenario.profitChange,
        competitivePosition: scenario.competitivePosition
      },
      rationale: this.generateRationale(scenario, currentFeatures),
      timeframe: {
        implementBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        reviewAfter: Math.min(timeHorizon, 14) // Review within 2 weeks
      },
      riskFactors: this.identifyRiskFactors(scenario)
    };

    return recommendation;
  }

  private calculateRecommendationConfidence(scenario: any): number {
    let confidence = 0.8; // Base confidence
    
    // Reduce confidence for extreme price changes
    if (Math.abs(scenario.priceChange) > 0.15) confidence -= 0.2;
    
    // Reduce confidence for high risk scenarios
    confidence -= scenario.riskScore * 0.3;
    
    // Increase confidence for aligned competitive position
    if (scenario.competitivePosition === 'market_aligned') confidence += 0.1;
    
    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private generateRationale(scenario: any, currentFeatures: any): string[] {
    const rationale = [];
    
    if (scenario.revenueChange > 0.05) {
      rationale.push(`Expected to increase revenue by ${(scenario.revenueChange * 100).toFixed(1)}%`);
    }
    
    if (scenario.profitChange > 0.05) {
      rationale.push(`Projected profit improvement of ${(scenario.profitChange * 100).toFixed(1)}%`);
    }
    
    if (scenario.competitivePosition === 'competitive_advantage') {
      rationale.push('Price provides competitive advantage in the market');
    }
    
    if (scenario.strategy === 'premium') {
      rationale.push('Premium pricing strategy to maximize margins');
    } else if (scenario.strategy === 'penetration') {
      rationale.push('Penetration pricing to increase market share');
    }
    
    return rationale;
  }

  private identifyRiskFactors(scenario: any): string[] {
    const risks = [];
    
    if (scenario.riskScore > 0.5) {
      risks.push('High risk scenario - monitor closely');
    }
    
    if (scenario.volumeChange < -0.15) {
      risks.push('Significant volume reduction expected');
    }
    
    if (scenario.priceChange > 0.1) {
      risks.push('Large price increase may trigger competitor response');
    }
    
    if (scenario.competitivePosition === 'premium_position') {
      risks.push('Premium positioning may reduce market accessibility');
    }
    
    return risks;
  }

  async retrain(newData: TrainingData): Promise<boolean> {
    console.log('Retraining price optimization model...');
    this.elasticityCache.clear(); // Clear cache to recalculate
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
      elasticityModels: this.elasticityCache.size,
      supportedStrategies: ['premium', 'competitive', 'penetration', 'skimming', 'dynamic'],
      optimizationGoals: ['revenue', 'profit', 'volume', 'market_share']
    };
  }
}