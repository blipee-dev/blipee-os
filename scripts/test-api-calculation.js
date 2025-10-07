const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== TESTING ACTUAL API LOGIC ===\n');

  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

  const { data: travelData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .in('metric_id', metrics.map(m => m.id));

  // Replicate the API logic exactly
  const travelByType = (travelData || []).reduce((acc, record) => {
    const metric = metrics.find(m => m.id === record.metric_id);
    const metricCode = metric?.code || '';
    const type = metricCode.replace('scope3_business_travel_', '').replace('scope3_', '') || 'other';

    if (!acc[type]) {
      acc[type] = {
        type: type,
        travel_type: metric?.name || 'Unknown',
        distance_km: 0,
        emissions_tco2e: 0,
        trip_count: 0,
        unit: metric?.unit || 'km'
      };
    }

    acc[type].distance_km += parseFloat(record.value) || 0;
    acc[type].emissions_tco2e += (parseFloat(record.co2e_emissions) || 0) / 1000;  // DIVIDING BY 1000
    acc[type].trip_count += 1;

    return acc;
  }, {});

  console.log('API Response (after division by 1000):');
  Object.values(travelByType).forEach(t => {
    console.log('  ', t.type);
    console.log('      Distance:', t.distance_km.toFixed(0), 'km');
    console.log('      Emissions:', t.emissions_tco2e.toFixed(2), 'tCO2e');
    console.log('      Records:', t.trip_count);
    console.log('');
  });

  const total = Object.values(travelByType).reduce((sum, t) => sum + t.emissions_tco2e, 0);
  console.log('Total emissions (API):', total.toFixed(2), 'tCO2e');
  console.log('');

  // Now test the intensity calculation
  const travelWithIntensity = Object.values(travelByType).map((travel) => {
    const distanceOrNights = travel.distance_km || 0;
    const emissionsKg = travel.emissions_tco2e * 1000; // Convert back to kg

    let intensity = 0;
    let intensity_unit = 'gCO2e/km';

    if (distanceOrNights > 0) {
      if (travel.unit === 'nights') {
        intensity = Math.round((emissionsKg / distanceOrNights) * 10) / 10;
        intensity_unit = 'kgCO2e/night';
      } else {
        intensity = Math.round((emissionsKg * 1000) / distanceOrNights);
        intensity_unit = 'gCO2e/km';
      }
    }

    return {
      ...travel,
      emissions_tco2e: Math.round(travel.emissions_tco2e * 10) / 10,
      distance_km: Math.round(travel.distance_km),
      intensity: intensity,
      intensity_unit: intensity_unit
    };
  });

  console.log('Final API Response (with intensity):');
  travelWithIntensity.forEach(t => {
    console.log('  ', t.type);
    console.log('      Distance:', t.distance_km, 'km');
    console.log('      Emissions:', t.emissions_tco2e, 'tCO2e');
    console.log('      Intensity:', t.intensity, t.intensity_unit);
    console.log('');
  });

  const finalTotal = travelWithIntensity.reduce((sum, t) => sum + t.emissions_tco2e, 0);
  console.log('Total emissions (final):', finalTotal.toFixed(1), 'tCO2e');
})();
