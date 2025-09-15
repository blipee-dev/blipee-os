require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupSuperAdmin() {
  console.log('🔧 Setting up pedro@blipee.com as super_admin\n');

  try {
    const userId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

    // First, check current profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
      return;
    }

    console.log('📝 Current Profile:');
    console.log('   Email:', profile.email);
    console.log('   Name:', profile.full_name || profile.display_name);
    console.log('   Current is_super_admin:', profile.is_super_admin || 'field not found');

    // Try to update is_super_admin
    console.log('\n🔧 Attempting to set is_super_admin = true...');
    const { data: updateData, error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_super_admin: true })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Update failed:', updateError.message);

      if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
        console.log('\n⚠️  The is_super_admin column does not exist.');
        console.log('Please run the migration below in Supabase SQL editor.');
      }
    } else {
      console.log('✅ Successfully updated!');
      console.log('   New is_super_admin value:', updateData.is_super_admin);
    }

    // Test the is_super_admin function
    console.log('\n🔍 Testing is_super_admin() function...');
    const { data: funcResult, error: funcError } = await supabase
      .rpc('is_super_admin', { user_id: userId });

    if (funcError) {
      console.log('❌ Function error:', funcError.message);
    } else {
      console.log('✅ Function result:', funcResult);
    }

    // Generate migration SQL
    console.log('\n=====================================');
    console.log('📋 SUPER ADMIN SETUP MIGRATION');
    console.log('=====================================');
    console.log(`
-- Add is_super_admin column if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Set pedro@blipee.com as super_admin
UPDATE user_profiles
SET is_super_admin = true
WHERE id = '${userId}';

-- Create the is_super_admin function
CREATE OR REPLACE FUNCTION is_super_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_profiles
        WHERE id = user_id
        AND is_super_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;

-- Update RLS policies to allow super_admin full access
-- Example for organizations table
CREATE POLICY "Super admins have full access to organizations"
    ON organizations FOR ALL
    USING (is_super_admin());

CREATE POLICY "Super admins have full access to organization_members"
    ON organization_members FOR ALL
    USING (is_super_admin());

CREATE POLICY "Super admins have full access to user_profiles"
    ON user_profiles FOR ALL
    USING (is_super_admin());
`);
    console.log('=====================================');
    console.log('\n✅ Please run the SQL above in:');
    console.log('   https://supabase.com/dashboard/project/quovvwrwyfkzhgqdeham/sql/new');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

setupSuperAdmin();