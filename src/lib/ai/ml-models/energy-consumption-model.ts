/**
 * Energy Consumption Model - REAL ML Implementation
 *
 * Input: Historical consumption, weather, occupancy
 * Output: Next period prediction
 * Accuracy target: >85%
 */

import { mlPipeline, MLModelConfig, MLTrainingData, MLPrediction } from './ml-pipeline';

export interface EnergyConsumptionInput {
  historicalConsumption: number[]; // kWh over time periods
  weatherData: {
    temperature: number; // Celsius
    humidity: number; // %
    windSpeed: number; // km/h
    cloudCover: number; // %
  };
  occupancy: {
    currentLevel: number; // % occupancy
    scheduledEvents: number; // number of events
    peakHours: boolean;
  };
  facilityData: {
    area: number; // square meters
    equipmentLoad: number; // baseline kW
    hvacMode: 'heating' | 'cooling' | 'off';
  };
}

export interface EnergyConsumptionPrediction extends MLPrediction {
  prediction: number[]; // Predicted kWh for next periods
  breakdown: {
    hvac: number;
    lighting: number;
    equipment: number;
    other: number;
  };
  recommendations: string[];
  costImpact: {
    estimatedCost: number;
    savingOpportunities: number;
  };
}

export class EnergyConsumptionModel {
  private modelId = 'energy-consumption-lstm';
  private isTraining = false;
  private lastTrainingAccuracy = 0;

  constructor() {
  }

