import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculateFeasibility, type FeasibilityInput } from '@/lib/sustainability/feasibility-calculator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

/**
 * GET /api/sustainability/targets/feasibility
 *
 * Calculates feasibility of hitting annual target based on YTD performance
 *
 * Query params:
 * - organizationId: UUID
 * - targetId: UUID (optional - uses first target if not provided)
 * - year: number (optional - defaults to current year)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const targetId = searchParams.get('targetId');
    const yearParam = searchParams.get('year');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Missing organizationId parameter' },
        { status: 400 }
      );
    }

    // Determine year and month
    const now = new Date();
    const currentYear = yearParam ? parseInt(yearParam) : now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-12


    // Get target
    let resolvedTargetId = targetId;
    if (!resolvedTargetId) {
      const { data: targets, error: targetsError } = await supabaseAdmin
        .from('sustainability_targets')
        .select('id, baseline_year, baseline_emissions, target_year, target_emissions')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (targetsError || !targets || targets.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'No targets found for organization'
        }, { status: 404 });
      }

      resolvedTargetId = targets[0].id;
    }

    // Fetch target details
    const { data: target, error: targetError } = await supabaseAdmin
      .from('sustainability_targets')
      .select('baseline_year, baseline_emissions, target_year, target_emissions, baseline_value, target_value')
      .eq('id', resolvedTargetId)
      .single();

    if (targetError || !target) {
      return NextResponse.json(
        { error: 'Target not found' },
        { status: 404 }
      );
    }

    // Calculate annual target for the specified year (linear reduction)
    const totalReduction = target.baseline_emissions - target.target_emissions;
    const yearsToTarget = target.target_year - target.baseline_year;
    const annualReduction = totalReduction / yearsToTarget;
    const yearsFromBaseline = currentYear - target.baseline_year;
    const annualTarget = target.baseline_emissions - (annualReduction * yearsFromBaseline);


    // Get YTD actual emissions
    const startOfYear = `${currentYear}-01-01`;
    const endOfCurrentMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${new Date(currentYear, currentMonth, 0).getDate()}`;

    const { data: ytdData, error: ytdError } = await supabaseAdmin
      .from('metrics_data')
      .select('co2e_emissions')
      .eq('organization_id', organizationId)
      .gte('period_start', startOfYear)
      .lte('period_start', endOfCurrentMonth);

    if (ytdError) {
      console.error('Error fetching YTD data:', ytdError);
      return NextResponse.json(
        { error: 'Failed to fetch YTD emissions data' },
        { status: 500 }
      );
    }

    const ytdActualEmissions = ytdData?.reduce((sum, row) => sum + (parseFloat(row.co2e_emissions as any) || 0), 0) || 0;


    // Calculate feasibility
    const feasibilityInput: FeasibilityInput = {
      currentYear,
      currentMonth,
      ytdActualEmissions,
      annualTarget,
      baselineYear: target.baseline_year,
      baselineEmissions: target.baseline_emissions,
      targetYear: target.target_year,
      targetEmissions: target.target_emissions
    };

    const feasibility = calculateFeasibility(feasibilityInput);


    return NextResponse.json({
      success: true,
      feasibility,
      context: {
        organizationId,
        targetId: resolvedTargetId,
        currentYear,
        currentMonth,
        annualTarget
      }
    });

  } catch (error) {
    console.error('Error in feasibility API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
