require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifySuperAdmin() {
  console.log('🔍 Verifying super_admin setup for pedro@blipee.com\n');

  try {
    const userId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

    // Check user_profiles
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    console.log('📝 User Profile:');
    if (profile) {
      console.log('   Email:', profile.email);
      console.log('   Name:', profile.full_name || profile.display_name);
      console.log('   Is Super Admin:', profile.is_super_admin || false);
    } else {
      console.log('   ❌ No profile found');
    }

    // Check if is_super_admin column exists
    const { data: columns } = await supabase.rpc('get_table_columns', {
      table_name: 'user_profiles'
    }).single().catch(() => ({ data: null }));

    if (!columns) {
      console.log('\n⚠️  Cannot check table structure directly');
      console.log('   Attempting to update is_super_admin field...');
    }

    // Set super_admin status
    console.log('\n🔧 Setting super_admin status...');
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ is_super_admin: true })
      .eq('id', userId);

    if (updateError) {
      if (updateError.message.includes('column') && updateError.message.includes('does not exist')) {
        console.log('   ❌ Column is_super_admin does not exist');
        console.log('\n📋 Creating migration to add is_super_admin column...');

        // Create the SQL to add the column
        const migrationSQL = `
-- Add is_super_admin column to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT false;

-- Set pedro@blipee.com as super_admin
UPDATE user_profiles
SET is_super_admin = true
WHERE id = '${userId}';

-- Create or replace the is_super_admin function
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_super_admin() TO authenticated;
`;

        console.log('\n⚠️  Please run this SQL in Supabase dashboard:');
        console.log('=====================================');
        console.log(migrationSQL);
        console.log('=====================================');
      } else {
        console.log('   ❌ Update error:', updateError.message);
      }
    } else {
      console.log('   ✅ Super admin status set successfully');
    }

    // Try to check the function
    const { data: isSuperAdmin, error: funcError } = await supabase
      .rpc('is_super_admin', { user_id: userId })
      .single()
      .catch(() => ({ data: null, error: 'Function does not exist' }));

    console.log('\n🔍 Function Check:');
    if (funcError) {
      console.log('   ❌ is_super_admin function not found or error');
    } else {
      console.log('   ✅ is_super_admin function returns:', isSuperAdmin);
    }

    console.log('\n📋 Summary:');
    console.log('   User: pedro@blipee.com');
    console.log('   ID: ' + userId);
    console.log('   This user should have full super_admin privileges');
    console.log('   Can bypass all organization restrictions');
    console.log('   Has access to all admin features');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

verifySuperAdmin();