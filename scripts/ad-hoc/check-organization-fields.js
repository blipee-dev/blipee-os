const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkOrganizationStructure() {
  console.log('🔍 Checking organization structure for jose.pinto@plmj.pt\n');

  try {
    // 1. Get the user profile with all fields
    console.log('📋 User Profile:');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', 'jose.pinto@plmj.pt')
      .single();

    if (profileError) {
      console.error('   Error:', profileError.message);
      return;
    }

    console.log('   ID:', profile.id);
    console.log('   Email:', profile.email);
    console.log('   Full Name:', profile.full_name);

    // Check for organization-related fields
    const orgFields = ['organization_id', 'org_id', 'company_id', 'tenant_id', 'account_id'];
    console.log('\n🏢 Checking for organization fields in user_profiles:');

    for (const field of orgFields) {
      if (profile[field] !== undefined) {
        console.log(`   ✅ Found ${field}:`, profile[field]);
      }
    }

    // 2. Check user_organizations table (many-to-many relationship)
    console.log('\n🔗 Checking user_organizations table:');
    const { data: userOrgs, error: userOrgsError } = await supabase
      .from('user_organizations')
      .select('*')
      .eq('user_id', profile.id);

    if (userOrgsError) {
      if (userOrgsError.message.includes('relation') && userOrgsError.message.includes('does not exist')) {
        console.log('   ℹ️  user_organizations table does not exist');
      } else {
        console.log('   Error:', userOrgsError.message);
      }
    } else if (userOrgs && userOrgs.length > 0) {
      console.log('   ✅ Found user organizations:', JSON.stringify(userOrgs, null, 2));
    } else {
      console.log('   ❌ No organizations linked to this user');
    }

    // 3. Check organization_members table (another common pattern)
    console.log('\n👥 Checking organization_members table:');
    const { data: orgMembers, error: orgMembersError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', profile.id);

    if (orgMembersError) {
      if (orgMembersError.message.includes('relation') && orgMembersError.message.includes('does not exist')) {
        console.log('   ℹ️  organization_members table does not exist');
      } else {
        console.log('   Error:', orgMembersError.message);
      }
    } else if (orgMembers && orgMembers.length > 0) {
      console.log('   ✅ Found memberships:', JSON.stringify(orgMembers, null, 2));
    } else {
      console.log('   ❌ No organization memberships found');
    }

    // 4. Check organizations table structure
    console.log('\n🏢 Checking organizations table:');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);

    if (orgsError) {
      if (orgsError.message.includes('relation') && orgsError.message.includes('does not exist')) {
        console.log('   ℹ️  organizations table does not exist');
      } else {
        console.log('   Checking columns available...');
        // Try with just basic fields
        const { data: orgsBasic, error: orgsBasicError } = await supabase
          .from('organizations')
          .select('id, name')
          .or('name.ilike.%plmj%')
          .limit(5);

        if (!orgsBasicError && orgsBasic) {
          console.log('   ✅ Organizations table exists with columns: id, name');
          if (orgsBasic.length > 0) {
            console.log('   Found organizations:');
            orgsBasic.forEach(org => {
              console.log(`      - ${org.name} (ID: ${org.id})`);
            });
          }
        } else {
          console.log('   Error with basic query:', orgsBasicError?.message);
        }
      }
    } else if (orgs && orgs.length > 0) {
      console.log('   ✅ Organizations table structure:');
      console.log('   Columns:', Object.keys(orgs[0]).join(', '));
    }

    // 5. Look for PLMJ organization
    console.log('\n🔎 Searching for PLMJ organization:');
    const { data: plmjOrg, error: plmjError } = await supabase
      .from('organizations')
      .select('*')
      .or('name.ilike.%plmj%')
      .single();

    if (plmjError) {
      if (plmjError.code === 'PGRST116') {
        console.log('   ❌ No PLMJ organization found');

        // Check if user is the owner and should create the organization
        console.log('\n   💡 User jose.pinto@plmj.pt appears to be an organization owner.');
        console.log('   Need to create PLMJ organization and link it to this user.');
      } else {
        console.log('   Error:', plmjError.message);
      }
    } else if (plmjOrg) {
      console.log('   ✅ Found PLMJ organization:', JSON.stringify(plmjOrg, null, 2));
    }

    // 6. Check for any existing link between user and organizations
    console.log('\n🔗 Checking for existing user-organization links:');

    // Try profiles_organizations view/table
    const { data: profileOrgs, error: profileOrgsError } = await supabase
      .from('profiles_organizations')
      .select('*')
      .eq('profile_id', profile.id);

    if (!profileOrgsError && profileOrgs) {
      console.log('   ✅ Found in profiles_organizations:', profileOrgs);
    }

    // Try member_organizations view/table
    const { data: memberOrgs, error: memberOrgsError } = await supabase
      .from('member_organizations')
      .select('*')
      .eq('member_id', profile.id);

    if (!memberOrgsError && memberOrgs) {
      console.log('   ✅ Found in member_organizations:', memberOrgs);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkOrganizationStructure().catch(console.error);