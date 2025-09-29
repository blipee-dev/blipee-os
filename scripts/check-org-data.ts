/**
 * Script to check data for PLMJ organization
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const PLMJ_ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkPLMJData() {
  console.log('🔍 Checking data for PLMJ organization...\n');
  console.log('Organization ID:', PLMJ_ORG_ID);
  console.log('---\n');

  // 1. Check organization details
  console.log('📊 Organization Details:');
  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', PLMJ_ORG_ID)
    .single();

  if (org) {
    console.log({
      name: org.name,
      slug: org.slug,
      industry: org.industry_primary,
      country: org.country,
      created_at: org.created_at
    });
  } else {
    console.log('❌ Organization not found');
    return;
  }

  // 2. Check sites
  console.log('\n🏢 Sites:');
  const { data: sites, count: sitesCount } = await supabase
    .from('sites')
    .select('*', { count: 'exact' })
    .eq('organization_id', PLMJ_ORG_ID);

  console.log(`Found ${sitesCount || 0} sites`);
  sites?.forEach(site => {
    console.log(`  - ${site.name} (${site.city}, ${site.country})`);
  });

  // 3. Check metrics catalog entries
  console.log('\n📋 Metrics Catalog:');
  const { data: catalog, count: catalogCount } = await supabase
    .from('metrics_catalog')
    .select('*', { count: 'exact' })
    .eq('organization_id', PLMJ_ORG_ID);

  console.log(`Found ${catalogCount || 0} organization-specific metrics`);

  // Also check global metrics (no organization_id)
  const { count: globalCount } = await supabase
    .from('metrics_catalog')
    .select('*', { count: 'exact', head: true })
    .is('organization_id', null);

  console.log(`Found ${globalCount || 0} global metrics available`);

  // 4. Check metrics data
  console.log('\n📈 Metrics Data:');
  const { data: metricsData, count: metricsCount } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .eq('organization_id', PLMJ_ORG_ID);

  console.log(`Found ${metricsCount || 0} data points for this organization`);

  if (metricsData && metricsData.length > 0) {
    // Get date range
    const dates = metricsData.map(m => new Date(m.period_start));
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    console.log(`Date range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);

    // Group by metric
    const byMetric = new Map();
    for (const data of metricsData) {
      const metricId = data.metric_id;
      if (!byMetric.has(metricId)) {
        byMetric.set(metricId, 0);
      }
      byMetric.set(metricId, byMetric.get(metricId) + 1);
    }

    console.log(`\nData points by metric:`);
    for (const [metricId, count] of byMetric) {
      // Get metric name
      const { data: metric } = await supabase
        .from('metrics_catalog')
        .select('name, category')
        .eq('id', metricId)
        .single();

      console.log(`  - ${metric?.name || metricId}: ${count} records (${metric?.category})`);
    }
  }

  // 5. Check team members
  console.log('\n👥 Team Members:');
  const { data: members, count: memberCount } = await supabase
    .from('app_users')
    .select('*')
    .eq('organization_id', PLMJ_ORG_ID);

  console.log(`Found ${memberCount || 0} team members`);
  members?.forEach(member => {
    console.log(`  - ${member.name} (${member.email}) - Role: ${member.role}`);
  });

  // 6. Check for alerts
  console.log('\n🚨 Alerts:');
  const { data: alerts, count: alertCount } = await supabase
    .from('alerts')
    .select('*', { count: 'exact' })
    .eq('organization_id', PLMJ_ORG_ID)
    .eq('resolved', false);

  console.log(`Found ${alertCount || 0} active alerts`);
  alerts?.forEach(alert => {
    console.log(`  - [${alert.severity}] ${alert.message}`);
  });

  // 7. Summary for Zero-Typing page
  console.log('\n✨ Summary for Zero-Typing Dashboard:');
  console.log(`This organization will see:`);
  console.log(`  • ${sitesCount || 0} sites to manage`);
  console.log(`  • ${metricsCount || 0} data points for analytics`);
  console.log(`  • ${memberCount || 0} team members`);
  console.log(`  • ${alertCount || 0} active alerts`);
  console.log(`  • Real-time emissions and energy tracking`);
  console.log(`  • AI predictions based on their usage patterns`);
}

// Run the check
checkPLMJData().then(() => {
  console.log('\n✅ Check complete!');
  process.exit(0);
}).catch(err => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});