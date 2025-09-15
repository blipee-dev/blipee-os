require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectSuperAdminsTable() {
  console.log('🔍 Inspecting super_admins table structure and data...\n');
  console.log('=' .repeat(80));

  try {
    // 1. Check if super_admins table exists and get its data
    console.log('\n📋 Checking super_admins table...');
    const { data: superAdmins, error: superAdminsError } = await supabase
      .from('super_admins')
      .select('*');

    if (superAdminsError) {
      console.log('❌ Error accessing super_admins:', superAdminsError.message);
    } else {
      console.log('✅ super_admins table exists');
      console.log('   Current super admins:', superAdmins.length);

      if (superAdmins.length > 0) {
        console.log('\n   Data in super_admins table:');
        superAdmins.forEach((admin, index) => {
          console.log(`\n   [${index + 1}] Super Admin Entry:`);
          Object.keys(admin).forEach(key => {
            console.log(`       ${key}: ${admin[key]}`);
          });
        });
      }
    }

    // 2. Get table structure from information_schema
    console.log('\n📋 Getting super_admins table structure...');
    const { data: columns, error: columnsError } = await supabase.rpc('get_table_structure', {
      table_name: 'super_admins'
    }).single().catch(async () => {
      // If RPC doesn't exist, try direct query
      const { data, error } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'super_admins')
        .eq('table_schema', 'public');

      return { data, error };
    });

    if (columns && !columnsError) {
      console.log('\n   Table columns:');
      if (Array.isArray(columns)) {
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
        });
      }
    }

    // 3. Check if is_super_admin function exists
    console.log('\n📋 Checking is_super_admin() function...');
    const { data: funcTest, error: funcError } = await supabase
      .rpc('is_super_admin', { check_user_id: 'd5708d9c-34fb-4c85-90ec-34faad9e2896' });

    if (funcError) {
      console.log('❌ Function does not exist or error:', funcError.message);
    } else {
      console.log('✅ Function exists and returns:', funcTest);
    }

    // 4. Check if pedro is already a super admin
    console.log('\n📋 Checking if pedro@blipee.com is super admin...');
    const pedroId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

    const { data: pedroAdmin, error: pedroError } = await supabase
      .from('super_admins')
      .select('*')
      .eq('user_id', pedroId)
      .single();

    if (pedroError && pedroError.code === 'PGRST116') {
      console.log('❌ Pedro is NOT a super admin');
    } else if (pedroError) {
      console.log('⚠️  Error checking:', pedroError.message);
    } else if (pedroAdmin) {
      console.log('✅ Pedro IS already a super admin');
      console.log('   Entry:', pedroAdmin);
    }

    // 5. Check RLS policies on super_admins
    console.log('\n📋 Checking RLS policies on super_admins...');
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies_for_table', {
      table_name: 'super_admins'
    }).catch(async () => {
      // Try alternative approach
      return { data: null, error: 'Cannot check policies directly' };
    });

    if (policies && !policiesError) {
      console.log('   Policies:', policies);
    } else {
      console.log('   ⚠️  Cannot check policies directly, but table has RLS');
    }

    // 6. Try to insert Pedro if not already there
    console.log('\n📋 Attempting to add Pedro as super admin...');
    const { data: insertData, error: insertError } = await supabase
      .from('super_admins')
      .insert({
        user_id: pedroId,
        notes: 'Initial super admin - pedro@blipee.com'
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') {
        console.log('✅ Pedro is already a super admin (duplicate key)');
      } else {
        console.log('❌ Insert error:', insertError.message);
      }
    } else {
      console.log('✅ Successfully added Pedro as super admin');
      console.log('   New entry:', insertData);
    }

    // 7. List all current super admins
    console.log('\n📋 Final list of all super admins:');
    const { data: allAdmins, error: allError } = await supabase
      .from('super_admins')
      .select('*');

    if (allError) {
      console.log('❌ Error:', allError.message);
    } else {
      console.log(`   Total super admins: ${allAdmins.length}`);
      allAdmins.forEach((admin, index) => {
        console.log(`   ${index + 1}. User ID: ${admin.user_id}`);
        if (admin.notes) console.log(`      Notes: ${admin.notes}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

inspectSuperAdminsTable();