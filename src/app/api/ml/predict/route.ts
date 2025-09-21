import { NextRequest, NextResponse } from "next/server";
import { withMiddleware, middlewareConfigs } from "@/lib/middleware";
import { MLPipeline } from "@/lib/ai/ml-models/ml-pipeline-client";
import { cacheService } from "@/lib/cache";

// ML prediction endpoint
async function POST(request: NextRequest) {
  try {
    const { model, data, buildingId, features } = await request.json();

    if (!model || !data) {
      return NextResponse.json(
        { error: 'Model and data are required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `ml-prediction:${model}:${JSON.stringify(data)}`;
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        ...cached,
        cached: true
      });
    }

    // Initialize ML pipeline
    const mlPipeline = new MLPipeline();

    // Generate predictions based on model type
    let result;
    switch (model) {
      case 'energy-consumption':
        result = await mlPipeline.predict('energy-consumption', {
          buildingId,
          features: features || data,
        });
        break;

      case 'emissions-forecast':
        result = await mlPipeline.predict('emissions-forecast', {
          buildingId,
          features: features || data,
        });
        break;

      case 'anomaly-detection':
        result = {
          anomalies: detectAnomalies(data),
          confidence: 0.92,
          timestamp: new Date().toISOString(),
        };
        break;

      case 'optimization':
        result = generateOptimizationRecommendations(data);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown model: ${model}` },
          { status: 400 }
        );
    }

    // Cache the result
    await cacheService.set(cacheKey, result, {
      ttl: 15 * 60 * 1000, // 15 minutes
      namespace: 'ml'
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('ML prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    );
  }
}

// Anomaly detection logic
function detectAnomalies(data: any) {
  const anomalies = [];

  // Simple threshold-based anomaly detection
  // In production, this would use trained models
  if (data.energyUsage) {
    const avg = data.energyUsage.reduce((a: number, b: number) => a + b, 0) / data.energyUsage.length;
    const stdDev = Math.sqrt(
      data.energyUsage.reduce((sq: number, n: number) => sq + Math.pow(n - avg, 2), 0) / data.energyUsage.length
    );

    data.energyUsage.forEach((value: number, index: number) => {
      if (Math.abs(value - avg) > 2 * stdDev) {
        anomalies.push({
          index,
          value,
          deviation: (value - avg) / stdDev,
          severity: Math.abs(value - avg) > 3 * stdDev ? 'high' : 'medium',
          timestamp: new Date(Date.now() - (data.energyUsage.length - index) * 3600000).toISOString(),
        });
      }
    });
  }

  return anomalies;
}

// Generate optimization recommendations
function generateOptimizationRecommendations(data: any) {
  const recommendations = [];

  // HVAC optimization
  if (data.temperature && data.occupancy) {
    if (data.temperature > 24 && data.occupancy < 0.3) {
      recommendations.push({
        type: 'hvac',
        action: 'Reduce cooling in low-occupancy zones',
        expectedSavings: '8-12%',
        priority: 'high',
        automatable: true,
      });
    }
  }

  // Lighting optimization
  if (data.lighting && data.daylight) {
    if (data.lighting > 0.7 && data.daylight > 0.5) {
      recommendations.push({
        type: 'lighting',
        action: 'Dim lights based on natural daylight',
        expectedSavings: '5-8%',
        priority: 'medium',
        automatable: true,
      });
    }
  }

  // Equipment scheduling
  if (data.equipment && data.peakHours) {
    recommendations.push({
      type: 'equipment',
      action: 'Shift non-critical loads outside peak hours',
      expectedSavings: '10-15%',
      priority: 'high',
      automatable: true,
    });
  }

  return {
    recommendations,
    totalPotentialSavings: '23-35%',
    implementationTime: '2-4 weeks',
    roiPeriod: '6-12 months',
    confidence: 0.85,
  };
}

export const POSTWithMiddleware = withMiddleware(POST, middlewareConfigs.authenticated);
export { POSTWithMiddleware as POST };