const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.log('❌ Missing environment variables');
  console.log('SUPABASE_URL:', !!supabaseUrl);
  console.log('SERVICE_ROLE_KEY:', !!serviceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false }
});

async function checkSchema() {
  console.log('🔍 Checking sustainability_targets table schema...\n');

  try {
    // Try to get a sample row to see what columns exist
    const { data: sampleData, error: sampleError } = await supabase
      .from('sustainability_targets')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Error querying table:', sampleError.message);
      return;
    }

    console.log('✅ Table exists!');
    console.log('\n📊 Columns found:');

    if (sampleData && sampleData.length > 0) {
      const columns = Object.keys(sampleData[0]);
      columns.forEach(col => {
        const value = sampleData[0][col];
        const type = typeof value;
        console.log(`  - ${col}: ${type} = ${JSON.stringify(value)}`);
      });

      console.log('\n📝 Sample target data:');
      console.log(JSON.stringify(sampleData[0], null, 2));
    } else {
      console.log('  (No data in table yet)');

      // Try to get table structure another way
      const { data: targets, error } = await supabase
        .from('sustainability_targets')
        .select('id, organization_id, target_type, target_name, sbti_validated, baseline_year, target_year, baseline_emissions, target_emissions')
        .limit(1);

      if (!error) {
        console.log('\n✅ Expected columns exist in schema');
      }
    }

    // Check for specific SBTi fields we need
    console.log('\n🎯 Checking for SBTi-specific fields:');
    const requiredFields = [
      'target_type',
      'target_scope',
      'sbti_validated',
      'baseline_year',
      'baseline_emissions',
      'target_year',
      'target_reduction_percent',
      'target_emissions',
      'annual_reduction_rate',
      'scope_1_2_coverage_percent',
      'scope_3_coverage_percent',
      'baseline_scope_1',
      'baseline_scope_2',
      'baseline_scope_3'
    ];

    const { data: checkData } = await supabase
      .from('sustainability_targets')
      .select('*')
      .limit(1);

    if (checkData && checkData.length > 0) {
      const existingColumns = Object.keys(checkData[0]);
      requiredFields.forEach(field => {
        const exists = existingColumns.includes(field);
        console.log(`  ${exists ? '✅' : '❌'} ${field}`);
      });
    }

    // Check custom types
    console.log('\n🔧 Checking enum types:');
    const { data: targetTypeData } = await supabase
      .from('sustainability_targets')
      .select('target_type')
      .not('target_type', 'is', null)
      .limit(5);

    if (targetTypeData) {
      const types = [...new Set(targetTypeData.map(d => d.target_type))];
      console.log('  target_type values:', types);
    }

  } catch (err) {
    console.log('❌ Unexpected error:', err.message);
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
