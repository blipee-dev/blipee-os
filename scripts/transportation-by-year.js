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

  const metricIds = metrics.map(m => m.id);
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', metricIds)
    .order('period_start');

  console.log('=== TRANSPORTATION BREAKDOWN BY YEAR ===\n');

  // Group by year and metric
  const byYearMetric = {};
  allData.forEach(row => {
    const year = row.period_start.substring(0, 4);
    if (!byYearMetric[year]) byYearMetric[year] = {};
    if (!byYearMetric[year][row.metric_id]) {
      byYearMetric[year][row.metric_id] = {
        totalValue: 0,
        totalEmissions: 0,
        records: 0
      };
    }
    byYearMetric[year][row.metric_id].totalValue += parseFloat(row.value) || 0;
    byYearMetric[year][row.metric_id].totalEmissions += parseFloat(row.co2e_emissions) || 0;
    byYearMetric[year][row.metric_id].records += 1;
  });

  const years = Object.keys(byYearMetric).sort();

  years.forEach(year => {
    console.log('='.repeat(70));
    console.log('YEAR', year);
    console.log('='.repeat(70));

    const businessTravel = metrics.filter(m => 
      m.code.startsWith('scope3_business_travel_') || m.code === 'scope3_hotel_nights'
    );

    console.log('\nBUSINESS TRAVEL:');
    let yearBusinessTotal = 0;

    businessTravel.forEach(metric => {
      const data = byYearMetric[year][metric.id];
      if (data) {
        console.log('\n  ' + metric.name + ':');
        console.log('    ' + metric.unit + ':', data.totalValue.toFixed(2));
        console.log('    Emissions:', data.totalEmissions.toFixed(2), 'tCO2e');
        console.log('    Records:', data.records);
        yearBusinessTotal += data.totalEmissions;
      }
    });

    const fleet = metrics.filter(m => m.code.startsWith('scope1_fleet_'));
    console.log('\nFLEET:');
    let yearFleetTotal = 0;

    fleet.forEach(metric => {
      const data = byYearMetric[year][metric.id];
      if (data) {
        console.log('\n  ' + metric.name + ':');
        console.log('    ' + metric.unit + ':', data.totalValue.toFixed(2));
        console.log('    Emissions:', data.totalEmissions.toFixed(2), 'tCO2e');
        console.log('    Records:', data.records);
        yearFleetTotal += data.totalEmissions;
      }
    });

    if (yearFleetTotal === 0) {
      console.log('  No fleet data');
    }

    console.log('\n  YEAR ' + year + ' TOTALS:');
    console.log('    Business Travel:', yearBusinessTotal.toFixed(2), 'tCO2e');
    console.log('    Fleet:', yearFleetTotal.toFixed(2), 'tCO2e');
    console.log('    TOTAL:', (yearBusinessTotal + yearFleetTotal).toFixed(2), 'tCO2e');
    console.log('');
  });

  // Summary table
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY TABLE');
  console.log('='.repeat(70));
  console.log('\nYear      Air Travel (km)    Rail Travel (km)   Total Emissions (tCO2e)');
  console.log('-'.repeat(70));

  const airMetric = metrics.find(m => m.code === 'scope3_business_travel_air');
  const railMetric = metrics.find(m => m.code === 'scope3_business_travel_rail');

  years.forEach(year => {
    const airData = byYearMetric[year][airMetric.id];
    const railData = byYearMetric[year][railMetric.id];
    
    const airKm = airData ? airData.totalValue.toFixed(0) : '0';
    const railKm = railData ? railData.totalValue.toFixed(0) : '0';
    
    let totalEmissions = 0;
    Object.keys(byYearMetric[year]).forEach(metricId => {
      totalEmissions += byYearMetric[year][metricId].totalEmissions;
    });
    
    console.log(
      year.padEnd(10) + 
      airKm.padStart(18) + 
      railKm.padStart(19) + 
      totalEmissions.toFixed(2).padStart(24)
    );
  });
})();
