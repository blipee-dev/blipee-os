require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAccountOwnerAccess() {
  console.log('🔧 Fixing Account Owner Access\n');
  console.log('=' .repeat(80));

  try {
    // Get all organization_members records
    const { data: orgMembers, error: membersError } = await supabase
      .from('organization_members')
      .select('*');

    if (membersError) {
      console.error('❌ Error fetching organization_members:', membersError);
      return;
    }

    console.log(`Found ${orgMembers?.length || 0} organization member records\n`);

    let fixedCount = 0;
    let skippedCount = 0;

    for (const member of orgMembers || []) {
      console.log(`\nChecking member: ${member.user_id}`);
      console.log(`  Organization: ${member.organization_id}`);
      console.log(`  Role: ${member.role}`);

      // Check if user_access record already exists
      const { data: existingAccess } = await supabase
        .from('user_access')
        .select('*')
        .eq('user_id', member.user_id)
        .eq('resource_type', 'organization')
        .eq('resource_id', member.organization_id)
        .maybeSingle();

      if (existingAccess) {
        console.log('  ✓ User access record already exists');
        skippedCount++;
      } else {
        // Create user_access record
        console.log('  ⚠️  No user access record found - creating...');

        // Map organization_members roles to user_access roles
        let accessRole = 'member'; // default
        if (member.role === 'account_owner' || member.role === 'owner') {
          accessRole = 'owner';
        } else if (member.role === 'viewer' || member.role === 'analyst') {
          accessRole = 'viewer';
        } else if (member.role === 'member' || member.role === 'sustainability_manager' || member.role === 'facility_manager') {
          accessRole = 'member';
        }

        console.log(`  Mapping role: ${member.role} -> ${accessRole}`);

        const { data: newAccess, error: insertError } = await supabase
          .from('user_access')
          .insert({
            user_id: member.user_id,
            resource_type: 'organization',
            resource_id: member.organization_id,
            role: accessRole,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error(`  ❌ Error creating user_access:`, insertError.message);
        } else {
          console.log(`  ✅ Created user_access record with ID: ${newAccess.id}`);
          fixedCount++;
        }
      }
    }

    // Now specifically check jose.pinto@plmj.pt
    console.log('\n' + '=' .repeat(80));
    console.log('\n📋 Verifying jose.pinto@plmj.pt access:');

    const joseId = 'e1c83a34-424d-4114-94c5-1a11942dcdea';
    const plmjId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

    const { data: joseAccess } = await supabase
      .from('user_access')
      .select('*')
      .eq('user_id', joseId);

    console.log(`  User access records: ${joseAccess?.length || 0}`);
    if (joseAccess && joseAccess.length > 0) {
      joseAccess.forEach(a => {
        console.log(`    - ${a.resource_type}: ${a.resource_id} (role: ${a.role})`);
      });
    }

    // Check if jose can now see sites
    const { data: plmjSites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('organization_id', plmjId);

    console.log(`\n  Sites in PLMJ organization: ${plmjSites?.length || 0}`);
    if (plmjSites && plmjSites.length > 0) {
      plmjSites.forEach(s => {
        console.log(`    - ${s.name} (${s.id})`);
      });
    }

    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 Summary:');
    console.log(`  Fixed: ${fixedCount} missing user_access records`);
    console.log(`  Skipped: ${skippedCount} existing records`);
    console.log(`  Total: ${(fixedCount + skippedCount)} organization members processed`);

    if (fixedCount > 0) {
      console.log('\n✅ Successfully fixed missing user_access records!');
      console.log('   Account owners should now be able to see their sites.');
    } else {
      console.log('\n✅ All organization members already have user_access records.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixAccountOwnerAccess();