require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testMetricsConfiguration() {
  console.log('🔍 Testing Metrics Configuration\n');
  console.log('=' .repeat(80));

  const pedroId = 'd5708d9c-34fb-4c85-90ec-34faad9e2896';

  try {
    // 1. Check sites table
    console.log('\n📋 Checking sites table...');
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('*')
      .limit(5);

    if (sitesError) {
      console.log('❌ Error fetching sites:', sitesError.message);
    } else {
      console.log('✅ Found', sites?.length || 0, 'sites');
      if (sites && sites.length > 0) {
        sites.forEach(site => {
          console.log(`   - ${site.name} (ID: ${site.id}, Org: ${site.organization_id})`);
        });
      }
    }

    // 2. Check organization_metrics table
    console.log('\n📋 Checking organization_metrics table...');
    const { data: orgMetrics, error: orgMetricsError } = await supabase
      .from('organization_metrics')
      .select('*')
      .limit(5);

    if (orgMetricsError) {
      console.log('❌ Error fetching organization_metrics:', orgMetricsError.message);
    } else {
      console.log('✅ Found', orgMetrics?.length || 0, 'organization metrics');
      if (orgMetrics && orgMetrics.length > 0) {
        orgMetrics.forEach(metric => {
          console.log(`   - Metric: ${metric.metric_id}, Org: ${metric.organization_id}`);
        });
      }
    }

    // 3. Check site_metrics table
    console.log('\n📋 Checking site_metrics table...');
    const { data: siteMetrics, error: siteMetricsError } = await supabase
      .from('site_metrics')
      .select('*')
      .limit(5);

    if (siteMetricsError) {
      console.log('❌ Error fetching site_metrics:', siteMetricsError.message);
    } else {
      console.log('✅ Found', siteMetrics?.length || 0, 'site metrics');
      if (siteMetrics && siteMetrics.length > 0) {
        siteMetrics.forEach(metric => {
          console.log(`   - Site: ${metric.site_id}, Metric: ${metric.metric_id}`);
        });
      }
    }

    // 4. Check metrics_catalog table
    console.log('\n📋 Checking metrics_catalog table...');
    const { data: catalog, error: catalogError } = await supabase
      .from('metrics_catalog')
      .select('*')
      .limit(5);

    if (catalogError) {
      console.log('❌ Error fetching metrics_catalog:', catalogError.message);
    } else {
      console.log('✅ Found', catalog?.length || 0, 'catalog items');
      if (catalog && catalog.length > 0) {
        catalog.forEach(item => {
          console.log(`   - ${item.name} (${item.code}, Scope: ${item.scope})`);
        });
      }
    }

    // 5. Check user_access table for Pedro
    console.log('\n📋 Checking user_access for Pedro...');
    const { data: userAccess, error: accessError } = await supabase
      .from('user_access')
      .select('*')
      .eq('user_id', pedroId);

    if (accessError) {
      console.log('❌ Error fetching user_access:', accessError.message);
    } else {
      console.log('✅ Found', userAccess?.length || 0, 'access records for Pedro');
      if (userAccess && userAccess.length > 0) {
        userAccess.forEach(access => {
          console.log(`   - Type: ${access.resource_type}, ID: ${access.resource_id}, Role: ${access.role}`);
        });
      }
    }

    // 6. Test the full query from the API
    console.log('\n📋 Testing full site_metrics query with joins...');
    const { data: fullQuery, error: fullQueryError } = await supabase
      .from('site_metrics')
      .select(`
        *,
        metrics_catalog (
          id, name, code, description, unit, scope, category,
          emission_factor, emission_factor_unit, emission_factor_source
        ),
        sites (
          id, name
        )
      `)
      .eq('is_active', true)
      .limit(5);

    if (fullQueryError) {
      console.log('❌ Full query error:', fullQueryError.message);
    } else {
      console.log('✅ Full query successful, returned', fullQuery?.length || 0, 'results');
    }

    // 7. Get PLMJ organization
    console.log('\n📋 Finding PLMJ organization...');
    const { data: plmj, error: plmjError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'PLMJ')
      .single();

    if (plmjError) {
      console.log('❌ Error finding PLMJ:', plmjError.message);
    } else {
      console.log('✅ PLMJ organization found:');
      console.log('   ID:', plmj.id);
      console.log('   Name:', plmj.name);
    }

    // Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 SUMMARY:');
    console.log('=' .repeat(80));

    console.log('\nProbable Issues:');
    console.log('1. Check if site_metrics table exists and has data');
    console.log('2. Check if organization_metrics table has data');
    console.log('3. Verify metrics_catalog is populated');
    console.log('4. Ensure sites are linked to organizations');
    console.log('5. Verify user_access table has correct permissions');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testMetricsConfiguration();