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

    // Fetch fleet vehicles with usage data
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('fleet_vehicles')
      .select(`
        *,
        usage:fleet_usage(
          distance_km,
          fuel_consumed_liters,
          emissions_tco2e,
          cost,
          period_start,
          period_end
        )
      `)
      .eq('organization_id', organizationId);

    if (vehiclesError) {
      console.error('Error fetching fleet vehicles:', vehiclesError);
      return NextResponse.json(
        { error: 'Failed to fetch fleet vehicles' },
        { status: 500 }
      );
    }

    // Calculate aggregated metrics for each vehicle
    const fleet = (vehicles || []).map(vehicle => {
      const usage = vehicle.usage || [];
      const totalDistance = usage.reduce((sum: number, u: any) => sum + (parseFloat(u.distance_km) || 0), 0);
      const totalFuel = usage.reduce((sum: number, u: any) => sum + (parseFloat(u.fuel_consumed_liters) || 0), 0);
      const totalEmissions = usage.reduce((sum: number, u: any) => sum + (parseFloat(u.emissions_tco2e) || 0), 0);
      const totalCost = usage.reduce((sum: number, u: any) => sum + (parseFloat(u.cost) || 0), 0);

      return {
        ...vehicle,
        distance_km: totalDistance,
        fuel_consumed_liters: totalFuel,
        emissions_tco2e: totalEmissions,
        cost: totalCost,
        trips: usage.length
      };
    });

    return NextResponse.json({ fleet });
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fleet data' },
      { status: 500 }
    );
  }
}
