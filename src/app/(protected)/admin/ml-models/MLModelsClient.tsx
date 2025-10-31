'use client';

/**
 * ML Performance Dashboard
 *
 * Visualizes ML model training, accuracy, inference performance, and predictions
 */

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Activity, Zap, Target, TrendingUp, RefreshCw, Clock } from 'lucide-react';

interface ModelHealth {
  model_type: string;
  model_name: string;
  status: 'healthy' | 'warning' | 'error' | 'not_trained';
  message: string;
  last_trained: string | null;
  version: string;
  accuracy: number | null;
}

interface DashboardData {
  summary: {
    total_models: number;
    healthy_models: number;
    total_predictions: number;
    avg_prediction_confidence: number;
  };
  models: {
    latest: any[];
    performance: any[];
    health: ModelHealth[];
  };
  predictions: {
    recent: any[];
    accuracy_by_type: any[];
  };
  training: {
    history: any[];
    stats: {
      total_trainings: number;
      successful: number;
      failed: number;
      avg_duration: number;
    };
  };
}

export default function MLModelsClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/admin/ml-performance');

      if (!response.ok) {
        throw new Error('Failed to fetch ML performance data');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ML Performance Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor machine learning model training, accuracy, and predictions
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Models</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_models}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.healthy_models} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predictions Made</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_predictions}</div>
            <p className="text-xs text-muted-foreground">Recent predictions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.avg_prediction_confidence.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Prediction confidence</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Jobs</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.training.stats.total_trainings}</div>
            <p className="text-xs text-muted-foreground">
              {data.training.stats.successful} successful
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Model Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.models.health.map((model) => (
              <div
                key={model.model_type}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-semibold">{model.model_name}</div>
                    <div className="text-sm text-muted-foreground">{model.message}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {model.accuracy !== null && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {model.accuracy.toFixed(1)}% accuracy
                      </div>
                      <div className="text-xs text-muted-foreground">Version {model.version}</div>
                    </div>
                  )}

                  {model.last_trained && (
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Last trained</div>
                      <div className="text-sm font-medium">
                        {new Date(model.last_trained).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <Badge
                    variant={
                      model.status === 'healthy'
                        ? 'default'
                        : model.status === 'warning'
                        ? 'secondary'
                        : model.status === 'error'
                        ? 'destructive'
                        : 'outline'
                    }
                  >
                    {model.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Model Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.models.performance.map((perf) => (
                <div key={perf.model_type} className="border-b pb-3">
                  <div className="font-medium mb-2">{formatModelName(perf.model_type)}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {perf.avg_accuracy !== null && (
                      <div>
                        <span className="text-muted-foreground">Accuracy:</span>{' '}
                        <span className="font-semibold">{perf.avg_accuracy.toFixed(2)}%</span>
                      </div>
                    )}
                    {perf.avg_mape !== null && (
                      <div>
                        <span className="text-muted-foreground">MAPE:</span>{' '}
                        <span className="font-semibold">{perf.avg_mape.toFixed(2)}%</span>
                      </div>
                    )}
                    {perf.avg_mae !== null && (
                      <div>
                        <span className="text-muted-foreground">MAE:</span>{' '}
                        <span className="font-semibold">{perf.avg_mae.toFixed(2)}</span>
                      </div>
                    )}
                    {perf.avg_inference_ms !== null && (
                      <div>
                        <span className="text-muted-foreground">Inference:</span>{' '}
                        <span className="font-semibold">{perf.avg_inference_ms.toFixed(0)}ms</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prediction Accuracy by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.predictions.accuracy_by_type.map((item) => (
                <div key={item.prediction_type} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {formatPredictionType(item.prediction_type)}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${item.accuracy}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-16 text-right">
                      {item.accuracy.toFixed(1)}%
                    </span>
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      ({item.total})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training History</CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="text-muted-foreground">
                  Avg: {(data.training.stats.avg_duration / 1000).toFixed(1)}s
                </span>
              </div>
              <Badge variant="default">{data.training.stats.successful} successful</Badge>
              <Badge variant="destructive">{data.training.stats.failed} failed</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.training.history.map((training, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm border-b pb-2"
              >
                <div className="flex items-center gap-3">
                  <Badge
                    variant={training.status === 'success' ? 'default' : 'destructive'}
                    className="w-20"
                  >
                    {training.status}
                  </Badge>
                  <span className="font-medium">{formatModelName(training.model_type)}</span>
                  {training.metrics && (
                    <span className="text-muted-foreground">
                      {training.metrics.accuracy
                        ? `${training.metrics.accuracy.toFixed(1)}% acc`
                        : training.metrics.mape
                        ? `${training.metrics.mape.toFixed(1)}% MAPE`
                        : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    {training.duration_ms
                      ? `${(training.duration_ms / 1000).toFixed(1)}s`
                      : 'N/A'}
                  </span>
                  <span className="text-xs text-muted-foreground w-32 text-right">
                    {new Date(training.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Predictions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.predictions.recent.map((pred, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-sm border-b pb-2"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatPredictionType(pred.prediction_type)}</span>
                  <span className="text-muted-foreground">
                    {Array.isArray(pred.prediction)
                      ? `${pred.prediction.length} values`
                      : typeof pred.prediction === 'number'
                      ? pred.prediction.toFixed(2)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {((pred.confidence || 0) * 100).toFixed(0)}% confidence
                  </Badge>
                  <span className="text-xs text-muted-foreground w-32 text-right">
                    {new Date(pred.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatModelName(modelType: string): string {
  const names: Record<string, string> = {
    emissions_prediction: 'Emissions Prediction',
    anomaly_detection: 'Anomaly Detection',
    pattern_recognition: 'Pattern Recognition',
    fast_forecast: 'Fast Forecast',
    risk_classification: 'Risk Classification',
  };
  return names[modelType] || modelType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatPredictionType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
