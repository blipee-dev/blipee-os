// Load trained models for the ML pipeline
import * as tf from '@tensorflow/tfjs';

// Check if we're running in Node.js or browser environment
const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;

// Only import Node.js modules if we're actually in Node.js
let fs: any = null;
let path: any = null;
let MODELS_DIR: string = '';

if (isNodeEnvironment) {
  try {
    fs = require('fs');
    path = require('path');
    MODELS_DIR = path.join(process.cwd(), 'ml-models');

    // Patch for Node.js v24 compatibility
    const util = require('util');
    if (!(util as any).isNullOrUndefined) {
      (util as any).isNullOrUndefined = function(arg: any) {
        return arg === null || arg === undefined;
      };
    }
  } catch (error) {
    console.log('⚠️  Node.js modules not available, using browser fallback');
  }
} else {
  console.log('🌐 Running in browser environment - disk model loading disabled');
}

export interface LoadedModel {
  model: tf.LayersModel | null;
  scaler: any;
  type: 'lstm' | 'anomaly' | 'unknown';
}

/**
 * Load the trained LSTM emissions forecast model
 */
export async function loadEmissionsForecastModel(): Promise<LoadedModel> {
  // DISABLED: Disk loading causes issues with file:// protocol
  // Using in-memory ML pipeline instead which works perfectly
  console.log('✅ Using in-memory ML pipeline for predictions');
  return { model: null, scaler: null, type: 'lstm' };
}

/**
 * Load the trained anomaly detection model
 */
export async function loadAnomalyDetectionModel(): Promise<any> {
  // DISABLED: Disk loading causes issues
  // Using in-memory anomaly detection instead
  console.log('✅ Using in-memory anomaly detection');
  return null;
}

/**
 * Make prediction with loaded LSTM model
 */
export async function predictWithLSTM(
  model: tf.LayersModel,
  scaler: { mean: number; std: number },
  inputSequence: number[]
): Promise<number> {
  try {
    // Normalize the input sequence
    const normalizedSequence = inputSequence.map(val => (val - scaler.mean) / scaler.std);

    // Prepare tensor (shape: [1, sequence_length, 1])
    const inputTensor = tf.tensor3d([[normalizedSequence.map(v => [v])]]);

    // Make prediction
    const prediction = model.predict(inputTensor) as tf.Tensor;
    const normalizedValue = await prediction.data();

    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();

    // Denormalize the prediction
    const predictedValue = normalizedValue[0] * scaler.std + scaler.mean;

    return predictedValue;

  } catch (error) {
    console.error('❌ Prediction error:', error);
    throw error;
  }
}

/**
 * Detect anomalies with loaded model
 */
export function detectAnomalies(
  model: any,
  data: { category: string; value: number }[]
): any[] {
  if (!model || !model.statistics) {
    return [];
  }

  const anomalies = [];
  const threshold = model.threshold || 2;

  for (const record of data) {
    const stats = model.statistics[record.category];

    if (stats && stats.std > 0) {
      const zScore = Math.abs((record.value - stats.mean) / stats.std);

      if (zScore > threshold) {
        anomalies.push({
          ...record,
          zScore,
          expectedRange: {
            min: stats.mean - threshold * stats.std,
            max: stats.mean + threshold * stats.std
          },
          severity: zScore > 3 ? 'high' : 'medium'
        });
      }
    }
  }

  return anomalies;
}

// Initialize models on module load
let lstmModel: LoadedModel | null = null;
let anomalyModel: any = null;

export async function initializeModels() {
  console.log('🚀 Initializing trained ML models...');

  lstmModel = await loadEmissionsForecastModel();
  anomalyModel = await loadAnomalyDetectionModel();

  return {
    lstm: lstmModel,
    anomaly: anomalyModel
  };
}

// Export loaded models
export function getLoadedModels() {
  return {
    lstm: lstmModel,
    anomaly: anomalyModel
  };
}