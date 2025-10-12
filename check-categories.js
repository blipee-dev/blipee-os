require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkCategories() {
  console.log('Checking metric categories...\n');

  // Get metric targets with their categories
  const { data: targets, error } = await supabase
    .from('metric_targets')
    .select(`
      id,
      target_value,
      target_emissions,
      metrics_catalog (
        code,
        name,
        category,
        scope
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .eq('target_id', 'd4a00170-7964-41e2-a61e-3d7b0059cfe5')
    .eq('status', 'active')
    .order('target_emissions', { ascending: false })
    .limit(30);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log(`✅ Found ${targets?.length} metric targets\n`);

    // Group by category
    const byCategory = {};
    targets?.forEach(t => {
      const cat = t.metrics_catalog?.category;
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(t);
    });

    console.log('📊 Targets by Category:\n');
    Object.entries(byCategory).forEach(([category, items]) => {
      console.log(`\n${category} (${items.length} targets):`);
      items.forEach(item => {
        console.log(`  - ${item.metrics_catalog.name} (${item.metrics_catalog.scope}): ${item.target_emissions.toFixed(2)} tCO2e`);
      });
    });
  }
}

checkCategories()
  .catch(console.error)
  .finally(() => process.exit(0));
