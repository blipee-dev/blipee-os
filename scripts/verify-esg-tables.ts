import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyESGTables() {
  console.log('🔍 Verifying ESG Tables Status...\n');

  const tables = [
    'materiality_assessments',
    'esg_governance',
    'pollution_emissions',
    'biodiversity_sites',
    'circular_economy_flows',
    'workforce_demographics',
    'employee_development',
    'health_safety_metrics',
    'labor_relations',
    'pay_equity',
    'supplier_social_assessment',
    'community_engagement',
    'human_rights_assessment',
    'business_conduct',
    'board_composition',
    'eu_taxonomy_alignment',
    'climate_risks',
    'sustainability_targets',
    'product_footprints',
    'esg_reports'
  ];

  let existingTables = 0;
  let missingTables = 0;

  console.log('📊 ESG Table Status:\n');
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Missing`);
        missingTables++;
      } else {
        console.log(`✅ ${table}: Exists (${count || 0} records)`);
        existingTables++;
      }
    } catch (err) {
      console.log(`❌ ${table}: Error checking`);
      missingTables++;
    }
  }

  console.log('\n📈 Summary:');
  console.log(`  ✅ Existing tables: ${existingTables}/${tables.length}`);
  console.log(`  ❌ Missing tables: ${missingTables}/${tables.length}`);

  if (existingTables === tables.length) {
    console.log('\n🎉 All ESG tables are properly created!');
    console.log('✅ The database schema is ready for comprehensive ESG reporting.');
    console.log('\n📝 No manual action needed in Supabase Dashboard.');
  } else if (existingTables > 0) {
    console.log('\n⚠️  Some tables are missing. The migration may have been partially applied.');
    console.log('You may need to manually create the missing tables in Supabase Dashboard.');
  } else {
    console.log('\n❌ No ESG tables found. The migration needs to be applied.');
  }

  // Check for sample data
  console.log('\n📊 Checking for sample data...');
  
  const sampleChecks = [
    { table: 'emissions_data', name: 'Emissions' },
    { table: 'workforce_demographics', name: 'Workforce' },
    { table: 'sustainability_targets', name: 'Targets' }
  ];

  for (const check of sampleChecks) {
    const { count } = await supabase
      .from(check.table)
      .select('*', { count: 'exact', head: true });
    
    console.log(`  ${check.name}: ${count || 0} records`);
  }

  console.log('\n✅ Verification completed!');
}

verifyESGTables();