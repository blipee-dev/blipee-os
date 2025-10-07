const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== TESTING FIXED APIs WITH PLMJ DATA ===\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ

  // Test business travel
  const { data: travelMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

  const travelMetricIds = travelMetrics.map(m => m.id);
  const { data: travelData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', travelMetricIds);

  const travelByType = travelData.reduce((acc, record) => {
    const metric = travelMetrics.find(m => m.id === record.metric_id);
    const metricCode = metric.code || '';
    const type = metricCode.replace('scope3_business_travel_', '').replace('scope3_', '') || 'other';

    if (!acc[type]) {
      acc[type] = {
        type: type,
        travel_type: metric.name || 'Unknown',
        metric_code: metricCode,
        distance_km: 0,
        emissions_tco2e: 0,
        cost: 0,
        trip_count: 0,
        unit: record.unit
      };
    }

    acc[type].distance_km += parseFloat(record.value) || 0;
    acc[type].emissions_tco2e += parseFloat(record.co2e_emissions) || 0;
    acc[type].trip_count += 1;

    return acc;
  }, {});

  console.log('Business Travel API Response:');
  console.log(JSON.stringify({ travel: Object.values(travelByType) }, null, 2));

  console.log('\n\nComponent will see:');
  Object.values(travelByType).forEach(t => {
    console.log('  - ' + t.type + ' travel: ' + t.distance_km.toFixed(0) + ' km, ' + t.emissions_tco2e.toFixed(2) + ' tCO2e, ' + t.trip_count + ' records');
  });
})();
