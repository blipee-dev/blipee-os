import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET metrics data
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const metric_id = searchParams.get('metric_id');
  const site_id = searchParams.get('site_id');
  const start_date = searchParams.get('start_date');
  const end_date = searchParams.get('end_date');

  try {
    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    let query = supabase
      .from('metrics_data')
      .select(`
        *,
        metric:metrics_catalog(*),
        site:sites(name),
        created_by_user:auth.users!metrics_data_created_by_fkey(email),
        verified_by_user:auth.users!metrics_data_verified_by_fkey(email)
      `)
      .eq('organization_id', member.organization_id)
      .order('period_start', { ascending: false });

    if (metric_id) {
      query = query.eq('metric_id', metric_id);
    }

    if (site_id) {
      query = query.eq('site_id', site_id);
    }

    if (start_date) {
      query = query.gte('period_start', start_date);
    }

    if (end_date) {
      query = query.lte('period_end', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate summary statistics
    const totalEmissions = data?.reduce((sum, item) => sum + (item.co2e_emissions || 0), 0) || 0;
    const byScope = {
      scope_1: 0,
      scope_2: 0,
      scope_3: 0
    };

    data?.forEach(item => {
      if (item.metric?.scope) {
        byScope[item.metric.scope] += item.co2e_emissions || 0;
      }
    });

    return NextResponse.json({
      data: data || [],
      summary: {
        total_emissions: totalEmissions,
        by_scope: byScope,
        count: data?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching metrics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics data' },
      { status: 500 }
    );
  }
}

// POST add metrics data
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      metric_id,
      site_id,
      period_start,
      period_end,
      value,
      unit,
      data_quality = 'measured',
      notes,
      evidence_url
    } = body;

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check permission
    const allowedRoles = ['account_owner', 'sustainability_manager', 'facility_manager', 'analyst'];
    if (!allowedRoles.includes(member.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Insert metrics data (CO2e will be calculated by trigger)
    const { data, error } = await supabase
      .from('metrics_data')
      .insert({
        organization_id: member.organization_id,
        metric_id,
        site_id,
        period_start,
        period_end,
        value,
        unit,
        data_quality,
        notes,
        evidence_url,
        created_by: user.id,
        verification_status: 'unverified'
      })
      .select(`
        *,
        metric:metrics_catalog(*)
      `)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error adding metrics data:', error);
    return NextResponse.json(
      { error: 'Failed to add metrics data' },
      { status: 500 }
    );
  }
}

// PUT update metrics data
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check permission
    const allowedRoles = ['account_owner', 'sustainability_manager', 'facility_manager'];
    if (!allowedRoles.includes(member.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Handle verification
    if (updates.verification_status === 'verified') {
      updates.verified_by = user.id;
      updates.verified_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('metrics_data')
      .update(updates)
      .eq('id', id)
      .eq('organization_id', member.organization_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating metrics data:', error);
    return NextResponse.json(
      { error: 'Failed to update metrics data' },
      { status: 500 }
    );
  }
}