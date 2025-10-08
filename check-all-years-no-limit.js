const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllYears() {
  console.log('🔍 Checking what years have emissions data (NO LIMIT)...\n');

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // First, get total count
  const { count, error: countError } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  console.log(`Total records in database: ${count}\n`);

  // Fetch ALL emissions data without limit
  let allData = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('metrics_data')
      .select('co2e_emissions, period_start, period_end')
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: true })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      console.log(`Fetched page ${page + 1}: ${data.length} records (total so far: ${allData.length})`);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`\n✅ Fetched ${allData.length} total records\n`);

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

  const sortedYears = Array.from(years).sort();
  let previousYearEmissions = null;

  sortedYears.forEach(year => {
    const data = yearData[year];
    const tco2e = data.emissions / 1000;
    const isComplete = data.months.size === 12;

    // Calculate YoY change
    let yoyChange = '';
    if (previousYearEmissions !== null && isComplete) {
      const change = ((tco2e - previousYearEmissions) / previousYearEmissions) * 100;
      const arrow = change > 0 ? '📈' : '📉';
      const sign = change > 0 ? '+' : '';
      yoyChange = ` ${arrow} ${sign}${change.toFixed(1)}% YoY`;
    }

    console.log(`\n${year}:`);
    console.log(`  Records: ${data.count}`);
    console.log(`  Unique months: ${data.months.size}/12 ${isComplete ? '✅ Complete' : '⚠️  Partial'}`);
    console.log(`  Total emissions: ${tco2e.toFixed(2)} tCO2e`);
    if (yoyChange) {
      console.log(`  Change:${yoyChange}`);
    }
    if (!isComplete) {
      const projected = (tco2e / data.months.size) * 12;
      console.log(`  Projected annual: ${projected.toFixed(2)} tCO2e`);
    }

    if (isComplete) {
      previousYearEmissions = tco2e;
    }
  });

  // Show date range
  if (allData.length > 0) {
    const firstDate = allData[0].period_start;
    const lastDate = allData[allData.length - 1].period_start;
    console.log('\n' + '='.repeat(70));
    console.log(`\nDate range: ${firstDate} → ${lastDate}`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Summary Table:\n');
  console.log('Year      Emissions (tCO2e)    Status      YoY Change');
  console.log('-'.repeat(70));

  previousYearEmissions = null;
  sortedYears.forEach(year => {
    const data = yearData[year];
    const tco2e = data.emissions / 1000;
    const isComplete = data.months.size === 12;
    const status = isComplete ? 'Complete' : `${data.months.size}/12 months`;

    let yoyStr = '-';
    if (previousYearEmissions !== null && isComplete) {
      const change = ((tco2e - previousYearEmissions) / previousYearEmissions) * 100;
      yoyStr = `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    }

    console.log(`${year}      ${tco2e.toFixed(2).padStart(16)}    ${status.padEnd(12)}${yoyStr}`);

    if (isComplete) {
      previousYearEmissions = tco2e;
    }
  });

  console.log('='.repeat(70));
}

checkAllYears();
