/**
 * Script to check the exact structure of organization_members table
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkStructure() {
  console.log('🔍 Checking organization_members structure\n');
  console.log('=' .repeat(80));

  try {
    // First, try to select all columns
    const { data, error } = await supabase
      .from('organization_members')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error querying organization_members:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully queried organization_members table\n');
      console.log('Columns found:');
      console.log('-'.repeat(40));

      const row = data[0];
      Object.keys(row).forEach(column => {
        const value = row[column];
        const type = value === null ? 'null' : typeof value;
        console.log(`  ${column}: ${type}`);
        if (column === 'role' && value !== null) {
          console.log(`    -> Current value: "${value}"`);
        }
      });
    } else {
      console.log('Table exists but is empty');
    }

    // Now try to specifically select the role column
    console.log('\n📊 Trying to select role column specifically:');
    console.log('-'.repeat(40));

    const { data: roleData, error: roleError } = await supabase
      .from('organization_members')
      .select('id, role')
      .limit(3);

    if (roleError) {
      console.error('❌ Error selecting role column:', roleError.message);
      console.log('This confirms that the role column does NOT exist');
    } else {
      console.log('✅ Role column exists!');
      if (roleData && roleData.length > 0) {
        roleData.forEach(row => {
          console.log(`  ID: ${row.id.substring(0, 8)}... Role: "${row.role}"`);
        });
      }
    }

    // Check what columns actually exist
    console.log('\n📋 Verifying actual columns by selecting them individually:');
    console.log('-'.repeat(40));

    const columnsToCheck = [
      'id', 'user_id', 'organization_id', 'role',
      'custom_permissions', 'invitation_status', 'is_owner'
    ];

    for (const column of columnsToCheck) {
      const { error: colError } = await supabase
        .from('organization_members')
        .select(column)
        .limit(1);

      if (colError) {
        console.log(`  ❌ ${column}: DOES NOT EXIST`);
      } else {
        console.log(`  ✅ ${column}: exists`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Structure check complete!');
}

// Run the check
checkStructure();