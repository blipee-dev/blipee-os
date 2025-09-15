/**
 * Test the exact UPDATE query to understand the error
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testQueries() {
  console.log('🔍 Testing UPDATE queries on organization_members\n');
  console.log('=' .repeat(80));

  try {
    // Test 1: Simple SELECT to confirm role exists
    console.log('\n1️⃣ Test SELECT with role column:');
    const { data: selectData, error: selectError } = await supabase
      .from('organization_members')
      .select('id, role')
      .limit(1);

    if (selectError) {
      console.error('❌ SELECT failed:', selectError.message);
    } else {
      console.log('✅ SELECT works:', selectData);
    }

    // Test 2: Try a simple UPDATE without CASE
    console.log('\n2️⃣ Test simple UPDATE:');
    const testId = selectData?.[0]?.id;

    if (testId) {
      const { error: updateError } = await supabase
        .from('organization_members')
        .update({ invitation_status: 'accepted' })
        .eq('id', testId);

      if (updateError) {
        console.error('❌ Simple UPDATE failed:', updateError.message);
      } else {
        console.log('✅ Simple UPDATE works');
      }
    }

    // Test 3: Check column data types
    console.log('\n3️⃣ Checking actual column types:');
    const { data: schemaData, error: schemaError } = await supabase.rpc('get_column_info', {
      table_name: 'organization_members'
    }).single();

    if (schemaError) {
      // Try alternative approach
      console.log('Using alternative approach to check columns...');

      // Get PostgreSQL version and table info using raw SQL
      const query = `
        SELECT
          column_name,
          data_type,
          is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'organization_members'
        ORDER BY ordinal_position;
      `;

      // We can't run raw SQL directly, but we can infer from the data
      const { data: sampleData } = await supabase
        .from('organization_members')
        .select('*')
        .limit(1);

      if (sampleData && sampleData.length > 0) {
        console.log('Column types inferred from data:');
        Object.entries(sampleData[0]).forEach(([key, value]) => {
          const type = value === null ? 'NULL' : typeof value;
          console.log(`  - ${key}: ${type}`);
        });
      }
    } else {
      console.log('Schema info:', schemaData);
    }

    // Test 4: Test if we can read the role value
    console.log('\n4️⃣ Testing role column values:');
    const { data: roleData, error: roleError } = await supabase
      .from('organization_members')
      .select('role')
      .limit(5);

    if (roleError) {
      console.error('❌ Cannot read role column:', roleError.message);
    } else {
      console.log('✅ Role values found:');
      roleData.forEach(row => {
        console.log(`  - "${row.role}"`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Testing complete!');
}

// Run the tests
testQueries();