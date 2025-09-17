import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || new Date(new Date().getFullYear(), 0, 1).toISOString();
    const endDate = searchParams.get('endDate') || new Date(new Date().getFullYear(), 11, 31).toISOString();
    const siteId = searchParams.get('site') || 'all';

    // Get user's organization
    let organizationId: string | null = null;

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (superAdmin) {
      // Get PLMJ organization for super admin
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'PLMJ')
        .single();
      organizationId = org?.id;

      if (!organizationId) {
        // Fallback to first organization
        const { data: firstOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        organizationId = firstOrg?.id;
      }
    } else {
      // Get user's organization
      const { data: userAccess } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!userAccess) {
        // If no user access, try to get PLMJ organization
        const { data: plmjOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', 'PLMJ')
          .single();
        organizationId = plmjOrg?.id;
      } else {
        organizationId = userAccess.organization_id;
      }
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Build query for metrics data with site information
    let dataQuery = supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          id, name, code, unit, scope, category, subcategory,
          emission_factor, emission_factor_unit
        ),
        sites (
          id, name
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate)
      .lte('period_end', endDate)
      .order('period_start', { ascending: true });

    if (siteId !== 'all') {
      dataQuery = dataQuery.eq('site_id', siteId);
    }

    const { data: metricsData, error: dataError } = await dataQuery;

    if (dataError) {
      console.error('Error fetching metrics data:', dataError);
      throw dataError;
    }

    // Format the data for easier consumption
    const formattedData = metricsData?.map(item => ({
      ...item,
      site: item.sites || { name: 'Unknown Site' }
    }));

    return NextResponse.json({
      data: formattedData || [],
      count: formattedData?.length || 0,
      startDate,
      endDate,
      organizationId
    });

  } catch (error: any) {
    console.error('Metrics investigation API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics data', details: error.message },
      { status: 500 }
    );
  }
}