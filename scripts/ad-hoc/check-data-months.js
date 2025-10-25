const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  const { data, error } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  const monthlyData = {};
  data?.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = 0;
    }
    monthlyData[monthKey] += (record.co2e_emissions || 0) / 1000;
  });

  const months = Object.keys(monthlyData).sort();
  console.log('\n📊 Total months with data:', months.length);
  console.log('📅 First month:', months[0]);
  console.log('📅 Last month:', months[months.length - 1]);
  console.log('\n📈 All months:', months.join(', '));
}

checkData();
