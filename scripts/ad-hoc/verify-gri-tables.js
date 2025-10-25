const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function verifyGRITables() {
  console.log('🔍 Checking GRI tables status...\n');

  // Check environmental_incidents table
  console.log('1️⃣ GRI 307: Environmental Incidents');
  const { data: incidents, error: incError } = await supabase
    .from('environmental_incidents')
    .select('*')
    .limit(1);

  if (!incError) {
    console.log('   ✅ Table exists and accessible');
    if (incidents && incidents.length > 0) {
      console.log(`   📊 Contains ${incidents.length} records`);
      console.log('   Columns:', Object.keys(incidents[0]).join(', '));
    } else {
      console.log('   📊 Table is empty (ready for data)');
    }
  } else {
    console.log('   ❌ Error:', incError.message);
  }

  // Check suppliers table
  console.log('\n2️⃣ GRI 308: Suppliers');
  const { data: suppliers, error: supError } = await supabase
    .from('suppliers')
    .select('*')
    .limit(1);

  if (!supError) {
    console.log('   ✅ Table exists and accessible');
    if (suppliers && suppliers.length > 0) {
      console.log(`   📊 Contains ${suppliers.length} records`);
      console.log('   Columns:', Object.keys(suppliers[0]).join(', '));
    } else {
      console.log('   📊 Table is empty (ready for data)');
    }
  } else {
    console.log('   ❌ Error:', supError.message);
  }

  // Check biodiversity_sites table
  console.log('\n3️⃣ GRI 304: Biodiversity Sites');
  const { data: bio, error: bioError } = await supabase
    .from('biodiversity_sites')
    .select('*')
    .limit(1);

  if (!bioError) {
    console.log('   ✅ Table exists and accessible');
    if (bio && bio.length > 0) {
      console.log(`   📊 Contains ${bio.length} records`);
      console.log('   Columns:', Object.keys(bio[0]).join(', '));
    } else {
      console.log('   📊 Table is empty (ready for data)');
    }
  } else {
    console.log('   ❌ Error:', bioError.message);
  }

  // Check materials metrics in catalog
  console.log('\n4️⃣ GRI 301: Materials Metrics');
  const { data: materials, error: matError } = await supabase
    .from('metrics_catalog')
    .select('code, name, category, scope, unit')
    .or('category.eq.Raw Materials,category.eq.Recycled Materials,category.eq.Packaging Materials,category.eq.Product Reclamation')
    .order('code');

  if (!matError && materials) {
    console.log(`   ✅ ${materials.length} materials metrics in catalog`);

    const byCategory = materials.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});

    Object.entries(byCategory).forEach(([category, count]) => {
      console.log(`   📊 ${category}: ${count} metrics`);
    });

    console.log('\n   Sample metrics:');
    materials.slice(0, 5).forEach(m => {
      console.log(`   • ${m.code}: ${m.name} (${m.unit})`);
    });
  } else {
    console.log('   ❌ Error:', matError?.message || 'No materials metrics found');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY: GRI Additional Standards Status');
  console.log('='.repeat(60));

  const allTablesExist = !incError && !supError && !bioError;
  const materialsReady = materials && materials.length > 0;

  if (allTablesExist && materialsReady) {
    console.log('✅ All GRI tables and metrics are ready!');
    console.log('\n📋 Next steps:');
    console.log('   1. Build GRI 301 (Materials) disclosure component');
    console.log('   2. Build GRI 304 (Biodiversity) disclosure component');
    console.log('   3. Build GRI 307 (Compliance) disclosure component');
    console.log('   4. Build GRI 308 (Supplier Assessment) component');
  } else {
    console.log('⚠️ Some tables or metrics need attention');
    if (!allTablesExist) console.log('   • One or more tables not accessible');
    if (!materialsReady) console.log('   • Materials metrics need to be added');
  }
}

verifyGRITables().catch(console.error);
