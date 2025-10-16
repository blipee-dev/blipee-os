/**
 * ML Model Manager
 * Handles model training, persistence, and loading
 */

import * as tf from '@tensorflow/tfjs';
import { inMemoryLSTM } from './in-memory-lstm';

interface ModelState {
  trained: boolean;
  lastTrainingDate: Date | null;
  dataPoints: number;
  meanValue: number;
  stdValue: number;
}

class ModelManager {
  private static instance: ModelManager;
  private modelState: ModelState = {
    trained: false,
    lastTrainingDate: null,
    dataPoints: 0,
    meanValue: 0,
    stdValue: 0
  };

  // Store trained model weights in memory
  private trainedWeights: tf.Tensor[] | null = null;
  private scalerParams: { mean: number; std: number } | null = null;

  private constructor() {
  }

  static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }

  /**
   * Train models with historical data
   */
  async trainModels(historicalData: number[]): Promise<void> {

    try {
      // Initialize LSTM if not already done
      await inMemoryLSTM.initialize();

      // Calculate and store scaler parameters
      const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
      const variance = historicalData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalData.length;
      const std = Math.sqrt(variance);

      this.scalerParams = { mean, std };
      inMemoryLSTM.updateScaler(historicalData);

      // Prepare training data
      const sequences: number[][][] = [];
      const targets: number[] = [];

      for (let i = 0; i < historicalData.length - 12; i++) {
        const sequence = [];
        for (let j = 0; j < 12; j++) {
          const idx = i + j;
          sequence.push([
            historicalData[idx],
            (idx % 12) / 12,
            Math.sin(2 * Math.PI * idx / 12),
            Math.cos(2 * Math.PI * idx / 12),
            idx / historicalData.length,
            idx > 0 ? historicalData[idx - 1] : historicalData[idx],
            idx >= 12 ? historicalData[idx - 12] : historicalData[idx],
            0
          ]);
        }
        sequences.push(sequence);
        targets.push(historicalData[i + 12]);
      }

      // Train the model
      await inMemoryLSTM.train(sequences, targets);

      // Store model state
      this.modelState = {
        trained: true,
        lastTrainingDate: new Date(),
        dataPoints: historicalData.length,
        meanValue: mean / 1000, // Convert to tons
        stdValue: std / 1000
      };

      // Get and store the trained weights
      // Note: In production, you'd extract weights from the LSTM model here

    } catch (error) {
      console.error('❌ Training failed:', error);
      throw error;
    }
  }

  /**
   * Check if models are trained
   */
  isModelTrained(): boolean {
    return this.modelState.trained;
  }

  /**
   * Get model state
   */
  getModelState(): ModelState {
    return this.modelState;
  }

  /**
   * Get scaler parameters
   */
  getScalerParams(): { mean: number; std: number } | null {
    return this.scalerParams;
  }

  /**
   * Make prediction using trained model
   */
  async predict(inputData: number[][], horizon: number = 12): Promise<any> {
    if (!this.isModelTrained()) {
      throw new Error('Model not trained. Please train the model first.');
    }

    // Use the trained LSTM for prediction
    return await inMemoryLSTM.predict(inputData, horizon);
  }

  /**
   * Clear trained models (for retraining)
   */
  clearModels(): void {
    this.modelState = {
      trained: false,
      lastTrainingDate: null,
      dataPoints: 0,
      meanValue: 0,
      stdValue: 0
    };
    this.trainedWeights = null;
    this.scalerParams = null;
    inMemoryLSTM.dispose();
  }
}

// Export singleton instance
export const modelManager = ModelManager.getInstance();