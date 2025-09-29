import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserOrganization() {
  console.log('🔧 Fixing User Organization Assignment\n');

  // Get the user
  const { data: userData } = await supabase.auth.admin.listUsers();
  const user = userData?.users.find(u => u.email === 'jose.pinto@plmj.pt');

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:', user.email, '(ID:', user.id, ')');

  // Get PLMJ organization
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'plmj')
    .single();

  if (!org) {
    console.log('❌ PLMJ organization not found');
    return;
  }

  console.log('✅ PLMJ organization found:', org.name, '(ID:', org.id, ')');

  // Check if user exists in app_users
  const { data: existingAppUser } = await supabase
    .from('app_users')
    .select('id, organization_id, role')
    .eq('id', user.id)
    .single();

  if (existingAppUser) {
    console.log('\n📋 Current app_user record:');
    console.log('  - Organization ID:', existingAppUser.organization_id || 'NULL');
    console.log('  - Role:', existingAppUser.role || 'NULL');

    // Update the organization_id
    const { error: updateError } = await supabase
      .from('app_users')
      .update({
        organization_id: org.id,
        role: existingAppUser.role || 'sustainability_manager',
        name: 'José Pinto',
        email: user.email
      })
      .eq('id', user.id);

    if (updateError) {
      console.log('❌ Error updating app_user:', updateError);
    } else {
      console.log('\n✅ Successfully updated app_user with PLMJ organization!');
    }
  } else {
    console.log('\n⚠️ User not found in app_users table, creating...');

    // Insert new app_user record
    const { error: insertError } = await supabase
      .from('app_users')
      .insert({
        id: user.id,
        organization_id: org.id,
        role: 'sustainability_manager',
        name: 'José Pinto',
        email: user.email
      });

    if (insertError) {
      console.log('❌ Error creating app_user:', insertError);
    } else {
      console.log('\n✅ Successfully created app_user with PLMJ organization!');
    }
  }

  // Verify the fix
  const { data: verifyUser } = await supabase
    .from('app_users')
    .select('id, organization_id, role, name')
    .eq('id', user.id)
    .single();

  console.log('\n📊 Verification:');
  console.log('  - User:', verifyUser?.name);
  console.log('  - Organization ID:', verifyUser?.organization_id);
  console.log('  - Role:', verifyUser?.role);

  // Check organization data
  if (verifyUser?.organization_id) {
    const { data: sites } = await supabase
      .from('sites')
      .select('name')
      .eq('organization_id', verifyUser.organization_id);

    const { data: teamMembers } = await supabase
      .from('app_users')
      .select('name')
      .eq('organization_id', verifyUser.organization_id);

    const { data: metrics } = await supabase
      .from('metrics_data')
      .select('id')
      .eq('organization_id', verifyUser.organization_id)
      .limit(5);

    console.log('\n📈 Organization Stats:');
    console.log('  - Sites:', sites?.length || 0);
    console.log('  - Team Members:', teamMembers?.length || 0);
    console.log('  - Metrics Data Points:', metrics?.length || 0);
  }

  console.log('\n✅ Fix complete! Please refresh the Zero-Typing page.');
}

fixUserOrganization().catch(console.error);