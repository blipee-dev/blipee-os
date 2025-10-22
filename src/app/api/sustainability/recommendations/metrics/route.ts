import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/sustainability/recommendations/metrics
 * Get intelligent metric recommendations for an organization
 * (What metrics should you start tracking?)
 *
 * Query params:
 * - industry: Industry type (default: 'general')
 * - region: Geographic region (default: 'EU')
 * - size: Organization size category (default: '100-300')
 * - priority: Filter by priority (high, medium, low)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry') || 'general';
    const region = searchParams.get('region') || 'EU';
    const size = searchParams.get('size') || '100-300';
    const priorityFilter = searchParams.get('priority'); // optional


    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: userOrg } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if recommendations already exist for this org
    let { data: existingRecs, error: fetchError } = await supabaseAdmin
      .from('metric_recommendations')
      .select(`
        *,
        metric:metrics_catalog(*)
      `)
      .eq('organization_id', userOrg.organization_id)
      .eq('status', 'pending')
      .order('priority', { ascending: true });

    if (fetchError) {
      console.error('Error fetching recommendations:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }

    // If no recommendations exist, generate them
    if (!existingRecs || existingRecs.length === 0) {

      // Call the generate_recommendations_for_org function
      const { data: generatedRecs, error: genError } = await supabaseAdmin
        .rpc('generate_recommendations_for_org', {
          p_organization_id: userOrg.organization_id,
          p_industry: industry,
          p_region: region,
          p_size_category: size
        });

      if (genError) {
        console.error('Error generating recommendations:', genError);
        return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 });
      }

      // Insert generated recommendations into the table
      if (generatedRecs && generatedRecs.length > 0) {
        const recsToInsert = generatedRecs.map((rec: any) => ({
          organization_id: userOrg.organization_id,
          metric_catalog_id: rec.metric_catalog_id,
          priority: rec.priority,
          recommendation_reason: rec.recommendation_reason,
          peer_adoption_percent: rec.peer_adoption_percent,
          estimated_baseline_value: rec.estimated_baseline_value,
          estimated_baseline_unit: rec.estimated_baseline_unit,
          estimation_method: 'peer_benchmark',
          estimation_confidence: rec.estimation_confidence,
          required_for_frameworks: rec.required_for_frameworks,
          gri_disclosure: rec.gri_disclosure,
          created_by: user.id
        }));

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from('metric_recommendations')
          .insert(recsToInsert)
          .select(`
            *,
            metric:metrics_catalog(*)
          `);

        if (insertError) {
          console.error('Error inserting recommendations:', insertError);
          return NextResponse.json({ error: 'Failed to save recommendations' }, { status: 500 });
        }

        existingRecs = inserted;
      }
    }

    // Filter by priority if requested
    let recommendations = existingRecs || [];
    if (priorityFilter) {
      recommendations = recommendations.filter((r: any) => r.priority === priorityFilter);
    }

    // Group by priority
    const grouped = {
      high: recommendations.filter((r: any) => r.priority === 'high'),
      medium: recommendations.filter((r: any) => r.priority === 'medium'),
      low: recommendations.filter((r: any) => r.priority === 'low')
    };

    return NextResponse.json({
      recommendations: grouped,
      total: recommendations.length,
      metadata: {
        industry,
        region,
        size,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sustainability/recommendations/metrics
 * Accept or dismiss a recommendation
 *
 * Body:
 * {
 *   "recommendation_id": "uuid",
 *   "action": "accept" | "dismiss",
 *   "use_estimate": true,
 *   "restate_baseline": false,
 *   "dismiss_reason": "Not material for our business"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recommendation_id, action, use_estimate = true, restate_baseline = false, dismiss_reason } = body;

    if (!recommendation_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }


    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'accept') {
      // Call the accept_recommendation function
      const { data: result, error } = await supabaseAdmin
        .rpc('accept_recommendation', {
          p_recommendation_id: recommendation_id,
          p_user_id: user.id,
          p_use_estimate: use_estimate,
          p_restate_baseline: restate_baseline
        });

      if (error) {
        console.error('Error accepting recommendation:', error);
        return NextResponse.json({ error: 'Failed to accept recommendation' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Recommendation accepted',
        result
      });
    } else if (action === 'dismiss') {
      // Update recommendation status to dismissed
      const { error } = await supabaseAdmin
        .from('metric_recommendations')
        .update({
          status: 'dismissed',
          dismissed_reason: dismiss_reason,
          dismissed_at: new Date().toISOString()
        })
        .eq('id', recommendation_id);

      if (error) {
        console.error('Error dismissing recommendation:', error);
        return NextResponse.json({ error: 'Failed to dismiss recommendation' }, { status: 500 });
      }

      // Log action
      const { data: rec } = await supabaseAdmin
        .from('metric_recommendations')
        .select('organization_id')
        .eq('id', recommendation_id)
        .single();

      if (rec) {
        await supabaseAdmin
          .from('recommendation_actions')
          .insert({
            recommendation_id,
            organization_id: rec.organization_id,
            action_type: 'dismissed',
            action_details: { reason: dismiss_reason },
            performed_by: user.id
          });
      }

      return NextResponse.json({
        success: true,
        message: 'Recommendation dismissed'
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in recommendations POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
