import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { sustainabilityIntelligence } from '@/lib/ai/sustainability-intelligence';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sustainability/intelligence
 *
 * Enrich dashboard data with AI intelligence from autonomous agents.
 *
 * This endpoint orchestrates multiple AI agents in parallel to provide:
 * - Insights (trends, anomalies, opportunities, risks, compliance)
 * - Recommendations (actionable improvements with impact estimates)
 * - Alerts (critical items requiring immediate attention)
 *
 * Uses intelligent 5-minute caching to reduce API costs and improve performance.
 *
 * Request Body:
 * {
 *   dashboardType: 'emissions' | 'energy' | 'compliance' | 'targets' | 'overview',
 *   rawData?: any  // Optional raw dashboard data for context
 * }
 *
 * Response:
 * {
 *   dashboardType: string
 *   organizationId: string
 *   insights: AgentInsight[]
 *   recommendations: AgentRecommendation[]
 *   alerts: AgentAlert[]
 *   metrics: IntelligenceMetrics
 *   generatedAt: string
 *   cacheHit: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    const { dashboardType, rawData } = body;

    // 4. Validate dashboard type
    const validDashboardTypes = ['emissions', 'energy', 'compliance', 'targets', 'overview'];
    if (!dashboardType || !validDashboardTypes.includes(dashboardType)) {
      return NextResponse.json(
        {
          error: 'Invalid dashboard type',
          validTypes: validDashboardTypes
        },
        { status: 400 }
      );
    }

    console.log(`[Intelligence API] Enriching ${dashboardType} dashboard for org ${orgInfo.organizationId}`);

    // 5. Get intelligence from orchestration layer
    const intelligence = await sustainabilityIntelligence.enrichDashboardData(
      dashboardType,
      orgInfo.organizationId,
      rawData
    );

    console.log(`[Intelligence API] Generated ${intelligence.insights.length} insights, ${intelligence.recommendations.length} recommendations (cache hit: ${intelligence.cacheHit})`);

    // 6. Return intelligence with cache control headers
    return NextResponse.json(intelligence, {
      headers: {
        'Cache-Control': 'private, max-age=300', // 5 minutes client-side cache
        'X-Cache-Hit': intelligence.cacheHit ? 'true' : 'false',
        'X-Agents-Executed': String(intelligence.metrics.agentsExecuted),
        'X-Execution-Time-Ms': String(intelligence.metrics.executionTimeMs)
      }
    });

  } catch (error: any) {
    console.error('[Intelligence API] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate intelligence',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sustainability/intelligence
 *
 * Get cache statistics for monitoring
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get cache stats
    const stats = sustainabilityIntelligence.getCacheStats();

    return NextResponse.json({
      cacheSize: stats.size,
      cachedOrganizations: stats.entries.length,
      entries: stats.entries
    });

  } catch (error: any) {
    console.error('[Intelligence API] Error getting cache stats:', error);
    return NextResponse.json(
      { error: 'Failed to get cache stats', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sustainability/intelligence
 *
 * Clear cache (for testing or manual refresh)
 *
 * Query parameters:
 * - organizationId: Clear cache for specific org
 * - dashboardType: Clear specific dashboard cache
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId') || undefined;
    const dashboardType = searchParams.get('dashboardType') || undefined;

    // Clear cache
    sustainabilityIntelligence.clearCache(organizationId, dashboardType);

    return NextResponse.json({
      success: true,
      message: organizationId
        ? `Cache cleared for organization ${organizationId}${dashboardType ? ` dashboard ${dashboardType}` : ''}`
        : 'All cache cleared'
    });

  } catch (error: any) {
    console.error('[Intelligence API] Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error.message },
      { status: 500 }
    );
  }
}
