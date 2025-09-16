require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkPLMJOrganizations() {
  console.log('🔍 Checking PLMJ Organizations\n');
  console.log('=' .repeat(80));

  try {
    // 1. Find all PLMJ organizations
    console.log('\n📋 Finding all PLMJ organizations...');
    const { data: plmjOrgs, error: plmjError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'PLMJ');

    if (plmjError) {
      console.log('❌ Error:', plmjError.message);
    } else {
      console.log('✅ Found', plmjOrgs?.length || 0, 'PLMJ organizations:');
      if (plmjOrgs) {
        plmjOrgs.forEach((org, index) => {
          console.log(`\n   [${index + 1}] PLMJ Organization:`);
          console.log(`   ID: ${org.id}`);
          console.log(`   Created: ${org.created_at}`);
          console.log(`   Slug: ${org.slug || 'none'}`);
        });

        // Get the most recent one
        const mostRecent = plmjOrgs.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        console.log('\n   📌 Most recent PLMJ org ID:', mostRecent.id);

        // Check which one has sites
        console.log('\n📋 Checking which PLMJ org has sites...');
        for (const org of plmjOrgs) {
          const { data: sites, error: sitesError } = await supabase
            .from('sites')
            .select('id, name')
            .eq('organization_id', org.id);

          if (!sitesError) {
            console.log(`   Org ${org.id}: ${sites?.length || 0} sites`);
            if (sites && sites.length > 0) {
              sites.forEach(site => {
                console.log(`      - ${site.name}`);
              });
            }
          }
        }

        // Check which one has metrics
        console.log('\n📋 Checking which PLMJ org has metrics...');
        for (const org of plmjOrgs) {
          const { data: metrics } = await supabase
            .from('organization_metrics')
            .select('id')
            .eq('organization_id', org.id);

          console.log(`   Org ${org.id}: ${metrics?.length || 0} organization metrics`);

          const { data: siteMetrics } = await supabase
            .from('site_metrics')
            .select('id')
            .eq('organization_id', org.id);

          console.log(`   Org ${org.id}: ${siteMetrics?.length || 0} site metrics`);
        }
      }
    }

    // 2. Check Pedro's access
    console.log('\n📋 Checking Pedro\'s organization access...');
    const { data: pedroAccess, error: accessError } = await supabase
      .from('user_access')
      .select('*')
      .eq('user_id', 'd5708d9c-34fb-4c85-90ec-34faad9e2896')
      .eq('resource_type', 'organization');

    if (accessError) {
      console.log('❌ Error:', accessError.message);
    } else if (pedroAccess && pedroAccess.length > 0) {
      console.log('✅ Pedro has access to:');
      pedroAccess.forEach(access => {
        console.log(`   - Org ID: ${access.resource_id}, Role: ${access.role}`);
      });
    } else {
      console.log('⚠️  Pedro has no organization access in user_access table');
    }

    // 3. Recommendation
    console.log('\n' + '=' .repeat(80));
    console.log('📊 RECOMMENDATION:');
    console.log('=' .repeat(80));
    console.log('\nThe issue is that there are multiple PLMJ organizations.');
    console.log('The API is trying to use .single() which fails with multiple rows.');
    console.log('\nSolution: Update the API to use the PLMJ org that has sites and metrics');
    console.log('Or clean up duplicate PLMJ organizations in the database.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPLMJOrganizations();