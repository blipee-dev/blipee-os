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

    const { data: appUser } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = appUser.organization_id;
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    // Get business travel records
    const { data: travel, error: travelError } = await supabase
      .from('business_travel')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentMonth}-01`);

    if (travelError) throw travelError;

    // Group by travel type
    const byType = (travel || []).reduce((acc, record) => {
      if (!acc[record.travel_type]) {
        acc[record.travel_type] = {
          type: record.travel_type,
          distance_km: 0,
          emissions_tco2e: 0,
          cost: 0,
          trip_count: 0
        };
      }
      acc[record.travel_type].distance_km += record.distance_km || 0;
      acc[record.travel_type].emissions_tco2e += record.emissions_tco2e || 0;
      acc[record.travel_type].cost += record.cost || 0;
      acc[record.travel_type].trip_count += 1;
      return acc;
    }, {} as Record<string, any>);

    const travelByType = Object.values(byType);

    const totals = {
      total_distance: travelByType.reduce((sum: number, t: any) => sum + t.distance_km, 0),
      total_emissions: travelByType.reduce((sum: number, t: any) => sum + t.emissions_tco2e, 0),
      total_cost: travelByType.reduce((sum: number, t: any) => sum + t.cost, 0),
      total_trips: travelByType.reduce((sum: number, t: any) => sum + t.trip_count, 0)
    };

    return NextResponse.json({ travel: travelByType, ...totals });

  } catch (error) {
    console.error('Error fetching business travel:', error);
    return NextResponse.json({ error: 'Failed to fetch business travel' }, { status: 500 });
  }
}
