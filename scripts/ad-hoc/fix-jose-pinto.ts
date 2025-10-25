import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixJosePinto() {
  console.log('🔧 Fixing José Pinto account\n');

  // Get the auth user
  const { data: userData } = await supabase.auth.admin.listUsers();
  const authUser = userData?.users.find(u => u.email === 'jose.pinto@plmj.pt');

  if (!authUser) {
    console.log('❌ Auth user not found');
    return;
  }

  console.log('✅ Auth user found:', authUser.email, '(ID:', authUser.id, ')');

  // Find the app_user by email
  const { data: appUserByEmail } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', 'jose.pinto@plmj.pt')
    .single();

  if (appUserByEmail) {
    console.log('\n✅ Found app_user by email:');
    console.log('  - ID:', appUserByEmail.id);
    console.log('  - Name:', appUserByEmail.name);
    console.log('  - Organization ID:', appUserByEmail.organization_id);
    console.log('  - Role:', appUserByEmail.role);

    // If the IDs don't match, update the app_user ID
    if (appUserByEmail.id !== authUser.id) {
      console.log('\n⚠️ ID mismatch! Updating app_user ID to match auth user...');

      // Delete the mismatched app_user if it exists
      await supabase
        .from('app_users')
        .delete()
        .eq('id', authUser.id);

      // Update the existing app_user with correct ID
      const { error: updateError } = await supabase
        .from('app_users')
        .update({
          id: authUser.id
        })
        .eq('email', 'jose.pinto@plmj.pt');

      if (updateError) {
        console.log('❌ Error updating ID:', updateError);
      } else {
        console.log('✅ Updated app_user ID to match auth user');
      }
    }

    // Get PLMJ organization
    const { data: org } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'PLMJ')
      .single();

    if (org && !appUserByEmail.organization_id) {
      console.log('\n🏢 Assigning to PLMJ organization...');

      const { error: orgError } = await supabase
        .from('app_users')
        .update({
          organization_id: org.id,
          role: appUserByEmail.role || 'owner'
        })
        .eq('email', 'jose.pinto@plmj.pt');

      if (orgError) {
        console.log('❌ Error updating organization:', orgError);
      } else {
        console.log('✅ Assigned to PLMJ organization');
      }
    } else if (org && appUserByEmail.organization_id === org.id) {
      console.log('\n✅ Already assigned to PLMJ organization');
    }
  } else {
    console.log('\n⚠️ No app_user found with this email');
  }

  // Final verification
  const { data: finalUser } = await supabase
    .from('app_users')
    .select('*')
    .or(`id.eq.${authUser.id},email.eq.jose.pinto@plmj.pt`)
    .single();

  console.log('\n📊 Final Status:');
  if (finalUser) {
    console.log('  - ID:', finalUser.id);
    console.log('  - Name:', finalUser.name);
    console.log('  - Email:', finalUser.email);
    console.log('  - Organization ID:', finalUser.organization_id);
    console.log('  - Role:', finalUser.role);

    // Check organization stats
    if (finalUser.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', finalUser.organization_id)
        .single();

      const { count: sitesCount } = await supabase
        .from('sites')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', finalUser.organization_id);

      const { count: metricsCount } = await supabase
        .from('metrics_data')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', finalUser.organization_id);

      console.log('\n📈 Organization:', org?.name);
      console.log('  - Sites:', sitesCount || 0);
      console.log('  - Metrics:', metricsCount || 0);
    }
  } else {
    console.log('  ❌ User not found in app_users');
  }

  console.log('\n✅ Fix complete! Please refresh the Zero-Typing page.');
}

fixJosePinto().catch(console.error);