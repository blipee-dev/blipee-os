import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics/AnalyticsService';
import { ForecastingEngine } from '@/lib/analytics/forecasting/ForecastingEngine';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, method = 'ensemble', horizon = 30, metric } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing data array' },
        { status: 400 }
      );
    }

    const forecastingEngine = new ForecastingEngine();

    // Convert data to time series format
    const timeSeriesData = data.map((item: any) => ({
      timestamp: new Date(item.date || item.timestamp),
      value: item.value || item[metric] || 0,
      metadata: item.metadata
    }));

    // Generate forecast
    const forecasts = await forecastingEngine.forecast(
      timeSeriesData,
      { method, seasonality: 'auto' },
      horizon
    );

    // Calculate accuracy metrics if test data provided
    let accuracy = null;
    if (body.testData) {
      const backtest = await forecastingEngine.backtest(
        timeSeriesData,
        body.testData.length,
        horizon
      );
      accuracy = backtest.accuracy;
    }

    return NextResponse.json({
      success: true,
      forecasts,
      accuracy,
      metadata: {
        method,
        horizon,
        dataPoints: data.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Forecast error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Forecast failed'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const organizationId = searchParams.get('organizationId');
  const metric = searchParams.get('metric') || 'emissions';
  const days = parseInt(searchParams.get('days') || '30');

  if (!organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization ID required' },
      { status: 400 }
    );
  }

  try {
    const analyticsService = new AnalyticsService();

    // Generate comprehensive analytics
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = await analyticsService.generateDashboardAnalytics(
      organizationId,
      { start: startDate, end: endDate }
    );

    return NextResponse.json({
      success: true,
      analytics,
      metadata: {
        organizationId,
        metric,
        timeRange: { start: startDate, end: endDate }
      }
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analytics failed'
      },
      { status: 500 }
    );
  }
}