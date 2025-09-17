import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET /api/sustainability/metrics/sites - Get metrics by site or all sites
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const organizationId = searchParams.get('organization_id');

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin (same as sites API)
    const { data: superAdminRecord } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;
    let userOrgId = null;

    if (isSuperAdmin) {
      // For super_admin, use provided org_id or default to PLMJ
      if (organizationId) {
        userOrgId = organizationId;
      } else {
        // Default to PLMJ organization for super_admin
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', 'PLMJ')
          .single();

        userOrgId = org?.id || null;

        // If PLMJ not found, get first organization
        if (!userOrgId) {
          const { data: firstOrg } = await supabase
            .from('organizations')
            .select('id')
            .limit(1)
            .single();

          userOrgId = firstOrg?.id;
        }
      }
    } else {
      // Regular users - fetch their organizations through organization_members table
      const { data: orgMembership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      userOrgId = orgMembership?.organization_id;
    }

    if (!userOrgId) {
      // Return empty data if no organization
      return NextResponse.json({
        metricsBySite: [],
        organizationMetrics: [],
        organizationId: null
      });
    }

    if (siteId) {
      // Get metrics for specific site
      const { data: siteMetrics, error } = await supabase
        .from('site_metrics')
        .select(`
          *,
          metrics_catalog (
            id, name, code, description, unit, scope, category,
            emission_factor, emission_factor_unit, emission_factor_source
          ),
          sites (
            id, name
          )
        `)
        .eq('site_id', siteId)
        .eq('organization_id', userOrgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return NextResponse.json({
        siteMetrics: siteMetrics || [],
        siteId
      });

    } else {
      // Get metrics for all sites in organization
      const { data: allSiteMetrics, error: siteError } = await supabase
        .from('site_metrics')
        .select(`
          *,
          metrics_catalog (
            id, name, code, description, unit, scope, category,
            emission_factor, emission_factor_unit, emission_factor_source
          ),
          sites (
            id, name
          )
        `)
        .eq('organization_id', userOrgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (siteError) throw siteError;

      // Group by site
      const metricsBySite = (allSiteMetrics || []).reduce((acc, metric) => {
        const siteId = metric.site_id;
        const siteName = metric.sites?.name || 'Unknown Site';

        if (!acc[siteId]) {
          acc[siteId] = {
            siteId,
            siteName,
            metrics: []
          };
        }
        acc[siteId].metrics.push(metric);
        return acc;
      }, {} as Record<string, any>);

      // Get organization-level metrics for comparison
      const { data: orgMetrics, error: orgError } = await supabase
        .from('organization_metrics')
        .select(`
          *,
          metrics_catalog (
            id, name, code, description, unit, scope, category,
            emission_factor, emission_factor_unit, emission_factor_source
          )
        `)
        .eq('organization_id', userOrgId)
        .eq('is_active', true);

      if (orgError) throw orgError;

      return NextResponse.json({
        metricsBySite: Object.values(metricsBySite),
        organizationMetrics: orgMetrics || [],
        organizationId: userOrgId
      });
    }

  } catch (error) {
    console.error('Error fetching site metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch site metrics' },
      { status: 500 }
    );
  }
}

// POST /api/sustainability/metrics/sites - Add metrics to site
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { siteId, metricIds, organizationId } = await request.json();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super_admin (same as sites API)
    const { data: superAdminRecord } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;
    let userOrgId = null;
    let hasPermission = false;

    if (isSuperAdmin) {
      // Super admin can manage any organization
      hasPermission = true;
      if (organizationId) {
        userOrgId = organizationId;
      } else {
        // Default to PLMJ organization
        const { data: org } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', 'PLMJ')
          .single();

        userOrgId = org?.id;
      }
    } else {
      // Regular users - get their organization and check permissions through organization_members
      const { data: userAccess } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (userAccess && ['account_owner', 'sustainability_manager', 'facility_manager'].includes(userAccess.role)) {
        hasPermission = true;
        userOrgId = userAccess.organization_id;
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    if (!userOrgId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Verify site belongs to organization
    const { data: site } = await supabase
      .from('sites')
      .select('id')
      .eq('id', siteId)
      .eq('organization_id', userOrgId)
      .single();

    if (!site) {
      return NextResponse.json({ error: 'Site not found or access denied' }, { status: 404 });
    }

    // Add metrics to site
    const siteMetricsToInsert = metricIds.map((metricId: string) => ({
      site_id: siteId,
      metric_id: metricId,
      organization_id: userOrgId,
      is_active: true
    }));

    const { data, error } = await supabase
      .from('site_metrics')
      .upsert(siteMetricsToInsert, { onConflict: 'site_id,metric_id' })
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      added: data?.length || 0,
      siteId
    });

  } catch (error) {
    console.error('Error adding site metrics:', error);
    return NextResponse.json(
      { error: 'Failed to add site metrics' },
      { status: 500 }
    );
  }
}

// DELETE /api/sustainability/metrics/sites - Remove metric from site
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { siteId, metricId } = await request.json();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions (same as sites API)
    const { data: superAdminRecord } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isSuperAdmin = !!superAdminRecord;
    let hasPermission = false;

    if (isSuperAdmin) {
      hasPermission = true;
    } else {
      const { data: userAccess } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single();

      if (userAccess && ['account_owner', 'sustainability_manager', 'facility_manager'].includes(userAccess.role)) {
        hasPermission = true;
      }
    }

    if (!hasPermission) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Remove metric from site (set as inactive)
    const { error } = await supabase
      .from('site_metrics')
      .update({ is_active: false })
      .eq('site_id', siteId)
      .eq('metric_id', metricId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      siteId,
      metricId
    });

  } catch (error) {
    console.error('Error removing site metric:', error);
    return NextResponse.json(
      { error: 'Failed to remove site metric' },
      { status: 500 }
    );
  }
}