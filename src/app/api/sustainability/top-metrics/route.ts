import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getTopMetrics } from '@/lib/sustainability/baseline-calculator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization from organization_members table
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;
    const { searchParams } = new URL(request.url);

    // Get date range parameters
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 10;
    const siteId = searchParams.get('site_id');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    // Get top metrics using the baseline calculator
    const metrics = await getTopMetrics(organizationId, startDate, endDate, limit, siteId || undefined);


    return NextResponse.json({
      metrics,
      period: {
        start: startDate,
        end: endDate
      },
      metadata: {
        totalMetrics: metrics.length,
        limit
      }
    });

  } catch (error) {
    console.error('❌ [Top Metrics API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
