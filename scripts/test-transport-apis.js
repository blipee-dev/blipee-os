const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== TESTING TRANSPORTATION APIS ===\n');

  // Get org ID
  const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
  const orgId = orgs[0].id;

  console.log('Testing with org ID:', orgId);

  // Test fleet API logic
  console.log('\n--- FLEET API ---');
  const { data: fleetMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('code.like.scope1_fleet_%');

  console.log('Fleet metrics found:', fleetMetrics.length);
  
  if (fleetMetrics.length > 0) {
    const metricIds = fleetMetrics.map(m => m.id);
    const { data: fleetData } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', orgId)
      .in('metric_id', metricIds);

    console.log('Fleet data rows:', fleetData ? fleetData.length : 0);
    console.log('API would return:', { fleet: [] });
  }

  // Test business travel API logic
  console.log('\n--- BUSINESS TRAVEL API ---');
  const { data: travelMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

  console.log('Travel metrics found:', travelMetrics.length);
  
  if (travelMetrics.length > 0) {
    const metricIds = travelMetrics.map(m => m.id);
    const { data: travelData } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', orgId)
      .in('metric_id', metricIds);

    console.log('Travel data rows:', travelData ? travelData.length : 0);

    if (travelData && travelData.length > 0) {
      const travelByType = travelData.reduce((acc, record) => {
        const metric = travelMetrics.find(m => m.id === record.metric_id);
        const travelType = metric ? metric.name : 'Unknown';

        if (!acc[travelType]) {
          acc[travelType] = {
            travel_type: travelType,
            metric_code: metric ? metric.code : '',
            total_distance_or_nights: 0,
            emissions_tco2e: 0,
            unit: record.unit,
            trips: 0
          };
        }

        acc[travelType].total_distance_or_nights += parseFloat(record.value) || 0;
        acc[travelType].emissions_tco2e += parseFloat(record.co2e_emissions) || 0;
        acc[travelType].trips += 1;

        return acc;
      }, {});

      console.log('\nAPI would return:');
      console.log(JSON.stringify({ travel: Object.values(travelByType) }, null, 2));
    }
  }

  console.log('\n--- COMPONENT EXPECTS ---');
  console.log('Fleet data structure: { fleet: [{ vehicle_id, make, model, distance_km, fuel_liters, emissions_tco2e, cost, type, is_electric }] }');
  console.log('Travel data structure: { travel: [{ type, distance_km, emissions_tco2e, cost, trip_count }] }');

  console.log('\n--- MISMATCH FOUND ---');
  console.log('API returns: travel_type, total_distance_or_nights, emissions_tco2e, trips');
  console.log('Component expects: type, distance_km, emissions_tco2e, trip_count');
})();
