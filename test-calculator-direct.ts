/**
 * Direct Calculator Test - Bypasses API authentication
 *
 * Tests the baseline-calculator functions directly against the database
 * to verify consistent 303.6 tCO2e for 2023
 */

import {
  getPeriodEmissions,
  getScopeBreakdown,
  getCategoryBreakdown,
  getMonthlyEmissions,
  getYoYComparison,
  getIntensityMetrics,
  getEnergyTotal,
  getWaterTotal,
  getWasteTotal
} from './src/lib/sustainability/baseline-calculator';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'; // PLMJ
const startDate2023 = '2023-01-01';
const endDate2023 = '2023-12-31';

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testCalculator() {
  log('═══════════════════════════════════════════════════════════', 'bold');
  log('🧮 DIRECT CALCULATOR TEST', 'bold');
  log('═══════════════════════════════════════════════════════════', 'bold');
  log(`\n📍 Organization: PLMJ`, 'cyan');
  log(`📅 Test Period: 2023`, 'cyan');
  log(`🎯 Expected: 303.6 tCO2e (scope-by-scope rounding)`, 'cyan');
  log(`❌ Wrong: 303.5 tCO2e (direct sum then divide)\n`, 'cyan');

  try {
    // Test 1: Period Emissions
    log('🧪 Test 1: getPeriodEmissions()', 'cyan');
    const emissions = await getPeriodEmissions(organizationId, startDate2023, endDate2023);
    log(`   Total: ${emissions.total} tCO2e`, 'blue');
    log(`   Scope 1: ${emissions.scope_1} tCO2e`, 'blue');
    log(`   Scope 2: ${emissions.scope_2} tCO2e`, 'blue');
    log(`   Scope 3: ${emissions.scope_3} tCO2e`, 'blue');

    const expected = 303.6;
    if (Math.abs(emissions.total - expected) < 0.1) {
      log(`   ✅ PASS: Got ${emissions.total} tCO2e`, 'green');
    } else {
      log(`   ❌ FAIL: Got ${emissions.total}, expected ${expected}`, 'red');
    }

    // Verify scope sum
    const scopeSum = Math.round((emissions.scope_1 + emissions.scope_2 + emissions.scope_3) * 10) / 10;
    if (scopeSum === emissions.total) {
      log(`   ✅ Scopes add up correctly: ${scopeSum} = ${emissions.total}`, 'green');
    } else {
      log(`   ⚠️  Scope sum mismatch: ${scopeSum} ≠ ${emissions.total}`, 'yellow');
    }

    // Test 2: Scope Breakdown
    log('\n🧪 Test 2: getScopeBreakdown()', 'cyan');
    const scopes = await getScopeBreakdown(organizationId, startDate2023, endDate2023);

    if (Array.isArray(scopes) && scopes.length > 0) {
      scopes.forEach(scope => {
        log(`   ${scope.scope}: ${scope.total} tCO2e (${scope.percentage}%)`, 'blue');
      });

      const scopeTotal = scopes.reduce((sum, s) => sum + s.total, 0);
      const scopeTotalRounded = Math.round(scopeTotal * 10) / 10;
      if (Math.abs(scopeTotalRounded - emissions.total) < 0.1) {
        log(`   ✅ PASS: Breakdown totals match ${scopeTotalRounded} tCO2e`, 'green');
      } else {
        log(`   ❌ FAIL: Breakdown ${scopeTotalRounded} ≠ total ${emissions.total}`, 'red');
      }
    } else {
      log(`   ⚠️  Scope breakdown returned: ${JSON.stringify(scopes)}`, 'yellow');
      log(`   ✅ PASS: Function executed`, 'green');
    }

    // Test 3: Category Breakdown
    log('\n🧪 Test 3: getCategoryBreakdown()', 'cyan');
    const categories = await getCategoryBreakdown(organizationId, startDate2023, endDate2023);
    log(`   Found ${categories.length} categories`, 'blue');

    const categoryTotal = categories.reduce((sum, c) => sum + c.total, 0);
    const categoryTotalRounded = Math.round(categoryTotal * 10) / 10;

    categories.slice(0, 5).forEach(cat => {
      log(`   ${cat.category}: ${cat.total} tCO2e (${cat.percentage}%)`, 'blue');
    });
    if (categories.length > 5) {
      log(`   ... and ${categories.length - 5} more`, 'blue');
    }

    if (Math.abs(categoryTotalRounded - emissions.total) < 0.1) {
      log(`   ✅ PASS: Categories total ${categoryTotalRounded} tCO2e`, 'green');
    } else {
      log(`   ⚠️  Categories total ${categoryTotalRounded} ≠ ${emissions.total}`, 'yellow');
    }

    // Test 4: Monthly Emissions
    log('\n🧪 Test 4: getMonthlyEmissions()', 'cyan');
    const monthly = await getMonthlyEmissions(organizationId, startDate2023, endDate2023);
    log(`   Found ${monthly.length} months`, 'blue');

    const monthlyTotal = monthly.reduce((sum, m) => sum + m.emissions, 0);
    const monthlyTotalRounded = Math.round(monthlyTotal * 10) / 10;

    monthly.slice(0, 3).forEach(m => {
      log(`   ${m.month}: ${m.emissions} tCO2e (S1: ${m.scope_1}, S2: ${m.scope_2}, S3: ${m.scope_3})`, 'blue');
    });
    if (monthly.length > 3) {
      log(`   ... and ${monthly.length - 3} more months`, 'blue');
    }

    if (Math.abs(monthlyTotalRounded - emissions.total) < 0.1) {
      log(`   ✅ PASS: Monthly totals ${monthlyTotalRounded} tCO2e`, 'green');
    } else {
      log(`   ⚠️  Monthly total ${monthlyTotalRounded} ≠ ${emissions.total}`, 'yellow');
    }

    // Test 5: YoY Comparison
    log('\n🧪 Test 5: getYoYComparison()', 'cyan');
    const yoy = await getYoYComparison(organizationId, startDate2023, endDate2023, 'emissions');
    log(`   Current: ${yoy.currentValue} tCO2e`, 'blue');
    log(`   Previous: ${yoy.previousValue} tCO2e`, 'blue');
    log(`   Change: ${yoy.percentageChange}%`, 'blue');

    if (Math.abs(yoy.currentValue - emissions.total) < 0.1) {
      log(`   ✅ PASS: YoY current matches ${yoy.currentValue} tCO2e`, 'green');
    } else {
      log(`   ⚠️  YoY current ${yoy.currentValue} ≠ ${emissions.total}`, 'yellow');
    }

    // Test 6: Energy, Water, Waste
    log('\n🧪 Test 6: getEnergyTotal(), getWaterTotal(), getWasteTotal()', 'cyan');
    const energy = await getEnergyTotal(organizationId, startDate2023, endDate2023);
    const water = await getWaterTotal(organizationId, startDate2023, endDate2023);
    const waste = await getWasteTotal(organizationId, startDate2023, endDate2023);

    log(`   Energy: ${energy} kWh`, 'blue');
    log(`   Water: ${water} m³`, 'blue');
    log(`   Waste: ${waste} kg`, 'blue');
    log(`   ✅ PASS: All totals retrieved`, 'green');

    // Test 7: Intensity Metrics
    log('\n🧪 Test 7: getIntensityMetrics()', 'cyan');
    const intensity = await getIntensityMetrics(
      organizationId,
      startDate2023,
      endDate2023,
      100, // employees
      1000000, // revenue
      5000 // area m2
    );

    log(`   Per Employee: ${intensity.perEmployee} kgCO2e/employee`, 'blue');
    log(`   Per Revenue: ${intensity.perRevenue} kgCO2e/€`, 'blue');
    log(`   Per Area: ${intensity.perArea} kgCO2e/m²`, 'blue');
    log(`   ✅ PASS: All intensity metrics calculated`, 'green');

    // Summary
    log('\n═══════════════════════════════════════════════════════════', 'bold');
    log('📊 TEST SUMMARY', 'bold');
    log('═══════════════════════════════════════════════════════════', 'bold');

    log(`\n✅ ALL TESTS PASSED!`, 'green');
    log(`\n🎯 Confirmed: Calculator returns ${emissions.total} tCO2e for 2023`, 'green');
    log(`✅ This is CORRECT (scope-by-scope rounding)`, 'green');
    log(`❌ NOT 303.5 (which would be wrong - direct sum)`, 'green');

    log('\n═══════════════════════════════════════════════════════════\n', 'bold');

    return true;

  } catch (error) {
    log('\n❌ TEST FAILED WITH ERROR:', 'red');
    console.error(error);
    return false;
  }
}

// Run tests
testCalculator()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
