const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkGRIMetrics() {
  console.log('\n=== Checking GRI-Related Environmental Metrics ===\n');

  // Check all distinct categories
  const { data: categories, error: catError } = await supabase
    .from('metrics_catalog')
    .select('category')
    .order('category');

  if (catError) {
    console.error('Error fetching categories:', catError);
    return;
  }

  const uniqueCategories = [...new Set(categories.map(c => c.category))];
  console.log('All categories in metrics_catalog:');
  uniqueCategories.forEach(cat => console.log(`  - ${cat}`));

  console.log('\n=== GRI Standards Coverage ===\n');

  // GRI 301: Materials
  console.log('GRI 301: Materials 2016');
  const { data: materials, error: matError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.ilike.%material%,category.ilike.%recycl%,category.ilike.%packaging%');

  console.log(`  Found ${materials?.length || 0} material-related metrics`);
  if (materials?.length > 0) {
    materials.forEach(m => console.log(`    - ${m.name} (${m.category})`));
  }

  // GRI 302: Energy
  console.log('\nGRI 302: Energy 2016');
  const { data: energy, error: energyError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .ilike('category', '%energy%');

  console.log(`  Found ${energy?.length || 0} energy-related metrics`);
  if (energy?.length > 0) {
    energy.slice(0, 5).forEach(m => console.log(`    - ${m.name} (${m.category})`));
    if (energy.length > 5) console.log(`    ... and ${energy.length - 5} more`);
  }

  // GRI 303: Water
  console.log('\nGRI 303: Water and Effluents 2018');
  const { data: water, error: waterError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .ilike('category', '%water%');

  console.log(`  Found ${water?.length || 0} water-related metrics`);
  if (water?.length > 0) {
    water.slice(0, 5).forEach(m => console.log(`    - ${m.name} (${m.category})`));
    if (water.length > 5) console.log(`    ... and ${water.length - 5} more`);
  }

  // GRI 304: Biodiversity
  console.log('\nGRI 304: Biodiversity 2016');
  const { data: biodiversity, error: bioError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.ilike.%biodiversity%,category.ilike.%habitat%,category.ilike.%species%,category.ilike.%land%');

  console.log(`  Found ${biodiversity?.length || 0} biodiversity-related metrics`);
  if (biodiversity?.length > 0) {
    biodiversity.forEach(m => console.log(`    - ${m.name} (${m.category})`));
  }

  // GRI 305: Emissions (already implemented)
  console.log('\nGRI 305: Emissions 2016');
  const { data: emissions, error: emError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('scope.eq.scope_1,scope.eq.scope_2,scope.eq.scope_3');

  console.log(`  Found ${emissions?.length || 0} emissions metrics`);
  console.log('  ✅ Already implemented in compliance dashboard');

  // GRI 306: Waste
  console.log('\nGRI 306: Waste 2020');
  const { data: waste, error: wasteError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .ilike('category', '%waste%');

  console.log(`  Found ${waste?.length || 0} waste-related metrics`);
  if (waste?.length > 0) {
    waste.slice(0, 5).forEach(m => console.log(`    - ${m.name} (${m.category})`));
    if (waste.length > 5) console.log(`    ... and ${waste.length - 5} more`);
  }

  // GRI 307: Environmental Compliance
  console.log('\nGRI 307: Environmental Compliance 2016');
  const { data: compliance, error: compError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.ilike.%compliance%,category.ilike.%violation%,category.ilike.%fine%');

  console.log(`  Found ${compliance?.length || 0} compliance-related metrics`);
  if (compliance?.length > 0) {
    compliance.forEach(m => console.log(`    - ${m.name} (${m.category})`));
  }

  // GRI 308: Supplier Environmental Assessment
  console.log('\nGRI 308: Supplier Environmental Assessment 2016');
  const { data: supplier, error: suppError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.ilike.%supplier%,category.ilike.%supply chain%,category.ilike.%procurement%');

  console.log(`  Found ${supplier?.length || 0} supplier-related metrics`);
  if (supplier?.length > 0) {
    supplier.forEach(m => console.log(`    - ${m.name} (${m.category})`));
  }

  console.log('\n=== Summary ===\n');
  console.log('Current GRI Environmental Standards Implementation:');
  console.log(`  ✅ GRI 305: Emissions - IMPLEMENTED`);
  console.log(`  ${energy?.length > 0 ? '📊' : '❌'} GRI 302: Energy - ${energy?.length || 0} metrics available`);
  console.log(`  ${water?.length > 0 ? '📊' : '❌'} GRI 303: Water - ${water?.length || 0} metrics available`);
  console.log(`  ${waste?.length > 0 ? '📊' : '❌'} GRI 306: Waste - ${waste?.length || 0} metrics available`);
  console.log(`  ${materials?.length > 0 ? '📊' : '❌'} GRI 301: Materials - ${materials?.length || 0} metrics available`);
  console.log(`  ${biodiversity?.length > 0 ? '📊' : '❌'} GRI 304: Biodiversity - ${biodiversity?.length || 0} metrics available`);
  console.log(`  ${compliance?.length > 0 ? '📊' : '❌'} GRI 307: Compliance - ${compliance?.length || 0} metrics available`);
  console.log(`  ${supplier?.length > 0 ? '📊' : '❌'} GRI 308: Supplier Assessment - ${supplier?.length || 0} metrics available`);
}

checkGRIMetrics().catch(console.error);
