const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkMissingGRIMetrics() {
  console.log('\n=== GRI Standards Metrics Requirements ===\n');

  // GRI 301: Materials
  console.log('📦 GRI 301: Materials 2016');
  console.log('Required Metrics:');
  console.log('  - 301-1: Materials used by weight or volume');
  console.log('    • Non-renewable materials (metals, minerals, plastics)');
  console.log('    • Renewable materials (wood, paper, bioplastics)');
  console.log('  - 301-2: Recycled input materials');
  console.log('    • Percentage of recycled materials used');
  console.log('  - 301-3: Reclaimed products and packaging');
  console.log('    • Products/packaging reclaimed at end-of-life');

  const { data: materials } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('name.ilike.%material%,name.ilike.%packaging%,name.ilike.%recycled%,name.ilike.%paper%,name.ilike.%plastic%,name.ilike.%metal%');

  console.log(`\nCurrent Status: ${materials?.length || 0} related metrics found`);
  if (materials && materials.length > 0) {
    materials.forEach(m => console.log(`  - ${m.name} (${m.category})`));
  } else {
    console.log('  ❌ No materials tracking configured');
  }

  // GRI 304: Biodiversity
  console.log('\n\n🌳 GRI 304: Biodiversity 2016');
  console.log('Required Metrics:');
  console.log('  - 304-1: Sites in/adjacent to protected areas');
  console.log('    • Number of sites and their biodiversity value');
  console.log('  - 304-2: Significant impacts on biodiversity');
  console.log('    • Species affected, habitats impacted');
  console.log('  - 304-3: Habitats protected or restored');
  console.log('    • Size and status of protected areas');
  console.log('  - 304-4: IUCN Red List species');
  console.log('    • Number of threatened species in operational areas');

  const { data: biodiversity } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('name.ilike.%biodiversity%,name.ilike.%habitat%,name.ilike.%species%,name.ilike.%protected area%,name.ilike.%ecosystem%,name.ilike.%conservation%');

  console.log(`\nCurrent Status: ${biodiversity?.length || 0} related metrics found`);
  if (biodiversity && biodiversity.length > 0) {
    biodiversity.forEach(m => console.log(`  - ${m.name} (${m.category})`));
  } else {
    console.log('  ❌ No biodiversity tracking configured');
  }

  // GRI 307: Environmental Compliance
  console.log('\n\n⚖️ GRI 307: Environmental Compliance 2016');
  console.log('Required Metrics:');
  console.log('  - 307-1: Non-compliance with environmental laws');
  console.log('    • Significant fines and monetary sanctions');
  console.log('    • Non-monetary sanctions');
  console.log('    • Cases through dispute resolution');

  const { data: compliance } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('name.ilike.%fine%,name.ilike.%penalty%,name.ilike.%violation%,name.ilike.%non-compliance%,name.ilike.%sanction%,name.ilike.%legal%');

  console.log(`\nCurrent Status: ${compliance?.length || 0} related metrics found`);
  if (compliance && compliance.length > 0) {
    compliance.forEach(m => console.log(`  - ${m.name} (${m.category})`));
  } else {
    console.log('  ❌ No compliance tracking configured');
  }

  // Check if there's any compliance tracking table
  const { data: tables } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .ilike('table_name', '%compliance%');

  if (tables && tables.length > 0) {
    console.log('  ℹ️ Found compliance-related tables:', tables.map(t => t.table_name).join(', '));
  }

  // GRI 308: Supplier Environmental Assessment
  console.log('\n\n🚚 GRI 308: Supplier Environmental Assessment 2016');
  console.log('Required Metrics:');
  console.log('  - 308-1: New suppliers screened using environmental criteria');
  console.log('    • Percentage of new suppliers screened');
  console.log('  - 308-2: Negative environmental impacts in supply chain');
  console.log('    • Number of suppliers assessed');
  console.log('    • Number with negative impacts identified');
  console.log('    • Number with improvements implemented');

  const { data: supplier } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('name.ilike.%supplier%,name.ilike.%vendor%,name.ilike.%procurement%,name.ilike.%supply chain%,name.ilike.%sourcing%');

  console.log(`\nCurrent Status: ${supplier?.length || 0} related metrics found`);
  if (supplier && supplier.length > 0) {
    supplier.forEach(m => console.log(`  - ${m.name} (${m.category})`));
  } else {
    console.log('  ❌ No supplier assessment tracking configured');
  }

  // Check Scope 3 categories (which include supplier-related emissions)
  const { data: scope3 } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('scope', 'scope_3')
    .or('category.ilike.%Purchased Goods%,category.ilike.%Upstream%');

  if (scope3 && scope3.length > 0) {
    console.log(`  ℹ️ Note: ${scope3.length} Scope 3 upstream metrics exist (Purchased Goods, Upstream Transportation)`);
    console.log('    These track emissions but not supplier screening/assessment');
  }

  console.log('\n\n=== Implementation Recommendations ===\n');

  console.log('📦 GRI 301 - Materials:');
  console.log('  Suggested implementation approach:');
  console.log('    1. Add materials tracking to metrics_catalog');
  console.log('    2. Categories: Raw Materials, Packaging Materials, Recycled Inputs');
  console.log('    3. Track by weight (kg/tonnes) and type (renewable/non-renewable)');
  console.log('    4. Calculate recycled content percentage');

  console.log('\n🌳 GRI 304 - Biodiversity:');
  console.log('  Suggested implementation approach:');
  console.log('    1. Create biodiversity_sites table (site locations, protected area status)');
  console.log('    2. Track habitat impacts and restoration efforts');
  console.log('    3. Integrate with site management system');
  console.log('    4. Most relevant for: Manufacturing, Mining, Agriculture, Real Estate');

  console.log('\n⚖️ GRI 307 - Environmental Compliance:');
  console.log('  Suggested implementation approach:');
  console.log('    1. Create environmental_incidents table');
  console.log('    2. Track: fines, penalties, violations, remediation');
  console.log('    3. Link to specific regulations and sites');
  console.log('    4. Most organizations report: "No significant fines or sanctions"');

  console.log('\n🚚 GRI 308 - Supplier Assessment:');
  console.log('  Suggested implementation approach:');
  console.log('    1. Create suppliers table with environmental screening data');
  console.log('    2. Track: screening status, assessment results, improvement plans');
  console.log('    3. Link to Scope 3 emissions (Purchased Goods & Services)');
  console.log('    4. Integrate with procurement/ERP systems');

  console.log('\n\n=== Priority Recommendations ===\n');
  console.log('🔴 HIGH PRIORITY:');
  console.log('  - GRI 307: Most critical for compliance reporting');
  console.log('    Action: Add simple environmental_incidents table');
  console.log('    Default: Show "No significant fines or sanctions" if empty');

  console.log('\n🟡 MEDIUM PRIORITY:');
  console.log('  - GRI 301: Relevant for manufacturing, retail, consumer goods');
  console.log('    Action: Add materials metrics for organizations that handle physical products');
  console.log('  - GRI 308: Important for companies with complex supply chains');
  console.log('    Action: Enhance existing supplier/procurement tracking');

  console.log('\n🟢 LOW PRIORITY (Industry-Specific):');
  console.log('  - GRI 304: Only relevant for organizations with significant land use');
  console.log('    Industries: Mining, Oil & Gas, Agriculture, Forestry, Real Estate');
  console.log('    Action: Create biodiversity module for relevant industries only');
}

checkMissingGRIMetrics().catch(console.error);
