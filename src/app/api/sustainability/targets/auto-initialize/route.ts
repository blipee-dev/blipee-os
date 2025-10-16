import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getYearEmissions } from '@/lib/sustainability/baseline-calculator';

/**
 * Auto-initialize default SBTi target based on organization's emissions data
 * This endpoint creates a science-based target if none exists
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // Check if target already exists
    const { data: existingTargets } = await supabaseAdmin
      .from('sustainability_targets')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (existingTargets && existingTargets.length > 0) {
      return NextResponse.json({
        success: false,
        message: 'Target already exists',
        targetId: existingTargets[0].id
      });
    }

    // Use 2023 as the baseline year for SBTi targets
    // This is the last fully verified year before ESRS E1 mandatory disclosure
    const baselineYear = 2023;

    // ✅ Using calculator for baseline year emissions (ensures consistent calculation)
    const baselineEmissions = await getYearEmissions(organizationId, baselineYear);

    if (baselineEmissions === 0) {
      return NextResponse.json({
        error: 'No emissions data found for baseline year or emissions are zero',
        baselineYear
      }, { status: 404 });
    }

    // Create default SBTi 1.5°C target
    const SBTi_ANNUAL_REDUCTION = 4.2; // 4.2% per year
    const targetYear = 2030; // SBTi near-term target year (2023 baseline + 7 years, within 5-10 year requirement)
    const yearsToTarget = targetYear - baselineYear; // 7 years
    const totalReduction = SBTi_ANNUAL_REDUCTION * yearsToTarget; // 29.4% total reduction

    // Calculate current year progress (we're in 2025, so 2 years into the trajectory)
    const currentYear = new Date().getFullYear();
    const yearsElapsed = currentYear - baselineYear; // 2025 - 2023 = 2 years
    const expectedReductionToDate = SBTi_ANNUAL_REDUCTION * yearsElapsed; // 4.2% × 2 = 8.4%
    const requiredEmissionsNow = baselineEmissions * (1 - expectedReductionToDate / 100);

    // IMPORTANT: Using the ACTUAL current database schema (not the migration file schema)
    // The database has: name, scopes (array), baseline_value, target_value, status
    const targetEmissions = baselineEmissions * (1 - totalReduction / 100);

    const targetData = {
      organization_id: organizationId,
      target_type: 'absolute', // Changed from 'near-term' to match existing schema
      scopes: ['scope_1', 'scope_2', 'scope_3'], // Array format, not single value
      name: `SBTi 1.5°C Pathway (${baselineYear}-${targetYear})`,
      description: `Science-based target aligned with 1.5°C warming limit. ${SBTi_ANNUAL_REDUCTION}% annual linear reduction from ${baselineYear} baseline. Target: ${totalReduction.toFixed(1)}% reduction by ${targetYear}. Current year (${currentYear}) trajectory: ${requiredEmissionsNow.toFixed(1)} tCO2e.`,
      baseline_year: baselineYear,
      baseline_value: baselineEmissions,
      baseline_unit: 'tCO2e',
      target_year: targetYear,
      target_value: targetEmissions,
      target_unit: 'tCO2e',
      status: 'active', // Changed from 'committed' to match existing schema
      is_science_based: true,
      sbti_approved: false,
      sbti_ambition: '1.5C',
      public_commitment: false,
      is_active: true
    };

    const { data: newTarget, error: insertError } = await supabaseAdmin
      .from('sustainability_targets')
      .insert(targetData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating auto-target:', insertError);
      console.error('Target data attempted:', JSON.stringify(targetData, null, 2));
      return NextResponse.json({
        error: 'Failed to create target',
        details: insertError.message,
        hint: insertError.hint,
        targetData
      }, { status: 500 });
    }

    // Calculate and log weighted category targets
    try {
      const weightedParams = new URLSearchParams({
        target: SBTi_ANNUAL_REDUCTION.toString(),
        baseline_year: baselineYear.toString()
      });

      const weightedResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/sustainability/targets/weighted-allocation?${weightedParams}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (weightedResponse.ok) {
        const weightedData = await weightedResponse.json();
      }
    } catch (error) {
      console.error('Error calculating weighted targets:', error);
    }

    return NextResponse.json({
      success: true,
      target: newTarget,
      baselineYear,
      baselineEmissions,
      targetYear,
      targetEmissions,
      currentYear,
      yearsElapsed,
      expectedReductionToDate,
      requiredEmissionsNow,
      annualReduction: SBTi_ANNUAL_REDUCTION,
      message: `Auto-initialized SBTi 1.5°C target: ${baselineYear} baseline (${baselineEmissions.toFixed(1)} tCO2e) → ${targetYear} target (${targetEmissions.toFixed(1)} tCO2e). ${yearsElapsed} years elapsed, ${expectedReductionToDate.toFixed(1)}% reduction required to date. Current trajectory: ${requiredEmissionsNow.toFixed(1)} tCO2e.`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
