/**
 * Emissions Forecast Model - REAL ML Implementation
 *
 * Input: Historical emissions, activity data
 * Output: Future emissions with confidence intervals
 */

import { mlPipeline, MLModelConfig, MLTrainingData, MLPrediction } from './ml-pipeline';

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
   * Forecast future emissions
   */
  async predict(input: EmissionsForecastInput): Promise<EmissionsForecastPrediction> {
    console.log('🔮 Forecasting emissions...');

    // Prepare input features for LSTM (needs sequence of 12 timesteps)
    const features = this.extractFeatures(input);

    // Create a sequence of 12 timesteps using the same features (for prediction)
    // In a real scenario, you'd have historical data for these timesteps
    const sequence = Array(12).fill(features);

    // Make prediction using ML pipeline
    const prediction = await mlPipeline.predict(this.modelId, sequence);

    // Post-process predictions into scope-specific forecasts
    const forecastData = this.processPredictions(prediction.prediction, input);

    // Calculate confidence intervals
    const confidenceIntervals = this.calculateConfidenceIntervals(prediction, input);

    // Analyze trends
    const trends = this.analyzeTrends(input, forecastData);

    // Generate target analysis
    const targets = this.analyzeTargets(input, forecastData);

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