/**
 * Analytics Insights API
 * GET /api/analytics/insights - Retrieve AI-generated sustainability insights
 * POST /api/analytics/insights/generate - Trigger insight generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyticsEngine } from '@/lib/analytics/analytics-engine';
import { withEnhancedAuth } from '@/middleware/security';
import { withAPIVersioning } from '@/middleware/api-versioning';

async function getAnalyticsInsights(req: NextRequest, context: any) {
  try {
    const { user } = context;
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const insightType = searchParams.get('type') as 'anomaly' | 'trend' | 'prediction' | 'optimization' | 'benchmark' | 'alert' | null;
    const severity = searchParams.get('severity') as 'info' | 'warning' | 'critical' | null;
    const buildingId = searchParams.get('buildingId');
    const dataType = searchParams.get('dataType');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500);
    const offset = parseInt(searchParams.get('offset') || '0');
    const includeExpired = searchParams.get('includeExpired') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const supabase = createClient();

    // Build the query
    let query = supabase
      .from('analytics_insights')
      .select(`
        *,
        buildings (
          id,
          name,
          type
        )
      `)
      .eq('organization_id', user.organizationId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (insightType) {
      query = query.eq('type', insightType);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (buildingId) {
      query = query.eq('building_id', buildingId);
    }

    if (dataType) {
      query = query.contains('data_points', [{ type: dataType }]);
    }

    if (!includeExpired) {
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: insights, error } = await query;

    if (error) {
      throw error;
    }

    // Get summary statistics
    const { data: summaryData } = await supabase
      .from('analytics_insights')
      .select('type, severity')
      .eq('organization_id', user.organizationId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days

    const summary = {
      total: insights?.length || 0,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      last7Days: summaryData?.length || 0
    };

    // Calculate summary statistics
    summaryData?.forEach(insight => {
      summary.byType[insight.type] = (summary.byType[insight.type] || 0) + 1;
      summary.bySeverity[insight.severity] = (summary.bySeverity[insight.severity] || 0) + 1;
    });

    // Get real-time metrics
    const pipelineMetrics = realTimePipeline?.getMetrics() || {};

    return NextResponse.json({
      insights: insights?.map(insight => ({
        ...insight,
        impact: typeof insight.impact === 'string' ? JSON.parse(insight.impact) : insight.impact,
        recommendations: typeof insight.recommendations === 'string' ? JSON.parse(insight.recommendations) : insight.recommendations,
        data_points: typeof insight.data_points === 'string' ? JSON.parse(insight.data_points) : insight.data_points
      })) || [],
      summary,
      pagination: {
        limit,
        offset,
        total: insights?.length || 0,
        hasMore: (insights?.length || 0) === limit
      },
      pipeline: {
        status: 'active',
        metrics: pipelineMetrics
      }
    });

  } catch (error) {
    console.error('Analytics insights retrieval error:', error);
    return NextResponse.json(
      {
        error: 'INSIGHTS_ERROR',
        message: 'Failed to retrieve analytics insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

async function generateInsights(req: NextRequest, context: any) {
  try {
    const { user } = context;
    const body = await req.json();
    
    const {
      dataType,
      buildingId,
      timeRange = '24h',
      analysisType = 'all' // 'anomaly', 'prediction', 'optimization', 'benchmark', 'all'
    } = body;

    if (!dataType) {
      return NextResponse.json(
        { error: 'MISSING_DATA_TYPE', message: 'Data type is required for insight generation' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Calculate time range
    const timeRangeMs: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const rangeMs = timeRangeMs[timeRange] || timeRangeMs['24h'];
    const startTime = new Date(Date.now() - rangeMs);

    // Get recent data points for analysis
    let dataQuery = supabase
      .from('analytics_data_points')
      .select('*')
      .eq('organization_id', user.organizationId)
      .eq('type', dataType)
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (buildingId) {
      dataQuery = dataQuery.eq('building_id', buildingId);
    }

    const { data: dataPoints, error: dataError } = await dataQuery;

    if (dataError) {
      throw dataError;
    }

    if (!dataPoints || dataPoints.length < 10) {
      return NextResponse.json({
        success: false,
        message: `Insufficient data points (${dataPoints?.length || 0}) for meaningful analysis`,
        minimumRequired: 10,
        insights: []
      });
    }


    // Generate insights using the analytics engine
    const insights = [];
    const startProcessingTime = Date.now();

    try {
      // Process each data point through the analytics engine
      // In a real implementation, this would be more efficient
      for (const dataPoint of dataPoints.slice(0, 100)) { // Process latest 100 points
        const analyticsDataPoint = {
          id: dataPoint.id,
          organizationId: dataPoint.organization_id,
          buildingId: dataPoint.building_id,
          timestamp: new Date(dataPoint.timestamp),
          type: dataPoint.type,
          value: dataPoint.value,
          unit: dataPoint.unit,
          source: dataPoint.source,
          metadata: dataPoint.metadata || {}
        };

        try {
          // This would typically be handled by the real-time pipeline
          // For manual insight generation, we process directly
          const generatedInsights = await triggerInsightGeneration(analyticsDataPoint, analysisType);
          insights.push(...generatedInsights);
        } catch (processingError) {
          console.warn(`Failed to process data point ${dataPoint.id}:`, processingError);
        }
      }

      // Remove duplicate insights (same type and similar content)
      const uniqueInsights = deduplicateInsights(insights);

      const processingTime = Date.now() - startProcessingTime;

      // Store insight generation event
      await supabase
        .from('analytics_insight_generations')
        .insert({
          organization_id: user.organizationId,
          user_id: user.id,
          data_type: dataType,
          building_id: buildingId,
          time_range: timeRange,
          analysis_type: analysisType,
          data_points_analyzed: dataPoints.length,
          insights_generated: uniqueInsights.length,
          processing_time_ms: processingTime,
          timestamp: new Date().toISOString()
        });


      return NextResponse.json({
        success: true,
        message: `Generated ${uniqueInsights.length} insights from ${dataPoints.length} data points`,
        results: {
          dataPointsAnalyzed: dataPoints.length,
          insightsGenerated: uniqueInsights.length,
          processingTime: processingTime,
          analysisTypes: getAnalysisTypes(uniqueInsights)
        },
        insights: uniqueInsights,
        metadata: {
          timeRange,
          dataType,
          buildingId,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (processingError) {
      console.error('Insight processing error:', processingError);
      throw processingError;
    }

  } catch (error) {
    console.error('Insight generation error:', error);
    return NextResponse.json(
      {
        error: 'INSIGHT_GENERATION_ERROR',
        message: 'Failed to generate insights',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to trigger insight generation for a data point
 */
