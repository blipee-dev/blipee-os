import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {

    // Get user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get organization
    const { data: orgMembership } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id, organizations(id, name)')
      .eq('user_id', user.id)
      .single();

    const organizationId = orgMembership?.organization_id;


    // Get sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .eq('organization_id', organizationId);


    // Get sites with admin
    const { data: adminSites, error: adminError } = await supabaseAdmin
      .from('sites')
      .select('*')
      .eq('organization_id', organizationId);


    // Get metrics data with site_id
    const { data: metricsWithSites, count } = await supabaseAdmin
      .from('metrics_data')
      .select('site_id', { count: 'exact' })
      .eq('organization_id', organizationId)
      .not('site_id', 'is', null)
      .limit(10);


    // Compare site IDs
    const siteIds = adminSites?.map(s => s.id) || [];
    const metricsIds = [...new Set(metricsWithSites?.map(m => m.site_id) || [])];
    const matchingIds = siteIds.filter(id => metricsIds.includes(id));


    return NextResponse.json({
      user: user.email,
      organizationId,
      sites: adminSites?.length || 0,
      siteIds,
      metricsWithSites: count || 0,
      metricsSiteIds: metricsIds,
      matchingIds,
      debug: {
        sites: adminSites,
        sampleMetrics: metricsWithSites?.slice(0, 3)
      }
    });
  } catch (error: any) {
    console.error('TEST ERROR:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}