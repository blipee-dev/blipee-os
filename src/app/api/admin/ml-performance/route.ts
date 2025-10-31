/**
 * ML Performance Dashboard API
 *
 * Provides metrics about ML model training, accuracy, and inference performance
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!orgMember) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }

    const organizationId = orgMember.organization_id;

    // ============================================
    // 1. ML MODELS STATUS
    // ============================================
    const { data: models } = await supabase
      .from('ml_models')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    const modelsByType = (models || []).reduce((acc: any, model: any) => {
      const type = model.model_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(model);
      return acc;
    }, {});

    // Get latest model for each type
    const latestModels = Object.entries(modelsByType).map(([type, modelList]: [string, any]) => {
      const latest = modelList[0]; // First is most recent due to ordering
      return {
        model_type: type,
        version: latest.version,
        accuracy: latest.metrics?.accuracy || latest.metrics?.mape || 0,
        status: latest.status,
        training_duration: latest.training_duration_ms,
        last_trained: latest.trained_at,
        predictions_count: latest.metadata?.predictions_count || 0,
      };
    });

    // ============================================
    // 2. MODEL PERFORMANCE METRICS
    // ============================================
    const performanceByModel: Record<string, any> = {};

    for (const model of models || []) {
      const type = model.model_type;
      if (!performanceByModel[type]) {
        performanceByModel[type] = {
          accuracy: [],
          mae: [],
          mape: [],
          inference_time: [],
        };
      }

      if (model.metrics) {
        if (model.metrics.accuracy) performanceByModel[type].accuracy.push(model.metrics.accuracy);
        if (model.metrics.mae) performanceByModel[type].mae.push(model.metrics.mae);
        if (model.metrics.mape) performanceByModel[type].mape.push(model.metrics.mape);
      }
      if (model.metadata?.avg_inference_ms) {
        performanceByModel[type].inference_time.push(model.metadata.avg_inference_ms);
      }
    }

    // Calculate averages
    const performanceSummary = Object.entries(performanceByModel).map(([type, metrics]: [string, any]) => ({
      model_type: type,
      avg_accuracy: metrics.accuracy.length > 0
        ? metrics.accuracy.reduce((a: number, b: number) => a + b, 0) / metrics.accuracy.length
        : null,
      avg_mae: metrics.mae.length > 0
        ? metrics.mae.reduce((a: number, b: number) => a + b, 0) / metrics.mae.length
        : null,
      avg_mape: metrics.mape.length > 0
        ? metrics.mape.reduce((a: number, b: number) => a + b, 0) / metrics.mape.length
        : null,
      avg_inference_ms: metrics.inference_time.length > 0
        ? metrics.inference_time.reduce((a: number, b: number) => a + b, 0) / metrics.inference_time.length
        : null,
    }));

    // ============================================
    // 3. RECENT PREDICTIONS
    // ============================================
    const { data: recentPredictions } = await supabase
      .from('ml_predictions')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate prediction accuracy (compare with actual values if available)
    const predictionAccuracy: Record<string, { correct: number; total: number }> = {};

    for (const pred of recentPredictions || []) {
      const type = pred.prediction_type;
      if (!predictionAccuracy[type]) {
        predictionAccuracy[type] = { correct: 0, total: 0 };
      }
      predictionAccuracy[type].total++;

      // If confidence > 0.7, consider it a good prediction
      if (pred.confidence && pred.confidence > 0.7) {
        predictionAccuracy[type].correct++;
      }
    }

    const accuracyByPredictionType = Object.entries(predictionAccuracy).map(([type, data]) => ({
      prediction_type: type,
      accuracy: data.total > 0 ? (data.correct / data.total) * 100 : 0,
      total: data.total,
    }));

    // ============================================
    // 4. TRAINING HISTORY (last 30 days)
    // ============================================
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: trainingHistory } = await supabase
      .from('ml_training_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false });

    const trainingStats = {
      total_trainings: trainingHistory?.length || 0,
      successful: trainingHistory?.filter(t => t.status === 'success').length || 0,
      failed: trainingHistory?.filter(t => t.status === 'failed').length || 0,
      avg_duration: trainingHistory && trainingHistory.length > 0
        ? trainingHistory.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / trainingHistory.length
        : 0,
    };

    // ============================================
    // 5. MODEL HEALTH STATUS
    // ============================================
    const modelTypes = [
      'emissions_prediction',
      'anomaly_detection',
      'pattern_recognition',
      'fast_forecast',
      'risk_classification',
    ];

    const modelHealth = modelTypes.map((type) => {
      const typeModels = modelsByType[type] || [];
      const latest = typeModels[0];

      let status: 'healthy' | 'warning' | 'error' | 'not_trained';
      let message = '';

      if (!latest) {
        status = 'not_trained';
        message = 'No model trained yet';
      } else if (latest.status === 'trained' && latest.metrics) {
        const accuracy = latest.metrics.accuracy || (100 - (latest.metrics.mape || 100));
        if (accuracy > 80) {
          status = 'healthy';
          message = 'Model performing well';
        } else if (accuracy > 60) {
          status = 'warning';
          message = 'Model accuracy below target';
        } else {
          status = 'error';
          message = 'Model accuracy critically low';
        }
      } else if (latest.status === 'training') {
        status = 'warning';
        message = 'Model currently training';
      } else {
        status = 'error';
        message = 'Model training failed';
      }

      return {
        model_type: type,
        model_name: formatModelName(type),
        status,
        message,
        last_trained: latest?.trained_at || null,
        version: latest?.version || 'N/A',
        accuracy: latest?.metrics?.accuracy || latest?.metrics?.mape ? (100 - latest.metrics.mape) : null,
      };
    });

    // ============================================
    // RETURN ALL METRICS
    // ============================================
    return NextResponse.json({
      summary: {
        total_models: models?.length || 0,
        healthy_models: modelHealth.filter(m => m.status === 'healthy').length,
        total_predictions: recentPredictions?.length || 0,
        avg_prediction_confidence: recentPredictions && recentPredictions.length > 0
          ? recentPredictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / recentPredictions.length * 100
          : 0,
      },
      models: {
        latest: latestModels,
        performance: performanceSummary,
        health: modelHealth,
      },
      predictions: {
        recent: recentPredictions?.slice(0, 10),
        accuracy_by_type: accuracyByPredictionType,
      },
      training: {
        history: trainingHistory?.slice(0, 10),
        stats: trainingStats,
      },
    });
  } catch (error: any) {
    console.error('❌ ML performance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * Format model type to display name
 */
function formatModelName(modelType: string): string {
  const names: Record<string, string> = {
    emissions_prediction: 'Emissions Prediction (LSTM)',
    anomaly_detection: 'Anomaly Detection (Autoencoder)',
    pattern_recognition: 'Pattern Recognition (CNN)',
    fast_forecast: 'Fast Forecast (GRU)',
    risk_classification: 'Risk Classification',
  };
  return names[modelType] || modelType;
}
