import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  metricsDataQuerySchema,
  metricsDataCreateSchema,
  metricsDataUpdateSchema,
  validateAndSanitize
} from '@/lib/validation/schemas';
import { withMiddleware, middlewareConfigs } from '@/lib/middleware';
import { getPeriodEmissions, getScopeBreakdown } from '@/lib/sustainability/baseline-calculator';

// Internal GET handler
async function getMetricsData(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Validate query parameters
  const { searchParams } = new URL(request.url);
  const queryParams = {
    metric_id: searchParams.get('metric_id'),
    site_id: searchParams.get('site_id'),
    start_date: searchParams.get('start_date'),
    end_date: searchParams.get('end_date'),
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  };

  const validation = validateAndSanitize(metricsDataQuerySchema, queryParams);
  if (!validation.success) {
    const errors = validation.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    return NextResponse.json(
      { error: 'Invalid query parameters', details: errors },
      { status: 400 }
    );
  }

  const { metric_id, site_id, start_date, end_date } = validation.data;

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

    // Calculate summary statistics using baseline calculator for consistency
    let totalEmissions = 0;
    let byScope = {
      scope_1: 0,
      scope_2: 0,
      scope_3: 0
    };

    if (data && data.length > 0) {
      // Get date range from the data
      const periods = data.map(d => ({ start: d.period_start, end: d.period_end }));
      const startDate = periods.reduce((min, p) => p.start < min ? p.start : min, periods[0].start);
      const endDate = periods.reduce((max, p) => p.end > max ? p.end : max, periods[0].end);

      console.log(`✅ Using baseline calculator for metrics data summary (${startDate} to ${endDate})`);

      // Use calculator to get accurate emissions with scope-by-scope rounding
      const emissions = await getPeriodEmissions(member.organization_id, startDate, endDate);
      totalEmissions = emissions.total;
      byScope = {
        scope_1: emissions.scope_1,
        scope_2: emissions.scope_2,
        scope_3: emissions.scope_3
      };
    }

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

// Export GET handler with middleware
export const GET = withMiddleware(getMetricsData, {
  ...middlewareConfigs.api,
  validation: {
    query: metricsDataQuerySchema,
  },
});

// POST add metrics data
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate request body
    const validation = validateAndSanitize(metricsDataCreateSchema, body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      );
    }

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
    } = validation.data;

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

    // Validate request body
    const validation = validateAndSanitize(metricsDataUpdateSchema, body);
    if (!validation.success) {
      const errors = validation.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Invalid update data', details: errors },
        { status: 400 }
      );
    }

    const { id, ...updates } = validation.data;

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