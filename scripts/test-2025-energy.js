const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPILogic() {
  const startDate = '2025-01-01';
  const endDate = '2025-12-31';

  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Purchased Energy', 'Electricity']);

  const metricIds = metrics.map(m => m.id);

  const { data: energyData } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', metricIds)
    .gte('period_start', startDate)
    .lte('period_start', endDate);

  console.log('=== 2025 Energy Data ===');
  console.log('Total records:', energyData?.length || 0);

  if (energyData && energyData.length > 0) {
    const byMonth = energyData.reduce((acc, r) => {
      const month = r.period_start.substring(0, 7);
      if (!acc[month]) acc[month] = { count: 0, total: 0 };
      acc[month].count++;
      acc[month].total += parseFloat(r.value || 0);
      return acc;
    }, {});

    console.log('\nRecords by month (2025):');
    Object.entries(byMonth).sort().forEach(([month, data]) => {
      console.log(`  ${month}: ${data.count} records, ${data.total.toFixed(0)} kWh`);
    });
  }
}

testAPILogic();
