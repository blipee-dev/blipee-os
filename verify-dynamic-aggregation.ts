import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verifyDynamicAggregation() {
  console.log('✅ Verifying Dynamic "All Sites" Aggregation\n');
  console.log('='.repeat(80));

  try {
    // Get all sites
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('organization_id', organizationId);

    if (!sites || sites.length === 0) {
      console.log('❌ No sites found');
      return;
    }

    console.log(`\n📍 Found ${sites.length} sites:`);
    sites.forEach(s => console.log(`   - ${s.name} (${s.id})`));

    // Test with a specific metric (Water)
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('id, name, unit')
      .eq('name', 'Water')
      .limit(1);

    if (!metrics || metrics.length === 0) {
      console.log('\n⚠️  Water metric not found, using any available metric');
      return;
    }

    const testMetric = metrics[0];
    console.log(`\n🧪 Test Metric: ${testMetric.name} (${testMetric.unit})`);

    // Test period: January 2025
    const testPeriod = '2025-01-01';

    console.log(`\n📅 Test Period: ${testPeriod}\n`);
    console.log('='.repeat(80));

    // 1. Get data for each individual site
    console.log('\n1️⃣  Individual Site Data:\n');

    let sumOfSites = 0;
    for (const site of sites) {
      const { data: siteData } = await supabase
        .from('metrics_data')
        .select('value')
        .eq('organization_id', organizationId)
        .eq('metric_id', testMetric.id)
        .eq('site_id', site.id)
        .eq('period_start', testPeriod)
        .limit(1);

      const value = siteData && siteData.length > 0 ? parseFloat(siteData[0].value) : 0;
      sumOfSites += value;

      console.log(`   ${site.name}: ${value.toFixed(2)} ${testMetric.unit}`);
    }

    console.log(`\n   📊 Manual Sum: ${sumOfSites.toFixed(2)} ${testMetric.unit}`);

    // 2. Get data WITHOUT site filter (simulates "All Sites" selection)
    console.log(`\n2️⃣  "All Sites" Query (no site_id filter):\n`);

    const { data: allSitesData } = await supabase
      .from('metrics_data')
      .select('value, site_id')
      .eq('organization_id', organizationId)
      .eq('metric_id', testMetric.id)
      .eq('period_start', testPeriod);

    const aggregatedValue = (allSitesData || []).reduce((sum, record) => {
      return sum + parseFloat(record.value);
    }, 0);

    console.log(`   Records returned: ${allSitesData?.length || 0}`);
    console.log(`   Aggregated value: ${aggregatedValue.toFixed(2)} ${testMetric.unit}`);

    // 3. Verify no site_id=null records exist
    const { data: nullSiteData } = await supabase
      .from('metrics_data')
      .select('value')
      .eq('organization_id', organizationId)
      .eq('metric_id', testMetric.id)
      .is('site_id', null)
      .eq('period_start', testPeriod);

    console.log(`\n3️⃣  Pre-Aggregated Records (site_id = null):\n`);
    console.log(`   Records found: ${nullSiteData?.length || 0}`);

    if (nullSiteData && nullSiteData.length > 0) {
      console.log(`   ⚠️  WARNING: Found pre-aggregated records (should be 0)!`);
    } else {
      console.log(`   ✅ No pre-aggregated records (correct!)`);
    }

    // 4. Verification
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION RESULTS:\n');

    const difference = Math.abs(sumOfSites - aggregatedValue);
    const percentDiff = sumOfSites > 0 ? (difference / sumOfSites * 100) : 0;

    console.log(`Manual Sum of Sites: ${sumOfSites.toFixed(2)} ${testMetric.unit}`);
    console.log(`API Aggregation:     ${aggregatedValue.toFixed(2)} ${testMetric.unit}`);
    console.log(`Difference:          ${difference.toFixed(4)} (${percentDiff.toFixed(2)}%)`);

    if (difference < 0.01) {
      console.log(`\n✅ SUCCESS: Dynamic aggregation is working correctly!`);
      console.log(`✅ "All Sites" filter will dynamically sum individual site data`);
      console.log(`✅ No pre-aggregated records to cause double counting`);
    } else {
      console.log(`\n❌ MISMATCH: Aggregation values don't match!`);
    }

    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyDynamicAggregation();
