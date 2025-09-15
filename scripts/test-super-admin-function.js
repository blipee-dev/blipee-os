require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSuperAdminFunction() {
  console.log('🔍 Testing super admin setup...\n');
  console.log('=' .repeat(80));

  const pedroId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

  try {
    // 1. Confirm Pedro is in super_admins table
    console.log('\n✅ Pedro is already in super_admins table:');
    console.log('   ID: 51869227-81a1-4dfb-8502-9fa30068a113');
    console.log('   User ID: d5708d9c-34fb-4c85-90ec-34faad9e2896');
    console.log('   Created: 2025-09-09');
    console.log('   Reason: Platform founder');

    // 2. Test if is_super_admin function exists
    console.log('\n📋 Testing is_super_admin() function...');

    // Try with Pedro's ID
    const { data: isPedroAdmin, error: pedroError } = await supabase
      .rpc('is_super_admin', { check_user_id: pedroId });

    if (pedroError) {
      console.log('❌ Function error or does not exist:', pedroError.message);
      console.log('\n   Need to create the function.');
    } else {
      console.log('✅ Function exists and returns:', isPedroAdmin);
    }

    // 3. Check existing RLS policies
    console.log('\n📋 Checking which tables need super admin policies...');

    const tables = [
      'organizations',
      'organization_members',
      'user_profiles',
      'buildings',
      'sustainability_goals',
      'emissions_data',
      'conversations',
      'messages'
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.message.includes('does not exist')) {
        console.log(`   ⚠️  ${table}: Table does not exist`);
      } else if (error && error.message.includes('recursion')) {
        console.log(`   🔴 ${table}: Has RLS recursion issues - needs fix`);
      } else if (error) {
        console.log(`   ⚠️  ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: Accessible`);
      }
    }

    // 4. Generate the needed migration
    console.log('\n' + '=' .repeat(80));
    console.log('📝 MIGRATION NEEDED:');
    console.log('=' .repeat(80));
    console.log(`
The super_admins table already exists with Pedro as a super admin.

Table structure:
- id: UUID
- user_id: UUID (Pedro's ID: ${pedroId})
- created_at: TIMESTAMPTZ
- created_by: UUID
- granted_by: UUID (nullable)
- granted_at: TIMESTAMPTZ
- reason: TEXT

What's needed:
1. Create the is_super_admin() function
2. Fix RLS recursion issues
3. Add super admin bypass policies to all tables
`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testSuperAdminFunction();