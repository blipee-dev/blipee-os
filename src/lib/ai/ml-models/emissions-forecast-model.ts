/**
 * Emissions Forecast Model - REAL ML Implementation
 *
 * Input: Historical emissions, activity data
 * Output: Future emissions with confidence intervals
 */

import { mlPipeline, MLModelConfig, MLTrainingData, MLPrediction } from './ml-pipeline';
import {
  initializeModels,
  getLoadedModels,
  predictWithLSTM
} from './load-trained-models';
import { inMemoryLSTM } from './in-memory-lstm';
import { advancedForecastEngine } from './advanced-forecast-engine';
import { spikeAwareForecast } from './spike-aware-forecast';

export interface EmissionsForecastInput {
  historicalEmissions: {
    scope1: number[]; // Direct emissions (tCO2e)
    scope2: number[]; // Indirect emissions from energy (tCO2e)
    scope3: number[]; // Other indirect emissions (tCO2e)
  };
  activityData: {
    energyConsumption: number; // kWh
    fuelConsumption: number; // liters
    productionVolume: number; // units
    transportationKm: number; // kilometers
    employeeCount: number;
  };
  externalFactors: {
    gridEmissionFactor: number; // gCO2/kWh
    fuelEmissionFactor: number; // gCO2/liter
    seasonality: 'winter' | 'spring' | 'summer' | 'fall';
    regulatoryChanges: boolean;
  };
  metadata: {
    industry: string;
    region: string;
    reportingPeriod: 'monthly' | 'quarterly' | 'annual';
  };
}

export interface EmissionsForecastPrediction extends MLPrediction {
  prediction: number[]; // Predicted total emissions for future periods
  scope1Forecast: number[];
  scope2Forecast: number[];
  scope3Forecast: number[];
  confidenceIntervals: {
    lower: number[];
    upper: number[];
    confidence: number; // e.g., 0.95 for 95% confidence
  };
  trends: {
    direction: 'increasing' | 'decreasing' | 'stable';
    rate: number; // % change per period
    drivers: string[];
  };
  targets: {
    currentTrajectory: number; // Total emissions at end of forecast
    requiredReduction: number; // % reduction needed for targets
    recommendations: string[];
  };
}

export class EmissionsForecastModel {
  private modelId = 'emissions-forecast-lstm';
  private isTraining = false;
  private lastValidationMae = 0;

  constructor() {
    console.log('🌍 Initializing Emissions Forecast Model...');
  }

  /**
   * Train the emissions forecasting model
   */
  async train(data: EmissionsForecastInput[]): Promise<void> {
    if (this.isTraining) {
      throw new Error('Model is already training');
    }

    console.log('🏃 Training Emissions Forecast Model with real data...');
    this.isTraining = true;

    try {
      // Prepare training data for LSTM
      const trainingData = this.prepareTrainingData(data);

      // Model configuration for LSTM time series forecasting
      const config: MLModelConfig = {
        modelType: 'lstm',
        inputShape: [12, 12], // 12 time steps, 12 features
        outputShape: [6], // Predict next 6 periods (scope1, scope2, scope3 for 2 periods)
        learningRate: 0.0005,
        epochs: 150,
        batchSize: 16,
        validationSplit: 0.25
      };

      // Train the model
      const metrics = await mlPipeline.trainModel(this.modelId, config, trainingData);

      this.lastValidationMae = metrics.mae || 0;

      console.log(`✅ Emissions model trained - MAE: ${this.lastValidationMae.toFixed(4)} tCO2e`);

      if (this.lastValidationMae > 5.0) {
        console.warn('⚠️ Model MAE above target (5.0 tCO2e). Consider feature engineering or more data.');
      }

    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Forecast future emissions using advanced ensemble models
   */
  async predict(input: EmissionsForecastInput): Promise<EmissionsForecastPrediction> {
    console.log('🔮 Forecasting emissions with advanced ensemble (tons)...');

    try {
      // Combine all historical emissions for total and convert kg to tons
      const totalHistorical = input.historicalEmissions.scope1.map((s1, i) =>
        (s1 + (input.historicalEmissions.scope2[i] || 0) + (input.historicalEmissions.scope3[i] || 0)) / 1000
      );

      console.log('📊 Historical data in tons (first 3):', totalHistorical.slice(0, 3).map(v => v.toFixed(1)));

      // Analyze variance to detect spike patterns (business travel)
      const mean = totalHistorical.reduce((sum, val) => sum + val, 0) / totalHistorical.length;
      const variance = totalHistorical.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totalHistorical.length;
      const coefficientOfVariation = Math.sqrt(variance) / mean;

      console.log(`📈 Data analysis: Mean=${mean.toFixed(1)}, CV=${(coefficientOfVariation * 100).toFixed(1)}%`);

      // If high variance detected (CV > 40%), use spike-aware forecasting
      if (coefficientOfVariation > 0.4) {
        console.log('🚀 High variance detected - using spike-aware forecasting for travel patterns');

        try {
          const startDate = new Date('2025-08-01');
          const spikeAwarePrediction = await spikeAwareForecast.predict(
            totalHistorical,
            12,
            startDate
          );

          console.log('✅ SPIKE-AWARE prediction completed');
          console.log(`🎯 Expected spikes: ${spikeAwarePrediction.spike_info.expected_spikes}`);
          console.log(`📅 Spike months: ${spikeAwarePrediction.spike_info.spike_months.join(', ')}`);

          return this.processEnsemblePrediction(spikeAwarePrediction, input);
        } catch (spikeError) {
          console.warn('⚠️ Spike-aware model failed, falling back to ensemble:', spikeError);
        }
      }

      // Prepare external features if available
      const externalFeatures = {
        temperature: input.externalFactors?.seasonality === 'summer' ?
          new Array(totalHistorical.length).fill(25) :
          new Array(totalHistorical.length).fill(10),
        energyPrices: new Array(totalHistorical.length).fill(input.activityData.energyConsumption || 100),
        productionVolume: new Array(totalHistorical.length).fill(input.activityData.productionVolume || 100),
        gridEmissionFactors: new Array(totalHistorical.length).fill(input.externalFactors?.gridEmissionFactor || 400)
      };

      // Use advanced ensemble forecasting
      // Start predictions from August 2025 (month after last data)
      const lastDataDate = new Date('2025-07-01'); // Last data is July 2025
      const startDate = new Date('2025-08-01'); // Start predictions from August

      const ensemblePrediction = await advancedForecastEngine.predict(
        totalHistorical,
        externalFeatures,
        12,
        startDate
      );

      console.log('✅ ENSEMBLE prediction completed with',
        Object.keys(ensemblePrediction.model_weights).length, 'models');
      console.log('🏆 Best model:', ensemblePrediction.best_model);
      console.log('📊 Trend:', ensemblePrediction.trend.direction,
        `(${ensemblePrediction.trend.rate.toFixed(1)}% per year)`);

      // Convert ensemble predictions to our format
      return this.processEnsemblePrediction(ensemblePrediction, input);

    } catch (error) {
      console.error('⚠️ Advanced ensemble failed:', error instanceof Error ? error.message : error);
      console.log('📊 Using robust LSTM fallback...');

      // Fallback to single LSTM if ensemble fails - this works well
      try {
        await inMemoryLSTM.initialize();
        const features = this.prepareSequenceData(input);
        // Convert to tons for LSTM scaler
        const allEmissionsInTons = [
          ...input.historicalEmissions.scope1.map(v => v / 1000),
          ...input.historicalEmissions.scope2.map(v => v / 1000),
          ...input.historicalEmissions.scope3.map(v => v / 1000)
        ].filter(val => val > 0);

        if (allEmissionsInTons.length > 0) {
          inMemoryLSTM.updateScaler(allEmissionsInTons);
        }

        const lstmPrediction = await inMemoryLSTM.predict(features, 12);
        return this.processLSTMPrediction(lstmPrediction, input);

      } catch (lstmError) {
        console.error('❌ All models failed:', lstmError);
        throw new Error('No ML models available for prediction');
      }
    }
  }

  /**
   * Use ML pipeline as fallback when disk models aren't available
   */
  private async useMLPipelineFallback(input: EmissionsForecastInput): Promise<EmissionsForecastPrediction> {
    // Prepare input features for LSTM (needs sequence of 12 timesteps)
    const features = this.extractFeatures(input);
    const sequence = Array(12).fill(features);

    // Try ML pipeline
    try {
      const prediction = await mlPipeline.predict(this.modelId, sequence);
      const forecastData = this.processPredictions(prediction.prediction, input);
      const confidenceIntervals = this.calculateConfidenceIntervals(prediction, input);
      const trends = this.analyzeTrends(input, forecastData);
      const targets = this.analyzeTargets(input, forecastData);

      console.log('✅ Using in-memory ML pipeline for predictions');
      return {
        prediction: forecastData.totalEmissions,
        scope1Forecast: forecastData.scope1,
        scope2Forecast: forecastData.scope2,
        scope3Forecast: forecastData.scope3,
        confidence: prediction.confidence,
        timestamp: prediction.timestamp,
        confidenceIntervals,
        trends,
        targets
      };
    } catch (error) {
      console.log('⚠️  ML pipeline not ready, using simple forecast...');
      // Simple fallback prediction
      return this.simpleForecast(input);
    }
  }

  /**
   * Prepare sequence data for LSTM prediction
   */
  private prepareSequenceData(input: EmissionsForecastInput): number[][] {
    const sequence: number[][] = [];
    const historyLength = Math.min(12, input.historicalEmissions.scope1.length);

    for (let i = 0; i < historyLength; i++) {
      const features = [
        (input.historicalEmissions.scope1[i] || 0) / 1000, // Convert kg to tons
        (input.historicalEmissions.scope2[i] || 0) / 1000, // Convert kg to tons
        (input.historicalEmissions.scope3[i] || 0) / 1000, // Convert kg to tons
        input.activityData.energyConsumption || 0,
        input.activityData.fuelConsumption || 0,
        input.activityData.productionVolume || 0,
        input.externalFactors.gridEmissionFactor || 0,
        this.encodeSeasonality(input.externalFactors.seasonality)
      ];
      sequence.push(features);
    }

    // Pad sequence if needed
    while (sequence.length < 12) {
      sequence.unshift(sequence[0] || Array(8).fill(0));
    }

    return sequence;
  }

  /**
   * Prepare training features from input
   */
  private prepareTrainingFeatures(input: EmissionsForecastInput): number[][] {
    const features: number[][] = [];

    for (let i = 0; i < input.historicalEmissions.scope1.length; i++) {
      features.push([
        input.historicalEmissions.scope1[i] || 0,
        input.historicalEmissions.scope2[i] || 0,
        input.historicalEmissions.scope3[i] || 0,
        input.activityData.energyConsumption || 0,
        input.activityData.fuelConsumption || 0,
        input.activityData.productionVolume || 0,
        input.externalFactors.gridEmissionFactor || 0,
        Math.random() // Add some variation for seasonality
      ]);
    }

    return features;
  }

  /**
   * Process ensemble predictions into our format
   */
  private processEnsemblePrediction(ensemble: any, input: EmissionsForecastInput): EmissionsForecastPrediction {
    console.log('🔍 Processing ensemble prediction:', {
      ensembleKeys: Object.keys(ensemble),
      predictionsLength: ensemble.predictions?.length,
      firstPrediction: ensemble.predictions?.[0]
    });

    // Extract predictions array (values are already in tons from the models)
    const predictions = ensemble.predictions.map((p: any) => p.predicted);

    console.log('📊 Raw predictions in tons (first 3):', predictions.slice(0, 3));

    // Calculate scope breakdowns (proportional to historical) - convert kg to tons for ratios
    const totalCurrentKg = input.historicalEmissions.scope1[0] +
                          input.historicalEmissions.scope2[0] +
                          input.historicalEmissions.scope3[0];

    // Only use fallback ratios if we have no historical data at all
    // If a scope has 0 emissions, keep it at 0 (don't use fallback)
    let scope1Ratio = 0;
    let scope2Ratio = 0;
    let scope3Ratio = 0;

    if (totalCurrentKg > 0) {
      // Calculate actual ratios from historical data
      scope1Ratio = input.historicalEmissions.scope1[0] / totalCurrentKg;
      scope2Ratio = input.historicalEmissions.scope2[0] / totalCurrentKg;
      scope3Ratio = input.historicalEmissions.scope3[0] / totalCurrentKg;
    } else {
      // Only use defaults if we have absolutely no data
      scope1Ratio = 0.3;
      scope2Ratio = 0.4;
      scope3Ratio = 0.3;
    }

    const scope1Forecast = predictions.map((p: number) => p * scope1Ratio);
    const scope2Forecast = predictions.map((p: number) => p * scope2Ratio);
    const scope3Forecast = predictions.map((p: number) => p * scope3Ratio);

    // Extract confidence intervals
    const confidenceIntervals = {
      lower: ensemble.predictions.map((p: any) => p.lower_bound),
      upper: ensemble.predictions.map((p: any) => p.upper_bound),
      confidence: ensemble.predictions[0]?.confidence || 0.85
    };

    // Calculate targets based on SBTi (42% reduction by 2030)
    const yearsToTarget = 2030 - new Date().getFullYear();
    const requiredAnnualReduction = 42 / yearsToTarget;
    const currentTrajectory = predictions[predictions.length - 1];

    return {
      prediction: predictions,
      predictions: ensemble.predictions, // Include detailed predictions
      scope1Forecast,
      scope2Forecast,
      scope3Forecast,
      confidence: ensemble.predictions[0]?.confidence || 0.85,
      timestamp: new Date(),
      confidenceIntervals,
      trends: {
        direction: ensemble.trend.direction,
        rate: ensemble.trend.rate,
        drivers: [
          `Best Model: ${ensemble.best_model}`,
          `Seasonality detected: ${ensemble.seasonality?.monthly?.some((s: number) => Math.abs(s - 1) > 0.1) ? 'Yes' : 'No'}`,
          `Trend acceleration: ${ensemble.trend?.acceleration > 0 ? 'Increasing' : 'Decreasing'}`
        ]
      },
      targets: {
        currentTrajectory,
        requiredReduction: requiredAnnualReduction,
        recommendations: this.generateRecommendations(ensemble.trend, currentTrajectory)
      },
      model: ensemble.best_model,
      model_weights: ensemble.model_weights,
      features_importance: ensemble.feature_importance
    };
  }

  /**
   * Generate recommendations based on predictions
   */
  private generateRecommendations(trend: any, trajectory: number): string[] {
    const recommendations = [];

    if (trend.direction === 'increasing') {
      recommendations.push('⚠️ Emissions trending up - immediate action required');
      recommendations.push('🎯 Focus on energy efficiency improvements');
      recommendations.push('🔄 Review and optimize production schedules');
    } else if (trend.direction === 'decreasing') {
      recommendations.push('✅ Good progress on emissions reduction');
      recommendations.push('📊 Maintain current initiatives');
      recommendations.push('🚀 Explore additional reduction opportunities');
    } else {
      recommendations.push('📈 Emissions stable - need acceleration for targets');
      recommendations.push('💡 Consider renewable energy transition');
      recommendations.push('🏭 Evaluate process optimization opportunities');
    }

    return recommendations;
  }

  /**
   * Process LSTM prediction into our format
   */
  private processLSTMPrediction(lstmPrediction: any, input: EmissionsForecastInput): EmissionsForecastPrediction {
    console.log('🔄 Processing LSTM prediction format:', {
      hasLstmPredictions: !!lstmPrediction.predictions,
      predictionsLength: lstmPrediction.predictions?.length,
      firstPrediction: lstmPrediction.predictions?.[0]
    });

    const predictions = lstmPrediction.predictions;

    // Extract total emissions from predictions
    const totalPredictions = predictions.map((p: any) => p.predicted);

    // Split into scopes based on historical ratios
    const totalHistorical = input.historicalEmissions.scope1[0] +
                           input.historicalEmissions.scope2[0] +
                           input.historicalEmissions.scope3[0];

    // Only use fallback ratios if we have no historical data at all
    // If a scope has 0 emissions, keep it at 0 (don't use fallback)
    let scope1Ratio = 0;
    let scope2Ratio = 0;
    let scope3Ratio = 0;

    if (totalHistorical > 0) {
      // Calculate actual ratios from historical data
      scope1Ratio = input.historicalEmissions.scope1[0] / totalHistorical;
      scope2Ratio = input.historicalEmissions.scope2[0] / totalHistorical;
      scope3Ratio = input.historicalEmissions.scope3[0] / totalHistorical;
    } else {
      // Only use defaults if we have absolutely no data
      scope1Ratio = 0.22;
      scope2Ratio = 0.16;
      scope3Ratio = 0.62;
    }

    const scope1Forecast = totalPredictions.map((t: number) => t * scope1Ratio);
    const scope2Forecast = totalPredictions.map((t: number) => t * scope2Ratio);
    const scope3Forecast = totalPredictions.map((t: number) => t * scope3Ratio);

    // Calculate confidence intervals
    const confidenceIntervals = {
      lower: predictions.map((p: any) => p.lower_bound),
      upper: predictions.map((p: any) => p.upper_bound),
      confidence: 0.95
    };

    // Analyze trends
    const trend = totalPredictions[totalPredictions.length - 1] < totalPredictions[0] ? 'decreasing' : 'increasing';
    const trendRate = ((totalPredictions[totalPredictions.length - 1] - totalPredictions[0]) / totalPredictions[0]) * 100;

    return {
      prediction: totalPredictions,
      scope1Forecast,
      scope2Forecast,
      scope3Forecast,
      confidence: lstmPrediction.confidence,
      timestamp: new Date(),
      confidenceIntervals,
      trends: {
        direction: trend as any,
        rate: Math.abs(trendRate),
        drivers: Object.keys(lstmPrediction.features_importance)
      },
      targets: {
        currentTrajectory: totalPredictions[totalPredictions.length - 1],
        requiredReduction: 42, // SBTi target
        recommendations: [
          'Increase renewable energy adoption',
          'Optimize production schedules',
          'Improve supply chain efficiency'
        ]
      },
      predictions: lstmPrediction.predictions // Include raw predictions for UI
    } as any;
  }

  /**
   * Encode seasonality as numeric value
   */
  private encodeSeasonality(season: string): number {
    const seasonMap: Record<string, number> = {
      'winter': 0,
      'spring': 0.33,
      'summer': 0.67,
      'fall': 1
    };
    return seasonMap[season] || 0.5;
  }

  /**
   * No ML model available - return null to indicate no prediction
   */
  private simpleForecast(input: EmissionsForecastInput): EmissionsForecastPrediction {
    // NO FAKE PREDICTIONS - if we can't do real ML, we don't predict
    throw new Error('ML model not available - cannot make predictions without trained model');
  }

  /**
   * Prepare training data from emissions inputs
   */
  private prepareTrainingData(data: EmissionsForecastInput[]): MLTrainingData {
    const inputs: number[][][] = [];
    const targets: number[][] = [];

    for (let i = 0; i < data.length - 14; i++) {
      // Create sequences of 12 time steps for LSTM
      const sequence: number[][] = [];

      for (let j = i; j < i + 12; j++) {
        sequence.push(this.extractFeatures(data[j]));
      }

      inputs.push(sequence);

      // Target is the next 2 periods of emissions (scope1, scope2, scope3 each)
      const targetSequence = [];
      for (let k = i + 12; k < i + 14; k++) {
        const currentData = data[k];
        targetSequence.push(
          currentData.historicalEmissions.scope1[0] || 0,
          currentData.historicalEmissions.scope2[0] || 0,
          currentData.historicalEmissions.scope3[0] || 0
        );
      }
      targets.push(targetSequence);
    }

    return {
      inputs: inputs as any,
      targets,
      features: [
        'scope1', 'scope2', 'scope3', 'energy', 'fuel', 'production',
        'transport', 'employees', 'grid_factor', 'fuel_factor', 'season', 'regulatory'
      ],
      metadata: {
        modelType: 'emissions-forecast',
        trainingPeriods: data.length,
        featureCount: 12
      }
    };
  }

  /**
   * Extract numerical features from emissions input
   */
  private extractFeatures(input: EmissionsForecastInput): number[] {
    // Get most recent emissions values
    const recentScope1 = input.historicalEmissions.scope1[0] || 0;
    const recentScope2 = input.historicalEmissions.scope2[0] || 0;
    const recentScope3 = input.historicalEmissions.scope3[0] || 0;

    // Encode seasonality
    const seasonMap = { winter: 0, spring: 0.25, summer: 0.5, fall: 0.75 };

    return [
      recentScope1 / 1000, // Normalize to thousands of tCO2e
      recentScope2 / 1000,
      recentScope3 / 1000,
      input.activityData.energyConsumption / 100000, // Normalize
      input.activityData.fuelConsumption / 10000,
      input.activityData.productionVolume / 10000,
      input.activityData.transportationKm / 100000,
      input.activityData.employeeCount / 1000,
      input.externalFactors.gridEmissionFactor / 1000, // Normalize g to kg
      input.externalFactors.fuelEmissionFactor / 3000,
      seasonMap[input.externalFactors.seasonality],
      input.externalFactors.regulatoryChanges ? 1 : 0
    ];
  }

  /**
   * Process raw predictions into scope-specific forecasts
   */
  private processPredictions(rawPredictions: number[], input: EmissionsForecastInput) {
    // Raw predictions are [scope1_p1, scope2_p1, scope3_p1, scope1_p2, scope2_p2, scope3_p2]
    const scope1 = [rawPredictions[0] * 1000, rawPredictions[3] * 1000]; // Convert back from normalized
    const scope2 = [rawPredictions[1] * 1000, rawPredictions[4] * 1000];
    const scope3 = [rawPredictions[2] * 1000, rawPredictions[5] * 1000];

    const totalEmissions = scope1.map((s1, i) => s1 + scope2[i] + scope3[i]);

    return {
      scope1,
      scope2,
      scope3,
      totalEmissions
    };
  }

  /**
   * Calculate confidence intervals for predictions
   */
  private calculateConfidenceIntervals(prediction: MLPrediction, input: EmissionsForecastInput) {
    const uncertainty = 1 - prediction.confidence;
    const margin = uncertainty * 0.15; // ±15% max uncertainty

    const lower = prediction.prediction.map(p => Math.max(0, p * (1 - margin)));
    const upper = prediction.prediction.map(p => p * (1 + margin));

    return {
      lower,
      upper,
      confidence: 0.95
    };
  }

  /**
   * Analyze emission trends
   */
  private analyzeTrends(input: EmissionsForecastInput, forecast: any) {
    const historicalTotal = (input.historicalEmissions.scope1[0] || 0) +
                           (input.historicalEmissions.scope2[0] || 0) +
                           (input.historicalEmissions.scope3[0] || 0);

    const forecastTotal = forecast.totalEmissions[forecast.totalEmissions.length - 1];
    const changeRate = ((forecastTotal - historicalTotal) / historicalTotal) * 100;

    let direction: 'increasing' | 'decreasing' | 'stable';
    if (changeRate > 2) direction = 'increasing';
    else if (changeRate < -2) direction = 'decreasing';
    else direction = 'stable';

    // Identify main drivers
    const drivers: string[] = [];
    if (input.activityData.energyConsumption > 50000) drivers.push('High energy consumption');
    if (input.activityData.productionVolume > 10000) drivers.push('Production scale');
    if (input.externalFactors.gridEmissionFactor > 500) drivers.push('Grid emission intensity');

    return {
      direction,
      rate: Math.abs(changeRate),
      drivers
    };
  }

  /**
   * Analyze performance against targets
   */
  private analyzeTargets(input: EmissionsForecastInput, forecast: any) {
    const currentTrajectory = forecast.totalEmissions[forecast.totalEmissions.length - 1];

    // Assume a 30% reduction target by end of forecast period (common target)
    const historicalBaseline = (input.historicalEmissions.scope1[0] || 0) +
                              (input.historicalEmissions.scope2[0] || 0) +
                              (input.historicalEmissions.scope3[0] || 0);

    const targetEmissions = historicalBaseline * 0.7; // 30% reduction
    const requiredReduction = Math.max(0, ((currentTrajectory - targetEmissions) / currentTrajectory) * 100);

    const recommendations: string[] = [];
    if (requiredReduction > 20) {
      recommendations.push('Significant emissions reduction required - consider renewable energy transition');
    }
    if (forecast.scope2[0] > forecast.scope1[0]) {
      recommendations.push('Focus on energy efficiency and grid decarbonization');
    }
    if (forecast.scope3[0] > forecast.scope1[0] + forecast.scope2[0]) {
      recommendations.push('Supply chain decarbonization critical for target achievement');
    }

    return {
      currentTrajectory,
      requiredReduction,
      recommendations
    };
  }

  /**
   * Get model performance metrics
   */
  getPerformanceMetrics() {
    const metrics = mlPipeline.getModelMetrics(this.modelId);
    return {
      ...metrics,
      mae: this.lastValidationMae,
      targetMae: 5.0,
      isTraining: this.isTraining
    };
  }

  /**
   * Get model status
   */
  getStatus() {
    return {
      modelId: this.modelId,
      isTraining: this.isTraining,
      mae: this.lastValidationMae,
      meetsTarget: this.lastValidationMae <= 5.0,
      lastTrained: mlPipeline.getModelMetrics(this.modelId)?.lastTrained
    };
  }
}

// Export singleton instance
export const emissionsForecastModel = new EmissionsForecastModel();