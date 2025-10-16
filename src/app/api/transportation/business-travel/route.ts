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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);

    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;

    // Fetch business travel metrics from metrics_catalog (using admin for consistency)
    const { data: travelMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

    if (metricsError) {
      console.error('Error fetching travel metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch travel metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!travelMetrics || travelMetrics.length === 0) {
      return NextResponse.json({ travel: [] });
    }

    // Fetch business travel data from metrics_data (using admin to bypass RLS)
    const metricIds = travelMetrics.map(m => m.id);

    const { data: travelData, error: dataError } = await supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .order('period_start', { ascending: false });


    if (dataError) {
      console.error('❌ Error fetching business travel data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch business travel data', details: dataError.message },
        { status: 500 }
      );
    }

    // Group by travel type and aggregate
    const travelByType = (travelData || []).reduce((acc: any, record: any) => {
      const metric = travelMetrics.find(m => m.id === record.metric_id);
      const metricCode = metric?.code || '';

      // Extract type from metric code (e.g., 'scope3_business_travel_air' -> 'air')
      const type = metricCode.replace('scope3_business_travel_', '').replace('scope3_', '') || 'other';

      if (!acc[type]) {
        acc[type] = {
          type: type,
          travel_type: metric?.name || 'Unknown',
          metric_code: metricCode,
          distance_km: 0,        // Standard GHG Protocol unit for distance (or nights for hotels)
          emissions_tco2e: 0,    // GRI 305 requires tCO2e
          cost: 0,
          trip_count: 0,         // Number of data records (monthly aggregates, not individual trips)
          unit: metric?.unit || 'km'  // Use catalog unit (km, nights, etc)
        };
      }

      // Add distance/activity value (already in correct unit: km or nights)
      acc[type].distance_km += parseFloat(record.value) || 0;

      // Convert emissions from kgCO2e (database) to tCO2e (GRI 305 standard)
      acc[type].emissions_tco2e += (parseFloat(record.co2e_emissions) || 0) / 1000;

      acc[type].trip_count += 1;

      return acc;
    }, {});

    // Add intensity metrics and format final response
    const travelWithIntensity = Object.values(travelByType).map((travel: any) => {
      const distanceOrNights = travel.distance_km || 0;
      const emissionsKg = travel.emissions_tco2e * 1000; // Convert back to kg for intensity calculation

      // Calculate emission intensity (gCO2e/km or kgCO2e/night)
      let intensity = 0;
      let intensity_unit = 'gCO2e/km';

      if (distanceOrNights > 0) {
        if (travel.unit === 'nights') {
          // For hotel stays: kgCO2e/night
          intensity = Math.round((emissionsKg / distanceOrNights) * 10) / 10;
          intensity_unit = 'kgCO2e/night';
        } else {
          // For distance-based: gCO2e/km (more intuitive than 0.XXX kgCO2e/km)
          intensity = Math.round((emissionsKg * 1000) / distanceOrNights);
          intensity_unit = 'gCO2e/km';
        }
      }

      return {
        ...travel,
        emissions_tco2e: Math.round(travel.emissions_tco2e * 10) / 10, // Round to 1 decimal
        distance_km: Math.round(travel.distance_km), // No decimals for distance
        intensity: intensity,
        intensity_unit: intensity_unit
      };
    });

    const response = {
      travel: travelWithIntensity,
      raw: travelData
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching business travel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business travel data' },
      { status: 500 }
    );
  }
}