async function triggerInsightGeneration(dataPoint: any, analysisType: string) {
  const insights = [];

  try {
    // Simulated insight generation (in production, this would use the actual analytics engine)
    
    if (analysisType === 'all' || analysisType === 'anomaly') {
      // Anomaly detection
      const anomalyInsight = await generateAnomalyInsight(dataPoint);
      if (anomalyInsight) insights.push(anomalyInsight);
    }

    if (analysisType === 'all' || analysisType === 'prediction') {
      // Prediction generation
      const predictionInsight = await generatePredictionInsight(dataPoint);
      if (predictionInsight) insights.push(predictionInsight);
    }

    if (analysisType === 'all' || analysisType === 'optimization') {
      // Optimization recommendations
      const optimizationInsight = await generateOptimizationInsight(dataPoint);
      if (optimizationInsight) insights.push(optimizationInsight);
    }

    if (analysisType === 'all' || analysisType === 'benchmark') {
      // Benchmarking analysis
      const benchmarkInsight = await generateBenchmarkInsight(dataPoint);
      if (benchmarkInsight) insights.push(benchmarkInsight);
    }

    return insights;
  } catch (error) {
    console.error('Failed to generate insights for data point:', error);
    return [];
  }
}

/**
 * Simulated insight generation functions (would be replaced with actual ML models)
 */
