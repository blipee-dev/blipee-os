/**
 * ML Training API Endpoint
 * POST /api/ml/train - Train models with real data
 */

import { NextRequest, NextResponse } from 'next/server';
import { energyConsumptionModel } from '@/lib/ai/ml-models/energy-consumption-model';
import { emissionsForecastModel } from '@/lib/ai/ml-models/emissions-forecast-model';
import { anomalyDetectionModel } from '@/lib/ai/ml-models/anomaly-detection-model';
import { costOptimizationModel } from '@/lib/ai/ml-models/cost-optimization-model';
import { complianceRiskModel } from '@/lib/ai/ml-models/compliance-risk-model';
import { predictiveMaintenanceModel } from '@/lib/ai/ml-models/predictive-maintenance-model';

export async function POST(request: NextRequest) {
  try {
    console.log('🏃 ML Training API called');

    const body = await request.json();
    const { modelType, trainingData } = body;

    if (!modelType || !trainingData) {
      return NextResponse.json(
        { error: 'Missing modelType or trainingData' },
        { status: 400 }
      );
    }

    let result;
    const startTime = Date.now();

    console.log(`🧠 Training ${modelType} model with ${trainingData.length} samples...`);

    // Route to appropriate model for training
    switch (modelType) {
      case 'energy-consumption':
        await energyConsumptionModel.train(trainingData);
        result = energyConsumptionModel.getPerformanceMetrics();
        break;

      case 'emissions-forecast':
        await emissionsForecastModel.train(trainingData);
        result = emissionsForecastModel.getPerformanceMetrics();
        break;

      case 'anomaly-detection':
        await anomalyDetectionModel.train(trainingData);
        result = anomalyDetectionModel.getPerformanceMetrics();
        break;

      case 'cost-optimization':
        await costOptimizationModel.train(trainingData);
        result = { status: 'trained', modelType };
        break;

      case 'compliance-risk':
        await complianceRiskModel.train(trainingData);
        result = { status: 'trained', modelType };
        break;

      case 'predictive-maintenance':
        await predictiveMaintenanceModel.train(trainingData);
        result = { status: 'trained', modelType };
        break;

      default:
        return NextResponse.json(
          { error: `Unknown model type: ${modelType}` },
          { status: 400 }
        );
    }

    const trainingTime = Date.now() - startTime;

    console.log(`✅ ${modelType} model trained in ${trainingTime}ms`);

    return NextResponse.json({
      success: true,
      modelType,
      trainingTime,
      metrics: result,
      message: `${modelType} model trained successfully`
    });

  } catch (error) {
    console.error('❌ ML Training API error:', error);

    return NextResponse.json(
      {
        error: 'Training failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}