const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkDatabase() {
  console.log('🔍 Checking Blipee OS Database Health...\n');
  
  const coreTables = [
    'organizations',
    'buildings', 
    'conversations',
    'messages',
    'organization_members',
    'user_profiles'
  ];
  
  const sustainabilityTables = [
    'emissions_data',
    'energy_consumption',
    'waste_data',
    'water_usage',
    'sustainability_reports',
    'document_uploads'
  ];
  
  let missingTables = [];
  let existingTables = [];
  
  console.log('📊 Core Tables:');
  for (const table of coreTables) {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error && error.code === '42P01') {
      console.log(`  ❌ ${table} - MISSING`);
      missingTables.push(table);
    } else if (error) {
      console.log(`  ⚠️  ${table} - Error: ${error.message}`);
    } else {
      console.log(`  ✅ ${table} - OK`);
      existingTables.push(table);
    }
  }
  
  console.log('\n🌱 Sustainability Tables:');
  for (const table of sustainabilityTables) {
    const { error } = await supabase
      .from(table)
      .select('*')
      .limit(0);
    
    if (error && error.code === '42P01') {
      console.log(`  ❌ ${table} - MISSING`);
      missingTables.push(table);
    } else if (error) {
      console.log(`  ⚠️  ${table} - Error: ${error.message}`);
    } else {
      console.log(`  ✅ ${table} - OK`);
      existingTables.push(table);
    }
  }
  
  // Summary
  console.log('\n📈 Summary:');
  console.log(`  Total tables checked: ${coreTables.length + sustainabilityTables.length}`);
  console.log(`  Existing tables: ${existingTables.length}`);
  console.log(`  Missing tables: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing Tables:', missingTables.join(', '));
    console.log('\n💡 Recommendation: The database schema appears incomplete.');
    console.log('   You may need to run migrations to create the missing tables.');
  } else {
    console.log('\n✅ All expected tables are present!');
  }
  
  // Check if we need the users table workaround
  if (missingTables.includes('user_profiles') && !missingTables.includes('organizations')) {
    console.log('\n💡 Note: The system uses Supabase Auth for user management.');
    console.log('   User profiles may be stored in auth.users table.');
  }
}

checkDatabase();