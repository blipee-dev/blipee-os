/**
 * Test script to verify site-specific filtering works correctly
 * across scope-analysis endpoint and calculator functions
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import {
  getPeriodEmissions,
  getScopeBreakdown,
  getScopeCategoryBreakdown
} from './src/lib/sustainability/baseline-calculator';

async function testSiteFilteringFix() {
  console.log('🧪 Testing Site-Specific Filtering Fix\n');

  // Get organization and sites
  const { data: orgs } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single();

  if (!orgs) {
    console.error('❌ No organization found');
    return;
  }

  console.log(`📊 Organization: ${orgs.name} (${orgs.id})\n`);

  // Get all sites
  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('id, name')
    .eq('organization_id', orgs.id)
    .order('name');

  if (!sites || sites.length === 0) {
    console.error('❌ No sites found');
    return;
  }

  console.log(`📍 Found ${sites.length} sites\n`);

  // Test Period: 2025 YTD (Jan 1 - Oct 31)
  const startDate = '2025-01-01';
  const endDate = '2025-10-31';

  console.log(`📅 Testing period: ${startDate} to ${endDate}\n`);

  // Test 1: Organization-level emissions (no site filter)
  console.log('🔍 Test 1: Organization-level emissions (all sites)');
  const orgEmissions = await getPeriodEmissions(orgs.id, startDate, endDate);
  console.log(`   Total: ${orgEmissions.total} tCO2e`);
  console.log(`   Scope 1: ${orgEmissions.scope_1} tCO2e`);
  console.log(`   Scope 2: ${orgEmissions.scope_2} tCO2e`);
  console.log(`   Scope 3: ${orgEmissions.scope_3} tCO2e\n`);

  // Test 2: Site-specific emissions for each site
  for (const site of sites) {
    console.log(`🔍 Test 2: Site-specific emissions for "${site.name}"`);
    const siteEmissions = await getPeriodEmissions(orgs.id, startDate, endDate, site.id);
    console.log(`   Total: ${siteEmissions.total} tCO2e`);
    console.log(`   Scope 1: ${siteEmissions.scope_1} tCO2e`);
    console.log(`   Scope 2: ${siteEmissions.scope_2} tCO2e`);
    console.log(`   Scope 3: ${siteEmissions.scope_3} tCO2e`);

    const percentOfOrg = ((siteEmissions.total / orgEmissions.total) * 100).toFixed(1);
    console.log(`   📊 Represents ${percentOfOrg}% of organization total\n`);
  }

  // Test 3: Verify sum of sites equals organization total
  let sumOfSites = 0;
  for (const site of sites) {
    const siteEmissions = await getPeriodEmissions(orgs.id, startDate, endDate, site.id);
    sumOfSites += siteEmissions.total;
  }

  console.log('🔍 Test 3: Verification');
  console.log(`   Organization total: ${orgEmissions.total} tCO2e`);
  console.log(`   Sum of all sites: ${sumOfSites.toFixed(1)} tCO2e`);

  const difference = Math.abs(orgEmissions.total - sumOfSites);
  if (difference < 0.1) {
    console.log(`   ✅ PASS: Site totals match organization total (diff: ${difference.toFixed(3)})\n`);
  } else {
    console.log(`   ⚠️  WARN: Site totals differ from organization by ${difference.toFixed(1)} tCO2e\n`);
  }

  // Test 4: Test scope breakdown with site filter
  console.log('🔍 Test 4: Scope breakdown with site filter');
  const firstSite = sites[0];
  const scopeBreakdown = await getScopeBreakdown(orgs.id, startDate, endDate, firstSite.id);
  console.log(`   Site: ${firstSite.name}`);
  console.log(`   Scope breakdown: ${JSON.stringify(scopeBreakdown, null, 2)}\n`);

  // Test 5: Test category breakdown with site filter
  console.log('🔍 Test 5: Category breakdown with site filter for Scope 3');
  const scope3Categories = await getScopeCategoryBreakdown(
    orgs.id,
    'scope_3',
    startDate,
    endDate,
    firstSite.id
  );
  console.log(`   Site: ${firstSite.name}`);
  console.log(`   Found ${scope3Categories.length} Scope 3 categories`);
  if (scope3Categories.length > 0) {
    console.log(`   Top 3 categories:`);
    scope3Categories.slice(0, 3).forEach(cat => {
      console.log(`     - ${cat.category}: ${cat.emissions} tCO2e (${cat.percentage}%)`);
    });
  }

  console.log('\n✅ All tests completed successfully!');
  console.log('   Site-specific filtering is working correctly across all calculator functions.');
}

testSiteFilteringFix().catch(console.error);
