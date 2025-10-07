const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  console.log('=== ENERGY DATA CHECK ===\n');

  // Get energy category metrics
  const { data: metrics } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, code, name, unit, category')
    .in('category', ['Purchased Energy', 'Electricity'])
    .order('code');

  console.log('Energy metrics in catalog:', metrics.length, '\n');

  // Get data for each metric
  for (const m of metrics) {
    const { data, count, error } = await supabaseAdmin
      .from('metrics_data')
      .select('value, co2e_emissions', { count: 'exact' })
      .eq('metric_id', m.id);

    if (error) {
      console.log('❌ Error for', m.code, ':', error.message);
      continue;
    }

    if (count > 0 && data) {
      const totalValue = data.reduce((sum, d) => sum + (d.value || 0), 0);
      const totalEmissions = data.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);
      const emissionsTco2e = (totalEmissions / 1000).toFixed(1);

      console.log(m.code.padEnd(40), count + ' records', '→', totalValue.toFixed(0), m.unit, '→', emissionsTco2e, 'tCO2e');
    }
  }

  // Calculate totals
  const metricIds = metrics.map(m => m.id);
  const { data: allData, error: totalError } = await supabaseAdmin
    .from('metrics_data')
    .select('value, co2e_emissions, metric_id')
    .in('metric_id', metricIds);

  if (totalError) {
    console.log('\n❌ Error getting totals:', totalError.message);
    return;
  }

  if (allData && allData.length > 0) {
    const totalEmissions = allData.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);
    console.log('\n📊 TOTAL ENERGY EMISSIONS:', (totalEmissions / 1000).toFixed(1), 'tCO2e');
    console.log('📊 TOTAL RECORDS:', allData.length);
  } else {
    console.log('\n⚠️  No energy data found');
  }
})();
