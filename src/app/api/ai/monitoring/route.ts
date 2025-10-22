import { NextRequest, NextResponse } from 'next/server';
import { vercelAIService } from '@/lib/ai/vercel-ai-service';

/**
 * AI Service Monitoring API
 *
 * GET /api/ai/monitoring
 * Returns usage statistics and provider status
 */

export async function GET(request: NextRequest) {
  try {
    // Get provider status
    const providerStatus = vercelAIService.getProviderStatus();

    // Get usage statistics
    const usageStats = vercelAIService.getUsageStats();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      providers: providerStatus,
      usage: usageStats,
      recommendations: generateRecommendations(usageStats, providerStatus),
    });

  } catch (error) {
    console.error('Monitoring API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch monitoring data',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai/monitoring/reset
 * Reset usage statistics
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'reset') {
      vercelAIService.resetUsageStats();

      return NextResponse.json({
        success: true,
        message: 'Usage statistics reset successfully',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action',
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('Monitoring API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process request',
      },
      { status: 500 }
    );
  }
}

/**
 * Generate recommendations based on usage patterns
 */
function generateRecommendations(
  usage: any,
  providerStatus: any
): string[] {
  const recommendations: string[] = [];

  // Cost optimization
  if (usage.averageCostPerRequest > 0.02) {
    recommendations.push(
      '💡 Consider using more conversational queries instead of structured outputs to reduce costs'
    );
  }

  // Provider usage
  const providerCounts = usage.byProvider || {};
  const totalRequests = usage.totalRequests || 0;

  if (totalRequests > 0) {
    const deepseekPercent = ((providerCounts.DeepSeek || 0) / totalRequests) * 100;

    if (deepseekPercent < 50 && providerStatus.routing.conversational === 'DeepSeek') {
      recommendations.push(
        '📊 You could save more by using conversational queries (currently only ' +
        `${deepseekPercent.toFixed(0)}% of requests)`
      );
    }
  }

  // Reliability
  const enabledProviders = providerStatus.enabled || 0;
  if (enabledProviders < 2) {
    recommendations.push(
      '⚠️ Enable more providers for better reliability and automatic fallback'
    );
  }

  // Estimated monthly cost
  if (totalRequests > 100) {
    const estimatedMonthly = (usage.estimatedCost / totalRequests) * 10000; // Estimate for 10K requests
    recommendations.push(
      `📈 Projected cost for 10K requests/month: $${estimatedMonthly.toFixed(2)}`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Your AI usage is optimized! Keep up the good work.');
  }

  return recommendations;
}
