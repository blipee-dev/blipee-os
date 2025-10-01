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

    // Get user's organization using supabaseAdmin
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // Check if organization has any targets
    const { data: targets, error: targetsError } = await supabaseAdmin
      .from('sustainability_targets')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(1);

    if (targetsError) {
      console.error('Error checking targets:', targetsError);
      return NextResponse.json({ error: 'Failed to check targets' }, { status: 500 });
    }

    // Get emissions data to check if we have data to set targets
    const { data: metricsData, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        co2e_emissions,
        metrics_catalog (
          scope
        )
      `)
      .eq('organization_id', organizationId)
      .limit(100);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Calculate total emissions
    let totalEmissions = 0;
    let hasData = false;

    if (metricsData && metricsData.length > 0) {
      hasData = true;
      totalEmissions = metricsData.reduce((sum, item) => sum + (item.co2e_emissions || 0), 0);
    }

    return NextResponse.json({
      hasTargets: targets && targets.length > 0,
      hasEmissionsData: hasData,
      totalEmissions,
      dataPoints: metricsData?.length || 0,
      shouldShowAIRecommendations: hasData && (!targets || targets.length === 0)
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}