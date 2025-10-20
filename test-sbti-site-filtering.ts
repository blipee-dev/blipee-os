/**
 * Test script to verify SBTi targets show site-specific data
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import {
  getBaselineEmissions,
  getPeriodEmissions
} from './src/lib/sustainability/baseline-calculator';

async function testSBTiSiteFiltering() {
  console.log('🧪 Testing SBTi Target Progress with Site Filtering\n');

  // Get organization and sites
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single();

  if (!org) {
    console.error('❌ No organization found');
    return;
  }

  const { data: sites } = await supabaseAdmin
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id)
    .order('name');

  if (!sites || sites.length === 0) {
    console.error('❌ No sites found');
    return;
  }

  console.log(`📊 Organization: ${org.name}`);
  console.log(`📍 Sites: ${sites.map(s => s.name).join(', ')}\n`);

  // Get SBTi target from database
  const { data: targets } = await supabaseAdmin
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', org.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!targets) {
    console.log('⚠️ No SBTi targets found for this organization');
    return;
  }

  console.log('🎯 SBTi Target Configuration (Organization-level):');
  console.log(`   Target Name: ${targets.name}`);
  console.log(`   Baseline Year: ${targets.baseline_year}`);
  console.log(`   Target Year: ${targets.target_year}`);
  console.log(`   Reduction Target: ${((targets.baseline_value - targets.target_value) / targets.baseline_value * 100).toFixed(1)}%`);
  console.log(`   Baseline Value (DB): ${targets.baseline_value} tCO2e`);
  console.log(`   Target Value: ${targets.target_value} tCO2e\n`);

  // Test 1: Organization-level baseline and current
  console.log('1️⃣  Organization-level Progress (All Sites):');
  const orgBaseline = await getBaselineEmissions(org.id, targets.baseline_year);
  const orgCurrent = await getPeriodEmissions(
    org.id,
    `${new Date().getFullYear()}-01-01`,
    new Date().toISOString().split('T')[0]
  );

  console.log(`   Baseline (${targets.baseline_year}): ${orgBaseline?.total || 0} tCO2e`);
  console.log(`   Current (YTD): ${orgCurrent.total} tCO2e`);
  const orgReduction = orgBaseline?.total ? ((orgBaseline.total - orgCurrent.total) / orgBaseline.total * 100) : 0;
  console.log(`   Reduction: ${orgReduction.toFixed(1)}%`);
  console.log(`   Status: ${orgReduction >= 0 ? '✅ On track' : '❌ Above baseline'}\n`);

  // Test 2: Site-specific baseline and current for each site
  for (const site of sites) {
    console.log(`2️⃣  Site-specific Progress: ${site.name}`);

    const siteBaseline = await getBaselineEmissions(org.id, targets.baseline_year, site.id);
    const siteCurrent = await getPeriodEmissions(
      org.id,
      `${new Date().getFullYear()}-01-01`,
      new Date().toISOString().split('T')[0],
      site.id
    );

    console.log(`   Baseline (${targets.baseline_year}): ${siteBaseline?.total || 0} tCO2e`);
    console.log(`   Current (YTD): ${siteCurrent.total} tCO2e`);

    const siteReduction = siteBaseline?.total
      ? ((siteBaseline.total - siteCurrent.total) / siteBaseline.total * 100)
      : 0;

    console.log(`   Reduction: ${siteReduction.toFixed(1)}%`);

    // Calculate contribution to organization target
    const contributionToOrgBaseline = orgBaseline?.total
      ? ((siteBaseline?.total || 0) / orgBaseline.total * 100)
      : 0;

    console.log(`   Contribution to Org Baseline: ${contributionToOrgBaseline.toFixed(1)}%`);
    console.log(`   Status: ${siteReduction >= 0 ? '✅ Reduced' : '❌ Increased'}\n`);
  }

  // Test 3: Verify sum of sites equals organization
  console.log('3️⃣  Verification: Sum of Sites = Organization');

  let sumBaselineSites = 0;
  let sumCurrentSites = 0;

  for (const site of sites) {
    const siteBaseline = await getBaselineEmissions(org.id, targets.baseline_year, site.id);
    const siteCurrent = await getPeriodEmissions(
      org.id,
      `${new Date().getFullYear()}-01-01`,
      new Date().toISOString().split('T')[0],
      site.id
    );

    sumBaselineSites += siteBaseline?.total || 0;
    sumCurrentSites += siteCurrent.total;
  }

  console.log(`   Organization Baseline: ${orgBaseline?.total || 0} tCO2e`);
  console.log(`   Sum of Sites Baseline: ${sumBaselineSites.toFixed(1)} tCO2e`);
  console.log(`   Difference: ${Math.abs((orgBaseline?.total || 0) - sumBaselineSites).toFixed(3)} tCO2e`);
  console.log(`   ✅ ${Math.abs((orgBaseline?.total || 0) - sumBaselineSites) < 0.1 ? 'PASS' : 'FAIL'}\n`);

  console.log(`   Organization Current: ${orgCurrent.total} tCO2e`);
  console.log(`   Sum of Sites Current: ${sumCurrentSites.toFixed(1)} tCO2e`);
  console.log(`   Difference: ${Math.abs(orgCurrent.total - sumCurrentSites).toFixed(3)} tCO2e`);
  console.log(`   ✅ ${Math.abs(orgCurrent.total - sumCurrentSites) < 0.1 ? 'PASS' : 'FAIL'}\n`);

  // Test 4: Calculate required reduction for current year
  console.log('4️⃣  SBTi Progress Tracking:');

  const baselineYear = targets.baseline_year;
  const targetYear = targets.target_year;
  const currentYear = new Date().getFullYear();

  const yearsElapsed = currentYear - baselineYear;
  const totalYears = targetYear - baselineYear;
  const targetReduction = ((targets.baseline_value - targets.target_value) / targets.baseline_value) * 100;
  const requiredReductionNow = (targetReduction * yearsElapsed) / totalYears;

  console.log(`   Years elapsed: ${yearsElapsed} of ${totalYears}`);
  console.log(`   Required reduction by ${currentYear}: ${requiredReductionNow.toFixed(1)}%`);
  console.log(`   Target reduction by ${targetYear}: ${targetReduction.toFixed(1)}%\n`);

  for (const site of sites) {
    const siteBaseline = await getBaselineEmissions(org.id, targets.baseline_year, site.id);
    const siteCurrent = await getPeriodEmissions(
      org.id,
      `${new Date().getFullYear()}-01-01`,
      new Date().toISOString().split('T')[0],
      site.id
    );

    const siteReduction = siteBaseline?.total
      ? ((siteBaseline.total - siteCurrent.total) / siteBaseline.total * 100)
      : 0;

    const status = siteReduction >= requiredReductionNow
      ? '✅ On track'
      : siteReduction >= 0
        ? '⚠️ Behind schedule'
        : '❌ Above baseline';

    console.log(`   ${site.name}:`);
    console.log(`     Actual reduction: ${siteReduction.toFixed(1)}%`);
    console.log(`     Required: ${requiredReductionNow.toFixed(1)}%`);
    console.log(`     ${status}\n`);
  }

  console.log('✅ SBTi Site Filtering Test Complete!');
  console.log('\n📝 Expected Dashboard Behavior:');
  console.log('   - When "All Sites" selected: Shows organization baseline and current');
  console.log('   - When site selected: Shows site-specific baseline and current');
  console.log('   - Target definition stays organization-level (reduction %, target year)');
  console.log('   - Progress calculation uses site-specific data');
}

testSBTiSiteFiltering().catch(console.error);
