const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit')
    .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights,code.like.scope1_fleet_%');

  console.log('=== TRANSPORTATION DATA TOTALS ===\n');

  const metricIds = metrics.map(m => m.id);
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', metricIds);

  console.log('Total transportation records:', allData.length, '\n');

  const byMetric = {};
  allData.forEach(row => {
    if (!byMetric[row.metric_id]) {
      byMetric[row.metric_id] = {
        records: [],
        totalValue: 0,
        totalEmissions: 0
      };
    }
    byMetric[row.metric_id].records.push(row);
    byMetric[row.metric_id].totalValue += parseFloat(row.value) || 0;
    byMetric[row.metric_id].totalEmissions += parseFloat(row.co2e_emissions) || 0;
  });

  console.log('='.repeat(70));
  console.log('BUSINESS TRAVEL (Scope 3)');
  console.log('='.repeat(70));
  
  const businessTravel = metrics.filter(m => 
    m.code.startsWith('scope3_business_travel_') || m.code === 'scope3_hotel_nights'
  );

  businessTravel.forEach(metric => {
    const data = byMetric[metric.id];
    if (data) {
      console.log('\n' + metric.name + ' (' + metric.code + '):');
      console.log('  Total ' + metric.unit + ':', data.totalValue.toFixed(2));
      console.log('  Total Emissions:', data.totalEmissions.toFixed(2), 'tCO2e');
      console.log('  Number of records:', data.records.length);
      
      const dates = data.records.map(r => r.period_start).sort();
      console.log('  Period:', dates[0], 'to', dates[dates.length - 1]);
    } else {
      console.log('\n' + metric.name + ' (' + metric.code + '):');
      console.log('  No data available');
    }
  });

  console.log('\n\n' + '='.repeat(70));
  console.log('FLEET / MOBILE COMBUSTION (Scope 1)');
  console.log('='.repeat(70));
  
  const fleet = metrics.filter(m => m.code.startsWith('scope1_fleet_'));

  fleet.forEach(metric => {
    const data = byMetric[metric.id];
    if (data) {
      console.log('\n' + metric.name + ' (' + metric.code + '):');
      console.log('  Total ' + metric.unit + ':', data.totalValue.toFixed(2));
      console.log('  Total Emissions:', data.totalEmissions.toFixed(2), 'tCO2e');
      console.log('  Number of records:', data.records.length);
      
      const dates = data.records.map(r => r.period_start).sort();
      console.log('  Period:', dates[0], 'to', dates[dates.length - 1]);
    } else {
      console.log('\n' + metric.name + ' (' + metric.code + '):');
      console.log('  No data available');
    }
  });

  console.log('\n\n' + '='.repeat(70));
  console.log('GRAND TOTALS');
  console.log('='.repeat(70));
  
  const totalBusinessTravelEmissions = businessTravel.reduce((sum, m) => {
    const data = byMetric[m.id];
    return sum + (data ? data.totalEmissions : 0);
  }, 0);
  
  const totalFleetEmissions = fleet.reduce((sum, m) => {
    const data = byMetric[m.id];
    return sum + (data ? data.totalEmissions : 0);
  }, 0);
  
  console.log('\nTotal Business Travel Emissions:', totalBusinessTravelEmissions.toFixed(2), 'tCO2e');
  console.log('Total Fleet Emissions:', totalFleetEmissions.toFixed(2), 'tCO2e');
  console.log('\nTOTAL TRANSPORTATION EMISSIONS:', (totalBusinessTravelEmissions + totalFleetEmissions).toFixed(2), 'tCO2e');
})();
