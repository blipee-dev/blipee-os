require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDuplicatePLMJ() {
  console.log('🧹 Cleaning up duplicate PLMJ organization\n');
  console.log('=' .repeat(80));

  const emptyOrgId = '49b9c871-3296-4c91-b9e7-500dc1cd4017'; // The one with no sites
  const activeOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // The one with sites and metrics

  try {
    // 1. Verify the empty org has no data
    console.log('📋 Verifying organization to delete...');
    console.log('   ID:', emptyOrgId);

    // Check for sites
    const { data: sites } = await supabase
      .from('sites')
      .select('id')
      .eq('organization_id', emptyOrgId);

    console.log('   Sites:', sites?.length || 0);

    // Check for organization_metrics
    const { data: orgMetrics } = await supabase
      .from('organization_metrics')
      .select('id')
      .eq('organization_id', emptyOrgId);

    console.log('   Organization metrics:', orgMetrics?.length || 0);

    // Check for site_metrics
    const { data: siteMetrics } = await supabase
      .from('site_metrics')
      .select('id')
      .eq('organization_id', emptyOrgId);

    console.log('   Site metrics:', siteMetrics?.length || 0);

    // Check for organization_members
    const { data: members } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', emptyOrgId);

    console.log('   Members:', members?.length || 0);

    // Check for emissions_data
    const { data: emissions } = await supabase
      .from('emissions_data')
      .select('id')
      .eq('organization_id', emptyOrgId);

    console.log('   Emissions data:', emissions?.length || 0);

    // Check for user_access
    const { data: userAccess } = await supabase
      .from('user_access')
      .select('id')
      .eq('resource_id', emptyOrgId)
      .eq('resource_type', 'organization');

    console.log('   User access records:', userAccess?.length || 0);

    // 2. Confirm the active org has data
    console.log('\n📋 Confirming active organization...');
    console.log('   ID:', activeOrgId);

    const { data: activeSites } = await supabase
      .from('sites')
      .select('id')
      .eq('organization_id', activeOrgId);

    console.log('   Sites:', activeSites?.length || 0);

    const { data: activeMetrics } = await supabase
      .from('organization_metrics')
      .select('id')
      .eq('organization_id', activeOrgId);

    console.log('   Organization metrics:', activeMetrics?.length || 0);

    // 3. Delete the empty organization
    console.log('\n🗑️  Deleting empty PLMJ organization...');

    // First delete any related records (if they exist)
    if (members && members.length > 0) {
      console.log('   Deleting organization_members...');
      await supabase
        .from('organization_members')
        .delete()
        .eq('organization_id', emptyOrgId);
    }

    if (userAccess && userAccess.length > 0) {
      console.log('   Deleting user_access records...');
      await supabase
        .from('user_access')
        .delete()
        .eq('resource_id', emptyOrgId)
        .eq('resource_type', 'organization');
    }

    // Delete the organization
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', emptyOrgId);

    if (deleteError) {
      console.error('❌ Error deleting organization:', deleteError);
      return;
    }

    console.log('✅ Successfully deleted empty PLMJ organization');

    // 4. Verify cleanup
    console.log('\n📋 Verifying cleanup...');
    const { data: remainingPLMJ } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('name', 'PLMJ');

    console.log('   Remaining PLMJ organizations:', remainingPLMJ?.length || 0);
    if (remainingPLMJ && remainingPLMJ.length > 0) {
      remainingPLMJ.forEach(org => {
        console.log(`   - ${org.name} (${org.id})`);
      });
    }

    console.log('\n✅ Cleanup complete!');
    console.log('   The active PLMJ organization with sites and metrics remains.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupDuplicatePLMJ();