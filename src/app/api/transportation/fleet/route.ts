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

    // Get fleet vehicles
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .eq('organization_id', organizationId);

    if (vehiclesError) throw vehiclesError;

    // Get usage data
    const { data: usage, error: usageError } = await supabase
      .from('fleet_usage')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentMonth}-01`);

    if (usageError) throw usageError;

    // Aggregate by vehicle
    const fleet = (vehicles || []).map(vehicle => {
      const vehicleUsage = (usage || []).filter(u => u.vehicle_id === vehicle.id);
      const totalDistance = vehicleUsage.reduce((sum, u) => sum + (u.distance_km || 0), 0);
      const totalFuel = vehicleUsage.reduce((sum, u) => sum + (u.fuel_consumed_liters || 0), 0);
      const totalEmissions = vehicleUsage.reduce((sum, u) => sum + (u.emissions_tco2e || 0), 0);
      const totalCost = vehicleUsage.reduce((sum, u) => sum + (u.cost || 0), 0);

      return {
        id: vehicle.id,
        vehicle_id: vehicle.vehicle_id,
        type: vehicle.vehicle_type,
        fuel_type: vehicle.fuel_type,
        make: vehicle.make,
        model: vehicle.model,
        is_electric: vehicle.is_electric,
        distance_km: totalDistance,
        fuel_liters: totalFuel,
        emissions_tco2e: totalEmissions,
        cost: totalCost
      };
    });

    const totals = {
      total_distance: fleet.reduce((sum, v) => sum + v.distance_km, 0),
      total_emissions: fleet.reduce((sum, v) => sum + v.emissions_tco2e, 0),
      total_cost: fleet.reduce((sum, v) => sum + v.cost, 0),
      vehicle_count: fleet.length,
      electric_count: fleet.filter(v => v.is_electric).length
    };

    return NextResponse.json({ fleet, ...totals });

  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return NextResponse.json({ error: 'Failed to fetch fleet data' }, { status: 500 });
  }
}
