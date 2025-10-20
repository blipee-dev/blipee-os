import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PermissionService } from '@/lib/auth/permission-service';
import { getUserOrganization } from '@/lib/auth/get-user-org';
import { calculateEmissionsFromActivity } from '@/lib/sustainability/emissions-calculator';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      site_id,
      metric_id,
      value,
      period_start,
      period_end,
      data_quality,
      notes,
      evidence_url,
      custom_emission_factor,
      emission_factor_justification
    } = body;

    // Validate required fields
    if (!site_id || !metric_id || !value || !period_start || !period_end) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get organization ID from site
    const { data: site } = await supabase
      .from('sites')
      .select('organization_id')
      .eq('id', site_id)
      .single();

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this organization
    const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

    if (!isSuperAdmin) {
      // Check user's organization access using centralized helper
      const { organizationId: userOrgId, role } = await getUserOrganization(user.id);

      let hasAccess = false;

      if (userOrgId === site.organization_id && role) {
        // Check if user role allows data entry (member or higher)
        hasAccess = ['owner', 'manager', 'member'].includes(role);
      } else {
        // Check user_access table for specific access to this org
        const { data: userAccess } = await supabaseAdmin
          .from('user_access')
          .select('role')
          .eq('user_id', user.id)
          .eq('resource_type', 'org')
          .eq('resource_id', site.organization_id)
          .single();

        if (userAccess) {
          hasAccess = ['owner', 'manager', 'member'].includes(userAccess.role);
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'No access to this organization' },
          { status: 403 }
        );
      }
    }

    // Insert data entry
    const { data: dataEntry, error: insertError } = await supabase
      .from('sustainability_data')
      .insert({
        site_id,
        metric_id,
        value: parseFloat(value),
        period_start,
        period_end,
        data_quality: data_quality || 'measured',
        notes,
        evidence_url,
        custom_emission_factor: custom_emission_factor ? parseFloat(custom_emission_factor) : null,
        emission_factor_justification,
        organization_id: site.organization_id,
        created_by: user.id,
        created_at: new Date().toISOString(),
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting data:', insertError);
      return NextResponse.json(
        { error: 'Failed to save data', details: insertError.message },
        { status: 500 }
      );
    }

    // Calculate emissions if metric has emission factor
    const { data: metric } = await supabase
      .from('metrics_catalog')
      .select('emission_factor, emission_factor_unit, scope, category, unit')
      .eq('id', metric_id)
      .single();

    if (metric?.emission_factor || custom_emission_factor) {
      const emissionFactor = custom_emission_factor || metric.emission_factor;

      // Use centralized calculator for consistency
      const emissionsResult = calculateEmissionsFromActivity({
        activityAmount: parseFloat(value),
        emissionFactor: emissionFactor,
        scope: metric.scope,
        category: metric.category,
        unit: metric.unit
      });

      // Update the entry with calculated emissions
      await supabase
        .from('sustainability_data')
        .update({
          calculated_emissions: emissionsResult.co2e,
          emission_factor_used: emissionFactor
        })
        .eq('id', dataEntry.id);
    }

    return NextResponse.json({
      success: true,
      data: dataEntry
    });

  } catch (error: any) {
    console.error('Error saving sustainability data:', error);
    return NextResponse.json(
      { error: 'Failed to save data', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const metricId = searchParams.get('metric_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query
    let query = supabase
      .from('sustainability_data')
      .select(`
        *,
        sites (
          id, name
        ),
        metrics_catalog (
          id, name, code, unit, scope, category
        )
      `)
      .eq('is_active', true)
      .order('period_start', { ascending: false });

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    if (metricId) {
      query = query.eq('metric_id', metricId);
    }

    if (startDate) {
      query = query.gte('period_end', startDate);
    }

    if (endDate) {
      // Filter out future months - only include data through current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const maxHistoricalDate = new Date(currentYear, currentMonth, 0); // Last day of current month
      const requestedEndDate = new Date(endDate);

      // Use the earlier of: requested end date OR current month end
      const effectiveEndDate = requestedEndDate <= maxHistoricalDate ? endDate : maxHistoricalDate.toISOString().split('T')[0];

      query = query.lte('period_start', effectiveEndDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error: any) {
    console.error('Error fetching sustainability data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}