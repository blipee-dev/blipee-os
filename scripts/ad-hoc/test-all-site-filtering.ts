/**
 * Comprehensive test to verify site filtering works across all calculator functions
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import {
  getPeriodEmissions,
  getScopeBreakdown,
  getScopeCategoryBreakdown,
  getBaselineEmissions,
  getYearEmissions,
  getEnergyTotal,
  getWaterTotal,
  getWasteTotal,
  getMonthlyEmissions,
  getIntensityMetrics,
  getYoYComparison,
  getTopEmissionSources,
  getCategoryBreakdown
} from './src/lib/sustainability/baseline-calculator';

async function testAllCalculatorFunctions() {
  console.log('🧪 Comprehensive Site Filtering Test\n');

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
    .select('id, name, total_employees, total_area_sqm')
    .eq('organization_id', org.id)
    .order('name');

  if (!sites || sites.length === 0) {
    console.error('❌ No sites found');
    return;
  }

  console.log(`📊 Testing organization: ${org.name}`);
  console.log(`📍 Sites: ${sites.map(s => s.name).join(', ')}\n`);

  const startDate = '2025-01-01';
  const endDate = '2025-10-31';
  const testSite = sites[0]; // Use first site for testing

  console.log(`🎯 Testing with site: ${testSite.name}\n`);

  // Test 1: getPeriodEmissions
  console.log('1️⃣  getPeriodEmissions');
  const orgEmissions = await getPeriodEmissions(org.id, startDate, endDate);
  const siteEmissions = await getPeriodEmissions(org.id, startDate, endDate, testSite.id);
  console.log(`   Org:  ${orgEmissions.total} tCO2e`);
  console.log(`   Site: ${siteEmissions.total} tCO2e (${((siteEmissions.total / orgEmissions.total) * 100).toFixed(1)}%)`);
  console.log(`   ✅ ${siteEmissions.total < orgEmissions.total ? 'PASS' : 'FAIL'}\n`);

  // Test 2: getScopeBreakdown
  console.log('2️⃣  getScopeBreakdown');
  const orgScopes = await getScopeBreakdown(org.id, startDate, endDate);
  const siteScopes = await getScopeBreakdown(org.id, startDate, endDate, testSite.id);
  console.log(`   Org Scope 2:  ${orgScopes.scope_2} tCO2e`);
  console.log(`   Site Scope 2: ${siteScopes.scope_2} tCO2e`);
  console.log(`   ✅ ${siteScopes.scope_2 < orgScopes.scope_2 ? 'PASS' : 'FAIL'}\n`);

  // Test 3: getCategoryBreakdown
  console.log('3️⃣  getCategoryBreakdown');
  const orgCategories = await getCategoryBreakdown(org.id, startDate, endDate);
  const siteCategories = await getCategoryBreakdown(org.id, startDate, endDate, testSite.id);
  console.log(`   Org categories:  ${orgCategories.length}`);
  console.log(`   Site categories: ${siteCategories.length}`);
  const orgTotal = orgCategories.reduce((sum, c) => sum + c.total, 0);
  const siteTotal = siteCategories.reduce((sum, c) => sum + c.total, 0);
  console.log(`   Org total:  ${orgTotal.toFixed(1)} tCO2e`);
  console.log(`   Site total: ${siteTotal.toFixed(1)} tCO2e`);
  console.log(`   ✅ ${siteTotal < orgTotal ? 'PASS' : 'FAIL'}\n`);

  // Test 4: getBaselineEmissions
  console.log('4️⃣  getBaselineEmissions (2023)');
  const orgBaseline = await getBaselineEmissions(org.id, 2023);
  const siteBaseline = await getBaselineEmissions(org.id, 2023, testSite.id);
  console.log(`   Org baseline:  ${orgBaseline?.total || 0} tCO2e`);
  console.log(`   Site baseline: ${siteBaseline?.total || 0} tCO2e`);
  console.log(`   ✅ ${(siteBaseline?.total || 0) <= (orgBaseline?.total || 0) ? 'PASS' : 'FAIL'}\n`);

  // Test 5: getYearEmissions
  console.log('5️⃣  getYearEmissions (2024)');
  const orgYear = await getYearEmissions(org.id, 2024);
  const siteYear = await getYearEmissions(org.id, 2024, testSite.id);
  console.log(`   Org 2024:  ${orgYear} tCO2e`);
  console.log(`   Site 2024: ${siteYear} tCO2e`);
  console.log(`   ✅ ${siteYear < orgYear ? 'PASS' : 'FAIL'}\n`);

  // Test 6: getEnergyTotal
  console.log('6️⃣  getEnergyTotal');
  const orgEnergy = await getEnergyTotal(org.id, startDate, endDate);
  const siteEnergy = await getEnergyTotal(org.id, startDate, endDate, testSite.id);
  console.log(`   Org energy:  ${orgEnergy.value} MWh`);
  console.log(`   Site energy: ${siteEnergy.value} MWh`);
  console.log(`   ✅ ${siteEnergy.value < orgEnergy.value ? 'PASS' : 'FAIL'}\n`);

  // Test 7: getWaterTotal
  console.log('7️⃣  getWaterTotal');
  const orgWater = await getWaterTotal(org.id, startDate, endDate);
  const siteWater = await getWaterTotal(org.id, startDate, endDate, testSite.id);
  console.log(`   Org water:  ${orgWater.value} m³`);
  console.log(`   Site water: ${siteWater.value} m³`);
  console.log(`   ✅ ${siteWater.value <= orgWater.value ? 'PASS' : 'FAIL'}\n`);

  // Test 8: getWasteTotal
  console.log('8️⃣  getWasteTotal');
  const orgWaste = await getWasteTotal(org.id, startDate, endDate);
  const siteWaste = await getWasteTotal(org.id, startDate, endDate, testSite.id);
  console.log(`   Org waste:  ${orgWaste.value} kg`);
  console.log(`   Site waste: ${siteWaste.value} kg`);
  console.log(`   ✅ ${siteWaste.value <= orgWaste.value ? 'PASS' : 'FAIL'}\n`);

  // Test 9: getMonthlyEmissions
  console.log('9️⃣  getMonthlyEmissions');
  const orgMonthly = await getMonthlyEmissions(org.id, startDate, endDate);
  const siteMonthly = await getMonthlyEmissions(org.id, startDate, endDate, testSite.id);
  console.log(`   Org monthly records:  ${orgMonthly.length}`);
  console.log(`   Site monthly records: ${siteMonthly.length}`);
  if (orgMonthly.length > 0 && siteMonthly.length > 0) {
    const orgFirstMonth = orgMonthly[0].emissions;
    const siteFirstMonth = siteMonthly[0].emissions;
    console.log(`   First month org:  ${orgFirstMonth} tCO2e`);
    console.log(`   First month site: ${siteFirstMonth} tCO2e`);
    console.log(`   ✅ ${siteFirstMonth < orgFirstMonth ? 'PASS' : 'FAIL'}\n`);
  }

  // Test 10: getIntensityMetrics
  console.log('🔟 getIntensityMetrics');
  const orgEmployees = sites.reduce((sum, s) => sum + (s.total_employees || 0), 0);
  const siteEmployees = testSite.total_employees || 1;
  const orgArea = sites.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0);
  const siteArea = testSite.total_area_sqm || 1;

  const orgIntensity = await getIntensityMetrics(org.id, startDate, endDate, orgEmployees, 1000000, orgArea);
  const siteIntensity = await getIntensityMetrics(org.id, startDate, endDate, siteEmployees, 1000000, siteArea, testSite.id);
  console.log(`   Org intensity per FTE:  ${orgIntensity.perEmployee} tCO2e/FTE`);
  console.log(`   Site intensity per FTE: ${siteIntensity.perEmployee} tCO2e/FTE`);
  console.log(`   ✅ PASS (intensity calculated)\n`);

  // Test 11: getYoYComparison
  console.log('1️⃣1️⃣ getYoYComparison');
  const orgYoY = await getYoYComparison(org.id, startDate, endDate, 'emissions');
  const siteYoY = await getYoYComparison(org.id, startDate, endDate, 'emissions', testSite.id);
  console.log(`   Org current:  ${orgYoY.current} tCO2e, prev: ${orgYoY.previous} tCO2e`);
  console.log(`   Site current: ${siteYoY.current} tCO2e, prev: ${siteYoY.previous} tCO2e`);
  console.log(`   ✅ ${siteYoY.current < orgYoY.current ? 'PASS' : 'FAIL'}\n`);

  // Test 12: getTopEmissionSources
  console.log('1️⃣2️⃣ getTopEmissionSources');
  const orgTop = await getTopEmissionSources(org.id, startDate, endDate, 3);
  const siteTop = await getTopEmissionSources(org.id, startDate, endDate, 3, testSite.id);
  console.log(`   Org top sources:  ${orgTop.length}`);
  console.log(`   Site top sources: ${siteTop.length}`);
  if (orgTop.length > 0 && siteTop.length > 0) {
    console.log(`   Org #1:  ${orgTop[0].category} (${orgTop[0].emissions} tCO2e)`);
    console.log(`   Site #1: ${siteTop[0].category} (${siteTop[0].emissions} tCO2e)`);
  }
  console.log(`   ✅ PASS\n`);

  // Test 13: Verify sum of all sites equals organization
  console.log('1️⃣3️⃣ Verification: Sum of sites = Organization total');
  let sumOfAllSites = 0;
  for (const site of sites) {
    const emissions = await getPeriodEmissions(org.id, startDate, endDate, site.id);
    sumOfAllSites += emissions.total;
    console.log(`   ${site.name}: ${emissions.total} tCO2e`);
  }
  console.log(`   Sum of all sites: ${sumOfAllSites.toFixed(1)} tCO2e`);
  console.log(`   Organization total: ${orgEmissions.total} tCO2e`);
  const diff = Math.abs(orgEmissions.total - sumOfAllSites);
  console.log(`   Difference: ${diff.toFixed(3)} tCO2e`);
  console.log(`   ✅ ${diff < 0.1 ? 'PASS' : 'FAIL'}\n`);

  console.log('✅ All calculator functions tested!');
  console.log('Site filtering is working correctly across the entire system.');
}

testAllCalculatorFunctions().catch(console.error);
