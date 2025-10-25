const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllYears() {
  console.log('🔍 Checking what years have emissions data...\n');

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Fetch ALL emissions data without date filter
  const { data: allData, error } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start, period_end')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Total records: ${allData.length}\n`);

  // Get unique years
  const years = new Set();
  const yearData = {};

  allData.forEach(record => {
    if (record.period_start) {
      const year = record.period_start.substring(0, 4);
      years.add(year);

      if (!yearData[year]) {
        yearData[year] = { count: 0, emissions: 0, months: new Set() };
      }

      yearData[year].count++;
      yearData[year].emissions += (record.co2e_emissions || 0);
      yearData[year].months.add(record.period_start.substring(0, 7));
    }
  });

  console.log('Years with data:');
  console.log('='.repeat(70));

  Array.from(years).sort().forEach(year => {
    const data = yearData[year];
    const tco2e = data.emissions / 1000;
    console.log(`\n${year}:`);
    console.log(`  Records: ${data.count}`);
    console.log(`  Unique months: ${data.months.size}/12`);
    console.log(`  Total emissions: ${tco2e.toFixed(2)} tCO2e`);
    console.log(`  Months: ${Array.from(data.months).sort().join(', ')}`);
  });

  // Show date range
  if (allData.length > 0) {
    const firstDate = allData[0].period_start;
    const lastDate = allData[allData.length - 1].period_start;
    console.log('\n' + '='.repeat(70));
    console.log(`\nDate range: ${firstDate} → ${lastDate}`);
  }
}

checkAllYears();
