import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { organizationId } = await getUserOrganizationById(user.id);

    if (!organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Fetch business travel records
    const { data: travel, error: travelError } = await supabase
      .from('business_travel')
      .select('*')
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false });

    if (travelError) {
      console.error('Error fetching business travel:', travelError);
      return NextResponse.json(
        { error: 'Failed to fetch business travel data' },
        { status: 500 }
      );
    }

    // Group by travel type and aggregate
    const travelByType = (travel || []).reduce((acc: any, record: any) => {
      const type = record.travel_type;
      if (!acc[type]) {
        acc[type] = {
          travel_type: type,
          distance_km: 0,
          emissions_tco2e: 0,
          cost: 0,
          trips: 0
        };
      }
      acc[type].distance_km += parseFloat(record.distance_km) || 0;
      acc[type].emissions_tco2e += parseFloat(record.emissions_tco2e) || 0;
      acc[type].cost += parseFloat(record.cost) || 0;
      acc[type].trips += 1;
      return acc;
    }, {});

    return NextResponse.json({
      travel: Object.values(travelByType),
      raw: travel
    });
  } catch (error) {
    console.error('Error fetching business travel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business travel data' },
      { status: 500 }
    );
  }
}
