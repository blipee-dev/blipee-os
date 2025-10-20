import { NextRequest, NextResponse } from 'next/server';
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Test endpoint for UnifiedSustainabilityCalculator
 *
 * GET /api/sustainability/unified-test?organizationId=xxx&domain=energy
 *
 * Returns complete calculation results for testing
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const domain = searchParams.get('domain') as 'energy' | 'water' | 'waste' | 'emissions';

    if (!organizationId || !domain) {
      return NextResponse.json(
        { error: 'Missing required parameters: organizationId, domain' },
        { status: 400 }
      );
    }

    if (!['energy', 'water', 'waste', 'emissions'].includes(domain)) {
      return NextResponse.json(
        { error: 'Invalid domain. Must be: energy, water, waste, or emissions' },
        { status: 400 }
      );
    }

    // Create calculator instance
    const calculator = new UnifiedSustainabilityCalculator(organizationId);

    // Get sustainability target configuration
    const target = await calculator.getSustainabilityTarget();

    if (!target) {
      return NextResponse.json(
        {
          error: 'No sustainability target found for organization',
          hint: 'Create a sustainability target first'
        },
        { status: 404 }
      );
    }

    // Run all calculations
    const [baseline, targetValue, projected, progress] = await Promise.all([
      calculator.getBaseline(domain),
      calculator.getTarget(domain),
      calculator.getProjected(domain),
      calculator.calculateProgressToTarget(domain),
    ]);

    // Return comprehensive results
    return NextResponse.json({
      success: true,
      organizationId,
      domain,
      targetConfiguration: {
        baseline_year: target.baseline_year,
        target_year: new Date().getFullYear(),
        energy_reduction_percent: target.energy_reduction_percent,
        water_reduction_percent: target.water_reduction_percent,
        waste_reduction_percent: target.waste_reduction_percent,
        emissions_reduction_percent: target.emissions_reduction_percent,
      },
      calculations: {
        baseline: baseline || { error: 'No baseline data available' },
        target: targetValue || { error: 'Could not calculate target' },
        projected: projected || { error: 'Could not calculate projected' },
        progress: progress || { error: 'Could not calculate progress' },
      },
      formula: {
        description: 'Linear reduction formula',
        calculation: `target = baseline × (1 - rate × years)`,
        example: targetValue ? {
          baseline: baseline?.value,
          rate: domain === 'energy' ? target.energy_reduction_percent :
                domain === 'water' ? target.water_reduction_percent :
                domain === 'waste' ? target.waste_reduction_percent :
                target.emissions_reduction_percent,
          years: new Date().getFullYear() - target.baseline_year,
          target: targetValue.value,
        } : null,
      },
    });

  } catch (error: any) {
    console.error('Error in unified-test:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
