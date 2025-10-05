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

    // Get current period (default to current month)
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    // Fetch peak demand metrics for the current period
    const { data: peakData, error: peakError } = await supabase
      .from('peak_demand_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentMonth}-01`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (peakError) {
      throw peakError;
    }

    // If no data, return default values
    if (!peakData || peakData.length === 0) {
      return NextResponse.json({
        peakDemand: { value: 0, unit: 'kW', time: 'N/A' },
        offPeakUsage: { percentage: 0, savings: 0 },
        loadFactor: { value: 0, target: 0.85 },
        powerFactor: { value: 0, target: 0.95 }
      });
    }

    const metric = peakData[0];

    // Format peak time
    const peakTime = metric.peak_time
      ? new Date(metric.peak_time).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : 'N/A';

    const response = {
      peakDemand: {
        value: parseFloat(metric.peak_demand_kw || 0),
        unit: 'kW',
        time: peakTime
      },
      offPeakUsage: {
        percentage: parseFloat(metric.off_peak_usage_percentage || 0),
        savings: parseFloat(metric.off_peak_savings || 0)
      },
      loadFactor: {
        value: parseFloat(metric.load_factor || 0),
        target: parseFloat(metric.load_factor_target || 0.85)
      },
      powerFactor: {
        value: parseFloat(metric.power_factor || 0),
        target: parseFloat(metric.power_factor_target || 0.95)
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching peak demand metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch peak demand metrics' },
      { status: 500 }
    );
  }
}
