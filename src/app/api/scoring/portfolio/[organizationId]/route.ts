/**
 * API Endpoint: Calculate and retrieve portfolio performance score
 *
 * GET  /api/scoring/portfolio/[organizationId] - Get latest portfolio score (with automatic cache invalidation)
 * GET  /api/scoring/portfolio/[organizationId]?force=true - Force recalculation (bypass cache)
 * POST /api/scoring/portfolio/[organizationId] - Recalculate portfolio score
 *
 * Cache Strategy:
 * - Scores are cached for CACHE_TTL_MINUTES (default: 5 minutes)
 * - After TTL expires, scores are automatically recalculated on next request
 * - Use ?force=true to immediately recalculate without waiting for TTL
 * - Development: Set CACHE_TTL_MINUTES to 0 to disable caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { performanceScorer } from '@/lib/ai/performance-scoring/blipee-performance-index';

// Cache configuration
const CACHE_TTL_MINUTES = 5; // Set to 0 to disable caching, or increase for production

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    console.log('🎯 Portfolio scoring API called for org:', params.organizationId);

    // Verify user has access to this organization
    const user = await getAPIUser(request);
    if (!user) {
      console.log('❌ No user found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.id);
    const { organizationId } = params;

    // Check user access
    const { data: userOrg } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!userOrg) {
      console.log('❌ User does not have access to org');
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('✅ User has access to organization');

    // Check for force refresh parameter
    const searchParams = request.nextUrl.searchParams;
    const forceRefresh = searchParams.get('force') === 'true';

    if (forceRefresh) {
      console.log('🔄 Force refresh requested, skipping cache');
    }

    // Get latest portfolio score from database
    console.log('🔍 Looking for existing portfolio score...');
    const { data: latestScore } = await supabaseAdmin
      .from('performance_scores')
      .select(`
        *,
        category_scores (*)
      `)
      .eq('organization_id', organizationId)
      .eq('is_portfolio_score', true)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    // Check if we should recalculate based on cache TTL
    const CACHE_TTL_MS = CACHE_TTL_MINUTES * 60 * 1000;
    const now = new Date();
    const shouldRecalculate = !latestScore
      || forceRefresh
      || (CACHE_TTL_MINUTES > 0 && new Date(now.getTime() - new Date(latestScore.calculated_at).getTime()).getTime() > CACHE_TTL_MS);

    if (shouldRecalculate) {
      if (!latestScore) {
        console.log('📊 No existing score found, calculating new portfolio score...');
      } else if (forceRefresh) {
        console.log('📊 Force refresh requested, recalculating portfolio score...');
      } else {
        const ageMinutes = Math.floor((now.getTime() - new Date(latestScore.calculated_at).getTime()) / 60000);
        console.log(`📊 Score is ${ageMinutes} minutes old (TTL: ${CACHE_TTL_MINUTES} min), recalculating...`);
      }

      // Calculate new score
      const score = await performanceScorer.calculatePortfolioScore(organizationId);
      console.log('✅ Portfolio score calculated:', score.overallScore);

      // Save to database
      const { data: savedScore } = await supabaseAdmin
        .from('performance_scores')
        .insert({
          organization_id: organizationId,
          is_portfolio_score: true,
          overall_score: score.overallScore,
          grade: score.grade,
          improvement_velocity: score.improvementVelocity,
          predicted_score_90_days: score.predictedScore90Days,
          peer_percentile: score.peerPercentile,
          rolling_7_day_score: score.timeSeriesScores.rolling7Day,
          rolling_30_day_score: score.timeSeriesScores.rolling30Day,
          rolling_90_day_score: score.timeSeriesScores.rolling90Day,
          rolling_365_day_score: score.timeSeriesScores.rolling365Day,
          data_completeness: score.dataCompleteness,
          confidence_level: score.confidenceLevel,
        })
        .select()
        .single();

      // Save category scores
      if (savedScore) {
        const categoryScoreInserts = Object.entries(score.categoryScores).map(
          ([category, categoryScore]) => ({
            performance_score_id: savedScore.id,
            site_id: null, // Portfolio scores aggregate across sites
            category,
            raw_score: categoryScore.rawScore,
            weighted_score: categoryScore.weightedScore,
            weight: categoryScore.weight,
            percentile: categoryScore.percentile,
            trend: categoryScore.trend,
            trend_value: categoryScore.trendValue,
            data_points: categoryScore.dataPoints,
            sub_scores: categoryScore.subScores,
            insights: categoryScore.insights,
          })
        );

        await supabaseAdmin.from('category_scores').insert(categoryScoreInserts);
      }

      return NextResponse.json(score);
    }

    // Return cached score
    const ageMinutes = Math.floor((now.getTime() - new Date(latestScore.calculated_at).getTime()) / 60000);
    console.log(`✅ Returning cached portfolio score: ${latestScore.overall_score}/100 (age: ${ageMinutes} min, TTL: ${CACHE_TTL_MINUTES} min)`);

    // Transform database format to API format
    const response = transformDatabaseScore(latestScore);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error fetching portfolio performance score:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch portfolio performance score', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Verify user has access
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId } = params;

    // Check access
    const { data: userOrg } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate new portfolio score
    const score = await performanceScorer.calculatePortfolioScore(organizationId);

    // Save to database
    const { data: savedScore } = await supabaseAdmin
      .from('performance_scores')
      .insert({
        organization_id: organizationId,
        is_portfolio_score: true,
        overall_score: score.overallScore,
        grade: score.grade,
        improvement_velocity: score.improvementVelocity,
        predicted_score_90_days: score.predictedScore90Days,
        peer_percentile: score.peerPercentile,
        rolling_7_day_score: score.timeSeriesScores.rolling7Day,
        rolling_30_day_score: score.timeSeriesScores.rolling30Day,
        rolling_90_day_score: score.timeSeriesScores.rolling90Day,
        rolling_365_day_score: score.timeSeriesScores.rolling365Day,
        data_completeness: score.dataCompleteness,
        confidence_level: score.confidenceLevel,
      })
      .select()
      .single();

    // Save category scores
    if (savedScore) {
      const categoryScoreInserts = Object.entries(score.categoryScores).map(
        ([category, categoryScore]) => ({
          performance_score_id: savedScore.id,
          site_id: null, // Portfolio scores aggregate across sites
          category,
          raw_score: categoryScore.rawScore,
          weighted_score: categoryScore.weightedScore,
          weight: categoryScore.weight,
          percentile: categoryScore.percentile,
          trend: categoryScore.trend,
          trend_value: categoryScore.trendValue,
          data_points: categoryScore.dataPoints,
          sub_scores: categoryScore.subScores,
          insights: categoryScore.insights,
        })
      );

      await supabaseAdmin.from('category_scores').insert(categoryScoreInserts);
    }

    return NextResponse.json(score);
  } catch (error: any) {
    console.error('Error calculating portfolio performance score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate portfolio performance score', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to transform database format to API format
function transformDatabaseScore(dbScore: any): any {
  return {
    overallScore: dbScore.overall_score,
    grade: dbScore.grade,
    categoryScores: dbScore.category_scores.reduce((acc: any, cat: any) => {
      acc[cat.category] = {
        rawScore: cat.raw_score,
        weightedScore: cat.weighted_score,
        weight: cat.weight,
        percentile: cat.percentile,
        trend: cat.trend,
        trendValue: cat.trend_value,
        dataPoints: cat.data_points,
        lastUpdated: cat.last_updated,
        subScores: cat.sub_scores,
        insights: cat.insights,
        recommendations: [],
      };
      return acc;
    }, {}),
    improvementVelocity: parseFloat(dbScore.improvement_velocity),
    predictedScore90Days: dbScore.predicted_score_90_days,
    peerPercentile: dbScore.peer_percentile,
    timeSeriesScores: {
      realTime: dbScore.overall_score,
      rolling7Day: dbScore.rolling_7_day_score,
      rolling30Day: dbScore.rolling_30_day_score,
      rolling90Day: dbScore.rolling_90_day_score,
      rolling365Day: dbScore.rolling_365_day_score,
      predicted30Day: dbScore.predicted_score_30_days,
      predicted90Day: dbScore.predicted_score_90_days,
      predicted365Day: dbScore.predicted_score_365_days,
      confidenceInterval95: [0, 0],
      historicalScores: [],
    },
    portfolioMetrics: {}, // Would be populated from database
    topOpportunities: [],
    calculatedAt: dbScore.calculated_at,
    dataCompleteness: dbScore.data_completeness,
    confidenceLevel: dbScore.confidence_level,
  };
}