  /**
   * Train the energy consumption prediction model
   */
  async train(data: EnergyConsumptionInput[]): Promise<void> {
    if (this.isTraining) {
      throw new Error('Model is already training');
    }

    this.isTraining = true;

    try {
      // Prepare training data
      const trainingData = this.prepareTrainingData(data);

      // Model configuration for LSTM time series prediction
      const config: MLModelConfig = {
        modelType: 'lstm',
        inputShape: [10, 10], // 10 time steps, 10 features
        outputShape: [4], // Predict next 4 periods
        learningRate: 0.001,
        epochs: 100,
        batchSize: 32,
        validationSplit: 0.2
      };

      // Train the model
      const metrics = await mlPipeline.trainModel(this.modelId, config, trainingData);

      this.lastTrainingAccuracy = metrics.accuracy || 0;


      if (this.lastTrainingAccuracy < 0.85) {
        console.warn('⚠️ Model accuracy below target (85%). Consider more training data or feature engineering.');
      }

    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Predict energy consumption
   */
  async predict(input: EnergyConsumptionInput): Promise<EnergyConsumptionPrediction> {

    // Prepare input features for LSTM (needs sequence of 10 timesteps)
    const features = this.extractFeatures(input);

    // Create a sequence of 10 timesteps using the same features (for prediction)
    // In a real scenario, you'd have historical data for these timesteps
    const sequence = Array(10).fill(features);

    // Make prediction using ML pipeline
    const prediction = await mlPipeline.predict(this.modelId, sequence);

    // Post-process prediction
    const totalConsumption = prediction.prediction.reduce((sum, val) => sum + val, 0);

    // Calculate breakdown based on facility characteristics
    const breakdown = this.calculateEnergyBreakdown(totalConsumption, input);

    // Generate recommendations
    const recommendations = this.generateRecommendations(input, prediction.prediction);

    // Calculate cost impact
    const costImpact = this.calculateCostImpact(prediction.prediction, input);

    return {
      ...prediction,
      breakdown,
      recommendations,
      costImpact
    };
  }

  /**
   * Prepare training data from energy consumption inputs
   */
  private prepareTrainingData(data: EnergyConsumptionInput[]): MLTrainingData {
    const inputs: number[][][] = [];
    const targets: number[][] = [];

    for (let i = 0; i < data.length - 14; i++) {
      // Create sequences of 10 time steps for LSTM
      const sequence: number[][] = [];

      for (let j = i; j < i + 10; j++) {
        sequence.push(this.extractFeatures(data[j]));
      }

      inputs.push(sequence);

      // Target is the next 4 periods of consumption
      const targetSequence = [];
      for (let k = i + 10; k < i + 14; k++) {
        targetSequence.push(data[k].historicalConsumption[0] || 0);
      }
      targets.push(targetSequence);
    }

    return {
      inputs: inputs as any,
      targets,
      features: ['temp', 'humidity', 'wind', 'cloud', 'occupancy', 'events', 'peak', 'area', 'equipment', 'hvac'],
      metadata: {
        modelType: 'energy-consumption',
        trainingPeriods: data.length,
        featureCount: 10
      }
    };
  }

  /**
   * Extract numerical features from energy consumption input
   */
  private extractFeatures(input: EnergyConsumptionInput): number[] {
    return [
      input.weatherData.temperature,
      input.weatherData.humidity / 100, // Normalize to 0-1
      input.weatherData.windSpeed / 50, // Normalize assuming max 50 km/h
      input.weatherData.cloudCover / 100,
      input.occupancy.currentLevel / 100,
      input.occupancy.scheduledEvents / 10, // Normalize assuming max 10 events
      input.occupancy.peakHours ? 1 : 0,
      input.facilityData.area / 10000, // Normalize for typical building size
      input.facilityData.equipmentLoad / 1000, // Normalize for typical load
      input.facilityData.hvacMode === 'heating' ? 1 : input.facilityData.hvacMode === 'cooling' ? 0.5 : 0
    ];
  }

  /**
   * Calculate energy consumption breakdown
   */
  private calculateEnergyBreakdown(totalConsumption: number, input: EnergyConsumptionInput): EnergyConsumptionPrediction['breakdown'] {
    // Typical breakdown percentages based on facility type and conditions
    const baseBreakdown = {
      hvac: 0.45, // 45% typically HVAC
      lighting: 0.25, // 25% lighting
      equipment: 0.20, // 20% equipment
      other: 0.10 // 10% other
    };

    // Adjust based on conditions
    let hvacMultiplier = 1;
    if (input.facilityData.hvacMode === 'heating' && input.weatherData.temperature < 15) {
      hvacMultiplier = 1.3; // Higher HVAC usage in cold weather
    } else if (input.facilityData.hvacMode === 'cooling' && input.weatherData.temperature > 25) {
      hvacMultiplier = 1.4; // Higher HVAC usage in hot weather
    }

    // Occupancy affects lighting and equipment
    const occupancyMultiplier = 0.7 + (input.occupancy.currentLevel / 100) * 0.6;

    return {
      hvac: totalConsumption * baseBreakdown.hvac * hvacMultiplier,
      lighting: totalConsumption * baseBreakdown.lighting * occupancyMultiplier,
      equipment: totalConsumption * baseBreakdown.equipment * occupancyMultiplier,
      other: totalConsumption * baseBreakdown.other
    };
  }

  /**
   * Generate energy saving recommendations
   */
  private generateRecommendations(input: EnergyConsumptionInput, predictions: number[]): string[] {
    const recommendations: string[] = [];

    // High consumption prediction
    if (predictions.some(p => p > input.historicalConsumption[0] * 1.2)) {
      recommendations.push('High energy consumption predicted - consider load balancing');
    }

    // Weather-based recommendations
    if (input.weatherData.temperature > 25 && input.facilityData.hvacMode === 'cooling') {
      recommendations.push('Optimize cooling setpoints - increase by 1-2°C during peak hours');
    }

    if (input.weatherData.temperature < 15 && input.facilityData.hvacMode === 'heating') {
      recommendations.push('Pre-heat building during off-peak hours to reduce peak demand');
    }

    // Occupancy-based recommendations
    if (input.occupancy.currentLevel < 50) {
      recommendations.push('Consider zone-based lighting and HVAC control for low occupancy periods');
    }

    // Equipment optimization
    if (input.facilityData.equipmentLoad > 500) {
      recommendations.push('Schedule equipment maintenance to optimize efficiency');
    }

    return recommendations;
  }

  /**
   * Calculate cost impact and savings
   */
  private calculateCostImpact(predictions: number[], input: EnergyConsumptionInput): EnergyConsumptionPrediction['costImpact'] {
    const averageRate = 0.12; // $0.12 per kWh (typical commercial rate)
    const peakRate = 0.18; // $0.18 per kWh during peak hours

    const totalPredictedConsumption = predictions.reduce((sum, val) => sum + val, 0);
    const rate = input.occupancy.peakHours ? peakRate : averageRate;

    const estimatedCost = totalPredictedConsumption * rate;

    // Calculate potential savings from recommendations
    const baselineConsumption = input.historicalConsumption[0] * 4; // 4 periods
    const potentialReduction = Math.max(0, baselineConsumption - totalPredictedConsumption) * 0.1; // 10% optimization potential
    const savingOpportunities = potentialReduction * rate;

    return {
      estimatedCost,
      savingOpportunities
    };
  }

  /**
   * Get model performance metrics
   */
  getPerformanceMetrics() {
    const metrics = mlPipeline.getModelMetrics(this.modelId);
    return {
      ...metrics,
      accuracy: this.lastTrainingAccuracy,
      targetAccuracy: 0.85,
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
      accuracy: this.lastTrainingAccuracy,
      meetsTarget: this.lastTrainingAccuracy >= 0.85,
      lastTrained: mlPipeline.getModelMetrics(this.modelId)?.lastTrained
    };
  }
}

// Export singleton instance
export const energyConsumptionModel = new EnergyConsumptionModel();