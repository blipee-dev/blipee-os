const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingTables() {
  console.log('🔍 Checking which tables exist in the database...\n');
  
  const tables = [
    // Core tables
    'organizations',
    'organization_members',
    'team_members',
    
    // ESG tables
    'facilities',
    'emissions',
    'emission_sources',
    'energy_consumption',
    'water_consumption',
    'waste_generation',
    'sustainability_targets',
    'material_topics',
    'suppliers',
    'compliance_frameworks',
    
    // Building/Facility related
    'buildings',
    'building_types',
    
    // Conversations
    'conversations',
    'messages',
    
    // Other potential tables
    'users',
    'profiles',
    'notifications'
  ];

  const existing = [];
  const missing = [];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error && error.message.includes('does not exist')) {
        missing.push(table);
        console.log(`❌ ${table} - Does not exist`);
      } else if (error) {
        console.log(`⚠️  ${table} - Error: ${error.message}`);
      } else {
        existing.push(table);
        console.log(`✅ ${table} - Exists`);
      }
    } catch (e) {
      missing.push(table);
      console.log(`❌ ${table} - Does not exist`);
    }
  }

  console.log('\n📊 SUMMARY');
  console.log('===========');
  console.log(`Tables found: ${existing.length}`);
  console.log(`Tables missing: ${missing.length}`);
  
  console.log('\n✅ Existing tables:');
  existing.forEach(t => console.log(`  - ${t}`));
  
  console.log('\n❌ Missing tables:');
  missing.forEach(t => console.log(`  - ${t}`));
  
  // Check if we need the main schema
  if (missing.includes('emissions') || missing.includes('facilities')) {
    console.log('\n⚠️  IMPORTANT: Core ESG tables are missing!');
    console.log('You need to run the main Fortune 10 migration first:');
    console.log('→ /supabase/migrations/FINAL_FORTUNE10_MIGRATION.sql');
  }

  return { existing, missing };
}

checkExistingTables().catch(console.error);