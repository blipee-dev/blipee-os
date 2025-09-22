/**
 * ML Evaluation API Endpoint
 * GET /api/ml/evaluate - Get model performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { energyConsumptionModel } from '@/lib/ai/ml-models/energy-consumption-model';
import { emissionsForecastModel } from '@/lib/ai/ml-models/emissions-forecast-model';
import { anomalyDetectionModel } from '@/lib/ai/ml-models/anomaly-detection-model';
import { mlPipeline } from '@/lib/ai/ml-models/ml-pipeline';

export async function GET(request: NextRequest) {
  try {
    console.log('📊 ML Evaluation API called');

    const { searchParams } = new URL(request.url);
    const modelType = searchParams.get('modelType');

    if (modelType && !['energy-consumption', 'emissions-forecast', 'anomaly-detection', 'cost-optimization', 'compliance-risk', 'predictive-maintenance'].includes(modelType)) {
      return NextResponse.json(
        { error: `Unknown model type: ${modelType}` },
        { status: 400 }
      );
    }

    let result;

    if (modelType) {
      // Get metrics for specific model
      console.log(`📊 Getting metrics for ${modelType} model...`);

      switch (modelType) {
        case 'energy-consumption':
          result = energyConsumptionModel.getPerformanceMetrics();
          break;
        case 'emissions-forecast':
          result = emissionsForecastModel.getPerformanceMetrics();
          break;
        case 'anomaly-detection':
          result = anomalyDetectionModel.getPerformanceMetrics();
          break;
        default:
          result = mlPipeline.getModelMetrics(modelType);
      }

      if (!result) {
        return NextResponse.json(
          { error: `Model ${modelType} not found or not trained` },
          { status: 404 }
        );
      }

    } else {
      // Get metrics for all models
      console.log('📊 Getting metrics for all models...');

      result = {
        'energy-consumption': energyConsumptionModel.getPerformanceMetrics(),
        'emissions-forecast': emissionsForecastModel.getPerformanceMetrics(),
        'anomaly-detection': anomalyDetectionModel.getPerformanceMetrics(),
        'available-models': mlPipeline.listModels(),
        'evaluation-timestamp': new Date().toISOString()
      };
    }

    console.log(`✅ Model evaluation completed`);

    return NextResponse.json({
      success: true,
      modelType: modelType || 'all',
      metrics: result,
      metadata: {
        timestamp: new Date().toISOString(),
        evaluationType: modelType ? 'single' : 'comprehensive'
      }
    });

  } catch (error) {
    console.error('❌ ML Evaluation API error:', error);

    return NextResponse.json(
      {
        error: 'Evaluation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}