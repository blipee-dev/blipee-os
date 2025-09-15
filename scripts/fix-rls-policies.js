require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies to prevent infinite recursion...\n');

  try {
    // First, let's check what policies exist
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .in('tablename', ['organization_members', 'user_profiles', 'organizations']);

    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      return;
    }

    console.log('📋 Current policies:');
    policies.forEach(p => {
      console.log(`   - ${p.tablename}.${p.policyname}`);
    });

    // Drop problematic policies and recreate them
    const queries = [
      // Drop existing policies that might cause recursion
      `DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;`,
      `DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;`,
      `DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;`,

      // Create new, simpler policies that avoid recursion
      `CREATE POLICY "Users can view their own memberships"
        ON organization_members FOR SELECT
        USING (auth.uid() = user_id);`,

      `CREATE POLICY "Users can view organizations they belong to"
        ON organizations FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM organization_members om
            WHERE om.organization_id = organizations.id
            AND om.user_id = auth.uid()
            AND om.invitation_status = 'accepted'
          )
        );`,

      `CREATE POLICY "Users can view their own profile"
        ON user_profiles FOR SELECT
        USING (auth.uid() = id);`,
    ];

    for (const query of queries) {
      const { error } = await supabase.rpc('execute_sql', {
        query: query
      }).single();

      if (error && !error.message?.includes('does not exist')) {
        console.error('Error executing query:', error);
      }
    }

    console.log('✅ RLS policies fixed successfully');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Note: We'll need to execute these queries directly since execute_sql might not exist
console.log(`
⚠️  If the above doesn't work, please run these SQL queries directly in Supabase:

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own memberships" ON organization_members;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;

-- Create new policies
CREATE POLICY "Users can view their own memberships"
  ON organization_members FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view organizations they belong to"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.organization_id = organizations.id
      AND om.user_id = auth.uid()
      AND om.invitation_status = 'accepted'
    )
  );

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);
`);

fixRLSPolicies();