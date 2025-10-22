import { NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ReplanningEngine, ReplanningRequest } from '@/lib/sustainability/replanning-engine';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sustainability/replan
 * Execute target replanning with metric-level breakdown
 */
export async function POST(request: Request) {
  try {

    // Check authentication
    // IMPORTANT: Use getUser() not getSession() to validate JWT on server
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body: ReplanningRequest = await request.json();

    // Validate required fields
    if (!body.organizationId || !body.targetId) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, targetId' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', body.organizationId)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Check if user has permission to modify targets (only managers and owners)
    const allowedRoles = ['account_owner', 'sustainability_manager', 'facility_manager'];
    if (!allowedRoles.includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only managers can modify targets.' },
        { status: 403 }
      );
    }

    // Execute replanning
    const result = await ReplanningEngine.replanTargets({
      ...body,
      userId: user.id
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Replanning failed',
          validationErrors: result.validationErrors,
          validationWarnings: result.validationWarnings
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        previousTarget: result.previousTarget,
        newTarget: result.newTarget,
        totalReductionNeeded: result.totalReductionNeeded,
        metricTargets: result.metricTargets,
        recommendedInitiatives: result.recommendedInitiatives,
        totalInvestment: result.totalInvestment,
        validationErrors: result.validationErrors,
        validationWarnings: result.validationWarnings,
        feasibilityScore: result.feasibilityScore,
        monteCarloResults: result.monteCarloResults,
        historyId: result.historyId,
        applied: !!result.historyId
      }
    });

  } catch (error: any) {
    console.error('Error in replanning API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sustainability/replan?organizationId=xxx&targetId=xxx
 * Get current metric targets and replanning history
 */
export async function GET(request: Request) {
  try {

    // Check authentication
    // IMPORTANT: Use getUser() not getSession() to validate JWT on server
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const targetId = searchParams.get('targetId');

    if (!organizationId || !targetId) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, targetId' },
        { status: 400 }
      );
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Get current metric targets
    const { data: metricTargets, error: targetsError } = await supabase
      .from('metric_targets')
      .select(`
        *,
        metrics_catalog (
          id,
          name,
          code,
          category,
          scope,
          unit
        )
      `)
      .eq('organization_id', organizationId)
      .eq('target_id', targetId)
      .eq('status', 'active');

    if (targetsError) {
      console.error('Error fetching metric targets:', targetsError);
    }

    // Get monthly targets with actuals
    const { data: monthlyTargets, error: monthlyError } = await supabase
      .from('metric_targets_monthly')
      .select('*')
      .in('metric_target_id', metricTargets?.map(mt => mt.id) || [])
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    if (monthlyError) {
      console.error('Error fetching monthly targets:', monthlyError);
    }

    // Get initiatives
    const { data: initiatives, error: initiativesError } = await supabase
      .from('reduction_initiatives')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sustainability_target_id', targetId)
      .in('implementation_status', ['planned', 'approved', 'in_progress']);

    if (initiativesError) {
      console.error('Error fetching initiatives:', initiativesError);
    }

    // Get replanning history
    const { data: history, error: historyError } = await supabase
      .from('target_replanning_history')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sustainability_target_id', targetId)
      .order('replanned_at', { ascending: false })
      .limit(10);

    if (historyError) {
      console.error('Error fetching history:', historyError);
    }

    // Get variance analysis
    const { data: varianceData, error: varianceError } = await supabase
      .rpc('get_variance_analysis', {
        p_organization_id: organizationId,
        p_target_id: targetId,
        p_as_of_date: new Date().toISOString().split('T')[0]
      });

    if (varianceError) {
      console.error('Error fetching variance:', varianceError);
    }

    return NextResponse.json({
      success: true,
      data: {
        metricTargets: metricTargets || [],
        monthlyTargets: monthlyTargets || [],
        initiatives: initiatives || [],
        history: history || [],
        variance: varianceData || []
      }
    });

  } catch (error: any) {
    console.error('Error in replanning GET API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
