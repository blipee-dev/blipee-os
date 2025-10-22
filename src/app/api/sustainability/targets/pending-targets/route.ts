import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

export async function GET(request: NextRequest) {
  try {

    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
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

    // ✅ Using calculator for total emissions check
    // Get last 12 months of data to check if we have emissions data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const startDateStr = startDate.toISOString().split('T')[0];

    const emissionsData = await getPeriodEmissions(organizationId, startDateStr, endDate);

    const totalEmissions = emissionsData.total * 1000; // Convert to kg for consistency
    const hasData = emissionsData.total > 0;

    // Get record count for reference
    const { data: metricsData } = await supabaseAdmin
      .from('metrics_data')
      .select('id')
      .eq('organization_id', organizationId)
      .limit(100);

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