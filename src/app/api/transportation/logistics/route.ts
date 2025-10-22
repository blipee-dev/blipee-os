import { NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export async function GET() {
  try {

    // Get authenticated user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);

    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;

    // Fetch logistics metrics from metrics_catalog (Scope 3.4 upstream, 3.9 downstream)
    const { data: logisticsMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .or('code.like.scope3_upstream_transport_%,code.like.scope3_downstream_transport_%,code.like.scope3_logistics_%,code.like.scope3_freight_%');

    if (metricsError) {
      console.error('Error fetching logistics metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch logistics metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!logisticsMetrics || logisticsMetrics.length === 0) {
      return NextResponse.json({ logistics: [] });
    }

    // Fetch logistics data from metrics_data (using admin to bypass RLS)
    const metricIds = logisticsMetrics.map(m => m.id);

    const { data: logisticsData, error: dataError } = await supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .order('period_start', { ascending: false });

    if (dataError) {
      console.error('❌ Error fetching logistics data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch logistics data', details: dataError.message },
        { status: 500 }
      );
    }

    // Group by mode and direction, then aggregate
    const logisticsByModeAndDirection = (logisticsData || []).reduce((acc: any, record: any) => {
      const metric = logisticsMetrics.find(m => m.id === record.metric_id);
      const metricCode = metric?.code || '';

      // Determine direction (upstream vs downstream)
      let direction: 'upstream' | 'downstream' = 'upstream';
      if (metricCode.includes('downstream')) {
        direction = 'downstream';
      }

      // Extract mode from metric code
      let mode = 'road'; // default
      if (metricCode.includes('air') || metricCode.includes('flight')) {
        mode = 'air';
      } else if (metricCode.includes('sea') || metricCode.includes('ship') || metricCode.includes('ocean')) {
        mode = 'sea';
      } else if (metricCode.includes('rail') || metricCode.includes('train')) {
        mode = 'rail';
      } else if (metricCode.includes('road') || metricCode.includes('truck') || metricCode.includes('freight')) {
        mode = 'road';
      }

      const key = `${direction}_${mode}`;

      if (!acc[key]) {
        acc[key] = {
          mode: mode,
          direction: direction,
          logistics_type: metric?.name || 'Unknown',
          metric_code: metricCode,
          shipment_count: 0,
          total_weight_kg: 0,
          avg_distance_km: 0,
          total_distance_km: 0,
          emissions_tco2e: 0,
          cost: 0,
          unit: metric?.unit || 'tonne-km'
        };
      }

      // Add value (could be tonne-km, kg, or km depending on metric)
      const value = parseFloat(record.value) || 0;

      // If unit is tonne-km, we can extract both weight and distance
      if (acc[key].unit === 'tonne-km') {
        acc[key].total_weight_kg += value; // Simplification: using tonne-km as proxy
      } else {
        acc[key].total_weight_kg += value;
      }

      // Convert emissions from kgCO2e (database) to tCO2e (GRI 305 standard)
      acc[key].emissions_tco2e += (parseFloat(record.co2e_emissions) || 0) / 1000;

      // Count shipments (using number of records as proxy)
      acc[key].shipment_count += 1;

      return acc;
    }, {});

    // Add intensity metrics and format final response
    const logisticsWithIntensity = Object.values(logisticsByModeAndDirection).map((logistics: any) => {
      const totalWeight = logistics.total_weight_kg || 0;
      const shipmentCount = logistics.shipment_count || 1;
      const emissionsKg = logistics.emissions_tco2e * 1000;

      // Calculate emission intensity (gCO2e/tonne-km or kgCO2e/shipment)
      let intensity = 0;
      let intensity_unit = 'gCO2e/tonne-km';

      if (totalWeight > 0) {
        // For freight: gCO2e per tonne-km (standard logistics metric)
        const tonnekm = totalWeight / 1000; // Convert kg to tonnes
        if (tonnekm > 0) {
          intensity = Math.round((emissionsKg * 1000) / tonnekm);
          intensity_unit = 'gCO2e/tonne-km';
        }
      } else if (shipmentCount > 0) {
        // Fallback: kgCO2e per shipment
        intensity = Math.round((emissionsKg / shipmentCount) * 10) / 10;
        intensity_unit = 'kgCO2e/shipment';
      }

      // Estimate average distance (typical values by mode)
      const avgDistanceByMode: { [key: string]: number } = {
        'air': 5000,      // Long-haul air freight
        'sea': 8000,      // International shipping
        'rail': 1000,     // Regional rail
        'road': 300       // Local/regional road
      };
      const avgDistance = avgDistanceByMode[logistics.mode] || 500;

      return {
        ...logistics,
        total_weight_kg: Math.round(totalWeight),
        avg_distance_km: avgDistance,
        total_distance_km: Math.round(avgDistance * shipmentCount),
        emissions_tco2e: Math.round(logistics.emissions_tco2e * 10) / 10,
        intensity: intensity,
        intensity_unit: intensity_unit
      };
    });

    // Calculate upstream vs downstream totals
    const upstreamEmissions = logisticsWithIntensity
      .filter(l => l.direction === 'upstream')
      .reduce((sum, l) => sum + l.emissions_tco2e, 0);

    const downstreamEmissions = logisticsWithIntensity
      .filter(l => l.direction === 'downstream')
      .reduce((sum, l) => sum + l.emissions_tco2e, 0);

    const totalShipments = logisticsWithIntensity.reduce((sum, l) => sum + l.shipment_count, 0);
    const totalWeight = logisticsWithIntensity.reduce((sum, l) => sum + l.total_weight_kg, 0);

    const response = {
      logistics: logisticsWithIntensity,
      summary: {
        total_shipments: totalShipments,
        total_weight_kg: Math.round(totalWeight),
        upstream_emissions_tco2e: Math.round(upstreamEmissions * 10) / 10,
        downstream_emissions_tco2e: Math.round(downstreamEmissions * 10) / 10,
        total_emissions_tco2e: Math.round((upstreamEmissions + downstreamEmissions) * 10) / 10
      },
      raw: logisticsData
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching logistics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch logistics data' },
      { status: 500 }
    );
  }
}
