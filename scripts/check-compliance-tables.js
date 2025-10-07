const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

(async () => {
  console.log('=== CHECKING COMPLIANCE TABLES ===\n');

  const tables = [
    'ghg_inventory_settings',
    'esrs_e1_disclosures',
    'sustainability_targets',
    'scope3_emissions',
    'gri_reduction_initiatives'
  ];

  for (const table of tables) {
    try {
      const { data, error, count } = await supabaseAdmin
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: Does not exist or no access`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Exists (${count || 0} records)`);
      }
    } catch (e) {
      console.log(`❌ ${table}: Error - ${e.message}`);
    }
  }

  console.log('\n=== CHECKING METRICS_DATA COLUMNS ===\n');

  // Check if dual reporting columns exist
  const { data: sampleMetric } = await supabaseAdmin
    .from('metrics_data')
    .select('*')
    .limit(1)
    .single();

  if (sampleMetric) {
    const cols = Object.keys(sampleMetric);
    console.log('Dual Reporting Columns:');
    console.log('  scope2_method:', cols.includes('scope2_method') ? '✅' : '❌');
    console.log('  emissions_location_based:', cols.includes('emissions_location_based') ? '✅' : '❌');
    console.log('  emissions_market_based:', cols.includes('emissions_market_based') ? '✅' : '❌');
    console.log('  grid_region:', cols.includes('grid_region') ? '✅' : '❌');
  }
})();
