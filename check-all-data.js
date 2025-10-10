const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllData() {
  const { data, error } = await supabase
    .from('metrics_data')
    .select('period_start, period_end, co2e_emissions, value')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n📊 Total records:', data.length);
  console.log('📅 First record:', data[0]?.period_start);
  console.log('📅 Last record:', data[data.length - 1]?.period_start);
  
  // Group by year-month
  const byYearMonth = {};
  data?.forEach(record => {
    const start = new Date(record.period_start);
    const yearMonth = start.getFullYear() + '-' + String(start.getMonth() + 1).padStart(2, '0');
    if (!byYearMonth[yearMonth]) {
      byYearMonth[yearMonth] = { count: 0, emissions: 0 };
    }
    byYearMonth[yearMonth].count++;
    byYearMonth[yearMonth].emissions += (record.co2e_emissions || 0) / 1000;
  });

  console.log('\n📈 Data by month:');
  Object.keys(byYearMonth).sort().forEach(month => {
    console.log(`  ${month}: ${byYearMonth[month].count} records, ${byYearMonth[month].emissions.toFixed(1)} tCO2e`);
  });
}

checkAllData();
