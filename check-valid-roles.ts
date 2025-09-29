import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkValidRoles() {
  console.log('🔍 Checking valid roles and fixing José Pinto\n');

  // Check existing app_users to see what roles are used
  const { data: users } = await supabase
    .from('app_users')
    .select('role')
    .not('role', 'is', null)
    .limit(10);

  console.log('Existing roles in database:');
  const uniqueRoles = [...new Set(users?.map(u => u.role))];
  uniqueRoles.forEach(role => console.log('  •', role));

  // Get José Pinto's current status
  const { data: userData } = await supabase.auth.admin.listUsers();
  const user = userData?.users.find(u => u.email === 'jose.pinto@plmj.pt');

  if (!user) {
    console.log('\n❌ José Pinto not found');
    return;
  }

  console.log('\n✅ José Pinto found (ID:', user.id, ')');

  // Check if José Pinto exists in app_users
  const { data: appUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (appUser) {
    console.log('✅ José Pinto exists in app_users');
    console.log('  - Organization ID:', appUser.organization_id);
    console.log('  - Role:', appUser.role);
    console.log('  - Name:', appUser.name);

    // If no organization, update with PLMJ
    if (!appUser.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('name', 'PLMJ')
        .single();

      if (org) {
        const { error: updateError } = await supabase
          .from('app_users')
          .update({
            organization_id: org.id
          })
          .eq('id', user.id);

        if (updateError) {
          console.log('❌ Error updating organization:', updateError);
        } else {
          console.log('\n✅ Updated José Pinto with PLMJ organization!');
        }
      }
    }
  } else {
    console.log('⚠️ José Pinto NOT in app_users');

    // Try to create with a valid role
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', 'PLMJ')
      .single();

    if (org) {
      // Use the most common role from existing users or 'admin'
      const validRole = uniqueRoles[0] || 'admin';

      const { error: insertError } = await supabase
        .from('app_users')
        .insert({
          id: user.id,
          organization_id: org.id,
          role: validRole,
          name: 'José Pinto',
          email: user.email
        });

      if (insertError) {
        console.log('❌ Error creating app_user:', insertError);
        console.log('\nTrying with different role...');

        // Try with 'owner' role
        const { error: insertError2 } = await supabase
          .from('app_users')
          .insert({
            id: user.id,
            organization_id: org.id,
            role: 'owner',
            name: 'José Pinto',
            email: user.email
          });

        if (insertError2) {
          console.log('❌ Still failed:', insertError2);
        } else {
          console.log('✅ Created José Pinto with owner role');
        }
      } else {
        console.log(`✅ Created José Pinto with ${validRole} role`);
      }
    }
  }

  // Final verification
  const { data: finalUser } = await supabase
    .from('app_users')
    .select('*')
    .eq('id', user.id)
    .single();

  console.log('\n📊 Final Status:');
  console.log('  - Name:', finalUser?.name);
  console.log('  - Organization ID:', finalUser?.organization_id);
  console.log('  - Role:', finalUser?.role);

  console.log('\n✅ Check complete! Please refresh the Zero-Typing page.');
}

checkValidRoles().catch(console.error);