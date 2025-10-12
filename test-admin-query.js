require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Creating admin client...');
console.log('URL:', supabaseUrl);
console.log('Service key exists:', !!serviceRoleKey);

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testAdminQuery() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const currentYear = 2025;
  const metricId = 'c1ae3f36-26a8-4be0-ad8e-c844f169a2fc'; // scope3_water_supply

  console.log('\n🧪 Testing EXACT query from replanning engine...\n');
  console.log('Parameters:');
  console.log('  organizationId:', organizationId);
  console.log('  metricId:', metricId);
  console.log('  currentYear:', currentYear);
  console.log('  period_start >= ', `${currentYear}-01-01`);
  console.log('  period_start <= ', `${currentYear}-12-31`);

  const { data: metricData, error: metricDataError } = await supabaseAdmin
    .from('metrics_data')
    .select('value, co2e_emissions')
    .eq('organization_id', organizationId)
    .eq('metric_id', metricId)
    .gte('period_start', `${currentYear}-01-01`)
    .lte('period_start', `${currentYear}-12-31`);

  if (metricDataError) {
    console.error('\n❌ Error:', metricDataError);
    return;
  }

  console.log(`\n✅ Query returned ${metricData?.length || 0} rows\n`);

  if (metricData && metricData.length > 0) {
    console.log('First 3 rows:');
    metricData.slice(0, 3).forEach((row, i) => {
      console.log(`  ${i + 1}. value=${row.value}, co2e_emissions=${row.co2e_emissions}`);
    });

    const totalEmissions = metricData.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);
    console.log(`\nTotal emissions: ${totalEmissions.toFixed(2)} tCO2e`);
  }

  // Try without date filters
  console.log('\n\n🧪 Testing WITHOUT date filters...\n');

  const { data: allData, error: allError } = await supabaseAdmin
    .from('metrics_data')
    .select('value, co2e_emissions, period_start')
    .eq('organization_id', organizationId)
    .eq('metric_id', metricId);

  if (allError) {
    console.error('❌ Error:', allError);
    return;
  }

  console.log(`✅ Query returned ${allData?.length || 0} rows`);

  if (allData && allData.length > 0) {
    console.log('\nSample periods:');
    allData.slice(0, 5).forEach(row => {
      console.log(`  ${row.period_start}: ${row.co2e_emissions} tCO2e`);
    });

    // Check which periods match our filter
    const matching2025 = allData.filter(row => {
      return row.period_start >= `${currentYear}-01-01` &&
             row.period_start <= `${currentYear}-12-31`;
    });
    console.log(`\n📊 Rows matching 2025 date range: ${matching2025.length}`);
  }
}

testAdminQuery().catch(console.error);
