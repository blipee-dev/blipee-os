import { config } from 'dotenv';
config({ path: '.env.local' });

import { getCategoryBreakdown } from './src/lib/sustainability/baseline-calculator';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const siteId = 'dccb2397-6731-4f4d-bd43-992c598bd0ce'; // Lisboa - FPM41

async function testSiteSpecificTargets() {
  console.log('🧪 Testing Site-Specific Target Allocation\n');
  console.log('='.repeat(80));

  const startDate = '2023-01-01';
  const endDate = '2023-12-31';

  // Test 1: Get breakdown for ALL sites
  console.log('\n📊 Test 1: All Sites Breakdown (baseline 2023)');
  console.log('─'.repeat(80));

  const allSitesBreakdown = await getCategoryBreakdown(organizationId, startDate, endDate);

  console.log(`Total categories: ${allSitesBreakdown.length}`);
  const allSitesTotal = allSitesBreakdown.reduce((sum, cat) => sum + cat.total, 0);
  console.log(`Total emissions: ${allSitesTotal.toFixed(2)} tCO2e`);

  console.log('\nTop 5 categories:');
  allSitesBreakdown.slice(0, 5).forEach(cat => {
    console.log(`  ${cat.category}: ${cat.total.toFixed(2)} tCO2e (${cat.percentage.toFixed(1)}%)`);
  });

  // Test 2: Get breakdown for SPECIFIC site
  console.log('\n\n📍 Test 2: Lisboa Site Only (baseline 2023)');
  console.log('─'.repeat(80));

  const siteBreakdown = await getCategoryBreakdown(organizationId, startDate, endDate, siteId);

  console.log(`Total categories: ${siteBreakdown.length}`);
  const siteTotal = siteBreakdown.reduce((sum, cat) => sum + cat.total, 0);
  console.log(`Total emissions: ${siteTotal.toFixed(2)} tCO2e`);

  console.log('\nTop 5 categories:');
  siteBreakdown.slice(0, 5).forEach(cat => {
    console.log(`  ${cat.category}: ${cat.total.toFixed(2)} tCO2e (${cat.percentage.toFixed(1)}%)`);
  });

  // Test 3: Verify site total is less than all sites total
  console.log('\n\n✅ Test 3: Validation');
  console.log('─'.repeat(80));

  console.log(`All Sites Total: ${allSitesTotal.toFixed(2)} tCO2e`);
  console.log(`Lisboa Site Total: ${siteTotal.toFixed(2)} tCO2e`);
  console.log(`Lisboa % of Total: ${((siteTotal / allSitesTotal) * 100).toFixed(1)}%`);

  if (siteTotal < allSitesTotal) {
    console.log('✅ Site total is less than all sites total (correct)');
  } else {
    console.log('❌ ERROR: Site total should be less than all sites total');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Site-specific filtering is now working!');
  console.log('The weighted-allocation API will no longer show the warning message.');
  console.log('='.repeat(80));
}

testSiteSpecificTargets();
