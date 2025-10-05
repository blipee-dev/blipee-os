import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = appUser.organization_id;

    // Get current month's emissions
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = prevMonth.toISOString().slice(0, 7);

    // Fetch current month emissions
    const { data: currentEmissions } = await supabase
      .from('emissions')
      .select('scope1, scope2, scope3')
      .eq('organization_id', organizationId)
      .gte('date', `${currentMonth}-01`)
      .order('date', { ascending: false });

    // Fetch previous month emissions
    const { data: prevEmissions } = await supabase
      .from('emissions')
      .select('scope1, scope2, scope3')
      .eq('organization_id', organizationId)
      .gte('date', `${prevMonthStr}-01`)
      .lt('date', `${currentMonth}-01`);

    // Calculate totals
    const currentTotal = currentEmissions?.reduce((sum, e) =>
      sum + (e.scope1 || 0) + (e.scope2 || 0) + (e.scope3 || 0), 0) || 0;
    const prevTotal = prevEmissions?.reduce((sum, e) =>
      sum + (e.scope1 || 0) + (e.scope2 || 0) + (e.scope3 || 0), 0) || 0;

    // Calculate monthly reduction percentage
    let monthlyReduction = 'N/A';
    if (prevTotal > 0) {
      const reduction = ((prevTotal - currentTotal) / prevTotal * 100);
      monthlyReduction = reduction > 0
        ? `${reduction.toFixed(1)}%`
        : `+${Math.abs(reduction).toFixed(1)}%`; // Show increase as positive
    }

    // Get active targets and their progress
    const { data: targets } = await supabase
      .from('sustainability_targets')
      .select('target_value, current_value, status')
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    let targetProgress = 0;
    if (targets && targets.length > 0 && targets[0].target_value > 0) {
      targetProgress = Math.round((targets[0].current_value / targets[0].target_value) * 100);
    }

    // Count recent draft reports (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: reportsCount } = await supabase
      .from('compliance_reports')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('status', ['draft', 'pending'])
      .gte('created_at', sevenDaysAgo);

    return NextResponse.json({
      monthlyReduction,
      targetProgress: `${targetProgress}%`,
      reportsReady: reportsCount || 0,
      lastUpdated: new Date().toISOString(),
      hasData: currentEmissions && currentEmissions.length > 0
    });

  } catch (error) {
    console.error('Error fetching realtime metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