async function generateAnomalyInsight(dataPoint: any) {
  // Simulate anomaly detection
  const randomScore = Math.random();
  if (randomScore > 0.8) { // 20% chance of anomaly
    const severity = randomScore > 0.95 ? 'critical' : randomScore > 0.9 ? 'warning' : 'info';
    
    return {
      id: crypto.randomUUID(),
      organizationId: dataPoint.organizationId,
      type: 'anomaly',
      severity,
      title: `${getDataTypeDisplayName(dataPoint.type)} Anomaly Detected`,
      description: `Unusual ${dataPoint.type} reading of ${dataPoint.value} ${dataPoint.unit} detected. This is ${(randomScore * 100).toFixed(1)}% above normal patterns.`,
      confidence: Math.floor(randomScore * 100),
      impact: {
        carbon: dataPoint.value * 0.4, // Estimated carbon impact
        cost: dataPoint.value * 0.12, // Estimated cost impact
        efficiency: Math.floor((randomScore - 0.8) * 50) // Efficiency impact
      },
      recommendations: [
        {
          id: crypto.randomUUID(),
          action: 'investigate_anomaly',
          description: 'Investigate the root cause of this unusual reading',
          effort: 'low',
          impact: 'medium',
          roi: 3,
          automated: false,
          implementation: {
            steps: [
              'Check sensor calibration and functionality',
              'Review operational changes in the time period',
              'Compare with historical patterns'
            ],
            resources: ['Maintenance team', 'Historical data'],
            timeline: '1-2 days'
          }
        }
      ],
      data: [dataPoint],
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
  }
  return null;
}

async function generatePredictionInsight(dataPoint: any) {
  // Simulate prediction generation
  if (Math.random() > 0.7) { // 30% chance of prediction insight
    const trend = (Math.random() - 0.5) * 20; // -10% to +10% trend
    const trendDirection = trend > 0 ? 'increase' : 'decrease';
    
    return {
      id: crypto.randomUUID(),
      organizationId: dataPoint.organizationId,
      type: 'prediction',
      severity: Math.abs(trend) > 5 ? 'warning' : 'info',
      title: `${getDataTypeDisplayName(dataPoint.type)} Trend Forecast`,
      description: `Based on current patterns, ${dataPoint.type} is predicted to ${trendDirection} by ${Math.abs(trend).toFixed(1)}% over the next 7 days.`,
      confidence: 75 + Math.random() * 20, // 75-95% confidence
      impact: {
        carbon: Math.abs(trend) * dataPoint.value * 0.4 / 100,
        cost: Math.abs(trend) * dataPoint.value * 0.12 / 100,
        efficiency: Math.abs(trend)
      },
      recommendations: trend > 5 ? [
        {
          id: crypto.randomUUID(),
          action: 'proactive_optimization',
          description: 'Implement proactive measures to counter the predicted increase',
          effort: 'medium',
          impact: 'high',
          roi: 6,
          automated: true,
          implementation: {
            steps: [
              'Activate efficiency protocols',
              'Schedule preventive maintenance',
              'Optimize operational parameters'
            ],
            resources: ['Optimization algorithms', 'Automation systems'],
            timeline: '1 week'
          }
        }
      ] : [],
      data: [dataPoint],
      createdAt: new Date()
    };
  }
  return null;
}

async function generateOptimizationInsight(dataPoint: any) {
  // Simulate optimization recommendation
  if (Math.random() > 0.6) { // 40% chance of optimization insight
    const potentialSavings = dataPoint.value * (0.05 + Math.random() * 0.25); // 5-30% savings
    
    return {
      id: crypto.randomUUID(),
      organizationId: dataPoint.organizationId,
      type: 'optimization',
      severity: potentialSavings > dataPoint.value * 0.15 ? 'warning' : 'info',
      title: `${getDataTypeDisplayName(dataPoint.type)} Optimization Opportunity`,
      description: `Analysis shows potential to reduce ${dataPoint.type} consumption by ${(potentialSavings/dataPoint.value*100).toFixed(1)}% through optimization measures.`,
      confidence: 80 + Math.random() * 15, // 80-95% confidence
      impact: {
        carbon: potentialSavings * 0.4,
        cost: potentialSavings * 0.12,
        efficiency: (potentialSavings/dataPoint.value) * 100
      },
      recommendations: [
        {
          id: crypto.randomUUID(),
          action: 'implement_optimization',
          description: 'Apply AI-driven optimization recommendations',
          effort: 'medium',
          impact: 'high',
          roi: 8,
          automated: true,
          implementation: {
            steps: [
              'Enable AI optimization algorithms',
              'Configure efficiency parameters',
              'Monitor and adjust performance'
            ],
            resources: ['AI optimization engine', 'Monitoring systems'],
            timeline: '2-4 weeks'
          }
        }
      ],
      data: [dataPoint],
      createdAt: new Date()
    };
  }
  return null;
}

async function generateBenchmarkInsight(dataPoint: any) {
  // Simulate benchmarking analysis
  if (Math.random() > 0.8) { // 20% chance of benchmark insight
    const percentile = Math.random() * 100;
    const isGood = percentile < 25;
    const isBad = percentile > 75;
    
    if (isGood || isBad) {
      return {
        id: crypto.randomUUID(),
        organizationId: dataPoint.organizationId,
        type: 'benchmark',
        severity: isBad ? 'warning' : 'info',
        title: `${getDataTypeDisplayName(dataPoint.type)} Benchmark Analysis`,
        description: isGood 
          ? `Excellent performance! Your ${dataPoint.type} efficiency ranks in the top 25% of similar organizations.`
          : `Your ${dataPoint.type} usage is in the ${Math.floor(percentile)}th percentile. There's room for improvement.`,
        confidence: 85,
        impact: isBad ? {
          carbon: dataPoint.value * 0.2,
          cost: dataPoint.value * 0.08,
          efficiency: 25
        } : {
          carbon: 0,
          cost: 0,
          efficiency: 0
        },
        recommendations: isBad ? [
          {
            id: crypto.randomUUID(),
            action: 'benchmark_improvement',
            description: 'Implement best practices from top-performing organizations',
            effort: 'high',
            impact: 'high',
            roi: 12,
            automated: false,
            implementation: {
              steps: [
                'Analyze best-in-class performance patterns',
                'Implement proven efficiency strategies',
                'Monitor progress against benchmarks'
              ],
              resources: ['Best practice database', 'Implementation team'],
              timeline: '3-6 months'
            }
          }
        ] : [],
        data: [dataPoint],
        createdAt: new Date()
      };
    }
  }
  return null;
}

/**
 * Utility functions
 */
function getDataTypeDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    'energy': 'Energy Usage',
    'water': 'Water Consumption', 
    'waste': 'Waste Generation',
    'emissions': 'Carbon Emissions',
    'temperature': 'Temperature',
    'occupancy': 'Occupancy',
    'air_quality': 'Air Quality'
  };
  return displayNames[type] || type.charAt(0).toUpperCase() + type.slice(1);
}

function deduplicateInsights(insights: any[]): any[] {
  const seen = new Set();
  return insights.filter(insight => {
    const key = `${insight.type}-${insight.title}-${insight.organizationId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getAnalysisTypes(insights: any[]): Record<string, number> {
  const types: Record<string, number> = {};
  insights.forEach(insight => {
    types[insight.type] = (types[insight.type] || 0) + 1;
  });
  return types;
}

const GET = withAPIVersioning(
  withEnhancedAuth(getAnalyticsInsights, {
    requireRole: ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst'],
    enableThreatDetection: false
  })
);

const POST = withAPIVersioning(
  withEnhancedAuth(generateInsights, {
    requireRole: ['account_owner', 'sustainability_manager', 'facility_manager'],
    enableThreatDetection: false
  })
);

export { GET, POST };