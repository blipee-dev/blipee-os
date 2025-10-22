/**
 * API Endpoint: Calculate and retrieve site performance score
 *
 * GET  /api/scoring/site/[siteId] - Get latest score
 * POST /api/scoring/site/[siteId] - Recalculate score
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { performanceScorer } from '@/lib/ai/performance-scoring/blipee-performance-index';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    // Verify user has access to this site
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await params;
    console.log('🎯 Site scoring API called for site:', siteId);

    // Check if user has access to this site's organization
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { data: userOrg } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', site.organization_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get latest score from database
    const { data: latestScores } = await supabaseAdmin
      .from('performance_scores')
      .select(`
        *,
        category_scores (*)
      `)
      .eq('site_id', siteId)
      .order('calculated_at', { ascending: false })
      .limit(1);

    const latestScore = latestScores?.[0];

    console.log('📊 Latest score query result:', { found: !!latestScore, count: latestScores?.length });

    if (!latestScore) {
      console.log('📊 No existing score found, calculating new site score...');
      // No score exists, calculate one
      const score = await performanceScorer.calculateSiteScore(siteId);
      console.log('✅ Site score calculated:', score.overallScore);

      // Save to database
      const { data: savedScore } = await supabaseAdmin
        .from('performance_scores')
        .insert({
          site_id: siteId,
          organization_id: site.organization_id,
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
            site_id: siteId,
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

        // Save opportunities
        if (score.topOpportunities && score.topOpportunities.length > 0) {
          const opportunityInserts = score.topOpportunities.map(opp => ({
            performance_score_id: savedScore.id,
            category: opp.category,
            action: opp.action,
            potential_points: opp.potentialPoints,
            estimated_cost: opp.estimatedCost,
            payback_months: opp.paybackMonths === 'immediate' ? null : opp.paybackMonths,
            priority: opp.priority,
            difficulty: opp.difficulty,
          }));

          await supabaseAdmin.from('score_opportunities').insert(opportunityInserts);
        }
      }

      return NextResponse.json(score);
    }

    // Transform database format to API format
    const response = transformDatabaseScore(latestScore);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('❌ Error in site scoring API:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    return NextResponse.json(
      { error: 'Failed to fetch performance score', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    // Verify user has access
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await params;

    // Check access
    const { data: site } = await supabaseAdmin
      .from('sites')
      .select('organization_id')
      .eq('id', siteId)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }

    const { data: userOrg } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('organization_id', site.organization_id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse options from request body
    const body = await request.json().catch(() => ({}));
    const options = {
      timeWindow: body.timeWindow || 365,
      includeForecasts: body.includeForecasts !== false,
      industryOverride: body.industryOverride,
    };

    // Calculate new score
    const score = await performanceScorer.calculateSiteScore(siteId, options);

    // Save to database
    const { data: savedScore } = await supabaseAdmin
      .from('performance_scores')
      .insert({
        site_id: siteId,
        organization_id: site.organization_id,
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
          site_id: siteId,
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

      // Save opportunities
      if (score.topOpportunities && score.topOpportunities.length > 0) {
        const opportunityInserts = score.topOpportunities.map(opp => ({
          performance_score_id: savedScore.id,
          category: opp.category,
          action: opp.action,
          potential_points: opp.potentialPoints,
          estimated_cost: opp.estimatedCost,
          payback_months: opp.paybackMonths === 'immediate' ? null : opp.paybackMonths,
          priority: opp.priority,
          difficulty: opp.difficulty,
        }));

        await supabaseAdmin.from('score_opportunities').insert(opportunityInserts);
      }
    }

    return NextResponse.json(score);
  } catch (error: any) {
    console.error('Error calculating performance score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate performance score', details: error.message },
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
    topOpportunities: [],
    calculatedAt: dbScore.calculated_at,
    dataCompleteness: dbScore.data_completeness,
    confidenceLevel: dbScore.confidence_level,
  };
}
