require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function emergencyFixRLS() {
  console.log('🚨 EMERGENCY RLS FIX - Attempting to fix infinite recursion\n');
  console.log('=' .repeat(80));

  try {
    // Test current state
    console.log('\n📋 Testing current state...');

    // Try to query organizations with service role (bypasses RLS)
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    if (orgsError) {
      console.log('❌ Organizations query failed:', orgsError.message);
    } else {
      console.log('✅ Organizations accessible with service role:', orgs?.length || 0);
    }

    // Check if pedro is super admin
    const { data: isSuperAdmin, error: superAdminError } = await supabase
      .rpc('is_super_admin', { check_user_id: 'd5708d9c-34fb-4c85-90ec-34faad9e2896' });

    console.log('\n📋 Super Admin Status:');
    if (superAdminError) {
      console.log('❌ Error checking:', superAdminError.message);
    } else {
      console.log('✅ Pedro is super admin:', isSuperAdmin);
    }

    // List all organizations with service role
    console.log('\n📋 All Organizations in Database:');
    const { data: allOrgs, error: allOrgsError } = await supabase
      .from('organizations')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (allOrgsError) {
      console.log('❌ Error:', allOrgsError.message);
    } else if (allOrgs && allOrgs.length > 0) {
      allOrgs.forEach((org, index) => {
        console.log(`   ${index + 1}. ${org.name} (ID: ${org.id})`);
      });
    } else {
      console.log('   No organizations found');
    }

    // Check organization_members
    console.log('\n📋 Organization Members:');
    const { data: members, error: membersError } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role')
      .eq('user_id', 'd5708d9c-34fb-4c85-90ec-34faad9e2896');

    if (membersError) {
      console.log('❌ Error:', membersError.message);
    } else if (members && members.length > 0) {
      console.log('   Pedro is member of', members.length, 'organizations');
      members.forEach(m => {
        console.log(`   - Org: ${m.organization_id}, Role: ${m.role}`);
      });
    } else {
      console.log('   Pedro is not a member of any organization');
    }

    console.log('\n' + '=' .repeat(80));
    console.log('🔧 REQUIRED ACTIONS:\n');
    console.log('1. Go to Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new\n');

    console.log('2. Run these migrations IN ORDER:\n');
    console.log('   a) First run: /supabase/migrations/20250115_fix_rls_recursion.sql');
    console.log('      This will fix the infinite recursion in RLS policies\n');

    console.log('   b) Then run: /supabase/migrations/20250115_add_super_admin_policies.sql');
    console.log('      This will add super admin bypass policies\n');

    console.log('3. If you get errors, you can run this emergency fix SQL directly:');
    console.log('=' .repeat(80));
    console.log(`
-- EMERGENCY FIX: Drop all problematic policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop ALL policies on organizations
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organizations')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organizations', r.policyname);
    END LOOP;

    -- Drop ALL policies on organization_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'organization_members')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON organization_members', r.policyname);
    END LOOP;
END $$;

-- Create simple super admin bypass policies
CREATE POLICY "super_admin_bypass"
    ON organizations FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

CREATE POLICY "super_admin_bypass"
    ON organization_members FOR ALL
    USING (is_super_admin())
    WITH CHECK (is_super_admin());

-- Create basic user policies without recursion
CREATE POLICY "users_view_their_orgs"
    ON organizations FOR SELECT
    USING (
        is_super_admin() OR
        id IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "users_view_their_memberships"
    ON organization_members FOR SELECT
    USING (
        is_super_admin() OR
        user_id = auth.uid()
    );
`);
    console.log('=' .repeat(80));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

emergencyFixRLS();