import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization from organization_members table
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // Fetch targets from sustainability_targets table
    const { data: targets, error: targetsError } = await supabaseAdmin
      .from('sustainability_targets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (targetsError) {
      console.error('Error fetching targets:', targetsError);
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 });
    }

    // Transform data to match our component expectations
    const transformedTargets = targets?.map(target => ({
      id: target.id,
      target_type: target.target_type || 'near-term',
      target_name: target.name,
      target_scope: target.scopes?.join(', ') || 'all_scopes',
      baseline_year: target.baseline_year,
      baseline_emissions: target.baseline_value,
      target_year: target.target_year,
      target_reduction_percent: target.target_value && target.baseline_value
        ? ((target.baseline_value - target.target_value) / target.baseline_value) * 100
        : 0,
      target_emissions: target.target_value,
      annual_reduction_rate: target.target_value && target.baseline_value && target.target_year && target.baseline_year
        ? (((target.baseline_value - target.target_value) / target.baseline_value) * 100) / (target.target_year - target.baseline_year)
        : 0,
      sbti_validated: target.sbti_approved || false,
      target_status: target.status || 'draft',
      current_emissions: target.current_value,
      performance_status: determinePerformanceStatus(target)
    })) || [];

    // Fetch current emissions data to update current_emissions
    const currentYear = new Date().getFullYear();
    const { data: currentEmissions } = await supabaseAdmin
      .from('emissions_data')
      .select('scope_1, scope_2, scope_3')
      .eq('organization_id', organizationId)
      .eq('year', currentYear)
      .order('month', { ascending: false })
      .limit(1)
      .single();

    if (currentEmissions) {
      const totalCurrentEmissions =
        (currentEmissions.scope_1 || 0) +
        (currentEmissions.scope_2 || 0) +
        (currentEmissions.scope_3 || 0);

      // Update targets with current emissions if not already set
      transformedTargets.forEach(target => {
        if (!target.current_emissions && totalCurrentEmissions > 0) {
          target.current_emissions = totalCurrentEmissions;
          // Recalculate performance status
          target.performance_status = calculatePerformanceStatus(
            target.baseline_emissions,
            totalCurrentEmissions,
            target.target_emissions,
            target.baseline_year,
            target.target_year,
            currentYear
          );
        }
      });
    }

    return NextResponse.json({
      targets: transformedTargets,
      summary: {
        total: transformedTargets.length,
        validated: transformedTargets.filter(t => t.sbti_validated).length,
        onTrack: transformedTargets.filter(t => t.performance_status === 'on-track' || t.performance_status === 'exceeding').length,
        atRisk: transformedTargets.filter(t => t.performance_status === 'at-risk').length,
        offTrack: transformedTargets.filter(t => t.performance_status === 'off-track').length
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization from organization_members table
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check permissions
    if (!['account_owner', 'sustainability_manager'].includes(memberData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();

    // Transform the data to match existing table structure
    const targetData = {
      organization_id: memberData.organization_id,
      name: body.target_name,
      description: body.target_description,
      target_type: body.target_type,
      scopes: body.target_scope ? [body.target_scope] : ['all_scopes'],
      baseline_year: body.baseline_year,
      baseline_value: body.baseline_emissions,
      baseline_unit: 'tCO2e',
      target_year: body.target_year,
      target_value: body.target_emissions ||
        (body.baseline_emissions * (1 - body.target_reduction_percent / 100)),
      target_unit: 'tCO2e',
      status: body.target_status || 'draft',
      is_science_based: body.sbti_validated || false,
      sbti_approved: body.sbti_validated || false,
      public_commitment: body.public_commitment || false,
      methodology: body.methodology || 'SBTi'
    };

    const { data: newTarget, error: insertError } = await supabaseAdmin
      .from('sustainability_targets')
      .insert(targetData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating target:', insertError);
      return NextResponse.json({ error: 'Failed to create target' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      target: newTarget
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('id');

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID required' }, { status: 400 });
    }

    const body = await request.json();

    // Update target
    const { data: updatedTarget, error: updateError } = await supabaseAdmin
      .from('sustainability_targets')
      .update({
        name: body.target_name,
        description: body.target_description,
        current_value: body.current_emissions,
        progress_percent: body.progress_percent,
        status: body.target_status,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating target:', updateError);
      return NextResponse.json({ error: 'Failed to update target' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      target: updatedTarget
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function determinePerformanceStatus(target: any): string {
  if (!target.current_value || !target.baseline_value || !target.target_value) {
    return 'pending';
  }

  const requiredReduction = target.baseline_value - target.target_value;
  const actualReduction = target.baseline_value - target.current_value;
  const progressRatio = actualReduction / requiredReduction;

  if (progressRatio >= 1.05) return 'exceeding';
  if (progressRatio >= 0.95) return 'on-track';
  if (progressRatio >= 0.85) return 'at-risk';
  return 'off-track';
}

function calculatePerformanceStatus(
  baseline: number,
  current: number,
  target: number,
  baselineYear: number,
  targetYear: number,
  currentYear: number
): string {
  const yearsElapsed = currentYear - baselineYear;
  const totalYears = targetYear - baselineYear;

  if (totalYears <= 0) return 'pending';

  const expectedProgress = (baseline - target) * (yearsElapsed / totalYears);
  const actualProgress = baseline - current;
  const progressRatio = actualProgress / expectedProgress;

  if (progressRatio >= 1.05) return 'exceeding';
  if (progressRatio >= 0.95) return 'on-track';
  if (progressRatio >= 0.85) return 'at-risk';
  return 'off-track';
}