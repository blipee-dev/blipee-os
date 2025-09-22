/**
 * ML Prediction API Endpoint
 * POST /api/ml/predict - Get real predictions from trained models
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
    console.log('🔮 ML Prediction API called');

    const body = await request.json();
    const { modelType, inputData } = body;

    if (!modelType || !inputData) {
      return NextResponse.json(
        { error: 'Missing modelType or inputData' },
        { status: 400 }
      );
    }

    let prediction;
    const startTime = Date.now();

    console.log(`🧠 Making ${modelType} prediction...`);

    // Route to appropriate model for prediction
    switch (modelType) {
      case 'energy-consumption':
        prediction = await energyConsumptionModel.predict(inputData);
        break;

      case 'emissions-forecast':
        prediction = await emissionsForecastModel.predict(inputData);
        break;

      case 'anomaly-detection':
        prediction = await anomalyDetectionModel.detect(inputData);
        break;

      case 'cost-optimization':
        prediction = await costOptimizationModel.optimize(inputData);
        break;

      case 'compliance-risk':
        prediction = await complianceRiskModel.assessRisk(inputData);
        break;

      case 'predictive-maintenance':
        prediction = await predictiveMaintenanceModel.predict(inputData);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown model type: ${modelType}` },
          { status: 400 }
        );
    }

    const predictionTime = Date.now() - startTime;

    console.log(`✅ ${modelType} prediction completed in ${predictionTime}ms`);

    return NextResponse.json({
      success: true,
      modelType,
      predictionTime,
      prediction,
      metadata: {
        timestamp: new Date().toISOString(),
        confidence: prediction.confidence,
        version: '1.0.0'
      }
    });

  } catch (error) {
    console.error('❌ ML Prediction API error:', error);

    return NextResponse.json(
      {
        error: 'Prediction failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}