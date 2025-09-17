require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  try {
    // Check jose.pinto@plmj.pt
    const { data: user, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    if (user) {
      console.log('\n=== User Details ===');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Status:', user.status);
      console.log('Organization ID:', user.organization_id);
      console.log('Auth User ID:', user.auth_user_id);
      console.log('Permissions:', user.permissions);

      // Check if super admin
      if (user.auth_user_id) {
        const { data: superAdmin } = await supabase
          .from('super_admins')
          .select('*')
          .eq('user_id', user.auth_user_id)
          .single();

        console.log('\nIs Super Admin:', !!superAdmin);
      }

      // Get organization details
      if (user.organization_id) {
        const { data: org } = await supabase
          .from('organizations')
          .select('name, slug')
          .eq('id', user.organization_id)
          .single();

        if (org) {
          console.log('\n=== Organization ===');
          console.log('Name:', org.name);
          console.log('Slug:', org.slug);
        }
      }
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUser();