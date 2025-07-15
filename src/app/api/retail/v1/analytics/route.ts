import { NextRequest, NextResponse } from 'next/server';
import { withRetailPermission } from '@/lib/auth/retail-middleware';
import { RETAIL_PERMISSIONS } from '@/lib/auth/retail-permissions';
import { retailAnalyticsEngine } from '@/lib/retail/analytics-engine';

// Protected GET handler with real analytics
async function handleGetAnalytics(request: NextRequest, context: any) {
  try {
    const { searchParams } = new URL(request.url);
    const loja = searchParams.get('loja');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const useCache = searchParams.get('use_cache') === 'true';

    if (!loja || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: loja, start_date, end_date' },
        { status: 400 }
      );
    }

    // Add audit log for analytics access
    console.log(`Analytics accessed by ${context.user.email} for store ${loja}`);

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Try to get cached data first if requested
    let analyticsData;
    if (useCache) {
      analyticsData = await retailAnalyticsEngine.getCachedAnalytics(loja, start, end);
    }

    // If no cached data or cache not requested, calculate real-time
    if (!analyticsData) {
      try {
        analyticsData = await retailAnalyticsEngine.calculateAnalytics(loja, start, end);
      } catch (error) {
        console.error('Error calculating analytics:', error);
        return NextResponse.json(
          { error: 'Failed to calculate analytics', details: error.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      permissions: context.permissions,
      user: context.user.email,
      cached: useCache && analyticsData
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    );
  }
}

export const GET = withRetailPermission(RETAIL_PERMISSIONS.ANALYTICS, handleGetAnalytics);

// Protected POST handler
async function handlePostAnalytics(request: NextRequest, context: any) {
  try {
    const body = await request.json();
    const { loja, start_date, end_date, metric_type = 'all' } = body;

    if (!loja || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required parameters: loja, start_date, end_date' },
        { status: 400 }
      );
    }

    // Add audit log for analytics access
    console.log(`Analytics POST accessed by ${context.user.email} for store ${loja}`);

    // Generate mock analytics data
    const analyticsData = generateMockAnalytics(loja, start_date, end_date);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      permissions: context.permissions,
      user: context.user.email,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export const POST = withRetailPermission(RETAIL_PERMISSIONS.ANALYTICS, handlePostAnalytics);