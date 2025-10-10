import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/sustainability/replan/actuals
 * Update actual values for monthly metric targets
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const {
      metricTargetId,
      year,
      month,
      actualValue,
      actualEmissions,
      actualEmissionFactor,
      organizationId
    } = await request.json();

    if (!metricTargetId || !year || !month || actualEmissions === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metricTargetId, year, month, actualEmissions' },
        { status: 400 }
      );
    }

    // Verify the metric target belongs to the user's organization
    const { data: metricTarget } = await supabase
      .from('metric_targets')
      .select('organization_id')
      .eq('id', metricTargetId)
      .single();

    if (!metricTarget) {
      return NextResponse.json(
        { error: 'Metric target not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', metricTarget.organization_id)
      .eq('user_id', session.user.id)
      .single();

    if (!membership) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      );
    }

    // Update actual values via database function
    const { data: result, error: updateError } = await supabase
      .rpc('update_metric_actual', {
        p_metric_target_id: metricTargetId,
        p_year: year,
        p_month: month,
        p_actual_value: actualValue,
        p_actual_emissions: actualEmissions,
        p_actual_emission_factor: actualEmissionFactor
      });

    if (updateError) {
      console.error('Update actuals error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update actuals: ' + updateError.message },
        { status: 500 }
      );
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Update failed' },
        { status: 400 }
      );
    }

    // Get updated monthly target with variance
    const { data: updated } = await supabase
      .from('metric_targets_monthly')
      .select('*')
      .eq('metric_target_id', metricTargetId)
      .eq('year', year)
      .eq('month', month)
      .single();

    return NextResponse.json({
      success: true,
      message: 'Actual values updated successfully',
      data: updated
    });

  } catch (error: any) {
    console.error('Error in actuals API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sustainability/replan/actuals
 * Bulk update actual values from metrics_data
 */
export async function PATCH(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { organizationId, targetId, year, month } = await request.json();

    if (!organizationId || !targetId || !year || !month) {
      return NextResponse.json(
        { error: 'Missing required fields: organizationId, targetId, year, month' },
        { status: 400 }
      );
    }

    // Verify user has access
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

    // Get all metric targets for this target
    const { data: metricTargets } = await supabase
      .from('metric_targets')
      .select('id, metric_catalog_id')
      .eq('organization_id', organizationId)
      .eq('target_id', targetId)
      .eq('status', 'active');

    if (!metricTargets || metricTargets.length === 0) {
      return NextResponse.json(
        { error: 'No active metric targets found' },
        { status: 404 }
      );
    }

    const updates = [];
    const errors = [];

    // For each metric target, fetch actual data from metrics_data
    for (const mt of metricTargets) {
      try {
        // Get actual emissions for this metric in this period
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

        const { data: metricsData } = await supabase
          .from('metrics_data')
          .select('value, co2e_emissions')
          .eq('organization_id', organizationId)
          .eq('metric_catalog_id', mt.metric_catalog_id)
          .gte('period_start', startDate)
          .lte('period_start', endDate);

        if (metricsData && metricsData.length > 0) {
          const totalValue = metricsData.reduce((sum, m) => sum + (m.value || 0), 0);
          const totalEmissions = metricsData.reduce((sum, m) => sum + (m.co2e_emissions || 0), 0);

          // Convert kg to tCO2e
          const actualEmissions = totalEmissions / 1000;

          // Update via function
          const { data: result } = await supabase
            .rpc('update_metric_actual', {
              p_metric_target_id: mt.id,
              p_year: year,
              p_month: month,
              p_actual_value: totalValue,
              p_actual_emissions: actualEmissions,
              p_actual_emission_factor: totalValue > 0 ? actualEmissions / totalValue : null
            });

          if (result?.success) {
            updates.push({ metricTargetId: mt.id, actualEmissions });
          } else {
            errors.push({ metricTargetId: mt.id, error: result?.error });
          }
        }
      } catch (err: any) {
        errors.push({ metricTargetId: mt.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} metric actuals`,
      data: {
        updated: updates.length,
        errors: errors.length,
        details: { updates, errors }
      }
    });

  } catch (error: any) {
    console.error('Error in bulk actuals update:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
