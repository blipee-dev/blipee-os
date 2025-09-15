import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    const { data: userAccess } = await supabase
      .from('user_access')
      .select('role')
      .eq('user_id', user.id)
      .eq('resource_type', 'organization')
      .eq('resource_id', site.organization_id)
      .single();

    // Also check if user is super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!userAccess && !superAdmin) {
      return NextResponse.json(
        { error: 'No access to this organization' },
        { status: 403 }
      );
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
      .select('emission_factor, emission_factor_unit')
      .eq('id', metric_id)
      .single();

    if (metric?.emission_factor || custom_emission_factor) {
      const emissionFactor = custom_emission_factor || metric.emission_factor;
      const emissions = parseFloat(value) * emissionFactor;

      // Update the entry with calculated emissions
      await supabase
        .from('sustainability_data')
        .update({
          calculated_emissions: emissions,
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
      query = query.lte('period_start', endDate);
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