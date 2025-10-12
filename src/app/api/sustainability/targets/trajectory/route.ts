import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

/**
 * GET /api/sustainability/targets/trajectory
 *
 * Returns the replanned monthly trajectory for a target if it exists.
 * Falls back to null if no replanning has occurred.
 *
 * Query params:
 * - organizationId: UUID
 * - targetId: UUID (optional - uses first target if not provided)
 * - startYear: number (optional - defaults to current year)
 * - endYear: number (optional - defaults to target year)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const targetId = searchParams.get('targetId');
    const startYear = searchParams.get('startYear');
    const endYear = searchParams.get('endYear');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Get the target (use provided targetId or fetch the first active target)
    let resolvedTargetId = targetId;

    if (!resolvedTargetId) {
      const { data: targets, error: targetsError } = await supabaseAdmin
        .from('sustainability_targets')
        .select('id')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (targetsError || !targets || targets.length === 0) {
        return NextResponse.json({
          success: true,
          hasReplanning: false,
          trajectory: null,
          message: 'No targets found for organization'
        });
      }

      resolvedTargetId = targets[0].id;
    }

    // Check if there's any replanning history
    const { data: replanningHistory, error: historyError } = await supabaseAdmin
      .from('target_replanning_history')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('sustainability_target_id', resolvedTargetId)
      .order('replanned_at', { ascending: false })
      .limit(1);

    if (historyError) {
      console.error('Error fetching replanning history:', historyError);
      return NextResponse.json(
        { error: 'Failed to fetch replanning history' },
        { status: 500 }
      );
    }

    if (!replanningHistory || replanningHistory.length === 0) {
      return NextResponse.json({
        success: true,
        hasReplanning: false,
        trajectory: null,
        message: 'No replanning found for this target'
      });
    }

    // Fetch metric targets for this sustainability target
    const { data: metricTargets, error: metricTargetsError } = await supabaseAdmin
      .from('metric_targets')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('target_id', resolvedTargetId)
      .eq('status', 'active');

    if (metricTargetsError || !metricTargets || metricTargets.length === 0) {
      return NextResponse.json({
        success: true,
        hasReplanning: true,
        trajectory: null,
        message: 'Replanning exists but no active metric targets found'
      });
    }

    const metricTargetIds = metricTargets.map(mt => mt.id);

    // Fetch monthly planned emissions for all metric targets
    let query = supabaseAdmin
      .from('metric_targets_monthly')
      .select('year, month, planned_emissions')
      .in('metric_target_id', metricTargetIds)
      .order('year', { ascending: true })
      .order('month', { ascending: true });

    // Apply year filters if provided
    if (startYear) {
      query = query.gte('year', parseInt(startYear));
    }
    if (endYear) {
      query = query.lte('year', parseInt(endYear));
    }

    const { data: monthlyTargets, error: monthlyError } = await query;

    if (monthlyError) {
      console.error('Error fetching monthly targets:', monthlyError);
      return NextResponse.json(
        { error: 'Failed to fetch monthly targets' },
        { status: 500 }
      );
    }

    if (!monthlyTargets || monthlyTargets.length === 0) {
      return NextResponse.json({
        success: true,
        hasReplanning: true,
        trajectory: null,
        message: 'Replanning exists but no monthly targets defined yet'
      });
    }

    // Aggregate emissions by month (sum across all metrics)
    const trajectoryMap = new Map<string, number>();

    monthlyTargets.forEach(mt => {
      const key = `${mt.year}-${String(mt.month).padStart(2, '0')}`;
      const currentTotal = trajectoryMap.get(key) || 0;
      trajectoryMap.set(key, currentTotal + (parseFloat(mt.planned_emissions as any) || 0));
    });

    // Convert to array format
    const trajectory = Array.from(trajectoryMap.entries())
      .map(([key, emissions]) => {
        const [year, month] = key.split('-');
        return {
          year: parseInt(year),
          month: parseInt(month),
          plannedEmissions: emissions
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

    return NextResponse.json({
      success: true,
      hasReplanning: true,
      trajectory,
      replanningDate: replanningHistory[0].replanned_at,
      replanningTrigger: replanningHistory[0].replanning_trigger,
      message: `Found ${trajectory.length} months of replanned trajectory data`
    });

  } catch (error) {
    console.error('Error in trajectory API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
