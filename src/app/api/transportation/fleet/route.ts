import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('❌ Fleet API Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Fleet API - User authenticated:', user.id);

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    console.log('📋 Fleet API - getUserOrganizationById result:', orgInfo);

    if (!orgInfo.organizationId) {
      console.log('❌ Fleet API - No organization found for user');
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;
    console.log('🏢 Fleet API - Using organization:', organizationId);

    // Fetch fleet-related metrics from metrics_catalog (using admin for consistency)
    const { data: fleetMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .or('code.like.scope1_fleet_%');

    if (metricsError) {
      console.error('Error fetching fleet metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch fleet metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!fleetMetrics || fleetMetrics.length === 0) {
      return NextResponse.json({ fleet: [] });
    }

    // Fetch fleet data from metrics_data (using admin to bypass RLS)
    const metricIds = fleetMetrics.map(m => m.id);
    console.log('📊 Fleet API - Metric IDs to query:', metricIds);

    const { data: fleetData, error: dataError } = await supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .order('period_start', { ascending: false });

    console.log('📈 Fleet API - Data rows found:', fleetData?.length || 0);

    if (dataError) {
      console.error('❌ Fleet API - Error fetching fleet data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch fleet data', details: dataError.message },
        { status: 500 }
      );
    }

    // Group by fuel type and aggregate
    const fleetByType = (fleetData || []).reduce((acc: any, record: any) => {
      const metric = fleetMetrics.find(m => m.id === record.metric_id);
      const fuelType = metric?.name || 'Unknown';
      const metricCode = metric?.code || '';

      // Extract vehicle type from code (e.g., 'scope1_fleet_diesel' -> 'diesel')
      const vehicleType = metricCode.replace('scope1_fleet_', '') || 'other';

      if (!acc[fuelType]) {
        acc[fuelType] = {
          vehicle_id: metricCode,
          make: 'Fleet',
          model: fuelType,
          type: vehicleType,
          distance_km: 0,           // Optional - if tracked separately
          fuel_amount: 0,           // Generic - could be liters, m³, kWh
          emissions_tco2e: 0,       // GRI 305 standard unit
          cost: 0,
          is_electric: vehicleType === 'electric' || vehicleType === 'hybrid',
          fuel_type: fuelType,
          unit: metric?.unit || 'liters'  // liters, m³, or kWh from catalog
        };
      }

      // Add fuel consumption (value is in correct unit from metrics_catalog)
      acc[fuelType].fuel_amount += parseFloat(record.value) || 0;

      // Convert emissions from kgCO2e (database) to tCO2e (GRI 305 standard)
      acc[fuelType].emissions_tco2e += (parseFloat(record.co2e_emissions) || 0) / 1000;

      return acc;
    }, {});

    // Add intensity metrics and format final response
    const fleetWithIntensity = Object.values(fleetByType).map((fleet: any) => {
      const fuelAmount = fleet.fuel_amount || 0;
      const emissionsKg = fleet.emissions_tco2e * 1000; // Convert to kg for intensity

      // Calculate emission intensity (kgCO2e per unit of fuel)
      let intensity = 0;
      let intensity_unit = 'kgCO2e/liter';

      if (fuelAmount > 0) {
        intensity = Math.round((emissionsKg / fuelAmount) * 100) / 100; // 2 decimals

        // Set proper intensity unit based on fuel type
        if (fleet.unit === 'm³' || fleet.unit === 'm3') {
          intensity_unit = 'kgCO2e/m³';
        } else if (fleet.unit === 'kWh') {
          intensity_unit = 'kgCO2e/kWh';
        } else if (fleet.unit === 'kg') {
          intensity_unit = 'kgCO2e/kg';
        } else {
          intensity_unit = 'kgCO2e/liter';
        }
      }

      return {
        ...fleet,
        emissions_tco2e: Math.round(fleet.emissions_tco2e * 10) / 10, // Round to 1 decimal
        fuel_amount: Math.round(fleet.fuel_amount), // No decimals for fuel
        intensity: intensity,
        intensity_unit: intensity_unit
      };
    });

    return NextResponse.json({
      fleet: fleetWithIntensity,
      raw: fleetData
    });
  } catch (error) {
    console.error('Error fetching fleet data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fleet data' },
      { status: 500 }
    );
  }
}
