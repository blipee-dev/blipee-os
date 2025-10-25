const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('\n📝 Please ensure these are set in your .env.local file');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixUserOrganization() {
  console.log('🔧 Fixing organization for jose.pinto@plmj.pt\n');

  try {
    // Step 1: First check if user exists in public.users table by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, organization_id')
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (userError) {
      if (userError.code === 'PGRST116') {
        // User doesn't exist in public.users, we need their auth ID first
        console.log('❌ User not found in public.users table');
        console.log('   This user needs to be created in the users table.');
        console.log('   Please run the SQL script fix-jose-pinto-organization.sql directly in Supabase dashboard.');
        return;
      } else {
        console.error('❌ Error checking user:', userError.message);
        return;
      }
    } else if (!userData.organization_id) {
      // User exists but has no organization
      console.log('⚠️  User exists but has no organization_id');

      // Find or create an organization
      const { data: org, error: orgError } = await findOrCreateOrganization();
      if (orgError) {
        console.error('❌ Failed to get organization:', orgError.message);
        return;
      }

      // Update user with organization
      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_id: org.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error('❌ Failed to update user:', updateError.message);
        return;
      }

      console.log('✅ Updated user with organization:', org.name);
    } else {
      console.log('✅ User already has organization_id:', userData.organization_id);

      // Get organization details
      const { data: org } = await supabase
        .from('organizations')
        .select('name, display_name')
        .eq('id', userData.organization_id)
        .single();

      if (org) {
        console.log('   Organization:', org.display_name || org.name);
      }
    }

    // Step 3: Verify the fix
    console.log('\n🔍 Verifying the fix...');

    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        organization_id,
        role,
        organizations (
          id,
          name,
          display_name
        )
      `)
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (finalError) {
      console.error('❌ Verification failed:', finalError.message);
      return;
    }

    console.log('\n✅ SUCCESS! User configuration:');
    console.log('   Email:', finalUser.email);
    console.log('   Organization ID:', finalUser.organization_id);
    console.log('   Organization Name:', finalUser.organizations?.display_name || finalUser.organizations?.name);
    console.log('   Role:', finalUser.role);

    console.log('\n🎉 The APIs should now work correctly!');
    console.log('   Please refresh the browser and try again.');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

async function findOrCreateOrganization() {
  // First, check if PLMJ organization exists
  let { data: org, error } = await supabase
    .from('organizations')
    .select('id, name, display_name')
    .or('name.eq.PLMJ,name.ilike.%PLMJ%')
    .limit(1)
    .single();

  if (error && error.code === 'PGRST116') {
    // Organization doesn't exist, create it
    console.log('📝 Creating PLMJ organization...');

    const { data: newOrg, error: createError } = await supabase
      .from('organizations')
      .insert({
        name: 'PLMJ',
        display_name: 'PLMJ - Sociedade de Advogados',
        slug: 'plmj',
        industry: 'Legal Services',
        country: 'Portugal',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      return { data: null, error: createError };
    }

    return { data: newOrg, error: null };
  } else if (error) {
    return { data: null, error };
  }

  console.log('✅ Found existing organization:', org.display_name || org.name);
  return { data: org, error: null };
}

// Run the fix
fixUserOrganization().catch(console.error);