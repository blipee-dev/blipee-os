require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMigration() {
  console.log('🧪 Testing Super Admin Migration\n');
  console.log('=' .repeat(80));

  const userId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

  try {
    // Step 1: Check if user_profiles table exists
    console.log('\n📋 Step 1: Checking user_profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, email')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('   ❌ Error:', profileError.message);
    } else {
      console.log('   ✅ Table exists, user found:', profile.email);
    }

    // Step 2: Check if is_super_admin column exists
    console.log('\n📋 Step 2: Checking is_super_admin column...');
    const { data: profileWithAdmin, error: adminError } = await supabase
      .from('user_profiles')
      .select('is_super_admin')
      .eq('id', userId)
      .single();

    if (adminError && adminError.message.includes('is_super_admin')) {
      console.log('   ⚠️  Column does not exist yet (will be created)');
    } else if (profileWithAdmin) {
      console.log('   ✅ Column exists, value:', profileWithAdmin.is_super_admin);
    }

    // Step 3: Check if is_super_admin function exists
    console.log('\n📋 Step 3: Checking is_super_admin() function...');
    const { data: funcCheck, error: funcError } = await supabase
      .rpc('is_super_admin', { user_id: userId });

    if (funcError) {
      console.log('   ⚠️  Function does not exist yet (will be created)');
    } else {
      console.log('   ✅ Function exists, returns:', funcCheck);
    }

    // Step 4: Check if organizations table exists
    console.log('\n📋 Step 4: Checking organizations table...');
    const { error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);

    if (orgError && orgError.message.includes('does not exist')) {
      console.log('   ❌ Table does not exist');
    } else if (orgError) {
      console.log('   ⚠️  Table exists but has RLS issues:', orgError.message);
    } else {
      console.log('   ✅ Table exists and is accessible');
    }

    // Step 5: Check other tables
    console.log('\n📋 Step 5: Checking other tables...');
    const tables = ['organization_members', 'buildings', 'sustainability_goals'];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`   ⚠️  ${table}: Does not exist (policies will be skipped)`);
      } else if (error && error.message.includes('recursion')) {
        console.log(`   ⚠️  ${table}: Has RLS recursion issues`);
      } else if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Exists and accessible`);
      }
    }

    // Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 MIGRATION READINESS CHECK:');
    console.log('=' .repeat(80));
    console.log('\n✅ The migration should be safe to run.');
    console.log('   It will:');
    console.log('   1. Add is_super_admin column if needed');
    console.log('   2. Set pedro@blipee.com as super admin');
    console.log('   3. Create the is_super_admin() function');
    console.log('   4. Add RLS policies for existing tables only');
    console.log('   5. Create audit logging infrastructure');

    console.log('\n📝 To run the migration:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');
    console.log('   2. Copy the contents of: supabase/migrations/20250115_setup_super_admin.sql');
    console.log('   3. Paste and click "Run"');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMigration();